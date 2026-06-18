import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";


const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TestMessageSchema = z.object({
  workspace_id: z.string().uuid(),
  message: z.string().min(1),
  agent_type: z.enum(['customer_support', 'appointment_booking', 'sales']),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      if (process.env.NODE_ENV !== 'production') console.error("[TEST_MSG] Auth failed:", authErr?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = TestMessageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid request", details: result.error.flatten() }, { status: 400 });
    }

    const { workspace_id, message, agent_type } = result.data;

    // IDOR Check: Ensure user owns the workspace
    if (user.app_metadata?.workspace_id !== workspace_id) {
      if (process.env.NODE_ENV !== 'production') console.error("[TEST_MSG] IDOR mismatch:", { uid: user.id, meta_ws: user.app_metadata?.workspace_id, req_ws: workspace_id });
      return NextResponse.json({ error: "Forbidden: You do not own this workspace" }, { status: 403 });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success: isAllowed } = await rateLimit(ip, 10, 60, workspace_id);
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
    }

    // 1. Create or Find a "Test Session" for this workspace/agent
    let { data: session } = await supabaseAdmin
      .from("conversation_sessions")
      .select("*")
      .eq("workspace_id", workspace_id)
      .eq("is_test", true)
      .eq("agent_type", agent_type)
      .eq("status", "active")
      .is("deleted_at", null)
      .maybeSingle();

    if (!session) {
      const { data: newSession, error: sessErr } = await supabaseAdmin
        .from("conversation_sessions")
        .insert({
          workspace_id,
          customer_jid: `test-${workspace_id}-${agent_type}`,
          customer_name: "Test User",
          channel: "widget",
          status: "active",
          is_test: true,
          agent_type
        })
        .select()
        .single();
      if (sessErr) {
        if (process.env.NODE_ENV !== 'production') console.error("[TEST_MSG] Session create failed:", sessErr.message);
        throw new Error("Could not create test session");
      }
      session = newSession;
    }

    if (!session) throw new Error("Could not initialize test session");

    // 2. Store Inbound Message
    const { error: msgErr } = await supabaseAdmin.from("messages").insert({
      workspace_id,
      session_id: session.id,
      content: message,
      direction: "inbound",
      role: "customer",
      is_test: true
    });
    if (msgErr && process.env.NODE_ENV !== 'production') console.warn("[TEST_MSG] Inbound message store failed:", msgErr.message);

    // 3. Invoke AI Orchestrator with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let aiResponse: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let aiError: any;
    try {
      const result = await supabaseAdmin.functions.invoke("agent-orchestrator", {
        body: {
          workspace_id,
          customer_jid: session.customer_jid,
          message,
          channel: "widget",
          customer_name: "Test User",
          agent_type,
          is_test: true
        },
      });
      aiResponse = result.data;
      aiError = result.error;
    } finally {
      clearTimeout(timeout);
    }

    // The edge function catches all errors internally and returns 200 with { error: "..." }
    // supabase-js maps that to aiError. We should still try to use the response.
    if (aiError && !aiResponse) {
      if (process.env.NODE_ENV !== 'production') console.error("[TEST_MSG] Edge function error:", aiError);
      return NextResponse.json({
        reply: "The AI agent encountered an internal error. Please try again.",
        metadata: { reason: "edge_error", agent_type, tool_calls: [] }
      });
    }

    if (!aiResponse) {
      return NextResponse.json({
        reply: "No response from agent.",
        metadata: { reason: "empty_response", agent_type, tool_calls: [] }
      });
    }

    // Return response with metadata for the test UI
    return NextResponse.json({
      reply: aiResponse.response || aiResponse.error || "No response",
      metadata: {
        reason: aiResponse.reason || "unknown",
        agent_type: aiResponse.agent_type || agent_type,
        tool_calls: aiResponse.tool_calls || [],
      }
    });

  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (process.env.NODE_ENV !== 'production') console.error("[TEST_MSG] Unhandled error:", error?.message, error?.stack);
    return NextResponse.json({ error: "Failed to process test message" }, { status: 500 });
  }
}

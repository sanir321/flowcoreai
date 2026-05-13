import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "edge";

const supabaseAdmin = createClient(
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
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success: isAllowed } = await rateLimit(ip, 10, 60);
    if (!isAllowed) {
      return new Response("Too many requests. Please wait a minute.", { status: 429 });
    }

    const body = await req.json();
    const result = TestMessageSchema.safeParse(body);

    if (!result.success) {
      return new Response("Invalid request", { status: 400 });
    }

    const { workspace_id, message, agent_type } = result.data;

    // 1. Create or Find a "Test Session" for this workspace/agent
    let { data: session } = await supabaseAdmin
      .from("conversation_sessions")
      .select("*")
      .eq("workspace_id", workspace_id)
      .eq("is_test", true)
      .eq("agent_type", agent_type)
      .eq("status", "active")
      .maybeSingle();

    if (!session) {
      const { data: newSession } = await supabaseAdmin
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
      session = newSession;
    }

    if (!session) throw new Error("Could not initialize test session");

    // 2. Store Inbound Message
    await supabaseAdmin.from("messages").insert({
      workspace_id,
      session_id: session.id,
      content: message,
      direction: "inbound",
      role: "customer",
      is_test: true
    });

    // 3. Invoke AI Orchestrator
    const { data: aiResponse, error: aiError } = await supabaseAdmin.functions.invoke("agent-orchestrator", {
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

    if (aiError || !aiResponse) {
      throw new Error(aiError?.message || "AI Agent failed to respond");
    }

    // Return response with metadata for the test UI
    return NextResponse.json({ 
      reply: aiResponse.response_parts.join("\n\n"),
      metadata: aiResponse.metadata 
    });

  } catch (error: any) {
    console.error("Test Message Error:", error);
    return new Response("Failed to process test message", { status: 500 });
  }
}

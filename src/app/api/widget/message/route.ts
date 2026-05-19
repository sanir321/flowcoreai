import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";


const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MessageSchema = z.object({
  workspace_id: z.string().uuid(),
  session_token: z.string().uuid(),
  message: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    // 0. Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success: isAllowed } = await rateLimit(ip);
    if (!isAllowed) {
      return new Response("Too many requests. Please wait a minute.", { status: 429 });
    }

    const body = await req.json();
    const result = MessageSchema.safeParse(body);

    if (!result.success) {
      return new Response("Invalid request", { status: 400 });
    }

    const { workspace_id, session_token, message } = result.data;

    // 0.5 Validate Workspace exists
    const { data: workspace } = await supabaseAdmin
      .from("workspaces")
      .select("is_ai_enabled")
      .eq("id", workspace_id)
      .maybeSingle();

    if (!workspace) {
      return new Response("Workspace not found", { status: 404 });
    }

    // 1. Resolve/Upsert Session
    let { data: session } = await supabaseAdmin
      .from("conversation_sessions")
      .select("*")
      .eq("workspace_id", workspace_id)
      .eq("customer_jid", session_token)
      .eq("channel", "widget")
      .eq("status", "active")
      .is("deleted_at", null)
      .maybeSingle();

    if (!session) {
      // Create contact for widget user
      const { data: contact } = await supabaseAdmin
        .from("contacts")
        .insert({
          workspace_id,
          session_token,
          channel: "widget",
          name: "Widget User",
        })
        .select()
        .single();

      const { data: newSession } = await supabaseAdmin
        .from("conversation_sessions")
        .insert({
          workspace_id,
          contact_id: contact?.id,
          customer_jid: session_token,
          customer_name: "Widget User",
          channel: "widget",
          agent_type: "customer_support",
          status: "active",
        })
        .select()
        .single();
      
      session = newSession;
    }

    if (!session) throw new Error("Could not initialize session");

    // 2. Store Inbound Message
    await supabaseAdmin.from("messages").insert({
      workspace_id,
      session_id: session.id,
      content: message,
      direction: "inbound",
      role: "customer",
    });

    // 3. Invoke AI Orchestrator
    const { data: aiResponse, error: aiError } = await supabaseAdmin.functions.invoke("agent-orchestrator", {
      body: {
        workspace_id,
        customer_jid: session_token,
        customer_name: "Widget User",
        message,
        channel: "widget",
        agent_type: "customer_support",
      },
    });

    if (aiError || !aiResponse) {
      throw new Error(aiError?.message || "AI Agent failed to respond");
    }

    // Return the combined reply for the widget UI
    return NextResponse.json({ 
      reply: aiResponse.response_parts.join("\n\n") 
    }, {
      headers: { "Access-Control-Allow-Origin": "*", "Strict-Transport-Security": "max-age=31536000; includeSubDomains", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY" } // Required: widget embedded on external domains
    });

  } catch (error: any) {
    console.error("Widget Message Error:", error);
    return new Response("Failed to process message", { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Vary": "Origin", // Required: widget embedded on external domains
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    },
  });
}

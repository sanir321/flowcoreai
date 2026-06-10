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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
};

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

    // 0.5 Validate Workspace exists and widget is enabled for it
    const { data: workspace } = await supabaseAdmin
      .from("workspaces")
      .select("id, is_ai_enabled")
      .eq("id", workspace_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!workspace) {
      return new Response("Workspace not found", { status: 404 });
    }

    // Verify widget is configured and active for this workspace
    const { data: widgetConfig } = await supabaseAdmin
      .from("widget_config")
      .select("workspace_id, is_active, allowed_domains")
      .eq("workspace_id", workspace_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!widgetConfig) {
      return new Response("Widget not configured for this workspace", { status: 403 });
    }

    // Optional domain allowlist check (Origin header vs configured domains)
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    if (origin && widgetConfig.allowed_domains && Array.isArray(widgetConfig.allowed_domains) && widgetConfig.allowed_domains.length > 0) {
      try {
        const originDomain = new URL(origin).hostname;
        const allowed = (widgetConfig.allowed_domains as string[]).some(d => 
          originDomain === d || originDomain.endsWith("." + d)
        );
        if (!allowed) {
          return new Response("Domain not allowed", { status: 403 });
        }
      } catch {
        // Invalid URL — skip domain check
      }
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
        customer_name: session?.customer_name || "Widget User",
        message,
        channel: "widget",
        agent_type: "customer_support",
        is_test: true,
      },
    });

    if (aiError || !aiResponse) {
      throw new Error(aiError?.message || "AI Agent failed to respond");
    }

    // 4. Extract AI response
    const reply = aiResponse.response || "I apologize, but I am unable to respond at the moment.";

    // Update session metadata
    await supabaseAdmin.from("conversation_sessions").update({
      message_count: (session.message_count || 0) + 2,
      last_message_at: new Date().toISOString(),
      last_message_preview: reply.substring(0, 100),
    }).eq("id", session.id);

    // Return the combined reply for the widget UI
    return NextResponse.json({ reply }, {
      headers: corsHeaders,
    });

  } catch (error: any) {
    console.error("Widget Message Error:", error);
    return new Response("Failed to process message", { status: 500 });
  }
}

const PollSchema = z.object({
  workspace_id: z.string().uuid(),
  session_token: z.string().uuid(),
  since: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const params = {
      workspace_id: searchParams.get("workspace_id"),
      session_token: searchParams.get("session_token"),
      since: searchParams.get("since") || undefined,
    };
    const result = PollSchema.safeParse(params);
    if (!result.success) {
      return new Response("Invalid parameters", { status: 400 });
    }

    const { workspace_id, session_token, since } = result.data;

    const { data: session } = await supabaseAdmin
      .from("conversation_sessions")
      .select("id")
      .eq("workspace_id", workspace_id)
      .eq("customer_jid", session_token)
      .eq("channel", "widget")
      .is("deleted_at", null)
      .maybeSingle();

    if (!session) {
      return NextResponse.json({ messages: [] }, { headers: corsHeaders });
    }

    let query = supabaseAdmin
      .from("messages")
      .select("content, direction, role, created_at")
      .eq("workspace_id", workspace_id)
      .eq("session_id", session.id)
      .neq("role", "system")
      .order("created_at", { ascending: true });

    if (since) {
      query = query.gt("created_at", since);
    }

    const { data: messages, error } = await query;
    if (error) throw error;

    return NextResponse.json({ messages: messages || [] }, {
      headers: { ...corsHeaders, "Cache-Control": "no-cache" },
    });

  } catch (error: any) {
    console.error("Widget Poll Error:", error);
    return NextResponse.json({ messages: [] }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: corsHeaders,
  });
}

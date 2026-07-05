import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

// C2: SECURITY DEFINER PG function handles all DB operations via anon key.
// service_role retained only for orchestrator edge-function invocation.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MessageSchema = z.object({
  workspace_id: z.string().uuid(),
  session_token: z.string().uuid(),
  message: z.string().min(1).max(2000),
  customer_name: z.string().optional(),
  customer_email: z.string().email().optional(),
});

// Rate limit per session: 10 messages per minute
const SESSION_RATE_LIMIT = 10;
const SESSION_RATE_WINDOW = 60;

function getCorsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
  };
}

export async function POST(req: NextRequest) {
  try {
    // 0. CSRF protection: require custom header that browsers cannot set cross-origin
    const csrfHeader = req.headers.get("x-widget-token");
    if (!csrfHeader) {
      return new Response("Missing CSRF header", { status: 403 });
    }

    // 0. Rate Limiting - IP-based
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

    const { workspace_id, session_token, message, customer_name, customer_email } = result.data;

    // 0.1 Validate CSRF token matches session token
    if (csrfHeader !== session_token) {
      return new Response("Invalid CSRF token", { status: 403 });
    }

    // 0.5 Rate Limiting - per session token
    const { success: sessionAllowed } = await rateLimit(`widget:${session_token}`, SESSION_RATE_LIMIT, SESSION_RATE_WINDOW);
    if (!sessionAllowed) {
      return new Response("Too many messages from this session. Please wait.", { status: 429 });
    }

    // 0.5 Domain allowlist check via SECURITY DEFINER function
    const { data: widgetInfo, error: widgetError } = await supabase.rpc("get_widget_config", {
      p_workspace_id: workspace_id,
    });

    if (widgetError || !widgetInfo || widgetInfo.error) {
      return new Response(widgetInfo?.error || "Widget not configured", { status: 403 });
    }

    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    const allowedDomains = widgetInfo.allowed_domains as string[];
    let allowedOrigin = "*";

    if (!origin) {
      return new Response("Missing origin header", { status: 403 });
    }
    try {
      const originDomain = new URL(origin).hostname;
      const allowed = allowedDomains.some(d =>
        originDomain === d || originDomain.endsWith("." + d)
      );
      if (!allowed) {
        return new Response("Domain not allowed", { status: 403 });
      }
      allowedOrigin = origin;
    } catch {
      return new Response("Invalid origin", { status: 403 });
    }

    // 1. All DB operations via SECURITY DEFINER function
    const { data: sessionResult, error: sessionError } = await supabase.rpc("handle_widget_message", {
      p_workspace_id: workspace_id,
      p_session_token: session_token,
      p_message: message,
      p_customer_name: customer_name || null,
      p_customer_email: customer_email || null,
    });

    if (sessionError || !sessionResult || sessionResult.error) {
      throw new Error(sessionResult?.error || sessionError?.message || "Could not initialize session");
    }

    // 2. Invoke AI Orchestrator (still service_role — outbound edge function call)
    const { data: aiResponse, error: aiError } = await supabaseAdmin.functions.invoke("agent-orchestrator", {
      body: {
        workspace_id,
        customer_jid: session_token,
        customer_name: customer_name || sessionResult.customer_name || "Widget User",
        customer_email: customer_email || null,
        message,
        channel: "widget",
        agent_type: "customer_support",
        is_test: false,
      },
    });

    if (aiError || !aiResponse) {
      throw new Error(aiError?.message || "AI Agent failed to respond");
    }

    // 3. Extract AI response
    const reply = aiResponse.response || "I apologize, but I am unable to respond at the moment.";

    // Return the combined reply for the widget UI
    return NextResponse.json({ reply }, {
      headers: getCorsHeaders(allowedOrigin),
    });

  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
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

    const { data: messages, error } = await supabase.rpc("get_widget_messages", {
      p_workspace_id: workspace_id,
      p_session_token: session_token,
      p_since: since ? new Date(since).toISOString() : null,
    });

    if (error) throw error;

    return NextResponse.json({ messages: messages || [] }, {
      headers: { ...getCorsHeaders("*"), "Cache-Control": "no-cache" },
    });

  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("Widget Poll Error:", error);
    return NextResponse.json({ messages: [] }, { status: 500, headers: getCorsHeaders("*") });
  }
}

export async function OPTIONS() {
  const origin = "*";
  return new Response(null, {
    headers: getCorsHeaders(origin),
  });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";


// Using anon key + RLS for public widget config reads
// See supabase/migrations/20260705000001_widget_public_rls.sql for policies
const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ConfigQuerySchema = z.object({
  id: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success: isAllowed } = await rateLimit(ip, 60, 60);
    if (!isAllowed) {
      return new Response("Too many requests", { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const result = ConfigQuerySchema.safeParse({ id: searchParams.get("id") });
    
    if (!result.success) {
      return new Response("Invalid workspace ID", { status: 400 });
    }

    const workspaceId = result.data.id;

    // 1. Fetch Widget Config
    const { data: config } = await supabasePublic
      .from("widget_config")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .maybeSingle();

    // 2. Validate allowed domains
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    let allowedOrigin = "*";
    
    // Require allowed_domains to be configured
    if (!config?.allowed_domains || config.allowed_domains.length === 0) {
      return new Response("Widget not configured — no allowed domains set", { status: 403 });
    }
    
    if (!origin) {
      return new Response("Missing origin header", { status: 403 });
    }
    try {
      const url = new URL(origin);
      const hostname = url.hostname;
      
      // Bypass for local development and same-origin dashboard requests
      const isLocal = (hostname === "localhost" || hostname === "127.0.0.1") && process.env.NODE_ENV !== "production";
      const appHostname = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname : "";
      const isSameOrigin = appHostname && (hostname === appHostname || hostname.endsWith("." + appHostname));
      
      const allowed = isLocal || isSameOrigin || config.allowed_domains.some((d: string) => hostname === d || hostname.endsWith("." + d));
      if (!allowed) {
        return new Response("Domain not allowed", { status: 403 });
      }
      allowedOrigin = origin;
    } catch {
      return new Response("Invalid origin", { status: 403 });
    }

    // 2. Fetch primary agent for name/avatar
    const { data: agent } = await supabasePublic
      .from("workspace_agents")
      .select("config")
      .eq("workspace_id", workspaceId)
      .eq("agent_type", "customer_support")
      .is("deleted_at", null)
      .single();

    const responseData = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      agent_name: (agent?.config as any)?.name || "Support AI",
      accent_color: config?.accent_color || "#f9510b",
      greeting: config?.greeting || "Hi! How can I help you today?",
      header_text: config?.header_text || "Support Specialist",
      post_form_message: config?.post_form_message || "Thank you! How can I help you today?",
      auto_fill_params: config?.auto_fill_params ?? false,
      theme: config?.theme || "dark",
      avatar_url: config?.avatar_url || null,
      logo_url: config?.logo_url || null,
      launcher_icon: config?.launcher_icon || "chat",
      allow_anonymous: config?.allow_anonymous ?? false,
      is_active: config?.is_active ?? true,
    };

    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Access-Control-Allow-Origin": allowedOrigin,
      },
    });

  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("Widget Config Error:", error);
    return new Response("Failed to load widget configuration", { status: 500 });
  }
}

export const runtime = "nodejs";

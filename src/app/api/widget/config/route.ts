import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";


const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
    const { data: config } = await supabaseAdmin
      .from("widget_config")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .maybeSingle();

    // 2. Validate allowed domains
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    if (config?.allowed_domains && config.allowed_domains.length > 0) {
      const hostname = origin ? new URL(origin).hostname : "";
      const allowed = config.allowed_domains.some((d: string) => hostname === d || hostname.endsWith("." + d));
      if (!allowed) {
        return new Response("Domain not allowed", { status: 403 });
      }
    }

    // 2. Fetch primary agent for name/avatar
    const { data: agent } = await supabaseAdmin
      .from("workspace_agents")
      .select("config")
      .eq("workspace_id", workspaceId)
      .eq("agent_type", "customer_support")
      .is("deleted_at", null)
      .single();

    const responseData = {
      agent_name: (agent?.config as any)?.name || "Support AI",
      accent_color: config?.accent_color || "#f9510b",
      greeting: config?.greeting || "Hi! How can I help you today?",
      theme: config?.theme || "dark",
      avatar_url: config?.avatar_url || null,
      enable_whatsapp: config?.enable_whatsapp ?? false,
      allow_anonymous: config?.allow_anonymous ?? false,
      whatsapp_number: config?.whatsapp_number || null,
    };

    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (error: any) {
    console.error("Widget Config Error:", error);
    return new Response("Failed to load widget configuration", { status: 500 });
  }
}

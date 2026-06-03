import { createClient } from "@supabase/supabase-js";

let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabaseAdmin;
}

/**
 * Basic IP-based or Workspace-based rate limiter using a temporary Supabase table
 * Requirement: 30 req/min
 * Fail-open: if the table doesn't exist or errors, requests proceed (success: true)
 */
export async function rateLimit(ip: string, limit = 30, windowSeconds = 60, workspace_id?: string): Promise<{ success: boolean }> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;

  try {
    const supabaseAdmin = getAdmin()
    let query = supabaseAdmin
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .gt("created_at", new Date(windowStart * 1000).toISOString());

    if (workspace_id) {
      query = query.eq("workspace_id", workspace_id);
    } else {
      query = query.eq("ip", ip);
    }

    const { count, error } = await query;

    if (error) {
      console.warn("Rate limit table missing or error:", error.message);
      return { success: true }; // fail open
    }

    if ((count || 0) >= limit) {
      return { success: false };
    }

    await supabaseAdmin.from("rate_limits").insert({ ip, workspace_id });

    return { success: true };
  } catch (e) {
    console.error("Rate limit error:", e);
    return { success: true }; // fail open
  }
}

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Basic IP-based rate limiter using a temporary Supabase table
 * Requirement: 30 req/min
 */
export async function rateLimit(ip: string, limit = 30, windowSeconds = 60): Promise<{ success: boolean }> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;

  try {
    // Note: This requires a 'rate_limits' table (service_role bypasses RLS).
    // If the table is missing, requests are denied to be safe.
    const { count, error } = await supabaseAdmin
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("ip", ip)
      .gt("created_at", new Date(windowStart * 1000).toISOString());

    if (error) {
      console.warn("Rate limit table missing or error:", error.message);
      return { success: false }; 
    }

    if ((count || 0) >= limit) {
      return { success: false };
    }

    // Log this request
    await supabaseAdmin.from("rate_limits").insert({ ip });

    return { success: true };
  } catch (e) {
    console.error("Rate limit error:", e);
    return { success: false };
  }
}

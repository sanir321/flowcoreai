import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("NEXT_PUBLIC_APP_URL") || "",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const authHeader = req.headers.get("Authorization") || ""
    const token = authHeader.replace("Bearer ", "")
    const internalSecret = Deno.env.get("INTERNAL_CRON_SECRET") || ""
    
    if (token !== internalSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const now = new Date()
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

    // Find workspaces with Google tokens expiring within 1 hour
    const { data: expiringTokens, error } = await supabase
      .from("google_oauth_tokens")
      .select("workspace_id, token_expiry, refresh_token")
      .is("deleted_at", null)
      .lt("token_expiry", oneHourFromNow.toISOString())
      .gt("token_expiry", now.toISOString())

    if (error) throw error

    const results = []
    for (const t of expiringTokens || []) {
      // Use advisory lock to prevent concurrent refresh for same workspace
      const lockKey = 1000000 + Math.abs(t.workspace_id.split("-").reduce((acc, c) => acc + c.charCodeAt(0), 0))
      const { data: lockResult } = await supabase.rpc("pg_try_advisory_lock", { key: lockKey })
      
      if (!lockResult) {
        results.push({ workspace_id: t.workspace_id, status: "skipped - lock held" })
        continue
      }

      try {
        const { data: config } = await supabase
          .from("google_oauth_tokens")
          .select("*")
          .eq("workspace_id", t.workspace_id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!config) {
          results.push({ workspace_id: t.workspace_id, status: "skipped - not found" })
          continue
        }

        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
            client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
            refresh_token: config.refresh_token,
            grant_type: "refresh_token"
          })
        })

        const newTokens = await response.json()

        if (!response.ok) {
          if (newTokens?.error === "invalid_grant") {
            await supabase
              .from("google_oauth_tokens")
              .update({ deleted_at: new Date().toISOString() })
              .eq("workspace_id", t.workspace_id)
            results.push({ workspace_id: t.workspace_id, status: "invalid_grant - marked deleted" })
          } else {
            results.push({ workspace_id: t.workspace_id, status: `refresh failed: ${newTokens?.error || response.status}` })
          }
          continue
        }

        const newExpiry = new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
        await supabase
          .from("google_oauth_tokens")
          .update({ access_token: newTokens.access_token, token_expiry: newExpiry })
          .eq("workspace_id", t.workspace_id)

        results.push({ workspace_id: t.workspace_id, status: "refreshed", new_expiry: newExpiry })
      } finally {
        await supabase.rpc("pg_advisory_unlock", { key: lockKey })
      }
    }

    return new Response(JSON.stringify({ refreshed: results.length, results }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  } catch (e: any) {
    console.error("[google-token-refresh] Error:", e.message)
    return new Response(JSON.stringify({ error: "Token refresh failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const GOWA_BASE_URL = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "")

// L1: constant-time comparison to prevent timing attacks.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

Deno.serve(async (req) => {
  try {
    // Auth: Bearer token must match INTERNAL_CRON_SECRET
    const authHeader = req.headers.get('Authorization') || ''
    const internalSecret = Deno.env.get('INTERNAL_CRON_SECRET')
    if (!internalSecret) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
    const provided = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : ''
    if (!timingSafeEqual(provided, internalSecret)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }

    const payload = await req.json()
    const { device_id } = payload

    if (!device_id) {
      return new Response("missing device_id", { status: 400 })
    }

    const gowaKey = Deno.env.get("GOWA_API_KEY") || ""
    const gowaAuth = btoa(gowaKey)

    // L4: device_id is path-injected — encode it as a path segment.
    const encodedDeviceId = encodeURIComponent(String(device_id))

    const logoutRes = await fetch(`${GOWA_BASE_URL}/devices/${encodedDeviceId}/logout`, {
      method: "POST",
      headers: { "Authorization": `Basic ${gowaAuth}` },
    });
    if (!logoutRes.ok) console.error("[GOWA-CLEANUP] Logout failed:", logoutRes.status);

    const deleteRes = await fetch(`${GOWA_BASE_URL}/devices/${encodedDeviceId}`, {
      method: "DELETE",
      headers: { "Authorization": `Basic ${gowaAuth}` },
    });
    if (!deleteRes.ok) console.error("[GOWA-CLEANUP] Delete failed:", deleteRes.status);

    return new Response("ok", { status: 200 })
  } catch (err) {
    console.error("gowa-cleanup error:", err)
    return new Response(JSON.stringify({ error: "Cleanup failed" }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})

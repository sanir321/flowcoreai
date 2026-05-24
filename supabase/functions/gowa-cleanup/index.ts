import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const GOWA_BASE_URL = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "")

Deno.serve(async (req) => {
  try {
    // Auth: Bearer token must match INTERNAL_CRON_SECRET
    const authHeader = req.headers.get('Authorization') || ''
    const internalSecret = Deno.env.get('INTERNAL_CRON_SECRET')
    if (internalSecret && authHeader !== `Bearer ${internalSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }

    const payload = await req.json()
    const { device_id } = payload

    if (!device_id) {
      return new Response("missing device_id", { status: 400 })
    }

    const gowaKey = Deno.env.get("GOWA_API_KEY") || ""
    const gowaAuth = btoa(gowaKey)

    await fetch(`${GOWA_BASE_URL}/devices/${device_id}/logout`, {
      method: "POST",
      headers: { "Authorization": `Basic ${gowaAuth}` },
    }).catch(() => {})

    await fetch(`${GOWA_BASE_URL}/devices/${device_id}`, {
      method: "DELETE",
      headers: { "Authorization": `Basic ${gowaAuth}` },
    }).catch(() => {})

    return new Response("ok", { status: 200 })
  } catch {
    return new Response("ok", { status: 200 })
  }
})

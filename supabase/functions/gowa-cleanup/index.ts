import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const GOWA_BASE_URL = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "")
const GOWA_KEY = Deno.env.get("GOWA_API_KEY") || ""
const GOWA_AUTH = btoa(GOWA_KEY)

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const { device_id } = payload

    if (!device_id) {
      return new Response("missing device_id", { status: 400 })
    }

    await fetch(`${GOWA_BASE_URL}/devices/${device_id}/logout`, {
      method: "POST",
      headers: { "Authorization": `Basic ${GOWA_AUTH}` },
    }).catch(() => {})

    await fetch(`${GOWA_BASE_URL}/devices/${device_id}`, {
      method: "DELETE",
      headers: { "Authorization": `Basic ${GOWA_AUTH}` },
    }).catch(() => {})

    return new Response("ok", { status: 200 })
  } catch {
    return new Response("ok", { status: 200 })
  }
})

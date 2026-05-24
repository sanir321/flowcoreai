import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import { runT0 } from "./pipeline/t0-instant.ts"
import { runT1 } from "./pipeline/t1-cache.ts"
import { runT2 } from "./pipeline/t2-router.ts"
import { runT3 } from "./pipeline/t3-planner.ts"
import { dispatch } from "./lib/dispatch.ts"
import { getOrCreateSession, touchSession } from "./lib/session.ts"
import { WebhookPayload, PipelineContext } from "./lib/types.ts"

// Restricted CORS — internal function, not browser-facing
const responseHeaders = {
  "Content-Type": "application/json",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 204 })

  try {
    // AUTH: Verify Bearer token is the service role key (what all internal callers send)
    // This prevents unauthorized external invocation while maintaining backward compat.
    const authHeader = req.headers.get("Authorization") || ""
    const token = authHeader.replace("Bearer ", "")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const internalSecret = Deno.env.get("INTERNAL_CRON_SECRET") || ""
    if (!token || (token !== serviceRoleKey && token !== internalSecret)) {
      console.error("[ORCHESTRATOR] Unauthorized invocation attempt")
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: responseHeaders
      })
    }

    const payload = await parseWebhook(req)
    if (!payload) return new Response("ok", { status: 200 })

    await processMessage(payload)
    return new Response("ok", { status: 200 })
  } catch (e: any) {
    console.error("[ORCHESTRATOR] Parse error:", e.message)
    return new Response(JSON.stringify({ error: e.message }), {
      status: 200, headers: responseHeaders
    })
  }
})

async function processMessage(payload: WebhookPayload) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  )

  try {
    const session = await getOrCreateSession(supabase, {
      workspace_id: payload.workspace_id,
      customer_jid: payload.customer_jid,
      channel: payload.source,
      agent_type: "customer_support"
    })

    const ctx: PipelineContext = { supabase, session, payload }

    const guardrailConfig = session.workspaces?.guardrail_config || {}
    ctx.workspace = session.workspaces
    console.log(`[ORCHESTRATOR] Processing message for workspace: ${ctx.workspace?.name}`)

    const t0 = await runT0(ctx)
    if (t0.handled) {
      console.log(`[ORCHESTRATOR] T0 handled: ${t0.reason}`)
      await touchSession(ctx, "customer_support", t0.response || "")
      return dispatch(ctx, t0.response)
    }

    const t1 = await runT1(ctx)
    if (t1.handled) {
      console.log(`[ORCHESTRATOR] T1 handled: ${t1.reason}`)
      await touchSession(ctx, "customer_support", t1.response || "")
      return dispatch(ctx, t1.response)
    }

    const t2 = await runT2(ctx)
    if (t2.handled) {
      console.log(`[ORCHESTRATOR] T2 handled: ${t2.reason}`)
      await touchSession(ctx, ctx.agentType || "customer_support", t2.response || "")
      return dispatch(ctx, t2.response)
    }

    console.log(`[ORCHESTRATOR] Entering T3 Planner for agent: ${ctx.agentType}`)
    const t3 = await runT3(ctx)
    console.log(`[ORCHESTRATOR] T3 completed: ${t3.reason}`)
    await dispatch(ctx, t3.response)
  } catch (e: any) {
    console.error("[ORCHESTRATOR] Error:", e.message)
    await dispatchFallback(supabase, payload)
  }
}

async function parseWebhook(req: Request): Promise<WebhookPayload | null> {
  const contentType = req.headers.get("content-type") || ""
  if (!contentType.includes("application/json")) return null

  const contentLength = parseInt(req.headers.get("content-length") || "0", 10)
  if (contentLength > 1_000_000) return null

  const body = await req.json()
  if (!body.workspace_id) return null
  body.message = body.message ?? ""
  body.message_type = body.message_type ?? "text"

  return {
    workspace_id: body.workspace_id,
    customer_jid: body.customer_jid || crypto.randomUUID(),
    customer_phone: body.customer_jid?.split("@")[0] || "",
    message: body.message,
    message_type: body.message_type || "text",
    gowa_message_id: body.gowa_message_id || crypto.randomUUID(),
    timestamp: body.timestamp || Date.now(),
    source: body.channel || body.source || "whatsapp",
    is_test: body.is_test || false
  }
}

async function dispatchFallback(supabase: any, payload: WebhookPayload) {
  const gowaBase = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "")
  const gowaKey = Deno.env.get("GOWA_API_KEY")
  if (!gowaBase || !gowaKey || payload.source !== "whatsapp") return

  const phone = payload.customer_jid?.split("@")[0]
  if (!phone) return

  const { data: gs } = await supabase.from("gowa_sessions").select("gowa_session_id").eq("workspace_id", payload.workspace_id).maybeSingle()
  if (!gs?.gowa_session_id) return

  const msg = "I'm having a small technical hiccup right now! Our team has been notified and will get back to you very shortly."
  await fetch(`${gowaBase}/send/message`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(gowaKey)}`, "Content-Type": "application/json", "X-Device-Id": gs.gowa_session_id },
    body: JSON.stringify({ phone, message: msg })
  }).catch(() => {})
}

declare var EdgeRuntime: { waitUntil: (promise: Promise<any>) => void }

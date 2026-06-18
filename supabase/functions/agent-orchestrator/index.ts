import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1"
import { runT0 } from "./pipeline/t0-instant.ts"
import { runT1 } from "./pipeline/t1-cache.ts"
import { runT2 } from "./pipeline/t2-router.ts"
import { runT3 } from "./pipeline/t3-planner.ts"
import { dispatch } from "./lib/dispatch.ts"
import { getOrCreateSession, touchSession } from "./lib/session.ts"
import { WebhookPayload, PipelineContext } from "./lib/types.ts"
import { sanitizeUserInput, sanitizeLlmOutput } from "./lib/sanitize.ts"

const responseHeaders = {
  "Content-Type": "application/json",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
}

const DEFAULT_FALLBACK_MESSAGE = "I'm not sure about that. Please contact us directly for more information.";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 204 })

  try {
    const authHeader = req.headers.get("Authorization") || ""
    const token = authHeader.replace("Bearer ", "")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const internalSecret = Deno.env.get("INTERNAL_CRON_SECRET") || ""

    if (!token) {
      console.error(`[ORCHESTRATOR] No auth token provided`)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: responseHeaders
      })
    }

    const isServiceRole = timingSafeEqual(token, serviceRoleKey);
    const isInternal = internalSecret && timingSafeEqual(token, internalSecret);

    if (!isServiceRole && !isInternal) {
      const fallbackClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        serviceRoleKey
      )
      const { data: { user }, error: authError } = await fallbackClient.auth.getUser(token)
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: responseHeaders
        })
      }
    }

    const payload = await parseWebhook(req)
    if (!payload) return new Response("ok", { status: 200 })

    const [aiResult, ctx] = await processMessage(payload)
    
    if (payload.is_test) {
      const toolCalls = (ctx._toolCalls || []).map((tc: any) => ({
        tool: tc.tool,
        params: tc.params,
        success: tc.success,
        result: tc.result,
        duration_ms: tc.duration_ms,
      }))
      return new Response(JSON.stringify({
        ...aiResult,
        agent_type: ctx.agentType || "customer_support",
        tool_calls: toolCalls,
      }), { status: 200, headers: responseHeaders })
    }
    
    return new Response("ok", { status: 200 })
  } catch (e: any) {
    console.error("[ORCHESTRATOR] Request error")
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: responseHeaders
    })
  }
})

async function processMessage(payload: WebhookPayload): Promise<[TierResult, PipelineContext]> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  )

  try {
    const session = await getOrCreateSession(supabase, {
      workspace_id: payload.workspace_id,
      customer_jid: payload.customer_jid,
      channel: payload.source,
      agent_type: payload.agent_type || "customer_support"
    })

    const ctx: PipelineContext = { supabase, session, payload }
    ctx.workspace = session.workspaces
    ctx.payload.message = sanitizeUserInput(ctx.payload.message || "")

    const t0 = await runT0(ctx)
    if (t0.handled) {
      t0.response = sanitizeLlmOutput(t0.response || "")
      await touchSession(ctx, "customer_support", t0.response)
      await dispatch(ctx, t0.response)
      return [t0, ctx]
    }

    const t1 = await runT1(ctx)
    if (t1.handled) {
      t1.response = sanitizeLlmOutput(t1.response || "")
      await touchSession(ctx, "customer_support", t1.response)
      await dispatch(ctx, t1.response)
      return [t1, ctx]
    }

    const t2 = await runT2(ctx)
    if (t2.handled) {
      t2.response = sanitizeLlmOutput(t2.response || "")
      await touchSession(ctx, ctx.agentType || "customer_support", t2.response)
      await dispatch(ctx, t2.response)
      return [t2, ctx]
    }

    const t3 = await runT3(ctx)
    t3.response = sanitizeLlmOutput(t3.response || "")
    await dispatch(ctx, t3.response)
    return [{ ...t3, agent_type: ctx.agentType }, ctx]
  } catch (e: any) {
    console.error("[ORCHESTRATOR] CRASH in processMessage:", e.message)
    console.error("[ORCHESTRATOR] Stack:", e.stack)
    
    try {
      await supabase.from("debug_logs").insert({
        level: "error",
        scope: "agent-orchestrator",
        message: e.message,
        metadata: { 
          stack: e.stack, 
          workspace_id: payload.workspace_id,
        }
      })
    } catch (dbErr) {
      console.error("[ORCHESTRATOR] Failed to log crash to DB:", dbErr.message)
    }

    await dispatchFallback(supabase, payload)
    return [{ handled: true, response: DEFAULT_FALLBACK_MESSAGE, reason: "crash" }, { supabase, session: {}, payload } as PipelineContext]
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

  const isWhatsApp = body.channel === "whatsapp" || body.source === "whatsapp";
  const stableJid = isWhatsApp
    ? (body.customer_jid || `${body.customer_phone || ""}@s.whatsapp.net`)
    : body.customer_jid || (() => {
        const ws = body.workspace_id?.substring(0, 8) || "unknown";
        const sid = body.client_session_id || crypto.randomUUID();
        return `widget_${ws}_${sid}`;
      })();

  return {
    workspace_id: body.workspace_id,
    customer_jid: stableJid,
    customer_phone: body.customer_jid?.split("@")[0] || "",
    message: body.message,
    message_type: body.message_type || "text",
    gowa_message_id: body.gowa_message_id || null,
    timestamp: body.timestamp || Date.now(),
    source: body.channel || body.source || "whatsapp",
    is_test: body.is_test || false,
    agent_type: body.agent_type || undefined,
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

  const { data: ws } = await supabase.from("workspaces").select("guardrail_config").eq("id", payload.workspace_id).maybeSingle()
  const fallbackMsg = ws?.guardrail_config?.fallback_message || DEFAULT_FALLBACK_MESSAGE

  await fetch(`${gowaBase}/send/message`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(gowaKey)}`, "Content-Type": "application/json", "X-Device-Id": gs.gowa_session_id },
    body: JSON.stringify({ phone, message: fallbackMsg })
  }).catch(() => {})
}

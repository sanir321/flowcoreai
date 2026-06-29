import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1"
import { runT0 } from "./pipeline/t0-instant.ts"
import { runT1 } from "./pipeline/t1-cache.ts"
import { runT2 } from "./pipeline/t2-router.ts"
import { runT3 } from "./pipeline/t3-context.ts"
import { runT3 as runT4 } from "./pipeline/t3-planner.ts"
import { runT5 } from "./pipeline/t4-reflection.ts"
import { dispatch } from "./lib/dispatch.ts"
import { getOrCreateSession, touchSession } from "./lib/session.ts"
import { WebhookPayload, PipelineContext, TierResult } from "./lib/types.ts"
import { sanitizeUserInput, sanitizeLlmOutput } from "./lib/sanitize.ts"
import { DEFAULT_FALLBACK_MESSAGE } from "./lib/llm.ts"

const responseHeaders = {
  "Content-Type": "application/json",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
}

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
    const serviceKey = Deno.env.get("SERVICE_KEY") || ""
    const internalSecret = Deno.env.get("INTERNAL_CRON_SECRET") || ""

    if (!token) {
      console.error(`[ORCHESTRATOR] No auth token provided`)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: responseHeaders
      })
    }

    const isServiceRole = timingSafeEqual(token, serviceRoleKey) || (serviceKey && timingSafeEqual(token, serviceKey));
    const isInternal = internalSecret && timingSafeEqual(token, internalSecret);

    if (!isServiceRole && !isInternal) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
      const isAnon = anonKey && timingSafeEqual(token, anonKey);

      if (!isAnon) {
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
    console.error("[ORCHESTRATOR] Request error:", e.message, e.stack)
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
      agent_type: payload.agent_type || "customer_support",
      customer_name: payload.customer_name,
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

    // T2 — Query Analysis (LLM intent classification + task decomposition)
    await runT2(ctx)
    // T2 always returns handled:false — it only sets ctx.agentType and ctx._subTasks

    // T3 — Context Gathering (KB search, profile, appointments)
    await runT3(ctx)

    // Check if T3 returned empty KB — flag for re-query if tools return empty later
    const kbWasEmpty = ctx._kbChunks?.length === 0

    // T4 — Reasoning Engine (LLM + tool execution)
    const t4 = await runT4(ctx)
    let finalResponse = sanitizeLlmOutput(t4.response || "")

    // T5 — Reflection (response quality check)
    const t5 = await runT5(ctx, finalResponse, ctx.agentType || "customer_support")

    // T5 retry: if failed, inject retry hint, re-query KB if needed, run T4+T5 once more
    if (t5.reason !== "t5_passed") {
      ctx._retryHint = t5.retry_hint || "Be specific and helpful. Answer directly from your knowledge."
      console.warn(`[PIPELINE] T5 retry attempt with hint: ${ctx._retryHint}`)

      if (kbWasEmpty && (ctx.agentType === "customer_support" || ctx.agentType === "sales")) {
        ctx._kbChunks = []
        await runT3(ctx, { previous_empty: true, previous_query: ctx.payload.message })
      }

      const t4Retry = await runT4(ctx)
      const t5Retry = await runT5(ctx, sanitizeLlmOutput(t4Retry.response || ""), ctx.agentType || "customer_support")
      finalResponse = sanitizeLlmOutput(t4Retry.response || "")
      t5.reason = t5Retry.reason
      t5.response = t5Retry.response
    }

    finalResponse = t5.response

    await dispatch(ctx, finalResponse)

    if (ctx._cacheKeyHex && finalResponse && finalResponse.length < 2000) {
      try {
        await supabase.from("kb_response_cache").upsert({
          workspace_id: payload.workspace_id,
          cache_key: ctx._cacheKeyHex,
          response_text: finalResponse,
          access_count: 1,
          accessed_at: new Date().toISOString(),
        }, { onConflict: "workspace_id, cache_key" });
      } catch (_) {}
    }

    return [{ handled: true, response: finalResponse, reason: t5?.reason || "completed" }, ctx]
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
          agent_type: payload.agent_type,
        }
      })
    } catch (dbErr) {
      console.error("[ORCHESTRATOR] Failed to log crash to DB:", dbErr.message)
    }

    await dispatchFallback(supabase, payload)
    if (payload.is_test) {
      return [{ handled: true, response: `[CRASH] ${e.message}`, reason: "crash" }, { supabase, session: {}, payload } as PipelineContext]
    }
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
    customer_name: body.customer_name || null,
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

  try {
    await fetch(`${gowaBase}/send/message`, {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(gowaKey)}`, "Content-Type": "application/json", "X-Device-Id": gs.gowa_session_id },
      body: JSON.stringify({ phone, message: fallbackMsg })
    });
  } catch (e: any) {
    console.error("[DISPATCH_FALLBACK] GoWA send failed:", e?.message || e);
    try {
      await supabase.from("failed_messages").insert({
        workspace_id: payload.workspace_id,
        session_id: payload.session_id || null,
        content: fallbackMsg,
        error: e?.message || "dispatch_fallback_failed",
        failed_at: new Date().toISOString()
      });
    } catch (_) {}
  }
}

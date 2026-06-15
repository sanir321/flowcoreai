var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// supabase/functions/agent-orchestrator/tools/impl/contact.ts
var contact_exports = {};
__export(contact_exports, {
  getHistory: () => getHistory,
  update: () => update
});
async function getHistory(params, ctx) {
  const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
  if (!session?.contact_id) return { error: "Contact not found" };
  const { data: contact } = await ctx.supabase.from("contacts").select("*").eq("id", session.contact_id).single();
  const { data: byContact } = await ctx.supabase.from("appointments").select("*").eq("contact_id", session.contact_id).order("created_at", { ascending: false });
  const { data: bySession } = await ctx.supabase.from("appointments").select("*").eq("session_id", ctx.session.id).order("created_at", { ascending: false });
  const merged = [...byContact || [], ...bySession || []];
  const seen = /* @__PURE__ */ new Set();
  const appointments = merged.filter((a) => {
    const k = a.id;
    return seen.has(k) ? false : (seen.add(k), true);
  });
  return { ...contact, appointments: appointments || [] };
}
async function update(params, ctx) {
  const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
  if (!session?.contact_id) return { error: "Contact not found" };
  const { data: updated } = await ctx.supabase.from("contacts").update({
    name: params.name,
    email: params.email,
    phone: params.phone,
    notes: params.notes ? `[Update] ${params.notes}` : void 0,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", session.contact_id).select().single();
  return updated;
}
var init_contact = __esm({
  "supabase/functions/agent-orchestrator/tools/impl/contact.ts"() {
    "use strict";
  }
});

// supabase/functions/agent-orchestrator/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1";

// supabase/functions/agent-orchestrator/guards/non-text.ts
var NON_TEXT_TYPES = ["image", "audio", "document", "sticker", "reaction", "video"];
function checkNonText(ctx) {
  if (NON_TEXT_TYPES.includes(ctx.payload.message_type)) {
    return "I can only read text messages right now. Please type your question!";
  }
  return null;
}

// supabase/functions/agent-orchestrator/guards/credits.ts
function checkCredits(ctx, workspace) {
  if ((workspace.credits_remaining ?? workspace.credits_balance ?? 0) <= 0) {
    return workspace.guardrail_config?.out_of_credits_message ?? "Our service is currently unavailable. Please contact the business directly.";
  }
  return null;
}

// supabase/functions/agent-orchestrator/guards/window.ts
function checkWhatsAppWindow(ctx, workspace) {
  if (ctx.payload.source !== "whatsapp") return null;
  const lastUserMsgAt = ctx.session.last_customer_message_at;
  if (!lastUserMsgAt) return null;
  const hoursSinceLastMsg = (Date.now() - new Date(lastUserMsgAt).getTime()) / 36e5;
  if (hoursSinceLastMsg > 23.5) {
    return workspace.guardrail_config?.window_expired_message ?? "Our response window has closed. A human agent will get back to you soon.";
  }
  return null;
}

// supabase/functions/agent-orchestrator/guards/escalation.ts
var APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://7flowcore.vercel.app";
var CRON_SECRET = Deno.env.get("INTERNAL_CRON_SECRET") || "";
var DEFAULT_KEYWORDS = [
  "human",
  "agent",
  "person",
  "manager",
  "staff",
  "real person",
  "talk to someone",
  "talk to a person",
  "refund",
  "complaint",
  // Generic escalation keywords
  "owner",
  "call owner",
  "contact person",
  "talk to owner",
  "director",
  "boss",
  // Emotional escalation signals
  "frustrated",
  "fed up",
  "waste",
  "useless",
  "scam",
  "cheating",
  "terrible service",
  "worst",
  "hopeless",
  "not helpful"
];
async function checkEscalation(ctx, workspace) {
  if (ctx.session?.status === "escalated") return null;
  const customKeywords = workspace.guardrail_config?.escalation_keywords;
  const keywords = customKeywords ? [.../* @__PURE__ */ new Set([...DEFAULT_KEYWORDS, ...customKeywords])] : DEFAULT_KEYWORDS;
  const msgLower = ctx.payload.message.toLowerCase();
  if (!keywords.some((k) => msgLower.includes(k))) return null;
  await ctx.supabase.from("conversation_sessions").update({ status: "escalated", updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", ctx.session.id);
  try {
    await ctx.supabase.from("escalation_logs").insert({
      session_id: ctx.session.id,
      workspace_id: ctx.payload.workspace_id,
      trigger_type: "guardrail_hit",
      trigger_message: msgLower,
      conversation_snapshot: { message: ctx.payload.message.substring(0, 500) },
      status: "open"
    });
  } catch (e) {
    console.error("[ESCALATION] Failed to insert escalation_log:", e.message);
  }
  try {
    const ownerEmail = workspace.owner_id ? await ctx.supabase.rpc("get_user_email", { user_id: workspace.owner_id }) : null;
    if (ownerEmail?.data) {
      await fetch(`${APP_URL}/api/emails/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${CRON_SECRET}` },
        body: JSON.stringify({
          to: ownerEmail.data,
          subject: `Escalation Alert \u2014 ${workspace.name || "Your Workspace"}`,
          template: "escalation",
          data: {
            workspaceName: workspace.name || "Your Workspace",
            customerName: ctx.contact?.name || ctx.session?.customer_name || "A Customer",
            reason: msgLower,
            inboxUrl: `${APP_URL}/inbox`
          }
        })
      });
    }
  } catch (e) {
    console.error("[ESCALATION] Email notification error:", e.message);
  }
  return workspace.guardrail_config?.handoff_message ?? "I've notified our team and a human will get back to you shortly.";
}

// supabase/functions/agent-orchestrator/guards/blocked-topics.ts
function checkBlockedTopics(ctx, workspace) {
  const blockedTopics = workspace.guardrail_config?.blocked_topics ?? [];
  if (blockedTopics.length === 0) return null;
  const msgLower = ctx.payload.message.toLowerCase();
  if (blockedTopics.some((topic) => msgLower.includes(topic.toLowerCase()))) {
    return workspace.guardrail_config?.fallback_message ?? "I'm sorry, I can't help with that. Please contact the business directly.";
  }
  return null;
}

// supabase/functions/agent-orchestrator/guards/pricing.ts
var PRICING_KEYWORDS = [
  "price",
  "cost",
  "how much",
  "rate",
  "pricing",
  "charge",
  "fee",
  "what is the price",
  "what are your rates",
  "how much does",
  "cost of",
  "price list",
  "rate card",
  "\u591A\u5C11\u94B1"
];
function checkPricing(ctx, workspace) {
  if (workspace.guardrail_config?.allow_pricing !== false) return null;
  const msgLower = ctx.payload.message.toLowerCase();
  if (PRICING_KEYWORDS.some((kw) => msgLower.includes(kw))) {
    ctx.pricingBlocked = true;
  }
  return null;
}

// supabase/functions/agent-orchestrator/guards/token-budget.ts
function checkTokenBudget(ctx, workspace) {
  const sessionLimit = workspace.guardrail_config?.session_token_limit ?? workspace.guardrail_config?.daily_token_limit ?? 5e4;
  if ((ctx.session.total_tokens_used ?? 0) >= sessionLimit) {
    return workspace.guardrail_config?.limit_replied_message ?? workspace.guardrail_config?.limit_reached_message ?? "Your conversation has reached its limit. A human agent will take over.";
  }
  return null;
}

// supabase/functions/agent-orchestrator/guards/greeting.ts
function checkGreeting(ctx, workspace) {
  if ((ctx.session.message_count ?? 0) > 0) return null;
  if (workspace.welcome_template) {
    return workspace.welcome_template;
  }
  const businessName = workspace.name ?? "our business";
  return `Hi! Welcome to ${businessName}. How can I help you today? \u{1F44B}`;
}

// supabase/functions/agent-orchestrator/guards/sales.ts
var SALES_GUARD_KEYWORDS = [
  "order",
  "buy",
  "purchase",
  "product",
  "menu",
  "service list",
  "what do you sell",
  "quote",
  "deal",
  "discount"
];
function checkSales(ctx, workspace) {
  if (workspace.guardrail_config?.allow_sales !== false) return null;
  const msgLower = ctx.payload.message.toLowerCase();
  if (SALES_GUARD_KEYWORDS.some((kw) => msgLower.includes(kw))) {
    ctx.salesBlocked = true;
  }
  return null;
}

// supabase/functions/agent-orchestrator/guards/index.ts
async function runGuard(ctx, workspace, fn, reason) {
  const response = await fn(ctx, workspace);
  if (response !== null) {
    return { handled: true, response, reason: `guardrail_${reason}` };
  }
  return null;
}
async function runAllGuards(ctx, workspace) {
  const guards = [
    [checkNonText, "non_text"],
    [checkEscalation, "escalation"],
    [checkBlockedTopics, "blocked"],
    [checkCredits, "credits"],
    [checkWhatsAppWindow, "window"],
    [checkSales, "sales"],
    [checkPricing, "pricing"],
    [checkTokenBudget, "tokens"],
    [checkGreeting, "greeting"]
  ];
  for (const [fn, reason] of guards) {
    const result = await runGuard(ctx, workspace, fn, reason);
    if (result) return result;
  }
  return null;
}

// supabase/functions/agent-orchestrator/pipeline/t0-instant.ts
async function runT0(ctx) {
  const { payload, supabase } = ctx;
  if (!payload.message || payload.message.trim().length === 0) {
    return {
      handled: true,
      response: "",
      reason: "empty_message_skipped"
    };
  }
  if (payload.source !== "widget") {
    const { data: existing } = await supabase.from("messages").select("id").eq("gowa_message_id", payload.gowa_message_id).maybeSingle();
    if (!existing) {
      try {
        await supabase.from("messages").insert({
          workspace_id: payload.workspace_id,
          session_id: ctx.session.id,
          content: payload.message || payload.message_type || "[non-text]",
          direction: "inbound",
          role: "customer",
          gowa_message_id: payload.gowa_message_id
        });
        console.log("[T0] Inbound message stored.");
      } catch (e) {
        console.error("[T0] Message store failed:", e.message);
      }
    }
  }
  const { data: currentSession } = await supabase.from("conversation_sessions").select("status").eq("id", ctx.session.id).single();
  if (currentSession?.status === "escalated") {
    return {
      handled: true,
      response: ctx.workspace?.guardrail_config?.handoff_message ?? "Your request has been escalated to our team. They will get back to you shortly.",
      reason: "already_escalated"
    };
  }
  const guardResult = await runAllGuards(ctx, ctx.workspace);
  if (guardResult) {
    if (guardResult.reason?.includes("escalation")) {
      return guardResult;
    }
    if (guardResult.reason?.includes("credits") || guardResult.reason?.includes("blocked") || guardResult.reason?.includes("window")) {
      return guardResult;
    }
  }
  return { handled: false };
}

// supabase/functions/agent-orchestrator/lib/hf-embeddings.ts
var model = new Supabase.ai.Session("gte-small");
async function generateEmbedding(text) {
  try {
    const embedding = await model.run(text, {
      mean_pool: true,
      normalize: true
    });
    return Array.from(embedding);
  } catch (error) {
    console.error("Embedding generation failed:", error);
    throw new Error("Embedding generation failed");
  }
}

// supabase/functions/agent-orchestrator/pipeline/t1-cache.ts
async function runT1(ctx) {
  const msgBytes = new TextEncoder().encode(ctx.payload.message.toLowerCase().trim().slice(0, 500));
  const hashBuf = await crypto.subtle.digest("SHA-256", msgBytes);
  const cacheKeyHex = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const { data: cached } = await ctx.supabase.from("kb_response_cache").select("response_text, access_count, id").eq("workspace_id", ctx.payload.workspace_id).eq("cache_key", cacheKeyHex).maybeSingle();
  if (cached) {
    await ctx.supabase.from("kb_response_cache").update({ accessed_at: (/* @__PURE__ */ new Date()).toISOString(), access_count: (cached.access_count || 0) + 1 }).eq("id", cached.id);
    return { handled: true, response: cached.response_text, reason: "cache_hit_exact" };
  }
  const workspace = ctx.workspace;
  if (!workspace?.kb_enabled) return { handled: false };
  try {
    const embedding = await generateEmbedding(ctx.payload.message);
    ctx.embedding = embedding;
    const { data: similar } = await ctx.supabase.rpc("match_kb_chunks", {
      query_embedding: embedding,
      match_threshold: 0.92,
      match_count: 1,
      p_workspace_id: ctx.payload.workspace_id
    });
    if (similar && similar.length > 0 && similar[0].similarity > 0.92) {
      return { handled: true, response: similar[0].content || similar[0].response_text, reason: "cache_hit_embedding" };
    }
  } catch (_) {
  }
  return { handled: false };
}

// supabase/functions/agent-orchestrator/tools/impl/kb.ts
async function matchChunks(params, ctx) {
  if (ctx.kbSearchPromise && params.query.trim().toLowerCase() === ctx.payload.message.trim().toLowerCase()) {
    return ctx.kbSearchPromise;
  }
  let embedding;
  try {
    if (ctx.embedding && params.query.trim().toLowerCase() === ctx.payload.message.trim().toLowerCase()) {
      embedding = ctx.embedding;
    } else {
      embedding = await generateEmbedding(params.query);
    }
  } catch {
    return { kb_chunks: [] };
  }
  const { data: kb, error } = await ctx.supabase.rpc("match_kb_chunks", {
    query_embedding: embedding,
    match_threshold: 0.75,
    match_count: 5,
    p_workspace_id: ctx.payload.workspace_id
  });
  if (error) {
    console.error("[KB] match_kb_chunks RPC error:", error.message);
    return { kb_chunks: [] };
  }
  return { kb_chunks: kb || [] };
}

// supabase/functions/agent-orchestrator/pipeline/t2-router.ts
var BOOKING_KEYWORDS = [
  "book",
  "appointment",
  "schedule",
  "reserve",
  "slot",
  "booking",
  "appoint",
  "fix appointment",
  "set appointment",
  "consultation",
  "checkup",
  "check up"
];
var SALES_KEYWORDS = [
  "order",
  "buy",
  "purchase",
  "price",
  "pricing",
  "cost",
  "menu",
  "how much",
  "rate",
  "quote",
  "payment",
  "pay",
  "offer",
  "discount",
  "deal",
  "product",
  "service list",
  "what do you sell",
  "b2b",
  "tiers",
  "subscription",
  "plan",
  "enterprise",
  "integration"
];
async function runT2(ctx) {
  const msgLower = ctx.payload.message.toLowerCase();
  const { data: activeAgentRows } = await ctx.supabase.from("workspace_agents").select("agent_type").eq("workspace_id", ctx.session.workspace_id).eq("status", "active").is("deleted_at", null);
  const activeAgents = new Set(activeAgentRows?.map((a) => a.agent_type) || []);
  const { data: bookingState } = await ctx.supabase.from("booking_sessions").select("state").eq("session_id", ctx.session.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const midBooking = bookingState && !["idle", "booked", "cancelled"].includes(bookingState.state);
  const managementKeywords = ["reschedule", "move", "cancel", "change", "rebook", "re-schedule", "modify"];
  const hasManagementIntent = managementKeywords.some((kw) => msgLower.includes(kw));
  if (midBooking) {
    ctx.agentType = "appointment_booking";
    ctx.routingReason = "mid_booking";
  } else {
    const channel = ctx.payload.source || ctx.payload.channel;
    if (channel === "widget") {
      if (midBooking) {
        ctx.agentType = "appointment_booking";
        ctx.routingReason = "mid_booking";
      } else if (activeAgents.has("appointment_booking") && BOOKING_KEYWORDS.some((k) => msgLower.includes(k))) {
        ctx.agentType = "appointment_booking";
        ctx.routingReason = "keyword_booking";
        if (hasManagementIntent) ctx.routingReason = "management_intent";
      } else if (ctx.session.agent_type && activeAgents.has(ctx.session.agent_type)) {
        ctx.agentType = ctx.session.agent_type;
        ctx.routingReason = "session_continuity";
      } else if (activeAgents.has("customer_support")) {
        ctx.agentType = "customer_support";
        ctx.routingReason = "default_fallback";
      } else {
        return {
          handled: true,
          response: "I'm sorry, I'm not equipped to handle that type of request. Please contact the business directly for assistance.",
          reason: "no_matching_agent"
        };
      }
    } else {
      if (activeAgents.has("appointment_booking") && BOOKING_KEYWORDS.some((k) => msgLower.includes(k))) {
        ctx.agentType = "appointment_booking";
        ctx.routingReason = "keyword_booking";
        if (hasManagementIntent) ctx.routingReason = "management_intent";
      } else if (activeAgents.has("sales") && SALES_KEYWORDS.some((k) => msgLower.includes(k))) {
        ctx.agentType = "sales";
        ctx.routingReason = "keyword_sales";
      } else if (ctx.session.agent_type && activeAgents.has(ctx.session.agent_type) && ctx.session.message_count >= 1) {
        ctx.agentType = ctx.session.agent_type;
        ctx.routingReason = "session_continuity";
      } else if (activeAgents.has("customer_support")) {
        ctx.agentType = "customer_support";
        ctx.routingReason = "default_fallback";
      } else {
        return {
          handled: true,
          response: "I'm sorry, I'm not equipped to handle that type of request. Please contact the business directly for assistance.",
          reason: "no_matching_agent"
        };
      }
    }
  }
  if (hasManagementIntent && ctx.agentType === "appointment_booking") {
    ctx.routingReason = "management_priority";
  }
  if (ctx.agentType === "customer_support" && ctx.workspace?.kb_enabled) {
    ctx.kbSearchPromise = matchChunks({ query: ctx.payload.message }, ctx);
  }
  return { handled: false };
}

// supabase/functions/agent-orchestrator/lib/llm.ts
var GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
var GROQ_BASE_URL = "https://api.groq.com/openai/v1";
async function callLLM(payload) {
  const PRIMARY = "llama-3.3-70b-versatile";
  const FALLBACK_1 = "llama-3.1-8b-instant";
  const FALLBACK_2 = "meta-llama/llama-4-scout-17b-16e-instruct";
  for (const model2 of [PRIMARY, FALLBACK_1, FALLBACK_2]) {
    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        return await callGroq({ ...payload, model: model2 });
      } catch (error) {
        const status = error.status;
        const isRetryable = status === 429 || status === 500 || status === 502 || status === 503;
        if (!isRetryable) throw error;
        if (attempt < 2) {
          const backoff = (status === 429 ? 1e3 : 500) * Math.pow(2, attempt);
          await new Promise((res) => setTimeout(res, backoff));
        }
      }
    }
  }
  throw new Error("ALL_MODELS_FAILED");
}
async function callGroq(payload) {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not set");
  const body = {
    model: payload.model,
    messages: payload.system ? [{ role: "system", content: payload.system }, ...payload.messages] : payload.messages,
    max_tokens: payload.max_tokens ?? 800,
    temperature: payload.temperature ?? 0.3
  };
  if (payload.response_format) body.response_format = payload.response_format;
  if (payload.tools) body.tools = payload.tools;
  if (payload.tool_choice) body.tool_choice = payload.tool_choice;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2e4);
  try {
    const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const e = new Error(err.error?.message ?? "Groq error");
      e.status = res.status;
      throw e;
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// supabase/functions/agent-orchestrator/tools/impl/google.ts
async function getGoogleConfig(supabase, workspace_id) {
  const { data: config } = await supabase.from("google_oauth_tokens").select("*").eq("workspace_id", workspace_id).is("deleted_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!config) throw new Error("Google integration not found");
  const now = /* @__PURE__ */ new Date();
  const expiry = new Date(config.token_expiry);
  if (expiry.getTime() - now.getTime() < 5 * 60 * 1e3) {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: Deno.env.get("GOOGLE_CLIENT_ID"),
        client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET"),
        refresh_token: config.refresh_token,
        grant_type: "refresh_token"
      })
    });
    const newTokens = await response.json();
    if (!response.ok) {
      if (newTokens?.error === "invalid_grant") {
        await supabase.from("google_oauth_tokens").update({ deleted_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("workspace_id", workspace_id);
      }
      throw new Error("Failed to refresh Google token");
    }
    const newExpiry = new Date(Date.now() + newTokens.expires_in * 1e3).toISOString();
    await supabase.from("google_oauth_tokens").update({ access_token: newTokens.access_token, token_expiry: newExpiry }).eq("workspace_id", workspace_id);
    return { ...config, access_token: newTokens.access_token };
  }
  return config;
}

// supabase/functions/agent-orchestrator/tools/impl/calendar.ts
var IST_OFFSET = 5.5 * 60 * 60 * 1e3;
function parseDT(dStr, tStr) {
  const months = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11
  };
  const istNow = new Date(Date.now() + IST_OFFSET);
  let y = istNow.getUTCFullYear();
  let mo = istNow.getUTCMonth();
  let d = istNow.getUTCDate();
  if (dStr) {
    const s = dStr.toLowerCase().trim();
    if (s.includes("tomorrow") || s === "tom") {
      const t = new Date(istNow.getTime() + 864e5);
      y = t.getUTCFullYear();
      mo = t.getUTCMonth();
      d = t.getUTCDate();
    } else if (s.includes("today")) {
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const p = s.split("-").map(Number);
      y = p[0];
      mo = p[1] - 1;
      d = p[2];
    } else {
      const dm = s.match(/(\d{1,2})(?:st|nd|rd|th)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
      const md = s.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*(\d{1,2})(?:st|nd|rd|th)?/i);
      if (dm) {
        d = parseInt(dm[1]);
        mo = months[dm[2].toLowerCase().slice(0, 3)];
      } else if (md) {
        mo = months[md[1].toLowerCase().slice(0, 3)];
        d = parseInt(md[2]);
      }
    }
  }
  let h = 10, mi = 0;
  if (tStr) {
    const ts = tStr.toLowerCase().trim();
    if (ts.includes("afternoon") || ts.includes("noon")) {
      h = 14;
      mi = 0;
    } else if (ts.includes("evening")) {
      h = 18;
      mi = 0;
    } else if (ts.includes("morning")) {
      h = 9;
      mi = 0;
    } else if (ts.includes("night")) {
      h = 20;
      mi = 0;
    } else {
      const mt = ts.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      if (mt) {
        h = parseInt(mt[1]);
        mi = mt[2] ? parseInt(mt[2]) : 0;
        const a = mt[3]?.toLowerCase();
        if (a === "pm" && h < 12) h += 12;
        if (a === "am" && h === 12) h = 0;
      }
    }
  }
  return new Date(Date.UTC(y, mo, d, h, mi) - IST_OFFSET).toISOString();
}
function formatIST(isoString) {
  const d = new Date(isoString);
  const ist = new Date(d.getTime() + IST_OFFSET);
  const datePart = ist.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const timePart = ist.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
  return `${datePart} at ${timePart} IST`;
}
async function checkAvailability(params, ctx) {
  const startAt = parseDT(params.date, params.time);
  try {
    const gConfig = await getGoogleConfig(ctx.supabase, ctx.payload.workspace_id);
    const gRes = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: { Authorization: `Bearer ${gConfig.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        timeMin: startAt,
        timeMax: new Date(new Date(startAt).getTime() + 7 * 24 * 60 * 60 * 1e3).toISOString(),
        items: [{ id: gConfig.calendar_id || "primary" }]
      })
    });
    if (gRes.ok) {
      const data = await gRes.json();
      return { availability: data.calendars[gConfig.calendar_id || "primary"]?.busy || [], requested_time: startAt };
    }
  } catch (_) {
  }
  return { availability: [], requested_time: startAt, note: "Calendar unavailable \u2014 assuming slot is free" };
}
async function createAppointment(params, ctx) {
  const rawName = params.name?.toString().trim();
  const PLACEHOLDER_NAMES = ["your name", "name", "customer", "guest", "null", "none", "n/a", "unknown"];
  if (!rawName || rawName.length < 2 || PLACEHOLDER_NAMES.includes(rawName.toLowerCase())) {
    return { error: "I need your full name to book the appointment. Please tell me your name." };
  }
  const customerName = rawName;
  if (!params.service?.toString().trim()) {
    return { error: "Service is required. Ask the customer what service they'd like to book." };
  }
  const { data: existingAppt } = await ctx.supabase.from("appointments").select("id, start_at, service").eq("session_id", ctx.session.id).not("status", "eq", "cancelled").maybeSingle();
  if (existingAppt) {
    return { id: existingAppt.id, start_at: existingAppt.start_at, service: existingAppt.service, customer_name: customerName, note: "Already booked for this session." };
  }
  const startAt = parseDT(params.date, params.time);
  const endAt = new Date(new Date(startAt).getTime() + 30 * 60 * 1e3).toISOString();
  const { data: slotTaken } = await ctx.supabase.from("appointments").select("id").eq("workspace_id", ctx.payload.workspace_id).eq("start_at", startAt).not("status", "eq", "cancelled").maybeSingle();
  if (slotTaken) {
    return { error: "That time slot has already been booked. Please suggest an alternative time." };
  }
  const { data: curSession } = await ctx.supabase.from("conversation_sessions").select("contact_id, customer_jid").eq("id", ctx.session.id).single();
  const jidPhone = curSession?.customer_jid?.split("@")[0] || null;
  const customerPhone = params.phone && /^\d{7,15}$/.test(params.phone.replace(/\D/g, "")) ? params.phone : jidPhone;
  const customerEmail = params.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.email) ? params.email : null;
  const { data: appt, error: insertErr } = await ctx.supabase.from("appointments").insert({
    workspace_id: ctx.payload.workspace_id,
    session_id: ctx.session.id,
    contact_id: curSession?.contact_id || null,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: customerEmail,
    service: params.service,
    start_at: startAt,
    end_at: endAt,
    status: "confirmed"
  }).select().single();
  if (insertErr || !appt) {
    return { error: "Failed to save appointment. Please try again." };
  }
  let googleEventId = null;
  let meetLink = null;
  try {
    const gConfig = await getGoogleConfig(ctx.supabase, ctx.payload.workspace_id);
    const gRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${gConfig.calendar_id || "primary"}/events?conferenceDataVersion=1`, {
      method: "POST",
      headers: { Authorization: `Bearer ${gConfig.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: `${params.service || "Appointment"}: ${params.name || "Customer"}`,
        description: `Customer: ${params.name || "N/A"}
Phone: ${params.phone || "N/A"}
Email: ${params.email || "N/A"}
Service: ${params.service || "N/A"}
Session: ${ctx.session.id}`,
        start: { dateTime: startAt },
        end: { dateTime: endAt },
        conferenceData: { createRequest: { requestId: `fc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}` } }
      })
    });
    if (gRes.ok) {
      const gEvent = await gRes.json();
      googleEventId = gEvent.id;
      meetLink = gEvent.hangoutLink || gEvent.conferenceData?.entryPoints?.[0]?.uri || null;
      await ctx.supabase.from("appointments").update({ google_event_id: googleEventId, meeting_link: meetLink }).eq("id", appt.id);
    }
  } catch (_) {
  }
  if (params.email && curSession?.contact_id) {
    await ctx.supabase.from("contacts").update({ email: params.email, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", curSession.contact_id);
  }
  await ctx.supabase.from("booking_sessions").update({ appointment_id: appt.id, state: "booked", updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("session_id", ctx.session.id).is("deleted_at", null);
  EdgeRuntime.waitUntil(sendAppointmentNotifications(ctx, appt, meetLink));
  return appt;
}
async function sendAppointmentNotifications(ctx, appt, meetLink) {
  await Promise.allSettled([
    sendAppointmentWhatsApp(ctx, appt, meetLink),
    sendAppointmentEmail(ctx, appt, meetLink)
  ]);
}
async function sendAppointmentWhatsApp(ctx, appt, meetLink) {
  try {
    const { data: sessionData } = await ctx.supabase.from("conversation_sessions").select("customer_jid, contact:contacts(phone), gowa_session:gowa_sessions!workspace_id(gowa_session_id)").eq("id", ctx.session.id).eq("workspace_id", ctx.payload.workspace_id).single();
    if (!sessionData) return;
    const deviceId = sessionData.gowa_session?.gowa_session_id;
    if (!deviceId) return;
    let phone = appt.customer_phone;
    if (!phone || !/^\d{7,15}$/.test(phone.replace(/\D/g, ""))) {
      phone = sessionData.customer_jid?.split("@")[0] || sessionData.contact?.phone;
    }
    if (!phone) return;
    const gowaBase = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "");
    const gowaKey = Deno.env.get("GOWA_API_KEY");
    if (!gowaBase || !gowaKey) return;
    const auth = btoa(gowaKey);
    const formattedDate = formatIST(appt.start_at);
    let message = `\u2705 Appointment Confirmed!

Hi ${appt.customer_name},

Your appointment has been confirmed:
\u2022 Service: ${appt.service}
\u2022 Date: ${formattedDate}`;
    if (meetLink) message += `
\u2022 Google Meet: ${meetLink}`;
    message += `

Thank you!`;
    await fetch(`${gowaBase}/send/message`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", "X-Device-Id": deviceId },
      body: JSON.stringify({ phone, message })
    });
  } catch (_) {
  }
}
async function sendAppointmentEmail(ctx, appt, meetLink) {
  try {
    const { data: notifPref } = await ctx.supabase.from("workspace_notifications").select("email_on_booking").eq("workspace_id", ctx.payload.workspace_id).maybeSingle();
    if (notifPref && notifPref.email_on_booking === false) return;
    const { data: workspaceData } = await ctx.supabase.from("workspaces").select("name, session:conversation_sessions!workspace_id(contact:contacts(email))").eq("id", ctx.payload.workspace_id).eq("session.id", ctx.session.id).single();
    if (!workspaceData) return;
    const email = appt.customer_email || workspaceData.session?.[0]?.contact?.email;
    if (!email) return;
    const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://7flowcore.vercel.app";
    const workspaceName = workspaceData.name || "FlowCore";
    const formattedDate = formatIST(appt.start_at);
    const cronSecret = Deno.env.get("INTERNAL_CRON_SECRET") || "";
    await fetch(`${appUrl}/api/emails/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cronSecret}` },
      body: JSON.stringify({
        to: email,
        subject: `Appointment Confirmed \u2014 ${workspaceName}`,
        template: "appointment",
        data: { customerName: appt.customer_name, workspaceName, service: appt.service, date: formattedDate, meetLink }
      })
    });
  } catch (_) {
  }
}
async function updateAppointment(params, ctx) {
  let { data: existing } = await ctx.supabase.from("appointments").select("*").eq("id", params.appointment_id).maybeSingle();
  if (!existing) {
    const { data: all } = await ctx.supabase.from("appointments").select("*").eq("workspace_id", ctx.payload.workspace_id).gte("start_at", new Date(Date.now() - 7 * 864e5).toISOString()).order("created_at", { ascending: false });
    const match = (all || []).find((a) => a.id.toLowerCase().startsWith(params.appointment_id.toLowerCase()));
    if (!match) return { error: "Appointment not found." };
    existing = match;
  }
  const startAt = params.date || params.time ? parseDT(params.date, params.time) : existing.start_at;
  const durationMs = (params.duration || 30) * 6e4;
  const endAt = new Date(new Date(startAt).getTime() + durationMs).toISOString();
  const { data: updated } = await ctx.supabase.from("appointments").update({
    customer_name: params.name || existing.customer_name,
    service: params.service || existing.service,
    start_at: startAt,
    end_at: endAt,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", params.appointment_id).select().single();
  let syncStatus = null;
  if (existing.google_event_id) {
    try {
      const gConfig = await getGoogleConfig(ctx.supabase, ctx.payload.workspace_id);
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/${gConfig.calendar_id || "primary"}/events/${existing.google_event_id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${gConfig.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ start: { dateTime: startAt }, end: { dateTime: endAt } })
      });
    } catch (e) {
      console.error(`[Calendar] Google Calendar update failed for ${existing.google_event_id}:`, e.message);
      syncStatus = "failed_sync";
      await ctx.supabase.from("appointments").update({ sync_status: "failed_sync" }).eq("id", params.appointment_id);
    }
  }
  return { ...updated, sync_status: syncStatus };
}
async function cancelAppointment(params, ctx) {
  let { data: appt } = await ctx.supabase.from("appointments").select("*").eq("id", params.appointment_id).maybeSingle();
  if (!appt) {
    const { data: all } = await ctx.supabase.from("appointments").select("*").eq("workspace_id", ctx.payload.workspace_id).gte("start_at", new Date(Date.now() - 7 * 864e5).toISOString()).order("created_at", { ascending: false });
    const match = (all || []).find((a) => a.id.toLowerCase().startsWith(params.appointment_id.toLowerCase()));
    if (!match) return { error: "Appointment not found." };
    appt = match;
  }
  await ctx.supabase.from("appointments").update({ status: "cancelled", updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", params.appointment_id);
  if (appt.google_event_id) {
    try {
      const gConfig = await getGoogleConfig(ctx.supabase, ctx.payload.workspace_id);
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${gConfig.calendar_id || "primary"}/events/${appt.google_event_id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${gConfig.access_token}` } }
      );
    } catch (e) {
      console.error(`[Calendar] Google Calendar delete failed for ${appt.google_event_id}:`, e.message);
      await ctx.supabase.from("appointments").update({ sync_status: "failed_sync" }).eq("id", params.appointment_id);
    }
  }
  return { success: true };
}

// supabase/functions/agent-orchestrator/tools/executor.ts
init_contact();

// supabase/functions/agent-orchestrator/tools/impl/crm.ts
async function captureLead(params, ctx) {
  const { data: contact } = await ctx.supabase.from("contacts").upsert({
    workspace_id: ctx.payload.workspace_id,
    name: params.name,
    email: params.email,
    phone: params.phone,
    notes: params.notes
  }).select().single();
  let sessionLinked = false;
  if (contact?.id) {
    const { error: linkError } = await ctx.supabase.from("conversation_sessions").update({ contact_id: contact.id, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", ctx.session.id);
    sessionLinked = !linkError;
  }
  try {
    const gConfig = await getGoogleConfig(ctx.supabase, ctx.payload.workspace_id);
    if (gConfig?.sheet_id) {
      const sheetRange = gConfig.sheet_range ?? "Sheet1!A:Z";
      const row = [params.name ?? "", params.email ?? "", params.phone ?? "", "", "", (/* @__PURE__ */ new Date()).toISOString(), (/* @__PURE__ */ new Date()).toISOString()];
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${gConfig.sheet_id}/values/${sheetRange}:append?valueInputOption=USER_ENTERED`, {
        method: "POST",
        headers: { Authorization: `Bearer ${gConfig.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [row] })
      });
    }
  } catch (_) {
  }
  return {
    success: true,
    contact_id: contact?.id,
    session_linked: sessionLinked,
    ...sessionLinked ? {} : { warning: "Contact saved but failed to link to session" }
  };
}
async function updateLeadStage(params, ctx) {
  const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
  if (!session?.contact_id) return { error: "Contact not found" };
  await ctx.supabase.from("contacts").update({
    pipeline_stage: params.stage,
    notes: params.notes ? `[Stage: ${params.stage}] ${params.notes}` : void 0,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", session.contact_id);
  return { success: true, stage: params.stage };
}
async function getPipeline(params, ctx) {
  const stages = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
  const { data: contacts } = await ctx.supabase.from("contacts").select("pipeline_stage").eq("workspace_id", ctx.payload.workspace_id).not("pipeline_stage", "is", null).in("pipeline_stage", stages);
  const counts = {};
  for (const s of stages) counts[s] = 0;
  for (const c of contacts || []) {
    if (c.pipeline_stage) counts[c.pipeline_stage] = (counts[c.pipeline_stage] || 0) + 1;
  }
  return { success: true, pipeline: counts };
}
async function scheduleFollowUp(params, ctx) {
  const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
  const scheduledAt = new Date(Date.now() + (params.hours || 24) * 36e5).toISOString();
  const { data: followUp } = await ctx.supabase.from("follow_ups").insert({
    workspace_id: ctx.payload.workspace_id,
    contact_id: session?.contact_id || null,
    session_id: ctx.session.id,
    scheduled_at: scheduledAt,
    message_template: params.message || "Hi! Just following up on our conversation. Let me know if you need any help!",
    status: "pending"
  }).select().single();
  return { success: true, follow_up_id: followUp?.id, scheduled_at: scheduledAt };
}
async function generateQuote(params, ctx) {
  const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id, customer_name, customer_jid").eq("id", ctx.session.id).single();
  if (!session) return { error: "Session not found" };
  const subtotal = (params.items || []).reduce((sum, item) => sum + (item.qty || 1) * (item.price || 0), 0);
  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const total = subtotal + tax;
  const quoteNumber = `Q-${Date.now().toString(36).toUpperCase()}`;
  const { data: quote } = await ctx.supabase.from("quotes").insert({
    workspace_id: ctx.payload.workspace_id,
    contact_id: session.contact_id || null,
    quote_number: quoteNumber,
    items: params.items,
    subtotal,
    tax,
    total,
    status: "draft",
    notes: params.notes || null,
    valid_until: new Date(Date.now() + 30 * 864e5).toISOString().split("T")[0]
  }).select().single();
  const quoteText = `*Quote ${quoteNumber}*

${(params.items || []).map((i) => `${i.name} \xD7 ${i.qty || 1} = \u20B9${((i.qty || 1) * i.price).toLocaleString()}`).join("\n")}

Subtotal: \u20B9${subtotal.toLocaleString()}
Tax (18%): \u20B9${tax.toLocaleString()}
*Total: \u20B9${total.toLocaleString()}*

Valid until: ${new Date(Date.now() + 30 * 864e5).toLocaleDateString()}`;
  return { success: true, quote_id: quote?.id, quote_number: quoteNumber, total, quote_text: quoteText };
}

// supabase/functions/agent-orchestrator/tools/impl/order.ts
async function searchMenu(params, ctx) {
  const generic = ["menu", "services", "list", "all", "everything", "show", "available", ""];
  const isGeneric = !params.query || generic.includes(params.query?.toString().toLowerCase().trim());
  let query = ctx.supabase.from("menu_items").select("id, name, description, price, category").eq("workspace_id", ctx.payload.workspace_id).eq("is_available", true);
  if (!isGeneric && params.query) {
    query = query.or(`name.ilike.%${params.query}%,category.ilike.%${params.query}%,description.ilike.%${params.query}%`);
  }
  if (params.category) query = query.eq("category", params.category);
  const { data: items } = await query.order("name").limit(20);
  return { success: true, items: items || [] };
}
async function sendMenuMedia(params, ctx) {
  try {
    const { data: media } = await ctx.supabase.from("menu_media").select("file_path, file_type, file_name").eq("workspace_id", ctx.payload.workspace_id).is("deleted_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!media) {
      const searchResult = await searchMenu({ query: "", category: void 0 }, ctx);
      return { success: true, auto_fallback: true, items: searchResult.items, message: "No uploaded menu image. Here are our items instead." };
    }
    if (ctx.payload.is_test) {
      const fileUrl2 = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/menu-media/${media.file_path}`;
      return { success: true, message: "Menu sent.", media_info: { file_name: media.file_name, file_type: media.file_type, url: fileUrl2, type: media.file_type.startsWith("image/") ? "image" : "document" } };
    }
    const gowaBase = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "");
    const gowaKey = Deno.env.get("GOWA_API_KEY");
    if (!gowaBase || !gowaKey) return { success: false, error: "WhatsApp not configured" };
    const { data: sessionData } = await ctx.supabase.from("conversation_sessions").select("customer_jid, contact:contacts(phone), gowa_session:gowa_sessions!workspace_id(gowa_session_id)").eq("id", ctx.session.id).eq("workspace_id", ctx.payload.workspace_id).single();
    if (!sessionData) return { success: false, error: "Session not found" };
    const deviceId = sessionData.gowa_session?.gowa_session_id;
    if (!deviceId) return { success: false, error: "WhatsApp device not connected" };
    let phone = sessionData.customer_jid?.split("@")[0] || sessionData.contact?.phone;
    if (!phone) return { success: false, error: "Customer phone not found" };
    const fileUrl = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/menu-media/${media.file_path}`;
    const auth = btoa(gowaKey);
    const formattedPhone = formatPhoneForGoWA(phone);
    const caption = params.caption || "Here is our menu \u2014 take a look!";
    const isImage = media.file_type.startsWith("image/");
    let resp;
    if (isImage) {
      resp = await fetch(`${gowaBase}/send/image`, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", "X-Device-Id": deviceId },
        body: JSON.stringify({ phone: formattedPhone, image_url: fileUrl, caption })
      });
    } else {
      resp = await fetch(`${gowaBase}/send/message`, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", "X-Device-Id": deviceId },
        body: JSON.stringify({ phone: formattedPhone, message: `${caption}

\u{1F4C4} View Menu: ${fileUrl}` })
      });
    }
    if (!resp.ok) return { success: false, error: "Failed to send menu via WhatsApp" };
    return { success: true, message: "Menu sent to customer via WhatsApp." };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
async function createOrder(params, ctx) {
  const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
  const { data: workspace } = await ctx.supabase.from("workspaces").select("upi_id").eq("id", ctx.payload.workspace_id).single();
  const rawItems = params.items || [];
  const items = Array.isArray(rawItems) ? rawItems : [];
  const { data: menuItems } = await ctx.supabase.from("menu_items").select("id, name, price").eq("workspace_id", ctx.payload.workspace_id).eq("is_available", true);
  const menuMap = /* @__PURE__ */ new Map();
  const menuIdMap = /* @__PURE__ */ new Map();
  if (menuItems) {
    for (const mi of menuItems) {
      menuMap.set(mi.name.toLowerCase(), Number(mi.price));
      menuIdMap.set(mi.id, Number(mi.price));
    }
  }
  for (const item of items) {
    let dbPrice;
    if (item.menu_item_id && menuIdMap.has(item.menu_item_id)) {
      dbPrice = menuIdMap.get(item.menu_item_id);
    } else if (item.name) {
      const itemName = item.name.toLowerCase().trim();
      for (const [menuName, price] of menuMap) {
        if (menuName.includes(itemName) || itemName.includes(menuName.split("(")[0].trim())) {
          dbPrice = price;
          break;
        }
      }
    }
    if (dbPrice !== void 0) item.price = dbPrice;
  }
  const subtotal = items.reduce((sum, i) => sum + (i.qty || 1) * (i.price || 0), 0);
  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const total = subtotal + tax;
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
  const upiId = workspace?.upi_id || "flowcoreai@upi";
  const upiLink = `upi://pay?pa=${upiId}&am=${total}&tn=Order%20${orderNumber}&cu=INR`;
  const { data: order } = await ctx.supabase.from("orders").insert({
    workspace_id: ctx.payload.workspace_id,
    contact_id: session?.contact_id || null,
    session_id: ctx.session.id,
    order_number: orderNumber,
    items,
    subtotal,
    tax,
    total,
    status: "pending",
    upi_link: upiLink,
    notes: params.notes || null
  }).select().single();
  const orderText = `*Order ${orderNumber}*

${items.map((i) => `${i.name} \xD7 ${i.qty || 1} = \u20B9${((i.qty || 1) * i.price).toLocaleString()}`).join("\n")}

Subtotal: \u20B9${subtotal.toLocaleString()}
Tax (18%): \u20B9${tax.toLocaleString()}
*Total: \u20B9${total.toLocaleString()}*

*Pay via UPI:* ${upiLink}

Reply with your payment confirmation or ask for help.`;
  return { success: true, order_id: order?.id, order_number: orderNumber, total, upi_link: upiLink, order_text: orderText };
}
async function confirmPayment(params, ctx) {
  let orderId = params.order_id || "";
  let orderNum = params.order_number || "";
  if (!orderId && !orderNum) return { error: "Provide order_id or order_number" };
  if (orderId && orderId.startsWith("ORD-")) {
    orderNum = orderId;
    orderId = "";
  }
  let query = ctx.supabase.from("orders").update({
    status: "paid",
    payment_method: params.payment_method || "upi",
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("workspace_id", ctx.payload.workspace_id);
  if (orderId) query = query.eq("id", orderId);
  else query = query.eq("order_number", orderNum);
  const { data: order } = await query.select().single();
  if (!order) return { error: "Order not found" };
  return { success: true, order_id: order.id, order_number: order.order_number, status: "paid" };
}
async function getOrderStatus(params, ctx) {
  let orderId = params.order_id || "";
  let orderNum = params.order_number || "";
  if (!orderId && !orderNum) return { error: "Provide order_id or order_number" };
  if (orderId && orderId.startsWith("ORD-")) {
    orderNum = orderId;
    orderId = "";
  }
  let query = ctx.supabase.from("orders").select("*").eq("workspace_id", ctx.payload.workspace_id);
  if (orderId) query = query.eq("id", orderId);
  else query = query.eq("order_number", orderNum);
  const { data: order } = await query.single();
  if (!order) return { error: "Order not found" };
  return { success: true, order_number: order.order_number, status: order.status, total: order.total, items: order.items, upi_link: order.upi_link, created_at: order.created_at };
}
function formatPhoneForGoWA(phone) {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) cleaned = "91" + cleaned;
  return cleaned;
}

// supabase/functions/agent-orchestrator/tools/impl/handoff.ts
async function requestHandoff(params, ctx) {
  return {
    handoff_to: params.target_agent,
    handoff_reason: params.reason || "",
    handoff_context: params.context || ""
  };
}

// supabase/functions/agent-orchestrator/tools/impl/support-ticket.ts
async function createTicket(params, ctx) {
  if (!params.subject) return { error: "Subject is required" };
  const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
  const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
  const { data: ticket, error } = await ctx.supabase.from("support_tickets").insert({
    workspace_id: ctx.payload.workspace_id,
    session_id: ctx.session.id,
    contact_id: session?.contact_id || null,
    ticket_number: ticketNumber,
    subject: params.subject,
    description: params.description || "",
    priority: params.priority || "normal",
    status: "open"
  }).select().single();
  if (error) {
    console.error("[createTicket] DB insert failed:", error.message);
    return { error: "Failed to create support ticket. Please try again." };
  }
  return {
    success: true,
    ticket_id: ticket?.id,
    ticket_number: ticketNumber,
    status: "open",
    priority: params.priority || "normal"
  };
}
async function getTicketStatus(params, ctx) {
  if (!params.ticket_number && !params.ticket_id) {
    return { error: "ticket_number or ticket_id is required" };
  }
  let query = ctx.supabase.from("support_tickets").select("ticket_number, subject, status, priority, resolution_notes, created_at, updated_at").eq("workspace_id", ctx.payload.workspace_id);
  if (params.ticket_number) {
    query = query.eq("ticket_number", params.ticket_number);
  } else if (params.ticket_id) {
    query = query.eq("id", params.ticket_id);
  }
  const { data: ticket, error } = await query.single();
  if (error || !ticket) {
    return { error: "Ticket not found or access denied." };
  }
  return ticket;
}

// supabase/functions/agent-orchestrator/tools/impl/business-profile.ts
async function getBusinessProfile(params, ctx) {
  const { data: workspace, error } = await ctx.supabase.from("workspaces").select("business_profile").eq("id", ctx.payload.workspace_id).maybeSingle();
  if (error) {
    console.error("[BusinessProfile] Query error:", error.message);
    return { business_profile: null, success: false, error: error.message };
  }
  const profile = workspace?.business_profile;
  if (!profile) {
    return { business_profile: null, success: true };
  }
  if (params.sections && params.sections.length > 0) {
    const filtered = {};
    for (const section of params.sections) {
      if (profile[section] !== void 0) {
        filtered[section] = profile[section];
      }
    }
    return { business_profile: filtered, success: true };
  }
  return { business_profile: profile, success: true };
}

// supabase/functions/agent-orchestrator/tools/executor.ts
var TOOL_RATE_LIMITS = {
  check_availability: 5,
  create_appointment: 2,
  create_order: 3,
  confirm_payment: 3,
  match_kb_chunks: 10,
  send_menu_media: 3,
  capture_lead: 2,
  request_handoff: 1,
  create_ticket: 3,
  get_business_profile: 10,
  get_ticket_status: 5
};
var countCache = /* @__PURE__ */ new WeakMap();
var toolExecutor = {
  async run(toolName, params, ctx) {
    const startTime = Date.now();
    let result;
    const limit = TOOL_RATE_LIMITS[toolName] ?? 20;
    if (limit > 0) {
      let counts = countCache.get(ctx);
      if (!counts) {
        const { data } = await ctx.supabase.from("tool_call_logs").select("tool_name").eq("session_id", ctx.session.id).gte("created_at", new Date(Date.now() - 36e5).toISOString());
        counts = {};
        data?.forEach((row) => {
          counts[row.tool_name] = (counts[row.tool_name] || 0) + 1;
        });
        countCache.set(ctx, counts);
      }
      const count = counts[toolName] || 0;
      if (count >= limit) {
        return { success: false, error: `Rate limit exceeded for ${toolName} (max ${limit}/hour)` };
      }
    }
    try {
      result = await routeToImpl(toolName, params, ctx);
    } catch (error) {
      result = { success: false, error: error.message };
    }
    await ctx.supabase.from("tool_call_logs").insert({
      session_id: ctx.session.id,
      workspace_id: ctx.payload.workspace_id,
      tool_name: toolName,
      args: params,
      result: result.data || result,
      error: result.error,
      success: !result.error,
      duration_ms: Date.now() - startTime
    });
    return result;
  }
};
async function routeToImpl(toolName, params, ctx) {
  switch (toolName) {
    case "match_kb_chunks":
      return matchChunks(params, ctx);
    case "check_availability":
      return checkAvailability(params, ctx);
    case "create_appointment":
      return createAppointment(params, ctx);
    case "update_appointment":
      return updateAppointment(params, ctx);
    case "cancel_appointment":
      return cancelAppointment(params, ctx);
    case "capture_lead":
      return captureLead(params, ctx);
    case "get_contact_history":
      return getHistory(params, ctx);
    case "update_contact":
      return update(params, ctx);
    case "search_menu":
      return searchMenu(params, ctx);
    case "send_menu_media":
      return sendMenuMedia(params, ctx);
    case "create_order":
      return createOrder(params, ctx);
    case "confirm_payment":
      return confirmPayment(params, ctx);
    case "get_order_status":
      return getOrderStatus(params, ctx);
    case "request_handoff":
      return requestHandoff(params, ctx);
    case "update_lead_stage":
      return updateLeadStage(params, ctx);
    case "get_pipeline":
      return getPipeline(params, ctx);
    case "schedule_follow_up":
      return scheduleFollowUp(params, ctx);
    case "generate_quote":
      return generateQuote(params, ctx);
    case "create_ticket":
      return createTicket(params, ctx);
    case "get_ticket_status":
      return getTicketStatus(params, ctx);
    case "get_business_profile":
      return getBusinessProfile(params, ctx);
    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}

// supabase/functions/agent-orchestrator/tools/registry.ts
var ALL_TOOLS = {
  match_kb_chunks: {
    name: "match_kb_chunks",
    description: "Search the business knowledge base for answers about services, policies, and general info.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query based on the user's question." }
      },
      required: ["query"]
    }
  },
  check_availability: {
    name: "check_availability",
    description: "Check Google Calendar for free/busy on a specific date or time range.",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string", description: "The date to check (e.g. '2026-05-12' or 'tomorrow')." },
        time: { type: "string", description: "Optional specific time to check." }
      },
      required: ["date"]
    }
  },
  create_appointment: {
    name: "create_appointment",
    description: "Book a new appointment. Only call AFTER collecting ALL required details and getting explicit confirmation.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Customer's actual name from conversation." },
        phone: { type: "string", description: "Customer's phone (optional, known on WhatsApp)." },
        email: { type: "string", description: "Customer's actual email from conversation." },
        service: { type: "string", description: "The service being booked." },
        date: { type: "string", description: "Date of appointment (e.g. '2026-05-20')." },
        time: { type: "string", description: "Time of appointment (e.g. '10am' or '14:00')." }
      },
      required: ["name", "service", "date", "time"]
    }
  },
  update_appointment: {
    name: "update_appointment",
    description: "Reschedule or modify an existing appointment.",
    parameters: {
      type: "object",
      properties: {
        appointment_id: { type: "string" },
        name: { type: "string" },
        service: { type: "string" },
        date: { type: "string" },
        time: { type: "string" },
        duration: { type: "number", description: "Duration in minutes (default 30)." }
      },
      required: ["appointment_id"]
    }
  },
  cancel_appointment: {
    name: "cancel_appointment",
    description: "Cancel an existing appointment.",
    parameters: {
      type: "object",
      properties: {
        appointment_id: { type: "string" },
        reason: { type: "string" }
      },
      required: ["appointment_id"]
    }
  },
  capture_lead: {
    name: "capture_lead",
    description: "Save customer contact information for sales follow-up.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        notes: { type: "string", description: "Context about the lead's interest." }
      },
      required: ["name"]
    }
  },
  request_handoff: {
    name: "request_handoff",
    description: "Transfer the conversation to a different specialist teammate.",
    parameters: {
      type: "object",
      properties: {
        target_agent: { type: "string", enum: ["customer_support", "sales", "appointment_booking"] },
        reason: { type: "string" },
        context: { type: "string", description: "Summary of relevant details for the receiving agent." }
      },
      required: ["target_agent", "reason"]
    }
  },
  get_contact_history: {
    name: "get_contact_history",
    description: "Retrieve full contact details and past appointment history.",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  update_contact: {
    name: "update_contact",
    description: "Update customer contact information during conversation.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        notes: { type: "string" }
      }
    }
  },
  update_lead_stage: {
    name: "update_lead_stage",
    description: "Move the current contact through the sales pipeline. Stages: new \u2192 contacted \u2192 qualified \u2192 proposal \u2192 negotiation \u2192 won/lost.",
    parameters: {
      type: "object",
      properties: {
        stage: { type: "string", enum: ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"] },
        notes: { type: "string" }
      },
      required: ["stage"]
    }
  },
  get_pipeline: {
    name: "get_pipeline",
    description: "Get an overview of all leads in the sales pipeline broken down by stage.",
    parameters: { type: "object", properties: {} }
  },
  schedule_follow_up: {
    name: "schedule_follow_up",
    description: "Schedule an automated WhatsApp follow-up message.",
    parameters: {
      type: "object",
      properties: {
        hours: { type: "number", description: "Hours from now." },
        message: { type: "string", description: "Content of the follow-up message." }
      },
      required: ["hours", "message"]
    }
  },
  generate_quote: {
    name: "generate_quote",
    description: "Generate a price quote for the current contact via WhatsApp.",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              qty: { type: "number" },
              price: { type: "number" }
            }
          }
        },
        notes: { type: "string" }
      },
      required: ["items"]
    }
  },
  search_menu: {
    name: "search_menu",
    description: "Browse or search available menu items/services. Omit query to see everything.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Optional search term." },
        category: { type: "string", description: "Optional category filter." }
      }
    }
  },
  send_menu_media: {
    name: "send_menu_media",
    description: "Send the uploaded menu image/PDF via WhatsApp. Auto-fallbacks to text menu if no image uploaded.",
    parameters: {
      type: "object",
      properties: {
        caption: { type: "string", description: "Optional caption." }
      }
    }
  },
  create_order: {
    name: "create_order",
    description: "Create a new order with items. Generates a UPI payment link automatically.",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              menu_item_id: { type: "string" },
              name: { type: "string" },
              qty: { type: "number" },
              price: { type: "number" }
            }
          }
        },
        notes: { type: "string" }
      },
      required: ["items"]
    }
  },
  confirm_payment: {
    name: "confirm_payment",
    description: "Mark an order as paid after the customer confirms payment.",
    parameters: {
      type: "object",
      properties: {
        order_id: { type: "string" },
        payment_method: { type: "string", enum: ["upi", "cash"] }
      },
      required: ["order_id"]
    }
  },
  get_order_status: {
    name: "get_order_status",
    description: "Check the status of an order by its ID.",
    parameters: {
      type: "object",
      properties: { order_id: { type: "string" } },
      required: ["order_id"]
    }
  },
  create_ticket: {
    name: "create_ticket",
    description: "Create a support ticket for issues that need tracking and follow-up.",
    parameters: {
      type: "object",
      properties: {
        subject: { type: "string", description: "Brief summary of the issue." },
        description: { type: "string", description: "Detailed description of the issue." },
        priority: { type: "string", enum: ["low", "normal", "high", "urgent"], description: "Priority level (default: normal)." }
      },
      required: ["subject"]
    }
  },
  get_business_profile: {
    name: "get_business_profile",
    description: "Retrieve the business profile (contact info, hours, policies, pricing, amenities) for this workspace.",
    parameters: {
      type: "object",
      properties: {
        sections: { type: "array", items: { type: "string" }, description: "Optional: specific sections to retrieve (e.g. ['contact', 'hours', 'policies']). Omit for full profile." }
      }
    }
  }
};
var AGENT_TOOLS = {
  customer_support: [
    "match_kb_chunks",
    "get_contact_history",
    "update_contact",
    "request_handoff",
    "create_ticket",
    "get_business_profile"
  ],
  appointment_booking: [
    "check_availability",
    "create_appointment",
    "update_appointment",
    "cancel_appointment",
    "get_contact_history",
    "update_contact",
    "request_handoff",
    "get_business_profile"
  ],
  sales: [
    "match_kb_chunks",
    "capture_lead",
    "get_contact_history",
    "update_contact",
    "update_lead_stage",
    "get_pipeline",
    "schedule_follow_up",
    "generate_quote",
    "search_menu",
    "send_menu_media",
    "create_order",
    "confirm_payment",
    "get_order_status",
    "request_handoff",
    "get_business_profile"
  ]
};
var SUBMIT_PLAN_TOOL = {
  type: "function",
  function: {
    name: "submit_plan",
    description: "Submit your final plan. CRITICAL: Every action you claim to perform (creating orders, confirming payments, capturing leads) MUST have a corresponding tool in the 'actions' array. Writing about it in 'response' does NOT execute it. Examples: ordering \u2192 add create_order to actions; payment \u2192 add confirm_payment to actions; lead \u2192 add capture_lead to actions.",
    parameters: {
      type: "object",
      properties: {
        response: { type: "string", description: "Natural language response to the user." },
        actions: {
          type: "array",
          description: "List of tools to execute. REQUIRED for booking, ordering, payment, lead capture, etc. CRITICAL: If your response says an action was completed (payment confirmed, lead saved, order created), the corresponding tool MUST be in this array.",
          items: {
            type: "object",
            properties: {
              tool: { type: "string", description: "Name of the tool to call." },
              params: { type: "object", description: "Arguments for the tool." },
              required: { type: "boolean", description: "If true, failure halts the response.", default: false },
              result_key: { type: "string", description: "Key to store the result for templating." }
            },
            required: ["tool", "params"]
          }
        },
        fallback: { type: "string", description: "Fallback message if tools fail." },
        needs_second_pass: {
          type: "boolean",
          description: "True if tool results are needed to write the natural response.",
          default: false
        }
      },
      required: ["response", "actions"]
    }
  }
};
function getAgentToolDefinitions(agentType) {
  const allowed = AGENT_TOOLS[agentType] || AGENT_TOOLS.customer_support;
  return allowed.map((name) => ({
    type: "function",
    function: {
      name: ALL_TOOLS[name].name,
      description: ALL_TOOLS[name].description,
      parameters: ALL_TOOLS[name].parameters
    }
  }));
}

// supabase/functions/agent-orchestrator/lib/persona.ts
function getPersonaInstructions(traits) {
  const baseConstraints = `
- NEVER identify as an AI, bot, or automated assistant. 
- Talk like a human employee on WhatsApp: use short, snappy sentences.
- Use natural conversational fillers sparingly (e.g., "Alright," "Got it," "Give me a sec").
- Use emojis naturally to keep it friendly (\u{1F44B}, \u2728, \u{1F44D}).
- Avoid formal bullet points; use plain text paragraphs or simple dashes.
- If you don't know something, don't apologize like a robot. Just say "I'm not 100% sure about that, let me check with the team."
`.trim();
  if (!traits) return baseConstraints;
  const inst = [baseConstraints];
  if (traits.tone === "friendly") inst.push("Keep the vibe warm and super welcoming.");
  else if (traits.tone === "professional") inst.push("Keep it polite and efficient, like a top-tier concierge.");
  else if (traits.tone === "enthusiastic") inst.push("Be high-energy and exciting! Use more emojis.");
  if (traits.formality === "formal") inst.push("Avoid slang. Use full sentences but keep them human.");
  else if (traits.formality === "casual") inst.push("Use casual language, contractions (it's, don't), and a very relaxed vibe.");
  if (traits.brevity === "concise") inst.push("Be extremely short. Get straight to the point.");
  else if (traits.brevity === "detailed") inst.push("Provide helpful details and context when answering.");
  if (traits.proactivity === "assertive") inst.push("Take charge of the chat. Proactively suggest the next step.");
  else if (traits.proactivity === "passive") inst.push("Wait for the user to ask before offering more help.");
  return inst.join(" ");
}

// supabase/functions/agent-orchestrator/agents/booking.ts
var COLLECTION_STAGES = [
  "collecting_service",
  "collecting_date",
  "collecting_time",
  "collecting_name",
  "collecting_email"
];
var FIELD_PROMPTS = {
  collecting_service: (ws) => {
    const services = ws?.services_offered || "our available services";
    return `What service would you like to book? We offer: ${services}`;
  },
  collecting_date: (_ws) => "What date would you like the appointment?",
  collecting_time: (_ws) => "What time works best for you?",
  collecting_name: (_ws) => "Could you please tell me your name?",
  collecting_email: (_ws) => "What email address should I use for the confirmation?"
};
var RETRY_PROMPTS = {
  collecting_service: (a, ws) => {
    const services = ws?.services_offered || "our available services";
    const prompts = [
      `Which service are you looking for? We currently offer: ${services}`,
      `I'd love to help! Could you let me know what type of appointment you need?`,
      `No worries \u2014 take a look at what we offer: ${services}. Which one interests you?`
    ];
    return prompts[Math.min(a - 1, prompts.length - 1)];
  },
  collecting_date: (a) => {
    const prompts = [
      "What date would you like?",
      "Could you give me a specific date? For example, 'tomorrow' or 'May 25th'.",
      "I understand it can be tricky. Just the date works \u2014 like 'next Monday' or 'June 3rd'."
    ];
    return prompts[Math.min(a - 1, prompts.length - 1)];
  },
  collecting_time: (a) => {
    const prompts = [
      "What specific time works for you?",
      "I just need the time \u2014 like '2pm' or '10:30 in the morning'.",
      "Any time preference? Morning, afternoon, or a specific time like '3pm'?"
    ];
    return prompts[Math.min(a - 1, prompts.length - 1)];
  },
  collecting_name: (a) => {
    const prompts = [
      "What's your full name?",
      "I just need your name. First name is fine.",
      "Could you share your name so I can save this booking for you?"
    ];
    return prompts[Math.min(a - 1, prompts.length - 1)];
  },
  collecting_email: (a) => {
    const prompts = [
      "What email should I send the confirmation to?",
      "Please share your email address so I can send the booking confirmation.",
      "Just need your email to send the confirmation \u2014 any email is fine."
    ];
    return prompts[Math.min(a - 1, prompts.length - 1)];
  }
};
async function loadOrCreateBookingSession(ctx) {
  const { data: existing } = await ctx.supabase.from("booking_sessions").select("*").eq("session_id", ctx.session.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existing) {
    ctx.bookingSession = existing;
    return existing;
  }
  if (!ctx.workspace) return null;
  const { data: newSession } = await ctx.supabase.from("booking_sessions").insert({
    session_id: ctx.session.id,
    workspace_id: ctx.payload.workspace_id,
    state: "idle",
    collected: {},
    attempts: {}
  }).select().single();
  if (newSession) ctx.bookingSession = newSession;
  return newSession;
}
async function updateBookingSession(ctx, id, updates) {
  const { data } = await ctx.supabase.from("booking_sessions").update({ ...updates, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id).select().single();
  if (data) ctx.bookingSession = data;
}
async function extractFields(message, missingFields, collected) {
  const now = /* @__PURE__ */ new Date();
  const today = now.toISOString().split("T")[0];
  const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];
  const fieldDescriptions = {
    service: "The dental service (e.g. cleaning, root canal, whitening).",
    date: `The date. Today is ${today} (${dayName}). Convert relative dates like 'tomorrow', 'this afternoon', 'next Monday' to YYYY-MM-DD. If 'this afternoon' or 'tonight', use ${today}.`,
    time: "The time. Convert to HH:MM (24h format). If only a range (e.g. 'morning'), return null.",
    name: "The customer's name.",
    email: "The customer's email address."
  };
  const schema = {};
  missingFields.forEach((f) => {
    schema[f] = { type: "object", properties: { value: { type: "string" }, confidence: { enum: ["high", "low"] } } };
  });
  try {
    const response = await callLLM({
      model: "llama-3.1-8b-instant",
      max_tokens: 150,
      temperature: 0,
      response_format: { type: "json_object" },
      system: `You are a specialized dental booking data extractor.
Today is ${today} (${dayName}).
Extract the following fields from the user's message if present:
${missingFields.map((f) => `- ${f}: ${fieldDescriptions[f]}`).join("\n")}

Rules:
- If a field is already in the collected list, do NOT re-extract it unless the user is explicitly changing it.
- Return null for fields not clearly present.
- For 'this afternoon' or 'today', the date is ${today}.

Return ONLY JSON: { "extracted": { "field_name": { "value": "...", "confidence": "high|low" } } }`,
      messages: [{ role: "user", content: `Existing context: ${JSON.stringify(collected)}
User message: ${message}` }]
    });
    const parsed = JSON.parse(response.choices?.[0]?.message?.content || "{}");
    return parsed.extracted || {};
  } catch {
    return {};
  }
}
async function handleBooking(ctx) {
  const bs = ctx.bookingSession;
  if (!bs) return null;
  const msgLower = ctx.payload.message.toLowerCase();
  const managementKeywords = ["reschedule", "move", "cancel", "change", "rebook", "re-schedule", "modify"];
  const hasManagementIntent = managementKeywords.some((kw) => msgLower.includes(kw));
  if (hasManagementIntent) {
    return null;
  }
  const nonBookingSignals = [
    "no",
    "stop",
    "never mind",
    "nevermind",
    "forget it",
    "leave it",
    "not interested",
    "don't want",
    "i don't",
    "i won't",
    "useless",
    "waste",
    "stupid",
    "bad",
    "terrible",
    "you're not",
    "you are not",
    "not helpful",
    "not what i",
    "help",
    "problem",
    "issue",
    "complaint",
    "not working",
    "talk to human",
    "talk to person",
    "talk to someone",
    "speak to",
    "speak with",
    "contact",
    "samir",
    "call owner",
    "human",
    "real person",
    "real agent",
    "owner",
    "what",
    "who",
    "why",
    "where",
    "tell me about",
    "are you real",
    "are you a bot",
    "confused",
    "don't understand",
    "i want to talk",
    "i want to speak",
    "listen to me"
  ];
  const isNonBooking = nonBookingSignals.some((s) => msgLower.includes(s));
  if (isNonBooking && Object.keys(bs.collected || {}).length <= 1) {
    return null;
  }
  if (bs.state === "booked") {
    return {
      handled: true,
      response: bs.appointment_id ? "Your appointment is already confirmed! Is there anything else I can help you with?" : "Your appointment is already booked! Is there anything else?",
      reason: "booking_already_booked"
    };
  }
  if (bs.state === "cancelled") {
    await updateBookingSession(ctx, bs.id, {
      state: "idle",
      collected: {},
      attempts: {}
    });
    return null;
  }
  const collected = { ...bs.collected || {} };
  const missing = getMissingFields(collected);
  const extractions = await extractFields(ctx.payload.message, missing, collected);
  let fieldsUpdated = false;
  for (const [field, data] of Object.entries(extractions)) {
    if (data.confidence === "high" && data.value) {
      collected[field] = data.value;
      fieldsUpdated = true;
    }
  }
  const nextStage = getNextStage(bs.state, collected);
  if (fieldsUpdated || nextStage !== bs.state) {
    await updateBookingSession(ctx, bs.id, {
      state: nextStage,
      collected,
      attempts: {}
      // Reset attempts on successful data entry
    });
    if (nextStage === "confirming") {
      ctx.bookingSession = { ...bs, state: nextStage, collected };
      return null;
    }
    const prompt = FIELD_PROMPTS[nextStage]?.(ctx.workspace) ?? "Could you please provide more details?";
    return { handled: true, response: prompt, reason: `booking_jump_${nextStage}` };
  }
  if (COLLECTION_STAGES.includes(bs.state)) {
    const attempts = { ...bs.attempts || {}, [bs.state]: ((bs.attempts || {})[bs.state] || 0) + 1 };
    await updateBookingSession(ctx, bs.id, { attempts });
    if (attempts[bs.state] >= 3) {
      return null;
    }
    const retry = RETRY_PROMPTS[bs.state]?.(attempts[bs.state], ctx.workspace) ?? "Could you please clarify?";
    return { handled: true, response: retry, reason: "booking_retry" };
  }
  return null;
}
function getNextStage(current, collected) {
  const required = ["service", "date", "time", "name", "email"];
  const stageMap = {
    service: "collecting_service",
    date: "collecting_date",
    time: "collecting_time",
    name: "collecting_name",
    email: "collecting_email"
  };
  for (const field of required) {
    if (!collected[field]) return stageMap[field];
  }
  return "confirming";
}
function getMissingFields(collected) {
  const required = ["service", "date", "time", "name", "email"];
  return required.filter((f) => !collected[f]);
}
function buildBookingSystemPrompt(ctx) {
  const bs = ctx.bookingSession;
  const collected = bs?.collected ?? {};
  const missing = getMissingFields(collected);
  const workspace = ctx.workspace || {};
  const traits = ctx.session?.workspace_agents?.config?.traits || {};
  const personaInstructions = getPersonaInstructions(traits);
  return `
## Your Role
You are the Appointment Booking Specialist for ${workspace.name || "this business"}. Your #1 priority is executing tool calls.
Personality: ${personaInstructions}

## State
- Collected: ${JSON.stringify(collected)}
- Missing: ${missing.join(", ")}
- Priority: ${ctx.routingReason === "management_priority" ? "RESCHEDULING/CANCELLING (Lookup history first!)" : "Standard booking"}

## Tools Available
- get_business_profile: Retrieve structured business data (hours, contact info, policies, pricing). Use this when customers ask about availability windows or booking-related policies.
- check_availability: Check Google Calendar for free/busy slots.
- create_appointment, update_appointment, cancel_appointment: Manage bookings.
- get_contact_history: Find existing appointments.
- request_handoff: Transfer to support or sales.

## MANDATORY WORKFLOWS (CRITICAL):
1. NEW BOOKING: If ALL fields are collected, you MUST call check_availability AND create_appointment in the SAME plan actions array.
2. RESCHEDULE: If user wants to move/change, you MUST call get_contact_history first to find their appointment ID.
3. CANCEL: If user wants to cancel, you MUST call get_contact_history first to find their appointment ID.
4. UPDATING: If you have an appointment ID, call update_appointment or cancel_appointment IMMEDIATELY.

## CRITICAL RULES:
- NEVER say you will do something without calling the corresponding tool in your 'actions' list.
- If you call a tool, set needs_second_pass: true.
- Use {result_key.field} in your response if you don't use second pass.
- Response must be under 80 words. Use WhatsApp Markdown formatting (e.g. *bold* for emphasis) to make responses scannable.
${traits.custom_directives ? `- ${traits.custom_directives}` : ""}

## CRITICAL EXECUTION DIRECTIVE
You are an automated operator. When deciding to use a tool (such as create_appointment, capture_lead, or update_lead_stage), you must adhere to a strict two-step execution loop:

1. Output ONLY the necessary parameters for the requested tool call.
2. STOP generating conversational text. You must wait for the system environment to return the execution payload.

UNDER NO CIRCUMSTANCES should you generate text confirming an action to the user (e.g., "I have successfully booked your appointment" or "I have moved your profile to qualified") until you receive a definitive "success" status from the tool's return payload. If a tool returns an error or fails to sync, apologize to the user and propose an alternative solution.

## AUTO-ESCALATION
If the user gets stuck in a loop, expresses frustration, or if a tool fails to execute 2 times in a row, you MUST invoke \`request_handoff\` immediately.
`.trim();
}

// supabase/functions/agent-orchestrator/agents/support.ts
function buildSupportSystemPrompt(ctx) {
  const workspace = ctx.workspace || {};
  const traits = ctx.session?.workspace_agents?.config?.traits || {};
  const personaInstructions = getPersonaInstructions(traits);
  return `
## Business Context
${workspace.name || workspace.business_name || "Business"} \u2014 ${workspace.description || workspace.business_description || ""}
Location: ${workspace.location ?? "Not specified"}
Language: Respond in ${workspace.preferred_language ?? "English"}.
Personality: ${personaInstructions}

## Your Role
You are the Customer Support Specialist. You answer questions about the business, services, hours, and policies. 

## Support Tools:
- match_kb_chunks: Search the knowledge base for answers.
- get_business_profile: Retrieve structured business data (hours, contact info, policies, amenities, pricing) \u2014 use for exact details about the business.
- get_contact_history: Look up customer details and past appointments.
- update_contact: Update customer info during conversation.
- request_handoff: Transfer to booking or sales specialist.
- create_ticket: Create a tracked support ticket for issues needing follow-up.
- get_ticket_status: Check the status and updates of an existing support ticket.

## CONVERSATIONAL GUIDANCE (PROACTIVE AGENT)
Customers rely on you to guide them. Do not give "dead-end" answers.
1. **Always lead the conversation:** After answering a question, proactively ask if they need help with anything else or offer a related service (e.g., "Our hours are 9 AM to 5 PM. Would you like to book an appointment for tomorrow?").
2. **Clarification:** If a customer asks a vague question, do not guess. Ask a polite clarifying question.
3. **Information Gathering:** If you need to create a ticket, tell the user exactly what information you need from them (e.g., "I can open a support ticket for this. Could you please provide your order number or email address?").

## CRITICAL EXECUTION DIRECTIVE: TWO-PASS SYSTEM
You operate on a strict two-pass tool execution loop to prevent hallucinations.

**PASS 1: TOOL EXECUTION (When taking action)**
If you need to use a tool (e.g., search KB, create a ticket, get profile), you must output ONLY the action array to trigger the tool.
DO NOT write any conversational response text during Pass 1.
Example: \`{ "response": "", "actions": [{ "tool": "match_kb_chunks", "params": { "query": "return policy" } }], "needs_second_pass": true }\`

**PASS 2: USER RESPONSE (After tool returns data)**
Once the system executes the tool and returns the payload to you, you will be prompted again. You must then write the conversational response confirming the outcome to the user.
Example: \`{ "response": "According to our policy, you have 30 days to return the item.", "actions": [] }\`

UNDER NO CIRCUMSTANCES should you generate text confirming an action or answering a factual question until you are in Pass 2 and have received the definitive data from the tool.

## General Response Rules
1. Keep responses under 150 words.
2. Always end your message with a helpful question or next step.
3. Never invent facts, names, emails, dates, or prices.
4. Use WhatsApp Markdown formatting (e.g. *bold* for emphasis, _italics_ for nuances) to make responses scannable.
5. Use {result_key.field} placeholders for values from tool results if you must bypass second pass.
6. If you don't know the answer, search the knowledge base first.
7. If the user asks about booking, use request_handoff to transfer to appointment_booking.
8. If the user asks about pricing or ordering, use request_handoff to transfer to sales.
9. You MUST call submit_plan with your complete plan.
${traits.custom_directives ? `10. ${traits.custom_directives}` : ""}

## ESCALATION PROTOCOL
If the conversation status indicates the user is frustrated, requests a refund, or asks for management, you must immediately halt standard troubleshooting.
- Do not attempt to resolve the issue further or ask for external data like order IDs.
- Output a single empathetic statement acknowledging the friction.
- Immediately invoke the request_handoff tool to transfer the session.
- Example response: "I completely understand why this is frustrating. I am escalating your profile to our management team right now so they can resolve this."

## AUTO-ESCALATION
If a user is highly frustrated, uses profanity, or if you fail to execute a requested tool successfully 2 times in a row, you MUST immediately stop talking and invoke \`request_handoff\` to transfer them to human support.
`.trim();
}

// supabase/functions/agent-orchestrator/agents/sales.ts
function buildSalesSystemPrompt(ctx) {
  const workspace = ctx.workspace || {};
  const traits = ctx.session?.workspace_agents?.config?.traits || {};
  const personaInstructions = getPersonaInstructions(traits);
  return `
## Business Context
${workspace.name || workspace.business_name || "Business"} \u2014 ${workspace.description || workspace.business_description || ""}
Location: ${workspace.location ?? "Not specified"}
Language: Respond in ${workspace.preferred_language ?? "English"}.
Personality: ${personaInstructions}

## Your Role
You are the Sales and Lead Generation Specialist. Your goal is to help customers find products, capture their interest as leads, manage orders, and nurture relationships.

## Dynamic Tools
Note: You may only have access to a subset of these tools depending on the business configuration.
- search_menu: Browse available menu items/services. Omit query to see everything.
- send_menu_media: Send a visual menu image/PDF via WhatsApp. Falls back to text menu if no image uploaded.
- capture_lead: Save customer contact info (name required) for sales follow-up.
- update_lead_stage: Move contact through pipeline: new \u2192 contacted \u2192 qualified \u2192 proposal \u2192 negotiation \u2192 won/lost.
- get_pipeline: View sales pipeline breakdown by stage.
- schedule_follow_up: Schedule an automated WhatsApp follow-up message (hours + message required).
- create_order: Create an order with items. Generates UPI payment link automatically.
- confirm_payment: Mark an order as paid. ONLY call this after verifying payment proof.
- get_order_status: Check order status by ID.
- generate_quote: Generate a formal price quote with items, tax, and 30-day validity.
- get_business_profile: Retrieve structured business data (pricing, amenities, policies, hours, contact info).
- get_contact_history: Retrieve contact details and past appointment history.
- update_contact: Update customer contact info during conversation.
- request_handoff: Transfer to another specialist (e.g., for booking).

## CONVERSATIONAL GUIDANCE (PROACTIVE AGENT)
Customers do not know your internal tools or workflows. YOU must lead the conversation.
1. **Never leave the customer hanging.** Every response should end with a clear question or the next logical step (e.g., "Would you like to see our menu?" or "What name should I put on the order?").
2. **Step-by-Step:** Do not ask for all information at once. Ask for their name, then ask for their order, then send the payment link.
3. **Menu Discovery:** If a user says "I want to buy something" but hasn't specified what, proactively use \`search_menu\` and offer them the top 3 options, or ask if they want you to send the full menu.
4. **Closing the Loop:** When an order is created, explicitly tell the customer to send a screenshot or UTR number once they have paid using the provided link.

## PAYMENT VERIFICATION PROTOCOL (CRITICAL)
If a user claims they have paid (e.g., "I paid", "done", "payment successful"):
1. DO NOT immediately call the \`confirm_payment\` tool.
2. You MUST reply and politely ask them to provide either a **Transaction ID (UTR)** or a **Screenshot of the payment receipt**.
3. ONLY call the \`confirm_payment\` tool AFTER the user provides a transaction ID or sends an image.
If they refuse or cannot provide proof, politely state that you cannot confirm the order until payment proof is verified.

## CRITICAL EXECUTION DIRECTIVE: TWO-PASS SYSTEM
You operate on a strict two-pass tool execution loop to prevent hallucinations.

**PASS 1: TOOL EXECUTION (When taking action)**
If the user asks you to perform an action (e.g., create an order, save their details, check a menu), you must output ONLY the action array to trigger the tool.
DO NOT write any conversational response text during Pass 1.
Example: \`{ "response": "", "actions": [{ "tool": "create_order", "params": { "items": [...] } }], "needs_second_pass": true }\`

**PASS 2: USER RESPONSE (After tool returns data)**
Once the system executes the tool and returns the payload to you, you will be prompted again. You must then write the conversational response confirming the outcome to the user.
Example: \`{ "response": "I've successfully placed your order! Here is your summary...", "actions": [] }\`

UNDER NO CIRCUMSTANCES should you generate text confirming an action to the user (e.g., "I have created your order") until you are in Pass 2 and have received the definitive "success" status from the tool.

## General Response Rules
1. Keep responses under 150 words. Use WhatsApp Markdown formatting (e.g. *bold* for emphasis, _italics_ for nuances) to make responses scannable.
2. Always end your message by guiding the user to the next step.
3. Be helpful and friendly \u2014 you're the face of the business.
4. You MUST call submit_plan with your complete plan.
${traits.custom_directives ? `5. ${traits.custom_directives}` : ""}

## SALES AND PRICING PROTOCOL
Your knowledge regarding product pricing, subscription tiers, and technical integrations is strictly limited to the information provided by the tools (e.g., get_business_profile, search_menu).
- Do not invent, estimate, or hallucinate pricing numbers.
- Do not promise features unless explicitly confirmed by the tool's context.
- If a user asks for pricing or specifics not found in the tools, explicitly state: "I don't have those exact specifications on hand, but I can connect you with management to get you an accurate answer."

## AUTO-ESCALATION
If a user is highly frustrated, uses profanity, or if you fail to execute a requested tool successfully 2 times in a row, you MUST immediately stop talking and invoke \`request_handoff\` to transfer them to human support.
`.trim();
}

// supabase/functions/agent-orchestrator/pipeline/t3-planner.ts
var AGENT_SYSTEM_PROMPTS = {
  customer_support: buildSupportSystemPrompt,
  appointment_booking: buildBookingSystemPrompt,
  sales: buildSalesSystemPrompt
};
async function runT3(ctx) {
  const agentType = ctx.agentType || "customer_support";
  const { data: agent } = await ctx.supabase.from("workspace_agents").select("*").eq("workspace_id", ctx.session.workspace_id).eq("agent_type", agentType).maybeSingle();
  if (agent) {
    ctx.session.workspace_agents = agent;
  }
  const { data: sessionStatus } = await ctx.supabase.from("conversation_sessions").select("status").eq("id", ctx.session.id).single();
  if (sessionStatus?.status === "escalated") {
    const handoffResult = await toolExecutor.run("request_handoff", {
      target_agent: "customer_support",
      reason: "escalation"
    }, ctx);
    const response = handoffResult?.response ?? "I completely understand why this is frustrating. I am escalating your profile to our management team right now so they can resolve this.";
    await ctx.supabase.from("conversation_sessions").update({ agent_type: "customer_support", updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", ctx.session.id);
    ctx.agentType = "customer_support";
    await postProcess(ctx, null, null, response, "customer_support");
    return { handled: true, response, reason: "t3_escalation_handoff" };
  }
  if (ctx._msgCount === void 0) {
    const { count } = await ctx.supabase.from("messages").select("*", { count: "exact", head: true }).eq("session_id", ctx.session.id).eq("direction", "inbound");
    ctx._msgCount = count || 0;
  }
  if (agentType === "appointment_booking") {
    await loadOrCreateBookingSession(ctx);
    const bookingResult = await handleBooking(ctx);
    if (bookingResult) {
      await postProcess(ctx, null, null, bookingResult.response || "", agentType);
      return bookingResult;
    }
  }
  const { count: currentCount } = await ctx.supabase.from("messages").select("*", { count: "exact", head: true }).eq("session_id", ctx.session.id).eq("direction", "inbound");
  if (currentCount !== null && currentCount > (ctx._msgCount || 0)) {
    const fallback = ctx.workspace?.guardrail_config?.fallback_message ?? "Thank you for reaching out! Our team will get back to you shortly.";
    return { handled: true, response: fallback, reason: "t3_stale_message" };
  }
  const buildPrompt = AGENT_SYSTEM_PROMPTS[agentType] || AGENT_SYSTEM_PROMPTS.customer_support;
  let systemPrompt = buildPrompt(ctx);
  if (ctx.routingReason === "management_priority") {
    try {
      const { getHistory: getHistory2 } = await Promise.resolve().then(() => (init_contact(), contact_exports));
      const history = await getHistory2({}, ctx);
      if (history && !history.error) {
        systemPrompt += `

[SMART CONTEXT] Existing Appointments for this user:
${JSON.stringify(history.appointments || [])}
Use these IDs for update_appointment or cancel_appointment.`;
      }
    } catch (e) {
      console.error("[T3] Smart Context failed:", e.message);
    }
  }
  if (ctx.pricingBlocked) {
    systemPrompt += `

CRITICAL: The user is asking about pricing, but your policy FORBIDS disclosing specific prices. Acknowledge their interest in the service, but politely explain that you cannot provide price details over chat and they should contact the business directly for a quote.`;
  }
  if (ctx.salesBlocked) {
    systemPrompt += `

CRITICAL: The user is interested in buying or ordering, but your policy FORBIDS processing sales directly over chat. Acknowledge their interest and provide information about the product/service, but explain that you cannot take orders here and they should contact the business directly to purchase.`;
  }
  const messages = await buildMessages(ctx);
  let parsedPlan;
  let llmResponse;
  try {
    llmResponse = await callLLM({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1e3,
      temperature: 0.3,
      system: systemPrompt,
      messages,
      tools: [SUBMIT_PLAN_TOOL, ...getAgentToolDefinitions(agentType)],
      tool_choice: { type: "function", function: { name: "submit_plan" } }
    });
    const toolCall = llmResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "submit_plan") {
      throw new Error("LLM did not call submit_plan");
    }
    parsedPlan = JSON.parse(toolCall.function.arguments);
  } catch (e) {
    console.error("[T3] Plan error:", e.message);
    return {
      handled: true,
      response: ctx.workspace?.guardrail_config?.fallback_message ?? "I'm having trouble understanding that. Could you rephrase?",
      reason: "t3_plan_error"
    };
  }
  await validatePlanActions(ctx, parsedPlan);
  try {
    await ctx.supabase.from("agent_traces").insert({
      session_id: ctx.session.id,
      workspace_id: ctx.payload.workspace_id,
      trace_id: crypto.randomUUID(),
      model_used: "llama-3.3-70b-versatile",
      tokens_used: llmResponse?.usage?.total_tokens || 0,
      intent_detected: ctx.agentType || agentType,
      message_length: ctx.payload.message.length,
      response_length: parsedPlan.response.length,
      latency_ms: 0
    });
  } catch (e) {
    console.error("[T3] Failed to insert agent_trace:", e.message);
  }
  let finalResponse = parsedPlan.response;
  let toolResults = [];
  if (parsedPlan.actions.length > 0) {
    toolResults = await Promise.allSettled(
      parsedPlan.actions.map(
        (action) => toolExecutor.run(action.tool, action.params, ctx)
      )
    );
    const requiredFailed = parsedPlan.actions.some(
      (action, i) => action.required && toolResults[i].status === "rejected"
    );
    if (requiredFailed) {
      finalResponse = (parsedPlan.fallback || "").replace(/\{[^}]+\}/g, "");
      await postProcess(ctx, llmResponse, parsedPlan, finalResponse, agentType);
      return { handled: true, response: finalResponse, reason: "t3_fallback_required_failed" };
    }
  }
  if (toolResults.length > 0) {
    try {
      const pass2System = buildPass2System(ctx, agentType);
      const toolContext = buildToolContext(parsedPlan.actions, toolResults);
      const secondPassResponse = await callLLM({
        model: "llama-3.3-70b-versatile",
        max_tokens: 800,
        temperature: 0.3,
        system: pass2System,
        messages: [
          ...messages,
          {
            role: "assistant",
            content: "",
            tool_calls: llmResponse.choices[0].message.tool_calls
          },
          {
            role: "tool",
            tool_call_id: llmResponse.choices[0].message.tool_calls[0].id,
            content: toolContext
          }
        ]
      });
      finalResponse = secondPassResponse.choices?.[0]?.message?.content || parsedPlan.fallback || "";
    } catch (e) {
      console.error("[T3] Second pass error:", e.message);
      finalResponse = fillTemplate(parsedPlan.response, parsedPlan.actions, toolResults);
    }
    const enriched = enrichResponseWithToolResults(finalResponse, parsedPlan.actions, toolResults);
    if (enriched) finalResponse = enriched;
  }
  for (let i = 0; i < parsedPlan.actions.length; i++) {
    const action = parsedPlan.actions[i];
    const result = toolResults[i];
    if (result?.status === "fulfilled" && result.value?.handoff_to) {
      return await handleHandoff(ctx, result.value.handoff_to, result.value.handoff_context || "");
    }
  }
  finalResponse = finalResponse.replace(/\{[^}]+\}/g, "");
  await postProcess(ctx, llmResponse, parsedPlan, finalResponse, agentType);
  return { handled: true, response: finalResponse, reason: "t3_plan_execute" };
}
async function buildMessages(ctx) {
  const { data: msgHistory } = await ctx.supabase.from("messages").select("*").eq("session_id", ctx.session.id).order("created_at", { ascending: false }).limit(15);
  const history = (msgHistory || []).reverse();
  const messages = [];
  for (const m of history) {
    messages.push({
      role: m.role === "agent" ? "assistant" : "user",
      content: m.content
    });
  }
  const lastMsg = history[history.length - 1];
  if (!lastMsg || lastMsg.content !== ctx.payload.message || lastMsg.role !== "user") {
    messages.push({ role: "user", content: ctx.payload.message });
  }
  return messages;
}
function buildPass2System(ctx, agentType) {
  const workspace = ctx.workspace || {};
  return `You are a ${agentType.replace("_", " ")} assistant for ${workspace.name || "a business"}.
You already decided what tools to call. Tool results are provided below.
Write ONLY the customer-facing message. Keep it under 150 words. Plain text only, no markdown.`;
}
function enrichResponseWithToolResults(response, actions, results) {
  let enriched = response;
  let appended = [];
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const result = results[i];
    if (result?.status !== "fulfilled") continue;
    const data = result.value?.data || result.value;
    if (!data?.success) continue;
    switch (action.tool) {
      case "search_menu": {
        const items = data.items || data.data || [];
        if (Array.isArray(items) && items.length > 0) {
          const formatted = items.map((item) => {
            const name = item.name || item.title || "";
            const price = item.price ? ` - Rs.${item.price}` : "";
            return `- ${name}${price}`;
          }).join("\n");
          appended.push(`

Here are our available items:
${formatted}`);
        }
        break;
      }
      case "check_availability": {
        const slots = data.slots || data.available_slots || [];
        if (Array.isArray(slots) && slots.length > 0) {
          const formatted = slots.slice(0, 5).map((s) => {
            const time = s.time || s.start_time || "";
            return `- ${time}`;
          }).join("\n");
          appended.push(`

Available slots:
${formatted}`);
        }
        break;
      }
      case "capture_lead": {
        if (data.id || data.lead_id || data.contact_id) {
          appended.push(`

I have saved your information. Our team will follow up with you.`);
        }
        break;
      }
      case "create_order": {
        if (data.order_id || data.order_number) {
          appended.push(`

Your order ${data.order_number || ""} has been created. Total: Rs.${data.total || 0}. Pay via: ${data.upi_link || ""}`);
        }
        break;
      }
      case "match_kb_chunks": {
        const chunks = data.chunks || data.results || [];
        if (Array.isArray(chunks) && chunks.length > 0) {
          const text = chunks.map((c) => c.content || c.text || "").filter(Boolean).join("\n").slice(0, 500);
          if (text) appended.push(`

${text}`);
        }
        break;
      }
      case "confirm_payment": {
        if (data.status === "paid") {
          appended.push(`

\u2705 Payment confirmed for order ${data.order_number || ""}. Thank you!`);
        }
        break;
      }
      case "get_order_status": {
        if (data.order_number) {
          const line = `Order ${data.order_number}: ${data.status}. Total: \u20B9${data.total || 0}.`;
          appended.push(`

${line}`);
        }
        break;
      }
      case "generate_quote": {
        if (data.quote_text) {
          appended.push(`

${data.quote_text}`);
        }
        break;
      }
      case "update_lead_stage": {
        if (data.stage) {
          appended.push(`

\u2705 Lead moved to "${data.stage}" stage.`);
        }
        break;
      }
      case "get_pipeline": {
        if (data.pipeline) {
          const lines = Object.entries(data.pipeline).filter(([_, c]) => c > 0).map(([stage, count]) => `- ${stage}: ${count}`).join("\n");
          if (lines) appended.push(`

Pipeline overview:
${lines}`);
        }
        break;
      }
      case "schedule_follow_up": {
        if (data.follow_up_id) {
          appended.push(`

\u2705 Follow-up scheduled for ${new Date(data.scheduled_at).toLocaleString()}.`);
        }
        break;
      }
    }
  }
  if (appended.length === 0) return null;
  for (const a of appended) {
    const short = a.replace(/\n/g, " ").slice(0, 40);
    if (!enriched.includes(short)) {
      enriched += a;
    }
  }
  return enriched !== response ? enriched : null;
}
function buildToolContext(actions, results) {
  return actions.map((a, i) => {
    const r = results[i];
    const status = r.status === "fulfilled" ? "SUCCESS" : "FAILED";
    const data = r.status === "fulfilled" ? JSON.stringify(r.value) : r.reason?.message;
    return `[${a.tool}] ${status}: ${data}`;
  }).join("\n");
}
function fillTemplate(template, actions, results) {
  let filled = template;
  actions.forEach((action, i) => {
    if (results[i].status === "fulfilled") {
      const resultKey = action.result_key || action.tool;
      const data = results[i].value?.data || results[i].value;
      if (data && typeof data === "object") {
        Object.entries(flattenObject(data, resultKey)).forEach(([key, val]) => {
          filled = filled.replace(new RegExp(`\\{${key}\\}`, "g"), String(val ?? ""));
        });
        filled = filled.replace(new RegExp(`\\{${resultKey}\\}`, "g"), JSON.stringify(data));
      }
    }
  });
  filled = filled.replace(/\{[^}]+\}/g, "");
  return filled;
}
function flattenObject(obj, prefix = "") {
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    const k = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === "object" && !Array.isArray(val)) {
      Object.assign(result, flattenObject(val, k));
    } else if (Array.isArray(val)) {
      const lines = val.slice(0, 10).map((v) => {
        if (typeof v === "object" && v !== null) {
          return (v.name || v.title || JSON.stringify(v)).slice(0, 100);
        }
        return String(v).slice(0, 100);
      }).join("\n");
      result[k] = lines;
    } else {
      result[k] = String(val ?? "");
    }
  }
  return result;
}
async function handleHandoff(ctx, targetAgent, context) {
  const depth = (ctx.handoffDepth ?? 0) + 1;
  if (depth > 2) {
    console.log(`[T3] Handoff depth limit reached (${depth}). Returning fallback.`);
    return { handled: true, response: "I've reached the limit for transferring between specialists. A human agent will follow up with you shortly.", reason: "handoff_depth_limit" };
  }
  console.log(`[T3] Executing handoff to: ${targetAgent}. Depth: ${depth}. Context: ${context.substring(0, 50)}...`);
  await ctx.supabase.from("conversation_sessions").update({
    agent_type: targetAgent,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", ctx.session.id);
  ctx.agentType = targetAgent;
  ctx.routingReason = "handoff_execution";
  ctx.handoffDepth = depth;
  return await runT3(ctx);
}
async function postProcess(ctx, llmResponse, plan, finalResponse, agentType) {
  if (!ctx.payload.is_test) {
    try {
      await ctx.supabase.rpc("decrement_credits", {
        p_workspace_id: ctx.payload.workspace_id,
        p_credits: 1,
        p_session_id: ctx.session.id
      });
    } catch (_) {
    }
  }
  const usage = llmResponse?.usage?.total_tokens || 0;
  await ctx.supabase.from("conversation_sessions").update({
    agent_type: agentType,
    last_message_at: (/* @__PURE__ */ new Date()).toISOString(),
    last_message_preview: finalResponse.substring(0, 100),
    message_count: (ctx.session.message_count || 0) + 1,
    total_tokens_used: (ctx.session.total_tokens_used || 0) + usage,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", ctx.session.id);
}
async function validatePlanActions(ctx, plan) {
  const actionTools = plan.actions.map((a) => a.tool);
  const { data: lastCustomerMsg } = await ctx.supabase.from("messages").select("content").eq("session_id", ctx.session.id).eq("direction", "inbound").order("created_at", { ascending: false }).limit(1).maybeSingle();
  const customerMsg = (lastCustomerMsg?.content || "").toLowerCase();
  const wantsOrder = /\b(order|buy|want|purchase|get|need)\b/.test(customerMsg) && !customerMsg.includes("order status") && !customerMsg.includes("my order");
  if (wantsOrder && !actionTools.includes("create_order")) {
    const items = parseOrderItemsFromText(customerMsg);
    if (items.length > 0) {
      plan.actions.push({ tool: "create_order", params: { items }, required: false });
    }
  }
  const confirmsPayment = /(?:paid|payment\s*(?:done|confirm|complete|made|success)|confirm\s*(?:payment|paid)|upi)/i.test(customerMsg);
  if (confirmsPayment && !actionTools.includes("confirm_payment")) {
    const { data: lastOrder } = await ctx.supabase.from("orders").select("id, order_number, status").eq("workspace_id", ctx.payload.workspace_id).eq("session_id", ctx.session.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (lastOrder && lastOrder.status !== "paid") {
      plan.actions.push({ tool: "confirm_payment", params: { order_id: lastOrder.id }, required: false });
    }
  }
  const resp = plan.response.toLowerCase();
  if (!actionTools.includes("confirm_payment") && /(?:paid|payment|confirm.*(?:paid|payment)|(?:paid|payment).*confirm)/i.test(resp) && !confirmsPayment) {
    const { data: lastOrder } = await ctx.supabase.from("orders").select("id, order_number, status").eq("workspace_id", ctx.payload.workspace_id).eq("session_id", ctx.session.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (lastOrder && lastOrder.status !== "paid") {
      plan.actions.push({ tool: "confirm_payment", params: { order_id: lastOrder.id }, required: false });
    }
  }
  const wantsBooking = /\b(book|appointment|schedule|visit|consult|slot)\b/i.test(customerMsg) && !/my appointment|existing|reschedule|rebook/i.test(customerMsg);
  if (wantsBooking && !actionTools.includes("create_appointment")) {
    const { data: existingAppt } = await ctx.supabase.from("appointments").select("id").eq("session_id", ctx.session.id).neq("status", "cancelled").limit(1).maybeSingle();
    if (!existingAppt) {
      plan.actions.push({ tool: "create_appointment", params: {}, required: false });
    }
  }
  const capturePhrases = /(captured|saved your (details|info)|added you as a lead|i have saved your)/i;
  if (capturePhrases.test(resp) && !actionTools.includes("capture_lead")) {
    plan.response = plan.response.replace(/I have saved your (information|details|info)[^.]*\./gi, "");
    plan.response += " [Correction: You claimed to save contact info without calling capture_lead. Apologize and ask again.]";
  }
  const stagePhrases = /(moved (you|to|the (lead|contact)) to |promoted to|advanced to|stage (change|update)|qualified|proposal|negotiation)/i;
  if (stagePhrases.test(resp) && !actionTools.includes("update_lead_stage")) {
    plan.response = plan.response.replace(/(I['"]?ve|I have) (moved|promoted|advanced)( you| the)?[^.]*\./gi, "");
    plan.response += " [Correction: You claimed to update the pipeline stage without calling update_lead_stage. Apologize.]";
  }
  const pricingPhrases = /(₹|rs\.?\s*\d+|price|cost|subscription|tier|plan|worth|value)/i;
  const hasPricingClaim = pricingPhrases.test(resp);
  const kbUsed = actionTools.includes("match_kb_chunks");
  let kbCalledThisSession = false;
  if (hasPricingClaim && !kbUsed) {
    const { data: recentTraces } = await ctx.supabase.from("agent_traces").select("tool_name").eq("session_id", ctx.session.id).eq("tool_name", "match_kb_chunks").gte("created_at", new Date(Date.now() - 5 * 6e4).toISOString()).limit(1).maybeSingle();
    kbCalledThisSession = !!recentTraces;
  }
  if (hasPricingClaim && !kbUsed && !kbCalledThisSession) {
    console.warn(`[T3] Hallucination detected: Pricing info provided without KB search.`);
    try {
      await ctx.supabase.from("debug_logs").insert({
        level: "warning",
        scope: "t3-planner",
        message: "AI provided pricing info without KB search",
        metadata: { session_id: ctx.session.id, response: plan.response }
      });
    } catch (_) {
    }
    plan.actions.push({ tool: "match_kb_chunks", params: { query: "pricing and plans" }, required: false });
  }
}
function parseOrderItemsFromText(text) {
  const items = [];
  const itemRegex = /(\d+(?:\.\d+)?)\s*(kg|g|gram|packet|dozen|litre|bottle|pack|bunch|piece|pcs)\s+(?:of\s+)?([a-z\s]+?)(?=[,.]|\s+and|\s+with|$)/gi;
  let match;
  while ((match = itemRegex.exec(text.toLowerCase())) !== null) {
    let qty = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    const name = match[3].trim().replace(/[,.]$/, "");
    if (["g", "gram"].includes(unit) && qty >= 100) qty = qty / 1e3;
    if (name && name.length < 50) {
      items.push({ name, qty });
    }
  }
  return items;
}

// supabase/functions/agent-orchestrator/lib/dispatch.ts
async function dispatch(ctx, response) {
  if (!response) return;
  console.log(`[DISPATCH] Preparing response: ${response.substring(0, 50)}...`);
  const phone = ctx.payload.customer_phone;
  const source = ctx.payload.source || "whatsapp";
  const gowaBase = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "");
  const gowaKey = Deno.env.get("GOWA_API_KEY");
  let deviceId = "";
  if (source === "whatsapp" && gowaBase && gowaKey) {
    const { data: gowaSession } = await ctx.supabase.from("gowa_sessions").select("gowa_session_id").eq("workspace_id", ctx.payload.workspace_id).maybeSingle();
    deviceId = gowaSession?.gowa_session_id || "";
  }
  const auth = gowaKey ? btoa(gowaKey) : "";
  if (source === "whatsapp" && deviceId && phone) {
    try {
      await fetch(`${gowaBase}/send/presence`, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", "X-Device-Id": deviceId },
        body: JSON.stringify({ phone, type: "available" })
      });
    } catch (_) {
    }
    const delayMs = Math.min(response.length * 12, 1500);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    try {
      await fetch(`${gowaBase}/send/presence`, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", "X-Device-Id": deviceId },
        body: JSON.stringify({ phone, type: "unavailable" })
      });
    } catch (_) {
    }
  }
  const parts = response.length > 1e3 ? splitAtSentence(response, 1e3) : [response];
  for (const part of parts) {
    await storeOutboundMessage(ctx, part);
    if (source === "whatsapp" && deviceId && phone) {
      await sendWithRetry(ctx, gowaBase, phone, part, auth, deviceId);
      if (parts.length > 1) await new Promise((res) => setTimeout(res, 500));
    }
  }
  await ctx.supabase.from("conversation_sessions").update({ last_message_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", ctx.session.id);
}
async function sendWithRetry(ctx, gowaBase, phone, text, auth, deviceId, attempt = 1) {
  const backoffs = [0, 1e3, 2e3, 4e3];
  if (attempt > 1) await new Promise((res2) => setTimeout(res2, backoffs[attempt - 1]));
  const res = await fetch(`${gowaBase}/send/message`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", "X-Device-Id": deviceId },
    body: JSON.stringify({ phone, message: text })
  });
  if (!res.ok && attempt < 3) {
    return sendWithRetry(ctx, gowaBase, phone, text, auth, deviceId, attempt + 1);
  } else if (!res.ok) {
    await saveFailedMessage(ctx, phone, text, `GoWA ${res.status}`);
  }
}
function splitAtSentence(text, maxLen) {
  if (text.length <= maxLen) return [text];
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  const parts = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > maxLen && current) {
      parts.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}
async function storeOutboundMessage(ctx, response) {
  await ctx.supabase.from("messages").insert({
    workspace_id: ctx.payload.workspace_id,
    session_id: ctx.session.id,
    content: response,
    direction: "outbound",
    role: "agent",
    agent_type: ctx.agentType || "customer_support"
  });
}
async function saveFailedMessage(ctx, phone, text, reason) {
  try {
    await ctx.supabase.from("failed_messages").insert({
      workspace_id: ctx.payload.workspace_id,
      session_id: ctx.session.id,
      raw_message: text,
      failure_reason: reason,
      retry_count: 3,
      resolved: false
    });
  } catch (_) {
  }
}

// supabase/functions/agent-orchestrator/lib/session.ts
async function getOrCreateSession(supabase, {
  workspace_id,
  customer_jid,
  channel,
  agent_type
}) {
  const dbChannel = channel === "webchat" ? "widget" : channel;
  let { data: session } = await supabase.from("conversation_sessions").select("*, workspaces(name, is_ai_enabled, credits_balance, owner_personal_phone, owner_id, welcome_template, guardrail_config, services_offered)").eq("workspace_id", workspace_id).eq("customer_jid", customer_jid).eq("status", "active").is("deleted_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!session) {
    const { data: escalatedSession } = await supabase.from("conversation_sessions").select("*, workspaces(name, is_ai_enabled, credits_balance, owner_personal_phone, owner_id, welcome_template, guardrail_config, services_offered)").eq("workspace_id", workspace_id).eq("customer_jid", customer_jid).eq("status", "escalated").is("deleted_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (escalatedSession) {
      session = escalatedSession;
    }
  }
  if (!session) {
    const { data: contact } = await supabase.from("contacts").select("id").eq("workspace_id", workspace_id).eq(channel === "whatsapp" ? "whatsapp_jid" : "session_token", customer_jid).is("deleted_at", null).maybeSingle();
    let contact_id = contact?.id;
    if (!contact_id) {
      const { data: newContact } = await supabase.from("contacts").insert({
        workspace_id,
        [channel === "whatsapp" ? "whatsapp_jid" : "session_token"]: customer_jid,
        channel: dbChannel
      }).select("id").single();
      contact_id = newContact.id;
    }
    const { data: newSession, error: createError } = await supabase.from("conversation_sessions").insert({
      workspace_id,
      contact_id,
      channel: dbChannel,
      customer_jid,
      agent_type,
      status: "active",
      failed_attempts: 0,
      message_count: 0
    }).select("*, workspaces(name, is_ai_enabled, credits_balance, owner_personal_phone, owner_id, welcome_template, guardrail_config, services_offered)").single();
    if (createError) throw createError;
    session = newSession;
  }
  return session;
}
async function touchSession(ctx, agentType, finalResponse, tokensUsed = 0) {
  await ctx.supabase.from("conversation_sessions").update({
    agent_type: agentType,
    last_message_at: (/* @__PURE__ */ new Date()).toISOString(),
    last_message_preview: finalResponse.substring(0, 100),
    message_count: (ctx.session.message_count || 0) + 1,
    total_tokens_used: (ctx.session.total_tokens_used || 0) + tokensUsed,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", ctx.session.id);
}

// supabase/functions/agent-orchestrator/index.ts
var responseHeaders = {
  "Content-Type": "application/json",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff"
};
var STATIC_FALLBACK_MESSAGE = "I'm having a small technical hiccup right now! Our team has been notified and will get back to you very shortly. Sorry for the inconvenience!";
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 204 });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const internalSecret = Deno.env.get("INTERNAL_CRON_SECRET") || "";
    const legacyKey = Deno.env.get("LEGACY_SERVICE_ROLE_KEY") || "";
    const authorized = token && (token === serviceRoleKey || token === internalSecret || legacyKey && token === legacyKey);
    if (!authorized) {
      console.error(`[ORCHESTRATOR] Auth Mismatch`);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: responseHeaders
      });
    }
    const payload = await parseWebhook(req);
    if (!payload) return new Response("ok", { status: 200 });
    const aiResult = await processMessage(payload);
    if (payload.is_test) {
      return new Response(JSON.stringify(aiResult), { status: 200, headers: responseHeaders });
    }
    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("[ORCHESTRATOR] Request error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 200,
      headers: responseHeaders
    });
  }
});
async function processMessage(payload) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
  try {
    console.log(`[ORCHESTRATOR] Starting pipeline for session: ${payload.session_id || "new"}`);
    const session = await getOrCreateSession(supabase, {
      workspace_id: payload.workspace_id,
      customer_jid: payload.customer_jid,
      channel: payload.source,
      agent_type: "customer_support"
    });
    const ctx = { supabase, session, payload };
    ctx.workspace = session.workspaces;
    console.log(`[ORCHESTRATOR] Context ready. Workspace: ${ctx.workspace?.name}`);
    const t0 = await runT0(ctx);
    if (t0.handled) {
      console.log(`[ORCHESTRATOR] T0 handled. Reason: ${t0.reason}`);
      await touchSession(ctx, "customer_support", t0.response || "");
      await dispatch(ctx, t0.response);
      return t0;
    }
    const t1 = await runT1(ctx);
    if (t1.handled) {
      console.log(`[ORCHESTRATOR] T1 handled. Reason: ${t1.reason}`);
      await touchSession(ctx, "customer_support", t1.response || "");
      await dispatch(ctx, t1.response);
      return t1;
    }
    const t2 = await runT2(ctx);
    if (t2.handled) {
      console.log(`[ORCHESTRATOR] T2 handled. Reason: ${t2.reason}`);
      await touchSession(ctx, ctx.agentType || "customer_support", t2.response || "");
      await dispatch(ctx, t2.response);
      return t2;
    }
    console.log(`[ORCHESTRATOR] Entering T3 for agent: ${ctx.agentType}`);
    const t3 = await runT3(ctx);
    console.log(`[ORCHESTRATOR] T3 finished. Response length: ${t3.response?.length || 0}`);
    await dispatch(ctx, t3.response);
    return { ...t3, agent_type: ctx.agentType };
  } catch (e) {
    console.error("[ORCHESTRATOR] CRASH in processMessage:", e.message);
    console.error("[ORCHESTRATOR] Stack:", e.stack);
    try {
      await supabase.from("debug_logs").insert({
        level: "error",
        scope: "agent-orchestrator",
        message: e.message,
        metadata: {
          stack: e.stack,
          workspace_id: payload.workspace_id,
          customer_jid: payload.customer_jid,
          message: payload.message
        }
      });
    } catch (dbErr) {
      console.error("[ORCHESTRATOR] Failed to log crash to DB:", dbErr.message);
    }
    await dispatchFallback(supabase, payload);
    return { handled: true, response: STATIC_FALLBACK_MESSAGE, reason: "crash" };
  }
}
async function parseWebhook(req) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
  if (contentLength > 1e6) return null;
  const body = await req.json();
  if (!body.workspace_id) return null;
  body.message = body.message ?? "";
  body.message_type = body.message_type ?? "text";
  return {
    workspace_id: body.workspace_id,
    customer_jid: body.customer_jid || crypto.randomUUID(),
    customer_phone: body.customer_jid?.split("@")[0] || "",
    message: body.message,
    message_type: body.message_type || "text",
    gowa_message_id: body.gowa_message_id || null,
    timestamp: body.timestamp || Date.now(),
    source: body.channel || body.source || "whatsapp",
    is_test: body.is_test || false
  };
}
async function dispatchFallback(supabase, payload) {
  const gowaBase = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "");
  const gowaKey = Deno.env.get("GOWA_API_KEY");
  if (!gowaBase || !gowaKey || payload.source !== "whatsapp") return;
  const phone = payload.customer_jid?.split("@")[0];
  if (!phone) return;
  const { data: gs } = await supabase.from("gowa_sessions").select("gowa_session_id").eq("workspace_id", payload.workspace_id).maybeSingle();
  if (!gs?.gowa_session_id) return;
  const msg = STATIC_FALLBACK_MESSAGE;
  await fetch(`${gowaBase}/send/message`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(gowaKey)}`, "Content-Type": "application/json", "X-Device-Id": gs.gowa_session_id },
    body: JSON.stringify({ phone, message: msg })
  }).catch(() => {
  });
}

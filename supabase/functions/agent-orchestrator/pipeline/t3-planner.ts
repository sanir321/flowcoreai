import { PipelineContext, TierResult, AgentPlan } from "../lib/types.ts";
import { callLLM, FALLBACK_MODEL } from "../lib/llm.ts";
import { toolExecutor } from "../tools/executor.ts";
import { SUBMIT_PLAN_TOOL, ALL_TOOLS, AGENT_TOOLS } from "../tools/registry.ts";
import { buildBookingSystemPrompt } from "../agents/booking.ts";
import { buildSupportSystemPrompt } from "../agents/support.ts";
import { buildSalesSystemPrompt } from "../agents/sales.ts";
import { matchChunks } from "../tools/impl/kb.ts";
import { touchSession } from "../lib/session.ts";

const AGENT_SYSTEM_PROMPTS: Record<string, (ctx: PipelineContext) => string> = {
  customer_support: buildSupportSystemPrompt,
  appointment_booking: buildBookingSystemPrompt,
  sales: buildSalesSystemPrompt,
};

const MAX_T3_ITERATIONS = 5;
const MAX_CONSECUTIVE_TOOL_FAILURES = 3;

export async function runT3(ctx: PipelineContext): Promise<TierResult> {
  const t3Start = Date.now();
  let agentType = ctx.agentType || "customer_support";

  const { data: agent } = await ctx.supabase
    .from("workspace_agents")
    .select("*")
    .eq("workspace_id", ctx.session.workspace_id)
    .eq("agent_type", agentType)
    .maybeSingle();

  if (agent) {
    ctx.session.workspace_agents = agent;
  }

  if (ctx.session?.status === "escalated") {
    const handoffResult = await toolExecutor.run("transfer_agent", {
      target_agent: "customer_support",
      reason: "escalation"
    }, ctx);
    const response = handoffResult?.response
      ?? "I completely understand why this is frustrating. I am escalating your profile to our management team right now so they can resolve this.";
    await ctx.supabase.from("conversation_sessions")
      .update({ agent_type: "customer_support", updated_at: new Date().toISOString() })
      .eq("id", ctx.session.id);
    ctx.agentType = "customer_support";
    await postProcess(ctx, null, null, response, "customer_support");
    return { handled: true, response, reason: "t3_escalation_handoff" };
  }

  const { data: latestMsg } = await ctx.supabase
    .from("messages")
    .select("id, created_at, gowa_message_id")
    .eq("session_id", ctx.session.id)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isStale = latestMsg 
    && latestMsg.gowa_message_id !== ctx.payload.gowa_message_id
    && new Date(latestMsg.created_at).getTime() > (ctx.payload.timestamp || 0) + 2000;
    
  if (isStale) {
    const fallback = ctx.workspace?.guardrail_config?.fallback_message
      ?? "I'm not sure about that. Please contact us directly for more information.";
    return { handled: true, response: fallback, reason: "t3_stale_message" };
  }

  const buildPrompt = AGENT_SYSTEM_PROMPTS[agentType] || AGENT_SYSTEM_PROMPTS.customer_support;
  let systemPrompt = buildPrompt(ctx);

  try {
    const agentId = agent?.id;
    if (agentId) {
      const { data: assignments } = await ctx.supabase
        .from("agent_skill_assignments")
        .select("skill_id")
        .eq("agent_id", agentId);
      if (assignments && assignments.length > 0) {
        const skillIds = assignments.map((a: any) => a.skill_id);
        const { data: skills } = await ctx.supabase
          .from("agent_skills")
          .select("name, description, condition, instructions")
          .in("id", skillIds)
          .eq("is_active", true);
        if (skills && skills.length > 0) {
          const blocks = skills.map((s: any) => {
            let block = `## ${s.name}`;
            if (s.description) block += `\n${s.description}`;
            if (s.condition) block += `\nTrigger: ${s.condition}`;
            block += `\n${s.instructions}`;
            return block;
          });
          systemPrompt += "\n\n" + blocks.join("\n\n");
        }
      }
    }
  } catch (e: any) {
    console.error("[T3] Skills injection failed:", e.message);
  }

  if (ctx.pricingBlocked) {
    systemPrompt += "\n\n[SECURITY] Pricing information is restricted for this workspace. Do NOT provide specific prices. Instead, refer the customer to the official website or offer to connect them with a human.";
  }

  systemPrompt += `\n\n## Current Date/Time\nToday is ${new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", year: "numeric", month: "long", day: "numeric" })}. Current time in India is ${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })} IST. Use this to calculate relative dates like "tomorrow", "next week", "today" correctly.`;

  // For booking agent, inject existing appointment info
  if (agentType === "appointment_booking") {
    try {
      const { data: existingAppt } = await ctx.supabase
        .from("appointments")
        .select("id, start_at, service, status")
        .eq("session_id", ctx.session.id)
        .not("status", "eq", "cancelled")
        .maybeSingle();
      
      if (existingAppt) {
        const apptDate = new Date(existingAppt.start_at);
        const now = new Date();
        const diffDays = Math.floor((apptDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        let temporalHint: string;
        if (diffDays < -1) {
          temporalHint = `This appointment was ${Math.abs(diffDays)} days ago (PAST).`;
        } else if (diffDays === -1) {
          temporalHint = "This appointment was yesterday (PAST).";
        } else if (diffDays === 0) {
          temporalHint = "This appointment is TODAY.";
        } else if (diffDays === 1) {
          temporalHint = "This appointment is TOMORROW.";
        } else {
          temporalHint = `This appointment is in ${diffDays} days (FUTURE).`;
        }
        systemPrompt += `\n\n## IMPORTANT: Existing Appointment Detected\nThis customer already has a confirmed appointment:\n- ID: ${existingAppt.id}\n- Service: ${existingAppt.service}\n- Date/Time: ${existingAppt.start_at}\n- Status: ${existingAppt.status}\n- Relative: ${temporalHint}\n\nCRITICAL: Use the RELATIVE timing above to decide what to say. If the appointment is PAST, do NOT say "tomorrow" or "coming up" — acknowledge it was scheduled and ask if they want to reschedule. If it's today/tomorrow, confirm the upcoming booking.\n\nDo NOT attempt to create another appointment. Instead:\n1. Inform the customer about their existing booking\n2. Ask if they need to reschedule, cancel, or have questions\n3. Use the appointment ID for any updates or cancellations`;
      }
    } catch (e: any) {
      console.error("[T3] Failed to check existing appointment:", e.message);
    }
  }

  const tone = ctx._emotionalTone;
  if (tone && tone !== "calm" && tone !== "positive") {
    const toneInstructions: Record<string, string> = {
      frustrated: "Calibrate: speak calmly and briefly. Do not match their agitation. Acknowledge their feelings before moving to solutions. Use short, clean sentences. If frustration persists past 2 exchanges, escalate using transfer_agent.",
      urgent: "Calibrate: prioritize speed and clarity. Give clear timelines. Avoid extra information — focus on what matters now. If you cannot resolve immediately, warm-transfer to a human with full context.",
      distressed: "Calibrate: slow down your responses. Use a warmer, more patient tone. Let them know you understand. Do not overwhelm with options. If safety is involved, escalate immediately."
    };
    systemPrompt += `\n\n## Emotional Calibration\nDetected customer tone: ${tone}. ${toneInstructions[tone] || "Respond with extra care."}`;
  }

  if (ctx._churnRisk) {
    systemPrompt += "\n\n[CHURN WARNING] The customer is showing signals they may leave. Handle with care — probe gently, never pressure. If this is a cancellation request, follow the retention protocol: first understand the reason, then address the root cause, then present an alternative before processing.";
  }

  if (ctx._maskedComplaint) {
    systemPrompt += "\n[COMPLAINT PROBE] The customer may be framing a complaint behind a question. After answering their surface question, gently ask if they've had a specific issue: e.g., 'Have you run into something specific?'";
  }

  if (ctx._escalationLevel && ctx._escalationLevel !== "normal") {
    const escalationRules: Record<string, string> = {
      immediate: "IMMEDIATE ESCALATION REQUIRED: safety, legal threat, or authority limit reached. Do not delay — call transfer_agent with full context.",
      urgent: "URGENT: customer is nearing escalation threshold (furious, requesting manager, or threatening social media/chargeback). Offer warm transfer proactively.",
      standard: "STANDARD: issue may require specialist or management attention. Resolve what you can, warm-transfer the rest with full context."
    };
    systemPrompt += `\n\n## Escalation Severity\n${escalationRules[ctx._escalationLevel]}`;
  }

  if (ctx._ventVsSolve === "vent") {
    systemPrompt += "\n[VENT DETECTED] The customer may need to be heard before they want a solution. Let them finish. Acknowledge their experience fully before offering to help. Do not jump to troubleshooting.";
  }

  if (agentType === "customer_support") {
    try {
      const kbResult = ctx.kbSearchPromise
        ? await ctx.kbSearchPromise
        : await matchChunks({ query: ctx.payload.message }, ctx);
      ctx.kbHadResults = Array.isArray(kbResult?.chunks || kbResult?.kb_chunks) &&
        (kbResult?.chunks || kbResult?.kb_chunks || []).length > 0;
    } catch (e: any) {
      console.error("[T3] KB check failed:", e.message);
    }
  }

  if (ctx.routingReason === "management_priority") {
    try {
      const { getHistory } = await import("../tools/impl/contact.ts");
      const history = await getHistory({}, ctx);
      if (history && !history.error) {
        systemPrompt += `\n\n[SMART CONTEXT] Existing Appointments for this user:\n${JSON.stringify(history.appointments || [])}\nUse these IDs for manage_appointment update/cancel actions.`;
      }
    } catch (e: any) {
      console.error("[T3] Smart Context failed:", e.message);
    }
  }

  systemPrompt += buildToolDescriptions(agentType, ctx.payload.source);

  const messages = await buildMessages(ctx);

  let parsedPlan: AgentPlan;
  let llmResponse: any;
  let lastError: any;

  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const llmOpts: any = {
        agentType,
        max_tokens: 600,
        temperature: 0.3,
        system: systemPrompt,
        messages,
        tools: [SUBMIT_PLAN_TOOL],
      };
      if (attempt < 1) {
        llmOpts.tool_choice = { type: "function", function: { name: "submit_plan" } };
      }
      llmResponse = await callLLM(llmOpts);

      const toolCall = llmResponse.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall && toolCall.function.name === "submit_plan") {
        parsedPlan = JSON.parse(toolCall.function.arguments);
        lastError = null;
        break;
      }

      // Accept any other tool call as an action wrap
      if (toolCall) {
        parsedPlan = {
          response: "",
          actions: [{ tool: toolCall.function.name, params: JSON.parse(toolCall.function.arguments || "{}") }]
        };
        needsPass2 = true;
        lastError = null;
        break;
      }

      // Accept content-only response
      const msg0 = llmResponse.choices?.[0]?.message;
      const content = (msg0?.content || msg0?.reasoning_content || "").trim();
      if (content && content.length > 0) {
        parsedPlan = { response: content, actions: [] };
        lastError = null;
        break;
      }

      throw new Error("LLM did not call submit_plan");
    } catch (e: any) {
      lastError = e;
      console.error(`[T3] Plan attempt ${attempt + 1} error:`, e.message);
      if (attempt < 1) {
        await new Promise(res => setTimeout(res, 1000 + Math.random() * 1000));
      }
    }
  }

  if (lastError) {
    console.error("[T3] All plan attempts failed. Attempting bare-text fallback LLM call.");
    try {
      const ZEN_KEY = Deno.env.get("OPENCODE_ZEN_API_KEY");
      const ZEN_BASE = (Deno.env.get("OPENCODE_ZEN_BASE_URL") || "https://opencode.ai/zen/v1").replace(/\/+$/, "");
      const fallbackBody = {
        model: FALLBACK_MODEL,
        messages: [
          { role: "system", content: `You are a helpful assistant for ${ctx.workspace?.name || "this business"}. Be brief, natural, and helpful.` },
          { role: "user", content: ctx.payload.message },
        ],
        max_tokens: 200,
        temperature: 0.5,
        stream: false,
      };
      const fc = new AbortController();
      const ft = setTimeout(() => fc.abort(), 12000);
      try {
        const fb = await fetch(ZEN_BASE + "/chat/completions", {
          method: "POST",
          headers: { Authorization: "Bearer " + ZEN_KEY, "Content-Type": "application/json" },
          body: JSON.stringify(fallbackBody),
          signal: fc.signal,
        });
        if (fb.ok) {
          const fj = await fb.json();
          const msg = fj?.choices?.[0]?.message;
          const text = (msg?.content || msg?.reasoning_content || "").trim();
          if (text && text.length > 0) {
            return { handled: true, response: text, reason: "t3_plan_execute" };
          }
        }
      } finally { clearTimeout(ft); }
    } catch (e2: any) {
      console.error("[T3] Bare-text fallback also failed:", e2.message);
    }

    return {
      handled: true,
      response: ctx.workspace?.guardrail_config?.fallback_message ?? "I'm not sure about that. Please contact us directly for more information.",
      reason: "t3_plan_error"
    };
  }

  try {
    await ctx.supabase.from("agent_traces").insert({
      session_id: ctx.session.id,
      workspace_id: ctx.payload.workspace_id,
      trace_id: crypto.randomUUID(),
      model_used: llmResponse?.model || FALLBACK_MODEL,
      tokens_used: llmResponse?.usage?.total_tokens || 0,
      intent_detected: ctx.agentType || agentType,
      message_length: ctx.payload.message.length,
      response_length: parsedPlan.response.length,
      latency_ms: Date.now() - t3Start
    });
  } catch (e: any) {
    console.error("[T3] Failed to insert agent_trace:", e.message);
  }

  let finalResponse = parsedPlan.response;
  let toolResults: PromiseSettledResult<any>[] = [];
  let needsPass2 = parsedPlan.needs_second_pass;

  if (parsedPlan.actions.length > 0) {
    ctx._toolFailCounts = {};
    toolResults = await Promise.allSettled(
      parsedPlan.actions.map(action =>
        toolExecutor.run(action.tool, action.params, ctx)
      )
    );

    for (let i = 0; i < toolResults.length; i++) {
      const r = toolResults[i];
      if (r.status === "rejected") {
        needsPass2 = true;
      } else if (r.value?.error) {
        needsPass2 = true;
      }
    }

    const forcePass2Tools = ["manage_appointment", "escalate"];
    const hasForcePass2 = parsedPlan.actions.some(a => forcePass2Tools.includes(a.tool));
    if (hasForcePass2) needsPass2 = true;

    const requiredFailed = parsedPlan.actions.some((action, i) =>
      action.required && toolResults[i].status === "rejected"
    );

    if (requiredFailed) {
      finalResponse = (parsedPlan.fallback || "").replace(/\{[^}]+\}/g, "");
      needsPass2 = false;
    }

    if (ctx._toolFailCounts) {
      for (const [, failCount] of Object.entries(ctx._toolFailCounts)) {
        if (failCount >= MAX_CONSECUTIVE_TOOL_FAILURES) {
          console.warn(`[T3] Tool failed ${failCount} consecutive times — circuit open`);
          needsPass2 = true;
          break;
        }
      }
    }
  }

  if (parsedPlan.actions.length > 0) {
    await toolExecutor.flushToolCalls(ctx);
  }

  if (toolResults.length > 0) {
    const catalogHasItems = parsedPlan.actions.some(a => a.tool === "manage_catalog" && a.params?.action === "search")
      && toolResults.some(r => r.status === "fulfilled" && r.value?.items?.length > 0);

    if (needsPass2 && !catalogHasItems) {
      try {
        const pass2System = buildPass2System(ctx, agentType);
        const toolContext = buildToolContext(parsedPlan.actions, toolResults);
        const toolCalls = llmResponse?.choices?.[0]?.message?.tool_calls;
        if (toolCalls && toolCalls.length > 0) {
          const secondPassResponse = await callLLM({
            agentType, max_tokens: 600, temperature: 0.3,
            system: pass2System,
            messages: [
              ...messages,
              { role: "assistant", content: "", tool_calls: toolCalls },
              { role: "tool", tool_call_id: toolCalls[0].id, content: toolContext }
            ]
          });
          finalResponse = secondPassResponse.choices?.[0]?.message?.content || parsedPlan.fallback || "";
        }
      } catch (e: any) {
        console.error("[T3] Second pass error:", e.message);
      }
    }

    finalResponse = fillTemplate(finalResponse, parsedPlan.actions, toolResults);
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

  finalResponse = finalResponse
    .replace(/\{[^}]+\}/g, "")
    .replace(/\[Correction:[^\]]*\]/gi, "")
    .trim();

  if (!finalResponse || finalResponse.trim().length === 0) {
    finalResponse = parsedPlan.fallback || ctx.workspace?.guardrail_config?.fallback_message || "Thank you for your message. How else can I help you?";
  }

  const sentimentMatch = finalResponse.match(/^\[SENTIMENT:\s*(\w+)\]\s*/i);
  if (sentimentMatch) {
    ctx._sentiment = sentimentMatch[1].toLowerCase();
    finalResponse = finalResponse.slice(sentimentMatch[0].length).trim();
  }

  await postProcess(ctx, llmResponse, parsedPlan, finalResponse, agentType);

  return { handled: true, response: finalResponse, reason: "t3_plan_execute" };
}

async function buildMessages(ctx: PipelineContext) {
  const historyCount = (ctx.workspace as any)?.kb_config?.message_history_count ?? 6;
  const { data: msgHistory } = await ctx.supabase
    .from("messages")
    .select("role, content, created_at")
    .eq("session_id", ctx.session.id)
    .order("created_at", { ascending: false })
    .limit(historyCount);

  const history = (msgHistory || []).reverse();
  const messages: any[] = [];

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

function buildPass2System(ctx: PipelineContext, agentType: string): string {
  const workspace = ctx.workspace || {};
  const profile = (workspace as any)?.business_profile || {};
  const hours = profile.hours?.daily;
  let hoursInfo = "";
  if (hours) {
    const openDays = Object.entries(hours)
      .filter(([, d]: [string, any]) => !d.closed)
      .map(([day, d]: [string, any]) => `${day.charAt(0).toUpperCase() + day.slice(1)} ${d.open}-${d.close}`)
      .join(', ');
    if (openDays) hoursInfo = `\nBusiness hours: ${openDays}.`;
  }

  return `You are a ${agentType.replace("_", " ")} assistant for ${workspace.name || "a business"}.
You already called tools and results are below.

CRITICAL: Your response is the FINAL message to the customer. Be brief and direct. 2-3 sentences only.

Slot taken? → "That time is taken. Would you like [nearby_time_1] or [nearby_time_2] instead?"
Booked? → "Your [service] is confirmed for [date] at [time]. Details: [link]"
Unreachable calendar? → "Our booking system is offline. Please leave your name/phone/email and we'll follow up."
Closed? → "We're closed then. Our hours are [hours]. Please pick another time."
- manage_catalog: If items are returned (non-empty array), LIST them in your response grouped by category with prices. Do NOT just say "let me show you" — actually show the items.
- Other tools: "error" field means it failed. "success: false" means it failed. Otherwise assume success.${hoursInfo}

Write ONLY the customer-facing message. Under 150 words. Use single *asterisks* for emphasis (not double).`;
}

function enrichResponseWithToolResults(
  response: string,
  actions: { tool: string }[],
  results: PromiseSettledResult<any>[]
): string | null {
  let enriched = response;
  let appended: string[] = [];

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const result = results[i];
    if (result?.status !== "fulfilled") continue;
    const data = result.value?.data || result.value;
    if (!data?.success) continue;

    switch (action.tool) {
      case "manage_catalog": {
        const items = data.items || data.data || [];
        if (Array.isArray(items) && items.length > 0) {
          const formatted = items.map((item: any) => {
            const name = item.name || item.title || "";
            const price = item.price ? ` - Rs.${item.price}` : "";
            return `- ${name}${price}`;
          }).join("\n");
          appended.push(`\n\nHere are our available items:\n${formatted}`);
        }
        break;
      }
      case "manage_appointment": {
        const slots = data.slots || data.available_slots || [];
        if (Array.isArray(slots) && slots.length > 0) {
          const formatted = slots.slice(0, 5).map((s: any) => {
            const time = s.time || s.start_time || "";
            return `- ${time}`;
          }).join("\n");
          appended.push(`\n\nAvailable slots:\n${formatted}`);
        }
        if (data.appointment_link) {
          appended.push(`\n\nAppointment details: ${data.appointment_link}`);
        }
        if (data.already_booked) {
          appended.push(`\n\nExisting appointment ID: ${data.id}. Service: ${data.service}. Date: ${data.start_at}`);
        }
        if (data.error) {
          appended.push(`\n\n${data.error}`);
        }
        break;
      }
      case "search_kb": {
        const chunks = data.chunks || data.kb_chunks || data.results || [];
        if (Array.isArray(chunks) && chunks.length > 0) {
          const text = chunks.map((c: any) => c.content || c.text || "").filter(Boolean).join("\n").slice(0, 500);
          if (text) appended.push(`\n\n${text}`);
        }
        break;
      }
      case "place_order": {
        if (data.success && data.order_number) {
          const itemLines = (data.items || []).map((i: any) => `• ${i.name} × ${i.qty} = ₹${(i.qty * i.price).toLocaleString()}`).join("\n");
          appended.push(`\n\n*Order ${data.order_number}*\n${itemLines}\n*Total: ₹${Number(data.total || 0).toLocaleString()}*\n\nWe'll contact you shortly for payment and delivery.`);
        }
        if (data.unknown_items?.length) {
          appended.push(`\n\nThese items aren't on our menu: ${data.unknown_items.join(", ")}. Could you pick from the menu?`);
        }
        break;
      }
      case "manage_contact": {
        if (data.stage) {
          appended.push(`\n\n✅ Lead moved to "${data.stage}" stage.`);
        }
        if (data.summary) {
          appended.push(`\n\n${data.summary}`);
        } else if (data.pipeline) {
          const lines = Object.entries(data.pipeline)
            .filter(([_, c]) => (c as number) > 0)
            .map(([stage, count]) => `- ${stage}: ${count}`)
            .join("\n");
          if (lines) appended.push(`\n\nPipeline overview:\n${lines}`);
        }
        if (data.id || data.lead_id || data.contact_id) {
          appended.push(`\n\nI have saved your information. Our team will follow up with you.`);
        }
        if (data.follow_up_id) {
          appended.push(`\n\n✅ Follow-up scheduled for ${new Date(data.scheduled_at).toLocaleString()}.`);
        }
        break;
      }
      case "get_business_info": {
        const profile = data?.data || data;
        const parts: string[] = [];
        if (typeof profile.description === "string") parts.push(profile.description);
        if (profile.contact?.phone) parts.push(`Phone: ${profile.contact.phone}`);
        if (profile.contact?.email) parts.push(`Email: ${profile.contact.email}`);
        if (profile.contact?.address) parts.push(`Address: ${profile.contact.address}`);
        if (profile.hours?.daily) {
          const days = Object.entries(profile.hours.daily)
            .filter(([_, d]: [string, any]) => !d.closed)
            .map(([day, d]: [string, any]) => `${day.charAt(0).toUpperCase() + day.slice(1)}: ${d.open}-${d.close}`)
            .join(', ');
          if (days) parts.push(`Hours: ${days}`);
        }
        if (profile.pricing?.description) parts.push(`Pricing: ${profile.pricing.description}`);
        if (profile.extras?.project_types?.length) parts.push(`Projects: ${profile.extras.project_types.join(', ')}`);
        if (profile.amenities?.length) parts.push(`Amenities: ${profile.amenities.join(', ')}`);
        if (parts.length > 0) appended.push(`\n\n${parts.join('\n')}`);
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

function buildToolContext(actions: any[], results: PromiseSettledResult<any>[]): string {
  return actions.map((a, i) => {
    const r = results[i];
    const status = r.status === "fulfilled" ? "SUCCESS" : "FAILED";
    const data = r.status === "fulfilled" ? JSON.stringify(r.value) : r.reason?.message;
    return `[${a.tool}] ${status}: ${data}`;
  }).join("\n");
}

function fillTemplate(
  template: string,
  actions: { tool: string; result_key?: string }[],
  results: PromiseSettledResult<any>[]
): string {
  let filled = template.replace(/\s*\[Correction:[^\]]*\]/g, "");
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

function flattenObject(obj: any, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(obj)) {
    const k = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === "object" && !Array.isArray(val)) {
      Object.assign(result, flattenObject(val, k));
    } else if (Array.isArray(val)) {
      const lines = val.slice(0, 10).map((v: any) => {
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

async function handleHandoff(ctx: PipelineContext, targetAgent: string, context: string): Promise<TierResult> {
  if (ctx.payload.source === "widget") {
    return { handled: true, response: "I'm sorry, transfers are not available through the web widget. Please reach out via WhatsApp for specialized assistance.", reason: "widget_handoff_blocked" };
  }
  const depth = (ctx.handoffDepth ?? 0) + 1;
  if (depth > 2) {
    const fallbackResponse = "I've reached the limit for transferring between specialists. A human agent will follow up with you shortly.";
    await ctx.supabase.from("conversation_sessions")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: fallbackResponse.substring(0, 100),
        message_count: (ctx.session.message_count || 0) + 1,
      })
      .eq("id", ctx.session.id);
    return { handled: true, response: fallbackResponse, reason: "handoff_depth_limit" };
  }

  await ctx.supabase.from("conversation_sessions")
    .update({ 
      agent_type: targetAgent, 
      working_context: {
        ...(ctx.session.working_context || {}),
        transferred: true
      },
      updated_at: new Date().toISOString() 
    })
    .eq("id", ctx.session.id);

  ctx.agentType = targetAgent;
  ctx.routingReason = "handoff_execution";
  ctx.handoffDepth = depth;
  
  return await runT3(ctx);
}

async function postProcess(
  ctx: PipelineContext,
  llmResponse: any,
  plan: any,
  finalResponse: string,
  agentType: string,
  skipCredits = false
) {
  if (!ctx.payload.is_test && !skipCredits) {
    try {
      await ctx.supabase.rpc("decrement_credits", {
        p_workspace_id: ctx.payload.workspace_id,
        p_credits: 1
      });
    } catch (e: any) {
      console.error("[CREDITS] decrement_credits RPC failed:", e?.message || e);
    }
  }

  await toolExecutor.flushToolCalls(ctx);
  const usage = llmResponse?.usage?.total_tokens || 0;
  await touchSession(ctx, agentType, finalResponse, usage);
}

function buildToolDescriptions(agentType: string, source?: string): string {
  const allowed = AGENT_TOOLS[agentType] || AGENT_TOOLS.customer_support;
  const filtered = source === "widget" ? allowed.filter(n => n !== "transfer_agent") : allowed;
  return `\n\n## Allowed Tools\n${filtered.map(n => `- ${n}`).join("\n")}`;
}



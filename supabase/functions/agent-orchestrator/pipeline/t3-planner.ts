import { PipelineContext, TierResult, AgentPlan } from "../lib/types.ts";
import { callLLM } from "../lib/llm.ts";
import { toolExecutor } from "../tools/executor.ts";
import { SUBMIT_PLAN_TOOL, getAgentToolDefinitions } from "../tools/registry.ts";
import { buildBookingSystemPrompt } from "../agents/booking.ts";
import { buildSupportSystemPrompt } from "../agents/support.ts";
import { buildSalesSystemPrompt } from "../agents/sales.ts";
import { matchChunks } from "../tools/impl/kb.ts";

const AGENT_SYSTEM_PROMPTS: Record<string, (ctx: PipelineContext) => string> = {
  customer_support: buildSupportSystemPrompt,
  appointment_booking: buildBookingSystemPrompt,
  sales: buildSalesSystemPrompt,
};

const MAX_T3_ITERATIONS = 5;
const MAX_CONSECUTIVE_TOOL_FAILURES = 3;

export async function runT3(ctx: PipelineContext): Promise<TierResult> {
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

  const { data: sessionStatus } = await ctx.supabase
    .from("conversation_sessions")
    .select("status")
    .eq("id", ctx.session.id)
    .single();
  if (sessionStatus?.status === "escalated") {
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

  if (ctx._msgCount === undefined) {
    const { count } = await ctx.supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("session_id", ctx.session.id)
      .eq("direction", "inbound");
    ctx._msgCount = count || 0;
  }

  const { count: currentCount } = await ctx.supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("session_id", ctx.session.id)
    .eq("direction", "inbound");
    
  if (currentCount !== null && currentCount > (ctx._msgCount || 0)) {
    const fallback = ctx.workspace?.guardrail_config?.fallback_message
      ?? "I'm not sure about that. Please contact us directly for more information.";
    return { handled: true, response: fallback, reason: "t3_stale_message" };
  }

  const buildPrompt = AGENT_SYSTEM_PROMPTS[agentType] || AGENT_SYSTEM_PROMPTS.customer_support;
  let systemPrompt = buildPrompt(ctx);

  if (agentType === "customer_support") {
    try {
      const kbResult = ctx.kbSearchPromise
        ? await ctx.kbSearchPromise
        : await matchChunks({ query: ctx.payload.message }, ctx);
      const chunks = kbResult?.chunks || kbResult?.kb_chunks || [];
      ctx.kbHadResults = Array.isArray(chunks) && chunks.length > 0;

      if (ctx.kbHadResults) {
        const { data: ws } = await ctx.supabase
          .from("workspaces")
          .select("kb_config")
          .eq("id", ctx.payload.workspace_id)
          .maybeSingle();
        const kbConfig = ws?.kb_config || { match_count: 3, match_threshold: 0.35, chunk_truncation: 800, noise_stripping: true };
        const truncation = kbConfig.chunk_truncation ?? 800;
        const noiseStripping = kbConfig.noise_stripping ?? true;

        const context = chunks
          .map((c: any, i: number) => {
            const raw = (c.content || c.text || "").trim();
            let text = raw;
            if (noiseStripping) {
              text = text
                .replace(/###\s*\n/g, '')
                .replace(/#####\s*/g, '')
                .replace(/######\s*/g, '')
                .replace(/<[^>]+>/g, '')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
              text = text.replace(/!\[.*?\]\([^)]*\)/gi, '');
              text = text.replace(/\[read more\]\([^)]*\)/gi, '');
            }
            return `[${i + 1}] ${text.slice(0, truncation)}`;
          })
          .filter((t: string) => t.length > 10)
          .join("\n\n");
        systemPrompt += `\n\n## Knowledge Base Context\nThe following excerpts were retrieved from the business knowledge base for this question. Answer using ONLY these excerpts and the business profile above. Do not invent details not present here.\n\n${context}`;
      } else {
        systemPrompt += `\n\n## Knowledge Base Context\nNo relevant knowledge base entries were found for this question. Do NOT guess or invent an answer. Tell the customer you don't have that information on hand, and offer to create a support ticket or connect them with a human.`;
      }
    } catch (e: any) {
      console.error("[T3] KB injection failed:", e.message);
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

  const messages = await buildMessages(ctx);

  let parsedPlan: AgentPlan;
  let llmResponse: any;
  let lastError: any;

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      llmResponse = await callLLM({
        agentType,
        max_tokens: 1000,
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
      lastError = null;
      break;
    } catch (e: any) {
      lastError = e;
      console.error(`[T3] Plan attempt ${attempt + 1} error:`, e.message);
      if (attempt < 2) {
        await new Promise(res => setTimeout(res, 2000 * Math.pow(2, attempt)));
      }
    }
  }

  if (lastError) {
    return {
      handled: true,
      response: ctx.workspace?.guardrail_config?.fallback_message ?? "I'm not sure about that. Please contact us directly for more information.",
      reason: "t3_plan_error"
    };
  }

  await validatePlanActions(ctx, parsedPlan);

  try {
    await ctx.supabase.from("agent_traces").insert({
      session_id: ctx.session.id,
      workspace_id: ctx.payload.workspace_id,
      trace_id: crypto.randomUUID(),
      model_used: "gpt-5-mini",
      tokens_used: llmResponse?.usage?.total_tokens || 0,
      intent_detected: ctx.agentType || agentType,
      message_length: ctx.payload.message.length,
      response_length: parsedPlan.response.length,
      latency_ms: 0
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

  if (needsPass2 && toolResults.length > 0) {
    try {
      const pass2System = buildPass2System(ctx, agentType);
      const toolContext = buildToolContext(parsedPlan.actions, toolResults);
      
      const secondPassResponse = await callLLM({
        agentType,
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
    } catch (e: any) {
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

  const sentimentMatch = finalResponse.match(/^\[SENTIMENT:\s*(\w+)\]\s*/i);
  if (sentimentMatch) {
    ctx._sentiment = sentimentMatch[1].toLowerCase();
    finalResponse = finalResponse.slice(sentimentMatch[0].length).trim();
  }

  await postProcess(ctx, llmResponse, parsedPlan, finalResponse, agentType);

  return { handled: true, response: finalResponse, reason: "t3_plan_execute" };
}

async function buildMessages(ctx: PipelineContext) {
  const { data: msgHistory } = await ctx.supabase
    .from("messages")
    .select("*")
    .eq("session_id", ctx.session.id)
    .order("created_at", { ascending: false })
    .limit(15);

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
  return `You are a ${agentType.replace("_", " ")} assistant for ${workspace.name || "a business"}.
You already decided what tools to call. Tool results are provided below.
Write ONLY the customer-facing message. Keep it under 150 words. Plain text only, no markdown.`;
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
      case "generate_quote": {
        if (data.quote_text) {
          appended.push(`\n\n${data.quote_text}`);
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
  const depth = (ctx.handoffDepth ?? 0) + 1;
  if (depth > 2) {
    console.log(`[T3] Handoff depth limit reached (${depth}). Returning fallback.`);
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

  console.log(`[T3] Executing handoff to: ${targetAgent}. Depth: ${depth}. Context: ${context.substring(0, 50)}...`);
  
  await ctx.supabase.from("conversation_sessions")
    .update({ 
      agent_type: targetAgent, 
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
        p_credits: 1,
        p_session_id: ctx.session.id
      });
    } catch (_) {}
  }

  await toolExecutor.flushToolCalls(ctx);

  const usage = llmResponse?.usage?.total_tokens || 0;
  const updateData: any = {
    agent_type: agentType,
    last_message_at: new Date().toISOString(),
    last_message_preview: finalResponse.substring(0, 100),
    message_count: (ctx.session.message_count || 0) + 1,
    total_tokens_used: (ctx.session.total_tokens_used || 0) + usage,
    updated_at: new Date().toISOString()
  };

  if (ctx._sentiment && ctx._sentiment !== (ctx.session.working_context?.sentiment || null)) {
    updateData.working_context = {
      ...(ctx.session.working_context || {}),
      sentiment: ctx._sentiment,
      agent_type: agentType
    };
  }

  await ctx.supabase.from("conversation_sessions")
    .update(updateData)
    .eq("id", ctx.session.id);
}

async function validatePlanActions(ctx: PipelineContext, plan: AgentPlan) {
  const actionTools = plan.actions.map(a => a.tool);

  const { data: lastCustomerMsg } = await ctx.supabase
    .from("messages")
    .select("content")
    .eq("session_id", ctx.session.id)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const customerMsg = (lastCustomerMsg?.content || "").toLowerCase();

  const capturePhrases = /(captured|saved your (details|info)|added you as a lead|i have saved your)/i;
  if (capturePhrases.test(plan.response) && !actionTools.includes("manage_contact")) {
    plan.response = plan.response.replace(/I have saved your (information|details|info)[^.]*\./gi, "");
    plan.response += " [Correction: You claimed to save contact info without calling manage_contact. Apologize and ask again.]";
    plan.needs_second_pass = true;
  }

  const stagePhrases = /(moved (you|to|the (lead|contact)) to |promoted to|advanced to|stage (change|update)|qualified|proposal|negotiation)/i;
  if (stagePhrases.test(plan.response) && !actionTools.includes("manage_contact")) {
    plan.response = plan.response.replace(/(I['"]?ve|I have) (moved|promoted|advanced)( you| the)?[^.]*\./gi, "");
    plan.response += " [Correction: You claimed to update the pipeline stage without calling manage_contact. Apologize.]";
    plan.needs_second_pass = true;
  }

  const bookingPhrases = /(booked|confirmed|appointment is (set|created|booked|scheduled|confirmed)|i have (booked|created|scheduled|confirmed) (your|the) appointment)/i;
  if (bookingPhrases.test(plan.response) && !actionTools.includes("manage_appointment")) {
    const wc = ctx.session.working_context || {};
    const collected = wc.collected_data || {};
    const hasRealDetails = collected.name || collected.service || collected.date || collected.time;
    const availabilityAction = plan.actions.find(a => a.tool === "manage_appointment" && a.params?.action === "check");
    if (availabilityAction && hasRealDetails) {
      plan.actions.push({
        tool: "manage_appointment",
        params: { action: "create", name: collected.name || "", service: collected.service || "", date: availabilityAction.params?.date || collected.date || "", time: availabilityAction.params?.time || collected.time || "" },
        required: true,
        result_key: "appointment"
      });
      plan.needs_second_pass = true;
      plan.response += " [Correction: manage_appointment was missing — auto-injected.]";
    } else {
      plan.response = plan.response
        .replace(/Your[^.]+(booked|confirmed|scheduled)[^.]*\./gi, "")
        .replace(/I['"]?ve (booked|created|scheduled|confirmed)[^.]*\./gi, "")
        .replace(/i have (booked|created|scheduled|confirmed)[^.]*\./gi, "")
        .trim();
      plan.needs_second_pass = true;
      if (!plan.response) {
        plan.response = "I'd be happy to help you book! Could you tell me which service you're looking for?";
      } else {
        plan.response += " [Correction: You claimed the appointment was booked without required details. Ask for their name, service, date and time, then call manage_appointment.]";
      }
    }
  }

  const pricingPhrases = /(₹|rs\.?\s*\d+|price|cost|subscription|tier|plan|worth|value)/i;
  const hasPricingClaim = pricingPhrases.test(plan.response);
  const kbUsed = actionTools.includes("search_kb");
  let kbCalledThisSession = false;
  if (hasPricingClaim && !kbUsed) {
    const { data: recentTraces } = await ctx.supabase
      .from("agent_traces")
      .select("tool_name")
      .eq("session_id", ctx.session.id)
      .eq("tool_name", "search_kb")
      .gte("created_at", new Date(Date.now() - 5 * 60000).toISOString())
      .limit(1)
      .maybeSingle();
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
    } catch (_) {}
    plan.actions.push({ tool: "search_kb", params: { query: "pricing and plans" }, required: false });
  }
}

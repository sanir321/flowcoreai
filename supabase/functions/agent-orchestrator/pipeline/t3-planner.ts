import { PipelineContext, TierResult, AgentPlan } from "../lib/types.ts";
import { callLLM } from "../lib/llm.ts";
import { toolExecutor } from "../tools/executor.ts";
import { SUBMIT_PLAN_TOOL, getAgentToolDefinitions } from "../tools/registry.ts";
import { handleBooking, loadOrCreateBookingSession, buildBookingSystemPrompt } from "../agents/booking.ts";
import { buildSupportSystemPrompt } from "../agents/support.ts";
import { buildSalesSystemPrompt } from "../agents/sales.ts";

const AGENT_SYSTEM_PROMPTS: Record<string, (ctx: PipelineContext) => string> = {
  customer_support: buildSupportSystemPrompt,
  appointment_booking: buildBookingSystemPrompt,
  sales: buildSalesSystemPrompt,
};

export async function runT3(ctx: PipelineContext): Promise<TierResult> {
  const agentType = ctx.agentType || "customer_support";

  // 0a. Fetch agent configuration (including personality traits)
  const { data: agent } = await ctx.supabase
    .from("workspace_agents")
    .select("*")
    .eq("workspace_id", ctx.session.workspace_id)
    .eq("agent_type", agentType)
    .maybeSingle();
  
  if (agent) {
    ctx.session.workspace_agents = agent;
  }

  // 0. Escalation check: if session was escalated by T0, bypass LLM and hand off directly
  const { data: sessionStatus } = await ctx.supabase
    .from("conversation_sessions")
    .select("status")
    .eq("id", ctx.session.id)
    .single();
  if (sessionStatus?.status === "escalated") {
    // Use request_handoff tool directly — DO NOT use handleHandoff() which does LLM call
    const handoffResult = await toolExecutor.run("request_handoff", {
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

  // 1. Initial message count for staleness detection
  if (ctx._msgCount === undefined) {
    const { count } = await ctx.supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("session_id", ctx.session.id)
      .eq("direction", "inbound");
    ctx._msgCount = count || 0;
  }

  // 2. Load booking session if this is a booking conversation
  if (agentType === "appointment_booking") {
    await loadOrCreateBookingSession(ctx);

    // 3. Run booking FSM for collecting stages (handled by 8B model)
    const bookingResult = await handleBooking(ctx);
    if (bookingResult) {
      await postProcess(ctx, null, null, bookingResult.response || "", agentType);
      return bookingResult;
    }
  }

  // Staleness guard: skip LLM if another inbound message arrived while we were processing
  const { count: currentCount } = await ctx.supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("session_id", ctx.session.id)
    .eq("direction", "inbound");
    
  if (currentCount !== null && currentCount > (ctx._msgCount || 0)) {
    const fallback = ctx.workspace?.guardrail_config?.fallback_message
      ?? "Thank you for reaching out! Our team will get back to you shortly.";
    return { handled: true, response: fallback, reason: "t3_stale_message" };
  }

  const buildPrompt = AGENT_SYSTEM_PROMPTS[agentType] || AGENT_SYSTEM_PROMPTS.customer_support;
  let systemPrompt = buildPrompt(ctx);

  // Smart Context Injection for management tasks
  if (ctx.routingReason === "management_priority") {
    try {
      const { getHistory } = await import("../tools/impl/contact.ts");
      const history = await getHistory({}, ctx);
      if (history && !history.error) {
        systemPrompt += `\n\n[SMART CONTEXT] Existing Appointments for this user:\n${JSON.stringify(history.appointments || [])}\nUse these IDs for update_appointment or cancel_appointment.`;
      }
    } catch (e: any) {
      console.error("[T3] Smart Context failed:", e.message);
    }
  }
  
  if (ctx.pricingBlocked) {
    systemPrompt += `\n\nCRITICAL: The user is asking about pricing, but your policy FORBIDS disclosing specific prices. Acknowledge their interest in the service, but politely explain that you cannot provide price details over chat and they should contact the business directly for a quote.`;
  }
  
  if (ctx.salesBlocked) {
    systemPrompt += `\n\nCRITICAL: The user is interested in buying or ordering, but your policy FORBIDS processing sales directly over chat. Acknowledge their interest and provide information about the product/service, but explain that you cannot take orders here and they should contact the business directly to purchase.`;
  }

  const messages = await buildMessages(ctx);

  // PASS 1: Plan generation
  let parsedPlan: AgentPlan;
  let llmResponse: any;

  try {
    llmResponse = await callLLM({
      model: "llama-3.3-70b-versatile",
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
  } catch (e: any) {
    console.error("[T3] Plan error:", e.message);
    return {
      handled: true,
      response: ctx.workspace?.guardrail_config?.fallback_message ?? "I'm having trouble understanding that. Could you rephrase?",
      reason: "t3_plan_error"
    };
  }

  // Validate plan: inject missing tool calls when response claims actions were taken
  await validatePlanActions(ctx, parsedPlan);

  // Log trace for observability
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
  } catch (e: any) {
    console.error("[T3] Failed to insert agent_trace:", e.message);
  }

  // Execute actions in parallel
  let finalResponse = parsedPlan.response;
  let toolResults: PromiseSettledResult<any>[] = [];

  if (parsedPlan.actions.length > 0) {
    toolResults = await Promise.allSettled(
      parsedPlan.actions.map(action =>
        toolExecutor.run(action.tool, action.params, ctx)
      )
    );

    const requiredFailed = parsedPlan.actions.some((action, i) =>
      action.required && toolResults[i].status === "rejected"
    );

    if (requiredFailed) {
      finalResponse = (parsedPlan.fallback || "").replace(/\{[^}]+\}/g, "");
      await postProcess(ctx, llmResponse, parsedPlan, finalResponse, agentType, true);
      return { handled: true, response: finalResponse, reason: "t3_fallback_required_failed" };
    }
  }

  // Incorporate tool results into response
  if (toolResults.length > 0) {
    // Always use second pass when tools were executed - prevents LLM from writing
    // hallucinated responses (e.g. "payment confirmed") without actually calling the tool.
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
    } catch (e: any) {
      console.error("[T3] Second pass error:", e.message);
      finalResponse = fillTemplate(parsedPlan.response, parsedPlan.actions, toolResults);
    }
    
    const enriched = enrichResponseWithToolResults(finalResponse, parsedPlan.actions, toolResults);
    if (enriched) finalResponse = enriched;
  }

  // Handoff check
  for (let i = 0; i < parsedPlan.actions.length; i++) {
    const action = parsedPlan.actions[i];
    const result = toolResults[i];
    if (result?.status === "fulfilled" && result.value?.handoff_to) {
      return await handleHandoff(ctx, result.value.handoff_to, result.value.handoff_context || "");
    }
  }

  // Strip any remaining unfilled placeholders
  finalResponse = finalResponse.replace(/\{[^}]+\}/g, "");

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
      case "search_menu": {
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
      case "check_availability": {
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
      case "capture_lead": {
        if (data.id || data.lead_id || data.contact_id) {
          appended.push(`\n\nI have saved your information. Our team will follow up with you.`);
        }
        break;
      }
      case "create_order": {
        if (data.order_id || data.order_number) {
          appended.push(`\n\nYour order ${data.order_number || ""} has been created. Total: Rs.${data.total || 0}. Pay via: ${data.upi_link || ""}`);
        }
        break;
      }
      case "match_kb_chunks": {
        const chunks = data.chunks || data.results || [];
        if (Array.isArray(chunks) && chunks.length > 0) {
          const text = chunks.map((c: any) => c.content || c.text || "").filter(Boolean).join("\n").slice(0, 500);
          if (text) appended.push(`\n\n${text}`);
        }
        break;
      }
      case "confirm_payment": {
        if (data.status === "paid") {
          appended.push(`\n\n✅ Payment confirmed for order ${data.order_number || ""}. Thank you!`);
        }
        break;
      }
      case "get_order_status": {
        if (data.order_number) {
          const line = `Order ${data.order_number}: ${data.status}. Total: ₹${data.total || 0}.`;
          appended.push(`\n\n${line}`);
        }
        break;
      }
      case "generate_quote": {
        if (data.quote_text) {
          appended.push(`\n\n${data.quote_text}`);
        }
        break;
      }
      case "update_lead_stage": {
        if (data.stage) {
          appended.push(`\n\n✅ Lead moved to "${data.stage}" stage.`);
        }
        break;
      }
      case "get_pipeline": {
        if (data.pipeline) {
          const lines = Object.entries(data.pipeline)
            .filter(([_, c]) => (c as number) > 0)
            .map(([stage, count]) => `- ${stage}: ${count}`)
            .join("\n");
          if (lines) appended.push(`\n\nPipeline overview:\n${lines}`);
        }
        break;
      }
      case "schedule_follow_up": {
        if (data.follow_up_id) {
          appended.push(`\n\n✅ Follow-up scheduled for ${new Date(data.scheduled_at).toLocaleString()}.`);
        }
        break;
      }
    }
  }

  if (appended.length === 0) return null;

  // Check if appended content already appears in response
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
  // Strip correction text before filling template
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
    // Update session metadata even on depth limit
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
  
  // 1. Update the session state in the database immediately
  await ctx.supabase.from("conversation_sessions")
    .update({ 
      agent_type: targetAgent, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", ctx.session.id);

  // 2. Update the context for the current execution
  ctx.agentType = targetAgent;
  ctx.routingReason = "handoff_execution";
  ctx.handoffDepth = depth;
  
  // 3. RE-RUN T3 with the new agent persona and tools
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
  // Deduct credits (skip if tools failed)
  if (!ctx.payload.is_test && !skipCredits) {
    try {
      await ctx.supabase.rpc("decrement_credits", {
        p_workspace_id: ctx.payload.workspace_id,
        p_credits: 1,
        p_session_id: ctx.session.id
      });
    } catch (_) {}
  }

  // Update session
  const usage = llmResponse?.usage?.total_tokens || 0;
  await ctx.supabase.from("conversation_sessions")
    .update({
      agent_type: agentType,
      last_message_at: new Date().toISOString(),
      last_message_preview: finalResponse.substring(0, 100),
      message_count: (ctx.session.message_count || 0) + 1,
      total_tokens_used: (ctx.session.total_tokens_used || 0) + usage,
      updated_at: new Date().toISOString()
    })
    .eq("id", ctx.session.id);
}

async function validatePlanActions(ctx: PipelineContext, plan: AgentPlan) {
  const actionTools = plan.actions.map(a => a.tool);

  // Get the customer's last message for intent detection
  const { data: lastCustomerMsg } = await ctx.supabase
    .from("messages")
    .select("content")
    .eq("session_id", ctx.session.id)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const customerMsg = (lastCustomerMsg?.content || "").toLowerCase();

  // --- NEW: Lead capture hallucination detection ---
  const capturePhrases = /(captured|saved your (details|info)|added you as a lead|i have saved your)/i;
  if (capturePhrases.test(plan.response) && !actionTools.includes("capture_lead")) {
    // Strip the offending claim from response
    plan.response = plan.response.replace(/I have saved your (information|details|info)[^.]*\./gi, "");
    plan.response += " [Correction: You claimed to save contact info without calling capture_lead. Apologize and ask again.]";
  }

  // --- NEW: Pipeline stage hallucination detection ---
  const stagePhrases = /(moved (you|to|the (lead|contact)) to |promoted to|advanced to|stage (change|update)|qualified|proposal|negotiation)/i;
  if (stagePhrases.test(plan.response) && !actionTools.includes("update_lead_stage")) {
    plan.response = plan.response.replace(/(I['"]?ve|I have) (moved|promoted|advanced)( you| the)?[^.]*\./gi, "");
    plan.response += " [Correction: You claimed to update the pipeline stage without calling update_lead_stage. Apologize.]";
  }

  // --- NEW: Pricing/KB hallucination detection ---
  const pricingPhrases = /(₹|rs\.?\s*\d+|price|cost|subscription|tier|plan|worth|value)/i;
  const hasPricingClaim = pricingPhrases.test(plan.response);
  const kbUsed = actionTools.includes("match_kb_chunks");
  // Check agent_traces to see if KB was called recently in this session
  let kbCalledThisSession = false;
  if (hasPricingClaim && !kbUsed) {
    const { data: recentTraces } = await ctx.supabase
      .from("agent_traces")
      .select("tool_name")
      .eq("session_id", ctx.session.id)
      .eq("tool_name", "match_kb_chunks")
      .gte("created_at", new Date(Date.now() - 5 * 60000).toISOString()) // last 5 min
      .limit(1)
      .maybeSingle();
    kbCalledThisSession = !!recentTraces;
  }
  if (hasPricingClaim && !kbUsed && !kbCalledThisSession) {
    // Log the hallucination for developer review but don't ruin the customer experience
    console.warn(`[T3] Hallucination detected: Pricing info provided without KB search.`);
    
    try {
      await ctx.supabase.from("debug_logs").insert({
        level: "warning",
        scope: "t3-planner",
        message: "AI provided pricing info without KB search",
        metadata: { session_id: ctx.session.id, response: plan.response }
      });
    } catch (_) {}
    
    // Auto-inject KB search for the next pass
    plan.actions.push({ tool: "match_kb_chunks", params: { query: "pricing and plans" }, required: false });
  }
}

function parseOrderItemsFromText(text: string): { name: string; qty?: number }[] {
  const items: { name: string; qty?: number }[] = [];
  const itemRegex = /(\d+(?:\.\d+)?)\s*(kg|g|gram|packet|dozen|litre|bottle|pack|bunch|piece|pcs)\s+(?:of\s+)?([a-z\s]+?)(?=[,.]|\s+and|\s+with|$)/gi;
  let match;
  while ((match = itemRegex.exec(text.toLowerCase())) !== null) {
    let qty = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    const name = match[3].trim().replace(/[,.]$/, "");
    if (["g", "gram"].includes(unit) && qty >= 100) qty = qty / 1000;
    if (name && name.length < 50) {
      items.push({ name, qty });
    }
  }
  return items;
}

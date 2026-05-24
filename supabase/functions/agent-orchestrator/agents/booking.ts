import { PipelineContext, TierResult } from "../lib/types.ts";
import { callLLM } from "../lib/llm.ts";

type BookingFlowStage =
  | "idle"
  | "collecting_service"
  | "collecting_date"
  | "collecting_time"
  | "collecting_name"
  | "collecting_email"
  | "confirming"
  | "booked"
  | "cancelled";

interface BookingSession {
  id: string;
  session_id: string;
  workspace_id: string;
  state: BookingFlowStage;
  collected: Record<string, string>;
  attempts: Record<string, number>;
  appointment_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

const COLLECTION_STAGES: BookingFlowStage[] = [
  "collecting_service", "collecting_date", "collecting_time",
  "collecting_name", "collecting_email"
];

const STAGE_TO_FIELD: Record<string, string> = {
  collecting_service: "service",
  collecting_date: "date",
  collecting_time: "time",
  collecting_name: "name",
  collecting_email: "email"
};

const FIELD_PROMPTS: Record<string, (ws: any) => string> = {
  collecting_service: (ws) =>
    `What service would you like to book? ${ws?.services_offered ? `We offer: ${ws.services_offered}` : ""}`.trim(),
  collecting_date: (_ws) =>
    "What date would you like the appointment?",
  collecting_time: (_ws) =>
    "What time works best for you?",
  collecting_name: (_ws) =>
    "Could you please tell me your name?",
  collecting_email: (_ws) =>
    "What email address should I use for the confirmation?",
};

const RETRY_PROMPTS: Record<string, (attempt: number) => string> = {
  collecting_service: (a) =>
    a === 1 ? "Could you please tell me which service you'd like to book?" : "Please type the name of the service from our list.",
  collecting_date: (a) =>
    a === 1 ? "What date would you like?" : "Could you give me a specific date? For example, 'tomorrow' or 'May 25th'.",
  collecting_time: (a) =>
    a === 1 ? "What specific time works for you?" : "I just need the time — like '2pm' or '10:30 in the morning'.",
  collecting_name: (a) =>
    a === 1 ? "What's your full name?" : "I just need your name. First name is fine.",
  collecting_email: (a) =>
    a === 1 ? "What email should I send the confirmation to?" : "Please share your email address so I can send the booking confirmation.",
};

const CLARIFICATION_PROMPTS: Record<string, string> = {
  collecting_service: "I'm having trouble understanding which service you'd like. Please pick from our available services or type 'talk to human' for help.",
  collecting_date: "I'm having trouble figuring out the date. Please give me a specific date like 'May 25th' or 'tomorrow'.",
  collecting_time: "I need a specific time. Please give me something like '2pm' or '10:30am'.",
  collecting_name: "I still need your name to complete the booking. Please let me know your name.",
  collecting_email: "I still need your email for the confirmation. Please share your email address.",
};

export async function loadOrCreateBookingSession(ctx: PipelineContext): Promise<BookingSession | null> {
  const { data: existing } = await ctx.supabase
    .from("booking_sessions")
    .select("*")
    .eq("session_id", ctx.session.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    ctx.bookingSession = existing;
    return existing;
  }

  if (!ctx.workspace) return null;

  const { data: newSession } = await ctx.supabase
    .from("booking_sessions")
    .insert({
      session_id: ctx.session.id,
      workspace_id: ctx.payload.workspace_id,
      state: "idle",
      collected: {},
      attempts: {}
    })
    .select()
    .single();

  if (newSession) ctx.bookingSession = newSession;
  return newSession;
}

export async function updateBookingSession(
  ctx: PipelineContext,
  id: string,
  updates: Partial<BookingSession>
): Promise<void> {
  const { data } = await ctx.supabase
    .from("booking_sessions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (data) ctx.bookingSession = data;
}

async function extractFields(
  message: string,
  missingFields: string[],
  collected: Record<string, string>
): Promise<Record<string, { value: string | null; confidence: "high" | "low" }>> {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];

  const fieldDescriptions: Record<string, string> = {
    service: "The dental service (e.g. cleaning, root canal, whitening).",
    date: `The date. Today is ${today} (${dayName}). Convert relative dates like 'tomorrow', 'this afternoon', 'next Monday' to YYYY-MM-DD. If 'this afternoon' or 'tonight', use ${today}.`,
    time: "The time. Convert to HH:MM (24h format). If only a range (e.g. 'morning'), return null.",
    name: "The customer's name.",
    email: "The customer's email address."
  };

  const schema: Record<string, any> = {};
  missingFields.forEach(f => {
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
${missingFields.map(f => `- ${f}: ${fieldDescriptions[f]}`).join("\n")}

Rules:
- If a field is already in the collected list, do NOT re-extract it unless the user is explicitly changing it.
- Return null for fields not clearly present.
- For 'this afternoon' or 'today', the date is ${today}.

Return ONLY JSON: { "extracted": { "field_name": { "value": "...", "confidence": "high|low" } } }`,
      messages: [{ role: "user", content: `Existing context: ${JSON.stringify(collected)}\nUser message: ${message}` }]
    });
    const parsed = JSON.parse(response.choices?.[0]?.message?.content || "{}");
    return parsed.extracted || {};
  } catch {
    return {};
  }
}

export async function handleBooking(ctx: PipelineContext): Promise<TierResult | null> {
  const bs = ctx.bookingSession as BookingSession | undefined;
  if (!bs) return null;

  // 0. Management Intent Check: If user wants to reschedule or cancel, let the full Planner handle it
  const msgLower = ctx.payload.message.toLowerCase();
  const managementKeywords = ["reschedule", "move", "cancel", "change", "rebook", "re-schedule", "modify"];
  const hasManagementIntent = managementKeywords.some(kw => msgLower.includes(kw));
  
  if (hasManagementIntent) {
    // If they want to manage, bypass FSM to let Planner use tools (get_contact_history, update_appointment, etc.)
    return null;
  }

  if (bs.state === "booked") {
    return {
      handled: true,
      response: bs.appointment_id
        ? "Your appointment is already confirmed! Is there anything else I can help you with?"
        : "Your appointment is already booked! Is there anything else?",
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

  const collected = { ...(bs.collected || {}) };
  const missing = getMissingFields(collected);

  // 1. Multi-field extraction from the current message
  const extractions = await extractFields(ctx.payload.message, missing, collected);
  let fieldsUpdated = false;

  for (const [field, data] of Object.entries(extractions)) {
    if (data.confidence === "high" && data.value) {
      collected[field] = data.value;
      fieldsUpdated = true;
    }
  }

  // 2. Determine next state based on what we have now
  const nextStage = getNextStage(bs.state, collected);

  if (fieldsUpdated || nextStage !== bs.state) {
    await updateBookingSession(ctx, bs.id, {
      state: nextStage,
      collected,
      attempts: {} // Reset attempts on successful data entry
    });
    
    // If we've jumped to confirming, let T3 handle the final confirmation message/actions
    if (nextStage === "confirming") {
      ctx.bookingSession = { ...bs, state: nextStage, collected };
      return null;
    }

    // If we just started (idle) and successfully got some fields, continue to ask for the next one
    const prompt = FIELD_PROMPTS[nextStage]?.(ctx.workspace)
      ?? "Could you please provide more details?";
    return { handled: true, response: prompt, reason: `booking_jump_${nextStage}` };
  }

  // 3. Fallback to retry/clarification logic if we are stuck in a stage
  if (COLLECTION_STAGES.includes(bs.state)) {
    const attempts = { ...(bs.attempts || {}), [bs.state]: ((bs.attempts || {})[bs.state] || 0) + 1 };
    await updateBookingSession(ctx, bs.id, { attempts });

    if (attempts[bs.state] >= 3) {
      const clarification = CLARIFICATION_PROMPTS[bs.state]
        ?? "I'm having trouble. Please contact the business directly.";
      return { handled: true, response: clarification, reason: "booking_clarification" };
    }

    const retry = RETRY_PROMPTS[bs.state]?.(attempts[bs.state])
      ?? "Could you please clarify?";
    return { handled: true, response: retry, reason: "booking_retry" };
  }

  return null;
}

function getNextStage(current: BookingFlowStage, collected: Record<string, string>): BookingFlowStage {
  const required = ["service", "date", "time", "name", "email"];
  const stageMap: Record<string, BookingFlowStage> = {
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

export function getMissingFields(collected: Record<string, any>): string[] {
  const required = ["service", "date", "time", "name", "email"];
  return required.filter(f => !collected[f]);
}

export function buildBookingSystemPrompt(ctx: PipelineContext): string {
  const bs = ctx.bookingSession as BookingSession | undefined;
  const collected = bs?.collected ?? {};
  const missing = getMissingFields(collected);
  const workspace = ctx.workspace || {};

  return `
## Your Role
You are the Appointment Booking Specialist for ${workspace.name || "this business"}. Your #1 priority is executing tool calls.

## State
- Collected: ${JSON.stringify(collected)}
- Missing: ${missing.join(", ")}
- Priority: ${ctx.routingReason === "management_priority" ? "RESCHEDULING/CANCELLING (Lookup history first!)" : "Standard booking"}

## MANDATORY WORKFLOWS (CRITICAL):
1. NEW BOOKING: If ALL fields are collected, you MUST call check_availability AND create_appointment in the SAME plan actions array.
2. RESCHEDULE: If user wants to move/change, you MUST call get_contact_history first to find their appointment ID.
3. CANCEL: If user wants to cancel, you MUST call get_contact_history first to find their appointment ID.
4. UPDATING: If you have an appointment ID, call update_appointment or cancel_appointment IMMEDIATELY.

## CRITICAL RULES:
- NEVER say you will do something without calling the corresponding tool in your 'actions' list.
- If you call a tool, set needs_second_pass: true.
- Use {result_key.field} in your response if you don't use second pass.
- Response must be plain text, under 80 words.

## CRITICAL EXECUTION DIRECTIVE
You are an automated operator. When deciding to use a tool (such as create_appointment, capture_lead, or update_lead_stage), you must adhere to a strict two-step execution loop:

1. Output ONLY the necessary parameters for the requested tool call.
2. STOP generating conversational text. You must wait for the system environment to return the execution payload.

UNDER NO CIRCUMSTANCES should you generate text confirming an action to the user (e.g., "I have successfully booked your appointment" or "I have moved your profile to qualified") until you receive a definitive "success" status from the tool's return payload. If a tool returns an error or fails to sync, apologize to the user and propose an alternative solution.
`.trim();
}

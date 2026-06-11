import { PipelineContext, TierResult } from "../lib/types.ts";
import { callLLM } from "../lib/llm.ts";
import { getPersonaInstructions } from "../lib/persona.ts";

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

const DEFAULT_SERVICES = [
  "our available services", "a consultation", "an appointment"
];

const FIELD_PROMPTS: Record<string, (ws: any) => string> = {
  collecting_service: (ws) => {
    const services = ws?.services_offered || "our available services";
    return `What service would you like to book? We offer: ${services}`;
  },
  collecting_date: (_ws) =>
    "What date would you like the appointment?",
  collecting_time: (_ws) =>
    "What time works best for you?",
  collecting_name: (_ws) =>
    "Could you please tell me your name?",
  collecting_email: (_ws) =>
    "What email address should I use for the confirmation?",
};

const RETRY_PROMPTS: Record<string, (attempt: number, ws: any) => string> = {
  collecting_service: (a, ws) => {
    const services = ws?.services_offered || "our available services";
    const prompts = [
      `Which service are you looking for? We currently offer: ${services}`,
      `I'd love to help! Could you let me know what type of appointment you need?`,
      `No worries — take a look at what we offer: ${services}. Which one interests you?`
    ];
    return prompts[Math.min(a - 1, prompts.length - 1)];
  },
  collecting_date: (a) => {
    const prompts = [
      "What date would you like?",
      "Could you give me a specific date? For example, 'tomorrow' or 'May 25th'.",
      "I understand it can be tricky. Just the date works — like 'next Monday' or 'June 3rd'."
    ];
    return prompts[Math.min(a - 1, prompts.length - 1)];
  },
  collecting_time: (a) => {
    const prompts = [
      "What specific time works for you?",
      "I just need the time — like '2pm' or '10:30 in the morning'.",
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
      "Just need your email to send the confirmation — any email is fine."
    ];
    return prompts[Math.min(a - 1, prompts.length - 1)];
  },
};

const CLARIFICATION_PROMPTS: Record<string, (attempt: number) => string> = {
  collecting_service: (a) => {
    if (a >= 5) {
      return "I apologize — I'm having trouble identifying the service you want. Would you like me to connect you with someone who can help directly?";
    }
    const prompts = [
      "I'm sorry, I didn't quite catch that. What type of appointment or service are you interested in?",
      "I understand this can be confusing. Could you try telling me what you're looking to book?",
      "I want to make sure I get this right. If it's easier, you can describe what you need and I'll match it to our services."
    ];
    return prompts[Math.min(a - 3, prompts.length - 1)];
  },
  collecting_date: (a) => {
    if (a >= 5) {
      return "I apologize for the trouble. Let me connect you with someone who can help with scheduling. Would that be okay?";
    }
    const prompts = [
      "I'm having trouble figuring out the date. Could you try a simple format like 'tomorrow' or 'May 25th'?",
      "I appreciate your patience. Any day works — just tell me when you'd like to come in."
    ];
    return prompts[Math.min(a - 3, prompts.length - 1)];
  },
  collecting_time: (a) => {
    if (a >= 5) {
      return "I apologize — I'm struggling with the time. Would you like me to get a human agent to help finalize the booking?";
    }
    return a === 3
      ? "I need a specific time. Please give me something like '2pm' or '10:30am'."
      : "Just the time is enough — like 'morning', 'afternoon', or a specific time.";
  },
  collecting_name: (a) => {
    if (a >= 5) {
      return "I'm sorry for the back and forth. Let me hand this over to a team member who can finalize things smoothly.";
    }
    const prompts = [
      "I still need your name to complete the booking. Please let me know your name.",
      "Just your first name is enough to save this booking for you."
    ];
    return prompts[Math.min(a - 3, prompts.length - 1)];
  },
  collecting_email: (a) => {
    if (a >= 5) {
      return "I apologize for the difficulty. Let me connect you with a team member who can complete the booking.";
    }
    const prompts = [
      "I still need your email for the confirmation. Please share your email address.",
      "Even a phone number works if email isn't convenient — I just need a way to send the confirmation."
    ];
    return prompts[Math.min(a - 3, prompts.length - 1)];
  },
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
    // Timeout: if booking session is older than 30 minutes and not in idle/booked/cancelled, reset it
    const lastUpdate = new Date(existing.updated_at).getTime();
    const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
    const activeStates = ["idle", "booked", "cancelled"];
    if (!activeStates.includes(existing.state) && lastUpdate < thirtyMinAgo) {
      await updateBookingSession(ctx, existing.id, {
        state: "idle",
        collected: {},
        attempts: {}
      });
      ctx.bookingSession = { ...existing, state: "idle", collected: {}, attempts: {} };
      return ctx.bookingSession;
    }
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
  collected: Record<string, string>,
  servicesOffered?: string
): Promise<Record<string, { value: string | null; confidence: "high" | "low" }>> {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];

  const fieldDescriptions: Record<string, string> = {
    service: `The service the customer wants. Available services: ${servicesOffered || "our services"}.`,
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
      system: `You are a specialized booking data extractor.
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

  // 0. Intent checks — if message is NOT about booking, pass through to T3
  const msgLower = ctx.payload.message.toLowerCase();
  const managementKeywords = ["reschedule", "move", "cancel", "change", "rebook", "re-schedule", "modify"];
  const hasManagementIntent = managementKeywords.some(kw => msgLower.includes(kw));
  
  // Availability check — user wants to know if slots exist, not start a booking
  const availabilityKeywords = ["available", "availability", "slot", "free", "open", "any appointment", "any slot", "do you have"];
  const isAvailabilityCheck = availabilityKeywords.some(kw => msgLower.includes(kw)) && !hasManagementIntent;
  if (isAvailabilityCheck && bs.state === "idle") {
    // Let T3 handle this — it will call check_availability tool
    return null;
  }
  
  if (hasManagementIntent) {
    // If they want to manage, bypass FSM to let Planner use tools (get_contact_history, update_appointment, etc.)
    return null;
  }

  // If message seems like general chat, complaint, or rejection — pass to T3
  const nonBookingSignals = [
    "no", "stop", "never mind", "nevermind", "forget it", "leave it",
    "not interested", "don't want", "i don't", "i won't",
    "useless", "waste", "stupid", "bad", "terrible",
    "you're not", "you are not", "not helpful", "not what i",
    "help", "problem", "issue", "complaint", "not working",
    "talk to human", "talk to person", "talk to someone",
    "speak to", "speak with", "contact", "samir", "call owner",
    "human", "real person", "real agent", "owner",
    "what", "who", "why", "where", "tell me about",
    "are you real", "are you a bot", "confused", "don't understand",
    "i want to talk", "i want to speak", "listen to me"
  ];
  const isNonBooking = nonBookingSignals.some(s => msgLower.includes(s));
  if (isNonBooking) {
    // Allow escape even if fields were collected — user explicitly wants out
    if (Object.keys(bs.collected || {}).length <= 1) {
      return null;
    }
    // With 2+ fields collected, reset booking and let T3 handle the new intent
    await updateBookingSession(ctx, bs.id, {
      state: "idle",
      collected: {},
      attempts: {}
    });
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
  const extractions = await extractFields(ctx.payload.message, missing, collected, ctx.workspace?.services_offered);
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

    // After 3 failed attempts, pass to the LLM — they're clearly not booking
    if (attempts[bs.state] >= 3) {
      return null;
    }

    const retry = RETRY_PROMPTS[bs.state]?.(attempts[bs.state], ctx.workspace)
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

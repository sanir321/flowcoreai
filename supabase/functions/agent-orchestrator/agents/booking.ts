import { PipelineContext, TierResult } from "../lib/types.ts";
import { callLLM } from "../lib/llm.ts";
import { getPersonaInstructions } from "../lib/persona.ts";
import { getTemplate, DEFAULT_TEMPLATES, renderTemplate, TemplateKey } from "../lib/templates.ts";

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

function diceCoefficient(a: string, b: string): number {
  const bigrams = (s: string) => {
    const map = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.substring(i, i + 2);
      map.set(bg, (map.get(bg) || 0) + 1);
    }
    return map;
  };
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const aBg = bigrams(a);
  const bBg = bigrams(b);
  let intersection = 0;
  for (const [bg, count] of aBg) {
    intersection += Math.min(count, bBg.get(bg) || 0);
  }
  return (2 * intersection) / (a.length - 1 + b.length - 1);
}

export function matchService(
  userInput: string,
  validServices: string[],
  synonyms: Record<string, string[]> = {}
): { matched: string | null; method: "exact" | "synonym" | "fuzzy" | null } {
  const normalizedInput = userInput.toLowerCase().trim();
  if (!normalizedInput) return { matched: null, method: null };

  const exactMatch = validServices.find(s => s.toLowerCase() === normalizedInput);
  if (exactMatch) return { matched: exactMatch, method: "exact" };

  for (const [service, aliases] of Object.entries(synonyms)) {
    if (aliases.some(a => a.toLowerCase() === normalizedInput)) {
      return { matched: service, method: "synonym" };
    }
  }

  let bestScore = 0;
  let bestService: string | null = null;
  for (const service of validServices) {
    const score = diceCoefficient(normalizedInput, service.toLowerCase());
    if (score > bestScore) {
      bestScore = score;
      bestService = service;
    }
  }

  if (bestScore >= 0.4) {
    return { matched: bestService, method: "fuzzy" };
  }
  return { matched: null, method: null };
}

export function validateService(
  service: string,
  validServices: string[]
): { valid: boolean; suggestions: string[]; matchedService: string | null } {
  const normalized = service.toLowerCase().trim();
  const exactMatch = validServices.find(s => s.toLowerCase() === normalized);
  if (exactMatch) return { valid: true, suggestions: [], matchedService: exactMatch };

  const scored = validServices
    .map(s => ({ service: s, score: diceCoefficient(normalized, s.toLowerCase()) }))
    .sort((a, b) => b.score - a.score);
  const top3 = scored.filter(s => s.score >= 0.3).slice(0, 3).map(s => s.service);

  return {
    valid: false,
    suggestions: top3.length > 0 ? top3 : validServices.slice(0, 3),
    matchedService: null
  };
}

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
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const { data } = await ctx.supabase
        .from("booking_sessions")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (data) ctx.bookingSession = data;
      return;
    } catch (err) {
      if (attempt < 2) {
        await new Promise(res => setTimeout(res, 100 * Math.pow(2, attempt)));
      } else {
        throw err;
      }
    }
  }
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

  // Regex-first extraction for reliable fields
  const result: Record<string, { value: string | null; confidence: "high" | "low" }> = {};
  const msgLower = message.toLowerCase();

  for (const f of missingFields) {
    if (f === "service" && servicesOffered) {
      const svcList = servicesOffered.split(",").map(s => s.trim());
      for (const svc of svcList) {
        if (msgLower.includes(svc.toLowerCase())) {
          result.service = { value: svc, confidence: "high" };
          break;
        }
      }
    } else if (f === "date") {
      if (/\b(today|tonight|this afternoon)\b/i.test(message)) {
        result.date = { value: today, confidence: "high" };
      } else if (/\b(tomorrow)\b/i.test(message)) {
        const d = new Date(now);
        d.setDate(d.getDate() + 1);
        result.date = { value: d.toISOString().split("T")[0], confidence: "high" };
      } else {
        // Try month-day patterns: "June 16", "jun 16", "16 June", "16 jun"
        const months: Record<string, number> = { january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11, jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
        const mdMatch = message.match(/\b(\w+)\s+(\d{1,2})\b/i) || message.match(/\b(\d{1,2})\s+(\w+)\b/i);
        if (mdMatch) {
          let month: number | undefined;
          let day: number | undefined;
          const m1 = mdMatch[1].toLowerCase();
          const m2 = mdMatch[2].toLowerCase();
          if (months[m1] !== undefined && /^\d{1,2}$/.test(m2)) {
            month = months[m1]; day = parseInt(m2);
          } else if (months[m2] !== undefined && /^\d{1,2}$/.test(m1)) {
            month = months[m2]; day = parseInt(m1);
          }
          if (month !== undefined && day !== undefined && day >= 1 && day <= 31) {
            const yr = now.getFullYear();
            const d = new Date(yr, month, day);
            if (d < now) d.setFullYear(yr + 1); // next year if past
            result.date = { value: d.toISOString().split("T")[0], confidence: "high" };
          }
        }
      }
    } else if (f === "time") {
      // Try AM/PM pattern first (e.g. "2pm", "10:30am"), then bare numbers
      const ampmMatch = message.match(/\b(\d{1,2})\s*[:.]?\s*(\d{2})?\s*(am|pm)\b/i);
      const bareMatch = message.match(/\b(\d{1,2})\s*[:.]\s*(\d{2})\b/); // Only match "10:30" style (with colon)
      const timeMatch = ampmMatch || bareMatch;
      if (timeMatch) {
        let h = parseInt(timeMatch[1]);
        const m = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const pm = timeMatch[3]?.toLowerCase() === "pm";
        if (pm && h < 12) h += 12;
        if (!pm && h === 12) h = 0;
        result.time = { value: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`, confidence: "high" };
      }
    } else if (f === "email") {
      const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) result.email = { value: emailMatch[0], confidence: "high" };
    } else if (f === "name") {
      // Name: remove emails, trim, check 2+ words, reject date/time-like patterns
      const cleaned = message.replace(/@[\w.-]+\.\w+/g, "").trim();
      const hasDateWords = /\b(today|tomorrow|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+week|this\s+week|morning|afternoon|evening|am|pm)\b/i.test(cleaned);
      const hasTimePattern = /\d+\s*(am|pm|:\d)/i.test(cleaned);
      if (cleaned.length >= 2 && cleaned.split(" ").filter(w => w.length > 1).length >= 2 && !hasDateWords && !hasTimePattern) {
        result.name = { value: cleaned, confidence: "high" };
      }
    }
  }

  // If regex got everything, return immediately
  const allFound = missingFields.every(f => result[f]);
  if (allFound) {
    return result;
  }

  // Only use LLM for fields regex can't handle well (service with fuzzy match, complex dates)
  const remaining = missingFields.filter(f => !result[f] && f !== "name" && f !== "email");
  if (remaining.length === 0) {
    return result;
  }

  try {
    const response = await callLLM({
      model: "gpt-5-mini",
      max_tokens: 2000,
      temperature: 0,
      response_format: { type: "json_object" },
      system: `You are a booking field extractor. Output ONLY valid JSON.

CRITICAL: Extract fields ONLY from the CURRENT user message below. Do NOT look at conversation history or collected context for new values.

Today is ${today} (${dayName}).

RULES:
- Extract ONLY from the "User message" field below
- Return null for fields not present in the CURRENT message
- Do NOT re-extract fields already in collected
- For relative dates: "tomorrow" = ${today}+1, "today" = ${today}
- For time: convert to 24h HH:MM format

Missing fields: ${remaining.join(", ")}

Available services: ${servicesOffered || "our services"}

OUTPUT SCHEMA:
{"extracted":{"field_name":{"value":"string or null","confidence":"high|low"}}}`,
      messages: [{ role: "user", content: `Collected so far (DO NOT re-extract these): ${JSON.stringify(collected)}\n\nCURRENT user message to extract from: "${message}"` }]
    });
    const content = response.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    const llmResult = parsed.extracted || {};
    // Merge: only use LLM results for fields in remaining (regex takes precedence)
    for (const f of remaining) {
      if (llmResult[f] && !result[f]) {
        result[f] = llmResult[f];
      }
    }
    // CRITICAL: Remove any fields NOT in missingFields (LLM may return extra fields)
    for (const key of Object.keys(result)) {
      if (!missingFields.includes(key)) {
        delete result[key];
      }
    }
    return result;
  } catch (e: any) {
    console.error("[extractFields] LLM error:", e?.message || e);
    // Regex fallback when LLM fails — only for service/date/time (name/email need user context)
    const result: Record<string, { value: string | null; confidence: "high" | "low" }> = {};
    const msgLower = message.toLowerCase();
    for (const f of missingFields) {
      if (f === "name" || f === "email") continue; // Skip — these need dedicated prompts, not regex from random messages
      if (f === "service" && servicesOffered) {
        const svcList = servicesOffered.split(",").map(s => s.trim());
        for (const svc of svcList) {
          if (msgLower.includes(svc.toLowerCase())) {
            result.service = { value: svc, confidence: "high" };
            break;
          }
        }
      } else if (f === "date") {
        if (/\b(today|tonight|this afternoon)\b/i.test(message)) {
          result.date = { value: today, confidence: "high" };
        } else if (/\b(tomorrow)\b/i.test(message)) {
          const d = new Date(now);
          d.setDate(d.getDate() + 1);
          result.date = { value: d.toISOString().split("T")[0], confidence: "high" };
        } else {
          const months: Record<string, number> = { january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11, jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
          const mdMatch = message.match(/\b(\w+)\s+(\d{1,2})\b/i) || message.match(/\b(\d{1,2})\s+(\w+)\b/i);
          if (mdMatch) {
            let month: number | undefined;
            let day: number | undefined;
            const m1 = mdMatch[1].toLowerCase();
            const m2 = mdMatch[2].toLowerCase();
            if (months[m1] !== undefined && /^\d{1,2}$/.test(m2)) {
              month = months[m1]; day = parseInt(m2);
            } else if (months[m2] !== undefined && /^\d{1,2}$/.test(m1)) {
              month = months[m2]; day = parseInt(m1);
            }
            if (month !== undefined && day !== undefined && day >= 1 && day <= 31) {
              const yr = now.getFullYear();
              const d = new Date(yr, month, day);
              if (d < now) d.setFullYear(yr + 1);
              result.date = { value: d.toISOString().split("T")[0], confidence: "high" };
            }
          }
        }
      } else if (f === "time") {
        const ampmMatch = message.match(/\b(\d{1,2})\s*[:.]?\s*(\d{2})?\s*(am|pm)\b/i);
        const bareMatch = message.match(/\b(\d{1,2})\s*[:.]\s*(\d{2})\b/);
        const timeMatch = ampmMatch || bareMatch;
        if (timeMatch) {
          let h = parseInt(timeMatch[1]);
          const m = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          const pm = timeMatch[3]?.toLowerCase() === "pm";
          if (pm && h < 12) h += 12;
          if (!pm && h === 12) h = 0;
          result.time = { value: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`, confidence: "high" };
        }
      } else if (f === "email") {
        const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
        if (emailMatch) result.email = { value: emailMatch[0], confidence: "high" };
      } else if (f === "name") {
        const cleaned = message.replace(/@[\w.-]+\.\w+/g, "").trim();
        if (cleaned.length >= 2 && cleaned.split(" ").length >= 2) {
          result.name = { value: cleaned, confidence: "high" };
        }
      }
    }
    return result;
  }
}

export async function handleBooking(ctx: PipelineContext): Promise<TierResult | null> {
  const bs = ctx.bookingSession as BookingSession | undefined;
  if (!bs) return null;

  // 0. Intent checks — if message is NOT about booking, pass through to T3
  const msgLower = ctx.payload.message.toLowerCase();
  const managementKeywords = ["reschedule", "move", "cancel", "change", "rebook", "re-schedule", "modify", "replace", "update my", "change my"];
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
    "speak to", "speak with", "contact", "call owner",
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

  // If in confirming state, check for yes/no response
  if (bs.state === "confirming") {
    const msgLower = ctx.payload.message.toLowerCase().trim();
    const isConfirm = ["yes", "confirm", "ok", "sure", "yep", "yeah", "correct", "go ahead"].some(w => msgLower === w || msgLower.startsWith(w));
    const isReject = ["no", "cancel", "never mind", "stop", "wrong", "change"].some(w => msgLower === w || msgLower.startsWith(w));

    if (isConfirm) {
      // User confirmed — mark as booked, T3 will call create_appointment tool
      await updateBookingSession(ctx, bs.id, { state: "booked" });
      return null; // Let T3 handle tool execution
    }
    if (isReject) {
      await updateBookingSession(ctx, bs.id, {
        state: "idle",
        collected: {},
        attempts: {}
      });
      return { handled: true, response: "No problem! The booking has been cancelled. Would you like to start over?", reason: "booking_cancelled_by_user" };
    }
    // Neither yes nor no — ask again
    return { handled: true, response: "Please reply *yes* to confirm or *no* to cancel.", reason: "booking_awaiting_confirmation" };
  }

  const collected = { ...(bs.collected || {}) };
  const missing = getMissingFields(collected);

  // 1. Multi-field extraction from the current message
  const rawServices = ctx.workspace?.services_offered || [];
  const validServices = Array.isArray(rawServices)
    ? rawServices
    : typeof rawServices === "string"
      ? rawServices.split(",").map((s: string) => s.replace(/^or\s+/i, "").trim()).filter(Boolean)
      : [];
  const synonyms = (ctx.workspace as any)?.service_synonyms || {};
  const extractions = await extractFields(ctx.payload.message, missing, collected, ctx.workspace?.services_offered);
  let fieldsUpdated = false;

  for (const [field, data] of Object.entries(extractions)) {
    if (data.confidence === "high" && data.value) {
      if (field === "service") {
        const matched = matchService(data.value, validServices, synonyms);
        const validation = validateService(matched.matched || data.value, validServices);
        if (!validation.valid) {
          if (matched.matched && matched.method === "fuzzy") {
            collected[field] = matched.matched;
            fieldsUpdated = true;
          } else {
            const prompt = await getTemplate(ctx.supabase, ctx.payload.workspace_id, "invalid_service_response", DEFAULT_TEMPLATES.invalid_service_response);
            return {
              handled: true,
              response: renderTemplate(prompt, {
                services: validation.suggestions.join(", ")
              }),
              reason: "booking_invalid_service"
            };
          }
        } else {
          collected[field] = validation.matchedService || data.value;
          fieldsUpdated = true;
        }
      } else {
        collected[field] = data.value;
        fieldsUpdated = true;
      }
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
    
    // If we've jumped to confirming, show summary and ask user to confirm
    if (nextStage === "confirming") {
      ctx.bookingSession = { ...bs, state: nextStage, collected };
      const summary = [
        `📋 *Booking Summary*`,
        `• Service: ${collected.service}`,
        `• Date: ${collected.date}`,
        `• Time: ${collected.time}`,
        `• Name: ${collected.name}`,
        `• Email: ${collected.email}`,
        ``,
        `Reply *yes* to confirm, or *no* to cancel.`
      ].join("\n");
      return { handled: true, response: summary, reason: "booking_confirming" };
    }

    // If we just started (idle) and successfully got some fields, continue to ask for the next one
    const prompt = await resolveBookingPrompt(ctx, nextStage, collected)
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

    const retry = await resolveBookingRetryPrompt(ctx, bs.state, attempts[bs.state])
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

const STAGE_TEMPLATE_KEY: Record<string, string> = {
  collecting_service: "booking_service_prompt",
  collecting_date: "booking_date_prompt",
  collecting_time: "booking_time_prompt",
  collecting_name: "booking_name_prompt",
  collecting_email: "booking_email_prompt"
};

async function resolveBookingPrompt(
  ctx: PipelineContext,
  stage: string,
  collected: Record<string, string>
): Promise<string | null> {
  const key = STAGE_TEMPLATE_KEY[stage];
  if (!key) return FIELD_PROMPTS[stage]?.(ctx.workspace) ?? null;

  const templateKey = key as TemplateKey;
  const defaultPrompt = FIELD_PROMPTS[stage]?.(ctx.workspace)
    ?? DEFAULT_TEMPLATES[templateKey]
    ?? null;
  if (!defaultPrompt) return null;

  const wsId = ctx.payload.workspace_id;
  const template = await getTemplate(ctx.supabase, wsId, templateKey, defaultPrompt);
  return renderTemplate(template, {
    services: Array.isArray(ctx.workspace?.services_offered) ? ctx.workspace.services_offered.join(", ") : (ctx.workspace?.services_offered || ""),
    ...collected
  });
}

async function resolveBookingRetryPrompt(
  ctx: PipelineContext,
  stage: string,
  attempt: number
): Promise<string | null> {
  return RETRY_PROMPTS[stage]?.(attempt, ctx.workspace) ?? null;
}

export function buildBookingSystemPrompt(ctx: PipelineContext): string {
  const bs = ctx.bookingSession as BookingSession | undefined;
  const collected = bs?.collected ?? {};
  const missing = getMissingFields(collected);
  const workspace = ctx.workspace || {};
  const traits = ctx.session?.workspace_agents?.config?.traits || {};
  const personaInstructions = getPersonaInstructions(traits);

  const profile = (workspace as any).business_profile || {};
  const profileParts: string[] = []
  if (profile.contact?.phone) profileParts.push(`Phone: ${profile.contact.phone}`)
  if (profile.contact?.email) profileParts.push(`Email: ${profile.contact.email}`)
  if (profile.contact?.address) profileParts.push(`Address: ${profile.contact.address}`)
  if (profile.social) {
    const socialEntries = Object.entries(profile.social)
      .filter(([, url]) => url)
      .map(([platform, url]) => `${platform.charAt(0).toUpperCase() + platform.slice(1)} (${url})`)
    if (socialEntries.length) profileParts.push(`Social: ${socialEntries.join(', ')}`)
  }
  if (workspace.services_offered) profileParts.push(`Services: ${workspace.services_offered}`)
  if (profile.hours?.daily) {
    const days = Object.entries(profile.hours.daily)
      .filter(([, d]: [string, any]) => !d.closed)
      .map(([day, d]: [string, any]) => `${day}: ${d.open}-${d.close}`)
      .join(', ')
    if (days) profileParts.push(`Hours: ${days}`)
  }
  if (profile.pricing?.description) profileParts.push(`Pricing: ${profile.pricing.description}`)
  const profileSummary = profileParts.length > 0 ? profileParts.join('\n') : 'No profile data yet. Call get_business_profile for details.'

  return `
## Business Context
${workspace.name || workspace.business_name || "Business"} — ${workspace.description || workspace.business_description || ""}
Business Type: ${(workspace as any).business_type || "general"}
Website: ${(workspace as any).website_url || "Not specified"}
Personality: ${personaInstructions}

## Business Profile (Pre-loaded)
${profileSummary}

## Your Role
You are the Appointment Booking Specialist for ${workspace.name || "this business"}. Your #1 priority is executing tool calls.

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

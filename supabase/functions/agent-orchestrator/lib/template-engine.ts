import { PipelineContext } from "./types.ts";

export type TemplateVars = Record<string, string>;

export function renderTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    if (key in vars) return vars[key];
    console.warn(`[TEMPLATE] Missing variable: ${key}`);
    return `{{${key}}}`;
  });
}

export function collectTemplateVars(ctx: PipelineContext): TemplateVars {
  const workspace = ctx.workspace || {};
  const session = ctx.session || {};
  const working = session.working_context || {};
  const profile = (workspace as any).business_profile || {};
  const traits = (ctx.session?.workspace_agents as any)?.config?.traits || {};

  return {
    workspaceName: workspace.name || "this business",
    businessProfile: buildBusinessProfileText(ctx),
    personaInstructions: buildPersonaInstructions(traits),
    sentimentLine: working.sentiment
      ? `\nCustomer sentiment: ${working.sentiment}${working.sentiment === "frustrated" ? " — escalate if they remain frustrated." : ""}`
      : "",
    currentDateTime: `Today is ${new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", year: "numeric", month: "long", day: "numeric" })}. Current time in India is ${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })} IST.`,
    agentType: ctx.agentType || "customer_support",
    businessPhone: profile.contact?.phone || "",
    businessEmail: profile.contact?.email || "",
    businessAddress: profile.contact?.address || "",
    businessDescription: profile.description || "",
    fallbackMessage: workspace.guardrail_config?.fallback_message || "I'm not sure about that. Please contact us directly for more information.",
  };
}

function buildBusinessProfileText(ctx: PipelineContext): string {
  const workspace = ctx.workspace || {};
  const profile = (workspace as any).business_profile || {};
  const parts: string[] = [];

  if (profile.description) parts.push(`About: ${profile.description}`);
  if (profile.contact?.phone) parts.push(`Phone: ${profile.contact.phone}`);
  if (profile.contact?.email) parts.push(`Email: ${profile.contact.email}`);
  if (profile.contact?.address) parts.push(`Address: ${profile.contact.address}`);

  if (profile.hours?.daily) {
    const openDays = Object.entries(profile.hours.daily)
      .filter(([, d]: [string, any]) => !d.closed)
      .map(([day, d]: [string, any]) => `${day.charAt(0).toUpperCase() + day.slice(1)}: ${d.open}-${d.close}`);
    const closedDays = Object.entries(profile.hours.daily)
      .filter(([, d]: [string, any]) => d.closed)
      .map(([day]: [string, any]) => day.charAt(0).toUpperCase() + day.slice(1));
    if (openDays.length) parts.push(`Business Hours: ${openDays.join(', ')}`);
    if (closedDays.length) parts.push(`Closed on: ${closedDays.join(', ')}`);
  }

  if (profile.pricing?.description) parts.push(`Pricing: ${profile.pricing.description}`);
  if (workspace.services_offered) parts.push(`Services: ${workspace.services_offered}`);
  if (profile.amenities?.length) parts.push(`Amenities: ${profile.amenities.join(', ')}`);

  if (profile.policies) {
    const entries = Object.entries(profile.policies).filter(([, v]) => v);
    if (entries.length) parts.push(`Policies: ${entries.map(([k, v]) => `${k}: ${v}`).join(' | ')}`);
  }

  return parts.length > 0
    ? parts.join('\n')
    : 'No profile data yet. Call get_business_info for details.';
}

function buildPersonaInstructions(traits: any): string {
  const constraints = [
    "- NEVER identify as an AI, bot, or automated assistant.",
    "- Talk like a human employee on WhatsApp: use short, snappy sentences.",
    "- Use natural conversational fillers sparingly (e.g., \"Alright,\" \"Got it,\" \"Give me a sec\").",
    "- Use emojis naturally to keep it friendly (👋, ✨, 👍).",
    "- Avoid formal bullet points; use plain text paragraphs or simple dashes.",
    "- If you don't know something, don't apologize like a robot. Just say \"I'm not 100% sure about that, let me check with the team.\"",
  ];

  if (!traits) return constraints.join("\n");

  const lines = [...constraints];

  if (traits.tone === "friendly") lines.push("- Keep the vibe warm and super welcoming.");
  else if (traits.tone === "professional") lines.push("- Keep it polite and efficient, like a top-tier concierge.");
  else if (traits.tone === "enthusiastic") lines.push("- Be high-energy and exciting! Use more emojis.");

  if (traits.formality === "formal") lines.push("- Avoid slang. Use full sentences but keep them human.");
  else if (traits.formality === "casual") lines.push("- Use casual language, contractions (it's, don't), and a very relaxed vibe.");

  if (traits.brevity === "concise") lines.push("- Be extremely short. Get straight to the point.");
  else if (traits.brevity === "detailed") lines.push("- Provide helpful details and context when answering.");

  if (traits.proactivity === "assertive") lines.push("- Take charge of the chat. Proactively suggest the next step.");
  else if (traits.proactivity === "passive") lines.push("- Wait for the user to ask before offering more help.");

  return lines.join("\n");
}

export const BOOKING_TEMPLATE = `You are the Appointment Booking Specialist for {{workspaceName}}.

## Identity
You help customers book, reschedule, check availability, or cancel appointments.
{{personaInstructions}}

## Business Profile
{{businessProfile}}

## Booking flow
- Read history. Parse all info from customer's latest message (they may give service + date + name at once).
- Collect: service, date, time, name, email. Ask only for what's STILL MISSING.
- Once you have all details (service, date, time, name), submit BOTH check AND create in your actions array (both run together; the system uses results to decide the final response):
  actions: [
    {tool: "manage_appointment", params: {action: "check", date: "...", time: "..."}},
    {tool: "manage_appointment", params: {action: "create", date: "...", time: "...", service: "...", name: "..."}}
  ]
- **CRITICAL**: Never include manage_appointment in more than one plan. One plan with both check+create is all you need.
- If already_booked: true → acknowledge and ask if they need to change/cancel.
- If customer says a name that differs from the existing appointment's name, it's a different person — create new instead of linking.
- Rescheduling → manage_contact (get) first, then manage_appointment (update).
- Cancellation → manage_contact (get) first, then manage_appointment (cancel).
- Availability → manage_appointment (check) with a date.
- One tool call per message max.

## Rules
- If customer asks about services or pricing → use get_business_info to look up what's offered.
- If customer wants support → transfer_agent to customer_support.
- If customer wants to order/buy something → transfer_agent to sales.
- Tools: manage_appointment, manage_contact, get_business_info, transfer_agent.

## Response style
- Under 80 words. WhatsApp formatting: *single asterisk* for bold, NOT double.
- Direct: state what's needed, ask for the missing info.
- Never end with "does that answer your question" or "anything else I can help with".
- State what's next. Stop.

## Appointment confirmation
- When appointment is created, the response MUST use ONLY this format:
  "Your {service} is confirmed for {day}, {date} at {time}. View details: {appointment_link}"
- STRICTLY FORBIDDEN: Including the meeting_link, Google Meet link, or any join link. NEVER mention them.`;

export const SUPPORT_TEMPLATE = `You are the Customer Support Specialist for {{workspaceName}}.

## Identity
You answer questions about the business, services, hours, and policies.
{{personaInstructions}}

## Business Profile
{{businessProfile}}

## Rules
- Answer directly from the business profile above for general questions.
- Use search_kb ONLY when the customer asks about something NOT in the business profile (specific processes, troubleshooting, detailed policies, technical documentation).
- If search_kb returns nothing → try get_business_info.
- If neither has it, say so honestly and offer to create a ticket or transfer.
- If customer wants booking or is providing booking details (service, date, time, name, phone, email) → transfer_agent to appointment_booking.
- If customer wants ordering → transfer_agent to sales.
- Tools: search_kb, manage_contact, get_business_info, transfer_agent, escalate.

## Response style
- Lead with the answer. One sentence. Then add brief context if needed.
- Under 150 words. WhatsApp formatting: *single asterisk* for bold, NOT double.
- Never end with "does that answer your question" or "anything else I can help with".
- State the answer. Stop.`;

export const SALES_TEMPLATE = `You are the Sales Specialist for {{workspaceName}}.

## Identity
You help customers browse the menu, understand pricing, and place orders.
{{personaInstructions}}

## Business Profile
{{businessProfile}}

## Order taking
1. Customer asks to see menu → call manage_catalog.
2. If customer says "yes" or "place the order" after seeing items → call place_order IMMEDIATELY. Do NOT ask for their name/email/phone/address/appointment details.
3. On success, give order number and say the team will contact them for payment & delivery. Do NOT ask scheduling questions.

## Rules
- Any pricing/product/menu question → call manage_catalog FIRST. If it returns items, LIST them all — do NOT just say "let me help with that".
- If manage_catalog returns empty → try search_kb next BEFORE responding.
- If search_kb also returns nothing → answer using the business profile only. Do NOT make up services.
- Never give vague empty responses. Always list items when you have them.
- NEVER discuss payment methods. Say "the team will contact you for payment details."
- The business profile is already loaded — answer directly. Do NOT say you'll look it up.
- If customer wants support → transfer_agent to customer_support.
- If customer wants booking → transfer_agent to appointment_booking.
- CRITICAL: place_order does NOT need contact info or appointment details. Just the item name. Call it when the customer says "yes" or "place it".
- CRITICAL: Do NOT ask scheduling/appointment questions when the customer is ordering. That is a separate flow.
- Tools: manage_catalog, manage_contact, get_business_info, place_order, search_kb, transfer_agent.

## Response style
- Be direct. Short sentences. No fluff.
- Under 150 words. WhatsApp formatting: *single asterisk* for bold, NOT double.
- Never end with "does that answer your question" or "anything else I can help with".
- State the answer. Stop.`;

export function resolveAgentPrompt(agentType: string, ctx: PipelineContext): string {
  const vars = collectTemplateVars(ctx);

  switch (agentType) {
    case "appointment_booking":
      return renderTemplate(BOOKING_TEMPLATE, vars);
    case "sales":
      return renderTemplate(SALES_TEMPLATE, vars);
    case "customer_support":
    default:
      return renderTemplate(SUPPORT_TEMPLATE, vars);
  }
}

export function resolveAgentPromptWithOverrides(
  agentType: string,
  ctx: PipelineContext,
  overrides?: Partial<Record<string, string>>,
): string {
  let prompt = resolveAgentPrompt(agentType, ctx);

  if (overrides?.[agentType]) {
    const vars = collectTemplateVars(ctx);
    prompt = renderTemplate(overrides[agentType]!, vars);
  }

  return prompt;
}

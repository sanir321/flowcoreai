import { PipelineContext } from "../lib/types.ts";
import { getPersonaInstructions } from "../lib/persona.ts";

export function buildSupportSystemPrompt(ctx: PipelineContext): string {
  const workspace = ctx.workspace || {};
  const traits = ctx.session?.workspace_agents?.config?.traits || {};
  const personaInstructions = getPersonaInstructions(traits);
  const working = ctx.session?.working_context || {};

  const profile = (workspace as any).business_profile || {};
  const profileParts: string[] = []
  if (profile.description) profileParts.push(`About: ${profile.description}`)
  if (profile.contact?.phone) profileParts.push(`Phone: ${profile.contact.phone}`)
  if (profile.contact?.email) profileParts.push(`Email: ${profile.contact.email}`)
  if (profile.contact?.address) profileParts.push(`Address: ${profile.contact.address}`)
  if (profile.contact?.google_maps_link) profileParts.push(`Maps: ${profile.contact.google_maps_link}`)
  if (profile.social) {
    const socialEntries = Object.entries(profile.social)
      .filter(([, url]) => url)
      .map(([platform, url]) => `${platform.charAt(0).toUpperCase() + platform.slice(1)} (${url})`)
    if (socialEntries.length) profileParts.push(`Social: ${socialEntries.join(', ')}`)
  }
  if (workspace.services_offered) profileParts.push(`Services: ${workspace.services_offered}`)
  if (profile.hours?.daily) {
    const openDays = Object.entries(profile.hours.daily)
      .filter(([, d]: [string, any]) => !d.closed)
      .map(([day, d]: [string, any]) => `${day.charAt(0).toUpperCase() + day.slice(1)}: ${d.open}-${d.close}`)
    const closedDays = Object.entries(profile.hours.daily)
      .filter(([, d]: [string, any]) => d.closed)
      .map(([day]: [string, any]) => day.charAt(0).toUpperCase() + day.slice(1))
    if (openDays.length) profileParts.push(`Business Hours: ${openDays.join(', ')}`)
    if (closedDays.length) profileParts.push(`Closed on: ${closedDays.join(', ')}`)
  }
  if (profile.amenities?.length) profileParts.push(`Amenities: ${profile.amenities.join(', ')}`)
  if (profile.pricing?.description) profileParts.push(`Pricing: ${profile.pricing.description}`)
  if (profile.policies) {
    const policyEntries = Object.entries(profile.policies).filter(([, v]) => v)
    if (policyEntries.length) profileParts.push(`Policies: ${policyEntries.map(([k, v]) => `${k}: ${v}`).join(' | ')}`)
  }
  if (profile.extras?.specials?.length) profileParts.push(`Specials: ${profile.extras.specials.join(', ')}`)
  if (profile.extras?.project_types?.length) profileParts.push(`Project Types: ${profile.extras.project_types.join(', ')}`)
  const profileSummary = profileParts.length > 0 ? profileParts.join('\n') : 'No profile data yet. Call get_business_info for details.'

  const sentimentLine = working.sentiment
    ? `\nCustomer sentiment: ${working.sentiment}${working.sentiment === 'frustrated' ? ' — escalate if they remain frustrated.' : ''}`
    : '';

  return `
You are the Customer Support Specialist for ${workspace.name || "this business"}.

## Identity
You answer questions about the business, services, hours, and policies. You speak with ${personaInstructions || "a professional, helpful tone"}.

## Customer Context
Working intent: ${working.intent || "none yet"}
Customer name: ${working.customer_name || "unknown"}${sentimentLine}

## Business Profile
${profileSummary}

## Knowledge Base Context
Knowledge base excerpts (if any) are provided below. Ground your answers in these excerpts and the business profile.

## Critical rules
1. Empathy before everything — always acknowledge the customer's feelings before moving to solutions.
2. Never say "that's not possible" without offering an alternative. There is always something you can do.
3. Never blame the customer — frame around what you can do, not what they did.
4. Own the problem — even if the issue isn't your fault, take ownership of the resolution.
5. Escalate before frustration peaks — recognize the signs early and offer escalation proactively.
6. Never make promises you can't keep.
7. Personalize every interaction — use the customer's name, reference their specific situation.
8. Close every interaction with care — end on a genuine human moment, not a form prompt.

## FAQ response framework
Step 1 — Confirm: "You're asking about [restate], correct?"
Step 2 — Answer: lead with the direct answer, then add context. No jargon.
Step 3 — Verify: "Does that answer your question?"
Step 4 — Offer next steps: "Is there anything else I can help with?"

## Complaint resolution protocol
Step 1 — Acknowledge: "I'm sorry that happened — that's not the experience we want you to have."
Step 2 — Validate: "Your feedback matters — I want to make this right."
Step 3 — Clarify: "Can you help me understand exactly what happened?"
Step 4 — Act: identify the resolution, communicate clearly, give a specific timeline.
Step 5 — Close with commitment: "Here's what I'm going to do by [time]."

## Retention protocol (when customer wants to cancel/leave)
Step 1 — Understand: "Before I process this, may I ask what's prompted the decision?"
Step 2 — Address root cause: price concern → offer discount or pause; dissatisfaction → offer support or alternative.
Step 3 — Present alternative: "Would you be open to [pause / lower tier / discount] instead?"
Step 4 — Respect the decision: if still leaving, process gracefully. "You're always welcome back."

## Escalation tiers
- Immediate (safety, legal threat, beyond authority): call transfer_agent right away.
- Urgent (customer furious, requesting manager, threatening social media/chargeback): offer warm transfer proactively.
- Standard (complex issue, billing dispute): resolve what you can, transfer the rest with full context.
- Never cold transfer — always brief the receiving party before handing off.

## How to respond
- Answer questions using the knowledge base context and business profile above.
- If the answer isn't in either, say so honestly and offer to create a ticket or transfer.
- End every response with a natural next step or question.
- Keep responses under 150 words. Use WhatsApp Markdown for formatting (*bold* for emphasis).
- If the user wants to book an appointment, call transfer_agent to appointment_booking.
- If the user wants pricing or ordering, call transfer_agent to sales.
- Tools available: search_kb, manage_contact (get/update details), get_business_info, transfer_agent, escalate, create_support_ticket.
- Only put items in actions when you genuinely need a tool call. Simple answers from context need no tools.

## Sentiment awareness
Before responding, classify the user's sentiment as positive, neutral, negative, or frustrated based on their latest message.
Prefix your response with [SENTIMENT: <value>] on a line you will NOT show the user.

## Escalation protocol
When a user is frustrated, requests a refund, or asks for management: acknowledge empathetically and call transfer_agent immediately.
If you fail to execute a tool 2 consecutive times, call transfer_agent.`.trim();
}

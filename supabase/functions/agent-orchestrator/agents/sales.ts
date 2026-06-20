import { PipelineContext } from "../lib/types.ts";
import { getPersonaInstructions } from "../lib/persona.ts";

export function buildSalesSystemPrompt(ctx: PipelineContext): string {
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
    const days = Object.entries(profile.hours.daily)
      .filter(([, d]: [string, any]) => !d.closed)
      .map(([day, d]: [string, any]) => `${day}: ${d.open}-${d.close}`)
      .join(', ')
    if (days) profileParts.push(`Hours: ${days}`)
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
You are the Sales Specialist for ${workspace.name || "this business"}.

## Identity
You help customers find products, understand pricing, and get quotes. You speak with ${personaInstructions || "a friendly, helpful tone"}.

## Customer Context
Working intent: ${working.intent || "none yet"}
Customer name: ${working.customer_name || "unknown"}${sentimentLine}

## Business Profile
${profileSummary}

## Critical rules
1. Every product description must connect back to what the customer needs — feature dumps without context are useless.
2. Be honest about limitations — credibility compounds; one dishonest answer erases ten honest ones.
3. Precision over volume — one message that nails the customer's real need beats a long list of everything you offer.
4. Never trash competitors — acknowledge their strengths while articulating your differentiation.
5. Listen more than you pitch — the customer tells you what they need if you let them.

## Pitch protocol (how to present products)
Step 1 — Restate the customer's need: "So you're looking for [specific need], correct?"
Step 2 — Show the outcome: lead with what the product does for them, not its features.
Step 3 — Explain how it works: after they're interested, explain the details.
Step 4 — Close with proof: mention a similar customer who got a good result.

## Objection handling decoder
When a customer says:
- "Does it support X?" → They mean "Will this pass our requirements?" Walk through full capability.
- "Can it handle our scale?" → "We've been burned by vendors who couldn't." Provide benchmark data.
- "Your competitor showed us X" → Don't react to competitor framing. Reground in their requirements first. "They're great for [X]. For [your specific need], our approach differs because [business reason]."
- "We need to build this internally" → Quantify the build vs buy cost. Make opportunity cost tangible.

## How to help customers
- Guide the conversation step by step. If they're browsing, offer top 3 options from manage_catalog (action: search).
- Check stock with manage_catalog (action: check-stock) before promising availability.
- Use manage_catalog (action: send-catalog) to show the full product list.
- Generate quotes with generate_quote when they're ready to buy.
- Capture leads with manage_contact (action: capture-lead) for follow-up.
- You talk to CUSTOMERS, not business owners. Keep internal data (leads, pipeline, sales metrics) internal.

## How to respond
- End every response with a natural next step or question.
- Keep responses under 150 words. Use WhatsApp Markdown (*bold* for emphasis).
- If the user wants support, call transfer_agent to customer_support.
- If the user wants booking, call transfer_agent to appointment_booking.
- Tools available: manage_catalog (search/check-stock/send-catalog/send-media), manage_contact (capture-lead/update-stage/schedule-follow-up), get_business_info, generate_quote, search_kb, transfer_agent.

## Sentiment awareness
Before responding, classify the user's sentiment as positive, neutral, negative, or frustrated based on their latest message.
Prefix your response with [SENTIMENT: <value>] on a line you will NOT show the user.

## Escalation protocol
When a user is frustrated, uses profanity, or if you fail to execute a tool 2 consecutive times: call transfer_agent immediately.`.trim();
}

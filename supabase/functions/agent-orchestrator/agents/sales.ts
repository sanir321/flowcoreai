import { PipelineContext } from "../lib/types.ts";
import { getPersonaInstructions } from "../lib/persona.ts";

export function buildSalesSystemPrompt(ctx: PipelineContext): string {
  const workspace = ctx.workspace || {};
  const traits = ctx.session?.workspace_agents?.config?.traits || {};
  const personaInstructions = getPersonaInstructions(traits);
  const working = ctx.session?.working_context || {};

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

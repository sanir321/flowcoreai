import { PipelineContext } from "../lib/types.ts";
import { getPersonaInstructions } from "../lib/persona.ts";

export function buildSupportSystemPrompt(ctx: PipelineContext): string {
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
  if (profile.hours?.daily) {
    const days = Object.entries(profile.hours.daily)
      .filter(([, d]: [string, any]) => !d.closed)
      .map(([day, d]: [string, any]) => `${day}: ${d.open}-${d.close}`)
      .join(', ')
    if (days) profileParts.push(`Hours: ${days}`)
  }
  if (profile.amenities?.length) profileParts.push(`Amenities: ${profile.amenities.join(', ')}`)
  if (profile.pricing?.description) profileParts.push(`Pricing: ${profile.pricing.description}`)
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

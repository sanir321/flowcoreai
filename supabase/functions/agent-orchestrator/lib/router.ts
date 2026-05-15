/**
 * /app/actions/router.ts (Implementation for Edge Function)
 * Refactored from intent.ts to follow FlowCore Master Plan Phase 2.
 */

import { RouterResult } from "./types.ts";

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

export async function routeIntent(
  message: string,
  history: any[]
): Promise<RouterResult> {
  const systemPrompt = `You are the FlowCore Router. Your ONLY job is to classify the user's message into one of three agents and determine the intent and urgency.

AGENT TYPES:
- customer_support: Answers general questions about the business, services, hours, or policies.
- sales: Handles expressions of interest, requests for pricing, or potential leads.
- appointment_booking: Handles requests to schedule, change, or cancel appointments.

VALID INTENTS: faq, booking, lead, escalation_request, general.

URGENCY:
- high: User is frustrated, asking for a human, or has a critical issue.
- medium: User has a specific request needing timely action.
- low: General inquiry or greeting.

OUTPUT FORMAT: Return EXACTLY this JSON shape:
{
  "agent": "customer_support" | "sales" | "appointment_booking",
  "intent": "faq" | "booking" | "lead" | "escalation_request" | "general",
  "urgency": "low" | "medium" | "high",
  "entities": { "name": string, "email": string, "phone": string, "date": string, "time": string, "service": string }
}`;

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            ...history.slice(-3).map(m => ({ role: m.role === 'agent' ? 'assistant' : 'user', content: m.content })),
            { role: "user", content: message }
          ],
          temperature: 0.3,
          max_tokens: 200,
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      
      return {
        agent: result.agent || 'customer_support',
        intent: result.intent || 'general',
        urgency: result.urgency || 'low',
        entities: result.entities || {}
      };
    } catch (error: any) {
      if (attempt < 2 && (error.message?.includes('429') || error.message?.includes('rate_limit') || error.message?.includes('500'))) {
        const jitter = Math.random() * 1000;
        const backoff = 1000 * Math.pow(2, attempt) + jitter;
        console.warn(`[ROUTER] Retry ${attempt + 1}/2 after ${Math.round(backoff)}ms...`);
        await new Promise(res => setTimeout(res, backoff));
        continue;
      }
      console.error("[ROUTER] Routing failed:", error.message);
      break;
    }
  }
  return {
    agent: 'customer_support',
    intent: 'general',
    urgency: 'low',
    entities: {}
  };
}

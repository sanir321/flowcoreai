/**
 * /lib/llm.ts (formerly kilo.ts)
 */

import { AgentPayload } from "./types.ts";

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

export const STATIC_FALLBACK_MESSAGE = "I'm having a small technical hiccup right now! Our team has been notified and will get back to you very shortly. Sorry for the inconvenience! 🙏";

async function fetchFromGroq(payload: AgentPayload, model: string) {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...payload,
      model,
      temperature: 0.3,
      max_tokens: 300
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Groq API Error (${response.status}): ${JSON.stringify(errorData)}`);
  }

  return response.json();
}

async function fetchWithRetry(payload: AgentPayload, model: string, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFromGroq(payload, model);
    } catch (err: any) {
      if (attempt === maxRetries) throw err;
      const backoff = 300 * Math.pow(2, attempt);
      console.warn(`[GROQ] Retry ${attempt + 1}/${maxRetries} for ${model} after ${backoff}ms...`);
      await new Promise(res => setTimeout(res, backoff));
    }
  }
  throw new Error('Retries exhausted');
}

export async function callAgentModel(payload: AgentPayload) {
  const PRIMARY_MODEL = "llama-3.3-70b-versatile";
  const FALLBACK_1 = "llama-3.1-8b-instant";
  const FALLBACK_2 = "llama3-70b-8192";

  try {
    console.log(`[GROQ] Attempting primary: ${PRIMARY_MODEL}`);
    return await fetchWithRetry(payload, PRIMARY_MODEL);
  } catch (err1) {
    console.warn(`[GROQ] Primary failed, attempting Fallback 1: ${FALLBACK_1}`);
    try {
      return await fetchWithRetry(payload, FALLBACK_1);
    } catch (err2) {
      console.warn(`[GROQ] Fallback 1 failed, attempting Fallback 2: ${FALLBACK_2}`);
      try {
        return await fetchWithRetry(payload, FALLBACK_2);
      } catch (err3) {
        console.error("[GROQ] ALL MODELS FAILED after exhaustive retries.");
        throw new Error("ALL_MODELS_FAILED");
      }
    }
  }
}

export async function callRouterModel(payload: AgentPayload) {
    // Router uses the versatile model for reliability
    return await fetchFromGroq(payload, 'llama-3.3-70b-versatile');
}

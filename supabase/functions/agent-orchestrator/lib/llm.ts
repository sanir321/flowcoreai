/**
 * /lib/llm.ts (formerly kilo.ts)
 */

import { AgentPayload } from "./types.ts";

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

export const STATIC_FALLBACK_MESSAGE = "I'm having a small technical hiccup right now! Our team has been notified and will get back to you very shortly. Sorry for the inconvenience!";

async function fetchFromGroq(payload: AgentPayload, model: string) {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
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
        max_tokens: 800
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Groq API Error (${response.status}): ${JSON.stringify(errorData)}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithRetry(payload: AgentPayload, model: string, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFromGroq(payload, model);
    } catch (err: any) {
      const isRateLimit = err.message?.includes('429') || err.message?.includes('rate_limit');
      const isServerError = err.message?.includes('500') || err.message?.includes('502') || err.message?.includes('503');
      const isTimeout = err.name === 'AbortError' || err.message?.includes('abort');
      if (attempt === maxRetries || (!isRateLimit && !isServerError && !isTimeout)) throw err;
      const backoff = (isRateLimit ? 500 : 200) * Math.pow(2, attempt) + Math.random() * 500;
      console.warn(`[GROQ] Retry ${attempt + 1}/${maxRetries} for ${model} after ${Math.round(backoff)}ms...`);
      await new Promise(res => setTimeout(res, backoff));
    }
  }
  throw new Error('Retries exhausted');
}

export async function callAgentModel(payload: AgentPayload) {
  const PRIMARY_MODEL = "llama-3.3-70b-versatile";
  const FALLBACK_1 = "llama-3.1-8b-instant";
  const FALLBACK_2 = "meta-llama/llama-4-scout-17b-16e-instruct";

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
    return await fetchWithRetry(payload, 'llama-3.3-70b-versatile', 1);
}

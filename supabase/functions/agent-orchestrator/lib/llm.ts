import { AgentPayload } from "./types.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export const STATIC_FALLBACK_MESSAGE = "I'm having a small technical hiccup right now! Our team has been notified and will get back to you very shortly. Sorry for the inconvenience!";

export async function callLLM(payload: AgentPayload) {
  const PRIMARY = "llama-3.3-70b-versatile";
  const FALLBACK_1 = "llama-3.1-8b-instant";
  const FALLBACK_2 = "meta-llama/llama-4-scout-17b-16e-instruct";

  for (const model of [PRIMARY, FALLBACK_1, FALLBACK_2]) {
    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        return await callGroq({ ...payload, model });
      } catch (error: any) {
        const status = error.status;
        const isRetryable = status === 429 || status === 500 || status === 502 || status === 503;
        if (!isRetryable) throw error;
        if (attempt < 2) {
          const backoff = (status === 429 ? 1000 : 500) * Math.pow(2, attempt);
          await new Promise(res => setTimeout(res, backoff));
        }
      }
    }
  }
  throw new Error("ALL_MODELS_FAILED");
}

async function callGroq(payload: AgentPayload & { model: string }) {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not set");

  const body: Record<string, unknown> = {
    model: payload.model,
    messages: payload.system
      ? [{ role: "system", content: payload.system }, ...payload.messages]
      : payload.messages,
    max_tokens: payload.max_tokens ?? 800,
    temperature: payload.temperature ?? 0.3,
  };
  if (payload.response_format) body.response_format = payload.response_format;
  if (payload.tools) body.tools = payload.tools;
  if (payload.tool_choice) body.tool_choice = payload.tool_choice;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const e = new Error(err.error?.message ?? "Groq error");
      (e as any).status = res.status;
      throw e;
    }

    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function callRouterModel(payload: AgentPayload) {
  return await callLLM({ ...payload, model: "llama-3.1-8b-instant", max_tokens: 100 });
}

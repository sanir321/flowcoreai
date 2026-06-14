import { AgentPayload } from "./types.ts";

const BLUESMINDS_API_KEY = Deno.env.get("BLUESMINDS_API_KEY");
const BLUESMINDS_BASE_URL = "https://api.bluesminds.com/v1";

export const STATIC_FALLBACK_MESSAGE = "I'm having a small technical hiccup right now! Our team has been notified and will get back to you very shortly. Sorry for the inconvenience!";

export async function callLLM(payload: AgentPayload) {
  const FALLBACK_1 = "gpt-4o";
  const DEFAULT_PRIMARY = "gpt-5-mini";
  const modelChain = payload.model
    ? [payload.model, FALLBACK_1]
    : [DEFAULT_PRIMARY, FALLBACK_1];

  for (const model of modelChain) {
    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        return await callBluesMinds({ ...payload, model });
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

async function callBluesMinds(payload: AgentPayload & { model: string }) {
  if (!BLUESMINDS_API_KEY) throw new Error("BLUESMINDS_API_KEY is not set");

  const body: Record<string, unknown> = {
    model: payload.model,
    messages: payload.system
      ? [{ role: "system", content: payload.system }, ...payload.messages]
      : payload.messages,
    max_tokens: payload.max_tokens ?? 800,
    temperature: payload.temperature ?? 0.3,
    stream: false,
  };
  if (payload.response_format) body.response_format = payload.response_format;
  if (payload.tools) body.tools = payload.tools;
  if (payload.tool_choice) body.tool_choice = payload.tool_choice;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${BLUESMINDS_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${BLUESMINDS_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const e = new Error(err.error?.message ?? "BluesMinds error");
      (e as any).status = res.status;
      throw e;
    }

    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function callRouterModel(payload: AgentPayload) {
  return await callLLM({ ...payload, model: "gpt-5-mini", max_tokens: 100 });
}

import { AgentPayload } from "./types.ts";

const OPENCODE_ZEN_API_KEY = Deno.env.get("OPENCODE_ZEN_API_KEY");
const OPENCODE_ZEN_BASE_URL = (Deno.env.get("OPENCODE_ZEN_BASE_URL") || "https://opencode.ai/zen/v1").replace(/\/+$/, "");

export const DEFAULT_FALLBACK_MESSAGE = "I'm not sure about that. Please contact us directly for more information.";

export const FALLBACK_MODEL = "deepseek-v4-flash-free";
const DEFAULT_PRIMARY = "nemotron-3-ultra-free";

export async function callLLM(payload: AgentPayload & { agentType?: string }) {
  const modelChain = payload.model
    ? [payload.model, FALLBACK_MODEL]
    : [DEFAULT_PRIMARY, FALLBACK_MODEL];

  let lastError: any;
  for (const model of modelChain) {
    try {
      return await callZen({ ...payload, model });
    } catch (error: any) {
      lastError = error;
    }
  }
  throw lastError || new Error("ALL_MODELS_FAILED");
}

async function callZen(payload: AgentPayload & { model: string }) {
  if (!OPENCODE_ZEN_API_KEY) throw new Error("OPENCODE_ZEN_API_KEY is not set");

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
  const timeout = setTimeout(() => controller.abort(), payload.max_tokens && payload.max_tokens <= 100 ? 10000 : 20000);

  try {
    const res = await fetch(`${OPENCODE_ZEN_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENCODE_ZEN_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const e = new Error(err.error?.message ?? "OpenCode Zen error");
      (e as any).status = res.status;
      throw e;
    }

    const json = await res.json();
    const msg = json?.choices?.[0]?.message;
    if (msg && (!msg.content || msg.content === "") && msg.reasoning_content) {
      msg.content = msg.reasoning_content;
    }
    return json;
  } finally {
    clearTimeout(timeout);
  }
}

export async function callRouterModel(payload: AgentPayload) {
  return await callLLM({ ...payload, model: DEFAULT_PRIMARY, max_tokens: 100 });
}

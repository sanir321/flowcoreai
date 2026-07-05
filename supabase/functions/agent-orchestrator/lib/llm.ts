import { AgentPayload } from "./types.ts";

const OPENCODE_ZEN_API_KEY = Deno.env.get("OPENCODE_ZEN_API_KEY");
const OPENCODE_ZEN_BASE_URL = (Deno.env.get("OPENCODE_ZEN_BASE_URL") || "https://opencode.ai/zen/v1").replace(/\/+$/, "");

export const DEFAULT_FALLBACK_MESSAGE = "I'm not sure about that. Please contact us directly for more information.";

export const FALLBACK_MODEL = "nemotron-3-ultra-free";
const DEFAULT_PRIMARY = "deepseek-v4-flash-free";

const noToolChoiceModels = new Set<string>();

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

  let systemMsg = payload.system || "";
  if (systemMsg) {
    systemMsg += "\n\nIMPORTANT: Output ONLY the final response. Do NOT include any reasoning, analysis, planning, or chain-of-thought. Respond directly and conversationally.";
  }

  const body: Record<string, unknown> = {
    model: payload.model,
    messages: systemMsg
      ? [{ role: "system", content: systemMsg }, ...payload.messages]
      : payload.messages,
    max_tokens: payload.max_tokens ?? 800,
    temperature: payload.temperature ?? 0.3,
    stream: false,
  };
  if (payload.response_format) body.response_format = payload.response_format;
  if (payload.tools) body.tools = payload.tools;
  if (payload.tool_choice && !noToolChoiceModels.has(payload.model)) body.tool_choice = payload.tool_choice;

  const doFetch = async (b: Record<string, unknown>): Promise<any> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), payload.max_tokens && payload.max_tokens <= 100 ? 5000 : 10000);
    try {
      const res = await fetch(`${OPENCODE_ZEN_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENCODE_ZEN_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(b),
        signal: controller.signal
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const errMsg = errBody.error?.message || "API error";
        const e = new Error(errMsg);
        (e as any).status = res.status;
        (e as any)._raw = errBody;
        throw e;
      }
      return await res.json();
    } finally {
      clearTimeout(timeout);
    }
  };

  try {
    const json = await doFetch(body);
    const msg = json?.choices?.[0]?.message;
    if (msg && (!msg.content || msg.content === "")) {
      msg.content = msg.reasoning_content || "";
    }
    return json;
  } catch (e: any) {
    if (e._raw?.error?.message?.includes("tool_choice") && body.tool_choice) {
      noToolChoiceModels.add(payload.model);
      delete body.tool_choice;
      const json = await doFetch(body);
      const msg = json?.choices?.[0]?.message;
      if (msg && (!msg.content || msg.content === "")) {
        msg.content = msg.reasoning_content || "";
      }
      return json;
    }
    throw e;
  }
}


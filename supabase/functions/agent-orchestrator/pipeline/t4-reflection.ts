import { PipelineContext } from "../lib/types.ts";

const EMPTY_RESPONSE_PATTERNS = [
  /\bI'?m\s+not\s+(sure|certain|confident|able)\b/i,
  /\bI\s+don'?t\s+(know|have|understand)\b/i,
  /\bI\s+cannot\s+(help|assist|answer)\b/i,
  /\bI\s+apologize\b/i,
  /\bsorry,\s+I\s+(can'?t|cannot|don'?t)\b/i,
  /\bplease\s+contact\s+(us|the\s+business|them)\s+directly\b/i,
];

const JSON_TOOL_CALL_PATTERN = /^\s*\{\s*"(?:tool|function|name|action|arguments|params)"\s*:/i;

export async function runT5(
  ctx: PipelineContext,
  response: string,
  agentType: string
): Promise<{ response: string; reason: string; retry_hint?: string }> {
  const msg = ctx.payload.message;
  const fallbackMsg = ctx.workspace?.guardrail_config?.fallback_message
    ?? "I'm not sure about that. Please contact us directly for more information.";

  const isEmpty = !response || response.trim().length < 15;
  const isGeneric = EMPTY_RESPONSE_PATTERNS.some(p => p.test(response));
  const isToolCallJson = JSON_TOOL_CALL_PATTERN.test(response.trim());

  if (isEmpty) {
    console.warn(`[T5] Empty response (len=${(response || "").length}) for agent ${agentType}`);
    return { response: fallbackMsg, reason: "t5_empty", retry_hint: "Generate a complete, direct response. Do not apologize or say you're not sure." };
  }

  if (isToolCallJson) {
    console.warn(`[T5] Raw JSON tool call in response for agent ${agentType}: "${response.slice(0, 80)}..."`);
    return { response: fallbackMsg, reason: "t5_json_tool_call", retry_hint: "Output a natural-language response to the customer, not a JSON tool call. Write conversationally." };
  }

  if (isGeneric && ctx._queryAnalysis) {
    console.warn(`[T5] Generic response for ${ctx._queryAnalysis.intent}: "${response.slice(0, 60)}..."`);
    return { response: fallbackMsg, reason: "t5_generic", retry_hint: `Be specific and helpful about: ${ctx._queryAnalysis.intent}. Answer directly from your knowledge.` };
  }

  return { response, reason: "t5_passed" };
}

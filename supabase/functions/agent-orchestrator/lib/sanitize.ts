const SYSTEM_PROMPT_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directions|rules|prompts)/gi,
  /you\s+are\s+(now|actually|really)\s+/gi,
  /system\s+(message|prompt|instruction):/gi,
  /reset\s+(your\s+)?(instructions|config|configuration)/gi,
  /new\s+(system\s+)?(prompt|instruction):/gi,
  /disregard\s+(all\s+)?(previous|prior)/gi,
];

export function sanitizeUserInput(input: string): string {
  let sanitized = input;
  for (const pattern of SYSTEM_PROMPT_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[content removed]");
  }
  return sanitized.trim();
}

const HTML_TAG_PATTERN = /<[^>]*>/g;
const JSON_ARTIFACT_PATTERN = /\s*\{[^}]*"(?:caption|image_url|phone|message)"[^}]*\}\s*/g;

export function sanitizeLlmOutput(output: string): string {
  if (!output) return output;
  let clean = output.replace(HTML_TAG_PATTERN, "");
  clean = clean.replace(JSON_ARTIFACT_PATTERN, "");
  clean = clean.replace(/\s+,?\s*$/, "").trim();
  clean = clean.replace(/\bfor([a-z]+)\b/gi, (m, s) => {
    const prefix = m.slice(0, -s.length);
    return prefix + " " + s;
  });
  return clean;
}

export function stripToolCallJson(response: string): string {
  const TOOL_CALL_PATTERN = /^\s*(\{[^}]*"(?:tool|function|name|action|arguments|params)"[^}]*\})\s*$/s;
  return response.replace(TOOL_CALL_PATTERN, "").trim();
}

export function cleanFinalResponse(response: string): string {
  if (!response) return response;
  let clean = stripToolCallJson(response);
  if (clean !== response) response = clean;
  const SHORT_TOOL_JSON = /^\s*(?:\{[^}]{0,200}\})\s*$/s;
  if (SHORT_TOOL_JSON.test(response.trim())) {
    return "";
  }
  return response.trim();
}
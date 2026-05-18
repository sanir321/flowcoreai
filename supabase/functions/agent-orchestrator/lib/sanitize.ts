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
  return clean;
}

export async function checkTokenBudget(
  supabase: any,
  sessionId: string,
  tokensUsed: number,
  maxTokensPerSession = 100000
): Promise<{ allowed: boolean; usage: number }> {
  const { data: session } = await supabase
    .from("conversation_sessions")
    .select("total_tokens_used, message_count")
    .eq("id", sessionId)
    .single();

  const totalSoFar = session?.total_tokens_used || 0;
  const projectedUsage = totalSoFar + tokensUsed;
  const allowed = projectedUsage <= maxTokensPerSession;

  if (tokensUsed > 0) {
    await supabase
      .from("conversation_sessions")
      .update({
        total_tokens_used: projectedUsage,
        message_count: (session?.message_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);
  }

  return { allowed, usage: totalSoFar };
}

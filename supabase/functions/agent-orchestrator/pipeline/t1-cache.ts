import { PipelineContext, TierResult } from "../lib/types.ts";
import { generateEmbedding } from "../lib/hf-embeddings.ts";

export async function runT1(ctx: PipelineContext): Promise<TierResult> {
  // 1. Exact hash cache
  const msgBytes = new TextEncoder().encode(ctx.payload.message.toLowerCase().trim().slice(0, 500));
  const hashBuf = await crypto.subtle.digest("SHA-256", msgBytes);
  const cacheKeyHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
  ctx._cacheKeyHex = cacheKeyHex;

  const { data: cached } = await ctx.supabase
    .from("kb_response_cache")
    .select("response_text, access_count, id")
    .eq("workspace_id", ctx.payload.workspace_id)
    .eq("cache_key", cacheKeyHex)
    .maybeSingle();

  if (cached) {
    await ctx.supabase.from("kb_response_cache")
      .update({ accessed_at: new Date().toISOString(), access_count: (cached.access_count || 0) + 1 })
      .eq("id", cached.id);
    return { handled: true, response: cached.response_text, reason: "cache_hit_exact" };
  }

  // 2. Embedding similarity
  const workspace = ctx.workspace;
  try {
    const embedding = await generateEmbedding(ctx.payload.message);
    ctx.embedding = embedding;
    const { data: similar } = await ctx.supabase.rpc("match_kb_chunks", {
      query_embedding: embedding,
      match_threshold: 0.80,
      match_count: 1,
      p_workspace_id: ctx.payload.workspace_id
    });

    if (similar && similar.length > 0 && similar[0].similarity > 0.80) {
      return { handled: true, response: similar[0].content, reason: "cache_hit_embedding" };
    }
  } catch (e) {
    console.error("[T1] Embedding/cache error:", e?.message || e);
  }

  return { handled: false };
}

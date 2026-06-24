import { generateEmbedding } from "../../lib/hf-embeddings.ts";
import { PipelineContext } from "../../lib/types.ts";

const DEFAULT_KB_CONFIG = {
  match_count: 3,
  match_threshold: 0.35,
  chunk_truncation: 800,
  noise_stripping: true,
};

export async function matchChunks(params: { query: string }, ctx: PipelineContext) {
  // Reuse the speculative search started in T2 when the query is the raw message.
  if (ctx.kbSearchPromise && params.query.trim().toLowerCase() === ctx.payload.message.trim().toLowerCase()) {
    return ctx.kbSearchPromise;
  }

  let embedding: number[];
  try {
    if (ctx.embedding && params.query.trim().toLowerCase() === ctx.payload.message.trim().toLowerCase()) {
      embedding = ctx.embedding;
    } else {
      embedding = await generateEmbedding(params.query);
    }
  } catch {
    // Embedding failed - return success with empty results so KB doesn't block the pipeline
    return { success: true, chunks: [], kb_chunks: [] };
  }

  const kbConfig = ctx.workspace?.kb_config || DEFAULT_KB_CONFIG;

  // Hybrid search: vector + keyword fallback (p_query_text overload).
  const { data: kb, error } = await ctx.supabase.rpc("match_kb_chunks", {
    query_embedding: embedding,
    match_threshold: kbConfig.match_threshold ?? DEFAULT_KB_CONFIG.match_threshold,
    match_count: kbConfig.match_count ?? DEFAULT_KB_CONFIG.match_count,
    p_workspace_id: ctx.payload.workspace_id,
    p_query_text: params.query,
  });

  if (error) {
    console.error("[KB] match_kb_chunks RPC error:", error.message);
    return { success: true, chunks: [], kb_chunks: [] };
  }

  const chunks = kb || [];
  return { success: true, chunks, kb_chunks: chunks };
}

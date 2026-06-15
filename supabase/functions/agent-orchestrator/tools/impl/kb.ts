import { generateEmbedding } from "../../lib/hf-embeddings.ts";
import { PipelineContext } from "../../lib/types.ts";

const MATCH_THRESHOLD = 0.35;
const MATCH_COUNT = 5;

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
    return { success: false, chunks: [], kb_chunks: [] };
  }

  // Hybrid search: vector + keyword fallback (p_query_text overload).
  const { data: kb, error } = await ctx.supabase.rpc("match_kb_chunks", {
    query_embedding: embedding,
    match_threshold: MATCH_THRESHOLD,
    match_count: MATCH_COUNT,
    p_workspace_id: ctx.payload.workspace_id,
    p_query_text: params.query,
  });

  if (error) {
    console.error("[KB] match_kb_chunks RPC error:", error.message);
    return { success: false, chunks: [], kb_chunks: [] };
  }

  const chunks = kb || [];
  return { success: true, chunks, kb_chunks: chunks };
}

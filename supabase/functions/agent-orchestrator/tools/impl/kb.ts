import { generateEmbedding } from "../../lib/hf-embeddings.ts";
import { PipelineContext } from "../../lib/types.ts";

export async function matchChunks(params: { query: string }, ctx: PipelineContext) {
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
    return { kb_chunks: [] };
  }
  const { data: kb, error } = await ctx.supabase.rpc("match_kb_chunks", {
    query_embedding: embedding,
    match_threshold: 0.75,
    match_count: 5,
    p_workspace_id: ctx.payload.workspace_id
  });
  if (error) {
    console.error("[KB] match_kb_chunks RPC error:", error.message);
    return { kb_chunks: [] };
  }
  return { kb_chunks: kb || [] };
}

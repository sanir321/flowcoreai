import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize the local embedding model
const model = new Supabase.ai.Session('gte-small')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { workspace_id, source_id, storage_path } = await req.json()

    // 0. Update status to processing
    await supabase.from('kb_sources').update({ status: 'processing' }).eq('id', source_id)

    // 1. Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage.from('kb-documents').download(storage_path)
    if (downloadError) throw downloadError

    // 2. Extract content
    const text = await fileData.text()

    // 3. Chunking
    const chunks = text.match(/.{1,1000}/g) || []

    // 4. Generate Embeddings via Local Model (Free, 384 dims)
    const chunksToInsert = []
    for (let i = 0; i < chunks.length; i++) {
      const content = chunks[i];

      const embedding = await model.run(content, {
        mean_pool: true,
        normalize: true,
      })

      chunksToInsert.push({
        workspace_id,
        source_id,
        content,
        embedding: Array.from(embedding),
        chunk_index: i,
        token_count: Math.ceil(content.length / 4)
      })
    }
    // 5. Finalize
    if (chunksToInsert.length > 0) {
      await supabase.from('kb_chunks').insert(chunksToInsert)
    }
    await supabase.from('kb_sources').update({ status: 'active', chunk_count: chunks.length }).eq('id', source_id)
    
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

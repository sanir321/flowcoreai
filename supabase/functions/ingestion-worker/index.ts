import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize the local embedding model
const model = new Supabase.ai.Session('gte-small')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { source_id, workspace_id } = await req.json()

    // 1. Fetch Source
    const { data: source, error: sourceError } = await supabase
      .from('kb_sources')
      .select('*')
      .eq('id', source_id)
      .single()

    if (sourceError || !source) throw new Error('Source not found')

    // 2. Update status to processing
    await supabase
      .from('kb_sources')
      .update({ status: 'processing' })
      .eq('id', source_id)

    // 3. Extract Content (Placeholder logic)
    let content = ""
    if (source.source_type === 'url') {
      content = `This is extracted content from ${source.url}. It contains information about our products and services.`
    } else {
      content = `This is extracted content from the uploaded file ${source.label}.`
    }

    // 4. Chunk Content
    const chunks = content.match(/[^.!?]+[.!?]+/g) || [content]
    
    // 5. Generate Embeddings & Store Chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim()
      if (!chunk) continue

      // Use local Supabase AI model for embeddings (Free, 384 dims)
      const embedding = await model.run(chunk, {
        mean_pool: true,
        normalize: true,
      })

      await supabase
        .from('kb_chunks')
        .insert({
          workspace_id,
          source_id,
          content: chunk,
          embedding: Array.from(embedding),
          chunk_index: i,
          token_count: chunk.split(' ').length
        })
    }

    // 6. Finalize Source
    await supabase
      .from('kb_sources')
      .update({ 
        status: 'active',
        chunk_count: chunks.length 
      })
      .eq('id', source_id)

    return new Response(
      JSON.stringify({ success: true, chunks: chunks.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

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

    const { workspace_id, source_id, url } = await req.json()

    // 0. Update status to processing and set initial message
    await supabase.from('kb_sources').update({ 
      status: 'processing',
      error_message: 'Fetching website content...' 
    }).eq('id', source_id)

    // 1. Fetch and process URL
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`)
    
    const html = await response.text()
    const text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
                     .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
                     .replace(/<[^>]*>?/gm, ' ')
                     .replace(/\s+/g, ' ')
                     .trim()

    if (text.length < 10) throw new Error("No meaningful content found on the page.")

    // 2. Chunking
    await supabase.from('kb_sources').update({ error_message: 'Analyzing and chunking content...' }).eq('id', source_id)
    const chunks = splitIntoChunks(text, 1000)

    // 3. Generate Embeddings via Local Model
    const chunksToInsert = []
    for (let i = 0; i < chunks.length; i++) {
      const content = chunks[i];
      
      // Update progress periodically
      if (i % 5 === 0) {
        await supabase.from('kb_sources').update({ 
          error_message: `Generating AI embeddings (Chunk ${i + 1}/${chunks.length})...` 
        }).eq('id', source_id)
      }
      
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

    // 4. Update source and jobs
    await supabase.from('kb_sources').update({ error_message: 'Finalizing knowledge base...' }).eq('id', source_id)
    
    if (chunksToInsert.length > 0) {
      const { error: insertError } = await supabase.from('kb_chunks').insert(chunksToInsert)
      if (insertError) throw new Error(`Failed to save chunks: ${insertError.message}`)
    }

    // FINAL GATE: Only set to active if we actually have chunks or the process definitely finished
    const { error: finalError } = await supabase.from('kb_sources').update({ 
      status: 'active', 
      chunk_count: chunks.length,
      error_message: null,
      updated_at: new Date().toISOString()
    }).eq('id', source_id)

    if (finalError) throw new Error(`Failed to activate source: ${finalError.message}`)
    
    await supabase.from('ingestion_jobs').update({ status: 'completed' }).eq('source_id', source_id)

    return new Response(JSON.stringify({ success: true, chunks: chunks.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error(error)
    
    // Attempt to mark as failed in DB
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      const { source_id } = await req.clone().json().catch(() => ({}))
      if (source_id) {
        await supabase.from('kb_sources').update({ 
          status: 'failed', 
          error_message: error.message 
        }).eq('id', source_id)
      }
    } catch (e) {
      console.error("Failed to update error status:", e)
    }

    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

function splitIntoChunks(text: string, maxSize: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  const chunks: string[] = []
  let current = ""
  for (const sentence of sentences) {
    if ((current + sentence).length > maxSize && current.length > 0) {
      chunks.push(current.trim())
      current = sentence
    } else {
      current += sentence
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks.length > 0 ? chunks : [text.slice(0, maxSize)]
}

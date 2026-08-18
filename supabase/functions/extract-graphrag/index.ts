import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

let aiModel: any = null
async function getEmbeddingModel() {
  if (!aiModel) {
    // @ts-ignore Supabase Edge Runtime AI
    aiModel = new Supabase.ai.Session('gte-small')
  }
  return aiModel
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const srk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const cronSecret = Deno.env.get("INTERNAL_CRON_SECRET") || ""
    const authHeader = req.headers.get("Authorization") || ""
    const token = authHeader.replace("Bearer ", "")
    
    if (token !== cronSecret && token !== srk) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", srk)
    const opencodeKey = Deno.env.get("OPENCODE_ZEN_API_KEY")

    if (!opencodeKey) {
      return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 })
    }

    const { workspace_id, source_id } = await req.json()
    if (!workspace_id || !source_id) throw new Error("Missing workspace_id or source_id")

    // Fetch chunks
    const { data: chunks, error: chunkErr } = await supabase
      .from('kb_chunks')
      .select('content')
      .eq('source_id', source_id)
      .eq('workspace_id', workspace_id)
      .order('chunk_index', { ascending: true })

    if (chunkErr || !chunks || chunks.length === 0) {
      return new Response(JSON.stringify({ skipped: true, reason: "no_chunks" }), { status: 200 })
    }

    const fullText = chunks.map(c => c.content).join("\n\n")
    const textBlocks = []
    let currentBlock = ""
    // chunk to ~20k chars
    for (const chunk of chunks) {
      if (currentBlock.length + chunk.content.length > 20000) {
        textBlocks.push(currentBlock)
        currentBlock = chunk.content
      } else {
        currentBlock += "\n\n" + chunk.content
      }
    }
    if (currentBlock) textBlocks.push(currentBlock)

    for (const block of textBlocks) {
      const systemPrompt = `You are an expert knowledge graph extractor. Extract key entities and relationships from the provided knowledge base text.
Return ONLY valid JSON matching this schema:
{
  "nodes": [{ "name": "Entity Name", "type": "Concept|Service|Policy|Location|Person", "description": "Brief description" }],
  "edges": [{ "source_node": "Entity Name", "target_node": "Entity Name", "relation_type": "PROVIDES|REQUIRES|RELATED_TO", "description": "Connection details" }]
}`
      
      const baseUrl = Deno.env.get("OPENCODE_ZEN_BASE_URL") || "https://opencode.ai/zen/v1"
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${opencodeKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "nemotron-3-ultra-free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: block }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        })
      })

      if (!res.ok) continue

      const json = await res.json()
      const content = json.choices?.[0]?.message?.content
      if (!content) continue

      let parsed: any
      try {
        parsed = JSON.parse(content)
      } catch (e) {
        continue
      }

      if (!parsed.nodes || !parsed.edges) continue

      const embedModel = await getEmbeddingModel()
      
      // Map name -> id for edges
      const nodeMap = new Map<string, string>()

      // Process Nodes
      for (const n of parsed.nodes) {
        if (!n.name || !n.type) continue
        const textToEmbed = `${n.name}: ${n.description || ""}`
        let embedding: any
        try {
          embedding = await embedModel.run(textToEmbed, { mean_pool: true, normalize: true })
        } catch { continue }

        // upsert node
        const { data: nodeData } = await supabase.from('kb_nodes').select('id').eq('workspace_id', workspace_id).ilike('name', n.name).maybeSingle()
        let nodeId = nodeData?.id
        if (!nodeId) {
          const { data: inserted } = await supabase.from('kb_nodes').insert({
            workspace_id, source_id,
            name: n.name, type: n.type, description: n.description,
            embedding: Array.from(embedding)
          }).select('id').single()
          if (inserted) nodeId = inserted.id
        }
        if (nodeId) nodeMap.set(n.name, nodeId)
      }

      // Process Edges
      for (const e of parsed.edges) {
        if (!e.source_node || !e.target_node || !e.relation_type) continue
        // find node ids by matching exact or ignoring case
        // The nodeMap has exact names.
        let sId = nodeMap.get(e.source_node)
        let tId = nodeMap.get(e.target_node)
        
        if (!sId) {
           const { data: nodeData } = await supabase.from('kb_nodes').select('id').eq('workspace_id', workspace_id).ilike('name', e.source_node).maybeSingle()
           sId = nodeData?.id
        }
        if (!tId) {
           const { data: nodeData } = await supabase.from('kb_nodes').select('id').eq('workspace_id', workspace_id).ilike('name', e.target_node).maybeSingle()
           tId = nodeData?.id
        }

        if (sId && tId) {
          await supabase.from('kb_edges').upsert({
            workspace_id, source_id,
            source_node_id: sId,
            target_node_id: tId,
            relation_type: e.relation_type,
            description: e.description
          }, { onConflict: 'source_node_id,target_node_id,relation_type' })
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
  } catch (err: any) {
    console.error("GraphRAG Error:", err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})

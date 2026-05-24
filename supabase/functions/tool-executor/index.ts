import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import { executeTool } from "../agent-orchestrator/lib/tools.ts"

// NOTE: No CORS — this is an internal function, not called from browsers
// Auth via JWT verification (supabase.auth.getUser) in the handler below

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { status: 204 })

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      })
    }

    const { tool_name, args, workspace_id, session_id } = await req.json()

    if (!tool_name || !workspace_id) {
      return new Response(JSON.stringify({ error: "tool_name and workspace_id are required" }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    const result = await executeTool({
      tool_name,
      args: args || {},
      workspace_id,
      session_id: session_id || crypto.randomUUID(),
      supabase
    })

    return new Response(JSON.stringify({ result }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: "Tool execution failed" }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
})

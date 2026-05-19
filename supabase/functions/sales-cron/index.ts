import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders, status: 204 })

  try {
    const auth = req.headers.get('authorization') || ''
    const cronSecret = Deno.env.get('INTERNAL_CRON_SECRET')
    if (cronSecret && auth !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { headers: corsHeaders, status: 401 })
    }

    const supaUrl = Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '')
    const supaKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supaUrl, supaKey)
    const gowaBase = Deno.env.get('GOWA_BASE_URL')?.replace(/\/$/, '')
    const gowaKey = Deno.env.get('GOWA_API_KEY')
    const gowaAuth = gowaKey ? btoa(gowaKey) : ''

    const now = new Date().toISOString()

    const { data: followUps, error } = await supabase
      .from('follow_ups')
      .select(`
        id,
        workspace_id,
        session_id,
        message_template,
        contact_id
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .limit(50)

    if (error) throw error
    if (!followUps || followUps.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No pending follow-ups' }), { headers: corsHeaders })
    }

    const workspaceIds = [...new Set(followUps.map(f => f.workspace_id))]
    const { data: sessions } = await supabase
      .from('gowa_sessions')
      .select('workspace_id, gowa_session_id')
      .in('workspace_id', workspaceIds)
      .eq('status', 'connected')
    const deviceMap: Record<string, string> = {}
    for (const s of sessions || []) {
      if (s.gowa_session_id) deviceMap[s.workspace_id] = s.gowa_session_id
    }

    const { data: conSessions } = await supabase
      .from('conversation_sessions')
      .select('id, customer_jid, workspace_id')
      .in('id', followUps.filter(f => f.session_id).map(f => f.session_id!))
    const jidMap: Record<string, string> = {}
    for (const cs of conSessions || []) {
      if (cs.customer_jid) jidMap[cs.id] = cs.customer_jid
    }

    let sent = 0
    let failed = 0
    const results: any[] = []

    for (const fu of followUps) {
      const deviceId = deviceMap[fu.workspace_id]
      const customerJid = fu.session_id ? jidMap[fu.session_id] : null
      if (!deviceId || !customerJid) {
        await supabase.from('follow_ups').update({
          status: 'failed',
          failure_reason: !deviceId ? 'no WhatsApp device' : 'no customer JID',
          updated_at: now,
        }).eq('id', fu.id)
        failed++
        continue
      }

      const message = fu.message_template || 'Hi! Just following up on our conversation.'
      try {
        const resp = await fetch(`${gowaBase}/send/message`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${gowaAuth}`,
            'Content-Type': 'application/json',
            'X-Device-Id': deviceId,
          },
          body: JSON.stringify({
            phone: customerJid.split('@')[0],
            message,
          }),
        })
        if (resp.ok) {
          await supabase.from('follow_ups').update({
            status: 'sent',
            sent_at: now,
            updated_at: now,
          }).eq('id', fu.id)
          await supabase.from('contacts').update({
            last_followed_up_at: now,
          }).eq('id', fu.contact_id)
          sent++
          results.push({ id: fu.id, status: 'sent' })
        } else {
          const errText = await resp.text()
          throw new Error(`GoWA ${resp.status}: ${errText}`)
        }
      } catch (e: any) {
        await supabase.from('follow_ups').update({
          status: 'failed',
          failure_reason: e.message?.slice(0, 255),
          updated_at: now,
        }).eq('id', fu.id)
        failed++
        results.push({ id: fu.id, status: 'failed', error: e.message })
      }
    }

    return new Response(JSON.stringify({ sent, failed, total: followUps.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { headers: corsHeaders, status: 500 })
  }
})

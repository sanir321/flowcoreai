import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1"

const responseHeaders = {
  'Content-Type': 'application/json',
}

// L1: constant-time comparison to prevent timing attacks on secret checks.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 })

  try {
    // Auth: REQUIRED Bearer token against INTERNAL_CRON_SECRET
    const auth = req.headers.get('authorization') || ''
    const cronSecret = Deno.env.get('INTERNAL_CRON_SECRET')
    if (!cronSecret) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500, headers: responseHeaders })
    }
    const provided = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : ''
    // L1: constant-time comparison to prevent timing attacks.
    if (!timingSafeEqual(provided, cronSecret)) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: responseHeaders })
    }

    const supaUrl = Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '')
    const supaKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supaUrl, supaKey)

    // L2: advisory lock so concurrent cron invocations never double-send.
    const LOCK_KEY = 795001
    const { data: gotLock, error: lockErr } = await supabase.rpc('pg_try_advisory_lock', { key: LOCK_KEY })
    if (lockErr) {
      console.error('[sales-cron] Advisory lock error:', lockErr.message)
      return new Response(JSON.stringify({ error: 'Lock acquisition failed' }), { headers: responseHeaders, status: 500 })
    }
    if (!gotLock) {
      return new Response(JSON.stringify({ sent: 0, message: 'Concurrent run in progress' }), { headers: responseHeaders })
    }

    try {
      return await runJob(supabase)
    } finally {
      await supabase.rpc('pg_advisory_unlock', { key: LOCK_KEY }).catch(() => {})
    }
  } catch (e: any) {
    console.error("[sales-cron] Error:", e.message)
    return new Response(JSON.stringify({ error: "Follow-up processing failed" }), { headers: responseHeaders, status: 500 })
  }
})

async function runJob(supabase: any): Promise<Response> {
    const responseHeaders = { 'Content-Type': 'application/json' }
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
      return new Response(JSON.stringify({ sent: 0, message: 'No pending follow-ups' }), { headers: responseHeaders })
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

    const sessionIds = followUps.filter(f => f.session_id).map(f => f.session_id!);
    if (sessionIds.length === 0) {
      console.log("[SALES-CRON] No follow-ups with valid session IDs, skipping");
      return new Response(JSON.stringify({ sent: 0 }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    const { data: conSessions } = await supabase
      .from('conversation_sessions')
      .select('id, customer_jid, workspace_id')
      .in('id', sessionIds)
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
      headers: responseHeaders,
    })
}

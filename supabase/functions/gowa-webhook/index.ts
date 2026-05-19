import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

declare const EdgeRuntime: { waitUntil: (promise: Promise<any>) => void }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Vary': 'Origin',
}

function normalizeJID(jid: string): string {
  if (!jid) return jid
  let normalized = jid.replace(/:\d+@/, '@')
  if (!normalized.includes('@')) return `${normalized}@s.whatsapp.net`
  return normalized
}

async function verifySignature(payload: string, signature: string | null, secret: string | undefined): Promise<boolean> {
  if (!secret) {
    console.warn('[WEBHOOK] GOWA_WEBHOOK_SECRET not configured, skipping verification')
    return true
  }
  if (!signature) {
    console.error('[WEBHOOK] No signature header found')
    return false
  }
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    const sigHex = signature.startsWith('sha256=') ? signature.slice(7) : signature
    const sigBytes = new Uint8Array(sigHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)))
    return await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payload))
  } catch (err) {
    console.error('[WEBHOOK] Signature verification error:', err)
    return false
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('x-hub-signature-256')
  const secret = Deno.env.get('GOWA_WEBHOOK_SECRET')
  const isValid = await verifySignature(rawBody, signature, secret)
  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const rootPayload = JSON.parse(rawBody)
    const { event } = rootPayload
    const eventData = rootPayload.payload || rootPayload.data

    if (event !== 'message') {
      return new Response(JSON.stringify({ success: true, message: 'event ignored' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!eventData) throw new Error('No data/payload field')

    const { from, chat_id, message, body, from_name, pushName, id: gowaMessageId } = eventData
    const isGroup = eventData.isGroup || chat_id?.endsWith('@g.us') || from?.endsWith('@g.us')
    if (isGroup) {
      return new Response(JSON.stringify({ success: true, message: 'group message ignored' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const normalizedFrom = normalizeJID(from)
    const mediaTypes = ['imageMessage', 'videoMessage', 'documentMessage', 'audioMessage', 'stickerMessage', 'ptvMessage', 'voiceMessage']
    let mediaCaption = '', mediaPath = '', mediaMime = ''
    for (const mt of mediaTypes) {
      const mediaObj = message?.[mt]
      if (mediaObj) {
        mediaCaption = mediaObj.caption || ''
        mediaPath = mediaObj.url || mediaObj.mediaPath || eventData.mediaPath || ''
        mediaMime = mediaObj.mimetype || eventData.mimeType || mt
        break
      }
    }

    const messageText = body || message?.conversation || message?.extendedTextMessage?.text || mediaCaption || ''
    const pushname = from_name || pushName || 'Customer'
    const messageMetadata: Record<string, unknown> = {}
    if (mediaPath) {
      messageMetadata.media_path = mediaPath
      messageMetadata.media_mime = mediaMime
      messageMetadata.media_type = eventData.type || mediaMime
      if (mediaCaption) messageMetadata.media_caption = mediaCaption
    }
    const hasMedia = !!mediaPath

    let sessionIdentifier = rootPayload.device_id || rootPayload.session || rootPayload.deviceId || rootPayload.jid
    if (sessionIdentifier && typeof sessionIdentifier === 'string') {
      sessionIdentifier = sessionIdentifier.replace(/:\d+@/, '@')
    }

    const { data: gowaSession } = await supabase.from('gowa_sessions').select('workspace_id, gowa_session_id').or(`gowa_session_id.eq."${sessionIdentifier}",phone_jid.eq."${sessionIdentifier}"`).maybeSingle()
    if (!gowaSession) {
      return new Response(JSON.stringify({ success: false, error: 'Workspace not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const workspaceId = gowaSession.workspace_id

    // Dedup check by gowa_message_id
    const { data: existingMsg } = await supabase.from('messages').select('id').eq('gowa_message_id', gowaMessageId).eq('workspace_id', workspaceId).maybeSingle()
    if (existingMsg) {
      return new Response(JSON.stringify({ success: true, message: 'duplicate' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Resolve or Create Contact
    const { data: contact } = await supabase.from('contacts').upsert({ workspace_id: workspaceId, whatsapp_jid: normalizedFrom, name: pushname, phone: normalizedFrom.split('@')[0], channel: 'whatsapp' }, { onConflict: 'workspace_id, phone' }).select().single()

    // Resolve or Create Active Session
    let { data: activeSession } = await supabase.from('conversation_sessions').select('*').eq('workspace_id', workspaceId).eq('customer_jid', normalizedFrom).eq('status', 'active').maybeSingle()
    if (!activeSession) {
      const { data: newSession } = await supabase.from('conversation_sessions').insert({ workspace_id: workspaceId, contact_id: contact.id, customer_jid: normalizedFrom, customer_name: pushname, channel: 'whatsapp', status: 'active' }).select().single()
      activeSession = newSession
    }

    const displayContent = messageText || (hasMedia ? '[Media message]' : '')

    // Secondary dedup: same content within 3 seconds
    const threeSecondsAgo = new Date(Date.now() - 3000).toISOString()
    const { data: recentDup } = await supabase.from('messages').select('id').eq('workspace_id', workspaceId).eq('session_id', activeSession.id).eq('direction', 'inbound').eq('content', displayContent).gte('created_at', threeSecondsAgo).maybeSingle()
    if (recentDup) {
      return new Response(JSON.stringify({ success: true, message: 'duplicate' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Store inbound message
    const { error: msgError } = await supabase.from('messages').insert({ workspace_id: workspaceId, session_id: activeSession.id, content: displayContent, direction: 'inbound', role: 'customer', gowa_message_id: gowaMessageId, metadata: Object.keys(messageMetadata).length > 0 ? messageMetadata : {} })
    if (msgError) {
      if (msgError.code === '23505') {
        return new Response(JSON.stringify({ success: true, message: 'duplicate' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      throw msgError
    }

    // Update session
    await supabase.from('conversation_sessions').update({ last_message_at: new Date().toISOString(), last_customer_message_at: new Date().toISOString(), last_message_preview: displayContent.substring(0, 100), updated_at: new Date().toISOString() }).eq('id', activeSession.id)

    // Fire AI processing
    const processAI = async () => {
      try {
        const aiClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
        const { data: aiResponse, error: aiError } = await aiClient.functions.invoke('agent-orchestrator', {
          body: { workspace_id: workspaceId, session_id: activeSession.id, customer_jid: normalizedFrom, message: displayContent, channel: 'whatsapp', ...(hasMedia ? { media_metadata: messageMetadata } : {}) },
          headers: { 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` }
        })
        if (aiError) console.error('[WEBHOOK] Orchestrator error:', aiError)
      } catch (e) {
        console.error('[WEBHOOK] Background AI failed:', e)
      }
    }
    EdgeRuntime.waitUntil(processAI())

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    console.error('[WEBHOOK] Error:', error)
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

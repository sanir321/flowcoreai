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

async function resolveWorkspace(supabase: any, rootPayload: any, sessionIdentifier: string | undefined): Promise<string | null> {
  // Lookup by stored session ID or phone JID
  if (sessionIdentifier) {
    // SECURITY: Use parameterized eq filters instead of string interpolation in .or()
    let query = supabase.from('gowa_sessions').select('workspace_id, gowa_session_id, phone_jid')
    // Try both filters separately (safer than string interpolation)
    const { data: bySession } = await query.eq('gowa_session_id', sessionIdentifier).maybeSingle()
    if (bySession) return bySession.workspace_id
    const { data: byPhone } = await supabase.from('gowa_sessions').select('workspace_id, gowa_session_id, phone_jid').eq('phone_jid', sessionIdentifier).maybeSingle()
    if (byPhone) return byPhone.workspace_id
  }

  // Auto-recover from incoming device_id
  const rawDeviceId = rootPayload.device_id || rootPayload.session || rootPayload.deviceId
  if (rawDeviceId) {
    const { data: existing } = await supabase.from('gowa_sessions').select('workspace_id').maybeSingle()
    if (existing) {
      const isJid = rawDeviceId.includes('@')
      await supabase.from('gowa_sessions').update({
        gowa_session_id: isJid ? null : rawDeviceId,
        phone_jid: isJid ? rawDeviceId : null,
        status: 'connected',
        updated_at: new Date().toISOString()
      }).eq('workspace_id', existing.workspace_id)
      return existing.workspace_id
    }
  }

  return null
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
    const pushname = from_name || pushName || 'Customer'

    // Extract media
    const mediaTypes = ['imageMessage', 'videoMessage', 'documentMessage', 'audioMessage', 'stickerMessage', 'ptvMessage', 'voiceMessage']
    let mediaCaption = '', mediaPath = '', mediaMime = '', mediaType = ''
    for (const mt of mediaTypes) {
      const mediaObj = message?.[mt]
      if (mediaObj) {
        mediaCaption = mediaObj.caption || ''
        mediaPath = mediaObj.url || mediaObj.mediaPath || eventData.mediaPath || ''
        mediaMime = mediaObj.mimetype || eventData.mimeType || mt
        mediaType = eventData.type || mt
        break
      }
    }

    const messageText = body || message?.conversation || message?.extendedTextMessage?.text || mediaCaption || ''
    const hasMedia = !!mediaPath

    // Resolve workspace
    let sessionIdentifier = rootPayload.device_id || rootPayload.session || rootPayload.deviceId || rootPayload.jid
    if (sessionIdentifier && typeof sessionIdentifier === 'string') {
      sessionIdentifier = sessionIdentifier.replace(/:\d+@/, '@')
    }
    const workspaceId = await resolveWorkspace(supabase, rootPayload, sessionIdentifier)
    if (!workspaceId) {
      return new Response(JSON.stringify({ success: false, error: 'Workspace not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Atomic webhook processing via RPC (advisory lock prevents duplicate webhook race)
    const { data: result, error: rpcError } = await supabase.rpc('process_webhook_message', {
      p_workspace_id: workspaceId,
      p_customer_jid: normalizedFrom,
      p_customer_name: pushname,
      p_content: messageText,
      p_gowa_message_id: gowaMessageId || null,
      p_metadata: {},
      p_media_path: mediaPath || null,
      p_media_mime: mediaMime || null,
      p_media_type: mediaType || null,
      p_media_caption: mediaCaption || null,
    })

    if (rpcError) throw rpcError
    if (result.status === 'duplicate') {
      return new Response(JSON.stringify({ success: true, message: 'duplicate', reason: result.reason }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (result.status === 'error') {
      throw new Error(result.reason)
    }

    // Fire AI processing
    const sessionId = result.session_id
    EdgeRuntime.waitUntil((async () => {
      try {
        const aiClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
        const { error: aiError } = await aiClient.functions.invoke('agent-orchestrator', {
          body: {
            workspace_id: workspaceId,
            session_id: sessionId,
            customer_jid: normalizedFrom,
            message: messageText,
            message_type: hasMedia ? 'image' : 'text',
            gowa_message_id: gowaMessageId,
            channel: 'whatsapp',
            ...(hasMedia ? { media_metadata: { media_path: mediaPath, media_mime: mediaMime, media_type: mediaType } } : {}),
          },
          headers: { 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` }
        })
        if (aiError) console.error('[WEBHOOK] Orchestrator error:', aiError)
      } catch (e) {
        console.error('[WEBHOOK] Background AI failed:', e)
      }
    })())

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    console.error('[WEBHOOK] Error:', error)
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

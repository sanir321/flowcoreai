import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

declare var EdgeRuntime: { waitUntil: (promise: Promise<any>) => void }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Normalizes JID (LID to JID or just cleaning)
 * Based on GoWA Specification parity
 */
function normalizeJID(jid: string): string {
  if (!jid) return jid;
  // Remove device index if present (e.g., 918072432187:11@s.whatsapp.net -> 918072432187@s.whatsapp.net)
  let normalized = jid.replace(/:\d+@/, '@');
  // If it's a LID, it should be handled, but usually GoWA provides the s.whatsapp.net JID
  // We'll ensure it has the correct suffix
  if (!normalized.includes('@')) return `${normalized}@s.whatsapp.net`;
  return normalized;
}

/**
 * Verifies HMAC SHA256 Signature
 */
async function verifySignature(payload: string, signature: string | null, secret: string | undefined): Promise<boolean> {
  if (!secret) {
    console.warn(`[WEBHOOK] GOWA_WEBHOOK_SECRET not configured, skipping verification`);
    return true; 
  }
  if (!signature) {
    console.error(`[WEBHOOK] No signature header found`);
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigHex = signature.startsWith("sha256=") ? signature.slice(7) : signature;
    const sigBytes = new Uint8Array(sigHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));

    return await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      encoder.encode(payload)
    );
  } catch (err) {
    console.error(`[WEBHOOK] Signature verification error:`, err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-hub-signature-256');
  const secret = Deno.env.get('GOWA_WEBHOOK_SECRET');

  const isValid = await verifySignature(rawBody, signature, secret);
  if (!isValid) {
    console.error(`[WEBHOOK] Invalid signature`);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const rootPayload = JSON.parse(rawBody);
    console.log(`[WEBHOOK] Received payload:`, JSON.stringify(rootPayload, null, 2))

    // GoWA Webhook payload resolution logic (v8 uses device_id and payload, legacy uses session and data)
    const { event } = rootPayload
    const eventData = rootPayload.payload || rootPayload.data
    
    if (event !== 'message') {
        console.log(`[WEBHOOK] Event ${event} ignored`)
        return new Response(JSON.stringify({ success: true, message: 'event ignored' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (!eventData) {
        console.error(`[WEBHOOK] No data/payload field in root payload`)
        throw new Error('No data/payload field in root payload')
    }

    const { from, chat_id, message, body, from_name, pushName, id: gowaMessageId } = eventData
    const isGroup = eventData.isGroup || chat_id?.endsWith('@g.us') || from?.endsWith('@g.us')
    
    if (isGroup) {
        console.log(`[WEBHOOK] Group message ignored`)
        return new Response(JSON.stringify({ success: true, message: 'group message ignored' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const normalizedFrom = normalizeJID(from);
    // v8 uses 'body', legacy uses 'body' or nested 'message' object
    const messageText = body || message?.conversation || message?.extendedTextMessage?.text || ''
    const pushname = from_name || pushName || "Customer"
    
    if (!messageText) {
        console.log(`[WEBHOOK] No text content in message type: ${eventData.type || 'unknown'}`)
        return new Response(JSON.stringify({ success: true, message: 'no text content' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 1. Find Workspace by GoWA Session ID (Check both UUID and JID)
    // GoWA Specification: Device ID vs JID
    let sessionIdentifier = rootPayload.device_id || rootPayload.session || rootPayload.deviceId || rootPayload.jid;
    if (sessionIdentifier && typeof sessionIdentifier === 'string') {
        sessionIdentifier = sessionIdentifier.replace(/:\d+@/, '@');
    }

    console.log(`[WEBHOOK] Identifying workspace with session: ${sessionIdentifier}`)

    const { data: gowaSession, error: gowaError } = await supabase
      .from('gowa_sessions')
      .select('workspace_id, gowa_session_id')
      .or(`gowa_session_id.eq."${sessionIdentifier}",phone_jid.eq."${sessionIdentifier}"`)
      .maybeSingle()

    if (gowaError || !gowaSession) {
        console.error(`[WEBHOOK] Workspace not found for session identifier: ${sessionIdentifier}`)
        // Auto-sync: try to find device on GoWA and match by JID
        try {
            const gowaBase = (Deno.env.get('GOWA_BASE_URL') ?? '').replace(/\/$/, '');
            const gowaKey = Deno.env.get('GOWA_API_KEY');
            if (gowaBase && gowaKey && sessionIdentifier) {
                const auth = btoa(gowaKey);
                const devicesResp = await fetch(`${gowaBase}/devices`, {
                    headers: { 'Authorization': `Basic ${auth}` },
                    signal: AbortSignal.timeout(5000)
                });
                if (devicesResp.ok) {
                    const devicesData = await devicesResp.json();
                    const devices: any[] = devicesData.results || [];
                    const device = devices.find((d: any) =>
                        d.id === sessionIdentifier || d.jid === sessionIdentifier
                    );
                    if (device?.jid && device?.state === 'logged_in') {
                        const { data: existing } = await supabase
                            .from('gowa_sessions')
                            .select('workspace_id, id')
                            .eq('phone_jid', device.jid)
                            .maybeSingle();
                        if (existing) {
                            await supabase.from('gowa_sessions').update({
                                gowa_session_id: device.id,
                                phone_jid: device.jid,
                                display_name: device.display_name || null,
                                status: 'connected',
                                updated_at: new Date().toISOString()
                            }).eq('id', existing.id);
                            console.log(`[WEBHOOK] Auto-synced session ${existing.id} with device ${device.id}`);
                        }
                    }
                }
            }
        } catch (_) {
            console.error(`[WEBHOOK] Auto-sync failed`);
        }
        return new Response(JSON.stringify({ success: false, error: 'Workspace not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const workspaceId = gowaSession.workspace_id

    // 2. De-duplication check (SCOPED TO WORKSPACE)
    const { data: existingMsg } = await supabase
      .from('messages')
      .select('id')
      .eq('gowa_message_id', gowaMessageId)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (existingMsg) {
      console.log(`[WEBHOOK] Message ${gowaMessageId} already processed for workspace ${workspaceId}`)
      return new Response(JSON.stringify({ success: true, message: 'duplicate' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 3. Resolve or Create Contact
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .upsert({
        workspace_id: workspaceId,
        whatsapp_jid: normalizedFrom,
        name: pushname,
        phone: normalizedFrom.split('@')[0],
        channel: 'whatsapp'
      }, { onConflict: 'workspace_id, phone' })
      .select()
      .single()

    if (contactError) {
        console.error(`[WEBHOOK] Contact Upsert Error:`, contactError)
        throw contactError
    }

    // 4. Resolve or Create Active Session
    let { data: activeSession } = await supabase
      .from('conversation_sessions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('customer_jid', normalizedFrom)
      .eq('status', 'active')
      .maybeSingle()

    if (!activeSession) {
      const { data: newSession, error: createError } = await supabase
        .from('conversation_sessions')
        .insert({
          workspace_id: workspaceId,
          contact_id: contact.id,
          customer_jid: normalizedFrom,
          customer_name: pushname,
          channel: 'whatsapp',
          status: 'active'
        })
        .select()
        .single()
      
      if (createError) {
          console.error(`[WEBHOOK] Session Create Error:`, createError)
          throw createError
      }
      activeSession = newSession
    }


    // 5. Store Inbound Message
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        workspace_id: workspaceId,
        session_id: activeSession.id,
        content: messageText,
        direction: 'inbound',
        role: 'customer',
        gowa_message_id: gowaMessageId
      })

    if (msgError) {
        console.error(`[WEBHOOK] Message Insert Error:`, msgError)
        throw msgError
    }

    // 6. Update Session Metadata
    await supabase
      .from('conversation_sessions')
      .update({
        last_message_at: new Date().toISOString(),
        last_customer_message_at: new Date().toISOString(),
        last_message_preview: messageText.substring(0, 100),
        updated_at: new Date().toISOString()
      })
      .eq('id', activeSession.id)

    // 7. Fire and Forget AI processing using EdgeRuntime.waitUntil
    const processAI = async () => {
        try {
            console.log(`[WEBHOOK] Triggering AI for workspace ${workspaceId}`)
            const aiPayload = {
                workspace_id: workspaceId,
                session_id: activeSession.id,
                customer_jid: normalizedFrom,
                message: messageText,
                channel: 'whatsapp',
                agent_type: "customer_support"
            };
            
            // Initialize a dedicated client for the AI call with service role
            const aiClient = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            const { data: aiResponse, error: aiError } = await aiClient.functions.invoke("agent-orchestrator", {
                body: aiPayload,
                headers: {
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
                }
            })

            if (aiError) {
                console.error("[WEBHOOK] Agent Orchestrator Invoke Error:", aiError)
            } else {
                console.log(`[WEBHOOK] Agent Orchestrator triggered successfully`);
            }
        } catch (bgError) {
            console.error("[WEBHOOK] Background AI process failed:", bgError)
        }
    }

    EdgeRuntime.waitUntil(processAI())
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error(`[WEBHOOK] Error:`, error)
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


/**
 * /supabase/functions/agent-orchestrator/lib/tools.ts
 * Consolidated tool logic to avoid cross-function AUTH failures.
 */

import { generateEmbedding } from "./hf-embeddings.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')?.replace(/\/$/, "");
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function parseDT(dStr?: string, tStr?: string) {
  const now = new Date(); let d = new Date();
  if (dStr) {
    const ds = dStr.toLowerCase();
    if (ds.includes('tomorrow')) d.setDate(now.getDate() + 1);
    else if (ds.match(/^\d{4}-\d{2}-\d{2}$/)) d = new Date(dStr);
    else if (ds.includes('today')) d = now;
  }
  let h = 10, m = 0;
  if (tStr) {
    const match = tStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (match) { 
        h = parseInt(match[1]); 
        m = match[2] ? parseInt(match[2]) : 0; 
        const ampm = match[3]?.toLowerCase(); 
        if (ampm === 'pm' && h < 12) h += 12; 
        if (ampm === 'am' && h === 12) h = 0; 
    }
  }
  d.setHours(h, m, 0, 0); 
  return d.toISOString();
}

async function getGoogleConfig(supabase: any, workspace_id: string) {
  const { data: config } = await supabase.from("google_oauth_tokens").select("*").eq("workspace_id", workspace_id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!config) throw new Error("Google integration not found");
  const now = new Date();
  const expiry = new Date(config.token_expiry);
  if (expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        refresh_token: config.refresh_token,
        grant_type: "refresh_token",
      }),
    });
    const newTokens = await response.json();
    if (!response.ok) throw new Error("Failed to refresh Google token");
    const newExpiry = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();
    await supabase.from("google_oauth_tokens").update({ access_token: newTokens.access_token, token_expiry: newExpiry }).eq("workspace_id", workspace_id);
    return { ...config, access_token: newTokens.access_token };
  }
  return config;
}

function formatPhoneForGoWA(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    cleaned = '91' + cleaned;
  }
  cleaned = cleaned.replace('@s.whatsapp.net', '');
  return cleaned;
}

async function sendAppointmentNotifications(supabase: any, workspace_id: string, session_id: string, appt: any, meetLink: string | null) {
  sendAppointmentWhatsApp(supabase, workspace_id, session_id, appt, meetLink);
  sendAppointmentEmail(supabase, workspace_id, session_id, appt, meetLink);
}

async function sendAppointmentWhatsApp(supabase: any, workspace_id: string, session_id: string, appt: any, meetLink: string | null) {
  try {
    // 1. Fetch all required data in a single joined query
    const { data: sessionData, error } = await supabase
      .from('conversation_sessions')
      .select(`
        customer_jid,
        contact:contacts(phone),
        gowa_session:gowa_sessions!workspace_id(gowa_session_id)
      `)
      .eq('id', session_id)
      .eq('workspace_id', workspace_id)
      .single();

    if (error || !sessionData) throw new Error("Could not fetch notification data");

    const deviceId = sessionData.gowa_session?.gowa_session_id;
    if (!deviceId) return;

    let phone = appt.customer_phone || sessionData.customer_jid?.split('@')[0] || sessionData.contact?.phone;
    if (!phone) return;

    const gowaBase = Deno.env.get('GOWA_BASE_URL')?.replace(/\/$/, "");
    const gowaKey = Deno.env.get('GOWA_API_KEY');
    if (!gowaBase || !gowaKey) return;

    const auth = btoa(gowaKey);
    const formattedPhone = formatPhoneForGoWA(phone);
    const formattedDate = new Date(appt.start_at).toLocaleString();

    let message = `✅ Appointment Confirmed!\n\nHi ${appt.customer_name},\n\nYour appointment has been confirmed:\n• Service: ${appt.service}\n• Date: ${formattedDate}`;
    if (meetLink) message += `\n• Google Meet: ${meetLink}`;
    message += `\n\n— FlowCore AI`;

    const resp = await fetch(`${gowaBase}/send/message`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
      body: JSON.stringify({ phone: formattedPhone, message }),
    });
    if (!resp.ok) console.error(`[TOOLS] WhatsApp notification failed: ${resp.status}`);
  } catch (e: any) {
    console.error(`[TOOLS] WhatsApp notification error: ${e.message}`);
  }
}

async function sendAppointmentEmail(supabase: any, workspace_id: string, session_id: string, appt: any, meetLink: string | null) {
  try {
    // 1. Fetch all required data in a single joined query
    const { data: workspaceData, error } = await supabase
      .from('workspaces')
      .select(`
        name,
        session:conversation_sessions!id(
          contact:contacts(email)
        )
      `)
      .eq('id', workspace_id)
      .eq('session.id', session_id)
      .single();

    if (error || !workspaceData) throw new Error("Could not fetch email data");

    const email = appt.customer_email || workspaceData.session?.[0]?.contact?.email;
    if (!email) return;

    const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://flowter-bay.vercel.app';
    const workspaceName = workspaceData.name || 'FlowCore';
    const formattedDate = new Date(appt.start_at).toLocaleString();

    await fetch(`${appUrl}/api/emails/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: `Appointment Confirmed — ${workspaceName}`,
        template: 'appointment',
        data: {
          customerName: appt.customer_name,
          workspaceName,
          service: appt.service,
          date: formattedDate,
          meetLink,
        }
      }),
    });
  } catch (e: any) {
    console.error(`[TOOLS] Email notification error: ${e.message}`);
  }
}

export async function executeTool(input: any): Promise<any> {
  const { tool_name, args = {}, workspace_id, session_id, supabase } = input;
  console.log(`[TOOLS] Executing ${tool_name}.`);
  
  try {
    switch (tool_name) {
      case 'match_kb_chunks': {
        let embedding: number[];
        try {
          embedding = await generateEmbedding(args.query);
        } catch {
          return { kb_chunks: [] };
        }
        const { data: kb, error } = await supabase.rpc('match_kb_chunks', { 
            query_embedding: embedding, 
            match_threshold: 0.75, 
            match_count: 5, 
            p_workspace_id: workspace_id 
        });
        if (error) throw error;
        return { kb_chunks: kb || [] };
      }

      case 'check_availability': {
        const startAt = parseDT(args.date, args.time);
        const gConfig = await getGoogleConfig(supabase, workspace_id);
        
        const gRes = await fetch(`https://www.googleapis.com/calendar/v3/freeBusy`, {
          method: "POST",
          headers: { Authorization: `Bearer ${gConfig.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            timeMin: startAt,
            timeMax: new Date(new Date(startAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            items: [{ id: gConfig.calendar_id || 'primary' }]
          }),
        });
        const data = await gRes.json();
        return { availability: data.calendars[gConfig.calendar_id || 'primary']?.busy || [], requested_time: startAt };
      }

      case 'create_appointment': {
        const startAt = parseDT(args.date, args.time);
        const durationMs = (args.duration || 30) * 60000;
        const endAt = new Date(new Date(startAt).getTime() + durationMs).toISOString();
        const gConfig = await getGoogleConfig(supabase, workspace_id);

        const gRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${gConfig.calendar_id || 'primary'}/events?conferenceDataVersion=1`, {
          method: "POST",
          headers: { Authorization: `Bearer ${gConfig.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: `FlowCore: ${args.name}`,
            description: `Service: ${args.service}. Session: ${session_id}`,
            start: { dateTime: startAt },
            end: { dateTime: endAt },
            conferenceData: { createRequest: { requestId: `fc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}` } },
          }),
        });
        if (!gRes.ok) throw new Error("Google Calendar Sync Failed");
        const gEvent = await gRes.json();
        const meetLink = gEvent.hangoutLink || gEvent.conferenceData?.entryPoints?.[0]?.uri || null;

        const { data: curSession } = await supabase.from('conversation_sessions').select('contact_id').eq('id', session_id).single();

        const { data: appt } = await supabase.from('appointments').insert({ 
            workspace_id, 
            session_id, 
            contact_id: curSession?.contact_id || null,
            customer_name: args.name, 
            customer_phone: args.phone || null, 
            customer_email: args.email || null, 
            service: args.service, 
            start_at: startAt, 
            end_at: endAt, 
            status: 'confirmed', 
            google_event_id: gEvent.id,
            meeting_link: meetLink
        }).select().single();

        // Update contact with email if provided
        if (args.email && curSession?.contact_id) {
          await supabase.from('contacts').update({ email: args.email, updated_at: new Date().toISOString() }).eq('id', curSession.contact_id);
        }

        // Fire-and-forget notifications
        sendAppointmentNotifications(supabase, workspace_id, session_id, appt, meetLink);

        return appt;
      }

      case 'capture_lead': {
        const { data: contact } = await supabase.from('contacts').upsert({ 
            workspace_id, 
            name: args.name, 
            phone: args.phone, 
            email: args.email,
            notes: args.notes
        }).select().single();

        // Auto-push to Google Sheets if configured
        try {
          const gConfig = await getGoogleConfig(supabase, workspace_id);
          if (gConfig?.sheet_id) {
            const sheetRange = gConfig.sheet_range ?? 'Sheet1!A:Z';
            const row = [args.name ?? '', args.email ?? '', args.phone ?? '', '', '', new Date().toISOString(), new Date().toISOString()];
            await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${gConfig.sheet_id}/values/${sheetRange}:append?valueInputOption=USER_ENTERED`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${gConfig.access_token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ values: [row] }),
            });
          }
        } catch (_) {
          // Sheets auto-export is optional; don't fail the lead capture
        }

        return { success: true, contact_id: contact?.id };
      }

      case 'escalation_request': {
        await supabase.from('conversation_sessions')
          .update({ status: 'escalated' })
          .eq('id', session_id);
        return { status: 'escalated' };
      }

      case 'request_handoff': {
        return {
          handoff_to: args.target_agent,
          handoff_reason: args.reason || '',
          handoff_context: args.context || ''
        };
      }

      case 'update_appointment': {
        let { data: existing } = await supabase.from('appointments').select('*').eq('id', args.appointment_id).maybeSingle();
        if (!existing) {
          const { data: all } = await supabase.from('appointments').select('*').eq('workspace_id', workspace_id).gte('start_at', new Date(Date.now() - 7 * 86400000).toISOString()).order('created_at', { ascending: false });
          const match = (all || []).find((a: any) => a.id.toLowerCase().startsWith(args.appointment_id.toLowerCase()));
          if (!match) throw new Error("Appointment not found. Please use the full appointment ID shown in your booking confirmation.");
          existing = match;
          args.appointment_id = match.id;
        }
        if (!existing.google_event_id) throw new Error("No Google Calendar event to update");

        const startAt = args.date || args.time ? parseDT(args.date, args.time) : existing.start_at;
        const durationMs = (args.duration || 30) * 60000;
        const endAt = new Date(new Date(startAt).getTime() + durationMs).toISOString();
        const gConfig = await getGoogleConfig(supabase, workspace_id);

        const gRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${gConfig.calendar_id || 'primary'}/events/${existing.google_event_id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${gConfig.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            start: { dateTime: startAt },
            end: { dateTime: endAt },
          }),
        });
        if (!gRes.ok) throw new Error("Google Calendar Update Failed");

        const { data: updated } = await supabase.from('appointments').update({
            customer_name: args.name || existing.customer_name,
            customer_phone: args.phone || existing.customer_phone,
            service: args.service || existing.service,
            start_at: startAt,
            end_at: endAt,
            updated_at: new Date().toISOString()
        }).eq('id', args.appointment_id).select().single();
        return updated;
      }

      case 'cancel_appointment': {
        let { data: appt } = await supabase.from('appointments').select('*').eq('id', args.appointment_id).maybeSingle();
        if (!appt) {
          const { data: all } = await supabase.from('appointments').select('*').eq('workspace_id', workspace_id).gte('start_at', new Date(Date.now() - 7 * 86400000).toISOString()).order('created_at', { ascending: false });
          const match = (all || []).find((a: any) => a.id.toLowerCase().startsWith(args.appointment_id.toLowerCase()));
          if (!match) throw new Error("Appointment not found. Please use the full appointment ID shown in your booking confirmation.");
          appt = match;
        }

        if (appt.google_event_id) {
          const gConfig = await getGoogleConfig(supabase, workspace_id);
          await fetch(`https://www.googleapis.com/calendar/v3/calendars/${gConfig.calendar_id || 'primary'}/events/${appt.google_event_id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${gConfig.access_token}` }
          }).catch(() => {});
        }

        await supabase.from('appointments').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', args.appointment_id);
        return { success: true };
      }

      case 'get_contact_history': {
        const { data: session } = await supabase.from('conversation_sessions').select('contact_id').eq('id', session_id).single();
        if (!session?.contact_id) throw new Error("Contact not found");
        const { data: contact } = await supabase.from('contacts').select('*').eq('id', session.contact_id).single();
        const { data: appointments } = await supabase.from('appointments').select('*').or(`contact_id.eq.${session.contact_id},session_id.eq.${session_id}`).order('created_at', { ascending: false });
        return { ...contact, appointments: appointments || [] };
      }

      case 'update_contact': {
        const { data: session } = await supabase.from('conversation_sessions').select('contact_id').eq('id', session_id).single();
        if (!session?.contact_id) throw new Error("Contact not found");
        const { data: updated } = await supabase.from('contacts').update({
            name: args.name,
            email: args.email,
            phone: args.phone,
            notes: args.notes ? `[Update] ${args.notes}` : undefined,
            updated_at: new Date().toISOString()
        }).eq('id', session.contact_id).select().single();
        return updated;
      }

      case 'update_lead_stage': {
        const { data: session } = await supabase.from('conversation_sessions').select('contact_id').eq('id', session_id).single();
        if (!session?.contact_id) throw new Error("Contact not found");
        await supabase.from('contacts').update({
            pipeline_stage: args.stage,
            notes: args.notes ? `[Stage: ${args.stage}] ${args.notes}` : undefined,
            updated_at: new Date().toISOString()
        }).eq('id', session.contact_id);
        return { success: true, stage: args.stage, message: `Lead moved to ${args.stage}` };
      }

      case 'get_pipeline': {
        const stages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
        const { data: contacts } = await supabase.from('contacts')
            .select('pipeline_stage, count:id')
            .eq('workspace_id', workspace_id)
            .not('pipeline_stage', 'is', null)
            .in('pipeline_stage', stages);
        const counts: Record<string, number> = {};
        for (const s of stages) counts[s] = 0;
        for (const c of contacts || []) {
            if (c.pipeline_stage) counts[c.pipeline_stage] = (counts[c.pipeline_stage] || 0) + 1;
        }
        return { success: true, pipeline: counts };
      }

      case 'schedule_follow_up': {
        const { data: session } = await supabase.from('conversation_sessions').select('contact_id').eq('id', session_id).single();
        const scheduledAt = new Date(Date.now() + (args.hours || 24) * 3600000).toISOString();
        const { data: followUp } = await supabase.from('follow_ups').insert({
            workspace_id,
            contact_id: session?.contact_id || null,
            session_id,
            scheduled_at: scheduledAt,
            message_template: args.message || "Hi! Just following up on our conversation. Let me know if you need any help!",
            status: 'pending'
        }).select().single();
        return { success: true, follow_up_id: followUp?.id, scheduled_at: scheduledAt, message: `Follow-up scheduled for ${new Date(scheduledAt).toLocaleString()}` };
      }

      case 'generate_quote': {
        const { data: session } = await supabase.from('conversation_sessions').select('contact_id, customer_name, customer_jid').eq('id', session_id).single();
        if (!session) throw new Error("Session not found");
        const subtotal = (args.items || []).reduce((sum: number, item: any) => sum + (item.qty || 1) * (item.price || 0), 0);
        const tax = Math.round(subtotal * 0.18 * 100) / 100;
        const total = subtotal + tax;
        const quoteNumber = `Q-${Date.now().toString(36).toUpperCase()}`;
        const { data: quote } = await supabase.from('quotes').insert({
            workspace_id,
            contact_id: session.contact_id || null,
            quote_number: quoteNumber,
            items: args.items,
            subtotal,
            tax,
            total,
            status: 'draft',
            notes: args.notes || null,
            valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
        }).select().single();

        const quoteText = `*Quote ${quoteNumber}*\n\n${(args.items || []).map((i: any) => `${i.name} × ${i.qty || 1} = ₹${((i.qty || 1) * i.price).toLocaleString()}`).join('\n')}\n\nSubtotal: ₹${subtotal.toLocaleString()}\nTax (18%): ₹${tax.toLocaleString()}\n*Total: ₹${total.toLocaleString()}*\n\nValid until: ${new Date(Date.now() + 30 * 86400000).toLocaleDateString()}`;

        return { success: true, quote_id: quote?.id, quote_number: quoteNumber, total, quote_text: quoteText };
      }

      case 'search_menu': {
        const generic = ['menu', 'services', 'list', 'all', 'everything', 'show', 'available', ''];
        const isGeneric = !args.query || generic.includes(args.query?.toString().toLowerCase().trim());
        let query = supabase.from('menu_items').select('id, name, description, price, category').eq('workspace_id', workspace_id).eq('is_available', true);

        if (!isGeneric && args.query) {
          query = query.or(`name.ilike.%${args.query}%,category.ilike.%${args.query}%,description.ilike.%${args.query}%`);
        }
        if (args.category) query = query.eq('category', args.category);
        const { data: items } = await query.order('name').limit(20);
        return { success: true, items: items || [] };
      }

      case 'create_order': {
        const { data: session } = await supabase.from('conversation_sessions').select('contact_id').eq('id', session_id).single();
        const { data: workspace } = await supabase.from('workspaces').select('upi_id').eq('id', workspace_id).single();
        const items = args.items || [];
        const subtotal = items.reduce((sum: number, i: any) => sum + (i.qty || 1) * (i.price || 0), 0);
        const tax = Math.round(subtotal * 0.18 * 100) / 100;
        const total = subtotal + tax;
        const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
        const upiId = workspace?.upi_id || 'flowcoreai@upi';
        const upiLink = `upi://pay?pa=${upiId}&am=${total}&tn=Order%20${orderNumber}&cu=INR`;
        const { data: order } = await supabase.from('orders').insert({
            workspace_id,
            contact_id: session?.contact_id || null,
            session_id,
            order_number: orderNumber,
            items, subtotal, tax, total,
            status: 'pending', upi_link: upiLink,
            notes: args.notes || null
        }).select().single();
        const orderText = `*Order ${orderNumber}*\n\n${items.map((i: any) => `${i.name} × ${i.qty || 1} = ₹${((i.qty || 1) * i.price).toLocaleString()}`).join('\n')}\n\nSubtotal: ₹${subtotal.toLocaleString()}\nTax (18%): ₹${tax.toLocaleString()}\n*Total: ₹${total.toLocaleString()}*\n\n*Pay via UPI:* ${upiLink}\n\nReply with your payment confirmation or ask for help.`;
        return { success: true, order_id: order?.id, order_number: orderNumber, total, upi_link: upiLink, order_text: orderText };
      }

      case 'confirm_payment': {
        const { data: order } = await supabase.from('orders').update({
            status: 'paid',
            payment_method: args.payment_method || 'upi',
            updated_at: new Date().toISOString()
        }).eq('id', args.order_id).eq('workspace_id', workspace_id).select().single();
        if (!order) throw new Error("Order not found");
        return { success: true, order_id: order.id, order_number: order.order_number, status: 'paid', message: `Payment confirmed for ${order.order_number}` };
      }

      case 'get_order_status': {
        const { data: order } = await supabase.from('orders').select('*').eq('id', args.order_id).eq('workspace_id', workspace_id).single();
        if (!order) throw new Error("Order not found");
        return { success: true, order_number: order.order_number, status: order.status, total: order.total, items: order.items, upi_link: order.upi_link, created_at: order.created_at };
      }

      default: return { success: true };
    }
  } catch (e: any) {
    console.error(`[TOOLS] ERROR: ${e.message}`);
    throw e;
  }
}

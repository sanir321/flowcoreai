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
  const { data: config } = await supabase.from("google_oauth_tokens").select("*").eq("workspace_id", workspace_id).single();
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

export async function executeTool(input: any): Promise<any> {
  const { tool_name, args = {}, workspace_id, session_id, supabase } = input;
  console.log(`[TOOLS] Executing ${tool_name}.`);
  
  try {
    switch (tool_name) {
      case 'match_kb_chunks': {
        const embedding = await generateEmbedding(args.query);
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

        const gRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${gConfig.calendar_id || 'primary'}/events`, {
          method: "POST",
          headers: { Authorization: `Bearer ${gConfig.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: `FlowCore: ${args.name}`,
            description: `Service: ${args.service}. Session: ${session_id}`,
            start: { dateTime: startAt },
            end: { dateTime: endAt },
          }),
        });
        if (!gRes.ok) throw new Error("Google Calendar Sync Failed");
        const gEvent = await gRes.json();
        const { data: appt } = await supabase.from('appointments').insert({ 
            workspace_id, 
            session_id, 
            customer_name: args.name, 
            customer_phone: args.phone || null, 
            service: args.service, 
            start_at: startAt, 
            end_at: endAt, 
            status: 'confirmed', 
            google_event_id: gEvent.id 
        }).select().single();
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
        const { data: existing } = await supabase.from('appointments').select('*').eq('id', args.appointment_id).single();
        if (!existing) throw new Error("Appointment not found");
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
        const { data: appt } = await supabase.from('appointments').select('*').eq('id', args.appointment_id).single();
        if (!appt) throw new Error("Appointment not found");

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
        const { data: contact } = await supabase.from('contacts').select('*, appointments(*)').eq('id', session.contact_id).single();
        return contact;
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

      default: return { success: true };
    }
  } catch (e: any) {
    console.error(`[TOOLS] ERROR: ${e.message}`);
    throw e;
  }
}

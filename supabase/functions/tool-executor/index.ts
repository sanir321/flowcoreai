import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getGoogleConfig(supabase: any, workspace_id: string) {
  const { data: config } = await supabase
    .from("google_oauth_tokens")
    .select("access_token, refresh_token, token_expiry, calendar_id, sheet_id, sheet_range")
    .eq("workspace_id", workspace_id)
    .single();

  if (!config) throw new Error("Google integration not found");

  const now = new Date();
  const expiry = new Date(config.token_expiry);

  if (expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log("[GOOGLE] Refreshing access token...");
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
    if (!response.ok) {
      throw new Error(`Failed to refresh Google token: ${newTokens.error_description || newTokens.error}`);
    }

    const newExpiry = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

    await supabase
      .from("google_oauth_tokens")
      .update({
        access_token: newTokens.access_token,
        token_expiry: newExpiry,
      })
      .eq("workspace_id", workspace_id);

    return { ...config, access_token: newTokens.access_token };
  }

  return config;
}

async function notifyOwner(supabase: any, workspace_id: string, session_id: string, reason: string) {
  const logs: string[] = [];
  try {
    const { data: workspace } = await supabase.from('workspaces').select('name, owner_personal_phone, owner_id').eq('id', workspace_id).single();
    if (!workspace) return { success: false, error: "Workspace not found", logs };
    
    const { data: session } = await supabase.from('conversation_sessions').select('customer_name').eq('id', session_id).single();
    const customerName = session?.customer_name || 'A customer';

    const { data: userData } = await supabase.auth.admin.getUserById(workspace.owner_id);
    const email = userData?.user?.email;

    const smtpUser = Deno.env.get('SMTP_USER') || "zenosayz05@gmail.com";
    const smtpPass = Deno.env.get('SMTP_PASSWORD');
    
    if (email && smtpPass) {
      logs.push(`[SMTP] Initializing Nodemailer for ${email}`);
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      try {
        logs.push(`[SMTP] Attempting to send...`);
        const info = await transporter.sendMail({
          from: `"FlowCore Alerts" <${smtpUser}>`,
          to: email,
          subject: `🚨 Action Required: Escalation in ${workspace.name}`,
          text: `Customer: ${customerName}\nReason: ${reason}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; max-width: 465px; margin: auto;">
              <h2 style="color: #c65f39;">Escalation Alert</h2>
              <p>An active session in <strong>${workspace.name}</strong> has been escalated and requires your attention.</p>
              <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #eeeeee;">
                <p style="margin: 0;"><strong>Customer:</strong> ${customerName}</p>
                <p style="margin: 8px 0 0 0;"><strong>Reason:</strong> ${reason}</p>
              </div>
              <p style="font-size: 12px; color: #666;">Sent via FlowCore Notification Service (Supabase Cloud)</p>
            </div>
          `,
        });
        logs.push(`[SMTP] Success! Message ID: ${info.messageId}`);
      } catch (smtpErr: any) {
        logs.push(`[SMTP] ERROR: ${smtpErr.message}`);
        console.error(smtpErr);
      }
    }

    if (workspace.owner_personal_phone) {
      const { data: gowaSession } = await supabase.from('gowa_sessions').select('gowa_session_id').eq('workspace_id', workspace_id).maybeSingle();
      if (gowaSession?.gowa_session_id) {
         const gowaBase = Deno.env.get('GOWA_BASE_URL')?.replace(/\/$/, "");
         const gowaKey = Deno.env.get('GOWA_API_KEY');
         const auth = btoa(gowaKey || '');
         const message = `🚨 *FlowCore Escalation Alert*\n\nWorkspace: ${workspace.name}\nCustomer: ${customerName}\nReason: ${reason}`;
         
         await fetch(`${gowaBase}/send/message`, {
           method: "POST",
           headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'X-Device-Id': gowaSession.gowa_session_id },
           body: JSON.stringify({ phone: workspace.owner_personal_phone.replace('+', ''), message })
         }).then(() => logs.push(`[WA] Alert sent to ${workspace.owner_personal_phone}`))
           .catch(err => logs.push(`[WA] ERROR: ${err.message}`));
      }
    }
  } catch (error: any) {
    logs.push(`[FATAL] ${error.message}`);
  }
  return { success: true, logs };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { tool_name, args, workspace_id, session_id } = await req.json()
    console.log(`[TOOL] Executing ${tool_name}`);
    
    // Concurrent fetch: session/agent config + google config (if needed)
    const needsGoogle = ['check_availability', 'create_appointment', 'update_appointment', 'cancel_appointment', 'capture_lead'].includes(tool_name);
    
    const [metaRes, gConfig] = await Promise.all([
      supabase.from("conversation_sessions").select("active_agent, agent_type").eq("id", session_id).single(),
      needsGoogle ? getGoogleConfig(supabase, workspace_id) : Promise.resolve(null)
    ]);

    const { data: session } = metaRes;
    const { data: agent } = await supabase.from("workspace_agents").select("config").eq("workspace_id", workspace_id).eq("agent_type", session?.active_agent || session?.agent_type || 'customer_support').single();
    const config = agent?.config || {};

    let result: any = null
    let notification_result: any = null

    switch (tool_name) {
      case 'escalation_request': {
        const { data: escalation, error: eError } = await supabase.from('escalation_logs').insert({
          workspace_id, session_id,
          trigger_type: args.trigger_type || 'customer_request',
          status: 'open',
          conversation_snapshot: args.snapshot || {}
        }).select().single();
        
        if (eError) throw eError;

        await supabase.from('conversation_sessions').update({ status: 'escalated' }).eq('id', session_id);

        notification_result = await notifyOwner(supabase, workspace_id, session_id, args.reason || 'User requested to speak to a manager');

        result = escalation;
        break;
      }
      // ... (other cases remain same)

      case 'check_availability': {
        const timeMin = args.timeMin || new Date().toISOString();
        const timeMax = args.timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const gRes = await fetch(`https://www.googleapis.com/calendar/v3/freeBusy`, {
          method: "POST",
          headers: { Authorization: `Bearer ${gConfig.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            timeMin,
            timeMax,
            items: [{ id: gConfig.calendar_id || 'primary' }]
          }),
        });

        if (!gRes.ok) throw new Error(`Google Calendar FreeBusy Error: ${await gRes.text()}`);
        const data = await gRes.json();
        result = data.calendars[gConfig.calendar_id || 'primary'].busy;
        break;
      }

      case 'create_appointment': {
        const gRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${gConfig.calendar_id || 'primary'}/events`, {
          method: "POST",
          headers: { Authorization: `Bearer ${gConfig.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: `FlowCore Appointment: ${args.customer_name}`,
            description: `Service: ${args.service}. Contact: ${args.customer_phone || 'N/A'}\nSession: ${session_id}`,
            start: { dateTime: args.start_at },
            end: { dateTime: args.end_at },
          }),
        });

        if (!gRes.ok) throw new Error(`Google Calendar Create Error: ${await gRes.text()}`);
        const gEvent = await gRes.json();

        const { data: appt, error: apptError } = await supabase
          .from('appointments')
          .insert({
            workspace_id,
            session_id,
            customer_name: args.customer_name,
            customer_phone: args.customer_phone,
            service: args.service,
            start_at: args.start_at,
            end_at: args.end_at,
            status: 'confirmed',
            google_event_id: gEvent.id
          })
          .select().single();
        
        if (apptError) throw apptError;
        result = appt;
        break;
      }

      case 'update_appointment': {
        const { data: appt } = await supabase.from('appointments').select('*').eq('id', args.appointment_id).single();
        if (!appt?.google_event_id) throw new Error("Appointment or Google Event ID not found");

        const gRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${gConfig.calendar_id || 'primary'}/events/${appt.google_event_id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${gConfig.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            start: args.start_at ? { dateTime: args.start_at } : undefined,
            end: args.end_at ? { dateTime: args.end_at } : undefined,
          }),
        });

        if (!gRes.ok) throw new Error(`Google Calendar Update Error: ${await gRes.text()}`);

        const { data: updated, error: uError } = await supabase
          .from('appointments')
          .update({
            start_at: args.start_at || appt.start_at,
            end_at: args.end_at || appt.end_at,
            updated_at: new Date().toISOString()
          })
          .eq('id', args.appointment_id)
          .select().single();

        if (uError) throw uError;
        result = updated;
        break;
      }

      case 'cancel_appointment': {
        const { data: appt } = await supabase.from('appointments').select('*').eq('id', args.appointment_id).single();
        if (!appt?.google_event_id) throw new Error("Appointment not found");

        const gRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${gConfig.calendar_id || 'primary'}/events/${appt.google_event_id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${gConfig.access_token}` }
        });

        if (!gRes.ok && gRes.status !== 410) throw new Error(`Google Calendar Delete Error: ${await gRes.text()}`);

        await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', args.appointment_id);
        result = { success: true };
        break;
      }

      case 'get_contact_history': {
        const { data: session } = await supabase.from('conversation_sessions').select('contact_id').eq('id', session_id).single();
        if (!session?.contact_id) throw new Error("Contact ID not found for this session");

        const { data: contact } = await supabase.from('contacts').select('*, appointments(*)').eq('id', session.contact_id).single();
        result = contact;
        break;
      }

      case 'update_contact': {
        const { data: session } = await supabase.from('conversation_sessions').select('contact_id').eq('id', session_id).single();
        if (!session?.contact_id) throw new Error("Contact ID not found");

        const { data: updated, error: cError } = await supabase
          .from('contacts')
          .update({
            name: args.name,
            email: args.email,
            phone: args.phone,
            notes: args.notes ? `[Update] ${args.notes}` : undefined,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.contact_id)
          .select().single();

        if (cError) throw cError;
        result = updated;
        break;
      }

      case 'capture_lead': {
        if (gConfig?.sheet_id) {
           const sheetRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${gConfig.sheet_id}/values/${gConfig.sheet_range || 'Sheet1!A:E'}:append?valueInputOption=USER_ENTERED`, {
             method: "POST",
             headers: { Authorization: `Bearer ${gConfig.access_token}`, "Content-Type": "application/json" },
             body: JSON.stringify({ values: [[
                new Date().toISOString(), 
                args.name || 'Unknown', 
                args.email || 'N/A', 
                args.phone || 'N/A', 
                args.notes || 'Lead captured via AI'
             ]] }),
           });

           if (!sheetRes.ok) throw new Error(`Google Sheets API Error: ${await sheetRes.text()}`);
        }

        const { data: session } = await supabase.from('conversation_sessions').select('contact_id').eq('id', session_id).single();

        if (session?.contact_id) {
          await supabase.from('contacts').update({ 
                name: args.name, 
                email: args.email, 
                phone: args.phone,
                notes: args.notes ? `[AI Lead Capture] ${args.notes}` : undefined
            }).eq('id', session.contact_id);
        }
        
        result = { success: true };
        break;
      }

      default:
        throw new Error(`Unknown tool: ${tool_name}`);
    }

    return new Response(JSON.stringify({ success: true, result, notifications: notification_result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error("Tool Executor Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})

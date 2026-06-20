import { PipelineContext } from "../../lib/types.ts";
import { getGoogleConfig } from "./google.ts";

const IST_OFFSET = 5.5 * 60 * 60 * 1000;

function parseDT(dStr?: string, tStr?: string) {
  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };
  const istNow = new Date(Date.now() + IST_OFFSET);
  let y = istNow.getUTCFullYear();
  let mo = istNow.getUTCMonth();
  let d = istNow.getUTCDate();
  if (dStr) {
    const s = dStr.toLowerCase().trim();
    if (s.includes("tomorrow") || s === "tom") {
      const t = new Date(istNow.getTime() + 86400000);
      y = t.getUTCFullYear(); mo = t.getUTCMonth(); d = t.getUTCDate();
    } else if (s.includes("today")) {
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const p = s.split("-").map(Number);
      y = p[0]; mo = p[1] - 1; d = p[2];
    } else {
      const dm = s.match(/(\d{1,2})(?:st|nd|rd|th)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
      const md = s.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*(\d{1,2})(?:st|nd|rd|th)?/i);
      if (dm) { d = parseInt(dm[1]); mo = months[dm[2].toLowerCase().slice(0, 3)]; }
      else if (md) { mo = months[md[1].toLowerCase().slice(0, 3)]; d = parseInt(md[2]); }
    }
  }
  let h = 10, mi = 0;
  if (tStr) {
    const ts = tStr.toLowerCase().trim();
    if (ts.includes("afternoon") || ts.includes("noon")) { h = 14; mi = 0; }
    else if (ts.includes("evening")) { h = 18; mi = 0; }
    else if (ts.includes("morning")) { h = 9; mi = 0; }
    else if (ts.includes("night")) { h = 20; mi = 0; }
    else {
      const mt = ts.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      if (mt) {
        h = parseInt(mt[1]); mi = mt[2] ? parseInt(mt[2]) : 0;
        const a = mt[3]?.toLowerCase();
        if (a === "pm" && h < 12) h += 12;
        if (a === "am" && h === 12) h = 0;
      }
    }
  }
  return new Date(Date.UTC(y, mo, d, h, mi) - IST_OFFSET).toISOString();
}

export function formatIST(isoString: string): string {
  const d = new Date(isoString);
  const ist = new Date(d.getTime() + IST_OFFSET);
  const datePart = ist.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const timePart = ist.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
  return `${datePart} at ${timePart} IST`;
}

function getDayName(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }).toLowerCase();
}

function validateBusinessHours(dateStr: string, ctx: PipelineContext): string | null {
  const hoursEnabled = (ctx.workspace as any)?.hours_enabled
  if (hoursEnabled === false) return null
  const hours = (ctx.workspace as any)?.business_profile?.hours?.daily
  if (!hours) return null;
  const dayName = getDayName(dateStr);
  const daySchedule = hours[dayName];
  if (!daySchedule) return null;
  if (daySchedule.closed) return "We're closed on that day. Please choose a different day.";
  if (daySchedule.open && daySchedule.close) {
    const d = new Date(dateStr);
    const istTime = new Date(d.getTime() + IST_OFFSET);
    const timeStr = `${String(istTime.getUTCHours()).padStart(2, "0")}:${String(istTime.getUTCMinutes()).padStart(2, "0")}`;
    if (timeStr < daySchedule.open || timeStr >= daySchedule.close) {
      return `We're closed at that time. Our hours on ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} are ${daySchedule.open}-${daySchedule.close}.`;
    }
  }
  return null;
}

export async function checkAvailability(
  params: { date: string; time?: string },
  ctx: PipelineContext
) {
  const startAt = parseDT(params.date, params.time);
  const hoursError = validateBusinessHours(startAt, ctx);
  if (hoursError) return { error: hoursError, requested_time: startAt };
  try {
    const gConfig = await getGoogleConfig(ctx.supabase, ctx.payload.workspace_id);
    const gRes = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: { Authorization: `Bearer ${gConfig.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        timeMin: startAt,
        timeMax: new Date(new Date(startAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        items: [{ id: gConfig.calendar_id || "primary" }]
      })
    });
    if (gRes.ok) {
      const data = await gRes.json();
      return { availability: data.calendars[gConfig.calendar_id || "primary"]?.busy || [], requested_time: startAt };
    }
  } catch (_) {}
  return { availability: [], requested_time: startAt, note: "Calendar unavailable — assuming slot is free" };
}

export async function createAppointment(
  params: { name?: string; phone?: string; email?: string; service?: string; date?: string; time?: string },
  ctx: PipelineContext
) {
  const rawName = params.name?.toString().trim();
  const PLACEHOLDER_NAMES = ["your name", "name", "customer", "guest", "null", "none", "n/a", "unknown"];
  if (!rawName || rawName.length < 2 || PLACEHOLDER_NAMES.includes(rawName.toLowerCase())) {
    return { error: "I need your full name to book the appointment. Please tell me your name." };
  }
  const customerName = rawName;
  if (!params.service?.toString().trim()) {
    return { error: "Service is required. Ask the customer what service they'd like to book." };
  }

  const { data: existingAppt } = await ctx.supabase.from("appointments")
    .select("id, start_at, service")
    .eq("session_id", ctx.session.id)
    .not("status", "eq", "cancelled")
    .maybeSingle();
  if (existingAppt) {
    return { id: existingAppt.id, start_at: existingAppt.start_at, service: existingAppt.service, customer_name: customerName, note: "Already booked for this session.", already_booked: true };
  }

  const startAt = parseDT(params.date, params.time);
  const hoursError = validateBusinessHours(startAt, ctx);
  if (hoursError) return { error: hoursError };
  const endAt = new Date(new Date(startAt).getTime() + 30 * 60 * 1000).toISOString();

  const { data: slotTaken } = await ctx.supabase.from("appointments")
    .select("id")
    .eq("workspace_id", ctx.payload.workspace_id)
    .eq("start_at", startAt)
    .not("status", "eq", "cancelled")
    .maybeSingle();
  if (slotTaken) {
    return { error: "That time slot has already been booked. Please suggest an alternative time." };
  }

  const { data: curSession } = await ctx.supabase.from("conversation_sessions")
    .select("contact_id, customer_jid")
    .eq("id", ctx.session.id)
    .single();
  const jidPhone = curSession?.customer_jid?.split("@")[0] || null;
  const customerPhone = params.phone && /^\d{7,15}$/.test(params.phone.replace(/\D/g, "")) ? params.phone : jidPhone;
  const customerEmail = params.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.email) ? params.email : null;

  const { data: appt, error: insertErr } = await ctx.supabase.from("appointments").insert({
    workspace_id: ctx.payload.workspace_id,
    session_id: ctx.session.id,
    contact_id: curSession?.contact_id || null,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: customerEmail,
    service: params.service,
    start_at: startAt,
    end_at: endAt,
    status: "confirmed"
  }).select().single();

  if (insertErr || !appt) {
    return { error: "Failed to save appointment. Please try again." };
  }

  let googleEventId: string | null = null;
  let meetLink: string | null = null;
  let calendarSyncFailed = false;
  try {
    const gConfig = await getGoogleConfig(ctx.supabase, ctx.payload.workspace_id);
    const gRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${gConfig.calendar_id || "primary"}/events?conferenceDataVersion=1`, {
      method: "POST",
      headers: { Authorization: `Bearer ${gConfig.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: `${params.service || "Appointment"}: ${params.name || "Customer"}`,
        description: `Customer: ${params.name || "N/A"}\nPhone: ${params.phone || "N/A"}\nEmail: ${params.email || "N/A"}\nService: ${params.service || "N/A"}\nSession: ${ctx.session.id}`,
        start: { dateTime: startAt },
        end: { dateTime: endAt },
        conferenceData: { createRequest: { requestId: `fc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}` } }
      })
    });
    if (gRes.ok) {
      const gEvent = await gRes.json();
      googleEventId = gEvent.id;
      meetLink = gEvent.hangoutLink || gEvent.conferenceData?.entryPoints?.[0]?.uri || null;
      await ctx.supabase.from("appointments")
        .update({ google_event_id: googleEventId, meeting_link: meetLink })
        .eq("id", appt.id);
    } else {
      calendarSyncFailed = true;
      console.error("[CALENDAR] Google Calendar API error:", gRes.status, await gRes.text());
    }
  } catch (e: any) {
    calendarSyncFailed = true;
    console.error("[CALENDAR] Google Calendar sync failed:", e.message);
    
    // Alert workspace owner about broken OAuth
    if (e.message?.includes("token") || e.message?.includes("invalid_grant")) {
      try {
        const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://7flowcore.vercel.app";
        const CRON_SECRET = Deno.env.get("INTERNAL_CRON_SECRET") || "";
        const { data: workspace } = await ctx.supabase
          .from("workspaces").select("owner_id, name").eq("id", ctx.payload.workspace_id).maybeSingle();
        if (workspace?.owner_id) {
          const { data: ownerEmail } = await ctx.supabase.rpc("get_user_email", { user_id: workspace.owner_id });
          if (ownerEmail) {
            await fetch(`${APP_URL}/api/emails/send`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${CRON_SECRET}` },
              body: JSON.stringify({
                to: ownerEmail,
                subject: `Google Calendar Disconnected — ${workspace.name || "Your Workspace"}`,
                template: "welcome",
                data: {
                  workspaceName: workspace.name || "Your Workspace",
                  customerName: "System Alert",
                  customerEmail: "Your Google Calendar integration has expired. Please re-authorize in Settings > Integrations."
                }
              }),
            });
          }
        }
      } catch (_) {}
    }
  }

  if (params.email && curSession?.contact_id) {
    await ctx.supabase.from("contacts").update({ email: params.email, updated_at: new Date().toISOString() }).eq("id", curSession.contact_id);
  }

  // Update booking session with this appointment
  await ctx.supabase.from("booking_sessions")
    .update({ appointment_id: appt.id, state: "booked", updated_at: new Date().toISOString() })
    .eq("session_id", ctx.session.id)
    .is("deleted_at", null);

  EdgeRuntime.waitUntil(sendAppointmentNotifications(ctx, appt, meetLink));

  const updatedAppt = googleEventId
    ? { ...appt, google_event_id: googleEventId, meeting_link: meetLink }
    : appt;

  return {
    ...updatedAppt,
    ...(calendarSyncFailed ? { warning: "Appointment saved but Google Calendar sync failed. A Meet link was not generated." } : {})
  };
}

async function sendAppointmentNotifications(ctx: PipelineContext, appt: any, meetLink: string | null) {
  await Promise.allSettled([
    sendAppointmentWhatsApp(ctx, appt, meetLink),
    sendAppointmentEmail(ctx, appt, meetLink)
  ]);
}

async function sendAppointmentWhatsApp(ctx: PipelineContext, appt: any, meetLink: string | null) {
  try {
    const { data: sessionData } = await ctx.supabase
      .from("conversation_sessions")
      .select("customer_jid, contact:contacts(phone), gowa_session:gowa_sessions!workspace_id(gowa_session_id)")
      .eq("id", ctx.session.id)
      .eq("workspace_id", ctx.payload.workspace_id)
      .single();
    if (!sessionData) return;
    const deviceId = sessionData.gowa_session?.gowa_session_id;
    if (!deviceId) return;
    let phone = appt.customer_phone;
    if (!phone || !/^\d{7,15}$/.test(phone.replace(/\D/g, ""))) {
      phone = sessionData.customer_jid?.split("@")[0] || sessionData.contact?.phone;
    }
    if (!phone) return;
    const gowaBase = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "");
    const gowaKey = Deno.env.get("GOWA_API_KEY");
    if (!gowaBase || !gowaKey) return;
    const auth = btoa(gowaKey);
    const formattedDate = formatIST(appt.start_at);
    const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://7flowcore.vercel.app";
    const appointmentLink = `${appUrl}/appointment/${appt.id}`;

    let message = `✅ Appointment Confirmed!\n\nHi ${appt.customer_name},\n\nYour appointment has been confirmed:\n• Service: ${appt.service}\n• Date: ${formattedDate}`;
    if (meetLink) message += `\n• Google Meet: ${meetLink}`;
    message += `\n\nView details: ${appointmentLink}\n\nThank you!`;
    await fetch(`${gowaBase}/send/message`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", "X-Device-Id": deviceId },
      body: JSON.stringify({ phone, message })
    });
  } catch (_) {}
}

async function sendAppointmentEmail(ctx: PipelineContext, appt: any, meetLink: string | null) {
  try {
    const { data: notifPref } = await ctx.supabase
      .from("workspace_notifications")
      .select("email_on_booking")
      .eq("workspace_id", ctx.payload.workspace_id)
      .maybeSingle();
    if (notifPref && notifPref.email_on_booking === false) return;
    const { data: workspaceData } = await ctx.supabase
      .from("workspaces")
      .select("name, session:conversation_sessions!workspace_id(contact:contacts(email))")
      .eq("id", ctx.payload.workspace_id)
      .eq("session.id", ctx.session.id)
      .single();
    if (!workspaceData) return;
    const email = appt.customer_email || workspaceData.session?.[0]?.contact?.email;
    if (!email) return;
    const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://7flowcore.vercel.app";
    const workspaceName = workspaceData.name || "FlowCore";
    const formattedDate = formatIST(appt.start_at);
    const appointmentLink = `${appUrl}/appointment/${appt.id}`;
    const cronSecret = Deno.env.get("INTERNAL_CRON_SECRET") || "";
    await fetch(`${appUrl}/api/emails/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cronSecret}` },
      body: JSON.stringify({
        to: email, subject: `Appointment Confirmed — ${workspaceName}`,
        template: "appointment",
        data: { customerName: appt.customer_name, workspaceName, service: appt.service, date: formattedDate, meetLink, appointmentLink }
      })
    });
  } catch (_) {}
}

export async function updateAppointment(
  params: { appointment_id: string; name?: string; service?: string; date?: string; time?: string; duration?: number },
  ctx: PipelineContext
) {
  let { data: existing } = await ctx.supabase.from("appointments").select("*").eq("id", params.appointment_id).maybeSingle();
  if (!existing) {
    const { data: all } = await ctx.supabase.from("appointments").select("*").eq("workspace_id", ctx.payload.workspace_id)
      .gte("start_at", new Date(Date.now() - 7 * 86400000).toISOString()).order("created_at", { ascending: false });
    const match = (all || []).find((a: any) => a.id.toLowerCase().startsWith(params.appointment_id.toLowerCase()));
    if (!match) return { error: "Appointment not found." };
    existing = match;
  }
  const startAt = params.date || params.time ? parseDT(params.date, params.time) : existing.start_at;
  const durationMs = (params.duration || 30) * 60000;
  const endAt = new Date(new Date(startAt).getTime() + durationMs).toISOString();

  // 1. DB update FIRST — local state is source of truth
  const { data: updated } = await ctx.supabase.from("appointments").update({
    customer_name: params.name || existing.customer_name,
    service: params.service || existing.service,
    start_at: startAt, end_at: endAt, updated_at: new Date().toISOString()
  }).eq("id", params.appointment_id).select().single();

  // 2. Google Calendar as secondary — non-fatal
  let syncStatus: string | null = null;
  if (existing.google_event_id) {
    try {
      const gConfig = await getGoogleConfig(ctx.supabase, ctx.payload.workspace_id);
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/${gConfig.calendar_id || "primary"}/events/${existing.google_event_id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${gConfig.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ start: { dateTime: startAt }, end: { dateTime: endAt } })
      });
    } catch (e: any) {
      console.error(`[Calendar] Google Calendar update failed for ${existing.google_event_id}:`, e.message);
      syncStatus = "failed_sync";
      await ctx.supabase.from("appointments").update({ sync_status: "failed_sync" }).eq("id", params.appointment_id);
    }
  }

  return { ...updated, sync_status: syncStatus };
}

export async function cancelAppointment(
  params: { appointment_id: string; reason?: string },
  ctx: PipelineContext
) {
  let { data: appt } = await ctx.supabase.from("appointments").select("*").eq("id", params.appointment_id).maybeSingle();
  if (!appt) {
    const { data: all } = await ctx.supabase.from("appointments").select("*").eq("workspace_id", ctx.payload.workspace_id)
      .gte("start_at", new Date(Date.now() - 7 * 86400000).toISOString()).order("created_at", { ascending: false });
    const match = (all || []).find((a: any) => a.id.toLowerCase().startsWith(params.appointment_id.toLowerCase()));
    if (!match) return { error: "Appointment not found." };
    appt = match;
  }

  // 1. DB update FIRST — local state is source of truth
  await ctx.supabase.from("appointments").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", params.appointment_id);

  // 2. Google Calendar as secondary — non-fatal
  if (appt.google_event_id) {
    try {
      const gConfig = await getGoogleConfig(ctx.supabase, ctx.payload.workspace_id);
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/${gConfig.calendar_id || "primary"}/events/${appt.google_event_id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${gConfig.access_token}` } }
      );
    } catch (e: any) {
      console.error(`[Calendar] Google Calendar delete failed for ${appt.google_event_id}:`, e.message);
      await ctx.supabase.from("appointments").update({ sync_status: "failed_sync" }).eq("id", params.appointment_id);
    }
  }

  return { success: true };
}

declare var EdgeRuntime: { waitUntil: (promise: Promise<any>) => void };

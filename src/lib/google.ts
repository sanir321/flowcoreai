import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin for token management
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Per-workspace mutex to prevent concurrent token refreshes
const refreshLocks = new Map<string, Promise<string>>();

export async function getValidAccessToken(workspace_id: string): Promise<string> {
  // If a refresh is already in progress for this workspace, wait for it
  if (refreshLocks.has(workspace_id)) {
    return refreshLocks.get(workspace_id)!;
  }

  const { data: tokens, error } = await supabaseAdmin
    .from("google_oauth_tokens")
    .select("*")
    .eq("workspace_id", workspace_id)
    .is("deleted_at", null)
    .single();

  if (error || !tokens) throw new Error("Google integration not found");

  const now = new Date();
  const expiry = new Date(tokens.token_expiry);

  // Refresh if expiring in less than 5 minutes
  if (expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    // Create a lock for this workspace
    const refreshPromise = performTokenRefresh(workspace_id, tokens.refresh_token);
    refreshLocks.set(workspace_id, refreshPromise);

    try {
      return await refreshPromise;
    } finally {
      refreshLocks.delete(workspace_id);
    }
  }

  return tokens.access_token;
}

async function performTokenRefresh(workspace_id: string, refreshToken: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const newTokens = await response.json();
  if (!response.ok) {
    console.error("Failed to refresh Google token:", newTokens);
    if (newTokens.error === 'invalid_grant') {
      await supabaseAdmin
        .from("google_oauth_tokens")
        .delete()
        .eq("workspace_id", workspace_id);
      throw new Error("Google session expired. Please re-authenticate.");
    }
    throw new Error("Failed to refresh Google token");
  }

  const newExpiry = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

  await supabaseAdmin
    .from("google_oauth_tokens")
    .update({
      access_token: newTokens.access_token,
      token_expiry: newExpiry,
    })
    .eq("workspace_id", workspace_id);

  return newTokens.access_token;
}

export async function createCalendarEvent(workspace_id: string, event: any) {
  const accessToken = await getValidAccessToken(workspace_id);
  const { data: tokens } = await supabaseAdmin.from("google_oauth_tokens").select("calendar_id").eq("workspace_id", workspace_id).single();

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${tokens?.calendar_id || 'primary'}/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) throw new Error("Failed to create calendar event");
  return response.json();
}

export async function updateCalendarEvent(workspace_id: string, event_id: string, event: any) {
  const accessToken = await getValidAccessToken(workspace_id);
  const { data: tokens } = await supabaseAdmin.from("google_oauth_tokens").select("calendar_id").eq("workspace_id", workspace_id).single();

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${tokens?.calendar_id || 'primary'}/events/${event_id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) throw new Error("Failed to update calendar event");
  return response.json();
}

export async function deleteCalendarEvent(workspace_id: string, event_id: string) {
  const accessToken = await getValidAccessToken(workspace_id);
  const { data: tokens } = await supabaseAdmin.from("google_oauth_tokens").select("calendar_id").eq("workspace_id", workspace_id).single();

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${tokens?.calendar_id || 'primary'}/events/${event_id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    throw new Error("Failed to delete calendar event");
  }
  return true;
}

export async function getCalendarAvailability(workspace_id: string, date_iso: string) {
  const accessToken = await getValidAccessToken(workspace_id);
  const { data: tokens } = await supabaseAdmin.from("google_oauth_tokens").select("calendar_id").eq("workspace_id", workspace_id).single();

  const startOfDay = new Date(date_iso);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date_iso);
  endOfDay.setHours(23, 59, 59, 999);

  const response = await fetch(`https://www.googleapis.com/calendar/v3/freeBusy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      items: [{ id: tokens?.calendar_id || 'primary' }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Google API Error (${response.status}):`, errorBody);
    throw new Error("Failed to fetch availability");
  }
  const data = await response.json();
  return data.calendars[tokens?.calendar_id || 'primary'].busy;
}

export async function appendSheetRow(workspace_id: string, row: string[]) {
  const accessToken = await getValidAccessToken(workspace_id);
  const { data: tokens } = await supabaseAdmin.from("google_oauth_tokens").select("sheet_id, sheet_range").eq("workspace_id", workspace_id).single();

  if (!tokens?.sheet_id) throw new Error("Google Sheet ID not configured");

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${tokens.sheet_id}/values/${tokens.sheet_range}:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [row],
      }),
    }
  );

  if (!response.ok) throw new Error("Failed to append to sheet");
  return response.json();
}

// /lib/gowa.ts
import { SendTextPayload, SendImagePayload, SendLinkPayload } from "@/types/gowa";
import { createAdminClient } from "@/lib/supabase/admin";

const deviceIdCache = new Map<string, { id: string, expires: number }>();

const GOWA_BASE_URL = process.env.GOWA_BASE_URL?.replace(/\/$/, "") || "";
const GOWA_API_KEY = process.env.GOWA_API_KEY || "";
const GOWA_AUTH = GOWA_API_KEY ? Buffer.from(GOWA_API_KEY).toString('base64') : "";

const gowaHeaders = {
  'Content-Type': 'application/json',
  'Authorization': GOWA_AUTH ? `Basic ${GOWA_AUTH}` : ""
};

/**
 * All GoWA API calls must use this wrapper
 */
async function gowaApiCall<T>(
  endpoint: string,
  deviceId: string,
  payload: object
): Promise<T> {
  try {
    const response = await fetch(`${GOWA_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...gowaHeaders,
        'X-Device-Id': deviceId
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000)
    });

    if (response.status === 429) throw new Error('GOWA_RATE_LIMITED');
    if (response.status === 500) throw new Error('GOWA_SERVER_ERROR');
    if (!response.ok) throw new Error(`GOWA_HTTP_${response.status}`);

    return response.json();
  } catch (error: any) {
    if (error.name === 'TimeoutError') throw new Error('GOWA_TIMEOUT');
    throw error;
  }
}

/**
 * ALWAYS use this formatter before any GoWA API call
 */
export async function formatPhoneForGoWA(phone: string): Promise<string> {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    cleaned = '91' + cleaned;
  }
  cleaned = cleaned.replace('@s.whatsapp.net', '');
  return cleaned;
}

/**
 * Send Text Message (High-level wrapper that fetches deviceId internally)
 */
export async function sendWhatsAppText(workspaceId: string, phone: string, message: string): Promise<void> {
  let deviceId = "";
  const cached = deviceIdCache.get(workspaceId);
  
  if (cached && cached.expires > Date.now()) {
    deviceId = cached.id;
  } else {
    const supabaseAdmin = createAdminClient();
    
    const { data, error } = await supabaseAdmin
      .from("gowa_sessions")
      .select("gowa_session_id")
      .eq("workspace_id", workspaceId)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching gowa session:", error);
    }

    deviceId = data?.gowa_session_id || "";
    if (deviceId) {
      deviceIdCache.set(workspaceId, { id: deviceId, expires: Date.now() + 5 * 60 * 1000 });
    }
  }

  if (!deviceId) {
    throw new Error(`No WhatsApp session found for workspace ${workspaceId}`);
  }

  const formattedPhone = await formatPhoneForGoWA(phone);
  await gowaApiCall('/send/message', deviceId, { 
    phone: formattedPhone, 
    message 
  });
}

/**
 * Health Check (Verify if specific device is connected)
 */
export async function checkGoWASessionHealth(deviceId?: string): Promise<boolean> {
  try {
    if (!deviceId) return false;
    
    const response = await fetch(`${GOWA_BASE_URL}/devices`, {
      headers: { 
        'Authorization': `Basic ${GOWA_AUTH}`
      },
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    // GoWA returns an array of devices
    const device = data.results?.find((d: any) => d.id === deviceId);
    
    return device?.state === 'connected' || device?.state === 'logged_in';
  } catch {
    return false;
  }
}

/**
 * Get specific device details from GoWA
 */
export async function getDeviceDetails(deviceId: string): Promise<any | null> {
  try {
    // We fetch all and find the ID locally because the header filtering is inconsistent on some GoWA versions
    const response = await fetch(`${GOWA_BASE_URL}/devices`, {
      headers: { 
        'Authorization': `Basic ${GOWA_AUTH}`
      },
      cache: 'no-store'
    });
    if (!response.ok) return null;
    const data = await response.json();
    const results = data.results;
    
    if (Array.isArray(results)) {
      return results.find((d: any) => d.id === deviceId) || null;
    } else if (results && typeof results === 'object' && results.id === deviceId) {
      return results;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Core Send Message (Universal)
 */
export async function sendTextMessage(deviceId: string, to: string, message: string): Promise<void> {
  const formattedPhone = await formatPhoneForGoWA(to);
  await gowaApiCall('/send/message', deviceId, { 
    phone: formattedPhone, 
    message 
  });
}

/**
 * Send Image via URL
 */
export async function sendWhatsAppImage(deviceId: string, phone: string, imageUrl: string, caption: string): Promise<void> {
  const formattedPhone = await formatPhoneForGoWA(phone);
  await gowaApiCall('/send/image', deviceId, { 
    phone: formattedPhone, 
    image_url: imageUrl, 
    caption 
  });
}

/**
 * Send Link Preview
 */
export async function sendWhatsAppLink(deviceId: string, phone: string, link: string, caption: string): Promise<void> {
  const formattedPhone = await formatPhoneForGoWA(phone);
  await gowaApiCall('/send/link', deviceId, { 
    phone: formattedPhone, 
    link, 
    caption 
  });
}

/**
 * Send Presence Update (composing/paused)
 */
export async function sendPresenceUpdate(deviceId: string, phone: string, type: 'composing' | 'paused'): Promise<void> {
  const formattedPhone = await formatPhoneForGoWA(phone);
  await gowaApiCall('/send/presence', deviceId, { 
    phone: formattedPhone, 
    type 
  });
}

/**
 * Get all devices from GoWA
 */
export async function getDevices(): Promise<any[]> {
  try {
    const response = await fetch(`${GOWA_BASE_URL}/devices`, {
      headers: { 
        'Authorization': `Basic ${GOWA_AUTH}`
      }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || [];
  } catch {
    return [];
  }
}

/**
 * Initialize QR Login Session
 */
export async function initiateQRLogin(workspaceId: string, storedDeviceId?: string): Promise<{ qr_code: string; device_id: string }> {
  // 1. Try to find an existing device by name or stored ID
  const allDevices = await getDevices();
  let device = allDevices.find(d => d.name === `FlowCore_${workspaceId}`);
  if (!device && storedDeviceId) {
    device = allDevices.find(d => d.id === storedDeviceId);
  }

  // 2. If no device, create one
  if (!device) {
    const createResponse = await fetch(`${GOWA_BASE_URL}/devices`, {
      method: 'POST',
      headers: gowaHeaders,
      body: JSON.stringify({ name: `FlowCore_${workspaceId}` })
    });
    if (!createResponse.ok) {
        const errorBody = await createResponse.text();
        console.error("Failed to create GoWA device:", errorBody);
        throw new Error("Failed to create a new WhatsApp device session.");
    }
    const createData = await createResponse.json();
    device = createData.results;
  }

  if (!device || !device.id) {
    throw new Error("Failed to obtain device ID from GoWA.");
  }

  // 3. If device exists but is not fully logged in (no jid), request a new QR code
  if (device.state === 'disconnected' || !device.state || (device.state === 'connected' && !device.jid)) {
    const qrResponse = await fetch(`${GOWA_BASE_URL}/app/login`, {
        method: 'GET',
        headers: { ...gowaHeaders, 'X-Device-Id': device.id },
    });
    if (!qrResponse.ok) {
        const errorBody = await qrResponse.text();
        console.error("Failed to get new QR code:", errorBody);
        throw new Error("Failed to retrieve a new QR code for the existing session.");
    }
    const qrData = await qrResponse.json();
    return { qr_code: qrData.results?.qr_link || '', device_id: device.id };
  }
  
  // 4. If it's already pending or connected, return empty
  return { qr_code: '', device_id: device.id };
}

/**
 * Logout Session
 */
export async function logoutSession(deviceId: string): Promise<void> {
  await fetch(`${GOWA_BASE_URL}/devices/${deviceId}/logout`, {
    method: 'POST',
    headers: gowaHeaders
  });
}

export async function deleteDevice(deviceId: string): Promise<void> {
  await fetch(`${GOWA_BASE_URL}/devices/${deviceId}`, {
    method: 'DELETE',
    headers: gowaHeaders
  });
}

/**
 * Get all chats for a specific device
 */
export async function getChats(deviceId: string): Promise<any[]> {
  try {
    const response = await fetch(`${GOWA_BASE_URL}/chats`, {
      headers: { 
        ...gowaHeaders,
        'X-Device-Id': deviceId
      }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.results?.data || [];
  } catch {
    return [];
  }
}

/**
 * Get message history for a specific chat
 */
export async function getChatMessages(deviceId: string, jid: string, limit: number = 50): Promise<any[]> {
  try {
    const response = await fetch(`${GOWA_BASE_URL}/chat/${jid}/messages?limit=${limit}`, {
      headers: { 
        ...gowaHeaders,
        'X-Device-Id': deviceId
      }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.results?.data || [];
  } catch {
    return [];
  }
}



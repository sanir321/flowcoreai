import { PipelineContext } from "./types.ts";

async function sendPresence(gowaBase: string, auth: string, deviceId: string, phone: string, type: string): Promise<void> {
  try {
    await fetch(`${gowaBase}/send/presence`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", "X-Device-Id": deviceId },
      body: JSON.stringify({ phone, type }),
      signal: AbortSignal.timeout(5000)
    });
  } catch (e) {
    console.error("[DISPATCH] Presence update failed:", e?.message || e);
  }
}

export async function dispatch(ctx: PipelineContext, response: string | null): Promise<void> {
  if (!response) return;
  const phone = ctx.payload.customer_phone;
  const source = ctx.payload.source || "whatsapp";

  // Skip GoWA sends for test messages
  if (ctx.payload.is_test) {
    const parts = response.length > 1000 ? splitAtSentence(response, 1000) : [response];
    for (const part of parts) {
      await storeOutboundMessage(ctx, part);
    }
    await ctx.supabase
      .from("conversation_sessions")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", ctx.session.id);
    return;
  }

  const gowaBase = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "");
  const gowaKey = Deno.env.get("GOWA_API_KEY");
  
  let deviceId = "";
  if (source === "whatsapp" && gowaBase && gowaKey) {
    // Circuit breaker: health-check GoWA before attempting dispatch
    const healthy = await checkGoWAHealth(gowaBase, gowaKey);
    if (!healthy) {
      console.error("[DISPATCH] GoWA circuit breaker open — skipping WhatsApp send, saving failed message");
      for (const part of (response.length > 1000 ? splitAtSentence(response, 1000) : [response])) {
        await storeOutboundMessage(ctx, part);
        await saveFailedMessage(ctx, phone || "unknown", part, "GoWA circuit breaker — health check failed");
      }
      return;
    }

    const { data: gowaSession } = await ctx.supabase
      .from("gowa_sessions")
      .select("gowa_session_id")
      .eq("workspace_id", ctx.payload.workspace_id)
      .eq("status", "connected")
      .maybeSingle();
    deviceId = gowaSession?.gowa_session_id || "";
  }

  const auth = gowaKey ? btoa(gowaKey) : "";

  const parts = response.length > 1000 ? splitAtSentence(response, 1000) : [response];

  for (const part of parts) {
    await storeOutboundMessage(ctx, part);
    
    if (source === "whatsapp" && deviceId && phone) {
      await sendPresence(gowaBase, auth, deviceId, phone, "available");
      const delayMs = Math.min(part.length * 12, 1500);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      await sendPresence(gowaBase, auth, deviceId, phone, "unavailable");
    }

    if (source === "whatsapp" && deviceId && phone) {
      const formatted = part.replace(/\*\*(.+?)\*\*/g, "*$1*");
      await sendWithRetry(ctx, gowaBase!, phone, formatted, auth, deviceId);
      if (parts.length > 1) await new Promise(res => setTimeout(res, 500));
    }
  }

  await ctx.supabase
    .from("conversation_sessions")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", ctx.session.id);
}

async function sendWithRetry(ctx: PipelineContext, gowaBase: string, phone: string, text: string, auth: string, deviceId: string, attempt = 1): Promise<void> {
  const backoffs = [0, 1000, 2000, 4000];
  if (attempt > 1) await new Promise(res => setTimeout(res, backoffs[attempt - 1]));

  try {
    const res = await fetch(`${gowaBase}/send/message`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", "X-Device-Id": deviceId },
      body: JSON.stringify({ phone, message: text }),
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok && attempt < 3) {
      return sendWithRetry(ctx, gowaBase, phone, text, auth, deviceId, attempt + 1);
    } else if (!res.ok) {
      await saveFailedMessage(ctx, phone, text, `GoWA ${res.status}`);
    }
  } catch (e) {
    console.error("[DISPATCH] GoWA send failed:", e?.message || e);
    if (attempt < 3) {
      return sendWithRetry(ctx, gowaBase, phone, text, auth, deviceId, attempt + 1);
    }
    await saveFailedMessage(ctx, phone, text, "GoWA timeout");
  }
}

function splitAtSentence(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  const parts: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > maxLen && current) {
      parts.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

async function storeOutboundMessage(ctx: PipelineContext, response: string) {
  await ctx.supabase.from("messages").insert({
    workspace_id: ctx.payload.workspace_id,
    session_id: ctx.session.id,
    content: response,
    direction: "outbound",
    role: "agent",
    agent_type: ctx.agentType || "customer_support",
    is_test: ctx.payload.is_test || false
  });
}

async function checkGoWAHealth(baseUrl: string, apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/devices`, {
      headers: { Authorization: `Basic ${btoa(apiKey)}` },
      signal: AbortSignal.timeout(5000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function saveFailedMessage(ctx: PipelineContext, phone: string, text: string, reason: string) {
  try {
    await ctx.supabase.from("failed_messages").insert({
      workspace_id: ctx.payload.workspace_id,
      session_id: ctx.session.id,
      raw_message: text,
      failure_reason: reason,
      retry_count: 3,
      resolved: false
    });
  } catch (e) {
    console.error("[DISPATCH] Failed to save failed_message:", e?.message || e);
  }
}

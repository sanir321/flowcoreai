import { PipelineContext } from "./types.ts";

export async function dispatch(ctx: PipelineContext, response: string | null): Promise<void> {
  if (!response) return;
  console.log(`[DISPATCH] Sending response: ${response.substring(0, 50)}...`)

  // Always store the outbound message for audit trail
  await storeOutboundMessage(ctx, response);
  console.log(`[DISPATCH] Outbound message stored.`)

  const phone = ctx.payload.customer_phone;
  if (!phone || ctx.payload.source !== "whatsapp") {
    console.log(`[DISPATCH] Skipping WhatsApp send (Phone: ${phone}, Source: ${ctx.payload.source})`)
    return;
  }

  const gowaBase = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "");
  const gowaKey = Deno.env.get("GOWA_API_KEY");
  if (!gowaBase || !gowaKey) {
    console.error(`[DISPATCH] Missing Gowa config (Base: ${!!gowaBase}, Key: ${!!gowaKey})`)
    return;
  }

  const { data: gowaSession } = await ctx.supabase
    .from("gowa_sessions")
    .select("gowa_session_id")
    .eq("workspace_id", ctx.payload.workspace_id)
    .maybeSingle();
  const deviceId = gowaSession?.gowa_session_id;
  
  if (!deviceId) {
    console.error(`[DISPATCH] No Gowa session found for workspace: ${ctx.payload.workspace_id}`)
    return;
  }

  console.log(`[DISPATCH] Using device: ${deviceId}`)
  const auth = btoa(gowaKey);

  try {
    await fetch(`${gowaBase}/send/presence`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", "X-Device-Id": deviceId },
      body: JSON.stringify({ phone, type: "available" })
    });
  } catch (_) {}

  const delayMs = Math.min(response.length * 12, 1500);
  await new Promise(resolve => setTimeout(resolve, delayMs));

  try {
    await fetch(`${gowaBase}/send/presence`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", "X-Device-Id": deviceId },
      body: JSON.stringify({ phone, type: "unavailable" })
    });
  } catch (_) {}

  const parts = response.length > 1000 ? splitAtSentence(response, 1000) : [response];

  for (const part of parts) {
    await sendWithRetry(ctx, gowaBase, phone, part, auth, deviceId);
    if (parts.length > 1) await new Promise(res => setTimeout(res, 500));
  }

  await ctx.supabase
    .from("conversation_sessions")
    .update({ last_message_at: new Date().toISOString(), status: "active" })
    .eq("id", ctx.session.id);
}

async function sendWithRetry(ctx: PipelineContext, gowaBase: string, phone: string, text: string, auth: string, deviceId: string, attempt = 1): Promise<void> {
  const backoffs = [0, 1000, 2000, 4000];
  if (attempt > 1) await new Promise(res => setTimeout(res, backoffs[attempt - 1]));

  const res = await fetch(`${gowaBase}/send/message`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", "X-Device-Id": deviceId },
    body: JSON.stringify({ phone, message: text })
  });

  if (!res.ok && attempt < 3) {
    return sendWithRetry(ctx, gowaBase, phone, text, auth, deviceId, attempt + 1);
  } else if (!res.ok) {
    await saveFailedMessage(ctx, phone, text, `GoWA ${res.status}`);
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
    agent_type: ctx.agentType || "customer_support"
  });
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
  } catch (_) {}
}

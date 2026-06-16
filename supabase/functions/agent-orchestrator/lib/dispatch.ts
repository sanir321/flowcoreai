import { PipelineContext } from "./types.ts";

export async function dispatch(ctx: PipelineContext, response: string | null): Promise<void> {
  if (!response) return;
  console.log(`[DISPATCH] Preparing response: ${response.substring(0, 50)}...`)

  const phone = ctx.payload.customer_phone;
  const source = ctx.payload.source || "whatsapp";

  const gowaBase = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "");
  const gowaKey = Deno.env.get("GOWA_API_KEY");
  
  let deviceId = "";
  if (source === "whatsapp" && gowaBase && gowaKey) {
    const { data: gowaSession } = await ctx.supabase
      .from("gowa_sessions")
      .select("gowa_session_id")
      .eq("workspace_id", ctx.payload.workspace_id)
      .maybeSingle();
    deviceId = gowaSession?.gowa_session_id || "";
  }

  const auth = gowaKey ? btoa(gowaKey) : "";

  const parts = response.length > 1000 ? splitAtSentence(response, 1000) : [response];

  for (const part of parts) {
    await storeOutboundMessage(ctx, part);
    
    if (source === "whatsapp" && deviceId && phone) {
      try {
        await fetch(`${gowaBase}/send/presence`, {
          method: "POST",
          headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", "X-Device-Id": deviceId },
          body: JSON.stringify({ phone, type: "available" })
        });
      } catch (_) {}
      
      const delayMs = Math.min(part.length * 12, 1500);
      await new Promise(resolve => setTimeout(resolve, delayMs));

      try {
        await fetch(`${gowaBase}/send/presence`, {
          method: "POST",
          headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", "X-Device-Id": deviceId },
          body: JSON.stringify({ phone, type: "unavailable" })
        });
      } catch (_) {}
    }

    if (source === "whatsapp" && deviceId && phone) {
      await sendWithRetry(ctx, gowaBase!, phone, part, auth, deviceId);
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
    agent_type: ctx.agentType || "customer_support",
    is_test: ctx.payload.is_test || false
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

# WhatsApp Compliance Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement mandatory WhatsApp compliance rules (24-hour window, artificial typing delay, and presence updates) centralized in the Agent Orchestrator.

**Architecture:** Centralize all WhatsApp-specific dispatch and safety logic in the `agent-orchestrator` Supabase Edge Function. Slim down the `gowa-webhook` to handle only ingestion and initial deduplication.

**Tech Stack:** Deno (Supabase Edge Functions), TypeScript, GoWA API.

---

### Task 1: Enhance GoWA Library

**Files:**
- Modify: `src/lib/gowa.ts`

- [ ] **Step 1: Add `sendPresenceUpdate` helper**

```typescript
/**
 * Send Presence Update (composing/paused)
 */
export async function sendPresenceUpdate(deviceId: string, phone: string, type: 'composing' | 'paused'): Promise<void> {
  const formattedPhone = formatPhoneForGoWA(phone);
  await gowaApiCall('/send/presence', deviceId, { 
    phone: formattedPhone, 
    type 
  });
}

// Update the exported gowa object
export const gowa = {
  // ... existing
  sendPresenceUpdate,
  // ...
};
```

- [ ] **Step 2: Commit changes**

```bash
git add src/lib/gowa.ts
git commit -m "feat: add sendPresenceUpdate to GoWA library"
```

---

### Task 2: Create Compliance Library in Orchestrator

**Files:**
- Create: `supabase/functions/agent-orchestrator/lib/compliance.ts`

- [ ] **Step 1: Implement compliance logic**

```typescript
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

export async function checkWhatsAppWindow(supabase: SupabaseClient, sessionId: string): Promise<{ expired: boolean }> {
  const { data: session } = await supabase
    .from('conversation_sessions')
    .select('last_customer_message_at')
    .eq('id', sessionId)
    .single();

  if (!session?.last_customer_message_at) return { expired: false };

  const lastMessageAt = new Date(session.last_customer_message_at);
  const now = new Date();
  const diffMs = now.getTime() - lastMessageAt.getTime();
  const hoursSinceLastMessage = diffMs / (1000 * 60 * 60);

  return { expired: hoursSinceLastMessage > 24 };
}

export function calculateTypingDelay(message: string): number {
  return Math.min(message.length * 35, 4000);
}

export async function logWindowExpired(supabase: SupabaseClient, workspaceId: string, sessionId: string) {
    await supabase.from('escalation_logs').insert({
        workspace_id: workspaceId,
        session_id: sessionId,
        trigger_type: 'wa_window_expired',
        status: 'open',
        metadata: { reason: 'WhatsApp 24-hour window expired' }
    });
}
```

- [ ] **Step 2: Commit changes**

```bash
git add supabase/functions/agent-orchestrator/lib/compliance.ts
git commit -m "feat: add compliance library to agent-orchestrator"
```

---

### Task 3: Centralize Dispatch in Agent Orchestrator

**Files:**
- Modify: `supabase/functions/agent-orchestrator/index.ts`

- [ ] **Step 1: Import compliance helpers and GoWA config**

```typescript
import { checkWhatsAppWindow, calculateTypingDelay, logWindowExpired } from "./lib/compliance.ts"
```

- [ ] **Step 2: Implement 24-hour window check at the start**

```typescript
    // 1. Load/Create Session
    const session = await getOrCreateSession(supabase, { workspace_id, customer_jid, channel, agent_type })
    
    // COMPLIANCE: 24-Hour Window Check
    if (channel === 'whatsapp') {
        const { expired } = await checkWhatsAppWindow(supabase, session.id);
        if (expired) {
            console.log(`[COMPLIANCE] Window expired for session ${session.id}`);
            await logWindowExpired(supabase, workspace_id, session.id);
            await updateSessionState(supabase, session.id, { status: 'idle', typing_status: 'idle' });
            return new Response(JSON.stringify({ error: "WhatsApp window expired" }), { status: 403 });
        }
    }
```

- [ ] **Step 3: Implement Artificial Typing Delay in the storage loop**

```typescript
    // 7. Store & Enforce Response Length + Dispatch to GoWA
    const finalParts = response.response_parts.map((p: string) => enforceResponseLength(p, channel));
    
    // Fetch GoWA details if needed
    let deviceId = "";
    if (channel === 'whatsapp') {
        const { data: gowaSession } = await supabase.from('gowa_sessions').select('gowa_session_id').eq('workspace_id', workspace_id).maybeSingle();
        deviceId = gowaSession?.gowa_session_id;
    }

    const gowaBase = Deno.env.get('GOWA_BASE_URL')?.replace(/\/$/, "");
    const gowaKey = Deno.env.get('GOWA_API_KEY');
    const auth = btoa(gowaKey || '');
    const phone = customer_jid.split('@')[0];

    for (const part of finalParts) {
      // 1. Save to DB
      await supabase.from('messages').insert({
        workspace_id,
        session_id: session.id,
        content: part,
        direction: 'outbound',
        role: 'agent',
        agent_type: routing.agent,
        metadata: response.metadata
      });

      // 2. Dispatch to GoWA with compliance logic
      if (channel === 'whatsapp' && deviceId) {
          const delayMs = calculateTypingDelay(part);
          
          // Send Composing
          await fetch(`${gowaBase}/send/presence`, {
              method: 'POST',
              headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
              body: JSON.stringify({ phone, type: 'composing' })
          }).catch(e => console.error("[GOWA] Presence error:", e));

          // Wait
          await new Promise(resolve => setTimeout(resolve, delayMs));

          // Send Message
          await fetch(`${gowaBase}/send/message`, {
              method: 'POST',
              headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
              body: JSON.stringify({ phone, message: part })
          }).catch(e => console.error("[GOWA] Send error:", e));

          // Send Paused
          await fetch(`${gowaBase}/send/presence`, {
              method: 'POST',
              headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
              body: JSON.stringify({ phone, type: 'paused' })
          }).catch(e => console.error("[GOWA] Presence error:", e));
      }
    }
```

- [ ] **Step 4: Commit changes**

```bash
git add supabase/functions/agent-orchestrator/index.ts
git commit -m "feat: centralize WhatsApp compliance and dispatch in agent-orchestrator"
```

---

### Task 4: Slim Down GoWA Webhook

**Files:**
- Modify: `supabase/functions/gowa-webhook/index.ts`

- [ ] **Step 1: Simplify `processAI` to only trigger orchestrator**

```typescript
    // 7. Fire and Forget AI processing using EdgeRuntime.waitUntil
    const processAI = async () => {
        try {
            console.log(`[WEBHOOK] Triggering AI for workspace ${workspaceId}`)
            await supabase.functions.invoke("agent-orchestrator", {
                body: {
                    workspace_id: workspaceId,
                    customer_jid: normalizedFrom,
                    message: messageText,
                    channel: 'whatsapp',
                    agent_type: "customer_support"
                }
            })
        } catch (bgError) {
            console.error("[WEBHOOK] Background AI process failed:", bgError)
        }
    }
```

- [ ] **Step 2: Commit changes**

```bash
git add supabase/functions/gowa-webhook/index.ts
git commit -m "refactor: simplify gowa-webhook to trigger orchestrator only"
```

---

### Task 5: Verification

- [ ] **Step 1: Deploy functions**

Run: `supabase functions deploy agent-orchestrator gowa-webhook`

- [ ] **Step 2: Test 24h Window**

Modify a test session in DB to have `last_customer_message_at` = `now() - 25 hours`. Trigger webhook.
Expected: Orchestrator logs "expired", creates escalation, and sends no message.

- [ ] **Step 3: Test Typing Delay**

Send a message from WhatsApp.
Expected: "typing..." status appears for a few seconds before the message arrives.

# Design Spec: WhatsApp Compliance Layer
**Date:** 2026-05-04
**Topic:** WhatsApp Compliance (24h Window & Typing Delays)
**Status:** Approved

## 1. Overview
This spec defines the implementation of mandatory WhatsApp compliance rules to ensure account safety and stability for FlowCore. The two core features are the **24-Hour Response Window** check and **Artificial Typing Delays** with presence updates.

## 2. Architecture
All compliance and dispatch logic will be centralized in the `agent-orchestrator` Supabase Edge Function. The `gowa-webhook` will be simplified to handle only ingestion and deduplication.

### 2.1 Component Changes
- **`src/lib/gowa.ts`**: Add `sendPresenceUpdate(deviceId, phone, type)` helper.
- **`supabase/functions/agent-orchestrator`**:
    - Add a `compliance.ts` library for window checks and delay calculations.
    - Implement the 24-hour window check at the start of the execution.
    - Implement the typing delay loop using `EdgeRuntime.waitUntil` to ensure it continues after the response is returned to the client.
- **`supabase/functions/gowa-webhook`**: Remove dispatch logic and AI trigger polling. Move to a direct `fetch` call to the orchestrator.

## 3. Data Flow
1. **Webhook** receives message -> Stores in `messages` -> Invokes **Orchestrator**.
2. **Orchestrator** loads session -> Checks 24h window (based on `last_customer_message_at`).
    - If expired: Log to `escalation_logs` (type: `wa_window_expired`) -> Abort.
3. **Orchestrator** generates response.
4. **Orchestrator** loops through response parts:
    - Send `composing` presence.
    - Sleep `min(length * 35ms, 4000ms)`.
    - Send `message`.
    - Send `paused` presence.
5. **Orchestrator** updates session metadata.

## 4. Error Handling
- **Window Expired**: Escalation log created; session status remains `active` but AI processing stops for that turn.
- **GoWA Failures**: Logged but non-blocking for the primary database transaction.

## 5. Testing
- **Unit**: Calibrate `ms/char` logic.
- **Integration**: Verify sequence of Presence -> Delay -> Message.
- **Manual**: End-to-end verification with a real device.

# FlowCore — System Architecture & GoWA Integration

This document outlines the core architecture of the FlowCore platform, specifically the interaction between the **GoWA (WhatsApp Bridge)** and the **Business Dashboard**.

---

## 1. High-Level Architecture

FlowCore operates as a neural orchestration layer between external communication channels and business data.

```
[ Phone ] <--> [ WhatsApp Cloud ] <--> [ GoWA Server (Railway) ]
                                               |
                                               | (HMAC Secured Webhook)
                                               v
[ Next.js UI ] <--> [ Supabase Cloud (DB / Edge Functions) ]
```

## 2. GoWA WhatsApp Integration

The platform uses a self-hosted GoWA server to bridge standard WhatsApp accounts into the system.

### Inbound Flow (Receiving)
1.  **Event Trigger:** A customer sends a message to the business WhatsApp number.
2.  **Webhook Dispatch:** GoWA captures the event and sends an HTTP POST request to the `gowa-webhook` Edge Function.
3.  **Security:** Every request is signed with an **HMAC SHA256** signature in the `X-Hub-Signature-256` header using the `GOWA_WEBHOOK_SECRET`.
4.  **Parsing:** The webhook parses the official GoWA payload (using `device_id` and `payload` fields).
5.  **Synchronization:**
    *   **Contacts:** Upserts the customer into the Identity Directory.
    *   **Sessions:** Finds or creates an "Active" session for that workspace.
    *   **Messages:** Saves the message and updates the session's "Last Active" metadata.
6.  **AI Response:** Triggers the `agent-orchestrator` asynchronously to generate a reply.

### Outbound Flow (Sending)
1.  **UI/AI Trigger:** Either an operator types a message in the Inbox or the AI generates a response.
2.  **API Call:** The system makes a direct REST call to the GoWA server on Railway (`POST /send/message`).
3.  **Delivery:** GoWA pushes the message to the WhatsApp network.

## 3. Dashboard Connectivity

### Real-time Synchronization
*   **WebSockets:** The Inbox uses Supabase Realtime to "listen" for new inserts in the `messages` table.
*   **Polling Fallback:** If the browser or network blocks WebSockets (indicated by the "Polling" badge), the app automatically refreshes data every 10 seconds to ensure no messages are missed.

### Session Management
*   **To do:** Conversations escalated to humans (status: `escalated`).
*   **Active:** Conversations handled by AI assistants (status: `active`).
*   **Done:** Resolved or inactive conversations.

---

## 4. Stability & Security Rules

- **Uniqueness:** Only one workspace can be connected to a specific WhatsApp phone number at any time to prevent routing conflicts.
- **Deduplication:** Every incoming message is checked against a unique `gowa_message_id` to prevent duplicate processing during retries.
- **Manual Handover:** Clicking "Take Over" immediately pauses the AI and grants full manual control to the operator.

## Search Constraints
- Never use SearchText across all directories
- Limit file searches to src/ and app/ directories only
- Do not read node_modules or .next directories


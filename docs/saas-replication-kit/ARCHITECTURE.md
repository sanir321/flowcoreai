# FlowCore Architecture: The SaaS Replication Guide

This document explains how the three core pillars of FlowCore (GoWA, Supabase, and the Next.js Dashboard) are interconnected to create an autonomous business communication platform.

## 1. The Three Pillars

### A. GoWA (WhatsApp Bridge - Hosted on Railway)
*   **Role:** Acts as the "Physical Link" to the WhatsApp network.
*   **Function:** It converts raw WhatsApp protocol into standard HTTP Webhooks and REST APIs.
*   **Infrastructure:** Best hosted on **Railway.app** or **Render.com** as a Docker container.

### B. Supabase (The Brain & Data Layer)
*   **Role:** Stores state, manages users, and runs the AI logic.
*   **Key Components:**
    *   **PostgreSQL:** Stores sessions, messages, contacts, and workspace settings.
    *   **Edge Functions:** Serverless code that handles the HMAC security and triggers the AI logic.
    *   **Real-time:** Pushes new messages to the UI instantly via WebSockets.

### C. FlowCore Dashboard (The Command Center)
*   **Role:** The human interface.
*   **Technology:** Next.js 15+ (App Router).
*   **Function:** Real-time monitoring of conversations, manual intervention, and workspace configuration.

---

## 2. The Interaction Loop

### Phase 1: Inbound (Customer to AI)
1.  **Customer** sends a message on WhatsApp.
2.  **GoWA** captures the message and signs it with an **HMAC signature** using the `APP_WEBHOOK_SECRET`.
3.  **GoWA** sends a POST request to your **Supabase Edge Function** (`gowa-webhook`).
4.  **Supabase** verifies the signature, saves the message, and calls the `agent-orchestrator`.
5.  **Agent Orchestrator** processes the message through an LLM and returns a response.
6.  **Supabase** sends that response back to **GoWA** via REST API.
7.  **GoWA** delivers the message to the customer's phone.

### Phase 2: Outbound (Dashboard to Customer)
1.  **Operator** types a message and clicks "Send".
2.  **Dashboard** calls a **Server Action** in Next.js.
3.  **Server Action** saves the message to the database and calls the **GoWA REST API**.
4.  **GoWA** delivers the message to the customer.

---

## 3. Why This Setup is Scalable
- **Decoupled:** You can update the Dashboard UI without touching the WhatsApp bridge.
- **Multi-Tenant:** The `workspace_id` logic ensures that one GoWA instance can serve multiple distinct business units securely.
- **Async Processing:** The use of `EdgeRuntime.waitUntil` in the webhook prevents timeouts and eliminates duplicate messages.

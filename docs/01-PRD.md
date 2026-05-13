# 01 — Product Requirements Document (PRD)
## FlowCore AI — MVP Specification v3.0

**Version:** 3.0.0
**Status:** Active — Architecturally Binding

---

## 1. Product Vision

FlowCore AI deploys autonomous AI employees to SMBs via WhatsApp and a web widget. Each AI employee is workspace-scoped, knowledge-grounded, and enforces Meta compliance rules. The system is multi-tenant from day one with strict per-workspace isolation.

---

## 2. Application Map

```
Landing Page (/)
  └── Auth (/login) — Google OAuth | Email OTP
        ├── [New user] → Onboarding (/onboarding)
        │     ├── Step 1: Business Profile
        │     └── Step 2: Agent Selection (3D Card Carousel)
        │           └── Dashboard (/dashboard)
        └── [Returning user] → Dashboard (/dashboard)
                    ├── /dashboard/inbox
                    ├── /dashboard/appointments     [conditional: booking agent]
                    ├── /dashboard/insights
                    ├── /dashboard/agent-hub
                    │     ├── /agent-hub            → My Agents
                    │     ├── /agent-hub/test       → Test Chat
                    │     └── /agent-hub/[agentId]  → Configure + Tools
                    ├── /dashboard/contacts
                    └── /dashboard/settings
                          ├── /settings/general
                          ├── /settings/profile
                          ├── /settings/workspace
                          ├── /settings/notifications
                          ├── /settings/channels    → WhatsApp + Web Widget
                          └── /settings/integrations → Google Calendar + Sheets
```

---

## 3. Authentication

### 3.1 Methods

- **Google OAuth** — Supabase Auth provider, one-click
- **Email OTP** — `signInWithOtp({ email })` → 6-digit code → `verifyOtp()`. No magic links. No passwords.

### 3.2 Session Handling

- JWT stored in HTTP-only cookies via `@supabase/ssr`
- Next.js middleware enforces auth on `/dashboard/*` and `/onboarding/*`
- Middleware logic:
  - No session → `/login`
  - Session + no workspace → `/onboarding`
  - Session + workspace → allow

---

## 4. Onboarding (3 Steps)

Target completion: under 4 minutes. Full-screen flow, no sidebar.

### Step 1 — Business Profile
... (same fields)

On "Continue": **Server Action** `createWorkspace()` fires. Workspace record + defaults created. `workspace_id` stored in session.

### Step 2 — Agent Selection (Horizontal Scrollable Carousel)

Three agent cards horizontal flex with swipe/drag interaction:
- **Customer Support:** "Answers questions. 24/7."
- **Appointment Booking:** "Books and confirms automatically."
- **Sales:** "Qualifies leads. Follows up."

Rules:
- Minimum 1 selection required. "Continue" disabled otherwise.

### Step 3 — Security (Safety PIN)
- Field: 4-digit PIN (numeric).
- Requirement: Mandatory for Danger Zone actions.

On "Finish Setup": **Server Action** `finalizeOnboarding()` inserts `workspace_agents` rows with defaults and hashes the PIN. Redirect to `/dashboard/inbox`.

---

## 5. Mutation Architecture — Server Actions

**Binding rule:** All internal state mutations go through Server Actions in `app/actions/*.ts`. API Routes (`app/api/*`) are reserved exclusively for external inbound calls: GoWA webhooks, widget message endpoint, and Supabase `pg_net` callbacks.

This is non-negotiable and applies to every feature described below.

| Mutation | Server Action |
|---|---|
| Create workspace | `actions/workspace.ts → createWorkspace()` |
| Update workspace config | `actions/workspace.ts → updateWorkspaceConfig()` |
| Finalize onboarding | `actions/agents.ts → finalizeOnboarding()` |
| Update agent config | `actions/agents.ts → updateAgentConfig()` |
| Add agent | `actions/agents.ts → addAgent()` |
| Pause / resume agent | `actions/agents.ts → setAgentStatus()` |
| Scrape URL for KB | `actions/knowledge.ts → scrapeUrl()` |
| Upload KB document | `actions/knowledge.ts → uploadDocument()` |
| Delete KB source | `actions/knowledge.ts → deleteKbSource()` |
| Manual inbox reply | `actions/inbox.ts → sendManualReply()` |
| Resolve escalation | `actions/inbox.ts → resolveEscalation()` |
| Save contact edits | `actions/contacts.ts → updateContact()` |
| Update notifications | `actions/settings.ts → updateNotifications()` |
| Save widget config | `actions/settings.ts → updateWidgetConfig()` |
| Create manual appointment | `actions/appointments.ts → createAppointment()` |
| Reschedule appointment | `actions/appointments.ts → rescheduleAppointment()` |
| Cancel appointment | `actions/appointments.ts → cancelAppointment()` |

### Zod Validation Requirement

Every Server Action MUST define and parse a Zod schema before executing any logic. Schema definitions live in `lib/schemas/*.ts`. A Server Action that executes without first calling `schema.safeParse(input)` is a build-blocking defect.

---

## 6. WhatsApp Compliance Rules

These are non-negotiable constraints enforced at the agent orchestrator level. Violations risk Meta account bans.

### 6.1 24-Hour Response Window

**Rule:** The AI MUST NOT send any message to a customer if the customer's last inbound message is older than 24 hours.

**Enforcement:**
- The agent orchestrator reads `conversation_sessions.last_customer_message_at` before generating any response.
- If `now() - last_customer_message_at > 24 hours`: the orchestrator aborts response generation, sets `session.status = 'idle'`, and notifies the tenant via escalation log with `trigger_type = 'wa_window_expired'`.
- The AI never initiates new conversations outside this window.
- Only the human tenant can re-open a conversation outside the 24-hour window using a pre-approved WhatsApp Template Message (tenant's responsibility to register templates with Meta).

### 6.2 Artificial Typing Delay

**Rule:** The AI MUST introduce a simulated typing delay before dispatching every outbound WhatsApp message to prevent bot-detection.

**Enforcement:**
- Before calling GoWA `POST /send/message`, the orchestrator calls GoWA `POST /send/presence` with `type: "composing"` on the customer's JID.
- The typing delay is calculated as: `min(message_length_chars * 35ms, 4000ms)` — capped at 4 seconds.
- The orchestrator `await`s this delay using a calibrated `setTimeout` inside the `EdgeRuntime.waitUntil()` context (see `02-TECH-STACK.md` §4.3).
- After the delay: send the message, then call GoWA `POST /send/presence` with `type: "paused"`.

### 6.3 Message Length Throttling

- If the agent response exceeds 1,000 characters, it MUST be split into a maximum of 2 messages.
- Split point: nearest sentence boundary before the 1,000-character mark.
- Each split message gets its own typing delay cycle.

---

## 7. Web Widget — Anonymous to Contact Merge

### 7.1 Session Token Lifecycle

1. On first widget open, the widget JS generates a UUID and stores it in `localStorage` as `fc_{workspaceId}`.
2. This UUID is the `customer_jid` for widget-channel `conversation_sessions`.
3. A `contacts` row is created immediately with `channel = 'widget'`, `name = null`, `email = null`, `phone = null` — an anonymous placeholder.

### 7.2 Identity Capture and Merge

During conversation, if the AI agent captures the customer's name, email, or phone (via intent extraction or explicit capture), the orchestrator calls the `save_contact` Native Tool Calling handler with the captured data.

The `save_contact` tool executes an `UPSERT` on the `contacts` table matching `(workspace_id, session_token)` and populates the newly available fields. It does NOT create a new row.

If the customer later messages via WhatsApp (i.e., their WhatsApp JID becomes known):
- A second `contacts` row may exist for the same person (one by `session_token`, one by `whatsapp_jid`).
- **Deduplication logic:** The `save_contact` tool checks for an existing contact with matching `phone` before inserting. If a match exists, it merges the records: the WhatsApp JID row is updated with any widget-captured fields, the `session_token` row is soft-deleted, and all `conversation_sessions` referencing the old `contact_id` are re-pointed to the surviving record.

---

## 8. Dashboard Feature Specifications

### 8.1 Unified Inbox

Two-pane layout (full viewport):
- **Left pane (320px):** conversation list, real-time via Supabase Realtime, filter tabs (Needs Action / AI Handling / Resolved), search.
- **Right pane (flex-1):** conversation thread, chat bubbles, system event markers.
- Escalated session: sticky warning banner + manual reply input (active only when escalated).
- Manual reply dispatches via Server Action `sendManualReply()`.
- "Resolve" button calls Server Action `resolveEscalation()`.

### 8.2 Appointments

Conditional. Only rendered if `appointment_booking` agent is active.
- Weekly calendar view (react-day-picker).
- Appointment detail slide-over: full info, reschedule/cancel via Server Actions.
- New appointment: manual form → Server Action `createAppointment()` → Google Calendar event.

### 8.3 Insights

- Toggle: 7 days / 30 days.
- Metric cards: Messages AI Replied, Escalations, Avg Response Time (always). Appointments Booked, Leads Captured, Follow-ups Sent (conditional by agent type).
- Traffic heatmap (7×24 grid), channel split donut, top queries list.
- All data excludes `is_test = true` rows.

### 8.4 Agent Hub

- **My Agents tab:** agent card grid + "Add Agent" card.
- **Test Chat tab:** real agent pipeline, `is_test = true`, metadata panel (intent, confidence, KB chunks, tools, latency).
- **Configure tab (per agent):** shared + type-specific settings, KB management for support agents.
- **Tools tab (per agent):** read-only tool status panel, deep-links to integrations for disconnected tools.

### 8.5 Contacts

- Auto-populated table, sortable, filterable (name, phone, email, tag, channel, date).
- Contact detail slide-over: editable fields, conversation history, tags, notes.
- CSV export via Server Action (streams file to client).
- Anonymous widget contacts shown as "Unknown" until identity is captured.

### 8.6 Settings

Sub-pages: General, Profile, Workspace, Notifications, Channels (WhatsApp + Widget), Integrations (Calendar + Sheets). All mutations via Server Actions with Zod validation.

---

## 9. Out of Scope (MVP)

| Feature | Reason |
|---|---|
| Multiple WhatsApp numbers per workspace | Single GoWA session per workspace for MVP |
| Instagram / Telegram / Messenger | Post-revenue |
| Voice/audio transcription | Infrastructure complexity |
| AI-initiated broadcast campaigns | Meta compliance layer not yet built |
| Manual billing | Stripe integration deferred to post-MVP; managed via 'Request Upgrade' flow |
| Multi-user workspace | Owner-only for MVP |
| White-label / reseller | Business tier |
| Zapier / webhook integrations | Developer tier |
| Native mobile app | Responsive web sufficient |
| Custom LLM per agent | Kilo Gateway handles routing |
| Multi-language UI | English-only MVP |

---

## 10. MVP Exit Criteria

| Metric | Target |
|---|---|
| Onboarding completion rate | ≥ 75% |
| Median onboarding time | < 3 minutes |
| AI response accuracy (manual review) | ≥ 85% |
| WhatsApp response latency P95 | < 4 seconds |
| 24-hour window violation rate | 0% |
| Escalation false-positive rate | < 15% |
| Widget cold load | < 800ms |
| KB ingestion (20-page site) | < 3 minutes |
| `npm run build` passing at all times | 100% |

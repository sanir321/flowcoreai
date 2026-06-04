# Future Features

Items deferred from the immediate launch roadmap — not scoped, not scheduled.

## Draft / Co-Pilot Mode

AI proposes a reply as a draft card in the inbox thread. Human approves, edits, or rejects before sending.

- Per-session toggle: **Direct** (AI sends immediately) vs **Draft** (AI proposes, human approves)
- Three-tier escalation: Autonomous → Draft → Human-first
- Transition path: start all sessions in Draft, promote trusted types to Autonomous over time

References:
- Conduit "Proposed reply (Co-Pilot)" pattern
- `conversation_sessions.draft_mode` boolean + `draft_response` text column

## Billing & Subscriptions

Stripe / Razorpay integration with recurring plans.

- Starter / Growth / Scale tiers
- Usage-based overage billing
- Manual billing for now

## Google Calendar Sync

Two-way calendar sync for appointment bookings.

- `sync_status` column already exists on relevant tables (DB-first ordering done)
- Sync availability, push booked appointments to Google Calendar

## Google OAuth Re-Authorization

Expired Google OAuth tokens require manual re-auth via `/settings/integrations`.

- Auto-refresh for workspaces with `refresh_token` (e.g. "scluptdental")
- Manual re-connect for expired tokens
go-whatsapp-web-multidevice-production-8644.up.railway.app
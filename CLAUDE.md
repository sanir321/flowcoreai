@AGENTS.md

# Flowter (FlowCore AI) — Agent Handoff

## Project
Multi-channel AI customer service orchestration platform for SMBs. Next.js 15.5.18, React 19, Supabase (PostgreSQL 15 + pgvector), Tailwind CSS 4.

## Quick Start
```bash
npm run dev     # cross-env NODE_OPTIONS=--max-http-header-size=16384 next dev
npm run build   # next build
npm run lint    # eslint
```

## Architecture
- **Frontend:** React (Vite) + Tailwind CSS 4, Outfit/Inter fonts, dark theme (#050505), brand #c34b22
- **Backend/DB:** Supabase (PostgreSQL 15 + pgvector in extensions schema)
- **Edge Functions:** Supabase Edge Functions (Deno) — `agent-orchestrator` is the main one
- **AI:** Groq (`llama-3.3-70b-versatile`, temp 0.3, max_tokens 300)
- **Embeddings:** HuggingFace `all-MiniLM-L6-v2` (384d) via pgvector
- **Auth:** Email OTP only (Supabase Auth, no passwords)
- **Realtime:** Supabase Presence + Broadcast

## Integrations
- **WhatsApp:** GoWA self-hosted (aldinokemal/go-whatsapp-web-multidevice) — NOT Meta Cloud API
  - `src/lib/gowa.ts` — SDK wrapper
  - GoWA base URL: `https://go-whatsapp-web-multidevice-production-ba8e.up.railway.app/`
- **Gmail:** OAuth2 polling channel (expired tokens need re-auth)
- **Telegram:** Webhook-based bot
- **Slack:** Events API
- **Webchat:** Native widget (anonymous → contact merge via `customer_jid` + `channel`)

## Current Session: GoWA Webhook Fixed + Dead Code Cleaned

### What Changed
1. **GoWA webhook architecture corrected:** Webhook goes to Supabase Edge Function (`gowa-webhook`), NOT Next.js API route. The old `src/app/api/webhooks/whatsapp/route.ts` was dead code — deleted.
2. **Bug fix in `/api/gowa/status`:** Auto-upsert used `device_id: "auto-synced"` which isn't a column in `gowa_sessions` (required field is `gowa_session_id`). Fixed to use the actual GoWA device UUID from `/devices` response. Also added re-sync check when device ID changes.
3. **`gowa_sessions` seeded:** Created DB record linking GoWA device `2db8dead-ba3f-430b-8022-6b0eeab14874` (jid: `918072432187@s.whatsapp.net`) to workspace `Flowcore ai` (`7626c093-3ba5-444c-bcc6-5192fa985410`).
4. **Webhook flow verified:** Mock message → Edge Function → HMAC verify → workspace lookup → contact upsert → session create → message store → AI trigger. All passing.
5. **Docs updated:** `docs/gowa setp.txt` bumped to v2.0 with Edge Function architecture, updated payload formats, env vars, and file list.
6. **Empty dirs cleaned:** `src/app/api/webhooks/whatsapp/` and `src/app/api/webhooks/` removed.

## Key Files

### Auth & Onboarding
- `src/app/(auth)/login/page.tsx` — Combined sign-in/sign-up with terms checkbox
- `src/app/onboarding/page.tsx` — Onboarding wizard with terms + zod validation
- `src/app/actions/workspace.ts` — `checkUserExists()`, `createWorkspace()` etc.
- `src/lib/schemas/workspace.ts` — `accept_terms` validation

### Analytics (PostHog)
- `instrumentation-client.ts` — Client-side PostHog init (auto-detected by Next.js 15.3+)
- `src/lib/posthog-server.ts` — Server-side `captureEvent(distinctId, event, properties?)`
- `src/components/posthog-provider.tsx` — React wrapper (ready for identify() calls)
- `docs/posthog api.md` — Project token, setup instructions

### Email
- `src/lib/mail.ts` — SMTP via nodemailer (Gmail app password)
- `src/app/api/emails/send/route.ts` — Email sending (welcome, signin, escalation, re-engagement)
- SMTP: `zenosayz05@gmail.com` / Gmail app password in `.env.local`

### WhatsApp (GoWA)
- `src/lib/gowa.ts` — SDK (send text/image/link, presence, health, QR login, chats)
- `src/app/api/gowa/init/route.ts` — QR login initiation
- `src/app/api/gowa/status/route.ts` — Device status + auto-sync DB session
- `src/app/api/gowa/logout/route.ts` — Logout + delete GoWA devices
- `src/app/actions/gowa.ts`, `src/app/actions/whatsapp.ts` — Server actions
- `supabase/functions/gowa-webhook/index.ts` — **Webhook Edge Function** (inbound messages)
- 24-hr response window, artificial typing delay, 1000-char message split
- GoWA webhook URL: `https://bnpdrelienfnlkceluip.supabase.co/functions/v1/gowa-webhook`

### Legal Pages (7 total, public)
- `/legal/privacy-policy`, `/legal/terms`, `/legal/cookie-policy`, `/legal/refund-policy`, `/legal/dpa`, `/legal/aup`, `/legal/data-deletion`
- `src/components/legal/legal-page.tsx` — Shared layout with scrollable 7-tab nav

### Other
- `src/components/cookie-consent.tsx` — Cookie banner (localStorage, accept/reject)
- `src/app/api/user/data-export/route.ts` — Data export (service_role)
- `src/app/api/user/delete-account/route.ts` — Account deletion (all tables)
- `src/app/(dashboard)/settings/data/page.tsx` — Data & Privacy settings page
- `middleware.ts` — Security headers (X-Frame-Options, HSTS, etc.)
- `src/lib/rate-limit.ts` — IP rate limiter (30 req/min, service_role)
- `src/lib/sanitize.ts` — Prompt injection sanitization + token budget checks
- `supabase/functions/agent-orchestrator/` — Main Edge Function (Groq dispatch, tool-calling loop)
- `supabase/functions/gowa-webhook/` — Webhook Edge Function (HMAC verify, workspace lookup, message store, AI trigger)

## .env.local (Active)
```
NEXT_PUBLIC_SUPABASE_URL=https://bnpdrelienfnlkceluip.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_6wavmaqyv2hYK8a1W6AqxQ_A54WE0_M
SUPABASE_SERVICE_ROLE_KEY=eyJ... (service role)
GOWA_BASE_URL=https://go-whatsapp-web-multidevice-production-ba8e.up.railway.app/
GOWA_API_KEY=flowcore:FlowCore@2026
GOWA_WEBHOOK_SECRET=flowcoresecret2026
NEXT_PUBLIC_GOOGLE_CLIENT_ID=609930102619-...apps.googleusercontent.com
GOOGLE_CLIENT_ID=609930102619-...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GROQ_API_KEY=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
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPPORT_EMAIL=zenosayz05@gmail.com
SMTP_USER=zenosayz05@gmail.com
SMTP_PASSWORD=ehre qxsf ivpg pytv
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_qchginmvQCWDvkYjhpqySykUyprwhEwrozzbrKxibdCb
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## Remaining
1. **Google OAuth re-auth** — 2 rows for `zenosayz05@gmail.com`, both expired (May 3 & May 9), refresh returning 400 — user must re-authorize via OAuth
2. **Verify GoWA webhook in Railway** — Ensure `APP_WEBHOOK` is set to `https://bnpdrelienfnlkceluip.supabase.co/functions/v1/gowa-webhook` and `APP_WEBHOOK_SECRET=flowcoresecret2026` in the GoWA Railway deployment dashboard
3. **Uptime monitoring** — Better Uptime / Pingdom
4. **Penetration testing / vuln scanning** — schedule when ready
5. **Billing** — Stripe/Razorpay *(deferred, manual for now)*

## Constraints
- All mutations via Server Actions (no raw `req.body`)
- Zod validation on all external input
- CORS wildcard only for widget routes
- RLS on all tenant tables, soft-delete (`deleted_at IS NULL`)
- Generic error messages in API routes (no info leakage)
- MIME + 25MB size validation on file uploads
- Per-session token budget: 15k
- LLM output HTML-sanitized

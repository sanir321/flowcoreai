# FlowCore

**Multi-channel AI customer service orchestration for SMBs**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-000000?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![BluesMinds](https://img.shields.io/badge/BluesMinds-OpenAI--compatible-412991)](https://bluesminds.ai)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql)](https://postgresql.org)

FlowCore unifies WhatsApp and webchat into a single AI-powered inbox. Three specialized AI agents (booking, sales, support) handle customer conversations with 100% autonomy — verified across 217 test messages.

## AI Agents — Verified Performance

All three agents were tested end-to-end with 217 diverse customer messages. Every message was handled autonomously without human intervention.

| Agent | Tests | Handled | Rate |
|-------|-------|---------|------|
| **Booking** | 77 | 77 | **100%** |
| **Sales** | 69 | 69 | **100%** |
| **Support** | 71 | 71 | **100%** |
| **Total** | **217** | **217** | **100%** |

## Features

- **3 Specialized AI Agents** — Booking (appointment scheduling), Sales (catalog + quotes), Support (KB Q&A + escalation)
- **Multi-channel** — WhatsApp (GoWA self-hosted gateway) + Webchat widget
- **Agent handoff** — AI recognizes when it's out of depth, hands off to human agents
- **Real-time indicators** — Typing indicators (Supabase Broadcast) + active connections (Presence)
- **Knowledge base** — Semantic search with pgvector, configurable per workspace (threshold, match count, chunk truncation)
- **Appointment booking** — Google Calendar sync with proactive token refresh (pg_cron every 30 min)
- **Google OAuth** — Re-authorized with mutex-based token refresh
- **AI CEO analyst** — Business intelligence chat with structured insights
- **Rate limiting** — 30 req/min per IP (fail-closed, service_role)
- **Analytics** — PostHog event tracking
- **Security** — CSP nonces, login lockout, MFA TOTP, OAuth CSRF binding, audit logging, IDOR protection on all server actions
- **Legal compliance** — GDPR-ready, cookie consent, data export/deletion, DPA, privacy policy, terms, cookie policy, refund policy, AUP

## Architecture

```
Customer (WhatsApp/Webchat)
    ↓
GoWA (WhatsApp gateway) or Widget API
    ↓
Supabase Edge Function: agent-orchestrator
    ↓
Pipeline: T0 (instant) → T1 (cache) → T2 (router) → T3 (LLM planner + tool execution)
    ↓
3 Agents: booking | support | sales
    ↓
Tools: create_appointment, search_kb, search_products, create_support_ticket, etc.
    ↓
Dispatch: Store in DB + send via GoWA/Widget
```

### Pipeline Stages
- **T0 — Instant Reply**: Greeting detection, quick canned responses
- **T1 — Cache Check**: Session continuity, context reuse
- **T2 — Router**: Classifies intent → routes to correct agent (or skip)
- **T3 — Planner**: LLM plans actions, executes tools, retries on failure (3 attempts with backoff)

### Key Components
- **Edge Function**: `agent-orchestrator` — Deno-based, handles all AI processing
- **API Routes**: Next.js server-side (test chat, OAuth, webhooks)
- **Server Actions**: CRUD for workspaces, settings, contacts, etc.
- **Dashboard**: Inbox, Agent Hub, Contacts, Knowledge Base, Analytics, Settings
- **Widget**: Embeddable webchat widget for any website

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + Tailwind CSS 4 + Framer Motion |
| Backend | Supabase (PostgreSQL 17 + Auth + Realtime) |
| AI | BluesMinds API (OpenAI-compatible, `gpt-5-mini` + `gpt-4o`) |
| Embeddings | pgvector (384d, cosine similarity, threshold ≥ 0.35) |
| WhatsApp | GoWA (go-whatsapp-web-multidevice, self-hosted on Railway) |
| Email | Nodemailer (SMTP) |
| Analytics | PostHog |
| OAuth | Google Calendar API (auto-refresh via pg_cron) |

## Channels

| Channel | Direction | Integration |
|---------|-----------|-------------|
| WhatsApp | Bidirectional | GoWA webhook + REST API |
| Webchat | Bidirectional | Embedded widget REST API |

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project (PostgreSQL 17 with pgvector)
- BluesMinds API key (or compatible OpenAI endpoint)
- GoWA instance (for WhatsApp — Railway deployment)

### Setup

```bash
git clone https://github.com/sanir321/flowcoreai.git
cd flowcoreai
npm install
```

Copy `.env.example` to `.env.local` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key |
| `OPENAI_API_KEY` | Yes | BluesMinds API key |
| `GOWA_BASE_URL` | Yes | GoWA server URL |
| `GOWA_API_KEY` | Yes | GoWA auth (user:pass) |
| `GOWA_WEBHOOK_SECRET` | Yes | GoWA webhook secret |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Yes | Support email |
| `NEXT_PUBLIC_COMPANY_NAME` | Yes | Company name |

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy Edge Functions

```bash
supabase functions deploy agent-orchestrator
supabase functions deploy gowa-webhook
supabase functions deploy gowa-cleanup
supabase functions deploy tool-executor
supabase functions deploy ingest-document
supabase functions deploy ingest-url
supabase functions deploy crm-export
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/login            # Email OTP sign-in/sign-up
│   ├── (dashboard)/            # Main app: inbox, agents, contacts, etc.
│   ├── api/                    # API routes (widget, gowa, insights, etc.)
│   ├── actions/                # Server actions (workspace, agents, etc.)
│   ├── legal/                  # Legal pages (privacy, terms, dpa, etc.)
│   └── onboarding/             # Workspace setup flow
├── components/
│   ├── nav/                    # Navigation rail, sidebar, header
│   ├── ui/                     # Design system (shadcn-style primitives)
│   ├── appointments/           # Booking calendar UI
│   ├── contacts/               # Contact table
│   ├── insights/               # Charts and CEO analyst components
│   └── emails/                 # Email templates
├── lib/
│   ├── supabase/               # Client, server, admin, middleware
│   ├── schemas/                # Zod validation schemas
│   ├── gowa.ts                 # WhatsApp GoWA SDK
│   ├── google.ts               # Google OAuth + Calendar
│   ├── rate-limit.ts           # IP rate limiter
│   └── mail.ts                 # Nodemailer transport
├── hooks/                      # use-workspace, use-inbox, etc.
└── types/                      # TypeScript definitions

supabase/functions/
├── agent-orchestrator/         # AI orchestration (multi-agent routing)
├── gowa-webhook/               # WhatsApp inbound webhook
├── gowa-cleanup/               # Session cleanup on device removal
├── tool-executor/              # Tool execution (calendar, etc.)
├── ingest-document/            # Single doc ingestion
├── ingest-url/                 # URL content ingestion
└── crm-export/                 # CRM data export
test-results/
├── run-tests.ps1               # Support agent test runner
├── run_booking_tests.ps1       # Booking agent test runner
├── run_sales_test.ps1          # Sales agent test runner
├── booking_results.json        # Booking test results (77/77)
├── retest_sales.json           # Sales test results (69/69)
└── support_results.json        # Support test results (71/71)
```

## License

Private — All rights reserved.

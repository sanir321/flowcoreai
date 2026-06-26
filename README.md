<p align="center">
  <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDQwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJyYW5kIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNjNjVmMzkiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjYTg0YTJhIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB4PSIxMCIgeT0iMjIiIHdpZHRoPSI1NiIgaGVpZ2h0PSI1NiIgcng9IjE0IiBmaWxsPSJ1cmwoI2JyYW5kKSIvPgogIDxwYXRoIGQ9Ik0yNCAzMmgyOHY1SDI5djVoMTZ2NUgyOXYxMGg1djVIMjRWMzJ6IiBmaWxsPSIjZmZmIi8+CiAgPHRleHQgeD0iODAiIHk9IjYyIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIzOCIgZmlsbD0iIzFhMWExYSI+CiAgICA8dHNwYW4gZm9udC13ZWlnaHQ9IjcwMCI+RmxvdzwvdHNwYW4+PHRzcGFuIGZvbnQtd2VpZ2h0PSIzMDAiIGZpbGw9IiM1NTUiPkNvcmU8L3RzcGFuPgogIDwvdGV4dD4KPC9zdmc+" alt="FlowCore" width="400">
</p>

<h1 align="center">FlowCore</h1>
<p align="center"><strong>Multi-channel AI customer service orchestration for SMBs</strong></p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-15.5-000000?logo=next.js" alt="Next.js"></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white" alt="Supabase"></a>
  <a href="https://opencode.ai/zen"><img src="https://img.shields.io/badge/OpenCode%20Zen-Free%20AI%20Models-412991" alt="OpenCode Zen"></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css" alt="Tailwind CSS"></a>
  <a href="https://postgresql.org"><img src="https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql" alt="PostgreSQL"></a>
</p>

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

```

## License

Private — All rights reserved.

# Flowter

**Multi-channel AI customer service orchestration for SMBs**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-000000?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Groq](https://img.shields.io/badge/Groq-llama--3.3--70b-F97316?logo=groq)](https://groq.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql)](https://postgresql.org)

Flowter unifies WhatsApp and webchat into a single AI-powered inbox. Messages are routed through a multi-agent orchestration engine powered by Groq AI, with real-time presence, typing indicators, and smart agent handoff.

## Features

- **Multi-channel inbox** — WhatsApp (GoWA) + Webchat
- **AI orchestration** — Multi-agent supervisor + specialist handoff (max 2 handoffs)
- **Live typing indicators** — Powered by Supabase Broadcast
- **Active connections** — Real-time presence via Supabase Presence
- **CEO analyst** — Business intelligence chat with structured insights
- **Appointment booking** — Calendar sync with Google Calendar
- **Knowledge base** — Semantic search with pgvector + Supabase.ai embeddings
- **Contact management** — Unified customer profiles across channels
- **Analytics** — PostHog event tracking and insights
- **Legal compliance** — GDPR, cookie consent, data export/deletion, DPA

## Architecture

```
Channel → Webhook/Poller → DB Trigger → Queue → Edge Function → Groq AI → Outbound → Channel
```

- Messages enter via webhooks (GoWA) or direct API (webchat)
- Supabase triggers enqueue messages into `message_processing_queue`
- `agent-orchestrator` Edge Function claims items with `SKIP LOCKED`, routes through AI
- Response dispatched back through channel-specific outbound logic
- Multi-agent system: supervisor routes to specialists, supports `request_handoff` tool

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + Tailwind CSS 4 + Framer Motion |
| Backend | Supabase (PostgreSQL 17 + Auth + Realtime) |
| AI | Groq (llama-3.3-70b-versatile, temp 0.3, max 300 tokens) |
| Embeddings | Supabase.ai.Session('gte-small') (384d, pgvector) |
| WhatsApp | GoWA (go-whatsapp-web-multidevice, self-hosted) |
| Email | Nodemailer (SMTP, Gmail app password) |
| Analytics | PostHog (self-hosted or cloud) |

## Channels

| Channel | Direction | Integration |
|---------|-----------|-------------|
| WhatsApp | Bidirectional | GoWA webhook + REST API |
| Webchat | Bidirectional | Embedded widget REST API |

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project (PostgreSQL 17 with pgvector)
- Groq API key
- GoWA instance (for WhatsApp)

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
| `GROQ_API_KEY` | Yes | Groq AI key |
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
│   ├── (auth)/login          # Email OTP sign-in/sign-up
│   ├── (dashboard)/          # Main app: inbox, agents, contacts, etc.
│   ├── api/                  # API routes (widget, gowa, insights, etc.)
│   ├── actions/              # Server actions (workspace, agents, etc.)
│   ├── legal/                # Legal pages (privacy, terms, dpa, etc.)
│   └── onboarding/           # Workspace setup flow
├── components/
│   ├── nav/                  # Navigation rail, sidebar, header
│   ├── ui/                   # Design system (shadcn-style primitives)
│   ├── appointments/         # Booking calendar UI
│   ├── contacts/             # Contact table
│   ├── insights/             # Charts and CEO analyst components
│   └── emails/               # Email templates
├── lib/
│   ├── supabase/             # Client, server, admin, middleware
│   ├── schemas/              # Zod validation schemas
│   ├── gowa.ts               # WhatsApp GoWA SDK
│   ├── google.ts             # Google OAuth + Calendar
│   ├── rate-limit.ts         # IP rate limiter
│   └── mail.ts               # Nodemailer transport
├── hooks/                    # use-workspace, use-inbox, etc.
└── types/                    # TypeScript definitions

supabase/functions/
├── agent-orchestrator/       # AI orchestration (multi-agent routing)
├── gowa-webhook/             # WhatsApp inbound webhook
├── gowa-cleanup/             # Session cleanup on device removal
├── tool-executor/            # Tool execution (calendar, etc.)
├── ingest-document/          # Single doc ingestion
├── ingest-url/               # URL content ingestion
└── crm-export/               # CRM data export
```

## License

Private — All rights reserved.

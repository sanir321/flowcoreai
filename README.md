# FlowCore AI

Multi-channel AI customer service orchestration platform for SMBs. Connect WhatsApp, webchat, email, Telegram, and Slack to a single AI-powered inbox.

## Stack

- **Frontend:** Next.js 15 (App Router) + Tailwind CSS 4 + Radix UI
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **AI:** Groq (llama-3.3-70b-versatile, temp 0.3)
- **WhatsApp:** GoWA (self-hosted go-whatsapp-web-multidevice on Railway)
- **Payments:** Razorpay (India) / Stripe

## Architecture

```
Channel → Webhook/Poller → Message Queue → Edge Function → Groq AI → Outbound Router → Channel
```

- Messages enter via webhooks (Telegram, Slack, GoWA), pollers (Gmail), or direct API (webchat)
- Database triggers enqueue messages into `message_processing_queue`
- `queue-worker` Edge Function claims items with SKIP LOCKED, routes to Groq AI
- Response dispatched back through channel-specific outbound logic

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service_role key |
| `GROQ_API_KEY` | Yes | Groq AI API key |
| `GOWA_BASE_URL` | Yes | GoWA server URL |
| `GOWA_API_KEY` | Yes | GoWA auth (format: user:pass) |
| `GOWA_WEBHOOK_SECRET` | Yes | GoWA webhook verification secret |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL for redirects |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Yes | Support contact email |
| `NEXT_PUBLIC_COMPANY_NAME` | Yes | Company display name |

## Channels

| Channel | Direction | Method |
|---|---|---|
| **WhatsApp** | Bidirectional | GoWA webhook (in) + REST API (out) |
| **Telegram** | Bidirectional | Bot API webhook |
| **Slack** | Bidirectional | Events API webhook |
| **Gmail** | Inbound only | OAuth2 polling (historyId) |
| **Webchat** | Bidirectional | REST API (embedded widget) |

## Legal

- [Privacy Policy](/legal/privacy-policy)
- [Terms & Conditions](/legal/terms)
- [Cookie Policy](/legal/cookie-policy)
- [Refund Policy](/legal/refund-policy)
- [DPA](/legal/dpa)
- [Acceptable Use Policy](/legal/aup)
- [Data Deletion](/legal/data-deletion)

## Deploy

```bash
npm run build
```

Deploy to Vercel with `vercel --prod`. Edge Functions deploy via Supabase CLI.

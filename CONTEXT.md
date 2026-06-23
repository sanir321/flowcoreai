# FlowCore — Full Project Context

> Generated: 2026-06-20

---

## Project Overview

**FlowCore** is a SaaS AI customer service platform. Businesses connect a WhatsApp number (via GoWA) or embed a webchat widget, and FlowCore's AI agents handle customer conversations — booking appointments, answering support questions, and handling sales inquiries.

**Stack**: Next.js 14 (App Router) + Tailwind CSS + Supabase (PostgreSQL + Auth + Edge Functions + Realtime) + BluesMinds API (OpenAI-compatible LLM) + GoWA (self-hosted WhatsApp REST API)

**Repo**: `https://github.com/sanir321/flowcoreai`
**Supabase Project**: `bnpdrelienfnlkceluip`
**Vercel**: Auto-deploys from `master`

---

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
Tools: create_appointment, search_products, create_support_ticket, etc.
    ↓
Dispatch: Store in DB + send via GoWA/Widget
```

### Key Components
- **Edge Function**: `supabase/functions/agent-orchestrator/` — Deno-based, handles all AI processing
- **API Routes**: `src/app/api/` — Next.js server-side (test chat, OAuth, webhooks, etc.)
- **Server Actions**: `src/app/actions/` — CRUD operations for workspaces, settings, contacts, etc.
- **Dashboard**: `src/app/(dashboard)/` — Settings, Agent Hub, Contacts, Knowledge Base, Analytics
- **Public Pages**: `src/app/` — Homepage, Pricing, Features, About, FAQ, Changelog, Legal pages
- **Widget**: `src/components/widget/` — Embeddable webchat widget

---

## What Was Done (Chronological)

### Phase 1: Fix All 3 AI Agents (Commits: `c8125eb` → `eb35c76`)
- **Booking Agent (T3)**: Rewrote planner model, fixed tool schemas (`additionalProperties: false` for Azure OpenAI), added retry logic (3 attempts with backoff), regex-first extraction for name/email/phone/date/time with 25+ date patterns
- **Support Agent**: KB vector search via `match_kb_chunks` RPC, ticket creation
- **Sales Agent**: Menu search, pricing, quote generation
- **All agents verified**: 5/5 success rate each via direct edge function invocation

### Phase 2: UI Fixes (Commit: `3f07a90`)
- Rewrote all 8 `loading.tsx` files (were showing wrong branding "Conduit" instead of "FlowCore")

### Phase 3: Branding & Cleanup
- Replaced all "Conduit" references with "FlowCore" (`6d46f50`)
- Removed debug `console.log` from production code (`f5ac311`)
- Added WhatsApp to settings sidebar (`3dabd30`)
- Removed Gmail references from all public pages (`ca6ae3c`, `97672fe`)
- Removed unused UPI ID field from workspace settings (`05d34f6`)
- Matched onboarding industry options to settings (`8e1ef18`)

### Phase 4: Security Audit & Hardening (Commits: `3472ada` → `c5b3f8b`)
**7 commits fixing ~40+ vulnerabilities across the entire codebase:**

#### Critical Fixes
- **IDOR vulnerabilities**: All 7 server actions now verify `workspace_id` belongs to the authenticated user
- **SSRF**: `ingest-url` blocks IPv6, prevents DNS rebinding via validation endpoint
- **OAuth CSRF**: Google OAuth callback now verifies HMAC-signed state with nonce binding
- **Error leak prevention**: All edge functions and server actions sanitize errors — no stack traces or internal details leak to users

#### High Fixes
- **CSP nonce**: Every request gets a unique nonce for inline scripts
- **Login lockout**: 5 failed attempts in 15min → 30min lockout (DB-tracked)
- **Rate limiter**: Changed to fail-closed (denies requests if table unavailable)
- **JWT secret**: Removed hardcoded fallback — now fails fast if missing
- **Admin client**: Lazy initialization (no module-level key exposure)
- **Delete account**: Now requires email OTP re-authentication
- **MFA TOTP**: Settings → Security page for enrollment
- **PostgREST injection**: All user input sanitized for `.ilike()` filters
- **Wildcard CORS**: Replaced with environment-based origins on all edge functions
- **Widget CORS**: Deny-by-default when no `allowed_domains` configured

#### Medium Fixes
- **CSV injection**: Formula-triggering characters prefixed with single quote
- **HTML injection**: User input escaped in email templates
- **HMAC timing**: Google OAuth signature uses `timingSafeEqual`
- **Session tokens**: Regenerated on privilege change
- **User enumeration**: Login/signup errors return identical messages
- **Debug variable**: Removed hardcoded `debugUserId`

#### Database Changes
- **Tables**: `login_attempts` (24h TTL), `security_audit_log` (90d TTL), `audit_logs` (1yr TTL with workspace RLS)
- **RPCs**: `check_login_lockout`, `record_login_attempt`, `sanitize_allowed_domain`
- **Edge functions**: `@supabase/supabase-js` updated to `2.108.1` (was `2.39.7`)

### Phase 5: SEO/AEO/GEO/GSC Optimization (Commits: `42ec1c9` → `8b313b3`)

#### SEO (Commit: `42ec1c9`)
- `sitemap.ts`: Dynamic sitemap with 14 public routes, lastmod dates
- `robots.ts`: AI crawlers unblocked (only Bytespider blocked)
- Homepage/pricing: Server wrappers with metadata + JSON-LD structured data
- Dynamic OG images via `/api/og` edge route (ImageResponse)
- Per-page metadata on all 7 legal pages
- FAQ page: FAQPage JSON-LD schema
- Auth layout: `noindex, nofollow`

#### AEO/GEO (Commit: `195e8a5`)
- Removed stale static `sitemap.xml` that blocked AI crawlers
- Removed broken `SearchAction` structured data
- Removed duplicate FAQPage schema from homepage
- Added `Product` schema (SoftwareApplication) on homepage
- Created `/features` page with `HowTo` + `ItemList` schemas
- Created `/about` page with `AboutPage` schema
- All public pages have proper `og:title`, `og:description`, `og:image`, Twitter card meta

#### GSC (Commit: `8b313b3`)
- Fixed broken `/login` link in navigation
- Removed faked `aggregateRating`/`review` from Product schema
- Removed empty `sameAs` array from Organization schema
- Created branded 404 page with home link
- Added `apple-touch-icon` + `manifest.webmanifest` (PWA support)
- Added `viewport` export to layout
- Created shared `PublicNav` + `PublicFooter` components
- Cross-linked all pages (landing → features/pricing/legal)

### Phase 6: TypeScript Fixes (Commits: `a966839` → `a8efe4a`)
- Fixed pre-existing TS errors blocking Vercel build:
  - `knowledge.ts`: `(source as any)` casts for type mismatches
  - `google/callback/route.ts`: Typed state as `[string, string, string]`
  - Replaced `require('node:crypto')` with proper import in Google callback
  - Removed unused `siteName` import in layout

### Phase 7: Landing Page & UI Polish (Commits: `8990b8f` → `8e1ef18`)
- Added features section + nav link to landing page
- Fixed greeting guard regex (only triggers on actual greetings, not words containing "hi" like "this")
- Fixed `const` reassignment crash in T3 planner (`const` → `let` for `agentType`)
- Fixed hardcoded `'samir'` in `nonBookingSignals` booking FSM

### Phase 8: Test Chat Fix (Commit: `4cbf40c`)
**Root cause**: Edge function catch blocks return 200 with `{ error: "Internal error" }` in body. `supabase-js` maps this to `aiError`, causing the API route to throw 500.

**Fixes**:
- **Edge function** (`index.ts`): Extract `agent_type` from request body in `parseWebhook`
- **T2 router** (`t2-router.ts`): Check `ctx.payload.agent_type` first for widget channel — ensures test chat agent type is respected
- **Dispatch** (`dispatch.ts`): Outbound messages include `is_test: ctx.payload.is_test || false`
- **API route** (`route.ts`): Graceful handling of edge function errors (returns friendly JSON instead of 500); 30s AbortController timeout on `functions.invoke`; detailed `[TEST_MSG]` logging
- **Types** (`types.ts`): Added `agent_type?: string` to `WebhookPayload`

### Phase 9: Knowledge Base & Multi-Tenant Fixes (Commits: `fab5a34` → `aeb44dd`)
- **Support agent RAG-first**: KB chunk retrieval moved to T3 planner, injected directly into system prompt with STRICT GROUNDING rules — no forced tool round-trip
- **KB threshold lowered**: 0.75 → 0.35 with hybrid search (vector + keyword fallback)
- **Batch embedding pipeline**: embed-text processes 3 chunks/invocation, self-triggers next batch via `triggerEmbedBatch` using direct `fetch()` with `SUPABASE_ANON_KEY`
- **All 9/9 chunks embedded**: Webuild source fully active
- **KB context truncation**: 600→800 chars + noise stripping (configurable per workspace)
- **Multi-tenant KB config** (`fix1.md`): Added `kb_config` JSONB column to `workspaces` — `match_count`, `match_threshold`, `chunk_truncation`, `noise_stripping` all configurable per workspace
- **All hardcoded fallbacks removed**: `STATIC_FALLBACK_MESSAGE` replaced with workspace `guardrail_config.fallback_message` or generic default
- **RLS audit passed**: All tables have workspace-scoped policies; `match_kb_chunks` RPC enforces isolation via `p_workspace_id`
- **Second workspace (Tasty Bistro) tested**: Full multi-tenant isolation confirmed — no cross-workspace leakage
- **Google Calendar working**: Booking → `create_appointment` → Google Calendar event created with proactive token refresh cron (pg_cron every 30 min)
- **LLM timeout**: 30s→60s in `lib/llm.ts`; support agent uses `gpt-4o` (faster for KB context)
- **KB file upload API**: Created `/api/kb/upload` route
- **Appointments UI**: Google Calendar sync status column added
- **extract-business-profile**: Fixed model name (`nemotron-3-ultra-free`), 90s AbortController timeout, scoping issues; deployed and verified (batch mode returns correct results)
- **Landing page polish**: Product screenshot, unified CTAs, removed Smol section, Talk to Sales → Pricing page

---

## Verified Working

### Live Verification (as of this session)
- `robots.txt`: ✅ Only Bytespider blocked
- `sitemap.xml`: ✅ 14 pages with dynamic dates
- `manifest.webmanifest`: ✅ PWA manifest served
- `/features` page: ✅ Full content with shared nav + footer
- Structured data: Organization, WebSite, SoftwareApplication, Product (global); HowTo, ItemList (features); FAQPage (faq); AboutPage (about)
- All 44 pages: ✅ Render properly
- All 9 server actions: ✅ Work
- All 3 agents: ✅ 5/5 success rate each
- TypeScript: ✅ 0 errors
- ESLint: ✅ 0 errors, 1 pre-existing warning
- Vercel deployment: ✅ Build succeeds
- npm audit: ✅ 0 CVEs
- **extract-business-profile**: ✅ Deployed and verified (batch mode works)
- **Google OAuth**: ✅ Re-authorized, working with proactive token refresh

---

## Key Technical Decisions

| Decision | Rationale |
|---|---|
| BluesMinds API (`gpt-5-mini` + `gpt-4o`) | Only two models that work — all others fail (401/400) |
| `additionalProperties: false` on tool schemas | Required by Azure OpenAI / BluesMinds |
| Regex-first extraction for booking | LLM returns wrong values by extracting from conversation history |
| Fuzzy matching (Dice ≥ 0.4) for product lookup | Handles typos; synonyms per business don't scale for SaaS |
| Fail-closed rate limiter | Safety-first: deny if rate limit unavailable |
| Lazy admin client initialization | Avoids module-level key exposure |
| `supabase` CLI for deploys | API deploy tool unreliable (hangs/deploys empty) |
| `is_test: true` flag on test messages | Distinguishes test messages from real customer messages |
| Widget channel: check `agent_type` from payload first | Test chat sends explicit agent type; real WhatsApp uses session continuity |

---

## File Reference

### Critical Path Files
- `supabase/functions/agent-orchestrator/index.ts` — Edge function entry point
- `supabase/functions/agent-orchestrator/pipeline/t2-router.ts` — Agent routing logic
- `supabase/functions/agent-orchestrator/pipeline/t3-planner.ts` — LLM planner + tool orchestration
- `supabase/functions/agent-orchestrator/agents/booking.ts` — Booking FSM with regex extraction
- `supabase/functions/agent-orchestrator/agents/support.ts` — Support agent
- `supabase/functions/agent-orchestrator/agents/sales.ts` — Sales agent
- `supabase/functions/agent-orchestrator/lib/types.ts` — Shared types including `WebhookPayload`
- `supabase/functions/agent-orchestrator/lib/dispatch.ts` — Message dispatch (DB + WhatsApp/Widget)
- `supabase/functions/agent-orchestrator/lib/llm.ts` — LLM fallback chain
- `supabase/functions/agent-orchestrator/lib/session.ts` — Session management
- `supabase/functions/agent-orchestrator/tools/registry.ts` — Tool definitions
- `supabase/functions/agent-orchestrator/tools/executor.ts` — Tool execution
- `supabase/functions/agent-orchestrator/guards/*.ts` — All guard modules

### API Routes
- `src/app/api/agent-hub/test-message/route.ts` — Test chat endpoint (FIXED in latest)
- `src/app/api/auth/google/callback/route.ts` — OAuth callback with CSRF
- `src/app/api/widget/message/route.ts` — Widget message handling with rate limiting
- `src/app/api/og/route.tsx` — Dynamic OG image generation

### Server Actions
- `src/app/actions/workspace.ts` — CRUD, onboarding, checkUserExists
- `src/app/actions/business-profile.ts` — Profile management
- `src/app/actions/knowledge.ts` — KB document management
- `src/app/actions/contacts.ts` — Contact management
- `src/app/actions/appointments.ts` — Appointment management
- `src/app/actions/settings.ts` — Workspace settings
- `src/app/actions/agents.ts` — Agent configuration
- `src/app/actions/inbox.ts` — Message management

### Public Pages
- `src/app/page.tsx` + `src/app/home-client.tsx` — Landing page with features section
- `src/app/pricing/page.tsx` — Pricing
- `src/app/features/page.tsx` — Features (HowTo + ItemList schemas)
- `src/app/about/page.tsx` — About (AboutPage schema)
- `src/app/faq/page.tsx` — FAQ (FAQPage schema)
- `src/app/changelog/page.tsx` — Changelog
- `src/app/not-found.tsx` — Branded 404
- `src/app/legal/*/page.tsx` — 7 legal pages (privacy, terms, cookies, refund, DPA, AUP, data-deletion)

### Infrastructure
- `vercel.json` — maxDuration 30s, sin1 region, cron for GoWA health
- `src/middleware.ts` — CSP nonce, security headers, cookie-size guard
- `src/lib/rate-limit.ts` — IP rate limiter (30 req/min, fail-closed)
- `src/lib/google.ts` — Google OAuth with mutex token refresh
- `src/lib/supabase/server.ts` — Server client (async `createClient()`)
- `src/lib/supabase/admin.ts` — Lazy admin client (service_role)
- `src/components/public-nav.tsx` — Shared PublicNav + PublicFooter
- `src/components/seo/structured-data.tsx` — JSON-LD schemas

---

## Environment

### Required Secrets (Supabase Edge Function)
- `OPENAI_API_KEY` — BluesMinds API key
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — Supabase credentials
- `GOWA_BASE_URL` / `GOWA_API_KEY` / `GOWA_WEBHOOK_SECRET` — WhatsApp gateway

### Vercel Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Client-side Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side admin operations
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` — OAuth
- `NEXT_PUBLIC_APP_URL` — Site URL for metadata/OG
- `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` — Email delivery (SMTP)

### Supabase Edge Function Secrets
- `OPENCODE_ZEN_API_KEY` / `OPENCODE_ZEN_BASE_URL` — Free AI models (OpenCode Zen)
- `OPENCODE_ZEN_API_KEY` + `OPENCODE_ZEN_BASE_URL` — OpenCode Zen (free AI models, replaced BluesMinds)
- `INTERNAL_CRON_SECRET` — Internal cron job auth

### Key URLs
- GoWA: `https://go-whatsapp-web-multidevice-production-8644.up.railway.app/`
- Supabase: `https://bnpdrelienfnlkceluip.supabase.co`
- Edge Function: `https://bnpdrelienfnlkceluip.supabase.co/functions/v1/agent-orchestrator`

---

## Test Workspace

- **Business**: `Webuild LLP`
- **Workspace ID**: `53ae24d7-33ea-4af8-a414-5b6635cd2e1c`
- **Services**: `services_offered` is a **comma-separated string** (not JSON array)
- **User**: `zenosayz05@gmail.com`
- **Google OAuth**: Tokens refreshed proactively via pg_cron every 30 min

---

## Known Issues

1. **Docker unavailable** — Supabase types cannot be regenerated; new RPC calls use `(supabase as any)` cast
2. **Pre-existing TS errors fixed** via `as any` casts — may need proper typing later
4. **ESLint**: 1 pre-existing warning (unused variable) — not an error

---

## Git Log (Last 30 Commits)

```
f20fa04 chore: add CONTEXT.md and google-token-refresh function to tracking
aeb44dd fix: extract-business-profile deploy, KB embed-text param, Google Sync column, landing audit notes
5ea57fc fix: point Talk to Sales button to pricing page
c91bbd9 fix: real screenshot in hero, unify CTAs to Get Started, drop Smol section
04f4823 fix: add product screenshot + finish sitewide credibility cleanup
c2a5bb3 fix: landing page positioning + credibility fixes
c5f783e fix: LLM timeout + gpt-4o for support agent + KB upload API
818bea8 fix: multi-tenant KB config + generic fallbacks (fix1.md)
aee672c fix: optimize KB context truncation to 800 chars
ae405bc fix: KB context truncation + noise stripping for clean context
a91405a fix: batch embed chain — direct fetch() for triggerEmbedBatch
fab5a34 fix: support agent RAG-first, booking servicesList bug, batch embed pipeline
4cbf40c fix: test chat - edge function error handling and agent routing
8e1ef18 fix: match onboarding industry options to settings (12 + other)
05d34f6 fix: remove unused UPI ID field from workspace settings
3dabd30 fix: add WhatsApp to settings sidebar nav
97672fe fix: remove email references from features page
ca6ae3c fix: remove Gmail references — not an active feature
8990b8f feat: add features section and nav link to landing page
a8efe4a fix: replace require() with proper import in google callback
a966839 fix: resolve pre-existing TypeScript errors blocking Vercel build
267f6f0 fix: remove unused siteName import in layout
8b313b3 gsc: comprehensive Google Search Console optimization
195e8a5 aeo/geo: comprehensive Answer Engine Optimization overhaul
42ec1c9 seo: comprehensive SEO overhaul
c5b3f8b security: OAuth CSRF binding, delete re-auth, MFA, SSR upgrade
0ffe492 fix: cast supabase RPC calls to bypass missing typegen (Docker unavailable)
f25414f security: CSP nonce, login lockout, audit logging
63c9af8 security: update supabase-js, enforce widget CORS deny-by-default, add logout endpoint
84c7452 fix: comprehensive security hardening — error leaks, injection, XSS
4cca9d8 fix: remaining security hardening — SSRF, race condition, user enumeration
8bdca33 fix: security hardening — IDOR fixes, filter injection, CSP, rate limiter fail-closed
73f615b fix: remaining audit issues — broken import, CORS, unused imports, debug variable
3472ada fix: security audit remediation — CRITICAL + HIGH + MEDIUM fixes
f5ac311 chore: remove debug console.log from production code
6d46f50 fix: replace old 'Conduit' branding with 'FlowCore'
6a9ec6b fix: add IDOR checks to business-profile actions, fix widget unmount guard
d107968 fix(booking): improve date/time regex extraction
eb35c76 fix: agent-orchestrator LLM fallback chain, tool schemas, and T3 retry logic
c8125eb Fix booking FSM: fuzzy matching, validation, retry persistence, templates
```

---

## Agent Verification Results (2026-06-20)

All three AI agents were tested end-to-end with blind concurrency (8 parallel requests) against the production edge function. Every test used real BluesMinds API calls through the full T0→T1→T2→T3 pipeline.

| Agent | Messages | Handled | Rate | Error |
|-------|----------|---------|------|-------|
| Booking | 77 | 77 | **100%** | 0 |
| Sales | 69 | 69 | **100%** | 0 |
| Support | 71 | 71 | **100%** | 0 |
| **Total** | **217** | **217** | **100%** | **0** |

- Test scripts: `test-results/run_booking_tests.ps1`, `test-results/run_sales_test.ps1`, `test-results/run-support-test.ps1`
- Results: `test-results/booking_results.json`, `test-results/retest_sales.json`, `test-results/support_results.json`
- All tests used `is_test: true` flag via the widget channel with explicit `agent_type`

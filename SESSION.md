# Flowter Session File

Last updated: 2026-08-02 (session: audit remediation, Phases 0–5, "fix all one by one")

## Objective
Fix all audit findings one by one, from a consolidated 31-item remediation plan (Phases 0–5). Phase 1 (P1.1–P1.7) COMPLETE. Phase 2 advisory-recovered fixes (P2.8–P2.9) COMPLETE. Original P2.8–P2.13 item list not persisted in repo — remaining work derived from live advisor re-runs.

## Important Project Facts
- Working dir: `C:\flowter`. Repo: git `master`. Branch strategy: work on `master`.
- Frontend: React (Vite) + Tailwind CSS 4 per CLAUDE.md, but repo is actually **Next.js 15 App Router** (`src/app`), React 19, TS 5.9.3, `@supabase/ssr 0.12.0`, supabase-js 2.108.1, vitest 3.2.6.
- Backend/DB: Supabase (PostgreSQL). Project: **bnpdrelienfnlkceluip** (ref `bnpdrelienfnlkceluip`, region us-west-1).
- AI Core: Groq AI (llama-3.3-70b-versatile). Realtime: Supabase Presence/Broadcast.
- WhatsApp: GoWA (self-hosted go-whatsapp-web-multidevice) via Railway. SDK: `src/lib/gowa.ts`. Env: GOWA_BASE_URL, GOWA_API_KEY (user:pass → Basic auth), GOWA_WEBHOOK_SECRET.
- `createAdminClient()` = SUPABASE_SERVICE_ROLE_KEY, `autoRefreshToken:false`, `persistSession:false`.
- Rate limiting: 30 req/min per IP via `rate_limits` table (service_role only). `src/lib/rate-limit.ts`.

## Live DB Security State (verified via execute_sql)
SECURITY DEFINER + `set search_path=''`, NOT executable by public/anon/authenticated, service_role-executable:
- `check_login_lockout(p_email text, p_ip text, p_max_attempts integer, p_window_minutes integer, p_lockout_minutes integer)`
- `record_login_attempt(p_email text, p_ip text, p_success boolean)`
- `decrement_credits(p_workspace_id uuid, p_credits integer)`
- `process_webhook_message(uuid, text, text, text, text, jsonb, text, text, text, text)`

New this session (also hardened, service_role-only):
- `purge_workspace(p_workspace_id uuid)` — hard-deletes all workspace-scoped rows in FK-safe order in one transaction.
- `get_public_appointment(p_appointment_id uuid)` — SECURITY DEFINER, `search_path=''`, granted to **anon, authenticated** (intentional; returns only public appointment fields + workspace name/address, no secrets).

## FK / Schema Facts (verified live)
- **No FKs reference `auth.users`.** **No FKs inbound to `workspaces`** (workspace-id children must each be deleted explicitly in purge).
- Inter-table FK delete order used by `purge_workspace`:
  1. `agent_skill_assignments` (→workspace_agents/agent_skills)
  2. `kb_chunks` (→kb_sources)
  3. `messages`, `tool_call_logs`, `failed_messages`, `agent_traces` (→conversation_sessions)
  4. `booking_sessions` (→conversation_sessions + appointments)
  5. `appointments`, `follow_ups`, `quotes`, `orders`, `support_tickets`, `escalation_logs` (→contacts / conversation_sessions)
  6. `notification_reads` (via `notifications`), `notifications`
  7. `conversation_sessions`, `workspace_agents`, `kb_sources`, `kb_response_cache`, `ingestion_jobs`, `contacts`, `workspace_notifications`, `widget_config`, `gowa_sessions`, `google_oauth_tokens`, `billing_transactions`, `agent_skills`, `rate_limits`, `audit_logs`, `callback_queue`, `menu_items`, `menu_media`, `business_templates`
  8. `workspaces`

## Auth / Middleware Facts
- `src/middleware.ts`: Next.js edge middleware, validates session via `createServerClient`, injects CSP nonce, sets security headers, route protection.
- `publicApiRoutes = [/api/emails/send, /api/waitlist, /api/pricing/request, /api/og, /api/health]` via `isPublicApiRoute`.
- `isInternalApiRoute` = `/api/*` minus `/api/widget/`, `/api/webhooks/`, `/api/internal/`, `/api/auth/google/`, and public API routes → session-gated, returns 401 JSON if no user.
- `publicRoutes`: `/`, `/login`, `/faq`, `/changelog`, `/legal`, `/pricing`, `/features`, `/about`, `/blog`, `/waitlist`, `/case-studies`, `/sitemap`, `/auth/callback`.
- Dashboard routes: `/inbox`, `/agent-hub`, `/knowledge`, `/contacts`, `/settings`, `/insights`, `/appointments`, `/orders`, `/ceo` → redirect to `/login` if no user; to `/onboarding` if no workspace.
- No `/menu` page route exists (only `/api/menu` + `/api/menu/upload`, session/workspace-gated in-route → keep middleware session gate).

## Phase 2 (advisory-recovered) — COMPLETE
Phase 2 items could NOT be recovered from the 31-item plan (not persisted). Reconstructed from live advisor findings (re-run 2026-08-02) and fixed the two actionable ones:
1. **P2.8** `multiple_permissive_policies` on `workspace_agents` (performance WARN). Root cause: `wa_workspace_rls` was `FOR ALL` with USING only (WITH CHECK NULL) so INSERT/UPDATE needed separate owner policies added by `20260720000001_add_rls_insert_policies.sql`. Fix: consolidated into a single `wa_workspace_rls` FOR ALL policy with explicit USING + WITH CHECK (uses `(select auth.uid())` InitPlan-safe pattern). Migration `supabase/migrations/20260802000004_consolidate_workspace_agents_rls.sql` (applied live). Now exactly 1 policy on the table.
2. **P2.9** Advisory-lock RPCs exposed. Root cause: `20260630000002_revoke_public_advisory_locks.sql` revoked only from `anon, authenticated` — `PUBLIC` still held EXECUTE, so inheritance kept them open (anon/authenticated `anon_security_definer_function_executable` + `function_search_path_mutable` WARNs). Fix: revoked from `public, anon, authenticated`; recreated wrappers with `set search_path=''`; granted EXECUTE only to `service_role` (only caller = `google-token-refresh` edge function, verified uses `SUPABASE_SERVICE_ROLE_KEY`). Migration `supabase/migrations/20260802000005_harden_advisory_lock_rpcs.sql` (applied live). Verified live: anon/auth/public all `no`, service_role `YES`, `proconfig=[search_path=""]`.
3. **P2.10** `auth_leaked_password_protection` disabled — NOT APPLICABLE (closed by user 2026-08-02). Flowter uses email-OTP login only; no password auth anywhere, so HaveIBeenPwned leak checking is moot. No action.
Remaining advisor findings after Phase 2 are all non-actionable (verified 2026-08-02):
- `pg_net` extension `extension_in_public` WARN — CONFIRMED UNFIXABLE. `pg_net.extrelocatable=false`; `alter extension pg_net set schema net` fails `55000: cannot move extension "pg_net" into schema "net" because the extension contains the schema`. All pg_net objects (functions + tables) already live in the `net` schema, NOT in `public` (0 pg_net relations in public verified). Every reference (cron `net.http_post`/`net.http_get`, migrations `20260622000001`, `20260624000001`) is `net.`-qualified. False positive — nothing actually exposed in public.
- `get_public_appointment` anon/authenticated SECURITY DEFINER execute (INTENTIONAL — public booking page; returns only public appointment fields, `search_path=''`).
- `auth_leaked_password_protection` disabled — NOT APPLICABLE (email-OTP only, no passwords; closed by user 2026-08-02). No action.
- `unused_index` INFOs (9 covering indexes, all `idx_scan=0` in pg_stat_user_indexes): `idx_notification_reads_notification_id`, `idx_agent_skill_assignments_skill`, `idx_booking_sessions_appointment`, `idx_appointments_workspace`, `idx_booking_sessions_workspace`, `idx_callback_queue_workspace`, `idx_kb_sources_agent`, `idx_kb_sources_workspace`, `idx_appointments_start_at` — all added 2026-05-13+ for unindexed FKs; tables are low-traffic (seq scans win at this size). Do NOT drop.

## Phase 1 (P1.1–P1.7) — COMPLETE
1. **P1.1** Drop unused `increment_credits` RPC. Created `supabase/migrations/20260802000003_drop_increment_credits.sql` (fresh-deploy parity; live already lacks it). Zero callers in `src/`. Only unhardened def was in `20260516182220_add_razorpay_columns.sql:21-31`.
2. **P1.2/P1.3** PUBLIC/anon/authenticated revokes on SECURITY DEFINER RPCs in migration files (fresh-deploy gap; live already hardened):
   - `20260618000003_security_hardening_v3.sql`: revokes now target `public, anon, authenticated`; added `process_webhook_message` revoke.
   - `20260624000002_revenue_workflow_fixes.sql`: added `revoke ... from public, anon, authenticated` + `grant ... to service_role` AFTER the `CREATE OR REPLACE process_webhook_message` (was re-granting PUBLIC on fresh deploys).
3. **P1.4** Middleware: added `/api/og`, `/api/health` to `publicApiRoutes`; added `/api/auth/google/` exclusion in `isInternalApiRoute`; added `/blog`, `/waitlist`, `/case-studies`, `/sitemap` to `publicRoutes`.
4. **P1.5** `src/app/actions/workspace.ts:225-251`: `checkUserExists` now paginates `auth.admin.listUsers({ page, perPage: 200 })` with case-insensitive local email match (replaces dropped `filters:{email}` param).
5. **P1.6** `get_public_appointment(uuid)` RPC — migration `supabase/migrations/20260802000001_add_public_appointment_rpc.sql` (applied live). `src/app/appointment/[id]/page.tsx` switched from `createAdminClient()` to `createClient()`; uses `.rpc("get_public_appointment", { p_appointment_id: id })` in both `generateMetadata` and page body; `workspace_name`, `workspace_address`, `customer_name`, `service`, `start_at`, `meeting_link` come from return row (types regenerated).
6. **P1.7** `purge_workspace(uuid)` SECURITY DEFINER RPC — migration `supabase/migrations/20260802000002_purge_workspace.sql` (applied live as `20260802022719`). `src/app/api/user/delete-account/route.ts` rewired: session-gated POST → rateLimit → `getUserWorkspaceId` (DB lookup, not stale JWT) → workspace existence guard → fetch GoWA device IDs → `admin.rpc("purge_workspace")` (hard delete, abort 500 on error) → GoWA device logout/delete (best-effort) → `admin.auth.admin.deleteUser(user.id)`.

## Commits (master)
- `77de78c` fix: move OTP login to server actions with service-role lockout (M1 auth fix).
- `222eca9`, `0782b0d`, `e35d7b1`, `dc6b1b4`, `d35f7ca`, `0860f39`, `a9c3c55`, `69a65d8`, `22cfbb8`, `c70965e`, `49cec81`, `a7f2754`, `cf8cdfa`, `2b67032` — earlier work (see `git log`).

## Verification Status
- **Types**: Regenerated `src/types/supabase.ts` from live DB (includes `get_public_appointment` + `purge_workspace` RPC signatures). Was wrapped in JSON from MCP — must strip via `ConvertFrom-Json` + `$obj.types` if regenerating via tool output file.
- **Typecheck**: `npx tsc --noEmit` → ZERO errors in `src/`. Only pre-existing untracked errors in `tests/` (mock missing `onAuthStateChange`, `@playwright/test` not installed, `noImplicitAny` in e2e specs).
- **Lint**: `npm run lint` → ZERO errors/warnings in `src/`. Remaining errors/warnings all in untracked `tests/` files (`tests/helpers/mocks.ts`, `tests/e2e/*.spec.ts`, `tests/api/user-export-contacts.test.ts`).
- **Advisors (security, re-run after Phase 2)**: ONLY intentional/pre-existing — `get_public_appointment` anon/authenticated execute (INTENTIONAL), `pg_net` in public schema (pg_cron dependency), leaked-password protection disabled (Auth config, dashboard-level, left for user). Advisory-lock `anon/authenticated_security_definer` + `function_search_path_mutable` findings CLEARED.
- **Advisors (performance, re-run after Phase 2)**: `multiple_permissive_policies` on `workspace_agents` CLEARED (single FOR ALL policy). Only `unused_index` INFOs remain on the recent covering indexes (added 2026-05-13+; not yet in the 30-day usage sample — keep).

## Next Steps
- Report Phase 2 completion to user. All SQL-actionable advisor findings are fixed and verified live.
- Remaining advisor findings are non-actionable by SQL (see Phase 2 section): `pg_net` in public (unfixable, false positive), `get_public_appointment` (intentional), unused_index INFOs (keep), leaked-password protection (NOT APPLICABLE — email-OTP only, no passwords).
- Optional: commit Phase 1 + Phase 2 migration files on `master` (respect untracked-file exclusions) if user wants a checkpoint.
- Original P2.10–P2.13 item list (if it differs from the above) requires the 31-item plan source from the user.

## Critical Paths (from CLAUDE.md)
- `src/lib/gowa.ts`: WhatsApp Gateway SDK — HANDLE WITH CARE, no other way to reach WhatsApp.
- `src/lib/rate-limit.ts`: IP rate limiter via `rate_limits` table (service_role only).
- `src/app/(auth)/login/page.tsx`: Combined sign-in/sign-up with terms checkbox (uses `checkUserExists`).
- `src/app/actions/workspace.ts`: `checkUserExists`, `createWorkspace`, etc.
- GoWA webhook: configure in GoWA admin > Webhooks → `/api/gowa/init` for message receiving.
- GoWA Base URL: Railway deployment. If GoWA goes down, WhatsApp stops.
- KB Vectorization: pgvector + `match_kb_chunks` RPC (truncation fallback at 1000 chars).

## Untracked Files (do not commit unless asked)
- `PROJECT.md`, `TEST_INFRA.md`, `test-output.txt`, `tests/` dir, `.agents/` dir, `test-results/`.

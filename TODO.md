# SaaS Launch Checklist

## Remaining (requires manual action)
- [ ] **Google OAuth re-auth** — Re-authorize Google for workspaces with expired tokens via `/settings/integrations`. "scluptdental" has refresh_token (auto-refresh working). If auto-refresh fails, user will see "Google session expired" and must re-connect.
- [ ] **Uptime monitoring** — Set up Better Uptime / Pingdom pointing at `https://flowter-bay.vercel.app/api/health` (endpoint returns `{"status":"ok"}`)
- [ ] **Separate shared secrets** — `GOWA_WEBHOOK_SECRET` and `INTERNAL_CRON_SECRET` currently share the same value (`flowcoresecret2026`). Rotate one to a different value in `.env.local` and deployed env vars.
- [ ] **npm audit** — 2 moderate vulns remain (PostCSS via Next.js). Requires Next.js upgrade.

## Deferred
- [ ] Billing — Stripe/Razorpay integration *(manual billing for now)*
- [ ] Subscription plans (Starter/Growth/Scale) with recurring billing
- [ ] Drafting mode — AI suggestion/draft for human approval before sending
- [ ] Google Calendar sync_status — DB-first ordering done, column already exists

## Done
- [x] Terms checkbox on signup/sign-in (new users only)
- [x] RLS enabled on rate_limits table
- [x] README.md — replaced boilerplate with project docs
- [x] Legal pages: Cookie Policy, Refund Policy, DPA, AUP, Data Deletion (all 5 created)
- [x] LegalPage nav updated with all 7 scrollable tabs
- [x] Cookie Consent banner — component with accept/reject, added to root layout
- [x] User Data Export & Deletion — API routes + Settings Data & Privacy page
- [x] Settings nav — added Data & Privacy tab
- [x] SMTP/Email — Gmail app password configured, 5 email templates exist
- [x] DB indexes — 12 FK covering indexes added
- [x] RLS InitPlan — auth.uid() → (select auth.uid()) in all policies
- [x] Removed 8 stale unused indexes
- [x] FAQ page at /faq
- [x] Changelog page at /changelog
- [x] PostHog fully set up — instrumentation-client.ts, posthog-node, server helper, autocapture active
- [x] Public /api/health endpoint created for uptime monitoring
- [x] Google OAuth token — scluptdental workspace has refresh_token (auto-refresh)
- [x] Supabase migrations directory — initial schema tracked
- [x] Agent ecosystem hardening — prompts, validatePlanActions, escalation flow, create_ticket tool, LLM fallback loop, pipeline/guards architecture
- [x] Security Round 1 (Critical) — Auth on Edge Functions, SSRF blocking, OR injection fix, widget IDOR, OAuth signed state, npm audit
- [x] Security Round 2 (High) — CORS restriction (3 EFs), storage policy deleted_at, RLS InitPlan fix
- [x] Security Round 3 (Medium) — Rate limiting (12 routes), Zod schemas (3 handlers), sheets/download WHERE clause fix
- [x] agent-orchestrator Edge Function deployed (v297) — llm.ts refactoring, new pipeline/guards architecture

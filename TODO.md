# SaaS Launch Checklist

## Remaining (requires manual action)
- [ ] Google OAuth re-auth — "Test Clinic" workspace token expired May 3 (re-authorize via /settings/integrations). Flowcore ai token working (refreshed May 13).
- [ ] Uptime monitoring — set up external monitoring (Better Uptime / Pingdom) pointing at `https://flowter.vercel.app/api/health` (endpoint ready ✅)
- [ ] Penetration testing & vulnerability scanning cadence

## Deferred
- [ ] Billing — Stripe/Razorpay integration *(manual billing for now)*

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
- [x] Sentry removed (redundant with PostHog error tracking — 100K exceptions/mo free)
- [x] PostHog fully set up — instrumentation-client.ts, posthog-node, server helper, autocapture active
- [x] PostHog project token added to .env.local (project 421770, US Cloud)
- [x] RLS InitPlan fixed on all 3 remaining tables (agent_traces, failed_messages, kb_sources)
- [x] Public /api/health endpoint created for uptime monitoring
- [x] Google OAuth token — Flowcore ai workspace refreshed (expires 2026-05-13 15:25)

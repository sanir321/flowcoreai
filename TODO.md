# SaaS Launch Checklist

## Remaining (requires manual action)
- [ ] **Google OAuth re-auth** — Re-authorize Google for workspaces with expired tokens via `/settings/integrations`. "scluptdental" has a refresh_token (auto-refresh working). "dhivya" has no Google connection. If auto-refresh fails, user will see "Google session expired" and must re-connect.
- [ ] **Uptime monitoring** — Set up Better Uptime / Pingdom pointing at `https://flowter-bay.vercel.app/api/health` (endpoint returns `{"status":"ok"}`)
- [ ] **Penetration testing & vulnerability scanning cadence** — See `docs/security-audit-schedule.md`

## Deferred
- [ ] Billing — Stripe/Razorpay integration *(manual billing for now)*
- [ ] Subscription plans (Starter/Growth/Scale) with recurring billing

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
- [x] All security audit findings fixed — auth, CORS, rate limits, error leaks (commit `bc5c991`)
- [x] Security audit schedule — `docs/security-audit-schedule.md` created
- [x] Supabase migrations directory — initial schema tracked

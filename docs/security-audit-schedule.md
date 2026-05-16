# Security Audit Schedule

## Cadence

| Frequency | Activity | Owner | Notes |
|-----------|----------|-------|-------|
| **Weekly** | Dependency vulnerability scan (`npm audit`) | Dev | Automated via CI |
| **Monthly** | Supabase advisor review (security + performance) | Dev | Run `supabase advisors` |
| **Monthly** | RLS policy audit — verify no new tables lack RLS | Dev | |
| **Quarterly** | Penetration test — OWASP Top 10 coverage | External | Burp Suite / OWASP ZAP |
| **Quarterly** | Secrets rotation (API keys, service roles) | Admin | |
| **Bi-annual** | Full external pentest | Third-party | |
| **Per-release** | Code review for: secrets leak, IDOR, rate limiting, auth | Dev | Pre-deploy gate |

## Checklist (Each Session)
- [ ] No secrets/keys committed to repo
- [ ] Error messages do not leak internals (`error.message` not exposed to client)
- [ ] All new API routes have auth checks
- [ ] All new DB tables have RLS enabled
- [ ] Rate limiting applied to external-facing endpoints
- [ ] Workspace-scoped queries prevent IDOR

## Key Risk Areas
1. **GoWA webhook** — HMAC-signed, but ensure webhook secret is rotated every 90 days
2. **Service role key** — never exposed client-side; stored in Vercel env / Supabase secrets
3. **Google OAuth tokens** — auto-refresh with `invalid_grant` handling; user notified on expiry
4. **Razorpay webhook** — signature verified via HMAC SHA256
5. **Rate limits** — 30 req/min per IP on public endpoints

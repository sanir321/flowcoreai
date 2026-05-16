# FlowCore Audit Remediation - CHANGELOG

## [Unreleased] - 2026-05-16

### Added
- `CHANGELOG_FIXES.md` to track audit remediation progress.

### Fixed
- **[P0 Security]** `src/app/actions/appointments.ts`: Added `auth.getUser()` checks and `workspace_id` verification to `createAppointment`, `rescheduleAppointment`, and `cancelAppointment` to prevent IDOR attacks on Google Calendar and database.
- **[P0 Security]** `src/app/api/agent-hub/test-message/route.ts`: Added authentication and `workspace_id` verification to prevent unauthorized AI credit usage and database pollution.
- **[P0 Security]** Database: Enabled RLS on `kb_response_cache` and added workspace-scoped access policy.
- **[P0 Security]** Database: Added `workspace_id` column to `rate_limits` table.
- **[P0 Deployment]** `.env.example`: Corrected `NEXT_PUBLIC_APP_URL` to production Vercel URL.
- **[P1 Auth]** `src/app/auth/callback/route.ts`: Removed `edge` runtime to fix Google OAuth hanging issues on Vercel.
- **[P1 API]** `src/lib/rate-limit.ts`: Updated `rateLimit` to support optional workspace-scoped limiting.
- **[P1 Perf]** Global: Refactored major dashboard pages (`/inbox`, `/agent-hub`, `/appointments`, `/contacts`, `/settings`) from Client Components with `useEffect` data fetching to Server Components. This reduces initial load time, improves SEO, and eliminates redundant client-side Supabase roundtrips.
- **[P1 Perf]** `src/app/actions/workspace.ts`: Refactored `checkUserExists` to use efficient filtered lookup instead of O(N) memory mapping.
- **[P1 Perf]** `supabase/functions/agent-orchestrator/lib/tools.ts`: Refactored notification logic to use joined queries, eliminating N+1 database roundtrips.
- **[P1 Perf]** `middleware.ts`: Removed blocking database fallback query to reduce dashboard latency.
- **[P2 Security]** `middleware.ts`: Implemented default-deny protection for all internal `/api/` routes.
- **[P1 UI/UX]** `src/app/(dashboard)/loading.tsx`: Added global loading skeleton to dashboard layout to eliminate white screens during data fetching.
- **[P1 Deployment]** `vercel.json`: Updated deployment regions to `sin1` (Singapore) for optimized latency for the Indian target market.
- **[P2 Architecture]** Global: Implemented soft-delete (`deleted_at`) for workspaces, agents, knowledge sources, and account deletion to comply with data retention rules.
- **[P1 API]** Global: Added strict Zod input validation and `workspace_id` ownership (IDOR) checks to all Server Actions in `workspace.ts`, `contacts.ts`, `knowledge.ts`, `settings.ts`, and `appointments.ts`.
- **[P1 API]** `src/app/actions/appointments.ts`: Added Zod validation to `cancelAppointment` input.

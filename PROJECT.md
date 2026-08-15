# Project: FlowCore Bug Fixes & Audit

## Architecture
- **Framework & Runtime**: Next.js 15 App Router (`src/app`), React 19, Node.js.
- **Backend & Auth**: Supabase SSR (`@supabase/ssr`), Supabase Database & Auth (`@supabase/supabase-js`), Supabase Edge Functions (`supabase/functions`).
- **Data Flow**: Server Actions (`src/app/actions/`) handle mutations; Edge Middleware (`src/middleware.ts`) handles session verification, route protection, and security headers; Client pages (`src/app/(auth)/`, `src/app/onboarding/`) render UI and invoke Server Actions.
- **Verification & Testing**: Vitest (`npm test`), TypeScript (`npm run type-check`), ESLint (`npm run lint`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Email OTP Sign-In / Sign-Up | Sends 6-digit verification code to user email via server action. Enforces terms acceptance for new sign-ups. | M1 | survey_auth |
| 2 | Email OTP Verification | Verifies 6-digit OTP token and establishes Supabase auth session via server action. | M1 | survey_auth |
| 3 | Server-Side Rate Limiting & Lockout | Server-side IP lookup (`x-forwarded-for`) and Supabase RPC lockout calls (`check_login_lockout`, `record_login_attempt`) in `src/app/actions/auth.ts`. | M1 | survey_auth |
| 4 | Google OAuth Login & Terms Enforcement | Triggers OAuth sign-in and enforces mandatory terms acceptance before OAuth redirect. | M1 | survey_auth |
| 5 | Auth Callback & Session Cookie Exchange | Code exchange for session cookies and deterministic target routing (`/inbox` vs `/onboarding`). | M2 | survey_auth |
| 6 | Workspace Query Resilience | Replaces `.maybeSingle()` with `.order().limit(1)` in middleware and callbacks to eliminate PostgREST PGRST116 crash & redirect loops. | M2 | survey_auth |
| 7 | Session Middleware Route Protection | Edge middleware validating session cookies, injecting CSP nonces, and enforcing route access rules. | M2 | survey_auth |
| 8 | Atomic Workspace Creation | Provisions `workspaces`, default `workspace_agents`, `workspace_notifications`, and `widget_config` in an atomic sequence. | M3 | survey_workspace |
| 9 | Auth Session Metadata Sync | Awaits and synchronizes `app_metadata.workspace_id` update upon workspace creation. | M3 | survey_workspace |
| 10 | Workspace Administrative Actions | Workspace details update (`updateWorkspace`), soft-delete (`deleteWorkspace`), and user lookup (`checkUserExists`). | M3 | survey_workspace |
| 11 | Multi-Step Onboarding Wizard | 3-step onboarding flow (Company Profile -> Agent Selection -> Activation) with robust client-server state sync. | M4 | survey_workspace |
| 12 | Onboarding Wizard Recovery & Skip Guard | Guards `handleSkip` against null `workspaceId` and enables auto-resuming Step 2 if workspace exists without agents. | M4 | survey_workspace |
| 13 | E2E Test Suite Validation | Opaque-box test suite (Tiers 1-4) passing 100%. | M5 | original_request |
| 14 | Adversarial Hardening & Final QA | Tier 5 adversarial testing, static type checks (`type-check`), linting (`lint`), unit tests (`test`). | M5 | original_request |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Auth & Server Actions Refactoring (`M1_Auth`) | Refactor `src/app/actions/auth.ts`, move rate-limiting server-side, enforce terms acceptance on sign-up/OAuth | None | PLANNED |
| M2 | Middleware & Query Resilience (`M2_Middleware`) | Fix `.maybeSingle()` PGRST116 crash in middleware, callback route, and onboarding page | M1 | PLANNED |
| M3 | Atomic Workspace Creation (`M3_Workspace`) | Refactor `createWorkspace` for atomic provisioning of workspace, agents, notifications, and metadata sync | M2 | PLANNED |
| M4 | Onboarding Wizard & Client Sync (`M4_Onboarding`) | Fix `onboarding/page.tsx` null skip bug, sync client state with server on mount, eliminate redirect loops | M3 | PLANNED |
| M5 | Final Integration & E2E Validation (`M5_Integration`) | Validate 100% E2E test pass, conduct adversarial hardening, verify 0 errors in type-check, lint, and tests | M4 | PLANNED |

## Interface Contracts

### Auth Actions (`src/app/actions/auth.ts`) ↔ Login Page (`src/app/(auth)/login/page.tsx`)
```ts
export async function sendOtpAction(input: { email: string; acceptedTerms: boolean }): Promise<{ error: string | null; isOtpSent: boolean }>
export async function verifyOtpAction(input: { email: string; token: string }): Promise<{ error: string | null; targetRoute: string }>
```

### Workspace Actions (`src/app/actions/workspace.ts`) ↔ Onboarding (`src/app/onboarding/page.tsx`)
```ts
export async function createWorkspace(input: CreateWorkspaceInput): Promise<{ data: { workspace_id: string } | null; error: string | null }>
```

### Workspace Auth Helpers (`src/lib/workspace-auth.ts`) ↔ Middleware (`src/middleware.ts`)
```ts
export async function getUserWorkspaceId(supabase: SupabaseClient, userId: string): Promise<string | null>
export async function getOnboardingState(supabase: SupabaseClient, userId: string): Promise<{ hasWorkspace: boolean; hasAgents: boolean; workspaceId: string | null }>
```

## Code Layout
- `src/app/actions/auth.ts`: Auth Server Actions (owned by M1)
- `src/app/(auth)/login/page.tsx`: Login Client Page (owned by M1)
- `src/middleware.ts`: Next.js Middleware (owned by M2)
- `src/app/auth/callback/route.ts`: Auth Callback Route (owned by M2)
- `src/lib/workspace-auth.ts`: Workspace Authorization Helpers (owned by M2)
- `src/app/actions/workspace.ts`: Workspace Server Actions (owned by M3)
- `src/app/actions/agents.ts`: Agent Server Actions (owned by M3)
- `src/app/onboarding/page.tsx`: Onboarding Page Component (owned by M4)
- `src/lib/supabase/`: Supabase SSR Client Setup (shared)
- `tests/`: Unit & Integration Test Suites (owned by E2E Testing Orchestrator & M5)

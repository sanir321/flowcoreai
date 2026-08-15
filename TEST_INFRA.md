# FlowCore Test Infrastructure & 4-Tier Test Suite Specification

**Target System:** FlowCore (AI Agent Platform)  
**Document Version:** 1.0.0  
**Date:** July 31, 2026  
**Scope:** Authentication (Sign-in, Sign-up, Email OTP), Workspace Creation, Onboarding Wizard, Workspace Switching  

---

## 1. Test Architecture Overview

FlowCore utilizes a **dual-layer test runner architecture** designed to ensure end-to-end UI integrity, server action behavior, database state isolation, and security compliance.

```
+-----------------------------------------------------------------------------------+
|                            FlowCore Test Architecture                             |
+-----------------------------------------------------------------------------------+
|  1. End-to-End (E2E) Layer: Playwright (@playwright/test)                         |
|     - Location: tests/e2e/*.spec.ts                                               |
|     - Target: Real browser automation (Chromium, Firefox, WebKit)                 |
|     - Validates: Next.js App Router Middleware, Cookie exchanges, UI hydration,   |
|       multi-step onboarding wizard forms, session storage recovery.               |
+-----------------------------------------------------------------------------------+
|  2. Integration & Server Action Layer: Vitest + Custom Supabase Mocks             |
|     - Location: tests/actions/*.test.ts, tests/api/*.test.ts                      |
|     - Target: Fast Node.js / jsdom isolated execution                             |
|     - Validates: Server Actions (createWorkspace, updateWorkspace, deleteWorkspace,|
|       checkUserExists, finalizeOnboarding), Zod schema validations, Supabase Admin |
|       client calls, RPC interactions, and error state mapping.                     |
+-----------------------------------------------------------------------------------+
```

### 1.1 Directory Structure Standard

```
C:\flowter\
├── tests/
│   ├── setup.ts              # Vitest global environment & module mock setup
│   ├── helpers/
│   │   └── mocks.ts          # Chainable Supabase query builder & NextRequest mocks
│   ├── actions/              # Integration tests for Next.js Server Actions
│   │   ├── auth.test.ts      # Auth checkUserExists, lockout & OTP action tests
│   │   └── workspace.test.ts # Workspace creation, update & deletion action tests
│   ├── api/                  # API route handler integration tests
│   │   ├── agent-hub.test.ts
│   │   ├── ceo-query.test.ts
│   │   ├── menu.test.ts
│   │   └── notifications.test.ts
│   └── e2e/                  # Playwright End-to-End browser test specifications
│       ├── auth-onboarding.spec.ts
│       └── workspace.spec.ts
└── vitest.config.ts          # Vitest test runner configuration
```

---

## 2. Test Runner Commands & Execution Matrix

| Test Suite / Command | Tool / Framework | Target Files | Description |
|----------------------|------------------|--------------|-------------|
| `npm test` | Vitest v3 | `tests/**/*.test.ts`, `tests/**/*.test.tsx` | Executes unit and integration test suite in isolated jsdom environment. |
| `npm run type-check` | TypeScript Compiler (`tsc`) | Entire codebase (`tsconfig.json`) | Verifies strict TypeScript type safety without generating output (`--noEmit`). |
| `npm run lint` | ESLint v9 | `src/`, `tests/` | Enforces code formatting, hook dependencies, and syntax standards. |
| `npx playwright test` | Playwright | `tests/e2e/*.spec.ts` | Runs headful or headless browser automation tests against active Next.js dev server. |

---

## 3. Feature Inventory

| ID | Module | Feature Name | Interface / Endpoint | Description |
|----|--------|--------------|----------------------|-------------|
| F-01 | Auth | Google OAuth Sign-in | `src/app/(auth)/login/page.tsx` | Initiates Google OAuth consent flow with callback URI `${origin}/auth/callback`. |
| F-02 | Auth | Email OTP Generation | `src/app/(auth)/login/page.tsx`, `check_login_lockout` RPC | Validates terms, checks IP lockout via RPC, dispatches 6-digit verification code. |
| F-03 | Auth | Email OTP Verification | `src/app/(auth)/login/page.tsx`, `record_login_attempt` RPC | Verifies 6-digit code, establishes Supabase SSR session, records attempt, routes user. |
| F-04 | Auth | OAuth Callback Handler | `src/app/auth/callback/route.ts` | Exchanges auth code for session cookies, checks workspace/agent presence, handles `next` redirect. |
| F-05 | Auth | Session Guard Middleware | `src/middleware.ts` | Enforces nonces, CSP headers, protects `/inbox` and `/onboarding`, handles large header clears. |
| F-06 | Workspace | Workspace Creation Action | `src/app/actions/workspace.ts` (`createWorkspace`) | Validates Zod schema, checks existing active workspace, provisions workspace with 500 credits. |
| F-07 | Workspace | App Metadata Sync | `src/app/actions/workspace.ts` | Asynchronously syncs `user.app_metadata.workspace_id` via Supabase Admin API. |
| F-08 | Workspace | Website Scrape Trigger | `src/app/actions/workspace.ts` | Triggers Supabase Edge Function `extract-business-profile` when website URL is provided. |
| F-09 | Workspace | Welcome Email Dispatch | `src/app/actions/workspace.ts` | Renders React Email template and delivers welcome email upon workspace provisioning. |
| F-10 | Onboarding | Wizard Mount Auth Check | `src/app/onboarding/page.tsx` | Verifies session & workspace presence on mount, routing completed users directly to `/inbox`. |
| F-11 | Onboarding | Wizard Step 1 Profile Form | `src/app/onboarding/page.tsx` | Captures business profile inputs, calls `createWorkspace`, persists state in `sessionStorage`. |
| F-12 | Onboarding | Wizard Step 2 Agent Setup | `src/app/onboarding/page.tsx`, `finalizeOnboarding` | Selects agent template, creates `workspace_agents` and `kb_sources`, advances wizard. |
| F-13 | Onboarding | Wizard Step 3 Particle Ring | `src/app/onboarding/page.tsx` | Displays particle ring completion canvas with "Start now" action navigating to `/inbox`. |
| F-14 | Workspace | Client Workspace Hook | `src/hooks/use-workspace.ts` (`useWorkspace`) | Queries database for user's canonical active workspace ID, updating state on auth events. |
| F-15 | Workspace | Ownership Verification | `src/lib/workspace-auth.ts` (`verifyWorkspaceOwnership`) | Validates workspace ownership (`owner_id = userId`, `deleted_at IS NULL`) via DB query. |
| F-16 | Workspace | Canonical Workspace Lookup | `src/lib/workspace-auth.ts` (`getUserWorkspaceId`) | Resolves user's default workspace ID (`owner_id = userId ORDER BY created_at ASC`). |
| F-17 | Workspace | Delete Workspace Action | `src/app/actions/workspace.ts` (`deleteWorkspace`) | Soft-deletes workspace (`deleted_at = now()`), cleans up GoWA sessions, clears app metadata. |

---

## 4. Feature Checklist

- [x] **F-01**: Google OAuth Sign-in flow initiation
- [x] **F-02**: Email OTP request generation & lockout RPC validation
- [x] **F-03**: Email OTP code verification & session token acquisition
- [x] **F-04**: Auth callback code exchange & cookie delivery
- [x] **F-05**: Middleware route guard & CSP security header injection
- [x] **F-06**: `createWorkspace` Server Action with Zod input validation
- [x] **F-07**: Supabase Admin `app_metadata.workspace_id` sync
- [x] **F-08**: Business profile edge function scrape trigger
- [x] **F-09**: Welcome email dispatch execution
- [x] **F-10**: Onboarding mount guard & DB state checking
- [x] **F-11**: Onboarding Step 1 Business Profile form & `sessionStorage` persistence
- [x] **F-12**: Onboarding Step 2 Agent deployment & `finalizeOnboarding` execution
- [x] **F-13**: Onboarding Step 3 particle canvas completion ring & navigation
- [x] **F-14**: `useWorkspace` hook canonical workspace resolution
- [x] **F-15**: `verifyWorkspaceOwnership` DB level access control helper
- [x] **F-16**: `getUserWorkspaceId` canonical workspace lookup helper
- [x] **F-17**: `deleteWorkspace` Server Action soft-deletion & cleanup

---

## 5. 4-Tier Test Case Suite

### Tier 1: Primary Feature Coverage (32 Test Cases)

| ID | Title | Feature | Test Input | Expected Output / Authoritative Source | Mode |
|----|-------|---------|------------|-----------------------------------------|------|
| TC-T1-01 | Trigger Google OAuth Redirect | F-01 | Click "Continue with Google" button on `/login` | `supabase.auth.signInWithOAuth` called with provider `"google"` and `redirectTo: "${origin}/auth/callback"`. | Playwright |
| TC-T1-02 | OTP Request for Existing User | F-02 | Valid email (`user@example.com`), `acceptedTerms = false` | `check_login_lockout` returns unlocked, `checkUserExists` returns `exists: true`, OTP sent, UI transitions to OTP input. | Vitest / E2E |
| TC-T1-03 | OTP Request for New User with Terms | F-02 | Valid email (`new@example.com`), `acceptedTerms = true` | OTP sent successfully, toast displays "Verification code sent", state `isOtpSent` set to `true`. | Vitest / E2E |
| TC-T1-04 | Successful OTP Verification | F-03 | Valid email, correct 6-digit OTP code (`123456`) | `verifyOtp` returns active session, `record_login_attempt` logs success, user routed to `/inbox` or `/onboarding`. | Vitest / E2E |
| TC-T1-05 | Callback Code Exchange Success | F-04 | Valid `code` query param, `next = "/inbox"` | `exchangeCodeForSession` executes, sets session cookies, returns HTTP 307 redirect to `/inbox`. | Vitest |
| TC-T1-06 | Callback Redirect to Onboarding for New User | F-04 | Valid `code`, user has 0 workspaces in DB | Code exchanged, DB lookup finds 0 workspaces, redirects user to `/onboarding`. | Vitest |
| TC-T1-07 | Callback Redirect to Inbox for Established User | F-04 | Valid `code`, user has workspace + active agents in DB | Code exchanged, DB lookup finds workspace + agents, redirects user to `/inbox`. | Vitest |
| TC-T1-08 | Middleware Guard Unauthenticated Protected Route | F-05 | HTTP GET request to `/inbox` with 0 session cookies | Middleware intercepts request, returns HTTP 307 redirect to `/login`. | Vitest / E2E |
| TC-T1-09 | Middleware CSP Header Injection | F-05 | HTTP GET request to any public or protected route | Response headers contain `x-nonce` and `Content-Security-Policy` with nonced directives. | Vitest |
| TC-T1-10 | `createWorkspace` Valid Input Provisioning | F-06 | Name: `"Acme Inc"`, Business: `"Tech"`, Employees: `"1-10"`, Terms: `true` | Returns `{ data: { workspace_id: "ws-123" }, error: null }`, inserts workspace record with 500 credits. | Vitest |
| TC-T1-11 | `createWorkspace` Idempotent Return for Existing Owner | F-06 | User already owns workspace `"ws-999"`, submits `createWorkspace` | Returns `{ data: { workspace_id: "ws-999" }, error: null }` without creating duplicate row. | Vitest |
| TC-T1-12 | Admin Metadata Sync Execution | F-07 | Successful `createWorkspace` execution | `admin.auth.admin.updateUserById` invoked with `app_metadata: { workspace_id: "ws-123" }`. | Vitest |
| TC-T1-13 | Web Scrape Edge Function Trigger | F-08 | Workspace creation with `website_url: "https://acme.com"` | `supabase.functions.invoke("extract-business-profile")` triggered with `workspace_id` and URL. | Vitest |
| TC-T1-14 | Welcome Email Dispatch | F-09 | Workspace creation for user `user@example.com` | React Email template rendered and dispatched via `nodemailer`/`resend` client. | Vitest |
| TC-T1-15 | Onboarding Mount Guard for Authenticated User | F-10 | Mount `/onboarding` page with active session & 0 workspaces | Onboarding page renders Step 1 form without redirecting. | Playwright |
| TC-T1-16 | Onboarding Mount Guard Direct to Inbox | F-10 | Mount `/onboarding` page with user owning workspace + 1 agent | Mount hook queries DB, detects active agent, automatically redirects to `/inbox`. | Playwright |
| TC-T1-17 | Onboarding Step 1 Form Submission | F-11 | Fill Business Name `"FlowCorp"`, select size, click Next | Calls `createWorkspace`, stores `onboarding_workspace_id` in `sessionStorage`, advances to Step 2. | Playwright |
| TC-T1-18 | Onboarding Step 1 `sessionStorage` Hydration | F-11 | Step 1 submitted, user refreshes page | Reads `sessionStorage`, restores `step = 2` and workspace ID, bypassing Step 1 form. | Playwright |
| TC-T1-19 | Onboarding Step 2 Agent Deployment | F-12 | Select `"customer_support"` agent, click Continue | Calls `finalizeOnboarding`, inserts `workspace_agents` row, advances to Step 3 canvas. | Vitest / E2E |
| TC-T1-20 | `finalizeOnboarding` Idempotency | F-12 | Call `finalizeOnboarding` when agent already exists | Returns `{ data: { success: true }, error: null }` without creating duplicate agent rows. | Vitest |
| TC-T1-21 | Onboarding Step 3 Canvas Rendering | F-13 | Step 3 active | Renders particle ring canvas component and "Start now" button. | Playwright |
| TC-T1-22 | Onboarding Step 3 Navigation to Inbox | F-13 | Click "Start now" button on Step 3 | Browser navigates to `/inbox` (`router.push('/inbox')`). | Playwright |
| TC-T1-23 | `useWorkspace` Hook Canonical Resolution | F-14 | User owns workspace `"ws-001"` created at `2026-01-01` | Hook resolves `workspaceId: "ws-001"`, `isLoading: false`. | Vitest |
| TC-T1-24 | `useWorkspace` Hook Null State | F-14 | User owns 0 workspaces | Hook resolves `workspaceId: null`, `isLoading: false`. | Vitest |
| TC-T1-25 | `verifyWorkspaceOwnership` Authorized Owner | F-15 | `userId: "usr-1"`, `workspaceId: "ws-1"`, matching in DB | Returns `{ authorized: true, workspaceId: "ws-1" }`. | Vitest |
| TC-T1-26 | `verifyWorkspaceOwnership` Unauthorized User | F-15 | `userId: "usr-2"`, `workspaceId: "ws-1"` owned by `usr-1` | Returns `{ authorized: false, error: "Workspace not found or unauthorized" }`. | Vitest |
| TC-T1-27 | `getUserWorkspaceId` Primary Lookup | F-16 | User owns 2 workspaces (`ws-old` created 8:00, `ws-new` created 9:00) | Returns `"ws-old"` (earliest created active workspace). | Vitest |
| TC-T1-28 | `deleteWorkspace` Authorized Soft-Delete | F-17 | Workspace owner calls `deleteWorkspace({ workspace_id: "ws-1" })` | Sets `deleted_at = now()`, returns `{ data: { success: true }, error: null }`. | Vitest |
| TC-T1-29 | `deleteWorkspace` Admin Metadata Clear | F-17 | Owner soft-deletes active workspace | `admin.auth.admin.updateUserById` called setting `app_metadata.workspace_id: null`. | Vitest |
| TC-T1-30 | Public Route Access Without Session | F-05 | HTTP GET request to `/login` without cookies | Middleware permits access, returning HTTP 200 OK. | Vitest / E2E |
| TC-T1-31 | Authenticated User Accessing `/login` | F-05 | HTTP GET request to `/login` with valid session cookie | Middleware intercepts request, returning HTTP 307 redirect to `/inbox`. | Vitest / E2E |
| TC-T1-32 | Auth Callback Missing Code Handling | F-04 | HTTP GET request to `/auth/callback` without `code` param | Returns HTTP 307 redirect to `/login?error=No code provided`. | Vitest |

---

### Tier 2: Boundary, Corner & Error Cases (32 Test Cases)

| ID | Title | Feature | Test Input | Expected Output / Authoritative Source | Mode |
|----|-------|---------|------------|-----------------------------------------|------|
| TC-T2-01 | New User OTP Request Unaccepted Terms | F-02 | Unregistered email, `acceptedTerms = false` | System rejects request, displays error message requiring terms agreement. | Vitest / E2E |
| TC-T2-02 | IP Lockout Active OTP Request | F-02 | Client IP locked out by `check_login_lockout` RPC | Rejects request, displays lockout toast with remaining cooldown seconds. | Vitest |
| TC-T2-03 | Invalid Email Format OTP Request | F-02 | Email string `"invalid-email-address"` | Schema validation fails, displays "Invalid email address" validation error. | Vitest / E2E |
| TC-T2-04 | Expired / Invalid OTP Verification Code | F-03 | Email `user@example.com`, token `"000000"` | `verifyOtp` returns error, `record_login_attempt` logs failure, toast shows invalid code. | Vitest / E2E |
| TC-T2-05 | Malicious Callback `next` Parameter | F-04 | `code: "123"`, `next: "https://attacker.com/phish"` | `sanitizeRedirect` strips external domain, fallback redirecting to `/inbox` or `/onboarding`. | Vitest |
| TC-T2-06 | Callback Protocol-Relative `next` Parameter | F-04 | `code: "123"`, `next: "//attacker.com/phish"` | `sanitizeRedirect` rejects string starting with `//`, fallback redirecting to internal path. | Vitest |
| TC-T2-07 | Callback Auth Code Exchange Failure | F-04 | Invalid/expired `code: "invalid-code"` | `exchangeCodeForSession` returns error, redirects to `/login?error=Could not authenticate user`. | Vitest |
| TC-T2-08 | Oversized HTTP Header Cookie Attack | F-05 | Request headers > 12,000 bytes | Middleware clears all auth cookies, returning HTTP 307 redirect to `/login`. | Vitest |
| TC-T2-09 | `createWorkspace` Empty Workspace Name | F-06 | Name: `""`, Business: `"Tech"`, Terms: `true` | Zod validation returns error `"Workspace name is required"`, data is `null`. | Vitest |
| TC-T2-10 | `createWorkspace` Excessively Long Workspace Name | F-06 | Name string > 100 chars (`"A" * 101`) | Zod validation returns error `"Workspace name must be less than 100 characters"`. | Vitest |
| TC-T2-11 | `createWorkspace` Unauthenticated Caller | F-06 | Call `createWorkspace` with null Supabase session | Server action returns `{ data: null, error: "Unauthorized" }`. | Vitest |
| TC-T2-12 | Admin Metadata Sync Failure Isolation | F-07 | `updateUserById` throws Admin API exception | Catch block logs `[WORKSPACE_METADATA_UPDATE_FAILED]`; parent workspace creation still succeeds. | Vitest |
| TC-T2-13 | Web Scrape Edge Function Error Isolation | F-08 | Edge function invocation throws HTTP 500 error | Catch block logs `[WORKSPACE_SCRAPE_FAILED]`; workspace creation returns success. | Vitest |
| TC-T2-14 | Welcome Email Dispatch Failure Isolation | F-09 | Email SMTP connection timed out / rejected | Catch block logs `[WORKSPACE_WELCOME_EMAIL_FAILED]`; workspace creation returns success. | Vitest |
| TC-T2-15 | `finalizeOnboarding` Unauthenticated Caller | F-12 | Call `finalizeOnboarding` with null Supabase session | Server action returns `{ data: null, error: "Unauthorized" }`. | Vitest |
| TC-T2-16 | `finalizeOnboarding` Non-Existent Workspace ID | F-12 | `workspaceId: "non-existent-uuid"` | Server action returns `{ data: null, error: "Workspace not found" }`. | Vitest |
| TC-T2-17 | `verifyWorkspaceOwnership` Soft-Deleted Workspace | F-15 | Workspace has `deleted_at = "2026-01-01T00:00:00Z"` | Returns `{ authorized: false, error: "Workspace not found or unauthorized" }`. | Vitest |
| TC-T2-18 | `verifyWorkspaceOwnership` Invalid UUID Format | F-15 | `workspaceId: "not-a-valid-uuid"` | Gracefully returns `{ authorized: false, error: "Workspace not found or unauthorized" }`. | Vitest |
| TC-T2-19 | `getUserWorkspaceId` Soft-Deleted Workspace Filter | F-16 | User's only workspace has `deleted_at` set | Query filters out deleted record, returning `null`. | Vitest |
| TC-T2-20 | `deleteWorkspace` Unauthorized Non-Owner | F-17 | User `usr-2` attempts to delete workspace owned by `usr-1` | Ownership check fails, returning `{ data: null, error: "Workspace not found or unauthorized" }`. | Vitest |
| TC-T2-21 | `deleteWorkspace` Already Deleted Workspace | F-17 | Call `deleteWorkspace` on workspace where `deleted_at IS NOT NULL` | Returns `{ data: null, error: "Workspace not found or unauthorized" }`. | Vitest |
| TC-T2-22 | Concurrent Workspace Creation Requests | F-06 | User sends 2 parallel `createWorkspace` server action calls | First request creates workspace; second request idempotently returns existing workspace ID. | Vitest |
| TC-T2-23 | Onboarding Step 1 Cleared `sessionStorage` | F-11 | User clears local storage mid-wizard and reloads | Wizard checks DB state; if workspace exists, advances to Step 2 instead of showing Step 1. | Playwright |
| TC-T2-24 | Onboarding Step 2 Skip Agent Selection | F-12 | Click "Skip for now" on Step 2 carousel | Calls `finalizeOnboarding` with default `"customer_support"` agent, advancing to Step 3. | Playwright |
| TC-T2-25 | Invalid Website URL in Workspace Form | F-06 | Website URL: `"not-a-url"` | Schema validation returns `"Invalid URL format"`, preventing action dispatch. | Vitest / E2E |
| TC-T2-26 | OTP Verification Rate Limit Exceeded | F-03 | 5 invalid OTP codes entered consecutively | RPC logs repeated failures, locking out IP/user for 15 minutes. | Vitest |
| TC-T2-27 | Supabase Auth API Outage / Network Error | F-02 | `signInWithOtp` throws network error | Displays toast error "Authentication service unavailable. Please try again later." | Vitest / E2E |
| TC-T2-28 | Middleware Access to Non-Existent Protected Route | F-05 | HTTP GET request to `/inbox/non-existent-page` | Validates session, permits routing to Next.js 404 page handler. | Vitest / E2E |
| TC-T2-29 | Soft-Deleted Workspace Route Interception | F-05 | User with soft-deleted workspace visits `/inbox` | Middleware DB check finds no active workspace, redirecting user to `/onboarding`. | Vitest / E2E |
| TC-T2-30 | OTP Code Whitespace & Formatting Handling | F-03 | OTP code entered with spaces: `" 123 456 "` | Sanitizes string to `"123456"`, successfully verifying OTP code. | Vitest / E2E |
| TC-T2-31 | `createWorkspace` Special Characters in Name | F-06 | Name: `"<script>alert('xss')</script> Workspace & Co."` | Sanitizes/escapes text, stores string safely without script execution. | Vitest |
| TC-T2-32 | OAuth Callback State Mismatch Error | F-04 | HTTP GET to `/auth/callback?error=access_denied&error_description=User+canceled` | Redirects user to `/login?error=User canceled`. | Vitest |

---

### Tier 3: Pairwise Combination Matrix (6 Suites)

#### Suite 3.1: Auth Sign-In Strategy Matrix
Combinations of Auth Provider, User Registration Status, Terms Acceptance, and IP Lockout State.

| Test Case | Provider | User Exists? | Terms Accepted? | IP Lockout State | Expected Behavior |
|-----------|----------|--------------|-----------------|------------------|-------------------|
| TC-T3-01a | Email OTP | No (New) | True | Unlocked | OTP sent, proceeds to verification flow. |
| TC-T3-01b | Email OTP | No (New) | False | Unlocked | Blocked with validation error "Must accept terms". |
| TC-T3-01c | Email OTP | Yes (Existing)| False | Unlocked | OTP sent (existing user exempt from re-accepting terms). |
| TC-T3-01d | Email OTP | Yes (Existing)| True | Locked | Blocked by RPC lockout check with cooldown error. |
| TC-T3-01e | Google OAuth| No (New) | N/A | Unlocked | Redirected to Google consent, creates user on callback. |
| TC-T3-01f | Google OAuth| Yes (Existing)| N/A | Unlocked | Redirected to Google consent, logs in on callback. |

#### Suite 3.2: OTP Verification & Routing Matrix
Combinations of OTP Code Validity, Account Setup State, and Target Route.

| Test Case | OTP Code Status | Workspaces Owned | Agents Provisioned | Expected Route |
|-----------|-----------------|------------------|--------------------|----------------|
| TC-T3-02a | Valid (`123456`)| 0 workspaces | 0 agents | `/onboarding` |
| TC-T3-02b | Valid (`123456`)| 1 workspace | 0 agents | `/onboarding` |
| TC-T3-02c | Valid (`123456`)| 1 workspace | 1+ agents | `/inbox` |
| TC-T3-02d | Invalid (`000000`)| 1 workspace | 1+ agents | Remains on `/login`, displays error toast. |
| TC-T3-02e | Expired | 0 workspaces | 0 agents | Remains on `/login`, displays expired code toast. |
| TC-T3-02f | Valid (`123456`)| Soft-deleted | 0 agents | `/onboarding` |

#### Suite 3.3: Workspace Creation Input Permutations
Combinations of Business Name, Business Type, Website URL, and Employee Count.

| Test Case | Name Input | Business Type | Website URL Input | Employee Count | Expected Outcome |
|-----------|------------|---------------|-------------------|----------------|------------------|
| TC-T3-03a | `"Acme Tech"` | `"Technology"` | `"https://acme.com"` | `"1-10"` | Success + Edge function scrape triggered. |
| TC-T3-03b | `"Acme Retail"`| `"Retail"` | `""` (Empty) | `"11-50"` | Success, scrape skipped. |
| TC-T3-03c | `""` (Empty) | `"Healthcare"`| `"https://med.org"` | `"51-200"` | Fails validation ("Name required"). |
| TC-T3-03d | `"Acme Fin"` | `""` (Empty) | `"not-a-url"` | `"201-500"` | Fails validation ("Invalid URL"). |
| TC-T3-03e | `"Acme Edu"` | `"Education"` | `"http://edu.org"` | `""` (Empty) | Fails validation ("Employee count required"). |
| TC-T3-03f | `"Acme Law"` | `"Legal"` | `"https://law.com"` | `"500+"` | Success + Edge function scrape triggered. |

#### Suite 3.4: Onboarding Wizard Recovery & State Matrix
Combinations of `sessionStorage` state, DB Workspace record, DB Agent record, and Page Refresh trigger.

| Test Case | `sessionStorage` Step | DB Workspace | DB Agents | Action / Trigger | Expected Outcome |
|-----------|----------------------|--------------|-----------|------------------|------------------|
| TC-T3-04a | Step 1 | None | None | Page Refresh | Renders Step 1 form. |
| TC-T3-04b | Step 1 | Present | None | Page Refresh | Detects workspace in DB, advances to Step 2. |
| TC-T3-04c | Step 2 | Present | None | Page Refresh | Restores Step 2 agent setup form. |
| TC-T3-04d | Step 2 | Present | 1 Agent | Page Refresh | Detects active agent, redirects to `/inbox`. |
| TC-T3-04e | Cleared | Present | None | Page Refresh | DB check restores Step 2 form. |
| TC-T3-04f | Cleared | Present | 1 Agent | Mount `/onboarding` | DB check redirects to `/inbox`. |

#### Suite 3.5: OAuth Callback Safety & Security Matrix
Combinations of Auth Code, `next` Parameter Format, and User Workspace Status.

| Test Case | Auth Code Status | `next` Parameter Value | Workspace Status | Expected Redirect Target |
|-----------|------------------|------------------------|------------------|--------------------------|
| TC-T3-05a | Valid | `"/inbox"` | Active Workspace | `HTTP 307 /inbox` |
| TC-T3-05b | Valid | `"https://evil.com"` | Active Workspace | `HTTP 307 /inbox` (Sanitized) |
| TC-T3-05c | Valid | `"//evil.com/phish"` | 0 Workspaces | `HTTP 307 /onboarding` (Sanitized) |
| TC-T3-05d | Valid | `"/settings/profile"` | Active Workspace | `HTTP 307 /settings/profile` |
| TC-T3-05e | Invalid | `"/inbox"` | Active Workspace | `HTTP 307 /login?error=...` |
| TC-T3-05f | Missing | `"/inbox"` | Active Workspace | `HTTP 307 /login?error=No code provided` |

#### Suite 3.6: Workspace Switching & Ownership Access Control Matrix
Combinations of User ID, Target Workspace ID, DB Ownership Record, and Soft-Deletion Flag.

| Test Case | User ID | Target Workspace ID | DB `owner_id` | DB `deleted_at` | Access Result |
|-----------|---------|---------------------|---------------|-----------------|---------------|
| TC-T3-06a | `usr-1` | `ws-001` | `usr-1` | `NULL` | Authorized (`true`) |
| TC-T3-06b | `usr-2` | `ws-001` | `usr-1` | `NULL` | Unauthorized (`false`) |
| TC-T3-06c | `usr-1` | `ws-001` | `usr-1` | `2026-01-01` | Unauthorized (`false`) |
| TC-T3-06d | `usr-1` | `non-existent` | N/A | N/A | Unauthorized (`false`) |
| TC-T3-06e | `usr-3` (Admin) | `ws-001` | `usr-1` | `NULL` | Unauthorized (Owner-only model) |
| TC-T3-06f | Guest / Anon | `ws-001` | `usr-1` | `NULL` | Unauthorized (`false`) |

---

### Tier 4: Real-World End-to-End User Scenarios (5 Flows)

#### Flow 4.1: Brand-New User Registration to Active Dashboard Entry
* **Goal**: Validate complete journey from initial unauthenticated landing to fully provisioned workspace dashboard.
* **Pre-conditions**: Clean browser state, unregistered user email (`newuser@example.com`).
* **Step-by-Step Execution**:
  1. Navigate to `/login`. Verify login form rendered.
  2. Input `newuser@example.com`, check Privacy Policy / Terms checkbox. Click "Send code".
  3. Intercept OTP API request; assert success toast "Verification code sent" appears.
  4. Enter verification code `123456`. Click "Verify code".
  5. System validates OTP, creates Supabase user session, queries DB for workspaces (0 found), and navigates to `/onboarding`.
  6. Onboarding Step 1: Input Business Name `"Nova AI Labs"`, Business Type `"Technology"`, Employee Count `"11-50"`, Website `"https://nova.ai"`. Click "Continue".
  7. `createWorkspace` Server Action executes: inserts workspace record with 500 credits, syncs user `app_metadata`, triggers background scrape and welcome email.
  8. Wizard transitions to Step 2. Select `"customer_support"` ("Support Hero") agent. Click "Finish setup".
  9. `finalizeOnboarding` Server Action executes: inserts `workspace_agents` and `kb_sources` records.
  10. Wizard transitions to Step 3 particle ring animation. Click "Start now".
  11. Router navigates to `/inbox`. Verify dashboard header displays active workspace context.
* **Authoritative Assertions**:
  - `workspaces` table contains record with `name = "Nova AI Labs"`, `credits_balance = 500`, `status = "active"`.
  - `workspace_agents` table contains record linked to workspace ID.
  - Browser URL is `/inbox`.

#### Flow 4.2: Existing User Authentication & Direct Inbox Routing
* **Goal**: Verify return user authentication bypasses onboarding wizard when workspace and agents exist.
* **Pre-conditions**: Existing user (`existing@example.com`) possessing workspace `"ws-999"` with 1 active agent in DB.
* **Step-by-Step Execution**:
  1. Navigate to `/login`.
  2. Input `existing@example.com`. Click "Send code".
  3. Input verification code `123456`. Click "Verify".
  4. `verifyOtp` completes successfully. Post-login hook checks DB for user workspaces and agents.
  5. DB lookup returns active workspace `"ws-999"` with active agents > 0.
  6. User is directly routed to `/inbox` without touching `/onboarding`.
* **Authoritative Assertions**:
  - Browser URL immediately transitions `/login` -> `/inbox`.
  - Onboarding wizard component is never rendered.

#### Flow 4.3: Interrupted Onboarding Recovery & Session Resumption
* **Goal**: Verify state persistence and graceful recovery when a user closes or refreshes the browser mid-onboarding.
* **Pre-conditions**: Authenticated user who completed Step 1 (workspace created) but closed browser before Step 2 agent selection.
* **Step-by-Step Execution**:
  1. User navigates directly back to `/onboarding` or `/login`.
  2. Middleware validates active session cookie, permitting access.
  3. Onboarding mount guard executes: queries DB for workspaces owned by `user.id`.
  4. DB lookup finds workspace `"ws-partially-setup"`, then queries `workspace_agents` (0 rows found).
  5. Mount guard detects workspace exists but 0 agents provisioned.
  6. Wizard automatically restores state to Step 2 (Agent Selection) instead of Step 1 form.
  7. User selects agent and completes setup, landing on `/inbox`.
* **Authoritative Assertions**:
  - User is NOT prompted to re-enter business profile information.
  - `createWorkspace` is not called again (no duplicate workspace records).

#### Flow 4.4: Soft Workspace Deletion & Middleware Re-Onboarding Flow
* **Goal**: Validate application behavior when a user deletes their active workspace.
* **Pre-conditions**: Authenticated user with active workspace `"ws-to-delete"`.
* **Step-by-Step Execution**:
  1. User initiates `deleteWorkspace({ workspace_id: "ws-to-delete" })` from settings.
  2. Server action sets `deleted_at = now()` on workspace record and updates user `app_metadata.workspace_id = null`.
  3. User attempts to navigate to `/inbox`.
  4. Middleware intercepts request, checks DB for active, non-deleted workspaces for `user.id`.
  5. DB query returns 0 active workspaces (deleted workspace filtered out by `deleted_at IS NULL`).
  6. Middleware redirects user to `/onboarding` to set up a new workspace.
* **Authoritative Assertions**:
  - DB record has `deleted_at IS NOT NULL`.
  - User navigating to `/inbox` is redirected to `/onboarding`.

#### Flow 4.5: Malicious Redirect Attempt & Open-Redirect Prevention
* **Goal**: Verify security defense against open-redirect attacks in auth callback handler.
* **Pre-conditions**: Attacker crafts phishing link: `/auth/callback?code=valid-code&next=https://attacker-phishing.com/steal-tokens`.
* **Step-by-Step Execution**:
  1. User clicks crafted link, navigating to `/auth/callback?code=valid-code&next=https://attacker-phishing.com/steal-tokens`.
  2. Route handler exchanges `code` for session cookies using `@supabase/ssr`.
  3. Route handler passes `next` query param to `sanitizeRedirect` helper.
  4. `sanitizeRedirect` detects absolute URL schema (`https://`), rejects target, and falls back to `/inbox` (or `/onboarding`).
  5. Server returns HTTP 307 redirect to internal URL `/inbox`.
* **Authoritative Assertions**:
  - Response `Location` header is `/inbox` or `/onboarding` (never `https://attacker-phishing.com`).
  - Session cookies set securely with `SameSite=Lax`.

---

## 6. Implementation Bugs & Defects Escalation Log

The following architectural and implementation defects were identified during test specification mining and infrastructure setup. These items are escalated for developer remediation:

1. **[BUG-01] Non-Owner Collaboration Exclusion**:
   - *Observation*: Middleware (`src/middleware.ts`), `auth/callback`, `useWorkspace`, and `workspace-auth.ts` strictly filter `.eq("owner_id", user.id)`.
   - *Impact*: Invited workspace members/collaborators are blocked from dashboard routes and redirected to `/onboarding`.
   - *Escalation*: Implement a `workspace_members` table and update workspace lookup queries to check membership role as well as ownership.

2. **[BUG-02] OTP Login vs. OAuth Callback Routing Inconsistency**:
   - *Observation*: `LoginPage.handleVerifyOtp` only checks if a `workspaces` row exists to route to `/inbox`, whereas `/auth/callback` checks if `workspace_agents` exist.
   - *Impact*: OTP users with 0 agents are routed to `/inbox` (blank dashboard), while OAuth users are routed to `/onboarding`.
   - *Escalation*: Align `LoginPage.handleVerifyOtp` to check agent count before routing.

3. **[BUG-03] OTP Sign-In Terms Checkbox Trap for Existing Users**:
   - *Observation*: In `login/page.tsx:80`, `const isNewUser = existsData ? !existsData.exists : true`. If `checkUserExists` returns error, `existsData` is `null`, forcing `isNewUser = true`.
   - *Impact*: Existing users are blocked from requesting OTP if they have not checked the terms agreement box.
   - *Escalation*: Handle admin check failures gracefully without defaulting existing users to new user state.

4. **[BUG-04] Double-Redirect Hop on `/login` for Authenticated Users without Workspace**:
   - *Observation*: `middleware.ts:90` redirects authenticated user visiting `/login` to `/inbox`. Line 110 then detects 0 workspaces on `/inbox` and redirects to `/onboarding`.
   - *Impact*: Creates two consecutive HTTP redirects (`/login` -> `/inbox` -> `/onboarding`).
   - *Escalation*: Update `/login` middleware check to inspect workspace presence before determining redirect target.

5. **[BUG-05] Decoupled Workspace & Agent Provisioning**:
   - *Observation*: Workspace creation (`createWorkspace`) and agent provisioning (`finalizeOnboarding`) are separate, non-atomic actions.
   - *Impact*: Closing the browser on Step 2 leaves an orphaned workspace with 0 default agents.
   - *Escalation*: Provision default `"customer_support"` agent directly within `createWorkspace` or execute atomically in transaction.

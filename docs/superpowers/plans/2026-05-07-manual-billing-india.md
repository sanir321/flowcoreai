# Indian Manual Billing Implementation Plan

**Goal:** Implement a credit-based billing system for the Indian market.

### Task 1: Database Migration (COMPLETED)
- Add columns to `workspaces`.
- Create `billing_transactions` table.

### Task 2: Update Workspace Action & Zod Schema
**Files:**
- `src/lib/schemas/workspace.ts`
- `src/app/actions/workspace.ts`

- [ ] **Step 1:** Add `owner_personal_phone` to `updateWorkspaceSchema` in `src/lib/schemas/workspace.ts`.
- [ ] **Step 2:** Update `updateWorkspace` in `src/app/actions/workspace.ts` to save `owner_personal_phone`.

### Task 3: Billing Dashboard UI
**Files:**
- `src/app/(dashboard)/settings/billing/page.tsx`

- [ ] **Step 1:** Create UI showing `credits_balance` and an "Upgrade" button that opens `wa.me/YOUR_PHONE_NUMBER`.

### Task 4: Credit Deduction in Orchestrator
**Files:**
- `supabase/functions/agent-orchestrator/index.ts`

- [ ] **Step 1:** Check `credits_balance > 0` before processing.
- [ ] **Step 2:** Deduct credit and log transaction after message send.
- [ ] **Step 3:** Alert `owner_personal_phone` at balance 100, 20, 0.

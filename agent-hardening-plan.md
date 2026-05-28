# Agent Ecosystem Hardening Plan

> Based on `docs/fix1.md` + `docs/fix2.md` + current codebase analysis at v292

## Goal
Harden the multi-agent ecosystem (booking, sales, support) so that LLM hallucinations are caught by middleware, CRM sessions are wired correctly, Google Calendar failures don't crash workflows, escalation handoffs actually reach the user, and support agents can create tickets. Estimated total effort: **~14 tasks** across 5 phases + 2 cleanup waves.

> **Research cross-reference:** This plan was verified against all 6 bugs found in the 3-phase isolation test. Changes from the research:
> - **GAP 1 (CRITICAL):** Added Phase 3C — `create_ticket` tool (was entirely missing)
> - **GAP 2 (MEDIUM):** Phase 3A now uses `request_handoff` tool instead of broken `handleHandoff(ctx)` 
> - **GAP 3 (MEDIUM):** Phase 2B expanded — pricing/KB hallucination middleware added
> - **GAP 4 (MEDIUM):** Added guard reorder task — escalation check before credits/window
> - **GAP 5 (LOW):** Added `enrichResponseWithToolResults` fix for captureLead return shape
> - **GAP 6 (LOW):** Added default keyword expansion for escalation.ts

---

## Phase 1 — Hardening the State Machine

### 1A: Wrap Lead Capture + Session Linkage in Sequential Operation
**Current bug:** `capture_lead` upserts to `contacts` table but never updates `conversation_sessions.contact_id`. The `update_lead_stage` tool then tries to read back `contact_id` from `conversation_sessions`, finds it `null`, and returns `"Contact not found"` — so the pipeline stage update silently fails.

**Files to modify:**
- `supabase/functions/agent-orchestrator/tools/impl/crm.ts`

**Action:**
1. After the `contacts.upsert()` returns a contact ID, immediately run `UPDATE conversation_sessions SET contact_id = $1 WHERE id = $2` using the current `ctx.session.id`
2. Return `{ success: true, contact_id, session_linked: true }`
3. Keep the Google Sheets append as a non-fatal secondary operation (already wrapped in try/catch — that's fine)

**Edge case:** If `contacts.upsert()` succeeds but the session update fails, return `{ success: true, contact_id, session_linked: false, warning: "...contact saved but failed to link to session" }`

**Test:** `capture_lead` with valid name/email → DB shows `contact_id` set on `conversation_sessions` row.

---

### 1B: Decouple Local Database from Google Calendar for updateAppointment AND cancelAppointment

**Files to modify:**
- `supabase/functions/agent-orchestrator/tools/impl/calendar.ts`
- `supabase/migrations/*` (new migration file for schema change)

#### 1B-i: Database migration
Create a new migration (e.g., `20260524_add_sync_status.sql`):

```sql
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT NULL;
```

#### 1B-ii: Fix updateAppointment
**Current code (lines ~251-278):** Google Calendar PATCH (line 268) runs BEFORE DB update (line 273), with NO try/catch. If OAuth token is expired, the entire tool call crashes — DB never updates.

**Action:**
1. **DB first:** Execute the `appointments` table UPDATE before any Google Calendar call
2. **Google as secondary:** Wrap the Google Calendar `fetch(PATCH)` in try/catch
3. On Google failure: log a `console.error`, set `sync_status = 'failed_sync'` on the appointment row
4. Return `{ success: true, sync_status: 'failed_sync' }` to the LLM — conversation continues uninterrupted

#### 1B-iii: Fix cancelAppointment (GAP FROM VERIFIER)
**Current code (line 294):** `getGoogleConfig()` is called BEFORE the DB update at line 299, with NO try/catch. If OAuth is expired, the `getGoogleConfig` throws on line 294 and the DB `status = 'cancelled'` update at line 299 never runs. The appointment remains `"confirmed"` in the DB even though the user cancelled.

**Action:**
1. **DB first:** Move `ctx.supabase.from("appointments").update({ status: "cancelled" })` ABOVE the Google Calendar DELETE
2. **Google as secondary:** Wrap the `getGoogleConfig` + `fetch(DELETE)` in a try/catch
3. On Google failure: log error, set `sync_status = 'failed_sync'`
4. Return `{ success: true }` regardless of Google outcome

**Test:** Run `cancelAppointment` with expired Google OAuth token → DB row shows `status = 'cancelled'`, `sync_status = 'failed_sync'`, LLM receives `{ success: true }`.

---

## Phase 2 — Enforcing LLM Tool Discipline

### 2A: Global "Think, Act, Wait" Prompt Injection
**Current bug:** Llama 3.3 70B regularly writes conversational confirmations ("I have booked your appointment", "I have moved you to qualified") without the corresponding tool call in its `actions` array. The existing `validatePlanActions` only covers order/payment — not booking or CRM.

**Files to modify:**
- `supabase/functions/agent-orchestrator/agents/booking.ts` — system prompt
- `supabase/functions/agent-orchestrator/agents/sales.ts` — system prompt
- `supabase/functions/agent-orchestrator/agents/support.ts` — system prompt

**Action:**
Inject this directive into all three agent prompts (just after the existing `CRITICAL RULE` block in sales.ts, or as a new block in booking.ts and support.ts):

```
## CRITICAL EXECUTION DIRECTIVE
You are an automated operator. When deciding to use a tool (such as create_appointment, capture_lead, or update_lead_stage), you must adhere to a strict two-step execution loop:

1. Output ONLY the necessary parameters for the requested tool call.
2. STOP generating conversational text. You must wait for the system environment to return the execution payload.

UNDER NO CIRCUMSTANCES should you generate text confirming an action to the user (e.g., "I have successfully booked your appointment" or "I have moved your profile to qualified") until you receive a definitive "success" status from the tool's return payload. If a tool returns an error or fails to sync, apologize to the user and propose an alternative solution.
```

**Additional: Constrain Sales Agent pricing hallucination** (from fix2.md §2):
Add to the sales agent prompt:

```
## SALES AND PRICING PROTOCOL
Your knowledge regarding product pricing, subscription tiers, and technical integrations is strictly limited to the information provided by the match_kb_chunks tool.
- Do not invent, estimate, or hallucinate pricing numbers.
- Do not promise features unless explicitly confirmed by the knowledge base context.
- If a user asks for pricing or technical specifics that are not found in the tool's return payload, you must explicitly state: "I don't have those exact specifications on hand, but I can connect you with management to get you an accurate answer."
```

---

### 2B: Expand validatePlanActions to Cover Booking & CRM
**Current bug:** `validatePlanActions` only checks for `create_order` and `confirm_payment`. It does not verify booking, lead capture, or pipeline stage actions — so hallucinated booking/CRM actions go unchecked.

**Files to modify:**
- `supabase/functions/agent-orchestrator/pipeline/t3-planner.ts`

**Action:**
Add verification blocks for:

1. **Booking detection:** If customer message contains appointment intent keywords (`book|appointment|schedule|visit|consult|slot`) AND plan.actions doesn't include `create_appointment`, AND customer hasn't already booked in this session (check `appointments` table for existing row with this session_id) → auto-inject `create_appointment`

2. **Lead capture detection:** If plan.response contains capture phrases (`captured|saved your details|saved your info|added you as a lead`) AND plan.actions doesn't include `capture_lead` → flag as hallucination, strip the offending text from response, append `[Correction: You claimed to capture a lead but did not call capture_lead. Apologize.]`

3. **Pipeline stage detection:** If plan.response contains stage-change phrases (`moved to qualified|promoted to proposal|advanced to negotiation`) AND plan.actions doesn't include `update_lead_stage` → flag as hallucination, strip the offending text, append correction.

4. **Pricing/KB hallucination detection (GAP 3 FIX):** If plan.response contains pricing claims (`₹|Rs\.|price|cost|subscription|tier|plan|worth|value`) AND `match_kb_chunks` is not in the actions array AND session has no prior KB result cached → flag as hallucination, strip the pricing claims from response, append `[Correction: You provided pricing information without consulting the knowledge base. Only provide pricing if returned by match_kb_chunks.]`

**Edge cases:**
- Customer may be asking about an existing booking, not making a new one — check for phrases like `"my appointment"`, `"existing"`, `"reschedule"` before injecting
- Lead may have already been captured earlier in the session — skip if `session.contact_id` is already set
- Stage changes may reference a stage the contact is already in — query DB before attempting
- Pricing middleware must not flag legitimate KB results: track whether `match_kb_chunks` was executed this session (check `agent_traces` for last 5 minutes), and skip the pricing check if it was

---

## Pre-Phase: Quick Wins (Wave 0)

### 0A: Add `refund` and `complaint` to Default Escalation Keywords
**Current code:** `guards/escalation.ts` lines 3-6 — `DEFAULT_KEYWORDS` only includes `human, agent, person, manager, staff, real person, manav, insaan, human chahiye, real agent, talk to someone`. A customer asking "I want a refund" or "this is a complaint" will NOT trigger escalation for workspaces using defaults.

**Files to modify:**
- `supabase/functions/agent-orchestrator/guards/escalation.ts`

**Action:**
Add `refund`, `complaint`, `refund chahiye` to `DEFAULT_KEYWORDS` array.

**Test:** Send "I want a refund" → T0 escalation guard triggers as `guardrail_escalation`.

---

## Phase 3 — Fixing the Escalation Flow

### 3A: Bridge T0 and T3 for Escalation Handoffs
**Current bug:** T0 (instant response tier) correctly identifies escalation keywords (`refund`, `complaint`, `manager`) and sets `session.status = 'escalated'`. However, `t0-instant.ts` only returns early for `billing` or `window` limit reasons — the escalation payload is discarded, and T3 never knows the session was escalated. The user just gets a generic LLM response instead of a handoff.

**Files to modify:**
- `supabase/functions/agent-orchestrator/pipeline/t0-instant.ts`
- `supabase/functions/agent-orchestrator/pipeline/t3-planner.ts`

**Action (t0-instant.ts):**
In the escalation guard logic, after the existing `credits`/`blocked`/`window` checks, add a check for `guardrail_escalation`:

```
if (guardResult.reason?.includes("escalation")) {
  return {
    handled: true,
    shouldEscalate: true,
    response: 'I completely understand why this is frustrating. I am escalating your profile to our management team right now so they can resolve this.'
  };
}
```

**Action (t3-planner.ts):**
At the start of the T3 execution loop (before LLM generation), add a priority check:
```
const { data: session } = await ctx.supabase
  .from('conversation_sessions')
  .select('status')
  .eq('id', ctx.session.id)
  .single();
if (session?.status === 'escalated') {
  // Bypass LLM generation — use request_handoff tool directly, NOT existing handleHandoff()
  return await toolExecutor.run("request_handoff", { 
    target_agent: "customer_support", 
    reason: "escalation" 
  }, ctx);
}
```

**⚠️ KEY IMPLEMENTATION NOTE (GAP 2 FIX):** Do NOT use the existing `handleHandoff(ctx, targetAgent, context)` function. It requires 3 args and does a full LLM call to generate a plan for the target agent — completely inappropriate for escalation (the LLM will try to resolve the issue itself). Instead, use the `request_handoff` tool directly via `toolExecutor.run()`. This sends the handoff message and stops processing without an LLM round-trip.

---

### 3B: Escalation & Handoff Prompt for Support Agent
**Current bug:** When the support agent receives an escalated session, it tries to resolve the issue itself rather than yielding to the escalation. It may ask for order IDs, try to use missing tools, or loop endlessly.

**Files to modify:**
- `supabase/functions/agent-orchestrator/agents/support.ts`

**Action:**
Add this section to the support agent system prompt:

```
## ESCALATION PROTOCOL
If the conversation status indicates the user is frustrated, requests a refund, or asks for management, you must immediately halt standard troubleshooting.
- Do not attempt to resolve the issue further or ask for external data like order IDs.
- Output a single empathetic statement acknowledging the friction.
- Immediately invoke the request_handoff tool to transfer the session.
- Example response: "I completely understand why this is frustrating. I am escalating your profile to our management team right now so they can resolve this."
```

---

### 3C: Create Support Ticket Tool (CRITICAL — Was Missing from Original Plan)
**Current gap:** The support agent has NO tool to create support tickets. When escalation triggers, the agent can only hand off to another agent or send a message — there's no persistent ticket/promise to follow up. This means escalated issues have no traceable record of resolution.

**Files to create/modify:**
- `supabase/functions/agent-orchestrator/tools/impl/support-ticket.ts` — new file
- `supabase/functions/agent-orchestrator/tools/registry.ts` — register the tool
- `supabase/functions/agent-orchestrator/agents/support.ts` — add to tool list
- `supabase/migrations/*` — new migration for `support_tickets` table

**Action:**
1. **Database migration:** Create `support_tickets` table:
```sql
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
  session_id UUID NOT NULL REFERENCES public.conversation_sessions(id),
  contact_id UUID REFERENCES public.contacts(id),
  ticket_number TEXT UNIQUE NOT NULL,
  subject TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Ticket number generator function
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT LANGUAGE SQL AS $$
  SELECT 'TKT-' || UPPER(SUBSTRING(MD5(NOW()::TEXT || RANDOM()::TEXT) FOR 7));
$$;
```

2. **New tool implementation (`tools/impl/support-ticket.ts`):**
```typescript
export async function createTicket(
  params: { subject: string; description: string; priority?: string },
  ctx: PipelineContext
) {
  const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
  const { data: session } = await ctx.supabase
    .from('conversation_sessions')
    .select('contact_id')
    .eq('id', ctx.session.id)
    .single();
  
  const { data: ticket } = await ctx.supabase
    .from('support_tickets')
    .insert({
      workspace_id: ctx.payload.workspace_id,
      session_id: ctx.session.id,
      contact_id: session?.contact_id || null,
      ticket_number: ticketNumber,
      subject: params.subject,
      description: params.description,
      priority: params.priority || 'normal',
      status: 'open'
    })
    .select()
    .single();
  
  return { 
    success: true, 
    ticket_id: ticket?.id,
    ticket_number: ticketNumber,
    status: 'open'
  };
}
```

3. **Registry:** Add `create_ticket` to `AGENT_TOOLS.support` in `registry.ts`

4. **Support prompt:** Add `- create_ticket: Create a support ticket for issues that need tracking` to the tool list in `support.ts`

**Test:** After escalation triggers and request_handoff fires, the receiving agent can run `create_ticket` → support_tickets row created in DB.

---

## Cleanup Tasks

### Task A: Fix `enrichResponseWithToolResults` for captureLead return shape
**Current code:** `t3-planner.ts` line ~261 checks `data.id || data.lead_id` to decide if tool results should be appended to the response. After Phase 1A, `captureLead` returns `{ success, contact_id, session_linked }` — none of which match `id` or `lead_id`. The enrichment "I have saved your information..." will never fire.

**Files to modify:**
- `supabase/functions/agent-orchestrator/pipeline/t3-planner.ts`

**Action:**
Add `data.contact_id` to the enrichment check condition: `data.id || data.lead_id || data.contact_id`

### Task B: Reorder Guards — Run Escalation Check Before Credits/Window
**Current code:** `guards/index.ts` runs guards in this order: `non_text → credits → window → escalation → blocked → sales → pricing → tokens → greeting`. If credits expired or 24h window closed, escalation is never checked (the user might be asking for a refund when out of credits).

**Files to modify:**
- `supabase/functions/agent-orchestrator/guards/index.ts`

**Action:**
Move the escalation guard (`checkEscalation`) to run BEFORE `checkCredits` and `checkWhatsAppWindow`. The new order: `non_text → escalation → blocked → credits → window → sales → pricing → tokens → greeting`.

**Rationale:** Escalation should always be checked regardless of billing state. A user wanting a refund or manager should be escalated even if their credits are exhausted.

---

## Summary of All Files Changed

| File | Change |
|------|--------|
| `guards/escalation.ts` | Add `refund`, `complaint` to `DEFAULT_KEYWORDS` |
| `guards/index.ts` | Reorder guards: escalation before credits/window |
| `tools/impl/crm.ts` | `capture_lead` updates `session.contact_id` after upsert |
| `tools/impl/calendar.ts` | `updateAppointment` + `cancelAppointment` do DB first, Google as secondary |
| `tools/impl/support-ticket.ts` | **NEW** — `createTicket` tool implementation |
| `tools/registry.ts` | Register `create_ticket` in `AGENT_TOOLS.support` |
| `agents/booking.ts` | Add "Think, Act, Wait" directive |
| `agents/sales.ts` | Add "Think, Act, Wait" + pricing constraint directives |
| `agents/support.ts` | Add "Think, Act, Wait" + escalation protocol + `create_ticket` tool |
| `pipeline/t0-instant.ts` | Make escalation reason trigger early handoff return |
| `pipeline/t3-planner.ts` | Add escalation status check (use `request_handoff`, NOT `handleHandoff`); expand `validatePlanActions` with booking/CRM/pricing verification; fix `enrichResponseWithToolResults` for `data.contact_id` |
| `supabase/migrations/*` | Migration 1: `appointments.sync_status` column. Migration 2: `support_tickets` table |

## Dependencies & Execution Order

```
Wave 0 (pre-fix): 0A (escalation.ts keywords) — independent, can run anytime
                   Task B (guard reorder) — independent, can run anytime

Wave 1 (parallel): 1A (crm.ts), 1B (calendar.ts), 3A-partial (t0-instant.ts only)

Wave 2 (depends on 1A+1B): 2A (prompts: booking.ts, sales.ts, support.ts)

Wave 3 (depends on 2A): 2B (t3-planner.ts: validatePlanActions expansion — booking, CRM, AND pricing)

Wave 4 (depends on Wave 3): 3A-continued (t3-planner.ts: escalation check — must run AFTER 2B)
                             Task A (enrichment fix for captureLead — same file)

Wave 5 (independent): 3B (support prompt — refine protocol text)

Wave 6 (new): 3C (create_ticket tool — new file + registry + migration)
```

**CRITICAL — t3-planner.ts merge prevention:** Three tasks touch `t3-planner.ts`:
1. **2B** adds booking/CRM/pricing blocks to `validatePlanActions` (lines ~455-509)
2. **3A** adds escalation status check at start of `runT3` (before line ~17)
3. **Task A** modifies the enrichment condition (line ~261)

Apply in order: 2B → Task A → 3A. These modify different sections of the file and will NOT conflict IF applied sequentially. Do NOT mix into one edit — keep changes isolated.

## Verification Checklist

After all changes deployed, run the 3-phase isolation test again:
- [ ] Phase 1 (Booking): Appointment created in DB, `capture_lead` links contact to session, Google Calendar failure doesn't block DB update or cancel, no hallucinated booking confirmations
- [ ] Phase 2 (Sales): Lead captured + session linked via `contact_id`; pipeline stage updates work; pricing questions use KB only; enrichment fires on lead capture
- [ ] Phase 3 (Support): Escalation keyword (`refund`, `manager`, `complaint`) triggers T0 handoff → session status escalated → T3 bypasses LLM → `request_handoff` invoked → user receives transition text
- [ ] Phase 3C: After handoff, receiving agent can create a support ticket → `support_tickets` row present in DB with `status = 'open'`
- [ ] Guard order: Escalation check runs BEFORE credits/window — a user asking for a refund with 0 credits still gets escalated
- [ ] Default keywords: Sending "I want a refund" without custom config triggers escalation guard

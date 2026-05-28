# Phase 0: Agent Hardening - Bug Cross-Reference Research

**Researched:** 2026-05-24
**Domain:** Agent ecosystem hardening — multi-agent pipeline state machine, LLM hallucination containment, escalation flow, CRM session linkage
**Confidence:** HIGH

## Summary

Researched all 6 known bugs from the 3-phase isolation test against the `agent-hardening-plan.md`, the actual source code, `docs/fix1.md`, and `docs/fix2.md`. **Verdict: HAS_GAPS** — 5 of 6 bugs are adequately covered, but **Bug 6 (missing `create_ticket` tool) is entirely absent from the plan**. Additionally, 4 nuance gaps were found where the plan's proposed fixes would be incomplete or conflict with existing code. Seven additional bugs were discovered in the source code (4 original findings + 3 related to the plan's own proposed changes).

---

<phase_requirements>
## Phase Requirements

| Bug ID | Description | Research Support |
|--------|-------------|-----------------|
| BUG-01 | Google Calendar crash in updateAppointment/cancelAppointment | Confirmed in `calendar.ts` L251-278 (update), L281-301 (cancel) |
| BUG-02 | LLM hallucinates booking confirmation without tool call | Confirmed: `validatePlanActions` lacks booking checks; booking agent prompt has weak enforcement |
| BUG-03 | CRM session linkage broken | Confirmed: `captureLead` in `crm.ts` L4-27 never updates `conversation_sessions.contact_id` |
| BUG-04 | LLM hallucinates pricing tiers | Confirmed: sales agent prompt has no KB pricing constraint |
| BUG-05 | Escalation guard is a no-op | Confirmed: T0 discards escalation response; T3 never checks session status |
| BUG-06 | No ticket creation tool | Confirmed: zero `create_ticket` references in entire codebase |
</phase_requirements>

---

## Bug Cross-Reference Matrix

| Bug | In Plan? | Plan Fix Correct? | Code Confirms Bug? | Notes |
|-----|----------|-------------------|--------------------|-------|
| **1. Google Calendar dependency crash** | ✅ Phase 1B | ✅ Correct approach (DB first, Google secondary) | ✅ `calendar.ts` L267-272: `getGoogleConfig` + `fetch(PATCH)` BEFORE DB update at L273, no try/catch. `cancelAppointment` L293-297: same pattern. | **Plan nuance gap:** `createAppointment` (L121-139) already has try/catch around Google — plan doesn't mention this distinction. |
| **2. LLM hallucinates booking confirmation** | ✅ Phase 2A (prompt injection) + 2B (validatePlanActions) | ✅ Partially correct — prompt injection is necessary; validatePlanActions expansion adds runtime guard | ✅ `validatePlanActions` (t3-planner.ts L455-509) only checks `create_order`/`confirm_payment`. Booking agent prompt (booking.ts L299-303) has "NEVER say" but no enforcement. | **Plan nuance gap:** Booking FSM (`handleBooking`) runs BEFORE T3 LLM gen and handles collection independently. The hallucination occurs when LLM claims booking without tool call in the plan. Plan 2B's keyword-based detection (`book|appointment|schedule`) is correct but may false-positive on existing appointment queries. |
| **3. CRM session linkage broken** | ✅ Phase 1A | ✅ Correct — add session contact_id update after upsert | ✅ `captureLead` (crm.ts L8-26): `contacts.upsert()` never updates `conversation_sessions.contact_id`. `updateLeadStage` (L33) reads NULL contact_id. | **Plan nuance gap:** Fix changes `captureLead` return shape to `{ success: true, contact_id, session_linked: true }` but `enrichResponseWithToolResults` (t3-planner.ts L261-266) checks for `data.id || data.lead_id` — the enrichment may not fire. Also, `scheduleFollowUp` (L63) and `generateQuote` (L80) also read null `contact_id` silently. |
| **4. LLM hallucinates pricing tiers** | ✅ Phase 2A (SALES AND PRICING PROTOCOL) | ⚠️ Prompt-only — no middleware enforcement | ✅ Sales agent prompt (sales.ts) has zero pricing constraints. `match_kb_chunks` is in the tool list but its use is not enforced. | **Plan omission:** No `validatePlanActions` check for pricing/KB hallucination. If LLM ignores the prompt constraint, there is no runtime guard to catch fabricated pricing — only prompt enforcement. |
| **5. Escalation guard is a no-op** | ✅ Phase 3A (t0-instant.ts + t3-planner.ts) | ⚠️ Plan's `handleHandoff` concept conflicts with existing implementation | ✅ `checkEscalation` (escalation.ts L13-15) correctly sets `status = 'escalated'`. `runT0` (t0-instant.ts L31-37) discards escalation because `guardrail_escalation` doesn't match `credits|blocked|window`. Falls through to `{ handled: false }`. | **Plan nuance gap:** Plan says `return await handleHandoff(ctx)` but existing `handleHandoff` (t3-planner.ts L392-421) signature is `(ctx, targetAgent, context)` — will not compile. Existing function does a FULL LLM call for target agent, which is wrong for escalation (should just send handoff message). Plan also doesn't note that escalation guard runs AFTER credits/window — if one of those fires first, escalation is never checked. |
| **6. No ticket creation tool** | ❌ **NOT IN PLAN** | ❌ N/A | ✅ Zero references to `create_ticket`, `support_ticket`, or any ticket creation across entire codebase. Support agent tools: `match_kb_chunks, get_contact_history, update_contact, request_handoff` only. | **Critical gap.** The support agent has no way to create support tickets. Escalation can only hand off to another agent or send a message — no persistent ticket/promise to follow up. |

### Partially Fixed Bugs (v292) — Verified

| Bug | Status | Evidence |
|-----|--------|----------|
| **7. Router missing "pricing" keyword** | ✅ Fixed v292 | Pricing guard exists at `guards/pricing.ts`, routing handles pricing |
| **8. Sales agent lacked match_kb_chunks** | ✅ Fixed v292 | `AGENT_TOOLS.sales` includes `"match_kb_chunks"` (registry.ts L241), sales prompt references it |

---

## Additional Bugs Found (not in original 6)

### Bug A: `runAllGuards` guard order prevents escalation check
**Severity:** MEDIUM
**Location:** `guards/index.ts` L29-44
**Details:** Guards run sequentially: `non_text → credits → window → escalation → blocked → sales → pricing → tokens → greeting`. If `checkCredits` fires first (user ran out of credits), or `checkWhatsAppWindow` fires first (outside 24h window), the escalation guard is NEVER run. A user asking "I want a refund, talk to a human" after the 24h window just gets the window message — their escalation intent is lost.
**Plan coverage:** ❌ Not addressed

### Bug B: `scheduleFollowUp` and `generateQuote` silently use null contact_id
**Severity:** LOW
**Location:** `crm.ts` L63, L80
**Details:** Both functions read `session.contact_id` from `conversation_sessions`. With Bug 3 (CRM linkage broken), `contact_id` is always null. These functions silently insert `contact_id: null` into `follow_ups` and `quotes` tables — data is orphaned. Fixing Bug 3 would fix this transitively, but there's no guard against null being silently inserted.
**Plan coverage:** ❌ Not mentioned (but fixed transitively by Phase 1A)

### Bug C: `handleHandoff` incompatible with plan's escalation fix
**Severity:** HIGH (plan correctness)
**Location:** `t3-planner.ts` L392-421
**Details:** The plan says Phase 3A should add `return await handleHandoff(ctx)` when session is escalated. But:
1. Existing `handleHandoff(ctx, targetAgent, context)` requires 3 args, plan passes 1
2. Existing function does a **full LLM call** to generate new plan for target agent
3. For escalated sessions, we should NOT call LLM again (defeats the purpose)
4. Need a separate handoff path: directly send handoff message + update session
**Plan coverage:** ⚠️ Plan describes correct concept but proposes wrong implementation

### Bug D: `enrichResponseWithToolResults` won't fire for updated `captureLead` return
**Severity:** LOW
**Location:** `t3-planner.ts` L261-266, `crm.ts` line 26
**Details:** Plan changes `captureLead` return to `{ success, contact_id, session_linked }`. But `enrichResponseWithToolResults` checks `data.id || data.lead_id` — neither key exists in the new return. The enrichment message "I have saved your information..." will never append. (This is already broken with current return `{ success, contact_id }` — `contact_id` doesn't match `id` or `lead_id` either.)
**Plan coverage:** ❌ Not mentioned

### Bug E: No middleware check for pricing/KB hallucination
**Severity:** MEDIUM
**Location:** `t3-planner.ts` L455-509
**Details:** Plan Phase 2A adds pricing constraint to sales prompt (prompt-only). But if LLM ignores the prompt, there is no `validatePlanActions` middleware to catch pricing hallucination. The plan adds booking/CRM validation to `validatePlanActions` (Phase 2B) but not pricing/KB claims.
**Plan coverage:** ❌ Not addressed

### Bug F: `checkAvailability` has no session-level existing-booking check
**Severity:** LOW
**Location:** `calendar.ts` L59-81
**Details:** `checkAvailability` calls Google Calendar freeBusy and returns available slots. It doesn't check if the session already has a confirmed appointment. `createAppointment` DOES check this (L97-104), but `checkAvailability` may return slots that are contradictory with an already-booked appointment for this session.
**Plan coverage:** ❌ Not addressed (low priority)

### Bug G: Escalation keyword mismatch — actual code may not flag `refund` or `complaint`
**Severity:** MEDIUM
**Location:** `guards/escalation.ts` L3-6
**Details:** Default escalation keywords do NOT include `refund` or `complaint` — only `human, agent, person, manager, staff, real person, manav, insaan, human chahiye, real agent, talk to someone`. The bug report says escalation identifies these keywords, which implies the workspace config has custom keywords. But for workspaces using defaults, escalation for "I want a refund" or "this is a complaint" would be missed entirely. The guard config `workspace.guardrail_config?.escalation_keywords` can customize this, but there's no fallback check.
**Plan coverage:** ❌ Not addressed (should add `refund`, `complaint` to defaults or document the gap)

---

## Additional Nuances the Plan Misses

### From fix1.md Recommendations
| Recommendation | In Plan? | Notes |
|---------------|----------|-------|
| Lead capture + session linkage | ✅ Phase 1A | Covered |
| Decouple DB from Google Calendar | ✅ Phase 1B | Covered, but plan doesn't note `createAppointment` already has try/catch |
| "Think, Act, Wait" prompt injection | ✅ Phase 2A | Covered |
| Expand validatePlanActions for booking/CRM | ✅ Phase 2B | Covered — but plan uses "check actions array" approach vs fix1.md's "check DB state" approach |
| Constrain pricing KB for Sales | ✅ Phase 2A | Covered — but prompt-only, no middleware |
| Bridge T0 and T3 for handoffs | ✅ Phase 3A | Covered — but implementation conflicts with existing `handleHandoff` |
| **Check DB state in validatePlanActions** | ❌ | fix1.md recommends verifying DB state (e.g., checking `contacts.pipeline_stage` when LLM claims "moved to qualified"). Plan only checks if tool is in actions array — less robust. |

### From fix2.md Recommendations
| Recommendation | In Plan? | Notes |
|---------------|----------|-------|
| CRITICAL EXECUTION DIRECTIVE | ✅ Phase 2A | Covered |
| SALES AND PRICING PROTOCOL | ✅ Phase 2A | Covered |
| ESCALATION PROTOCOL | ✅ Phase 3B | Covered |
| Session linkage in capture_lead | ✅ Phase 1A | Covered |
| Middleware expansion | ✅ Phase 2B | Covered — but see fix1.md note about DB state verification |
| Local sync decoupling | ✅ Phase 1B | Covered |

---

## Verdict

**Verdict: HAS_GAPS**

### Covered (5/6 bugs + 2 partial fixes):
| # | Status |
|---|--------|
| Bug 1 | ✅ Plan covers adequately — fix is correct (DB first, Google secondary) with minor nuance gap |
| Bug 2 | ✅ Plan covers adequately — prompt injection + validatePlanActions expansion covers both angles |
| Bug 3 | ✅ Plan covers adequately — session linkage fix is correct |
| Bug 4 | ⚠️ Plan covers partially — prompt-only, no middleware enforcement |
| Bug 5 | ✅ Plan covers adequately — T0 + T3 fixes described correctly (but see implementation conflict below) |
| Bug 7 | ✅ Already fixed in v292 |
| Bug 8 | ✅ Already fixed in v292 |

### Gaps (not covered or incorrectly addressed):

**GAP 1 — CRITICAL: Bug 6 — No `create_ticket` tool**
- Entirely missing from the plan
- Support agent cannot create support tickets
- **Recommendation:** Add a Phase 3C or include in Phase 3: Create `create_ticket` tool definition in `registry.ts`, implement in `tools/impl/` (or extend support tools), add to support agent tool list. The tool should create a row in a `support_tickets` table (tracking id, status, priority, session_id, workspace_id, description).

**GAP 2 — MEDIUM: Plan's Phase 3A `handleHandoff` conflicts with existing implementation**
- Plan says `return await handleHandoff(ctx)` (1 arg) but existing function requires 3 args `(ctx, targetAgent, context)`
- Existing `handleHandoff` does a full LLM call — inappropriate for escalation scenarios
- **Recommendation:** Create a new `handleEscalationHandoff(ctx)` function that: (a) sends pre-configured handoff message, (b) updates session status, (c) returns immediately without LLM call. Alternatively, use the existing `request_handoff` tool via `toolExecutor.run("request_handoff", { target_agent: "customer_support", reason: "escalation" }, ctx)`.

**GAP 3 — MEDIUM: Plan's `validatePlanActions` expansion doesn't cover pricing/KB hallucination**
- Bug 4 fix is prompt-only (Phase 2A)
- No middleware check for when LLM claims to have KB data it didn't retrieve
- **Recommendation:** Add pricing/KB hallucination detection to `validatePlanActions`: If response contains pricing/tier claims (`₹|Rs\.|price|cost|subscription|tier|plan`) AND `match_kb_chunks` is not in the actions array AND session has no KB cache, strip the offending text and append correction.

**GAP 4 — MEDIUM: Escalation guard order prevents escalation check in some scenarios**
- Credits or window guards run BEFORE escalation guard
- If credits expired or 24h window closed, escalation intent is silently dropped
- **Recommendation:** Run escalation guard earlier (before credits/window) OR merge escalation check into runT0 as a standalone check not dependent on guard order.

**GAP 5 — LOW: Plan doesn't mention updating `enrichResponseWithToolResults` for new `captureLead` return shape**
- New return `{ success, contact_id, session_linked }` doesn't match existing enrichment check `data.id || data.lead_id`
- Already broken in current code too (uses `contact_id` not `id`)
- **Recommendation:** Update `enrichResponseWithToolResults` to also check `data.contact_id`

**GAP 6 — LOW: Default escalation keywords missing `refund` and `complaint`**
- Bug report assumes these work, but defaults don't include them
- Workspaces must configure custom keywords
- **Recommendation:** Add `refund`, `complaint`, `refund chahiye`, `complaint` to `DEFAULT_KEYWORDS` in `escalation.ts`

### Recommended Priority Order

```
Wave 0 (Pre-fix): Add `refund`, `complaint` to DEFAULT_KEYWORDS in escalation.ts
Wave 1 (Parallel): Phase 1A (crm.ts), Phase 1B (calendar.ts), Phase 3A-partial (t0-instant.ts)
Wave 2: Phase 2A (prompts: booking/sales/support) + GAP 3 fix (pricing middleware in validatePlanActions)
Wave 3: Phase 2B (validatePlanActions expansion) — includes GAP 3 pricing checks
Wave 4: Phase 3A-continued (t3-planner.ts escalation check) — with GAP 2 fix (use request_handoff tool, not existing handleHandoff)
Wave 5: Phase 3B (support prompt)
Wave 6: GAP 1 (create_ticket tool + schema) — new wave, not in original plan
Wave 7: GAP 4 (reorder guards) + GAP 5 (enrichment fix) + GAP 6 (default keywords) — cleanup
```

---

## Sources

### Primary (HIGH confidence)
- Source code files listed in scope — verified every line
- `agent-hardening-plan.md` — full analysis of all 220 lines
- `docs/fix1.md` and `docs/fix2.md` — cross-referenced against plan

### Secondary (MEDIUM confidence)
- Conference knowledge of isolation test bug reports
- Understanding of Deno Edge Runtime and Supabase patterns

---

## Metadata

**Confidence breakdown:**
- Bug confirmation: HIGH — all 6 bugs verified against actual source code
- Plan coverage: HIGH — plan read in full, cross-referenced against each bug
- Implementation correctness: MEDIUM — some plan details conflict with existing code
- Additional bugs: MEDIUM — found via static analysis, unconfirmed by runtime testing

**Research date:** 2026-05-24
**Valid until:** 2026-06-24 (codebase is actively developed)

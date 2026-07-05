# Session Handover: T2 Task Decomposition + T5 Retry + T3 Re-query

## What Changed

### 3 Pipeline Improvements Implemented:

**1. T2 Task Decomposition** (`t2-router.ts` + `t3-planner.ts` + `types.ts`)
- T2 LLM prompt now detects multi-request messages and outputs `sub_tasks[]`
- `sub_tasks` stored in `ctx._subTasks` and injected into T4 system prompt
- Example: "Book appointment and check pricing" → sub_tasks: [{agent:"appointment_booking",intent:"book"}, {agent:"sales",intent:"pricing"}]
- Other sub-tasks listed in T4 system prompt so LLM is aware of all requests

**2. T5 Retry Loop** (`index.ts` + `t4-reflection.ts`)
- If T5 flags response as empty/generic, pipeline retries T4+T5 once
- T5 now returns `retry_hint` with specific guidance for the retry
- Retry re-queries KB with lower threshold (0.25) if initial KB was empty
- Limits to 1 retry (not infinite loop)

**3. T3 Re-query** (`t3-context.ts` + `kb.ts`)
- `runT3` accepts optional `requeryContext` with `previous_empty` flag
- On re-query, uses 0.25 match_threshold (configurable per workspace kb_config)
- `matchChunks` in `kb.ts` now accepts optional `match_threshold` override

## Files Modified
- `supabase/functions/agent-orchestrator/lib/types.ts` — QueryAnalysis.sub_tasks, PipelineContext._subTasks/_retryHint
- `supabase/functions/agent-orchestrator/pipeline/t2-router.ts` — T2 prompt with task decomposition, parse sub_tasks
- `supabase/functions/agent-orchestrator/pipeline/t3-context.ts` — Accept requeryContext for re-query
- `supabase/functions/agent-orchestrator/pipeline/t3-planner.ts` — Inject sub_tasks + retry_hint into system prompt
- `supabase/functions/agent-orchestrator/pipeline/t4-reflection.ts` — Return retry_hint on failure
- `supabase/functions/agent-orchestrator/tools/impl/kb.ts` — Accept match_threshold override
- `supabase/functions/agent-orchestrator/index.ts` — T5 retry loop with T3 re-query

## Auth Change
- Function now also accepts `SUPABASE_ANON_KEY` via Authorization header (in addition to service_role key and user JWTs)

## Session Handover: T2 Routing Fix (v595)

### Root Cause
The follow-up check in `t2-router.ts` was running **before** the keyword pre-check and catching booking intents on the **first message** of a fresh session. Three factors combined:
1. `working_context.agent_type` defaults to `"customer_support"` on new session creation (`session.ts:122`)
2. The follow-up regex matched "book" / "appointment" in `/(cancel|reschedule|...|book|...|appointment|...)/i` — so "i wanna book a appointment" matched
3. `conversationContext` was non-empty because T0 already stored the current message before T2 ran

Result: "i wanna book a appointment" → follow-up check → kept `customer_support` → **never reached keyword pre-check**

### Fix (v595)
Two changes to `pipeline/t2-router.ts`:
1. **Reordered**: keyword pre-check (booking/sales regex) now runs **before** the follow-up check
2. **Added guard**: `(ctx.session.message_count ?? 0) > 0` to follow-up check — prevents it from firing on the first message of a session

### Verification (v595)
- **booking intent**: ✅ routes to `appointment_booking` (`agent_type: "appointment_booking"`)
- **general inquiry**: ✅ routes to `customer_support`
- **pricing** (`sales` soft-deleted): ✅ falls back to `customer_support` via LLM
- **cancel**: ✅ routes to `appointment_booking`
- **"yes" alone (no history)**: ✅ correctly goes to LLM → `customer_support` (follow-up blocked by message_count guard)

## Session Handover: Audit Fixes — C2/C7/C9/H22 (2026-07-05)

### Fixes Applied

**C7 — Hardcoded UUIDs in migration** (`supabase/migrations/20260522000000_restore_whatsapp_link.sql`)
- Wrapped INSERT/UPDATE in `DO $$ BEGIN IF EXISTS (SELECT 1 FROM workspaces WHERE id = '…') THEN … END IF; END $$;`
- Fresh deploys no-op instead of FK errors

**C9 — `supabase: any` in types.ts** (`supabase/functions/agent-orchestrator/lib/types.ts`)
- Added `import type { SupabaseClient } from "jsr:@supabase/supabase-js@2"`
- Changed `supabase: any` → `supabase: SupabaseClient`

**H22 — Silent test failure in CI** (`.github/workflows/ci.yml`)
- Removed `|| true` from `test-edge-functions` step — failures now fail the workflow

**C2 — Widget API SECURITY DEFINER** (`migrations/20260705000004_widget_security_definer.sql` + `src/app/api/widget/message/route.ts`)
- Created 3 new SECURITY DEFINER PG functions:
  - `get_widget_config(uuid)` — lightweight workspace+config validation for domain allowlist
  - `handle_widget_message(uuid, text, text, text, text)` — all DB writes (session, contact, message)
  - `get_widget_messages(uuid, text, timestamptz)` — reads for poll endpoint
- All granted EXECUTE to `anon` role
- Route now uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` for DB operations via `supabase.rpc()`
- `service_role` retained only for `supabaseAdmin.functions.invoke('agent-orchestrator')`
- `get_widget_config` validates workspace + widget config; route does domain allowlist check
- `handle_widget_message` uses SELECT-first-then-INSERT with `unique_violation` exception handler (PG-version-agnostic)

### Blocked
- **C1 (Secret Rotation)**: Needs user action to reset on Supabase dashboard, Google Cloud, GoWA, Resend
- **C14/C15**: Sentry removed (was never integrated)

## Verification

## Known Issues
- Edge function sometimes hits `WORKER_RESOURCE_LIMIT` (546) on cold start with 39 files + retry — Docker-not-running warning means raw TS files are deployed instead of bundled JS
- ⚠️ **workspace_id must be a full UUID** (e.g., `53ae24d7-33ea-4af8-a414-5b6635cd2e1c`). Passing only the short form (e.g., `53ae24d7`) causes `Cannot read properties of null (reading 'id')` in `getOrCreateSession` when the contact insert fails with `uuid = 'short_string'` comparison error. The function silently returns 500 with `{"error":"Internal error"}`.

## Session Debugging & Fix (v585)
### Root Cause of Persistent 500 Crash (v575–v584)
The "persistent 500 error" that plagued versions 575–584 was caused by **invalid UUID format** in the `workspace_id` field. When called with a short workspace ID (e.g., `53ae24d7` instead of the full `53ae24d7-33ea-4af8-a414-5b6635cd2e1c`), PostgreSQL rejects the UUID comparison, causing:
1. `getOrCreateSession` → no existing session found → tries to create contact
2. Contact insert fails (UUID mismatch in query) → `.insert().select('id').single()` returns `null`
3. `newContact.id` throws `Cannot read properties of null (reading 'id')`
4. The error was NOT caught by processMessage's inner try/catch (it used the wrong catch syntax) — only the outermost handler caught it, returning `{"error":"Internal error"}`

### What We Fixed
- **`index.ts`**: Restructured error handling — `processMessage` now has its own try/catch that logs to `debug_logs` table and returns a descriptive `[CRASH]` response for `is_test` requests instead of opaque 500
- **`session.ts`**: Harden contact insert — if `.insert().select('id').single()` returns null/error (e.g., unique constraint on `(workspace_id, phone)`), falls back to finding existing contact by phone, then tries an emergency insert, and finally uses `crypto.randomUUID()` as last resort
- **Test data cleaned**: Deleted test rows from `contacts` and `conversation_sessions`

### Verification Results (v585)
- **Greeting**: ✅ "Hi! Welcome to Webuild LLP. How can I help you today?" (guardrail_greeting)
- **Services**: ✅ Returns list of services (Consultation, Site Visits, Architectural Design, etc.) with `t5_passed`
- **Booking**: ✅ "I want to book an appointment" routed to `appointment_booking` agent, returns structured details request (service, date/time, name, email)
- **Auth**: ✅ Bad tokens return 401; valid service_role key returns 200
- **All v585 requests**: 200 status, zero 500 errors (first clean version since v574)

## Session Handover: T0–T3–Dispatch–Multi-Tenant Test Suite (v600)

### What Was Done
- **Audited** all 5 pipeline tiers, 9 DB objects, 8 tools, 9 guards, credit/embedding flow, and agent templates.
- **Wrote** `tests/pipeline_test.ts` (66 new tests) covering previously uncovered areas:
  - **T0 Guards** (25 tests): All 9 guards individually + `runAllGuards` + `runT0`
  - **T1 Cache** (5 tests): Hash hit/miss, `_cacheKeyHex`, determinism, case-insensitivity
  - **T3 Context** (8 tests): KB retrieval (support/sales), appointment lookup, empty KB, re-query at 0.25 threshold
  - **Dispatch** (6 tests): Message storage, long-message splitting, empty/short responses, agent_type propagation, timestamp update
  - **Multi-tenant** (6 tests): Workspace isolation for blocked topics, greetings, token budgets, T1 cache, T0 empty skip, T3 KB chunks
  - **Edge Cases** (6 tests): Empty workspace config, null KB, RPC errors, long word dispatch, guard priority, malformed greeting config
- **Fixed** `mocks.ts` — added missing chain methods (`.not()`, `.neq()`, `.in()`, `.range()`) to mock supabase
- **Fixed** re-query test — set `ctx.embedding` to bypass embedding generation (Supabase AI not available in tests)
- **238 tests pass total** (172 original + 66 new, 0 failures)

### 6 Untestable Areas Identified (no API key / no Edge Runtime)
1. T3 Planner full flow (system prompt + LLM + tool exec + credit decrement)
2. Full `index.ts` pipeline integration
3. Credits guard (needs DB)
4. Escalation guard (needs DB)
5. WhatsApp dispatch (needs GoWA)
6. T3 Planner system prompt (already covered by template tests)

### Files Modified
- `tests/pipeline_test.ts` — New file (66 tests, 881 lines)
- `tests/mocks.ts` — Added `.not()`, `.neq()`, `.in()`, `.range()` to mock supabase chain

## Session Handover: Review Fix — In-Memory `message_count` Sync (v599)

### Root Cause
`touchSession` in `lib/session.ts` incremented `message_count` in the database but **never updated `ctx.session.message_count`** in memory. The review check at `index.ts:157` — `(ctx.session.message_count ?? 0) > 2` — always saw 0, so support chats with 3+ messages never triggered a review.

Booking chats got reviews anyway via `_appointmentCreated` flag. Short chats (1–2 messages) correctly skipped reviews because the bug made `message_count` always 0.

### Fix (v599)
Added `ctx.session.message_count = newMessageCount;` at the end of `touchSession` (`lib/session.ts:187`), keeping the in-memory counter in sync after every DB write.

### Verified
- **Support chat (3 msgs + farewell)**: ✅ Review dispatched at `09:34:46`
- **Short chat (greeting + farewell)**: ✅ No review (correct — only 4 total messages)
- **Booking flow**: ✅ Still works (verified via `9199300033` earlier)

### Current Review Logic (`index.ts:154-162`)
- Fires on farewell match (thanks/bye at start of message)
- Requires meaningful work: `_appointmentCreated || _orderPlaced || message_count > 2`
- `_reviewSent` prevents double-send; `_wantsHuman` suppresses during handoff
- Requires `review_url` on workspace (maps URL for `53ae24d7`)

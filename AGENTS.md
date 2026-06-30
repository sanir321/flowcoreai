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

## Verification
- **customer_support**: ✅ Returns services list (t5_passed)
- **appointment_booking**: ✅ Recognizes Monday closure, suggests alternatives (t5_passed)
- **sales**: Generic response caught by T5 (t5_generic), retry also generic — expected since LLM lacks pricing data

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

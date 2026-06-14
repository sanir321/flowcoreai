# FlowCore AI Reply System — End-to-End System Design

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Channel Ingestion Layer](#2-channel-ingestion-layer)
3. [Message Processing Pipeline](#3-message-processing-pipeline)
4. [T0 — Instant Guards (Free Tier)](#4-t0--instant-guards-free-tier)
5. [T1 — Cache Layer](#5-t1--cache-layer)
6. [T2 — Router Layer](#6-t2--router-layer)
7. [T3 — Planner/LLM Layer](#7-t3--plannerllm-layer)
8. [Agent System Prompts](#8-agent-system-prompts)
9. [Tool System](#9-tool-system)
10. [LLM Integration](#10-llm-integration)
11. [Dispatch Layer](#11-dispatch-layer)
12. [Booking FSM](#12-booking-fsm)
13. [Guard Implementations](#13-guard-implementations)
14. [Data Flow Diagram](#14-data-flow-diagram)

---

## 1. Architecture Overview

The AI reply system is a **4-tier pipeline** (`T0 → T1 → T2 → T3`) that processes inbound messages from WhatsApp and webchat channels. It runs as a **Supabase Edge Function** (`agent-orchestrator`) written in Deno/TypeScript. Each tier can short-circuit the pipeline with a response; only T3 invokes the LLM.

```
WhatsApp Message → GoWA Webhook → process_webhook_message RPC → agent-orchestrator Edge Function
                                                                         ↓
                                                              T0 → T1 → T2 → T3 → Dispatch
```

**Key Design Decisions:**
- **Stateless Edge Function**: No persistent in-memory state; everything comes from Supabase DB
- **Fail-open fallback**: If LLM crashes, a static message is dispatched
- **Hallucination detection**: Plan validation patterns in T3 catch LLM claims without tool calls
- **Escalation as state**: Sessions can be `active` or `escalated`; escalated sessions get human-reminder responses from T0
- **Booking FSM**: A finite state machine for appointment booking runs alongside the LLM (not inside it)

---

## 2. Channel Ingestion Layer

### 2a. GoWA Webhook (`supabase/functions/gowa-webhook/index.ts`)

**Entry point for all WhatsApp messages.** GoWA (self-hosted WhatsApp web API) sends a POST request to this endpoint.

**Signature Verification (lines 22-41):**
```typescript
async function verifySignature(payload: string, signature: string | null, secret: string | undefined): Promise<boolean> {
  // HMAC-SHA256 verification using GOWA_WEBHOOK_SECRET
  // Accepts signatures with or without 'sha256=' prefix
}
```

**Webhook handler flow (lines 78-226):**
1. Verify HMAC signature
2. Parse `event` type — only processes `message` events
3. Skip group messages (`@g.us` JIDs)
4. Extract message text, media caption, media metadata
5. **Resolve workspace** via `resolveWorkspace()` — looks up `gowa_sessions` table by device_id, session, or phone JID
6. Call **`process_webhook_message` RPC** — atomic DB operation that:
   - Creates/updates contact
   - Creates/updates conversation session
   - Stores the inbound message
   - Returns `{ session_id, status }` (status can be `ok`, `duplicate`, `error`)
7. Fire background AI processing via `EdgeRuntime.waitUntil()`:
   - Fetch contact name from GoWA if the pushname is weak
   - Invoke `agent-orchestrator` edge function with full payload

```typescript
EdgeRuntime.waitUntil((async () => {
  const { error: aiError } = await aiClient.functions.invoke('agent-orchestrator', {
    body: {
      workspace_id, session_id, customer_jid, message,
      message_type, gowa_message_id, channel: 'whatsapp',
      ...(hasMedia ? { media_metadata } : {})
    },
    headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
  })
})())
```

**Security:** Uses `GOWA_WEBHOOK_SECRET` HMAC-SHA256 for request verification. No authentication on the edge function call (internal Supabase invoke uses service role key).

### 2b. `process_webhook_message` RPC (PostgreSQL function)

Called by the webhook. This function:
- Uses **advisory locks** to prevent duplicate webhook races
- Checks for existing message by `gowa_message_id` (deduplication)
- Creates or finds the contact and conversation session
- Inserts the inbound message with `direction: 'inbound'`
- Returns `{ session_id, status: 'ok' | 'duplicate' | 'error', reason }`

> **Note:** This function does not exist in local migration files; it was created directly in Supabase.

---

## 3. Message Processing Pipeline

Orchestrator entry point: `supabase/functions/agent-orchestrator/index.ts`

### Authentication (lines 25-42)

```typescript
const authorized = token && (
  token === serviceRoleKey ||
  token === internalSecret ||
  (legacyKey && token === legacyKey)
)
```

Accepts `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_CRON_SECRET`, or a legacy key.

### Payload Parsing (`parseWebhook`, lines 156-179)

```typescript
async function parseWebhook(req: Request): Promise<WebhookPayload | null> {
  // Validates content-type, content-length (< 1MB), requires workspace_id
  return {
    workspace_id, customer_jid, customer_phone,
    message, message_type, gowa_message_id,
    timestamp, source, is_test
  }
}
```

### Core Pipeline (`processMessage`, lines 74-153)

```typescript
async function processMessage(payload: WebhookPayload) {
  const session = await getOrCreateSession(supabase, ...)
  const ctx = { supabase, session, payload }
  ctx.workspace = session.workspaces

  // Sanitize user input (anti-prompt-injection)
  ctx.payload.message = sanitizeUserInput(ctx.payload.message)

  // T0 - Instant Guards
  const t0 = await runT0(ctx)
  if (t0.handled) { ... dispatch & return }

  // T1 - Cache
  const t1 = await runT1(ctx)
  if (t1.handled) { ... dispatch & return }

  // T2 - Router
  const t2 = await runT2(ctx)
  if (t2.handled) { ... dispatch & return }

  // T3 - LLM Planner
  const t3 = await runT3(ctx)
  dispatch(ctx, t3.response)
}
```

**Crash recovery (lines 131-152):** On exception:
1. Log to `debug_logs` table
2. Send static fallback via `dispatchFallback()` (direct GoWA API call)

### Session Management (`lib/session.ts`)

```typescript
async function getOrCreateSession(supabase, { workspace_id, customer_jid, channel, agent_type }) {
  // 1. Try active session (latest first)
  let session = await supabase.from('conversation_sessions')
    .select('*, workspaces(...)')
    .eq('workspace_id', workspace_id)
    .eq('customer_jid', customer_jid)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1).maybeSingle()

  // 1b. Fall back to escalated session (keeps it escalated)
  if (!session) { ... try escalated session }

  // 2. Create new: resolve contact -> create session
  if (!session) {
    const contact = await resolveOrCreateContact(...)
    const { data: newSession } = await supabase.from('conversation_sessions').insert({
      workspace_id, contact_id, channel, customer_jid,
      agent_type: 'customer_support', status: 'active',
      failed_attempts: 0, message_count: 0
    }).select('*, workspaces(...)').single()
    session = newSession
  }
  return session
}
```

The `workspaces` join (eager-loaded on session fetch) provides: `name`, `is_ai_enabled`, `credits_balance`, `owner_personal_phone`, `owner_id`, `welcome_template`, `guardrail_config`, `services_offered`, `description`, `business_profile`, `website_url`, `business_type`.

---

## 4. T0 — Instant Guards (Free Tier)

**File:** `pipeline/t0-instant.ts`

**Purpose:** Zero-cost message handling before any LLM or cache call.

### Steps:
1. **Empty message check** (line 8): Skip whitespace-only messages
2. **Store inbound message** (lines 17-39): Only if not `widget` source and not already stored (by `gowa_message_id` dedup)
3. **Escalation check** (lines 42-54): If session status is `escalated`, return handoff message immediately
4. **Guard execution** (line 57): Run all 9 guards in sequence

### Guard Registry (`guards/index.ts`)

```typescript
const guards: [GuardFn, string][] = [
  [checkNonText,    "non_text"],     // Block non-text message types
  [checkEscalation, "escalation"],   // User requested human/manager
  [checkBlockedTopics, "blocked"],   // Topic blacklist
  [checkCredits,    "credits"],      // Workspace out of credits
  [checkWhatsAppWindow, "window"],   // 24-hour WhatsApp window expired
  [checkSales,       "sales"],       // Pricing/sales block (soft)
  [checkPricing,     "pricing"],     // Pricing block (soft)
  [checkTokenBudget, "tokens"],      // Session token limit exceeded
  [checkGreeting,    "greeting"],    // First message → welcome
]
```

Guards are synchronous executors that return `string | null`. If non-null, the pipeline stops and that string is dispatched.

---

## 5. T1 — Cache Layer

**File:** `pipeline/t1-cache.ts`

**Purpose:** Avoid LLM calls for previously answered questions.

### Two-Level Cache:

**Level 1 — Exact Hash (lines 6-22):**
```typescript
const msgBytes = new TextEncoder().encode(
  ctx.payload.message.toLowerCase().trim().slice(0, 500)
)
const hashBuf = await crypto.subtle.digest("SHA-256", msgBytes)
const cacheKeyHex = Array.from(new Uint8Array(hashBuf))
  .map(b => b.toString(16).padStart(2, "0")).join("")

const { data: cached } = await ctx.supabase
  .from("kb_response_cache")
  .eq("workspace_id", payload.workspace_id)
  .eq("cache_key", cacheKeyHex)
  .maybeSingle()
```

**Level 2 — Embedding Similarity (lines 25-39):**
```typescript
const embedding = await generateEmbedding(ctx.payload.message)

const { data: similar } = await ctx.supabase.rpc("match_kb_chunks", {
  query_embedding: embedding,
  match_threshold: 0.92,  // Very high threshold
  match_count: 1,
  p_workspace_id: ctx.payload.workspace_id
})

if (similar && similar.length > 0 && similar[0].similarity > 0.92) {
  return { handled: true, response: similar[0].content, reason: "cache_hit_embedding" }
}
```

**Embedding generation (`lib/hf-embeddings.ts`):**
```typescript
const model = new Supabase.ai.Session('gte-small')

export async function generateEmbedding(text: string): Promise<number[]> {
  const embedding = await model.run(text, { mean_pool: true, normalize: true })
  return Array.from(embedding)
}
```

Uses Supabase's built-in `Supabase.ai.Session` with the `gte-small` model (384-dimensional vectors).

---

## 6. T2 — Router Layer

**File:** `pipeline/t2-router.ts`

**Purpose:** Route messages to the correct agent type based on keyword matching and session state.

### Step 0: Active Agent Resolution (lines 20-26)

```typescript
const { data: activeAgentRows } = await ctx.supabase
  .from("workspace_agents")
  .select("agent_type")
  .eq("workspace_id", ctx.session.workspace_id)
  .eq("status", "active")
  .is("deleted_at", null)
```

Each workspace can have agent types enabled/disabled. Only active agents are routed to.

### Step 1: Booking FSM Lock Check (lines 29-38)

If a `booking_sessions` record exists with a mid-flow state (not `idle`/`booked`/`cancelled`), the conversation is forced to `appointment_booking` agent type.

### Routing Logic (lines 43-85)

Priority order:
1. **Mid-booking FSM lock** → `appointment_booking` (non-widget only)
2. **Widget channel** → session continuity or default `customer_support`
3. **Keyword match: booking** → `appointment_booking`
4. **Keyword match: sales** → `sales`
5. **Session continuity** → reuse previous `agent_type`
6. **Default** → `customer_support`

### Keyword Lists

```typescript
const BOOKING_KEYWORDS = [
  "book", "appointment", "schedule", "reserve", "slot",
  "booking", "appoint", "fix appointment", "set appointment",
  "consultation", "checkup", "check up"
]

const SALES_KEYWORDS = [
  "order", "buy", "purchase", "price", "pricing", "cost", "menu",
  "how much", "rate", "quote", "payment", "pay", "offer",
  "discount", "deal", "product", "service list", "what do you sell",
  "b2b", "tiers", "subscription", "enterprise", "integration"
]
```

### Speculative KB Search (lines 93-95)

For `customer_support` routes, a **speculative KB search** is started in the background while T3 boots:
```typescript
if (ctx.agentType === "customer_support") {
  ctx.kbSearchPromise = matchChunks({ query: ctx.payload.message }, ctx)
}
```

This result is reused in the tool executor (`tools/impl/kb.ts` line 5-7):
```typescript
if (ctx.kbSearchPromise && params.query.trim().toLowerCase() === ctx.payload.message.trim().toLowerCase()) {
  return ctx.kbSearchPromise
}
```

---

## 7. T3 — Planner/LLM Layer

**File:** `pipeline/t3-planner.ts` (592 lines — the largest file)

**Purpose:** The core reasoning layer where the LLM plans actions, executes tools, and generates responses.

### Initialization (lines 16-28)

```typescript
// Fetch agent config (personality traits, custom directives)
const { data: agent } = await ctx.supabase
  .from("workspace_agents")
  .select("*")
  .eq("workspace_id", ctx.session.workspace_id)
  .eq("agent_type", agentType)
  .maybeSingle()
```

### Escalation Check (lines 31-50)

If the session was escalated (e.g., by a guard), T3 bypasses the LLM entirely and calls `request_handoff` directly:
```typescript
if (sessionStatus?.status === "escalated") {
  const handoffResult = await toolExecutor.run("request_handoff", {
    target_agent: "customer_support",
    reason: "escalation"
  }, ctx)
  // ...dispatch handoff response
}
```

### Staleness Guard (lines 74-85)

Before calling the LLM, check if another inbound message has arrived:
```typescript
const { count: currentCount } = await ctx.supabase
  .from("messages")
  .select("*", { count: "exact", head: true })
  .eq("session_id", ctx.session.id)
  .eq("direction", "inbound")

if (currentCount !== null && currentCount > (ctx._msgCount || 0)) {
  return { handled: true, response: fallback, reason: "t3_stale_message" }
}
```

### System Prompt Building (lines 87-110)

```typescript
const buildPrompt = AGENT_SYSTEM_PROMPTS[agentType] || buildSupportSystemPrompt
let systemPrompt = buildPrompt(ctx)
```

Additional smart context injection:
- **Management priority**: Adds existing appointment data from `get_contact_history`
- **Pricing blocked**: Adds policy override about not sharing prices
- **Sales blocked**: Adds policy override about not processing orders

### Message History (lines 239-263)

```typescript
async function buildMessages(ctx) {
  const { data: msgHistory } = await ctx.supabase
    .from("messages")
    .select("*")
    .eq("session_id", ctx.session.id)
    .order("created_at", { ascending: false })
    .limit(15)  // Last 15 messages

  const history = (msgHistory || []).reverse()
  // Map to { role, content } format
  // Ensure last message is the current user input
}
```

### PASS 1: Plan Generation (lines 117-139)

```typescript
llmResponse = await callLLM({
  model: "llama-3.3-70b-versatile",
  max_tokens: 1000,
  temperature: 0.3,
  system: systemPrompt,
  messages,
  tools: [SUBMIT_PLAN_TOOL, ...getAgentToolDefinitions(agentType)],
  tool_choice: { type: "function", function: { name: "submit_plan" } }
})

const toolCall = llmResponse.choices?.[0]?.message?.tool_calls?.[0]
if (!toolCall || toolCall.function.name !== "submit_plan") {
  throw new Error("LLM did not call submit_plan")
}
parsedPlan = JSON.parse(toolCall.function.arguments)
```

The LLM is **forced** to call `submit_plan` via `tool_choice`. This gives a structured `AgentPlan`:

```typescript
interface AgentPlan {
  response: string;
  actions: { tool: string; params: object; required: boolean; result_key?: string }[];
  fallback: string;
  needs_second_pass: boolean;
}
```

### Plan Validation (`validatePlanActions`, lines 494-591)

Critical hallucination detection patterns:

1. **Lead capture hallucination** (lines 509-514):
   ```typescript
   const capturePhrases = /(captured|saved your (details|info)|added you as a lead|i have saved your)/i
   if (capturePhrases.test(plan.response) && !actionTools.includes("capture_lead")) {
     // Strip claim, add correction
   }
   ```

2. **Pipeline stage hallucination** (lines 517-521):
   ```typescript
   const stagePhrases = /(moved (you|to|the (lead|contact)) to |promoted to|advanced to|stage (change|update)|...)/i
   if (stagePhrases.test(plan.response) && !actionTools.includes("update_lead_stage")) {
     // Strip claim, add correction
   }
   ```

3. **Booking hallucination** (lines 524-557):
   ```typescript
   const bookingPhrases = /(booked|confirmed|appointment is (set|created|booked|scheduled|confirmed)|...)/i
   if (bookingPhrases.test(plan.response) && !actionTools.includes("create_appointment")) {
     // Auto-inject create_appointment if details exist
     // Otherwise strip claim and ask again
   }
   ```

4. **Pricing/KB hallucination** (lines 560-591):
   ```typescript
   const pricingPhrases = /(₹|rs\.?\s*\d+|price|cost|subscription|tier|plan|worth|value)/i
   if (hasPricingClaim && !kbUsed && !kbCalledThisSession) {
     // Auto-inject KB search, log warning
   }
   ```

### Tool Execution (lines 162-182)

Tools are executed **in parallel**:
```typescript
if (parsedPlan.actions.length > 0) {
  toolResults = await Promise.allSettled(
    parsedPlan.actions.map(action =>
      toolExecutor.run(action.tool, action.params, ctx)
    )
  )

  // Check for required tool failures
  const requiredFailed = parsedPlan.actions.some((action, i) =>
    action.required && toolResults[i].status === "rejected"
  )
  if (requiredFailed) {
    finalResponse = parsedPlan.fallback
    return { handled: true, response: finalResponse, reason: "t3_fallback_required_failed" }
  }
}
```

### PASS 2: Response Composition (lines 185-220)

When tools were executed, a **second LLM pass** generates the final response with actual tool results:

```typescript
const pass2System = buildPass2System(ctx, agentType)
const toolContext = buildToolContext(parsedPlan.actions, toolResults)

const secondPassResponse = await callLLM({
  model: "llama-3.3-70b-versatile",
  max_tokens: 800,
  temperature: 0.3,
  system: pass2System,
  messages: [
    ...messages,
    { role: "assistant", content: "", tool_calls: llmResponse.choices[0].message.tool_calls },
    { role: "tool", tool_call_id: ..., content: toolContext }
  ]
})
```

The Pass 2 system prompt:
```typescript
"You are a ${agentType} assistant for ${workspace.name}.
You already decided what tools to call. Tool results are provided below.
Write ONLY the customer-facing message. Keep it under 150 words. Plain text only, no markdown."
```

### Response Enrichment (`enrichResponseWithToolResults`, lines 272-368)

After Pass 2, tool results are **enriched** into the response with formatted output:
- `search_menu` → formatted item list with prices
- `check_availability` → formatted time slots (max 5)
- `capture_lead` → confirmation message
- `match_kb_chunks` → knowledge base content (500 chars)
- `generate_quote` → quote text
- `schedule_follow_up` → schedule confirmation

Duplication check: enrichment is skipped if the content already appears in the response (lines 361-366).

### Handoff Execution (`handleHandoff`, lines 426-458)

If a tool result contains `handoff_to`, T3 recursively calls itself with the new agent type:

```typescript
async function handleHandoff(ctx: PipelineContext, targetAgent: string, context: string) {
  const depth = (ctx.handoffDepth ?? 0) + 1
  if (depth > 2) return { response: "Handoff depth limit reached.", reason: "handoff_depth_limit" }

  ctx.agentType = targetAgent
  ctx.handoffDepth = depth
  return await runT3(ctx)  // RECURSIVE
}
```

Maximum handoff depth: **2** (prevents infinite agent-transfer loops).

### Post-Processing (`postProcess`, lines 461-492)

```typescript
async function postProcess(ctx, llmResponse, plan, finalResponse, agentType, skipCredits = false) {
  // Deduct credits via RPC
  if (!ctx.payload.is_test && !skipCredits) {
    await ctx.supabase.rpc("decrement_credits", {
      p_workspace_id, p_credits: 1, p_session_id
    })
  }

  // Update session with agent_type, last_message_at, message_count, total_tokens_used
  await ctx.supabase.from("conversation_sessions").update({...})
}
```

### Agent Trace Logging (lines 146-159)

```typescript
await ctx.supabase.from("agent_traces").insert({
  session_id, workspace_id, trace_id: crypto.randomUUID(),
  model_used: "llama-3.3-70b-versatile",
  tokens_used, intent_detected: ctx.agentType,
  message_length, response_length, latency_ms: 0
})
```

---

## 8. Agent System Prompts

### 8a. Support Agent (`agents/support.ts`)

**System prompt structure:**
1. **Business Context** — name, description, type, website, personality traits
2. **Business Profile (Pre-loaded)** — phone, email, address, social links, services, hours, amenities, pricing
3. **Role Definition** — "Customer Support Specialist. Answers questions about business, services, hours, and policies."
4. **Tools Available** — `match_kb_chunks`, `get_business_profile`, `get_contact_history`, `update_contact`, `request_handoff`, `create_ticket`, `get_ticket_status`
5. **Conversational Guidance** — proactive agent rules: lead the conversation, never give dead-end answers, ask clarifying questions
6. **Two-Pass System Directive** — CRITICAL: Pass 1 = tool call only, Pass 2 = conversational response
7. **Response Rules** — 150-word limit, WhatsApp markdown, no invented facts
8. **Escalation Protocol** — frustrated users → halt troubleshooting → empathetic response → `request_handoff`

### 8b. Sales Agent (`agents/sales.ts`)

**Key differences from Support:**
- Role: "Sales Specialist" — helps customers find products, understand pricing, get quotes
- **Tools**: `search_menu`, `check_stock`, `send_catalog`, `send_menu_media`, `generate_quote`, `get_business_profile`, `capture_lead`, `schedule_follow_up`, `request_handoff`
- **Internal data prohibition**: "NEVER share internal business data like leads, pipeline, sales numbers, or CRM data with customers"
- **Menu Discovery**: Proactively use `search_menu` when user expresses intent
- **Empty catalog fallback**: Don't say "catalog is empty" — say "Let me find what you need"

### 8c. Booking Agent (`agents/booking.ts`)

**System prompt structure:**
- Same business context and profile as other agents
- **Role**: "Appointment Booking Specialist" — #1 priority is executing tool calls
- **State injection**: Current `collected` fields and `missing` fields are injected into the prompt
- **Tools**: `get_business_profile`, `check_availability`, `create_appointment`, `update_appointment`, `cancel_appointment`, `get_contact_history`, `request_handoff`
- **Mandatory Workflows**:
  1. NEW BOOKING: ALL fields collected → MUST call `check_availability` AND `create_appointment` in same plan
  2. RESCHEDULE: MUST call `get_contact_history` first to find appointment ID
  3. CANCEL: MUST call `get_contact_history` first to find appointment ID

### Personality System (`lib/persona.ts`)

```typescript
export function getPersonaInstructions(traits: any): string {
  // Base: "NEVER identify as an AI, bot, or automated assistant."
  // "Talk like a human employee on WhatsApp: use short, snappy sentences."
  // Tone: friendly | professional | enthusiastic
  // Formality: formal | casual
  // Brevity: concise | detailed
  // Proactivity: assertive | passive
}
```

### Input/Output Sanitization (`lib/sanitize.ts`)

**User input sanitization:** Removes prompt injection patterns:
```typescript
const SYSTEM_PROMPT_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directions|rules|prompts)/gi,
  /you\s+are\s+(now|actually|really)\s+/gi,
  /system\s+(message|prompt|instruction):/gi,
  /reset\s+(your\s+)?(instructions|config|configuration)/gi,
  /new\s+(system\s+)?(prompt|instruction):/gi,
  /disregard\s+(all\s+)?(previous|prior)/gi,
]
```

**LLM output sanitization:** Removes HTML tags and JSON artifacts that might leak.

---

## 9. Tool System

### Tool Registry (`tools/registry.ts`)

All 19 tools are defined in `ALL_TOOLS` with full OpenAI function-calling schema.

**Per-agent tool assignment:**
```typescript
export const AGENT_TOOLS: Record<string, string[]> = {
  customer_support: [
    "match_kb_chunks", "get_contact_history", "update_contact",
    "request_handoff", "create_ticket", "get_business_profile"
  ],
  appointment_booking: [
    "check_availability", "create_appointment", "update_appointment",
    "cancel_appointment", "get_contact_history", "update_contact",
    "request_handoff", "get_business_profile"
  ],
  sales: [
    "match_kb_chunks", "capture_lead", "schedule_follow_up",
    "generate_quote", "search_menu", "check_stock",
    "send_catalog", "send_menu_media", "request_handoff",
    "get_business_profile"
  ]
}
```

### `submit_plan` Tool (lines 250-283)

The **required** tool call that structures the LLM's output:
```typescript
export const SUBMIT_PLAN_TOOL = {
  type: "function",
  function: {
    name: "submit_plan",
    description: "Submit your final plan. EVERY action you claim MUST have a corresponding tool.",
    parameters: {
      type: "object",
      properties: {
        response: { type: "string", description: "Natural language response" },
        actions: { type: "array", items: { tool, params, required, result_key } },
        fallback: { type: "string" },
        needs_second_pass: { type: "boolean" }
      },
      required: ["response", "actions"]
    }
  }
}
```

### Tool Executor (`tools/executor.ts`)

**Rate limiting:** Per-tool, per-session, per-hour:
```typescript
const TOOL_RATE_LIMITS: Record<string, number> = {
  check_availability: 5, create_appointment: 2, match_kb_chunks: 10,
  send_menu_media: 3, check_stock: 10, send_catalog: 3,
  capture_lead: 2, request_handoff: 1, create_ticket: 3,
  get_business_profile: 10, get_ticket_status: 5,
}
```

Rate limit counting uses a `WeakMap` cache (per-session-lifetime) pre-loaded from `tool_call_logs`:
```typescript
const countCache = new WeakMap<PipelineContext, Record<string, number>>()
```

**Tool call logging:** Every tool call is logged to `tool_call_logs` with: `session_id`, `workspace_id`, `tool_name`, `args`, `result`, `error`, `success`, `duration_ms`.

### Tool Implementations

#### `kb.ts` — Knowledge Base Search
```typescript
async function matchChunks(params: { query: string }, ctx: PipelineContext) {
  // Reuse speculative embedding from T2 if available
  const embedding = ctx.embedding || await generateEmbedding(params.query)
  
  const { data: kb } = await ctx.supabase.rpc("match_kb_chunks", {
    query_embedding: embedding,
    match_threshold: 0.75,  // Lower than T1's cache threshold (0.92)
    match_count: 5,
    p_workspace_id
  })
  return { kb_chunks: kb || [] }
}
```

#### `calendar.ts` — Google Calendar Integration
- **`checkAvailability`**: Calls Google Calendar freeBusy API with OAuth2
- **`createAppointment`**: DB insert → Google Calendar event → Google Meet link → appointment notifications (WhatsApp + Email)
- **`updateAppointment`**: DB update → Google Calendar PATCH
- **`cancelAppointment`**: DB status=cancelled → Google Calendar DELETE
- **Date parsing**: Handles relative dates ("tomorrow", "next Monday"), time expressions ("morning", "2pm"), IST timezone

**OAuth Token Management (`google.ts`):**
```typescript
export async function getGoogleConfig(supabase, workspace_id) {
  // Fetch from google_oauth_tokens table
  // Auto-refresh if token expires in < 5 minutes
  // Handle invalid_grant → mark deleted_at
}
```

#### `contact.ts` — Contact History
```typescript
async function getHistory(params, ctx) {
  // Fetch contact by session.contact_id
  // Fetch appointments by contact_id AND session_id (deduped)
  return { ...contact, appointments: [] }
}
```

#### `crm.ts` — Sales CRM Operations
- **`captureLead`**: Upsert contact → link to session → Google Sheets append → lead notification email
- **`updateLeadStage`**: Update `pipeline_stage` on contact
- **`getPipeline`**: Aggregate contact pipeline_stage counts
- **`scheduleFollowUp`**: Insert into `follow_ups` table with scheduled timestamp
- **`generateQuote`**: Look up prices from `menu_items`, calculate tax (18%), insert into `quotes` table, return formatted quote text

#### `order.ts` — Menu/Order Operations
- **`searchMenu`**: Query `menu_items` by name/category/description, filter by availability
- **`sendMenuMedia`**: Fetch latest `menu_media` → send via GoWA image or document API; auto-fallback to text menu if no media
- **`checkStock`**: Search products by name, return availability status
- **`sendCatalog`**: Group items by category, format as WhatsApp markdown, send via GoWA

#### `handoff.ts` — Agent Transfer
```typescript
// Simply returns { handoff_to, handoff_reason, handoff_context }
// T3's handleHandoff processes the recursive call
```

#### `support-ticket.ts` — Support Tickets
- **`createTicket`**: Insert into `support_tickets` with auto-generated ticket number (`TKT-{timestamp_base36}`)
- **`getTicketStatus`**: Query by ticket_number or ticket_id

#### `business-profile.ts` — Business Profile
```typescript
async function getBusinessProfile(params, ctx) {
  const { data: workspace } = await ctx.supabase
    .from("workspaces")
    .select("business_profile")
    .eq("id", ctx.payload.workspace_id)
    .maybeSingle()
  
  // Optional section filtering
  if (params.sections && params.sections.length > 0) {
    return { business_profile: filtered_profile }
  }
  return { business_profile: profile }
}
```

---

## 10. LLM Integration

**File:** `lib/llm.ts`

### Provider: BluesMinds API (OpenAI-compatible)

```typescript
const BLUESMINDS_BASE_URL = "https://api.bluesminds.com/v1"
```

### Model Fallback Chain

```typescript
const PRIMARY = "gpt-5-mini"
const FALLBACK_1 = "gpt-4o"
const FALLBACK_2 = "gemini-3-flash-preview"

for (const model of [PRIMARY, FALLBACK_1, FALLBACK_2]) {
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      return await callBluesMinds({ ...payload, model })
    } catch (error) {
      const status = error.status
      const isRetryable = status === 429 || status === 500 || status === 502 || status === 503
      if (!isRetryable) throw error  // Non-retryable: skip to next model
      
      // Backoff: 429 → 1s base, 5xx → 0.5s base, exponential
      const backoff = (status === 429 ? 1000 : 500) * Math.pow(2, attempt)
      await new Promise(res => setTimeout(res, backoff))
    }
  }
}
throw new Error("ALL_MODELS_FAILED")
```

### Request Details

- **Timeout**: 20 seconds (AbortController)
- **Temperature**: 0.3 (low creativity for business replies)
- **Max tokens**: 1000 (plan generation), 800 (Pass 2), 150 (booking field extraction), 100 (router)
- **System prompt**: Sent as `{ role: "system", content }` as first message
- **Tools**: Full OpenAI function-calling schema with `tool_choice` forced to `submit_plan`

---

## 11. Dispatch Layer

**File:** `lib/dispatch.ts`

**Purpose:** Send the AI-generated response back to the customer.

### Flow:
1. **Get device info** — Look up `gowa_sessions` for the workspace
2. **Presence simulation** — WhatsApp typing indicator:
   ```typescript
   // Send "available" presence
   await fetch(`${gowaBase}/send/presence`, { body: { phone, type: "available" } })
   // Typing delay: response.length * 12ms (capped at 1500ms)
   await new Promise(resolve => setTimeout(resolve, delayMs))
   // Send "unavailable" presence
   await fetch(`${gowaBase}/send/presence`, { body: { phone, type: "unavailable" } })
   ```
3. **Message splitting** — Split at sentence boundaries if > 1000 characters:
   ```typescript
   const parts = response.length > 1000 ? splitAtSentence(response, 1000) : [response]
   ```
4. **Store outbound message** — Insert into `messages` table with `direction: "outbound"`, `role: "agent"`
5. **Send via GoWA** — POST to GoWA `/send/message` with retry (3 attempts, exponential backoff: 0s, 1s, 2s, 4s)
6. **Failed message handling** — If all retries fail, save to `failed_messages` table

---

## 12. Booking FSM

**File:** `agents/booking.ts`

### States

```typescript
type BookingFlowStage =
  | "idle"
  | "collecting_service"
  | "collecting_date"
  | "collecting_time"
  | "collecting_name"
  | "collecting_email"
  | "confirming"
  | "booked"
  | "cancelled"
```

### Data Collection Order

```typescript
const COLLECTION_STAGES: BookingFlowStage[] = [
  "collecting_service", "collecting_date", "collecting_time",
  "collecting_name", "collecting_email"
]
```

### Field Extraction

Uses a **separate LLM call** (`llama-3.1-8b-instant`, temperature 0) for high-precision field extraction:

```typescript
const response = await callLLM({
  model: "llama-3.1-8b-instant",
  max_tokens: 150,
  temperature: 0,
  response_format: { type: "json_object" },
  system: `You are a specialized booking data extractor.
Today is ${today} (${dayName}).
Extract the following fields from the user's message if present:
- service: The service the customer wants...
- date: Convert relative dates like 'tomorrow' to YYYY-MM-DD...
- time: Convert to HH:MM (24h format)...
- name: The customer's name.
- email: The customer's email address.

Return ONLY JSON: { "extracted": { "field_name": { "value": "...", "confidence": "high|low" } } }`,
  messages: [{ role: "user", content: `Existing context: ${JSON.stringify(collected)}\nUser message: ${message}` }]
})
```

### Retry/Clarification System

Each field has:
- **FIELD_PROMPTS**: First-time question (e.g., "What date would you like the appointment?")
- **RETRY_PROMPTS**: Progressive retries (3 variations with escalating detail)
- **CLARIFICATION_PROMPTS**: After 3+ failures, more verbose; after 5, offer handoff to human

### FSM Logic (`handleBooking`, lines 266-388)

1. **Intent gating**: Non-booking messages ("no", "stop", "help", "complaint") pass through to T3; if 2+ fields collected, reset FSM first
2. **Already booked**: Immediate response
3. **Cancelled**: Reset to idle
4. **Field extraction**: Extract from current message using 8B LLM
5. **State transition**: Determine next stage based on collected fields
6. **If confirming**: Pass to T3 (LLM handles confirmation message)
7. **Retry logic**: Increment attempts; if > 3 attempts in current stage, pass to T3

### Booking Session Timeout

```typescript
const lastUpdate = new Date(existing.updated_at).getTime()
const thirtyMinAgo = Date.now() - 30 * 60 * 1000
if (!activeStates.includes(existing.state) && lastUpdate < thirtyMinAgo) {
  // Reset to idle
}
```

### FSM vs T3 Interaction

```
User: "I want to book an appointment"
  T2: routing → "appointment_booking"
  T3: loadOrCreateBookingSession() → handleBooking()
    → FSM: collecting_service
    → Response: "What service would you like?"

User: "Haircut"
  T3: handleBooking() → extractFields → collecting_date
  → Response: "What date works for you?"

... (continues through all stages)

User: "All fields collected"
  T3: handleBooking() → confirming → pass to T3 LLM
  → LLM calls check_availability + create_appointment
  → Response: "Your appointment is confirmed!"
```

---

## 13. Guard Implementations

### `non-text.ts` — Media Type Filter

```typescript
const NON_TEXT_TYPES = ["image", "audio", "document", "sticker", "reaction", "video"]
```

Blocks non-text message types with: "I can only read text messages right now."

### `credits.ts` — Workspace Credit Check

```typescript
if ((workspace.credits_remaining ?? workspace.credits_balance ?? 0) <= 0) {
  return guardrail_config?.out_of_credits_message ?? "Service unavailable."
}
```

### `escalation.ts` — Human Handoff Request

**Keywords**: `human`, `agent`, `person`, `manager`, `refund`, `complaint`, `owner`, `frustrated`, `scam`, `cheating`, `worst`, `not helpful`, plus custom keywords from `guardrail_config.escalation_keywords`.

On match:
1. Set session status to `escalated`
2. Log to `escalation_logs`
3. Send email notification to workspace owner (via `/api/emails/send`)
4. Send WhatsApp alert if `whatsapp_alert_number` configured
5. Return handoff message

### `blocked-topics.ts` — Topic Blacklist

```typescript
const blockedTopics: string[] = workspace.guardrail_config?.blocked_topics ?? []
if (blockedTopics.some(topic => msgLower.includes(topic.toLowerCase()))) {
  return "I'm sorry, I can't help with that."
}
```

### `pricing.ts` & `sales.ts` — Soft Guards

These guards **do not block** — they set flags on the context:
```typescript
ctx.pricingBlocked = true  // T3 injects policy override into system prompt
ctx.salesBlocked = true    // T3 injects sales restriction into system prompt
```

Only block if `guardrail_config.allow_pricing === false` or `guardrail_config.allow_sales === false`.

### `window.ts` — 24-Hour WhatsApp Window

```typescript
if (ctx.payload.source !== "whatsapp") return null  // Only applies to WhatsApp
const hoursSinceLastMsg = (Date.now() - lastUserMsgAt) / 3600000
if (hoursSinceLastMsg > 23.5) {
  return "Our response window has closed."
}
```

### `token-budget.ts` — Session Token Limit

```typescript
const sessionLimit = workspace.guardrail_config?.session_token_limit ?? 50000
if ((ctx.session.total_tokens_used ?? 0) >= sessionLimit) {
  return "Conversation has reached its limit."
}
```

### `greeting.ts` — First Message Welcome

```typescript
if ((ctx.session.message_count ?? 0) > 0) return null  // Only on first message
// Returns workspace.welcome_template or default "Hi! Welcome to {name}. How can I help?"
```

---

## 14. Data Flow Diagram

```
CUSTOMER
    │
    ▼
GoWA (WhatsApp) ───POST──► /api/gowa/init (QR Login)
                              │
    ◄─── message ──────────── │
                              │
    ▼
gowa-webhook (Edge Function)
    │
    ├── verifySignature (HMAC-SHA256)
    ├── resolveWorkspace (gowa_sessions table)
    ├── process_webhook_message RPC
    │     ├── advisory lock (race prevention)
    │     ├── find/create contact
    │     ├── find/create conversation_session
    │     ├── store inbound message
    │     └── return { session_id, status }
    │
    ├── [background] fetch contact name from GoWA
    │
    └── invoke agent-orchestrator
          │
          ▼
agent-orchestrator (Edge Function)
    │
    ├── auth (service_role / internal_secret)
    ├── parseWebhook (validate + extract)
    │
    ├── getOrCreateSession
    │     └── session + workspace (eager-loaded)
    │
    ├── sanitizeUserInput (prompt injection removal)
    │
    ├── T0: runAllGuards ───blocked?──► dispatch
    │     ├── checkNonText
    │     ├── checkEscalation ───► escalated DB + notifications
    │     ├── checkBlockedTopics
    │     ├── checkCredits
    │     ├── checkWhatsAppWindow
    │     ├── checkSales ───► ctx.salesBlocked = true
    │     ├── checkPricing ───► ctx.pricingBlocked = true
    │     ├── checkTokenBudget
    │     └── checkGreeting (first message)
    │
    ├── T1: cache ───hit?──► dispatch
    │     ├── SHA-256 hash lookup (kb_response_cache)
    │     └── embedding similarity (>0.92 via match_kb_chunks)
    │
    ├── T2: router
    │     ├── active agents query (workspace_agents)
    │     ├── booking FSM lock check
    │     ├── keyword routing (booking/sales/support)
    │     ├── session continuity fallback
    │     └── speculative KB search (ctx.kbSearchPromise)
    │
    └── T3: planner
          ├── load agent config (workspace_agents.traits)
          ├── staleness check (new messages?)
          ├── booking FSM (handleBooking)
          │     └── field extraction via 8B LLM
          ├── build system prompt (agent-specific)
          ├── build message history (last 15)
          ├── CALL LLM (Plan - submit_plan tool)
          │     └── model fallback: gpt-5-mini → gpt-4o → gemini-3-flash-preview
          ├── validatePlanActions (hallucination detection)
          ├── execute tools in parallel (Promise.allSettled)
          │     ├── kb.ts (match_kb_chunks)
          │     ├── calendar.ts (Google Calendar CRUD)
          │     ├── crm.ts (capture_lead, generate_quote, etc.)
          │     ├── contact.ts (get_contact_history)
          │     ├── order.ts (search_menu, send_catalog, etc.)
          │     └── handoff.ts (request_handoff)
          ├── CALL LLM (Pass 2 - with tool results)
          ├── enrichResponseWithToolResults
          ├── handleHandoff (recursive, max depth 2)
          ├── postProcess (deduct credits, update session)
          └── agent_traces insert
    │
    ▼
dispatch (lib/dispatch.ts)
    │
    ├── GoWA presence simulation (typing indicator)
    ├── message splitting (sentence-aware, 1000 char chunks)
    ├── store outbound message in DB
    └── GoWA /send/message (retry 3× with backoff)
          │
          ▼
    GoWA ──► WhatsApp ──► CUSTOMER
```

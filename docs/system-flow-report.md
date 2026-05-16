# Flowter (FlowCore AI) — Complete System Flow Report

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [All Source Files & What They Do](#2-all-source-files--what-they-do)
3. [Booking Flow (Step by Step with Code)](#3-booking-flow-step-by-step-with-code)
4. [Customer Support Q&A Flow](#4-customer-support-qa-flow)
5. [Cross-Agent Handoff Flow](#5-cross-agent-handoff-flow)
6. [GoWA Webhook Flow (WhatsApp Inbound)](#6-gowa-webhook-flow-whatsapp-inbound)
7. [LLM Fallback Chain](#7-llm-fallback-chain)
8. [Notification Flow](#8-notification-flow)
9. [Post-Loop Fallback Architecture](#9-post-loop-fallback-architecture)
10. [Database Tables Referenced](#10-database-tables-referenced)

---

## 1. Architecture Overview

```
                    ┌─────────────────────────────────────────────┐
                    │            Customer Channels                │
                    │  WhatsApp  │  Webchat  │
                    └────────────┴─────┬──────┴────────────┴───────┘
                                       │
                    ┌──────────────────▼──────────────────────────┐
                    │         GoWA Webhook (WhatsApp)             │
                    │  supabase/functions/gowa-webhook/index.ts   │
                    │  - HMAC signature verification              │
                    │  - JID normalization                        │
                    │  - Dedup check by gowa_message_id           │
                    │  - Contact upsert                           │
                    │  - Session resolution                       │
                    │  - EdgeRuntime.waitUntil → orchestrator     │
                    └──────────────────┬──────────────────────────┘
                                       │ supabase.functions.invoke()
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                  Agent Orchestrator (Edge Function)                         │
│              supabase/functions/agent-orchestrator/index.ts                 │
│                                                                              │
│  ┌─────────────────┐   ┌──────────────────┐   ┌─────────────────────────┐   │
│  │ 1. Guard Checks  │   │ 2. Route Intent  │   │ 3. KB Cache Check      │   │
│  │ - Token budget   │──→│ routeIntent()     │──→│ SHA-256 hashing        │   │
│  │ - Credits        │   │ router.ts:11-85  │   │ kb_response_cache hit  │   │
│  │ - WhatsApp 24hr  │   │ llama-3.3-70b    │   │ → return cached        │   │
│  └─────────────────┘   └────────┬─────────┘   └─────────────────────────┘   │
│                                  │                                           │
│                                  ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │             4. Multi-Agent Handoff Loop                   │               │
│  │           do-while (handoffCount <= MAX_HANDOFFS)          │               │
│  │                                                           │               │
│  │  ┌─────────────────────────────────────────────────────┐  │               │
│  │  │  5. Tool-Calling Loop (max 3 iterations)            │  │               │
│  │  │                                                     │  │               │
│  │  │  callAgentModel({messages, tools, tool_choice})     │  │               │
│  │  │       │                                              │  │               │
│  │  │       ├── tool_calls found → executeTool()           │  │               │
│  │  │       │      ├── handoff? → switch agent, restart    │  │               │
│  │  │       │      └── normal → loopCount++, re-prompt    │  │               │
│  │  │       │                                              │  │               │
│  │  │       └── text only → exit loop (finalResponse)      │  │               │
│  │  └─────────────────────────────────────────────────────┘  │               │
│  └──────────────────────────────────────────────────────────┘               │
│                                  │                                           │
│                                  ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │             6. Post-Loop Fallbacks                        │               │
│  │                                                           │               │
│  │  a) Truncate at max_response_length (800 chars)           │               │
│  │     → Last sentence boundary before limit                 │               │
│  │                                                           │               │
│  │  b) Inline JSON Detection (5.5)                           │               │
│  │     → Regex /\{[\s\S]*"(\w+)"[\s\S]*\}/                  │               │
│  │     → Parse JSON, match tool signature                    │               │
│  │     → executeTool() → re-prompt LLM                       │               │
│  │                                                           │               │
│  │  c) Booking Pattern Detection (5.7)  ← KEY FIX           │               │
│  │     → Detect "booked/scheduled/confirmed" in text         │               │
│  │     → Extract details from conversation via LLM           │               │
│  │     → Programmatically call create_appointment            │               │
│  │     → Replace faked response with real Meet link          │               │
│  │                                                           │               │
│  │  d) KB Cache (5.6)                                        │               │
│  │     → Cache KB responses for future identical queries     │               │
│  └──────────────────────────────────────────────────────────┘               │
│                                  │                                           │
│                                  ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │  7. Store Response                                       │               │
│  │  messages.insert({workspace_id, session_id, content,     │               │
│  │    direction:'outbound', role:'agent', agent_type})      │               │
│  │                                                           │               │
│  │  8. GoWA Dispatch (WhatsApp only)                         │               │
│  │  - Presence: send/presence type=available                 │               │
│  │  - Typing delay: min(len*12ms, 1500ms)                    │               │
│  │  - Message split at 1000 chars/sentence boundary          │               │
│  │  - 3× retry with exponential backoff                      │               │
│  │  - failed_messages table fallback                          │               │
│  │                                                           │               │
│  │  9. Update Session State                                  │               │
│  └──────────────────────────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. All Source Files & What They Do

### Entry Point: `index.ts` (635 lines)
- **`supabase/functions/agent-orchestrator/index.ts`**
- `Deno.serve()` handler at line 108 — entry point for all orchestrator requests
- Imports 9 modules (tools, session, llm, compliance, tool-definitions, sanitize, router)
- Defines `TOOL_PERMISSIONS` (line 16-20): per-agent-type tool access matrix
- Defines `AGENT_DESCRIPTIONS` (line 22-38): label, description, skills for each agent type
- `buildTeamPrompt()` (line 40-106): builds the dynamic system prompt for each agent
- Main flow: guard checks → session → route → agent loop → post-loop → store → dispatch

### LLM Module: `lib/llm.ts` (90 lines)
- **`supabase/functions/agent-orchestrator/lib/llm.ts`**
- `callAgentModel()` (line 64-86): primary → fallback 1 → fallback 2 chain
- `callRouterModel()` (line 88-90): single model for router (no fallback needed)
- `fetchFromGroq()` (line 12-45): raw API call with 15s AbortController timeout
- `fetchWithRetry()` (line 47-62): 2 retries, backoff + jitter, 429/5xx/timeout detection
- Models: `llama-3.3-70b-versatile` (primary), `llama-3.1-8b-instant` (F1), `meta-llama/llama-4-scout-17b-16e-instruct` (F2)
- `STATIC_FALLBACK_MESSAGE` (line 10): last resort if all models fail

### Tools Module: `lib/tools.ts` (388 lines)
- **`supabase/functions/agent-orchestrator/lib/tools.ts`**
- `executeTool()` (line 156-389): switch-case dispatcher for 10 tools
- `parseDT()` (line 11-32): natural language date/time parser (tomorrow, today, "2pm", etc.)
- `getGoogleConfig()` (line 34-57): fetches Google OAuth token, auto-refreshes with 5-min buffer
- `formatPhoneForGoWA()` (line 59-66): phone number normalization (adds 91 prefix for India)
- `sendAppointmentNotifications()` (line 68-154): fire-and-forget WhatsApp + email dispatchers
- Each tool case: `match_kb_chunks`, `check_availability`, `create_appointment`, `capture_lead`, `escalation_request`, `request_handoff`, `update_appointment`, `cancel_appointment`, `get_contact_history`, `update_contact`

### Tool Definitions: `lib/tool-definitions.ts` (190 lines)
- **`supabase/functions/agent-orchestrator/lib/tool-definitions.ts`**
- `TOOL_DEFINITIONS` array: 10 OpenAI-compatible function definitions
- Each has `type: "function"`, `function.name`, `function.description`, `function.parameters`
- Sent to Groq as `tools` parameter in chat completions API

### Router: `lib/router.ts` (85 lines)
- **`supabase/functions/agent-orchestrator/lib/router.ts`**
- `routeIntent()` (line 11-85): classifies message → agent type + intent + urgency + entities
- Uses llama-3.3-70b-versatile with `response_format: { type: "json_object" }`
- 3 retries with exponential backoff on 429/5xx
- Falls back to `{agent: 'customer_support', intent: 'general'}` on failure

### Session: `lib/session.ts` (86 lines)
- **`supabase/functions/agent-orchestrator/lib/session.ts`**
- `getOrCreateSession()` (line 6-74): finds existing or creates new session
- Channel normalization: webchat → widget
- Auto-creates contact if not found
- Joins `workspaces` for name, AI status, credits, owner info
- `updateSessionState()` (line 76-86): writes `updated_at` + any fields to session

### Sanitize: `lib/sanitize.ts` (53 lines)
- **`supabase/functions/agent-orchestrator/lib/sanitize.ts`**
- `sanitizeUserInput()` (line 10-16): strips prompt injection patterns (7 regex patterns)
- `sanitizeLlmOutput()` (line 20-23): strips HTML tags from LLM output
- `checkTokenBudget()` (line 25-53): tracks tokens per session, enforces `maxTokensPerSession = 100000`

### Compliance: `lib/compliance.ts` (45 lines)
- **`supabase/functions/agent-orchestrator/lib/compliance.ts`**
- `checkWhatsAppWindow()` (line 7-27): checks if 24-hour window has expired
- `calculateTypingDelay()` (line 29-31): `min(message.length * 12ms, 1500ms)`
- `logWindowExpired()` (line 33-45): inserts `escalation_logs` row when window expires

### Embeddings: `lib/hf-embeddings.ts` (14 lines)
- **`supabase/functions/agent-orchestrator/lib/hf-embeddings.ts`**
- `generateEmbedding()` (line 3-13): uses `Supabase.ai.Session('gte-small')` for 384d vectors
- Fallback: random 384d vector on failure (graceful degradation)

### Response (Legacy): `lib/response.ts` (55 lines)
- **`supabase/functions/agent-orchestrator/lib/response.ts`**
- `generateResponse()` — older response generation logic (mostly superseded by orchestrator)

### Types: `lib/types.ts` (21 lines)
- **`supabase/functions/agent-orchestrator/lib/types.ts`**
- `RouterResult`: agent + intent + urgency + entities
- `AgentPayload`: messages + model + response_format
- `AgentResponse`: response_parts + metadata

### GoWA Webhook: `gowa-webhook/index.ts` (280 lines)
- **`supabase/functions/gowa-webhook/index.ts`**
- Entry point for ALL inbound WhatsApp messages
- HMAC SHA-256 signature verification (line 26-59)
- JID normalization: removes device index, ensures `@s.whatsapp.net` (line 13-21)
- Dedup: checks `gowa_message_id` scoped to workspace (line 139-149)
- Contact upsert by `workspace_id, phone` (line 152-166)
- Session resolution + creation (line 170-197)
- Stores inbound message (line 200-215)
- `EdgeRuntime.waitUntil()` fires orchestrator asynchronously (line 229-265)
- AI payload includes `session_id: activeSession.id` (critical fix from earlier bug)

---

## 3. Booking Flow (Step by Step with Code)

### Phase A: Initial Booking Request

**Customer (WhatsApp/Webchat):** `"book a cleaning tomorrow 2pm name Samir phone 7904721312 email samir@test.com"`

---

#### Step 1 — HTTP Entry & Sanitization

**File:** `index.ts`, lines 108-131

```typescript
Deno.serve(async (req) => {                        // line 108
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const payload = await req.json()                 // line 120
  let { workspace_id, customer_jid, message, channel, agent_type, is_test } = payload

  if (!customer_jid && channel === 'webchat') {    // line 124
    customer_jid = crypto.randomUUID();            // auto-generate for webchat
  }

  const sanitizedMessage = sanitizeUserInput(message);  // line 131
```

**File:** `lib/sanitize.ts`, lines 10-16

```typescript
export function sanitizeUserInput(input: string): string {
  let sanitized = input;
  for (const pattern of SYSTEM_PROMPT_PATTERNS) {  // 7 regex patterns at line 1-8
    sanitized = sanitized.replace(pattern, "[content removed]");
  }
  return sanitized.trim();
}
```

Strips prompt injection attempts: "ignore all previous instructions", "reset your configuration", etc.

---

#### Step 2 — Session Resolution

**File:** `index.ts`, line 134

```typescript
const session = await getOrCreateSession(supabase, { workspace_id, customer_jid, channel, agent_type })
```

**File:** `lib/session.ts`, lines 6-74

1. Lookup `conversation_sessions` by `workspace_id + customer_jid + status='active'` (line 21-27)
2. If not found, resolve/create `contacts` row (line 31-51):
   - WhatsApp: match by `whatsapp_jid`
   - Webchat: match by `session_token`
3. Create new session (line 54-67):
   ```typescript
   .insert({
     workspace_id, contact_id, channel: dbChannel, customer_jid,
     agent_type, status: 'active', failed_attempts: 0, message_count: 0
   })
   ```
4. Returns session with joined `workspaces(name, is_ai_enabled, credits_balance, owner_personal_phone, owner_id)`

---

#### Step 3 — Guard Checks

**File:** `index.ts`, lines 144-183

**Token Budget (line 153-163):**
```typescript
if (!is_test) {
  const { allowed } = await checkTokenBudget(supabase, session.id, 0);
  if (!allowed) {
    return new Response(JSON.stringify({
      error: "Token budget exceeded",
      response_parts: ["Your conversation has reached its limit..."]
    }));
  }
}
```

**File:** `lib/sanitize.ts`, lines 25-53:
```typescript
export async function checkTokenBudget(supabase, sessionId, tokensUsed, maxTokensPerSession = 100000) {
  const totalSoFar = session?.total_tokens_used || 0;
  const projectedUsage = totalSoFar + tokensUsed;
  const allowed = projectedUsage <= maxTokensPerSession;
  // increments total_tokens_used if tokensUsed > 0
  return { allowed, usage: totalSoFar };
}
```

**Credits (line 166-171):**
```typescript
if (!is_test && (session.workspaces.credits_balance || 0) <= 0) {
  return new Response(JSON.stringify({
    error: "Out of credits",
    response_parts: [guardrailConfig.fallback_message]
  }));
}
```

**WhatsApp 24hr Window (line 174-183):**
```typescript
if (channel === 'whatsapp' && !is_test) {
  const { expired } = await checkWhatsAppWindow(supabase, session.id);
  if (expired) {
    await logWindowExpired(supabase, workspace_id, session.id);
    return new Response(JSON.stringify({
      error: "WhatsApp window expired",
      response_parts: ["Our response window has closed..."]
    }));
  }
}
```

**File:** `lib/compliance.ts`, lines 7-27:
```typescript
export async function checkWhatsAppWindow(supabase, sessionId) {
  const hoursSinceLastMessage = diffMs / (1000 * 60 * 60);
  return { expired: hoursSinceLastMessage > WHATSAPP_WINDOW_HOURS };  // 24 hours
}
```

---

#### Step 4 — KB Cache Check

**File:** `index.ts`, lines 187-208

```typescript
const msgBytes = new TextEncoder().encode(sanitizedMessage.toLowerCase().trim().slice(0, 500));
const hashBuf = await crypto.subtle.digest('SHA-256', msgBytes);
cacheKeyHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

const { data: cached } = await supabase.from('kb_response_cache')
  .select('response_text, access_count, id')
  .eq('workspace_id', workspace_id)
  .eq('cache_key', cacheKeyHex)
  .maybeSingle();

if (cached && !is_test) {
  // Update access count, store cached response in messages, return immediately
  return new Response(JSON.stringify({ response_parts: [cached.response_text], cached: true }));
}
```

Cache hit → skip LLM entirely. Cache miss → proceed to LLM.

---

#### Step 5 — Load Active Agents

**File:** `index.ts`, lines 211-214

```typescript
const { data: allAgents } = await supabase.from('workspace_agents')
    .select('*')
    .eq('workspace_id', workspace_id)
    .eq('status', 'active');
```

Returns all active agents for this workspace. Each has: `agent_type`, `config` (agent_name, etc.), `status`.

---

#### Step 6 — Route Intent (Affirmation Check + LLM Router)

**File:** `index.ts`, lines 222-235

```typescript
const { data: history } = await supabase.from('messages')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at', { ascending: false })
    .limit(10);

// Affirmation regex — exact match for short confirmations
const affirmation = /^(yes|yeah|yep|yeh|ok|okay|sure|confirm|proceed|do it|go ahead|process|send it|yeh process|yeh proceed|yeh send it|yeh tell me)$/i.test(sanitizedMessage.trim());

// If affirmation AND existing session agent_type → keep current agent (no router call)
const routeResult = affirmation && session.agent_type
  ? { agent: session.agent_type, intent: 'general', urgency: 'low', entities: {} }
  : await routeIntent(sanitizedMessage, history || []);

const validAgentTypes = allAgents.map(a => a.agent_type);
let currentAgentType = validAgentTypes.includes(routeResult.agent) ? routeResult.agent : allAgents[0].agent_type;
```

For the initial booking message: `affirmation = false` → `routeIntent()` is called.

**File:** `lib/router.ts`, lines 11-85

```typescript
export async function routeIntent(message, history): Promise<RouterResult> {
  const systemPrompt = `You are the FlowCore Router...AGENT TYPES: customer_support...sales...appointment_booking...OUTPUT FORMAT: Return EXACTLY this JSON shape...`;

  // Max 2 retries with backoff
  for (let attempt = 0; attempt <= 2; attempt++) {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...history.slice(-3).map(m => ({ role: m.role === 'agent' ? 'assistant' : 'user', content: m.content })),
          { role: "user", content: message }
        ],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: "json_object" }  // Forces JSON output
      })
    });

    const result = JSON.parse(data.choices[0].message.content);
    return {
      agent: result.agent || 'customer_support',
      intent: result.intent || 'general',
      entities: result.entities || {}
    };
  }
  // Fallback on failure
  return { agent: 'customer_support', intent: 'general', urgency: 'low', entities: {} };
}
```

For "book a cleaning tomorrow 2pm...", router returns: `{ agent: "appointment_booking", intent: "booking", ... }`

---

#### Step 7 — System Prompt Construction

**File:** `index.ts`, lines 40-106

```typescript
function buildTeamPrompt(agents, workspace_name, currentAgentType, channel): string {
  const current = agents.find(a => a.agent_type === currentAgentType)
  const currentName = current?.config?.agent_name || AGENT_DESCRIPTIONS[currentAgentType]?.label || "Teammate"

  // Build team list (all other agents the user could be handed off to)
  const teamList = agents.filter(a => a.agent_type !== currentAgentType).map(a => {
    return `  - ${name} (${a.agent_type}): ${desc.description} | Skills: ${desc.skills}`
  }).join('\n')

  const hasBookingAgent = agents.some(a => a.agent_type === 'appointment_booking')

  // For appointment_booking: booking rules
  const bookingRules = (hasBookingAgent && currentAgentType === 'appointment_booking')
    ? `\n\nBOOKING RULES:\n1. Collect name, phone, email, service, date, and time...\n2. Before booking, ALWAYS summarize...\n3. Only call create_appointment AFTER the customer explicitly confirms.\n4. Once confirmed, the system will automatically send WhatsApp and email...`
    : ''

  // For customer_support: must handoff booking
  const mustHandoffBooking = (hasBookingAgent && currentAgentType === 'customer_support')
    ? `\n\nIMPORTANT: You CANNOT book or check appointment availability...`
    : ''

  // Assemble final prompt (line 75-106)
  return `You are ${currentName}, a helpful human teammate at ${workspace_name} on ${channel}.
YOUR ROLE: ${AGENT_DESCRIPTIONS[currentAgentType]?.description}
YOUR SKILLS: ${AGENT_DESCRIPTIONS[currentAgentType]?.skills}
${teamIntro}${noBookingNotice}${mustHandoffBooking}${bookingRules}
IDENTITY RULES: ...
STYLE RULES: ...
AVAILABLE FUNCTIONS: ...`
}
```

`AGENT_DESCRIPTIONS` (line 22-38):
```typescript
const AGENT_DESCRIPTIONS = {
  customer_support: { label: "Customer Support", description: "Answers general questions...", skills: "knowledge base search..." },
  appointment_booking: { label: "Appointment Booker", description: "Handles scheduling...", skills: "Google Calendar availability check..." },
  sales: { label: "Sales Assistant", description: "Handles pricing inquiries...", skills: "lead capture, pricing info..." }
}
```

`TOOL_PERMISSIONS` (line 16-20):
```typescript
const TOOL_PERMISSIONS = {
  customer_support: ["match_kb_chunks", "get_contact_history", "update_contact", "request_handoff", "escalation_request"],
  appointment_booking: ["check_availability", "create_appointment", "update_appointment", "cancel_appointment", "get_contact_history", "request_handoff", "escalation_request"],
  sales: ["capture_lead", "match_kb_chunks", "get_contact_history", "update_contact", "request_handoff", "escalation_request"],
}
```

---

#### Step 8 — Multi-Agent Handoff Loop Entry

**File:** `index.ts`, lines 248-412

```typescript
let finalResponse = "";
let handoffRequested = false;
let handoffContext = "";
let kbToolUsed = false;
let bookingToolCalled = false;

let handoffCount = 0;
const MAX_HANDOFFS = 2;

do {
  handoffRequested = false;
  const currentAgent = allAgents.find(a => a.agent_type === currentAgentType);
  const systemPrompt = buildTeamPrompt(allAgents, workspace_name, currentAgentType, channel);

  // Build message history
  const { data: msgHistory } = await supabase.from('messages')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at', { ascending: false })
    .limit(15);

  const messages: any[] = [{ role: "system", content: systemPrompt }];
  if (handoffContext) {
    messages.push({ role: "system", content: `[HANDOFF CONTEXT] ${handoffContext}` });
  }
  // Add conversation history
  const sortedHistory = (msgHistory || []).reverse();
  for (const m of sortedHistory) {
    messages.push({ role: m.role === 'agent' ? 'assistant' : 'user', content: m.content });
  }
  // Add current message if not in history
  if (!lastMsg || lastMsg.content !== sanitizedMessage || lastMsg.role !== 'user') {
    messages.push({ role: "user", content: sanitizedMessage });
  }
```

---

#### Step 9 — Tool-Calling Loop

**File:** `index.ts`, lines 296-406

```typescript
while (loopCount < 3) {
  await updateSessionState(supabase, session.id, { typing_status: 'thinking' });

  const llmResponse = await callAgentModel({
    messages,
    tools: TOOL_DEFINITIONS,    // 10 function definitions from tool-definitions.ts
    tool_choice: "auto"          // LLM decides whether to call a tool
  });

  const choice = llmResponse.choices[0].message;
  // Track tokens
  if (!is_test) {
    const tokensUsed = llmResponse.usage?.total_tokens || 0;
    await checkTokenBudget(supabase, session.id, tokensUsed);
  }

  if (choice.tool_calls && choice.tool_calls.length > 0) {
    // LLM called a function — process each tool call
    messages.push(choice);
    for (const call of choice.tool_calls) {
      const toolName = call.function.name;
      const toolArgs = JSON.parse(call.function.arguments);

      // Verify permission
      const allowedTools = TOOL_PERMISSIONS[currentAgentType] || [];
      if (!allowedTools.includes(toolName)) {
        messages.push({ role: "tool", content: JSON.stringify({ error: `Tool not available` }) });
        continue;
      }

      if (toolName === 'match_kb_chunks') kbToolUsed = true;
      if (toolName === 'create_appointment') bookingToolCalled = true;  // ← TRACK IT

      const toolResult = await executeTool({
        tool_name: toolName, args: toolArgs,
        workspace_id, session_id: session.id, supabase
      });

      // HANDOFF DETECTION
      if (toolResult?.handoff_to) {
        const targetAgent = toolResult.handoff_to;
        const validTarget = validAgentTypes.includes(targetAgent);
        if (validTarget && targetAgent !== currentAgentType && handoffCount < MAX_HANDOFFS) {
          handoffRequested = true;
          handoffContext = toolResult.handoff_context || '';
          messages.push({ role: "tool", content: JSON.stringify({ status: 'handoff_initiated' }) });
          messages.push({ role: "assistant", content: `I'll transfer you to my teammate...` });
          currentAgentType = targetAgent;
          handoffCount++;
          await supabase.from('conversation_sessions')
            .update({ agent_type: targetAgent, updated_at: new Date().toISOString() })
            .eq('id', session.id);
          break;  // Exit tool loop → restart agent loop
        }
      } else {
        messages.push({ role: "tool", content: JSON.stringify(toolResult) });
      }
    }
    if (handoffRequested) break;
    loopCount++;
  } else {
    // LLM returned TEXT instead of tool_calls (common failure mode)
    toolLoopResponse = sanitizeLlmOutput(choice.content);  // strip HTML tags
    break;  // Exit tool loop
  }
}

// If no handoff requested, use the text response
if (!handoffRequested) {
  finalResponse = toolLoopResponse || guardrailConfig.fallback_message;
}
```

**File:** `lib/llm.ts`, lines 64-86

```typescript
export async function callAgentModel(payload) {
  const PRIMARY_MODEL = "llama-3.3-70b-versatile";
  const FALLBACK_1 = "llama-3.1-8b-instant";
  const FALLBACK_2 = "meta-llama/llama-4-scout-17b-16e-instruct";

  try { return await fetchWithRetry(payload, PRIMARY_MODEL); }
  catch { try { return await fetchWithRetry(payload, FALLBACK_1); } }
  catch { try { return await fetchWithRetry(payload, FALLBACK_2); } }
  catch { throw new Error("ALL_MODELS_FAILED"); }
}
```

For the booking request — the LLM does NOT call any tool. It returns text:
```
"You want to book a cleaning tomorrow at 2pm. Before we proceed, can you confirm the details: name is Samir, phone is 7904721312, email is samir@test.com, and the service is a cleaning."
```

`handoffRequested = false` → loop exits.

---

#### Step 10 — Post-Loop: Truncation + Fallbacks

**File:** `index.ts`, lines 416-536

**Truncation (line 416-425):**
```typescript
const maxLen = guardrailConfig.max_response_length || 800;
if (finalResponse.length > maxLen) {
  const truncated = finalResponse.slice(0, maxLen);
  const lastSentence = truncated.lastIndexOf('. ');
  const breakAt = Math.max(lastSentence, lastPeriod, lastNewline);
  finalResponse = breakAt > maxLen * 0.5 ? truncated.slice(0, breakAt + 1).trim() : truncated.trim() + '...';
}
```

The initial booking request text is short (< 800 chars), no truncation needed.

**Inline JSON Detection (line 427-477):**
The response has no JSON in it → regex doesn't match → skipped.

**Booking Pattern Detection (line 490-536):**
The response says "can you confirm" not "I've booked" → pattern doesn't match → skipped.

**KB Cache (line 480-484):**
`kbToolUsed = false` → skipped.

---

#### Step 11 — Store & Return

**File:** `index.ts`, lines 538-575

```typescript
// Store response
await supabase.from('messages').insert({
  workspace_id, session_id: session.id, content: finalResponse,
  direction: 'outbound', role: 'agent', agent_type: currentAgentType,
  metadata: { trace_id: traceId, handoff_count: handoffCount }
});

// WhatsApp dispatch (skipped for webchat — channel check at line 500)
if (channel === 'whatsapp' && deviceId && phone && !is_test) { ... }

// Update session state
await updateSessionState(supabase, session.id, {
  last_message_at: new Date().toISOString(),
  last_message_preview: finalResponse.substring(0, 100),
  typing_status: 'idle'
});

return new Response(JSON.stringify({
  response_parts: [finalResponse],
  metadata: { handoff_count: handoffCount }
}));
```

---

### Phase B: Customer Confirms

**Customer:** `"yes"`

---

#### Steps 1-7 Repeat with Differences:

**Affirmation Detection** (line 230-233):
```typescript
const affirmation = /^(yes|yeah|yep|yeh|ok|okay|sure|confirm|proceed|do it|go ahead|process|send it|yeh process|yeh proceed|yeh send it|yeh tell me)$/i.test(sanitizedMessage.trim());
const routeResult = affirmation && session.agent_type
  ? { agent: session.agent_type, intent: 'general', urgency: 'low', entities: {} }
  : await routeIntent(...);
```

- `affirmation` = `true` (matches "yes")
- `session.agent_type` = `"appointment_booking"` (existing session)
- `routeResult` = `{ agent: "appointment_booking" }` — NO router call
- `currentAgentType` stays `"appointment_booking"`

**Message history sent to LLM:**
```
System: [Appointment Booker prompt — with BOOKING RULES]
Customer: "book a cleaning tomorrow 2pm name Samir phone 7904721312 email samir@test.com"
Assistant: "You want to book a cleaning tomorrow at 2pm..."
Customer: "yes"
```

**LLM returns text (no tool calls):**
```
"I've booked your appointment for a cleaning tomorrow at 2pm. You'll receive a WhatsApp message and email with the meeting link shortly. Please check your messages."
```

#### KEY FIX — Post-Loop Booking Pattern Detector

**File:** `index.ts`, lines 490-536

```typescript
// 5.7 Booking confirmation pattern detector
// Catches LLM claiming "I've booked your appointment" without calling create_appointment
if (!is_test && currentAgentType === 'appointment_booking' && !bookingToolCalled) {
  const bookingPatterns = /\b(booked|booking|scheduled|confirmed|set up|reserved|appointment.*confirm|confirm.*appointment)\b/i;
  if (bookingPatterns.test(finalResponse) && !/unable|cannot|can't|sorry/i.test(finalResponse)) {
    try {
      // Get ALL conversation history
      const { data: msgHistory } = await supabase.from('messages')
        .select('content, role')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

      // Format as conversation text
      const convoText = (msgHistory || []).map(m =>
        `${m.role === 'agent' ? 'AI' : 'Customer'}: ${m.content}`
      ).join('\n');

      // Use LLM to extract booking details
      const extractResult = await callAgentModel({
        messages: [
          { role: "system", content: "Extract booking details from this conversation. Return ONLY a JSON object with these fields (use null for missing): name, phone, email, service, date, time. No other text." },
          { role: "user", content: convoText }
        ]
      });

      const extractedText = extractResult.choices?.[0]?.message?.content || '';
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const bookingDetails = JSON.parse(jsonMatch[0]);
        if (!bookingDetails.service) bookingDetails.service = 'General';
        if (!bookingDetails.date && !bookingDetails.time) bookingDetails.date = 'tomorrow';

        // PROGRAMMATICALLY create the appointment
        const apptResult = await executeTool({
          tool_name: 'create_appointment',
          args: bookingDetails,
          workspace_id,
          session_id: session.id,
          supabase
        });

        if (apptResult && !apptResult.error) {
          const dateStr = apptResult.start_at ? new Date(apptResult.start_at).toLocaleString() : '';
          finalResponse = `Your appointment has been confirmed for ${dateStr}.`;
          if (apptResult.meeting_link) finalResponse += ` You'll receive a Google Meet link shortly.`;
          bookingToolCalled = true;
        }
      }
    } catch (_) {
      console.warn('[ORCHESTRATOR] Booking pattern detection failed (non-fatal)');
    }
  }
}
```

**What happens inside `create_appointment`:**

**File:** `lib/tools.ts`, lines 191-237

```typescript
case 'create_appointment': {
  // Parse natural language date/time
  const startAt = parseDT(args.date, args.time);    // "tomorrow" + "2pm" → ISO string
  const durationMs = (args.duration || 30) * 60000;  // default 30 min
  const endAt = new Date(new Date(startAt).getTime() + durationMs).toISOString();

  // Get Google OAuth config (with auto-refresh)
  const gConfig = await getGoogleConfig(supabase, workspace_id);

  // Create Google Calendar event with Meet conference
  const gRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${gConfig.calendar_id || 'primary'}/events?conferenceDataVersion=1`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${gConfig.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: `FlowCore: ${args.name}`,
        description: `Service: ${args.service}. Session: ${session_id}`,
        start: { dateTime: startAt },
        end: { dateTime: endAt },
        conferenceData: { createRequest: { requestId: `fc-${Date.now()}-${random}` } }
      })
    }
  );
  if (!gRes.ok) throw new Error("Google Calendar Sync Failed");
  const gEvent = await gRes.json();
  const meetLink = gEvent.hangoutLink || gEvent.conferenceData?.entryPoints?.[0]?.uri || null;

  // Store in appointments table
  const { data: appt } = await supabase.from('appointments').insert({
    workspace_id, session_id, contact_id: curSession?.contact_id || null,
    customer_name: args.name, customer_phone: args.phone || null,
    customer_email: args.email || null, service: args.service,
    start_at: startAt, end_at: endAt, status: 'confirmed',
    google_event_id: gEvent.id, meeting_link: meetLink
  }).select().single();

  // Update contact with email if provided
  if (args.email && curSession?.contact_id) {
    await supabase.from('contacts').update({ email: args.email }).eq('id', curSession.contact_id);
  }

  // Fire-and-forget notifications
  sendAppointmentNotifications(supabase, workspace_id, session_id, appt, meetLink);

  return appt; // Returns { id, start_at, meeting_link, customer_name, service, ... }
}
```

**`parseDT()` (lib/tools.ts, line 11-32):**
```typescript
function parseDT(dStr?, tStr?) {
  const now = new Date(); let d = new Date();
  if (dStr) {
    const ds = dStr.toLowerCase();
    if (ds.includes('tomorrow')) d.setDate(now.getDate() + 1);
    else if (ds.match(/^\d{4}-\d{2}-\d{2}$/)) d = new Date(dStr);
    else if (ds.includes('today')) d = now;
  }
  let h = 10, m = 0;
  if (tStr) {
    const match = tStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (match) { h = parseInt(match[1]); m = match[2] ? parseInt(match[2]) : 0; }
    const ampm = match[3]?.toLowerCase();
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
  }
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}
```

**`getGoogleConfig()` (lib/tools.ts, line 34-57):**
```typescript
async function getGoogleConfig(supabase, workspace_id) {
  const { data: config } = await supabase.from("google_oauth_tokens")
    .select("*").eq("workspace_id", workspace_id).order('created_at', { ascending: false }).limit(1).maybeSingle();

  const expiry = new Date(config.token_expiry);
  if (expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    // Auto-refresh: POST to oauth2.googleapis.com/token with refresh_token
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        refresh_token: config.refresh_token,
        grant_type: "refresh_token",
      }),
    });
    const newTokens = await response.json();
    // Update DB with new access_token + expiry
    await supabase.from("google_oauth_tokens").update({ access_token: newTokens.access_token, token_expiry: newExpiry }).eq("workspace_id", workspace_id);
    return { ...config, access_token: newTokens.access_token };
  }
  return config;
}
```

**Result:** Google Calendar event created with Meet link → `appointments` row inserted → `sendAppointmentNotifications()` fired → faked response replaced with real confirmation.

---

## 4. Customer Support Q&A Flow

**Customer:** `"what are your hours?"`

### Step 1 — Route
- `affirmation = false` → `routeIntent()` called
- Returns `{ agent: "customer_support", intent: "faq" }`

### Step 2 — System Prompt
```
You are Customer Support, a helpful human teammate at [workspace] on webchat.
YOUR ROLE: Answers general questions about the business, services, hours, or policies.
YOUR SKILLS: knowledge base search, general Q&A, escalation to human

IMPORTANT: You CANNOT book or check appointment availability...
```

### Step 3 — LLM Tool Call (KB Search)

The LLM calls `match_kb_chunks` (this works reliably — KB search is the most consistent tool call):
```json
{
  "tool_calls": [{
    "function": {
      "name": "match_kb_chunks",
      "arguments": "{\"query\": \"business hours\"}"
    }
  }]
}
```

### Step 4 — Execute Tool

**File:** `lib/tools.ts`, lines 162-171

```typescript
case 'match_kb_chunks': {
  const embedding = await generateEmbedding(args.query);  // 384d vector
  const { data: kb, error } = await supabase.rpc('match_kb_chunks', {
    query_embedding: embedding,
    match_threshold: 0.75,
    match_count: 5,
    p_workspace_id: workspace_id
  });
  return { kb_chunks: kb || [] };
}
```

**File:** `lib/hf-embeddings.ts`, lines 1-14

```typescript
const model = new Supabase.ai.Session('gte-small')  // 384-dimension model

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const embedding = await model.run(text, { mean_pool: true, normalize: true });
    return Array.from(embedding);
  } catch (error: any) {
    console.error("Embedding generation failed:", error);
    return Array(384).fill(0).map(() => (Math.random() * 2 - 1));  // graceful fallback
  }
}
```

### Step 5 — LLM Re-prompt

The `match_kb_chunks` result is added to messages:
```typescript
messages.push({ role: "tool", content: JSON.stringify({
  kb_chunks: [{ content: "Our hours are Mon-Fri 9AM-6PM..." }, ...]
})});
```

Tool loop continues → LLM generates natural response from KB chunks.

### Step 6 — Cache & Return

```typescript
// KB cache (line 480-484)
if (!is_test && cacheKeyHex && kbToolUsed && finalResponse !== guardrailConfig.fallback_message) {
  await supabase.from('kb_response_cache').upsert({
    workspace_id, cache_key: cacheKeyHex, query_text: sanitizedMessage, response_text: finalResponse
  });
}
```

Future identical queries return cached response immediately (CPU embedding step skipped).

---

## 5. Cross-Agent Handoff Flow

**Scenario:** Customer asks Customer Support to reschedule (booking task).

**Customer:** `"I need to reschedule my appointment"`

### Step 1 — Route
- Router sends to `customer_support`

### Step 2 — System Prompt (Customer Support)
```
IMPORTANT: You CANNOT book or check appointment availability.
Only the Appointment Booker teammate can do that.
If the user asks to book, reschedule, cancel, or check appointment times —
use `request_handoff` with target_agent "appointment_booking" immediately.
```

### Step 3 — LLM Response

The LLM SHOULD call `request_handoff({ target_agent: "appointment_booking", ... })`.

The LLM ACTUALLY writes text with inline JSON:
```
"I can't handle appointment changes. Let me transfer you."
{"target_agent": "appointment_booking", "reason": "reschedule", "context": "Customer wants to reschedule"}
```

### Step 4 — Post-Loop Inline JSON Detection

**File:** `index.ts`, lines 427-477

```typescript
const jsonToolMatch = finalResponse.match(/\{[\s\S]*"(\w+)"[\s\S]*\}/);
if (jsonToolMatch) {
  const parsed = JSON.parse(jsonToolMatch[0]);
  // Match tool signature by checking for required keys
  const toolSignatures = {
    request_handoff: ["target_agent", "reason"],
    create_appointment: ["name", "service", "date", "time"],
    // ... 7 more signatures
  };
  let matchedTool = null;
  for (const [tool, reqKeys] of Object.entries(toolSignatures)) {
    if (reqKeys.some(k => k in parsed)) { matchedTool = tool; break; }
  }
  if (matchedTool && allowedTools.includes(matchedTool)) {
    finalResponse = finalResponse.replace(jsonToolMatch[0], '').trim() || 'One moment please...';
    const toolResult = await executeTool({ tool_name: matchedTool, args: parsed, ... });

    if (matchedTool === 'request_handoff' && toolResult?.handoff_to && toolResult.handoff_to !== currentAgentType) {
      // Switch agent type
      currentAgentType = toolResult.handoff_to;
      handoffCount++;
      await supabase.from('conversation_sessions')
        .update({ agent_type: toolResult.handoff_to }).eq('id', session.id);

      // Build new system prompt for target agent
      const handoffPrompt = buildTeamPrompt(allAgents, workspace_name, currentAgentType, channel);
      messages.unshift({ role: "system", content: handoffPrompt });
      const handoffMessages = messages.filter(m => m.role !== 'system' || m === messages[0]);

      // Re-prompt LLM with new agent + handoff context
      const handoffLlm = await callAgentModel({
        messages: handoffMessages.concat({
          role: "user",
          content: `[Handoff from previous teammate] ${toolResult.handoff_context || ''}. Continue assisting.`
        })
      });
      finalResponse = sanitizeLlmOutput(handoffLlm.choices?.[0]?.message?.content || fallback);
    }
  }
}
```

**Result:** `currentAgentType` becomes `appointment_booking`. LLM re-prompted with handoff context. Appointment Booker generates response about rescheduling.

---

## 6. GoWA Webhook Flow (WhatsApp Inbound)

### Entry Point

**File:** `supabase/functions/gowa-webhook/index.ts`, lines 61-279

```typescript
Deno.serve(async (req) => {
  const rawBody = await req.text();                       // line 66
  const signature = req.headers.get('x-hub-signature-256'); // line 67
  const secret = Deno.env.get('GOWA_WEBHOOK_SECRET');

  const isValid = await verifySignature(rawBody, signature, secret);  // line 70
  if (!isValid) return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
```

### HMAC Verification

**File:** `gowa-webhook/index.ts`, lines 26-59

```typescript
async function verifySignature(payload, signature, secret) {
  if (!secret) return true;                         // no secret configured → skip
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const sigHex = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  const sigBytes = new Uint8Array(sigHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
  return await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payload));
}
```

### Event Processing

```typescript
const { event } = rootPayload;
const eventData = rootPayload.payload || rootPayload.data;  // v8 vs legacy format

if (event !== 'message') return;  // Ignore non-message events (presence, ack, etc.)

const { from, chat_id, message, body, from_name, pushName, id: gowaMessageId } = eventData;
const isGroup = chat_id?.endsWith('@g.us') || from?.endsWith('@g.us');
if (isGroup) return;  // Ignore group messages

const normalizedFrom = normalizeJID(from);  // Remove device index, ensure @s.whatsapp.net
```

### Workspace Resolution

```typescript
let sessionIdentifier = rootPayload.device_id || rootPayload.session || rootPayload.deviceId || rootPayload.jid;
const { data: gowaSession } = await supabase.from('gowa_sessions')
  .select('workspace_id, gowa_session_id')
  .or(`gowa_session_id.eq."${sessionIdentifier}",phone_jid.eq."${sessionIdentifier}"`)
  .maybeSingle();
```

### Dedup + Contact + Session + Message Storage

```typescript
// 1. Dedup: check gowa_message_id scoped to workspace
const { data: existingMsg } = await supabase.from('messages')
  .select('id').eq('gowa_message_id', gowaMessageId).eq('workspace_id', workspaceId).maybeSingle();

// 2. Contact upsert
const { data: contact } = await supabase.from('contacts').upsert({
  workspace_id: workspaceId, whatsapp_jid: normalizedFrom, name: pushname,
  phone: normalizedFrom.split('@')[0], channel: 'whatsapp'
}, { onConflict: 'workspace_id, phone' }).select().single();

// 3. Session resolution
let { data: activeSession } = await supabase.from('conversation_sessions')
  .eq('workspace_id', workspaceId).eq('customer_jid', normalizedFrom).eq('status', 'active').maybeSingle();
if (!activeSession) {
  // Create new session
  activeSession = (await supabase.from('conversation_sessions').insert({...}).select().single()).data;
}

// 4. Store inbound message
await supabase.from('messages').insert({
  workspace_id: workspaceId, session_id: activeSession.id, content: messageText,
  direction: 'inbound', role: 'customer', gowa_message_id: gowaMessageId
});
```

### Async Orchestrator Invocation

**File:** `gowa-webhook/index.ts`, lines 228-265

```typescript
const processAI = async () => {
  const aiPayload = {
    workspace_id: workspaceId,
    session_id: activeSession.id,         // ← CRITICAL: was missing in earlier version
    customer_jid: normalizedFrom,
    message: messageText,
    channel: 'whatsapp',
    agent_type: "customer_support"        // initial agent — router may change it
  };
  const { data: aiResponse } = await aiClient.functions.invoke("agent-orchestrator", {
    body: aiPayload,
    headers: { 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` }
  });
};
EdgeRuntime.waitUntil(processAI());  // Fire-and-forget — webhook returns 200 immediately
```

**Key:** `EdgeRuntime.waitUntil()` lets the webhook return HTTP 200 immediately while the orchestrator runs in the background. The orchestrator handles GoWA dispatch itself (line 500+).

---

## 7. LLM Fallback Chain

### `callAgentModel()` — 3-model fallback

**File:** `lib/llm.ts`, lines 64-86

```
callAgentModel(payload)
  └── fetchWithRetry(payload, "llama-3.3-70b-versatile", maxRetries=2)
        ├── fetchFromGroq() — 15s AbortController timeout
        ├── Success? → return
        ├── 429 (rate limit)? → backoff 500ms + jitter, retry
        ├── 5xx (server error)? → backoff 200ms + jitter, retry
        ├── Abort/timeout? → retry
        └── All retries exhausted?
              └── Fallback 1: fetchWithRetry(payload, "llama-3.1-8b-instant")
                    └── Same retry logic
                          └── Fallback 2: fetchWithRetry(payload, "meta-llama/llama-4-scout-17b-16e-instruct")
                                └── Same retry logic
                                      └── ALL_MODELS_FAILED → STATIC_FALLBACK_MESSAGE
```

### `fetchWithRetry()` — Retry logic detail

**File:** `lib/llm.ts`, lines 47-62

```typescript
async function fetchWithRetry(payload, model, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFromGroq(payload, model);
    } catch (err) {
      const isRateLimit = err.message?.includes('429');
      const isServerError = err.message?.includes('500') || err.message?.includes('502') || err.message?.includes('503');
      const isTimeout = err.name === 'AbortError';
      if (attempt === maxRetries || (!isRateLimit && !isServerError && !isTimeout)) throw err;
      const backoff = (isRateLimit ? 500 : 200) * Math.pow(2, attempt) + Math.random() * 500;
      await new Promise(res => setTimeout(res, backoff));
    }
  }
}
```

### `fetchFromGroq()` — Raw API call

**File:** `lib/llm.ts`, lines 12-45

```typescript
async function fetchFromGroq(payload, model) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);  // 15s timeout
  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, model, temperature: 0.3, max_tokens: 300 }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Groq API Error (${response.status})`);
    return response.json();
  } finally { clearTimeout(timeout); }
}
```

### `fetchWithRetry()` for Router (simpler)

**File:** `lib/llm.ts`, line 88-90

```typescript
export async function callRouterModel(payload) {
  return await fetchWithRetry(payload, 'llama-3.3-70b-versatile', 1);  // only 1 retry
}
```

---

## 8. Notification Flow

**File:** `lib/tools.ts`, lines 68-154

### WhatsApp Notification

```typescript
async function sendAppointmentWhatsApp(supabase, workspace_id, session_id, appt, meetLink) {
  const { data: gowaSession } = await supabase.from('gowa_sessions')
    .select('gowa_session_id').eq('workspace_id', workspace_id).maybeSingle();
  const deviceId = gowaSession?.gowa_session_id;
  if (!deviceId) return;

  // Resolve phone number (from appointment → session → contact)
  let phone = appt.customer_phone || session?.customer_jid?.split('@')[0] || contact?.phone;
  if (!phone) return;

  const auth = btoa(gowaKey);
  const formattedPhone = formatPhoneForGoWA(phone);  // 91 prefix for India
  const formattedDate = new Date(appt.start_at).toLocaleString();

  let message = `✅ Appointment Confirmed!\n\nHi ${appt.customer_name},\n\nYour appointment has been confirmed:\n• Service: ${appt.service}\n• Date: ${formattedDate}`;
  if (meetLink) message += `\n• Google Meet: ${meetLink}`;

  const resp = await fetch(`${gowaBase}/send/message`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
    body: JSON.stringify({ phone: formattedPhone, message }),
  });
}
```

**File:** `lib/tools.ts`, lines 59-66 — `formatPhoneForGoWA()`
```typescript
function formatPhoneForGoWA(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    cleaned = '91' + cleaned;     // Indian number → add 91 prefix
  }
  cleaned = cleaned.replace('@s.whatsapp.net', '');
  return cleaned;
}
```

### Email Notification

```typescript
async function sendAppointmentEmail(supabase, workspace_id, session_id, appt, meetLink) {
  let email = appt.customer_email || contact?.email;
  if (!email) return;

  const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://flowter-bay.vercel.app';
  const formattedDate = new Date(appt.start_at).toLocaleString();

  await fetch(`${appUrl}/api/emails/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: email,
      subject: `Appointment Confirmed — ${workspaceName}`,
      template: 'appointment',
      data: { customerName: appt.customer_name, workspaceName, service: appt.service, date: formattedDate, meetLink }
    }),
  });
}
```

### Both called fire-and-forget (line 68-71):

```typescript
async function sendAppointmentNotifications(supabase, workspace_id, session_id, appt, meetLink) {
  sendAppointmentWhatsApp(supabase, workspace_id, session_id, appt, meetLink);   // NOT awaited
  sendAppointmentEmail(supabase, workspace_id, session_id, appt, meetLink);      // NOT awaited
}
```

Returns immediately — notifications are fire-and-forget.

---

## 9. Post-Loop Fallback Architecture

**File:** `index.ts`, lines 414-536

```
After Agent do-while loop completes:
│
├── 1. Truncate (line 416-425)
│   if finalResponse.length > max_response_length (800):
│     Find last sentence boundary (. or . or \n) within limit
│     Truncate at boundary, or add "..." if no boundary found after 50%
│
├── 2. Inline JSON Detection (line 427-477)
│   Regex: /\{[\s\S]*"(\w+)"[\s\S]*\}/
│   If match:
│     Parse JSON
│     Match tool signature from 8-entry map (check_availability, create_appointment, etc.)
│     If tool allowed for current agent type:
│       executeTool()
│       If handoff: switch agent, re-prompt LLM
│       If normal tool: add result to messages, re-prompt LLM
│
├── 3. Booking Pattern Detection (line 490-536)  ← THE FIX
│   If appointment_booking AND no tool called:
│     Regex: /\b(booked|booking|scheduled|confirmed|...)\b/i
│     If match AND not negative (unable/cannot/etc.):
│       Get all conversation messages
│       Format as "AI: ...\nCustomer: ..."
│       Call LLM with extraction prompt
│       Parse returned JSON { name, phone, email, service, date, time }
│       executeTool('create_appointment', bookingDetails)
│       Replace finalResponse with real confirmation
│
├── 4. KB Cache (line 480-484)
│   If KB tool was used AND not test:
│     upsert into kb_response_cache (workspace_id, cache_key, query_text, response_text)
│
├── 5. Store Response (line 538-542)
│   messages.insert({ workspace_id, session_id, content, direction:'outbound', role:'agent', agent_type })
│
├── 6. GoWA Dispatch (line 500-619) [WhatsApp only]
│   ├── Presence available: POST /send/presence { type: 'available' }
│   ├── Typing delay: min(message.length × 12ms, 1500ms)
│   ├── Presence unavailable: POST /send/presence { type: 'unavailable' }
│   ├── Split at 1000 chars (sentence-boundary aware)
│   ├── 3× retry per part with exponential backoff (1s, 2s, 4s + jitter)
│   └── On failure: failed_messages.insert({ workspace_id, session_id, raw_message, failure_reason, retry_count:3, resolved:false })
│
└── 7. Update Session State + Return (line 622-629)
    updateSessionState(typing_status:'idle', last_message_at, last_message_preview)
    → HTTP Response { response_parts: [finalResponse], metadata: { handoff_count } }
```

---

## 10. Database Tables Referenced

| Table | Purpose | Key Columns |
|---|---|---|
| `conversation_sessions` | Active conversations per customer | `id`, `workspace_id`, `customer_jid`, `agent_type`, `status`, `total_tokens_used`, `message_count`, `last_customer_message_at` |
| `messages` | All conversation messages | `id`, `workspace_id`, `session_id`, `content`, `direction`, `role`, `agent_type`, `gowa_message_id`, `metadata` |
| `workspace_agents` | Active AI agents per workspace | `id`, `workspace_id`, `agent_type`, `status`, `config` |
| `workspaces` | Workspace/tenant settings | `name`, `credits_balance`, `is_ai_enabled`, `guardrail_config`, `owner_id` |
| `contacts` | Customer contact records | `id`, `workspace_id`, `name`, `phone`, `email`, `whatsapp_jid` |
| `appointments` | Booked appointments | `id`, `workspace_id`, `session_id`, `contact_id`, `customer_name`, `customer_phone`, `customer_email`, `service`, `start_at`, `end_at`, `status`, `google_event_id`, `meeting_link` |
| `google_oauth_tokens` | Google OAuth tokens per workspace | `workspace_id`, `access_token`, `refresh_token`, `token_expiry`, `calendar_id`, `sheet_id` |
| `gowa_sessions` | GoWA device sessions | `workspace_id`, `gowa_session_id`, `phone_jid` |
| `kb_response_cache` | Cached KB responses | `workspace_id`, `cache_key`, `query_text`, `response_text`, `access_count` |
| `failed_messages` | Failed WhatsApp dispatches | `workspace_id`, `session_id`, `raw_message`, `failure_reason`, `retry_count`, `resolved` |
| `rate_limits` | IP-based rate limiting | — |
| `escalation_logs` | Escalation records | `workspace_id`, `session_id`, `trigger_type`, `status` |

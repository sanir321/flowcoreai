# Agent Orchestrator — Complete Code Walkthrough

**File:** `supabase/functions/agent-orchestrator/index.ts` (635 lines)
**Deployed:** Edge Function on Supabase (currently v131)
**Purpose:** Receives customer messages from ANY channel, routes to the right AI agent, manages handoffs between agents, calls tools (Google Calendar, KB search, etc.), and dispatches responses back to the channel.

---

## 1. Entry Point: `Deno.serve()`

**Lines 108-109**

```typescript
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
```

The function starts here. It's an HTTP handler. For CORS preflight requests (OPTIONS), it immediately returns OK. Everything else falls through to the main logic.

---

## 2. Request Parsing & Variable Setup

**Lines 111-131**

```typescript
const startTime = Date.now();
const traceId = crypto.randomUUID();   // ← unique ID for this request, stored in message metadata

const supabase = createClient(         // ← service_role client — bypasses RLS
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const payload = await req.json()
let { workspace_id, customer_jid, message, channel, agent_type, is_test } = payload

// Auto-generate customer_jid for webchat (no phone number)
if (!customer_jid && channel === 'webchat') {
  customer_jid = crypto.randomUUID();
}

const sanitizedMessage = sanitizeUserInput(message);  // strip prompt injection
```

**Key:** The function receives a JSON body with 6 fields from the caller:
- **`workspace_id`** — which tenant/business this is for
- **`customer_jid`** — unique customer identifier (WhatsApp JID or webchat UUID)
- **`message`** — the customer's text
- **`channel`** — where it came from: "whatsapp", "webchat"
- **`agent_type`** — optional hint for initial agent (webhook sends "customer_support" as default)
- **`is_test`** — if true, skips billing/token checks for testing

---

## 3. Session Resolution

**Lines 133-142**

```typescript
const session = await getOrCreateSession(supabase, { workspace_id, customer_jid, channel, agent_type })
if (!session) {
  return new Response(JSON.stringify({
    response_parts: ["Sorry, we're having trouble starting a conversation."],
    metadata: { error: "Session creation failed", trace_id: traceId }
  }));
}
```

This calls `getOrCreateSession()` from `lib/session.ts`. The function:
1. Looks up `conversation_sessions WHERE workspace_id = X AND customer_jid = Y AND status = 'active'`
2. If not found, resolves or creates a `contacts` record
3. Creates a new session with `status: 'active', agent_type, channel`
4. Returns the session with joined `workspaces(name, is_ai_enabled, credits_balance, guardrail_config)`

The session object is used throughout the entire flow. It carries:
```typescript
{
  id: "uuid",
  workspace_id, customer_jid, agent_type, channel,
  contact_id, status, total_tokens_used, message_count,
  workspaces: { name, credits_balance, guardrail_config, ... }
}
```

---

## 4. Guard Checks — Three Gates

### 4a. Guardrail Config

**Lines 144-151**

```typescript
const guardrailConfig = session.workspaces.guardrail_config || {
  allow_pricing: false,
  max_response_length: 800,
  blocked_topics: [],
  escalation_keywords: ["refund", "legal", "complaint", "cancel", "manager"],
  fallback_message: "Thank you for reaching out! Our team will get back to you shortly."
};
```

Every workspace can configure guardrails stored as JSON in the database. The orchestrator uses `max_response_length` to truncate LLM output and `fallback_message` as a safety net.

### 4b. Token Budget Check

**Lines 153-163**

```typescript
if (!is_test) {
  const { allowed } = await checkTokenBudget(supabase, session.id, 0);
  if (!allowed) {
    return new Response(JSON.stringify({
      error: "Token budget exceeded",
      response_parts: ["Your conversation has reached its limit. A human agent will take over."]
    }));
  }
}
```

This calls `checkTokenBudget()` from `lib/sanitize.ts`:
```typescript
export async function checkTokenBudget(supabase, sessionId, tokensUsed, maxTokensPerSession = 100000) {
  const { data: session } = await supabase.from("conversation_sessions")
    .select("total_tokens_used, message_count").eq("id", sessionId).single();

  const totalSoFar = session?.total_tokens_used || 0;
  const projectedUsage = totalSoFar + tokensUsed;
  const allowed = projectedUsage <= maxTokensPerSession;

  if (tokensUsed > 0) {
    // increment the running total
    await supabase.from("conversation_sessions").update({
      total_tokens_used: projectedUsage,
      message_count: (session?.message_count || 0) + 1,
    }).eq("id", sessionId);
  }
  return { allowed, usage: totalSoFar };
}
```

**The bug that was fixed:** `maxTokensPerSession` was `15000`. The test session had 17,394 tokens used. Every new message hit "Token budget exceeded" and returned without saving a response or dispatching to WhatsApp. Fixed by raising to **100,000** and resetting the stuck session to 0.

### 4c. Credits Check

**Lines 166-171**

```typescript
if (!is_test && (session.workspaces.credits_balance || 0) <= 0) {
  return new Response(JSON.stringify({
    error: "Out of credits",
    response_parts: [guardrailConfig.fallback_message]
  }));
}
```

If the workspace has zero credits, the customer gets the configurable fallback message instead of AI response.

### 4d. WhatsApp 24-Hour Window

**Lines 174-184**

```typescript
if (channel === 'whatsapp' && !is_test) {
  const { expired } = await checkWhatsAppWindow(supabase, session.id);
  if (expired) {
    await logWindowExpired(supabase, workspace_id, session.id);
    return new Response(JSON.stringify({
      error: "WhatsApp window expired",
      response_parts: ["Our response window has closed. A human agent will get back to you soon."]
    }));
  }
}
```

This calls `checkWhatsAppWindow()` from `lib/compliance.ts`:
```typescript
export async function checkWhatsAppWindow(supabase, sessionId) {
  const hoursSinceLastMessage = diffMs / (1000 * 60 * 60);
  return { expired: hoursSinceLastMessage > 24 };
}
```

WhatsApp requires businesses to respond within 24 hours of the last customer message. After that, only pre-approved template messages can be sent. The orchestrator blocks non-template responses and logs the expiry.

---

## 5. KB Cache Check

**Lines 187-208**

```typescript
// Hash the message for cache lookup
const msgBytes = new TextEncoder().encode(sanitizedMessage.toLowerCase().trim().slice(0, 500));
const hashBuf = await crypto.subtle.digest('SHA-256', msgBytes);
cacheKeyHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

const { data: cached } = await supabase.from('kb_response_cache')
  .select('response_text, access_count, id')
  .eq('workspace_id', workspace_id)
  .eq('cache_key', cacheKeyHex)
  .maybeSingle();

if (cached && !is_test) {
  // Increment access count
  await supabase.from('kb_response_cache').update({
    accessed_at: new Date().toISOString(),
    access_count: (cached.access_count || 0) + 1
  }).eq('id', cached.id);

  // Store cached response as message
  await supabase.from('messages').insert({
    workspace_id, session_id: session.id, content: cached.response_text,
    direction: 'outbound', role: 'agent', agent_type: agent_type || session.agent_type,
    metadata: { trace_id: traceId, cached: true }
  });

  // Return immediately — NO LLM call needed
  return new Response(JSON.stringify({
    response_parts: [cached.response_text],
    cached: true
  }));
}
```

**Performance optimization:** If the exact same question was asked before AND the answer came from the knowledge base (not from booking/etc.), the orchestrator returns the cached response without calling the LLM. The SHA-256 hash is truncated to first 500 chars to avoid excessive memory use.

---

## 6. Load Agents

**Lines 211-214**

```typescript
const { data: allAgents } = await supabase.from('workspace_agents')
    .select('*')
    .eq('workspace_id', workspace_id)
    .eq('status', 'active');
```

This returns ALL active agents for this workspace. Each agent has:
```typescript
{
  id: "uuid",
  workspace_id: "uuid",
  agent_type: "customer_support" | "appointment_booking" | "sales",
  status: "active",
  config: { agent_name: string, ... }
}
```

The `allAgents` array is used throughout the flow:
- To validate that the routed agent type is valid
- To build the team-aware system prompt (listing team members)
- To validate handoff targets
- To provide agent-specific configuration

---

## 7. Route Intent

**Lines 222-235**

```typescript
// Load last 10 messages for context
const { data: history } = await supabase.from('messages')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at', { ascending: false })
    .limit(10);

// Affirmation regex — only exact matches
const affirmation = /^(yes|yeah|yep|yeh|ok|okay|sure|confirm|proceed|do it|go ahead|process|send it|yeh process|yeh proceed|yeh send it|yeh tell me)$/i.test(sanitizedMessage.trim());

// If affirmation AND existing session agent_type → KEEP current agent
const routeResult = affirmation && session.agent_type
  ? { agent: session.agent_type, intent: 'general', urgency: 'low', entities: {} }
  : await routeIntent(sanitizedMessage, history || []);

const validAgentTypes = allAgents.map(a => a.agent_type);
let currentAgentType = validAgentTypes.includes(routeResult.agent)
  ? routeResult.agent
  : allAgents[0].agent_type;  // fallback to first agent
```

### Affirmation Override (The Fix)

**This is the routing fix that made booking work.** Before this fix, when a customer said "yes":
1. `routeIntent()` was called with the message "yes"
2. The LLM router had no context of what was being confirmed
3. It returned `{ agent: "customer_support" }` — the default
4. The session was switched to `customer_support`, which can't create appointments
5. The customer_support agent said "I can't book appointments" → dead end

**After the fix:** When the message matches the affirmation regex AND there's an existing session agent type, the orchestrator SKIPS the router entirely and keeps the current `session.agent_type`. So when `appointment_booking` asks "can you confirm?" and customer says "yes", the agent stays `appointment_booking`.

### LLM Router

When NOT an affirmation, `routeIntent()` is called. This is `lib/router.ts`:

```typescript
export async function routeIntent(message, history) {
  const systemPrompt = `You are the FlowCore Router.
AGENT TYPES:
- customer_support: Answers general questions about the business, services, hours, or policies.
- sales: Handles expressions of interest, requests for pricing, or potential leads.
- appointment_booking: Handles requests to schedule, change, or cancel appointments.

OUTPUT FORMAT: Return EXACTLY this JSON shape:
{ "agent": "...", "intent": "...", "urgency": "...", "entities": {...} }`;

  // Calls llama-3.3-70b-versatile with response_format: { type: "json_object" }
  // 3 retries on rate limits/server errors
  // Falls back to customer_support on total failure
}
```

The router uses `response_format: { type: "json_object" }` which forces the LLM to output valid JSON. It also receives the last 3 messages of conversation history for context.

---

## 8. Multi-Agent Handoff Loop

**Lines 248-412**

```typescript
let finalResponse = "";
let handoffRequested = false;
let handoffContext = "";
let kbToolUsed = false;
let bookingToolCalled = false;         // ← new flag to track if create_appointment was called

let handoffCount = 0;
const MAX_HANDOFFS = 2;               // max 2 handoffs per request

do {
  handoffRequested = false;

  const currentAgent = allAgents.find(a => a.agent_type === currentAgentType);
  const systemPrompt = buildTeamPrompt(allAgents, workspace_name, currentAgentType, channel);

  // Load message history
  const { data: msgHistory } = await supabase.from('messages')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false })
      .limit(15);

  const messages: any[] = [{ role: "system", content: systemPrompt }];

  // Add handoff context if this is a handoff restart
  if (handoffContext) {
    messages.push({
      role: "system",
      content: `[HANDOFF CONTEXT] ${currentAgentType} is now handling... Previous teammate handed off: ${handoffContext}`
    });
  }

  // Add conversation history (reversed to chronological)
  const sortedHistory = (msgHistory || []).reverse();
  for (const m of sortedHistory) {
    messages.push({ role: m.role === 'agent' ? 'assistant' : 'user', content: m.content });
  }

  // Add current message if not duplicate
  const lastMsg = sortedHistory[sortedHistory.length - 1];
  if (!lastMsg || lastMsg.content !== sanitizedMessage || lastMsg.role !== 'user') {
    messages.push({ role: "user", content: sanitizedMessage });
  }

  // --- TOOL CALLING LOOP ---
  // ... (detailed in section 9 below)
  // --- END TOOL LOOP ---

  if (!handoffRequested) {
    finalResponse = toolLoopResponse || guardrailConfig.fallback_message;
  }

} while (handoffRequested && handoffCount <= MAX_HANDOFFS);
```

**How the handoff loop works:**

1. **Start** with `currentAgentType` from routing
2. **Build system prompt** for this agent type
3. **Load message history** (last 15 messages from DB)
4. **Enter tool-calling loop** (up to 3 iterations per agent)
5. **If handoff requested** during tool loop:
   - Set `handoffRequested = true`
   - Increment `handoffCount`
   - Change `currentAgentType` to target agent
   - Break out of tool loop
6. **Check do-while condition:** `handoffRequested && handoffCount <= 2` → if true, RESTART the loop with the new agent type
7. **New iteration:** The new agent gets its own system prompt, sees the handoff context, and continues the conversation

This creates a chain like: `customer_support → appointment_booking → [responds]` with each agent getting its own persona and tools.

---

## 9. Tool-Calling Loop

**Lines 296-406**

```typescript
let toolLoopResponse = "";
let toolCalls: any[] = [];
let loopCount = 0;

while (loopCount < 3) {             // max 3 tool iterations
  await updateSessionState(supabase, session.id, { typing_status: 'thinking' });

  const llmResponse = await callAgentModel({
    messages,
    tools: TOOL_DEFINITIONS,       // ← from lib/tool-definitions.ts (10 functions)
    tool_choice: "auto"            // ← LLM decides whether to call or just reply
  });

  const choice = llmResponse.choices[0].message;

  // Track token usage (non-test only)
  if (!is_test) {
    const tokensUsed = llmResponse.usage?.total_tokens || 0;
    await checkTokenBudget(supabase, session.id, tokensUsed);
  }

  if (choice.tool_calls && choice.tool_calls.length > 0) {
    // LLM CALLED A FUNCTION → process each call
    messages.push(choice);           // add assistant message with tool_calls

    for (const call of choice.tool_calls) {
      const toolName = call.function.name;
      const toolArgs = JSON.parse(call.function.arguments);

      // Check permissions
      const allowedTools = TOOL_PERMISSIONS[currentAgentType] || [];
      if (!allowedTools.includes(toolName)) {
        messages.push({ role: "tool", content: JSON.stringify({ error: "not allowed" }) });
        continue;
      }

      if (toolName === 'match_kb_chunks') kbToolUsed = true;
      if (toolName === 'create_appointment') bookingToolCalled = true;

      const toolResult = await executeTool({
        tool_name: toolName, args: toolArgs,
        workspace_id, session_id: session.id, supabase
      });

      // HANDOFF DETECTION
      if (toolResult?.handoff_to) {
        // ... handoff logic (section 10)
        break;
      } else {
        // Normal tool result → add to messages
        messages.push({ role: "tool", content: JSON.stringify(toolResult) });
      }
    }

    if (handoffRequested) break;    // exit tool loop → restart agent loop
    loopCount++;                     // continue tool loop for next tool call
  } else {
    // LLM RETURNED TEXT — no function was called
    toolLoopResponse = sanitizeLlmOutput(choice.content);  // strip HTML
    break;                           // exit tool loop — response is ready
  }
}
```

### 9a. The LLM Request

Every tool-loop iteration sends to Groq:
```json
{
  "model": "llama-3.3-70b-versatile",
  "messages": [system prompt + conversation history + current message + previous tool calls/results],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "match_kb_chunks",
        "description": "Search the business knowledge base...",
        "parameters": { "type": "object", "properties": { "query": { "type": "string" } }, "required": ["query"] }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "create_appointment",
        "description": "Book a new appointment for a customer.",
        "parameters": {
          "type": "object",
          "properties": {
            "name": { "type": "string", "description": "Customer's full name." },
            "phone": { "type": "string" },
            "email": { "type": "string" },
            "service": { "type": "string" },
            "date": { "type": "string" },
            "time": { "type": "string" }
          },
          "required": ["name", "service", "date", "time"]
        }
      }
    },
    // ... 8 more tools
  ],
  "tool_choice": "auto",
  "temperature": 0.3,
  "max_tokens": 300
}
```

The LLM can either:
- **Call a tool** by returning `tool_calls` array
- **Respond with text** by returning a regular message

### 9b. The Fundamental Problem

The LLM (`llama-3.3-70b-versatile`) **almost never calls `create_appointment`**. It reliably calls:
- `match_kb_chunks` — works consistently (~90%)
- `request_handoff` — sometimes called but more often written as text+JSON
- `escalation_request` — sometimes called

But when the `appointment_booking` agent has ALL the details and the customer has confirmed with "yes", the LLM **returns text** instead of calling `create_appointment`:
> "I've booked your appointment for a cleaning tomorrow at 2pm."

This is why the booking pattern detector (section 12) exists — it catches this hallucination.

### 9c. Tool Execution

When a tool IS called, `executeTool()` from `lib/tools.ts` dispatches to the right handler:

```typescript
export async function executeTool(input) {
  const { tool_name, args, workspace_id, session_id, supabase } = input;

  switch (tool_name) {
    case 'match_kb_chunks':
      // generate embedding → RPC match_kb_chunks → return chunks
    case 'check_availability':
      // Google Calendar freeBusy API → return busy slots
    case 'create_appointment':
      // parseDT → Google Calendar create event → insert appointment → notifications
    case 'capture_lead':
      // upsert contact → Google Sheets auto-export → return contact
    case 'escalation_request':
      // update session status to 'escalated'
    case 'request_handoff':
      // return { handoff_to, handoff_reason, handoff_context }
    case 'update_appointment':
      // Google Calendar PATCH → update appointment
    case 'cancel_appointment':
      // Google Calendar DELETE → update status
    case 'get_contact_history':
      // select contact + appointments → return
    case 'update_contact':
      // update contact name/email/phone/notes
  }
}
```

---

## 10. Handoff Within Tool Loop

**Lines 347-389**

```typescript
if (toolResult?.handoff_to) {
  const targetAgent = toolResult.handoff_to;
  const validTarget = validAgentTypes.includes(targetAgent);

  if (validTarget && targetAgent !== currentAgentType && handoffCount < MAX_HANDOFFS) {
    handoffRequested = true;
    handoffContext = toolResult.handoff_context || toolResult.handoff_reason || '';

    // Add tool result to messages
    messages.push({ role: "tool", content: JSON.stringify({ status: 'handoff_initiated' }) });

    // Add assistant note
    messages.push({
      role: "assistant",
      content: `I'll transfer you to my teammate who handles ${AGENT_DESCRIPTIONS[targetAgent]?.label || targetAgent}.`
    });

    finalResponse = `Let me transfer you to our ${AGENT_DESCRIPTIONS[targetAgent]?.label || 'specialist'}...`;

    currentAgentType = targetAgent;
    handoffCount++;

    // Update DB
    await supabase.from('conversation_sessions')
      .update({ agent_type: targetAgent, updated_at: new Date().toISOString() })
      .eq('id', session.id);

    break;  // Exit tool loop → restart agent loop
  }
}
```

When a handoff is detected:
1. The `request_handoff` tool returns `{ handoff_to: "appointment_booking", handoff_context: "customer wants to reschedule" }`
2. The orchestrator validates that the target agent exists in `validAgentTypes`
3. Checks that we haven't exceeded `MAX_HANDOFFS` (2)
4. Changes `currentAgentType`, sets `handoffRequested = true`, breaks the tool loop
5. The do-while condition is true → restarts the agent loop
6. New iteration: builds system prompt for `appointment_booking`, includes handoff context
7. The new agent continues the conversation with all context preserved

---

## 11. Post-Loop: Truncation

**Lines 416-425**

```typescript
if (!finalResponse) finalResponse = guardrailConfig.fallback_message;

// Enforce max_response_length
const maxLen = guardrailConfig.max_response_length || 800;
if (finalResponse.length > maxLen) {
  const truncated = finalResponse.slice(0, maxLen);
  const lastSentence = truncated.lastIndexOf('. ');
  const lastPeriod = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');
  const breakAt = Math.max(lastSentence, lastPeriod, lastNewline);
  finalResponse = breakAt > maxLen * 0.5
    ? truncated.slice(0, breakAt + 1).trim()
    : truncated.trim() + '...';
}
```

**Purpose:** Ensures no message exceeds the workspace's configured `max_response_length` (default 800 chars). It finds the last sentence boundary (`. ` or `.` or `\n`) within the limit. If a boundary is found past the 50% point, it truncates cleanly at that boundary. If no boundary found, it adds `...` at the cut.

---

## 12. Post-Loop: Inline JSON Tool Fallback

**Lines 427-477**

```typescript
const jsonToolMatch = finalResponse.match(/\{[\s\S]*"(\w+)"[\s\S]*\}/);
if (jsonToolMatch) {
  try {
    const parsed = JSON.parse(jsonToolMatch[0]);

    // Match tool by checking for required keys
    const toolSignatures = {
      check_availability: ["date", "time"],
      create_appointment: ["name", "service", "date", "time"],
      request_handoff: ["target_agent", "reason"],
      update_appointment: ["appointment_id"],
      cancel_appointment: ["appointment_id"],
      capture_lead: ["name"],
      update_contact: ["name"],
      match_kb_chunks: ["query"],
    };

    let matchedTool = null;
    for (const [tool, reqKeys] of Object.entries(toolSignatures)) {
      if (reqKeys.some(k => k in parsed)) { matchedTool = tool; break; }
    }

    if (matchedTool) {
      const allowedTools = TOOL_PERMISSIONS[currentAgentType] || [];
      if (allowedTools.includes(matchedTool)) {
        // Strip JSON from response text
        finalResponse = finalResponse.replace(jsonToolMatch[0], '').replace(/\s+,?\s*$/, '') || 'One moment please...';

        // Execute the tool
        const toolResult = await executeTool({ tool_name: matchedTool, args: parsed, ... });

        if (matchedTool === 'request_handoff' && toolResult?.handoff_to && ...) {
          // HANDOFF: switch agent + re-prompt LLM
          currentAgentType = toolResult.handoff_to;
          handoffCount++;
          // ... build new prompt, re-prompt LLM ...
        } else if (!toolResult?.error) {
          // NORMAL TOOL: re-prompt LLM with result
          messages.push({ role: "assistant", content: finalResponse });
          messages.push({ role: "tool", content: JSON.stringify(toolResult) });
          const rePromptLlm = await callAgentModel({
            messages: messages.concat({ role: "user", content: `Based on the tool result above, respond to the customer naturally.` })
          });
          finalResponse = sanitizeLlmOutput(rePromptLlm.choices?.[0]?.message?.content || finalResponse);
        }
      }
    }
  } catch (_) {}  // silently fail on parse error
}
```

**Purpose:** Handles the case where the LLM writes JSON inside its text response instead of using the proper `tool_calls` API. This is common with llama-3.3-70b-versatile — it often writes:

> "I'll transfer you to our Appointment Booker. {"target_agent": "appointment_booking", "reason": "booking request"}"

The regex `/\{[\s\S]*"(\w+)"[\s\S]*\}/` finds the JSON, and the signature matcher identifies which tool to call by checking for required keys. Then it executes the tool and either:
- **For handoffs:** Changes agent type and re-prompts the new agent
- **For normal tools:** Adds the result to messages and re-prompts the LLM to generate a natural response

---

## 13. Post-Loop: Booking Pattern Detector

**Lines 490-536**

```typescript
if (!is_test && currentAgentType === 'appointment_booking' && !bookingToolCalled) {
  const bookingPatterns = /\b(booked|booking|scheduled|confirmed|set up|reserved|appointment.*confirm|confirm.*appointment)\b/i;
  if (bookingPatterns.test(finalResponse) && !/unable|cannot|can't|sorry/i.test(finalResponse)) {
    try {
      // 1. Get ALL conversation messages (chronological)
      const { data: msgHistory } = await supabase.from('messages')
        .select('content, role')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

      // 2. Format as conversation text
      const convoText = (msgHistory || []).map(m =>
        `${m.role === 'agent' ? 'AI' : 'Customer'}: ${m.content}`
      ).join('\n');

      // 3. Call LLM to extract booking details
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

        // 4. Programmatically create the appointment
        const apptResult = await executeTool({
          tool_name: 'create_appointment',
          args: bookingDetails,
          workspace_id,
          session_id: session.id,
          supabase
        });

        // 5. Replace the fake response with real confirmation
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

**What this solves:** The LLM consistently fails to call `create_appointment` via the tool API. Even though the system prompt says "Only call `create_appointment` AFTER the customer explicitly confirms," the LLM instead writes text like "I've booked your appointment for tomorrow at 2pm" — which sounds like it worked but actually did nothing.

**How it works:**
1. **Condition check:** Only runs for `appointment_booking` agent, when no `create_appointment` tool was actually called, and the response contains booking keywords
2. **Conversation extraction:** Fetches all messages from the DB and formats them as a simple conversation transcript
3. **LLM extraction:** Calls the LLM with a strict extraction prompt to parse the conversation and extract `{ name, phone, email, service, date, time }`
4. **Programmatic booking:** Calls `executeTool('create_appointment', ...)` directly with the extracted details — same code path as if the LLM had called the tool properly
5. **Response replacement:** The faked "I've booked your appointment" text is replaced with a real confirmation including the actual date/time and Meet link

**Testing result:** End-to-end test confirmed:
- Google Calendar event created: `rgg318gfdf3f161f2m61nrisd0`
- Google Meet link: `https://meet.google.com/zap-zbyr-kst`
- Appointment stored in DB: `customer_name: Samir, service: cleaning, start_at: 2026-05-16T14:00:00`

---

## 14. KB Response Cache

**Lines 480-484**

```typescript
if (!is_test && cacheKeyHex && kbToolUsed && finalResponse !== guardrailConfig.fallback_message) {
  try {
    await supabase.from('kb_response_cache').upsert({
      workspace_id,
      cache_key: cacheKeyHex,
      query_text: sanitizedMessage,
      response_text: finalResponse
    }, { onConflict: 'workspace_id, cache_key' });
  } catch (_) {}
}
```

Only caches responses that:
- Used the `match_kb_chunks` tool (not booking/sales)
- Produced a valid response (not the fallback)
- Are not test requests

---

## 15. Store Response

**Lines 538-542**

```typescript
await supabase.from('messages').insert({
  workspace_id,
  session_id: session.id,
  content: finalResponse,
  direction: 'outbound',
  role: 'agent',
  agent_type: currentAgentType,
  metadata: { trace_id: traceId, handoff_count: handoffCount }
});
```

Every AI response is saved to the `messages` table for:
- Conversation history (used in subsequent requests)
- Debugging (trace_id tracks the full request path)
- Analytics (handoff_count tells how many agent switches occurred)

---

## 16. GoWA Dispatch (WhatsApp Only)

**Lines 500-619**

```typescript
if (channel === 'whatsapp' && deviceId && phone && !is_test) {
  // 1. Send "typing" indicator (composing presence)
  try {
    await fetch(`${gowaBase}/send/presence`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
      body: JSON.stringify({ phone, type: 'available' })
    });
  } catch (_) {}

  // 2. Artificial typing delay (12ms per character, max 1500ms)
  const delayMs = calculateTypingDelay(finalResponse);
  await new Promise(resolve => setTimeout(resolve, delayMs));

  // 3. Stop composing
  try {
    await fetch(`${gowaBase}/send/presence`, {
      method: 'POST',
      body: JSON.stringify({ phone, type: 'unavailable' })
    });
  } catch (_) {}

  // 4. Split long messages (max 1000 chars per part, at sentence boundaries)
  const maxLen = 1000;
  const parts: string[] = [];
  let remaining = finalResponse;
  while (remaining.length > maxLen) {
    let splitAt = remaining.lastIndexOf('. ', maxLen);
    if (splitAt < maxLen / 2) splitAt = remaining.lastIndexOf(' ', maxLen);
    if (splitAt < maxLen / 2) splitAt = maxLen;
    parts.push(remaining.slice(0, splitAt + 1).trim());
    remaining = remaining.slice(splitAt + 1).trim();
  }
  if (remaining) parts.push(remaining);

  // 5. Dispatch with 3× retry per part
  let lastError = "";
  let dispatched = false;
  for (const part of parts) {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        const backoff = 1000 * Math.pow(2, attempt) + Math.random() * 500;
        await new Promise(res => setTimeout(res, backoff));
      }
      const resp = await fetch(`${gowaBase}/send/message`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
        body: JSON.stringify({ phone, message: part })
      });
      if (resp.ok) { dispatched = true; break; }
      lastError = `HTTP ${resp.status}: ${await resp.text().catch(() => '')}`;
    }
  }

  // 6. Failed messages fallback
  if (!dispatched) {
    await supabase.from('failed_messages').insert({
      workspace_id,
      session_id: session.id,
      raw_message: finalResponse,
      failure_reason: lastError,
      retry_count: 3,
      resolved: false
    });
  }
}
```

**The flow for WhatsApp:**
1. Show "typing..." indicator via GoWA presence API
2. Wait for artificial typing delay (`min(message.length × 12ms, 1500ms)`)
3. Remove typing indicator
4. Split message at 1000-character boundaries (preferring sentence breaks)
5. Send each part with 3 retries (exponential backoff: 1s, 2s, 4s + jitter)
6. If all retries fail, save to `failed_messages` table for retry later

---

## 17. Update Session State & Return

**Lines 622-629**

```typescript
await updateSessionState(supabase, session.id, {
  last_message_at: new Date().toISOString(),
  last_message_preview: finalResponse.substring(0, 100),
  typing_status: 'idle'
});

return new Response(JSON.stringify({
  response_parts: [finalResponse],
  metadata: { handoff_count: handoffCount }
}), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
```

Final response returns:
```json
{
  "response_parts": ["Your appointment has been confirmed for 5/16/2026, 2:00:00 PM. You'll receive a Google Meet link shortly."],
  "metadata": { "handoff_count": 0 }
}
```

---

## 18. Global Error Handler

**Lines 631-635**

```typescript
} catch (error: any) {
  console.error(`[ORCHESTRATOR] Global Error: ${error.message}`);
  return new Response(JSON.stringify({
    response_parts: [STATIC_FALLBACK_MESSAGE],
    metadata: { error: error.message }
  }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
```

If ANY unhandled exception occurs (network error, DB error, Groq API down, JSON parse error), the global catch block:
1. Logs the error
2. Returns `STATIC_FALLBACK_MESSAGE` ("I'm having a small technical hiccup...") with HTTP 200 (not 500 — so WhatsApp doesn't retry)
3. Includes the error message in metadata for debugging

---

## Summary: Complete Request Flow

```
Request arrives
  ↓
Parse JSON body (workspace_id, customer_jid, message, channel, agent_type, is_test)
  ↓
Sanitize input (strip prompt injection)
  ↓
Get or create session
  ↓
Check token budget (maxTokensPerSession = 100000)
  ↓
Check credits (credits_balance > 0)
  ↓
Check WhatsApp 24-hour window
  ↓
Check KB cache (SHA-256 hash → kb_response_cache)
  ↓  (cache miss)
Load all active agents from DB
  ↓
Route intent (affirmation check → maybe LLM router → appointment_booking / customer_support / sales)
  ↓
AGENT LOOP (do-while, max 2 handoffs):
  │
  ├─ Build system prompt for current agent
  ├─ Load message history (last 15)
  ├─ TOOL LOOP (while loopCount < 3):
  │   ├─ Call Groq LLM with messages + 10 tool definitions
  │   ├─ LLM returns tool_calls? → executeTool()
  │   │   ├─ Handoff? → switch agent, set handoffRequested=true, break
  │   │   └─ Normal? → add result, loopCount++
  │   ├─ LLM returns text? → sanitize, set toolLoopResponse, break
  │   └─ (max 3 iterations)
  │
  ├─ handoffRequested? → restart agent loop with new agent type
  └─ Not handoff? → finalResponse = toolLoopResponse || fallback
  ↓
Post-loop:
  ├─ Truncate at max_response_length (800 chars)
  ├─ Inline JSON fallback (find JSON in text, execute tool, re-prompt)
  ├─ Booking pattern detector (find "booked" text, extract details, call create_appointment)
  └─ KB cache (save response if KB tool was used)
  ↓
Store response in messages table
  ↓
WhatsApp? → GoWA dispatch (presence + typing delay + split + 3× retry)
  ↓
Update session state
  ↓
Return HTTP response { response_parts, metadata }
```

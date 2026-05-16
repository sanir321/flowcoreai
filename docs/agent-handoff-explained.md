# Agent Handoff — How Agents Are Changed Mid-Conversation

## The Problem

A customer starts talking to `customer_support`, then asks to book an appointment. The system has 3 agent types:

- **customer_support** — answers FAQs, searches KB
- **appointment_booking** — checks availability, creates/cancels/reschedules appointments
- **sales** — capture leads, pricing

`customer_support` cannot book appointments. It must hand off to `appointment_booking`. But the orchestrator only knows one agent type at a time. How does it switch?

---

## The Core Mechanism: do-while Handoff Loop

**File:** `index.ts`, lines 248-412

```typescript
let handoffCount = 0;
const MAX_HANDOFFS = 2;

do {
  handoffRequested = false;          // ← reset at TOP of each iteration

  // 1. Build system prompt for currentAgentType
  const systemPrompt = buildTeamPrompt(allAgents, workspace_name, currentAgentType, channel);

  // 2. Load message history
  const messages = [{ role: "system", content: systemPrompt }];
  // ... add conversation history + current message ...

  // 3. Run tool-calling loop
  let toolLoopResponse = "";
  while (loopCount < 3) {
    const llmResponse = await callAgentModel({ messages, tools: TOOL_DEFINITIONS, tool_choice: "auto" });
    // ... process tool_calls or text ...

    if (choice.tool_calls) {
      for (const call of choice.tool_calls) {
        const toolResult = await executeTool(...);
        if (toolResult?.handoff_to) {
          handoffRequested = true;     // ← triggers restart
          currentAgentType = targetAgent;
          handoffCount++;
          break;                       // ← exit tool loop
        }
      }
      if (handoffRequested) break;
    } else {
      toolLoopResponse = choice.content;
      break;
    }
  }

  // 4. Did a handoff happen?
  if (!handoffRequested) {
    finalResponse = toolLoopResponse;  // ← normal response, loop exits
  }
  // if handoffRequested = true → continue the do-while loop

} while (handoffRequested && handoffCount <= MAX_HANDOFFS);
//       ↑ loop AGAIN with new agent  ↑ max 2 handoffs per request
```

The do-while loop IS the handoff mechanism. When `handoffRequested = true`:
1. The current iteration ends
2. The `while` condition checks `handoffRequested && handoffCount <= 2` → **true**
3. The loop **restarts** from the top
4. A new system prompt is built for `currentAgentType` (which was just changed)
5. The new agent gets the conversation history + handoff context and continues

---

## Path 1: Proper Tool Call Handoff (Rarest)

The LLM correctly calls `request_handoff` via the function-calling API:

**File:** `index.ts`, lines 296-389

```
┌─────────────────────────────────────────────────────────────────────┐
│ TOOL LOOP ITERATION (appointment_booking agent)                     │
│                                                                     │
│  callAgentModel({ messages, tools, tool_choice: "auto" })           │
│    ↓                                                                │
│  LLM returns:                                                       │
│  {                                                                  │
│    "tool_calls": [{                                                 │
│      "function": {                                                  │
│        "name": "request_handoff",                                   │
│        "arguments": `{                                              │
│          "target_agent": "appointment_booking",                     │
│          "reason": "Customer needs to reschedule",                  │
│          "context": "Customer wants to move their appointment"      │
│        }`                                                           │
│      }                                                              │
│    }]                                                               │
│  }                                                                  │
│    ↓                                                                │
│  Permission check: "request_handoff" ∈ customer_support's tools ✓   │
│    ↓                                                                │
│  executeTool({ tool_name: "request_handoff", args: {...} })         │
│    ↓                                                                │
│  lib/tools.ts line 297-303:                                         │
│  case 'request_handoff':                                            │
│    return {                                                         │
│      handoff_to: "appointment_booking",                             │
│      handoff_reason: "Customer needs to reschedule",                │
│      handoff_context: "Customer wants to move their appointment"    │
│    }                                                                │
│    ↓                                                                │
│  index.ts line 347:                                                 │
│  if (toolResult?.handoff_to) {                                      │
│    const targetAgent = "appointment_booking";                       │
│    validTarget = true ✓                                             │
│    targetAgent !== currentAgentType ✓                               │
│    handoffCount(0) < MAX_HANDOFFS(2) ✓                              │
│    ↓                                                                │
│    handoffRequested = true                                          │
│    handoffContext = "Customer wants to move their appointment"      │
│    currentAgentType = "appointment_booking"                         │
│    handoffCount = 1                                                 │
│    ↓                                                                │
│    Update DB: session.agent_type = "appointment_booking"            │
│    ↓                                                                │
│    break  ← exit tool loop                                          │
│  }                                                                  │
│    ↓                                                                │
│  if (handoffRequested) break;  ← exit tool loop                     │
└─────────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ DO-WHILE CONDITION CHECK                                           │
│                                                                     │
│  handoffRequested = true                                            │
│  handoffCount = 1                                                   │
│  1 <= 2 → true                                                      │
│    ↓                                                                │
│  RESTART agent loop with currentAgentType = "appointment_booking"   │
└─────────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ AGENT LOOP ITERATION 2 (appointment_booking)                        │
│                                                                     │
│  handoffRequested = false  ← reset at top                           │
│    ↓                                                                │
│  buildTeamPrompt(allAgents, "appointment_booking")                  │
│    ↓                                                                │
│  system prompt includes BOOKING RULES for appointment_booking       │
│    ↓                                                                │
│  Messages sent to LLM:                                              │
│  ┌─ System: [Appointment Booker prompt with BOOKING RULES]         │
│  ├─ System: [HANDOFF CONTEXT] appointment_booking is now handling  │
│  │          the conversation. Previous teammate handed off with    │
│  │          context: "Customer wants to move their appointment"    │
│  ├─ Customer: "book a cleaning tomorrow 2pm"                       │
│  ├─ Assistant: "I can't handle appointments..."                    │
│  └─ Customer: "yes"                                                │
│    ↓                                                                │
│  LLM responds appropriately WITH booking tools available            │
└─────────────────────────────────────────────────────────────────────┘
```

### Code at lines 347-389 (handoff detection):

```typescript
if (toolResult?.handoff_to) {
  const targetAgent = toolResult.handoff_to;
  const validTarget = validAgentTypes.includes(targetAgent);

  // THREE CONDITIONS must ALL be true:
  if (
    validTarget &&                          // 1. Target agent exists in this workspace
    targetAgent !== currentAgentType &&     // 2. Not handing off to self
    handoffCount < MAX_HANDOFFS             // 3. Haven't exceeded max handoffs (2)
  ) {
    handoffRequested = true;
    handoffContext = toolResult.handoff_context || toolResult.handoff_reason || '';

    // Add assistant note to message history for the NEW agent to see
    messages.push({
      role: "tool",
      content: JSON.stringify({ status: 'handoff_initiated', message: `Handing off to ${targetAgent}` })
    });
    messages.push({
      role: "assistant",
      content: `I'll transfer you to my teammate who handles ${AGENT_DESCRIPTIONS[targetAgent]?.label || targetAgent}. Give me just a moment!`
    });

    finalResponse = `Let me transfer you to our ${AGENT_DESCRIPTIONS[targetAgent]?.label || 'specialist'} who can help with this.`;

    currentAgentType = targetAgent;   // ← THE SWITCH
    handoffCount++;

    // Persist the change to the database
    await supabase.from('conversation_sessions')
      .update({ agent_type: targetAgent, updated_at: new Date().toISOString() })
      .eq('id', session.id);

    break;  // Exit tool loop → control returns to do-while condition
  } else {
    // Blocked handoff: too many handoffs or invalid target
    messages.push({
      role: "tool",
      content: JSON.stringify({ error: "Cannot handoff - unavailable or max transfers reached" })
    });
  }
}
```

---

## Path 2: Inline JSON Handoff (Most Common)

The LLM writes JSON directly in its text response instead of using `tool_calls`:

**File:** `index.ts`, lines 427-477

```
┌─────────────────────────────────────────────────────────────────────┐
│ TOOL LOOP ITERATION (customer_support)                              │
│                                                                     │
│  LLM returns TEXT (no tool_calls):                                  │
│  "I don't have the ability to book appointments.                   │
│   {"target_agent": "appointment_booking",                           │
│    "reason": "booking request",                                     │
│    "context": "Customer wants to book a cleaning at 2pm"}           │
│  Let me transfer you."                                              │
│    ↓                                                                │
│  toolLoopResponse = sanitizeLlmOutput(text)                         │
│  break  ← exit tool loop with text response                         │
│    ↓                                                                │
│  handoffRequested = false (no tool was called correctly)            │
│  finalResponse = toolLoopResponse                                   │
└─────────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ DO-WHILE CONDITION CHECK                                           │
│  handoffRequested = false → loop EXITS                              │
└─────────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ POST-LOOP: INLINE JSON FALLBACK (lines 427-477)                    │
│                                                                     │
│  Regex: /\{[\s\S]*"(\w+)"[\s\S]*\}/                                │
│  Matches: {"target_agent": "appointment_booking", ...}              │
│    ↓                                                                │
│  Parse JSON → { target_agent: "appointment_booking", reason, ... }  │
│    ↓                                                                │
│  Match tool signature:                                              │
│  request_handoff requires ["target_agent", "reason"]                │
│  Both keys exist → matchedTool = "request_handoff" ✓                │
│    ↓                                                                │
│  Permission check: "request_handoff" ∈ customer_support's tools ✓   │
│    ↓                                                                │
│  Strip JSON from response text:                                     │
│  "I don't have the ability to book appointments.                    │
│   Let me transfer you."                                             │
│    ↓                                                                │
│  executeTool({                                                      │
│    tool_name: "request_handoff",                                    │
│    args: { target_agent: "appointment_booking", reason: "booking" } │
│  })                                                                 │
│    ↓                                                                │
│  Returns: { handoff_to: "appointment_booking", handoff_context }    │
│    ↓                                                                │
│  Condition check:                                                   │
│  matchedTool === 'request_handoff' ✓                                │
│  toolResult?.handoff_to = "appointment_booking" ✓                   │
│  !== currentAgentType ✓                                             │
│    ↓                                                                │
│  currentAgentType = "appointment_booking"                           │
│  handoffCount++                                                     │
│    ↓                                                                │
│  Update DB: session.agent_type = "appointment_booking"              │
│    ↓                                                                │
│  Build NEW system prompt for appointment_booking:                   │
│  handoffPrompt = buildTeamPrompt(allAgents, "appointment_booking")  │
│    ↓                                                                │
│  messages = [                                                       │
│    { role: "system", content: handoffPrompt },                      │
│    { role: "system", content: "[HANDOFF CONTEXT] ..." },            │
│    { role: "assistant", content: finalResponse },                   │
│    { role: "tool", content: JSON.stringify(toolResult) },           │
│    { role: "user", content: "[Handoff from previous teammate] ..." }│
│  ]                                                                  │
│    ↓                                                                │
│  Re-prompt LLM WITH NEW AGENT:                                      │
│  const handoffLlm = await callAgentModel({ messages })               │
│    ↓                                                                │
│  New response from appointment_booking:                              │
│  "I can help with that booking! You wanted a cleaning at 2pm..."    │
│    ↓                                                                │
│  finalResponse = new response                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Code at lines 452-466 (the inline JSON handoff):

```typescript
if (matchedTool === 'request_handoff' && toolResult?.handoff_to && toolResult.handoff_to !== currentAgentType) {
  // SWITCH AGENT
  currentAgentType = toolResult.handoff_to;
  handoffCount++;

  // Persist to DB
  await supabase.from('conversation_sessions')
    .update({ agent_type: toolResult.handoff_to, updated_at: new Date().toISOString() })
    .eq('id', session.id);

  // Build new prompt for the target agent
  messages.push({ role: "assistant", content: finalResponse });       // original text
  messages.push({ role: "tool", tool_call_id: "inline", name: matchedTool, content: JSON.stringify(toolResult) });

  const handoffPrompt = buildTeamPrompt(allAgents, workspace_name, currentAgentType, channel);
  messages.unshift({ role: "system", content: handoffPrompt });       // new system prompt

  // Keep ONLY the new system prompt (remove any old ones)
  const handoffMessages = messages.filter(m => m.role !== 'system' || m === messages[0]);

  // Add handoff context as the latest user message
  handoffMessages.push({
    role: "user",
    content: `[Handoff from previous teammate] ${toolResult.handoff_context || ''}. Continue assisting the customer.`
  });

  // Re-prompt LLM with the new agent's persona
  const handoffLlm = await callAgentModel({ messages: handoffMessages });
  finalResponse = sanitizeLlmOutput(handoffLlm.choices?.[0]?.message?.content || guardrailConfig.fallback_message);
}
```

### Tool Signature Matching (lines 432-445):

```typescript
const toolSignatures = {
  check_availability: ["date", "time"],              // both keys must exist
  create_appointment: ["name", "service", "date", "time"],
  request_handoff: ["target_agent", "reason"],       // ← matches this
  update_appointment: ["appointment_id"],
  cancel_appointment: ["appointment_id"],
  capture_lead: ["name"],
  update_contact: ["name"],
  match_kb_chunks: ["query"],
};

// Check if ANY required key exists in the parsed JSON
let matchedTool = null;
for (const [tool, reqKeys] of Object.entries(toolSignatures)) {
  if (reqKeys.some(k => k in parsed)) {
    matchedTool = tool;
    break;  // first match wins
  }
}
```

This uses `some()` — it only needs ONE matching key. So `{"target_agent": "..."}` alone would match `request_handoff` even without `reason`.

---

## Path 3: Booking Pattern Detector Handoff (Not Really a Handoff)

This isn't a handoff between agents — it catches the `appointment_booking` agent failing to call `create_appointment`:

**File:** `index.ts`, lines 490-536

```
┌─────────────────────────────────────────────────────────────────────┐
│ TOOL LOOP ITERATION (appointment_booking)                           │
│                                                                     │
│  LLM returns TEXT (no tool_calls):                                  │
│  "I've booked your appointment for tomorrow at 2pm."                │
│    ↓                                                                │
│  toolLoopResponse = "I've booked your appointment..."               │
│  break                                                              │
│    ↓                                                                │
│  handoffRequested = false → loop exits                              │
│  finalResponse = "I've booked your appointment..."                  │
└─────────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ POST-LOOP: Booking Pattern Detection (lines 490-536)                │
│                                                                     │
│  Conditions:                                                        │
│  ✓ currentAgentType === 'appointment_booking'                       │
│  ✓ !bookingToolCalled (create_appointment was never called)         │
│  ✓ /booked|booking|confirmed|scheduled/.test("I've booked...")      │
│  ✓ !/unable|cannot|sorry/.test("I've booked...")                    │
│    ↓                                                                │
│  Fetch ALL messages from DB:                                        │
│  [Customer: "book a cleaning tomorrow 2pm..."                       │
│   AI: "You want to book a cleaning tomorrow at 2pm..."              │
│   Customer: "yes"                                                   │
│   AI: "I've booked your appointment..."]                            │
│    ↓                                                                │
│  Call LLM to extract booking details:                               │
│  System: "Extract booking details from this conversation..."        │
│  LLM returns: {"name":"Samir","email":"samir@test.com",...}         │
│    ↓                                                                │
│  executeTool({ tool_name: 'create_appointment', args: details })    │
│    ↓                                                                │
│  Google Calendar event created ✓                                    │
│  Meet link generated ✓                                              │
│  Appointment stored in DB ✓                                         │
│  Notifications sent ✓                                               │
│    ↓                                                                │
│  finalResponse = "Your appointment has been confirmed for...        │
│                   You'll receive a Google Meet link shortly."       │
└─────────────────────────────────────────────────────────────────────┘
```

## What Happens to the Session in the Database

Every time the agent type changes, the `conversation_sessions` table is updated:

```typescript
await supabase.from('conversation_sessions')
  .update({
    agent_type: targetAgent,           // ← new agent type
    updated_at: new Date().toISOString()
  })
  .eq('id', session.id);
```

This means:
- **Next customer message** (from WhatsApp/webhook): the session's `agent_type` is already `appointment_booking`
- The affirmation check at line 230-233 keeps the existing agent type on "yes"/"ok"
- Subsequent LLM calls use the correct persona

Without this DB update, the session would still show `customer_support` and the next message would re-route back to the wrong agent.

## What Happens to Message History

The handoff is transparent to the customer. The message history contains:

```
Customer: "I need to reschedule my appointment"
Assistant: "I don't have the ability to handle appointments. Let me request a handoff to our Appointment Booker teammate."
Customer: (no message — the handoff is internal)
Assistant: "I can help with that! You'd like to reschedule your appointment..."
```

The customer never sees the transfer message (it's added to messages but marked as `direction: 'outbound'` from the orchestrator). Actually, wait — looking at the code more carefully:

In Path 1 (tool loop handoff, line 366-369):
```typescript
messages.push({
  role: "assistant",
  content: `I'll transfer you to my teammate who handles ${label}. Give me just a moment!`
});
finalResponse = `Let me transfer you to our ${label} who can help with this. One moment please!`;
```

This `finalResponse` IS returned to the customer — so they DO see the transfer message. But in Path 2 (inline JSON), the JSON is stripped and the re-prompted LLM responds directly.

## Visual Summary

```
                    Handoff Paths
                    ────────────

PATH 1: Proper tool_calls
───────────────
LLM → tool_calls[request_handoff] → executeTool()
  → toolResult.handoff_to exists
  → currentAgentType = targetAgent
  → handoffRequested = true
  → do-while RESTARTS with new agent
  → New system prompt built
  → LLM re-prompted naturally

PATH 2: Inline JSON in text (MOST COMMON)
───────────────
LLM → text response with {"target_agent": "..."} inside
  → tool loop exits (no tool_calls)
  → do-while exits (handoffRequested = false)
  → Post-loop regex finds JSON
  → executeTool("request_handoff", args)
  → currentAgentType = targetAgent
  → New system prompt built
  → LLM re-prompted with handoff context

PATH 3: Booking pattern (NOT a handoff)
───────────────
LLM → text "I've booked your appointment..."
  → tool loop exits (no tool_calls)
  → do-while exits
  → Post-loop booking pattern matches
  → Extract details from conversation
  → executeTool("create_appointment", details)
  → Replace response with real confirmation


Agent Type Flow Through the System
──────────────────────────────────

   Webhook sends: agent_type = "customer_support"
                    │
   Router might change it: routeResult.agent = "appointment_booking"
                    │
   start of agent loop: currentAgentType = "appointment_booking"
                    │
   Tool loop handoff: currentAgentType = "sales" (handoffCount=1)
                    │
   do-while restarts with new currentAgentType
                    │
   end: finalResponse stored with currentAgentType
        session updated in DB with currentAgentType
                    │
   Next customer message: session.agent_type is already updated
                          affirmation keeps it unless router overrides
```

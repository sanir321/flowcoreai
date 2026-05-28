Here is the comprehensive, step-by-step architectural guide to hardening the ecosystem, fixing the linkage bugs, and forcing Llama 3.3 70B to behave deterministically.

Phase 1: Hardening the State Machine (Database & Dependencies)
The most critical failures right now are happening because the system's internal state is either breaking sync with the active session or relying too heavily on external APIs.

1. Wrap Lead Capture and Session Linkage in a Sequential Operation
The CRM tool must close the loop. When capture_lead fires, it cannot just dump the contact into the database and walk away; it has to attach that contact to the active conversation.

Action: Update tools/impl/crm.ts. After the upsert to the contacts table, immediately run an update on conversation_sessions to set the contact_id where session_id equals the current session. Return the combined success state only when both operations finish.

2. Decouple Local Database State from Google Calendar
Your system's source of truth must be its own database, not Google. If a workspace's OAuth token expires, it shouldn't crash the entire update/cancel workflow.

Action: In tools/impl/calendar.ts, restructure updateAppointment. Execute the local database update first. Then, wrap the Google Calendar API call in a try/catch. If the Google API fails, log the error and update a sync_status column on the local appointment row to 'pending_retry' or 'failed_sync'. Return a success message to the LLM indicating the local update succeeded, so the conversation continues uninterrupted.

Phase 2: Enforcing LLM Tool Discipline
Llama 3.3 70B is highly capable, but it has a known tendency to "hallucinate success" by writing conversational confirmations before actually verifying the tool payload.

1. Enforce the "Think, Act, Wait" Prompting Pattern
The system prompt needs a strict, programmatic constraint that forces the LLM to separate tool execution from user communication.

Action: Inject this directive into the core system prompt for all agents: "CRITICAL: When executing a tool (like booking, moving stages, or looking up data), output ONLY the tool call parameters. DO NOT generate conversational text confirming an action until you receive a definitive 'success' payload back from the tool."

2. Expand validatePlanActions Middleware
Since you already have middleware intercepting order/payment flows, expand this to act as a global truth-checker for Booking and CRM actions.

Action: If the LLM's outbound text string contains success phrases (e.g., "successfully booked", "moved to qualified"), the middleware must intercept the response, verify the database state confirms the action, and if it doesn't, strip the hallucinated text and force a silent system-prompt correction back to the LLM (e.g., "System Error: You told the user the appointment was booked, but the tool failed. Apologize and ask for a different time.").

3. Apply Strict Negative Constraints for the Knowledge Base
To fix the invented pricing tiers, constrain the Sales Agent's creative freedom regarding facts and figures.

Action: Add this to the Sales Agent prompt: "Do not provide pricing, tiers, or integration details unless explicitly returned by the match_kb_chunks tool. If the information is not in the knowledge base, explicitly state that you do not have that information."

Phase 3: Fixing the Escalation Flow
The escalation logic is triggering correctly, but the handoff message is dying in the routing tier.

1. Bridge T0 and T3 for Handoffs
T0 (the instant response tier) is successfully identifying the escalation keywords and updating the session status, but it's dropping the ball because it only returns early for billing or window limits.

Action: Modify t0-instant.ts to allow the "escalation" payload to pass through. Then, in the T3 execution loop, add a priority check: if (session.status === 'escalated'). If this is true, bypass the standard LLM generation entirely. Forcefully invoke the request_handoff tool (or trigger the pre-configured escalation message) to ensure the user receives the correct transition text.
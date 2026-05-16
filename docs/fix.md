Scenario Breakdown: 1, 2, 3 Agents
1 Agent Only
Two things break:
Problem A — Router returns a ghost agent type. The router LLM doesn't know which agents your workspace actually has. A customer with only customer_support enabled asks to book → router returns appointment_booking → allAgents.find(a => a.agent_type === 'appointment_booking') returns undefined → currentAgent is undefined in the loop → buildTeamPrompt gets a currentAgentType that has no matching agent → the system prompt is partially broken or defaults weirdly.
Problem B — Handoff tool has nowhere to go. TOOL_PERMISSIONS always includes request_handoff for every agent type. With 1 agent, the LLM's system prompt still tells it "you can hand off to teammates" but no teammates exist. LLM calls request_handoff → validAgentTypes.includes(targetAgent) fails silently → handoffRequested stays false → finalResponse is empty or hits the fallback message.
2 Agents
Same two problems, but only for the missing third type. If workspace has customer_support + appointment_booking but no sales → router routes a sales-intent message to sales → undefined agent → broken prompt. The two active agents work fine with each other's handoffs.
3 Agents
Intended design. Routing and handoffs work correctly. The only problem here is the tool-calling reliability issue (all three agents affected).

The Fixes
Fix 1 — Route to an Agent That Actually Exists
After routeIntent() returns, check if the target agent type is actually in allAgents. If not, fall back to whatever the workspace has.
typescript// After routeIntent() call in index.ts ~line 235
const availableAgentTypes = (allAgents || []).map(a => a.agent_type);

// If router returned an agent type the workspace doesn't have, fall back
if (!availableAgentTypes.includes(routeResult.agent)) {
  // Use the session's existing agent if valid, else use the first active agent
  if (availableAgentTypes.includes(session.agent_type)) {
    routeResult.agent = session.agent_type;
  } else {
    routeResult.agent = availableAgentTypes[0]; // fallback to whatever exists
  }
}

let currentAgentType = routeResult.agent;

Fix 2 — Remove Handoff Tool From Single-Agent Workspaces
In TOOL_PERMISSIONS, request_handoff makes no sense if there's only one agent. Strip it dynamically.
typescript// Replace your existing TOOL_PERMISSIONS lookup with this helper
function getAgentTools(agentType: string, allAgents: any[]): string[] {
  const base = TOOL_PERMISSIONS[agentType] || [];
  const hasMultipleAgents = allAgents.length > 1;

  if (!hasMultipleAgents) {
    // Single agent workspace — no handoff tools, they have no one to hand off to
    return base.filter(t => t !== 'request_handoff');
  }

  return base;
}

// Then in your tool-calling loop, replace:
// const allowedTools = TOOL_PERMISSIONS[currentAgentType] || [];
// with:
const allowedTools = getAgentTools(currentAgentType, allAgents);
And in buildTeamPrompt, pass allAgents.length so the prompt doesn't tell a single agent it has teammates:
typescript// In buildTeamPrompt(), add a condition when building the team section
const hasTeam = allAgents.length > 1;

const teamSection = hasTeam
  ? `TEAM HANDOFF: If you cannot handle this request, use request_handoff to transfer to the right teammate.`
  : `You are the only agent for this workspace. Handle everything within your capabilities. If you cannot help, escalate to a human using escalation_request.`;

Fix 3 — Force Tool Calls (The Core Fix)
This is the main fix. Change tool_choice from "auto" to "required" on the first loop iteration for all agents. After the first tool call, switch back to "auto".
typescript// In your tool-calling loop (index.ts ~line 537)
while (loopCount < 3) {
  await updateSessionState(supabase, session.id, { typing_status: 'thinking' });

  // FIXED: force a tool call on first attempt, auto after that
  const toolChoice = loopCount === 0 ? "required" : "auto";

  const llmResponse = await callAgentModel({
    messages,
    tools: TOOL_DEFINITIONS.filter(t => allowedTools.includes(t.function.name)),
    tool_choice: toolChoice   // <-- was hardcoded "auto"
  });
Why loopCount === 0 only: On the first pass, the LLM has the customer message and must do something real (search KB, check availability, capture lead). On subsequent passes (loopCount > 0), it already has tool results in context and may legitimately want to just write a response — so "auto" is correct there.
Also: filter tools sent to LLM. Right now you send all 10 tool definitions regardless of agent type. The LLM sees tools it can't use, which confuses it. Filter to only the agent's allowed tools:
typescripttools: TOOL_DEFINITIONS.filter(t => allowedTools.includes(t.function.name)),

Fix 4 — Add Post-Loop Fallbacks for KB and Lead Capture
You already have the booking pattern detector. Add similar fallbacks for the other two agents.
For customer_support — KB fallback:
typescript// After booking pattern detector block, add:
if (currentAgentType === 'customer_support' && !kbToolUsed && !is_test) {
  try {
    const kbResult = await executeTool({
      tool_name: 'match_kb_chunks',
      args: { query: sanitizedMessage },
      workspace_id,
      session_id: session.id,
      supabase
    });

    if (kbResult?.kb_chunks?.length > 0) {
      // Re-prompt with KB results
      const rePromptMessages = [
        ...messages,
        { role: "tool", content: JSON.stringify(kbResult) },
        { role: "user", content: "Based on the knowledge base results above, answer the customer's question." }
      ];
      const rePromptResponse = await callAgentModel({
        messages: rePromptMessages,
        tool_choice: "none"   // text-only, no more tool calls
      });
      const rePromptText = rePromptResponse.choices?.[0]?.message?.content;
      if (rePromptText) {
        finalResponse = sanitizeLlmOutput(rePromptText);
        kbToolUsed = true;
      }
    }
  } catch (_) {
    console.warn('[ORCHESTRATOR] KB fallback failed (non-fatal)');
  }
}
For sales — lead capture fallback:
typescript// After KB fallback block, add:
if (currentAgentType === 'sales' && !is_test) {
  const leadPattern = /\b(name|email|phone|interested|want|need|buy|price|quote)\b/i;
  if (leadPattern.test(sanitizedMessage)) {
    try {
      const extractResult = await callAgentModel({
        messages: [
          { role: "system", content: "Extract lead details from this message. Return ONLY JSON: { name, phone, email, interest }. Use null for missing fields." },
          { role: "user", content: sanitizedMessage }
        ],
        tool_choice: "none"
      });
      const extracted = JSON.parse(extractResult.choices?.[0]?.message?.content?.match(/\{[\s\S]*\}/)?.[0] || '{}');
      if (extracted.name || extracted.phone || extracted.email) {
        await executeTool({
          tool_name: 'capture_lead',
          args: extracted,
          workspace_id,
          session_id: session.id,
          supabase
        });
      }
    } catch (_) {
      console.warn('[ORCHESTRATOR] Lead capture fallback failed (non-fatal)');
    }
  }
}

Summary of All 4 Fixes
FixProblem SolvedFix 1: Route to existing agentRouter returns ghost agent type → undefined currentAgent → broken promptFix 2: Strip request_handoff for single-agentLLM tries to hand off to agents that don't exist → silent failureFix 3: tool_choice: "required" on first pass + filter toolsLLM skips tools and answers from training data → nothing in DBFix 4: Post-loop fallbacks for KB and lead captureTool call missed → customer gets answer but no DB record
Apply Fix 3 first — it's the root cause of the "responds but nothing in DB" problem for all three agents. The others handle the 1/2 agent edge cases.
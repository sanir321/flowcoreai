# Agent Persona Traits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the Agent Persona schema and Edge Function backend to support structured personality traits (tone, formality, brevity, proactivity, and custom directives).

**Architecture:** 
1. Update Zod schema for agent configuration.
2. Create a utility in the Edge Function to map structured traits to natural language instructions.
3. Enhance the `PipelineContext` to include agent-specific configuration.
4. Inject trait-based instructions into system prompts for all agent types (Support, Sales, Booking).

**Tech Stack:** TypeScript, Zod, Supabase Edge Functions.

---

### Task 1: Update Agent Config Schema

**Files:**
- Modify: `src/lib/schemas/agents.ts`

- [ ] **Step 1: Update `UpdateAgentConfigSchema`**
Update the `config` field to include the structured `traits` object.

```typescript
export const UpdateAgentConfigSchema = z.object({
  agent_id: z.string().uuid(),
  config: z.object({
    name: z.string().optional(),
    traits: z.object({
      tone: z.enum(['professional', 'friendly', 'enthusiastic']),
      formality: z.enum(['formal', 'casual']),
      brevity: z.enum(['concise', 'standard', 'detailed']),
      proactivity: z.enum(['passive', 'standard', 'assertive']),
      custom_directives: z.string().optional()
    }).optional()
  })
})
```

- [ ] **Step 2: Commit changes**
```bash
git add src/lib/schemas/agents.ts
git commit -m "feat: add structured persona traits to agent config schema"
```

### Task 2: Create Persona Instruction Mapper

**Files:**
- Create: `supabase/functions/agent-orchestrator/lib/persona.ts`

- [ ] **Step 1: Implement trait mapping logic**
Create a utility function that converts structured traits into string instructions.

```typescript
export interface AgentTraits {
  tone: 'professional' | 'friendly' | 'enthusiastic';
  formality: 'formal' | 'casual';
  brevity: 'concise' | 'standard' | 'detailed';
  proactivity: 'passive' | 'standard' | 'assertive';
  custom_directives?: string;
}

export function getPersonaInstructions(traits?: AgentTraits): string {
  if (!traits) return "";

  const instructions: string[] = [];

  // Tone
  if (traits.tone === 'professional') {
    instructions.push("Maintain a professional, polite, and helpful tone.");
  } else if (traits.tone === 'friendly') {
    instructions.push("Use a warm, welcoming tone and emojis where appropriate.");
  } else if (traits.tone === 'enthusiastic') {
    instructions.push("Be highly energetic and enthusiastic in your responses.");
  }

  // Formality
  if (traits.formality === 'formal') {
    instructions.push("Use formal language and avoid slang.");
  } else if (traits.formality === 'casual') {
    instructions.push("Use casual, everyday language. You can be relaxed but remain helpful.");
  }

  // Brevity
  if (traits.brevity === 'concise') {
    instructions.push("Keep responses short and to the point. Avoid unnecessary fluff.");
  } else if (traits.brevity === 'detailed') {
    instructions.push("Provide detailed and comprehensive explanations.");
  }

  // Proactivity
  if (traits.proactivity === 'passive') {
    instructions.push("Respond only to what the user asks. Don't push for extra information unless necessary.");
  } else if (traits.proactivity === 'assertive') {
    instructions.push("Be assertive and take the lead in the conversation to guide the user towards a resolution or goal.");
  }

  const baseInstructions = instructions.length > 0 
    ? `\n## Personality & Style\n${instructions.join(" ")}` 
    : "";

  const customDirectives = traits.custom_directives 
    ? `\n\n## Custom Directives\n${traits.custom_directives}` 
    : "";

  return `${baseInstructions}${customDirectives}`;
}
```

- [ ] **Step 2: Commit changes**
```bash
git add supabase/functions/agent-orchestrator/lib/persona.ts
git commit -m "feat: add persona instruction mapper utility"
```

### Task 3: Update PipelineContext and Session Loading

**Files:**
- Modify: `supabase/functions/agent-orchestrator/lib/types.ts`
- Modify: `supabase/functions/agent-orchestrator/pipeline/t3-planner.ts`

- [ ] **Step 1: Update `PipelineContext` definition**
Add `agentConfig` to `PipelineContext`.

```typescript
// supabase/functions/agent-orchestrator/lib/types.ts

export interface PipelineContext {
  // ... existing fields
  agentConfig?: any;
}
```

- [ ] **Step 2: Modify `runT3` to fetch agent config**
Fetch the specific agent's config once `agentType` is determined.

```typescript
// supabase/functions/agent-orchestrator/pipeline/t3-planner.ts

// ... inside runT3, after agentType is determined (around line 19)
  const agentType = ctx.agentType || "customer_support";

  // Fetch agent config for persona traits
  const { data: agentData } = await ctx.supabase
    .from("workspace_agents")
    .select("config")
    .eq("workspace_id", ctx.session.workspace_id)
    .eq("agent_type", agentType)
    .is("deleted_at", null)
    .maybeSingle();
  
  ctx.agentConfig = agentData?.config;
```

- [ ] **Step 3: Commit changes**
```bash
git add supabase/functions/agent-orchestrator/lib/types.ts supabase/functions/agent-orchestrator/pipeline/t3-planner.ts
git commit -m "feat: fetch and attach agent config to pipeline context in T3"
```

### Task 4: Integrate Persona Instructions into System Prompts

**Files:**
- Modify: `supabase/functions/agent-orchestrator/agents/support.ts`
- Modify: `supabase/functions/agent-orchestrator/agents/sales.ts`
- Modify: `supabase/functions/agent-orchestrator/agents/booking.ts`

- [ ] **Step 1: Update `buildSupportSystemPrompt`**
Import `getPersonaInstructions` and append the persona instructions to the prompt.

```typescript
import { getPersonaInstructions } from "../lib/persona.ts";
// ...
export function buildSupportSystemPrompt(ctx: PipelineContext): string {
  // ...
  const persona = getPersonaInstructions(ctx.agentConfig?.traits);
  return `... ${persona} ...`.trim();
}
```

- [ ] **Step 2: Update `buildSalesSystemPrompt`**
Similarly for sales.

- [ ] **Step 3: Update `buildBookingSystemPrompt`**
Similarly for booking.

- [ ] **Step 4: Commit changes**
```bash
git add supabase/functions/agent-orchestrator/agents/support.ts supabase/functions/agent-orchestrator/agents/sales.ts supabase/functions/agent-orchestrator/agents/booking.ts
git commit -m "feat: integrate persona traits into agent system prompts"
```

### Task 5: Verification

- [ ] **Step 1: Verify Zod Schema**
Check if `UpdateAgentConfigSchema` matches the requirements exactly.

- [ ] **Step 2: Verify Edge Function Logic**
Ensure that if `traits` are missing, `getPersonaInstructions` returns an empty string and doesn't break the prompt.

- [ ] **Step 3: Final Review**
Run a quick check on the assembled system prompt if possible (via logging in a test run).

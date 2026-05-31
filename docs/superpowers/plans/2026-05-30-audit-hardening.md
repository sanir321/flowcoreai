# System Audit & Agent Persona Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute core visual, performance, and functional improvements based on the system audit.

**Architecture:** 
- Hybrid Frontend update (Landing page & Agent Hub).
- Library-level performance optimization (Gowa caching).
- Structured schema update for Agent Personas (Traits UI).
- Backend orchestration update to support traits-based prompting.

**Tech Stack:** Next.js (TypeScript), Tailwind CSS, Supabase (Postgres & Edge Functions), Zod.

---

### Task 1: Landing Page Hero Section Rescaling

**Files:**
- Modify: `src/app/page.tsx:111-125`

- [ ] **Step 1: Increase Hero max-width and typography scale**

```tsx
// src/app/page.tsx
// Old: <motion.div className="max-w-[820px] mx-auto text-center relative z-10 space-y-8" ...>
// New: <motion.div className="max-w-[1040px] mx-auto text-center relative z-10 space-y-12" ...>

// Heading update:
// Old: <h1 className="font-normal leading-[1.1] tracking-tight text-white" style={{ fontSize: "54.8345px", lineHeight: "63.0597px", ... }}>
// New: <h1 className="font-normal leading-[1.05] tracking-tighter text-white" style={{ fontSize: "84px", lineHeight: "88px", letterSpacing: "-0.03em" }}>

// Paragraph update:
// Old: <p className="max-w-xl mx-auto leading-relaxed font-normal" style={{ fontSize: "15.667px", color: "#595859" }}>
// New: <p className="max-w-2xl mx-auto leading-relaxed font-normal" style={{ fontSize: "18px", color: "#888" }}>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "style: upscale hero section for better desktop impact"
```

---

### Task 2: Integration Performance - Gowa Session Caching

**Files:**
- Modify: `src/lib/gowa.ts`

- [ ] **Step 1: Implement in-memory cache for workspace device IDs**

```typescript
// src/lib/gowa.ts
import { createClient } from "@supabase/supabase-js"

const deviceIdCache = new Map<string, { id: string, expires: number }>()

export async function sendWhatsAppText(workspaceId: string, phone: string, message: string): Promise<void> {
  let deviceId = ""
  const cached = deviceIdCache.get(workspaceId)
  
  if (cached && cached.expires > Date.now()) {
    deviceId = cached.id
  } else {
    // Switch from manual fetch to admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data } = await supabaseAdmin
      .from("gowa_sessions")
      .select("gowa_session_id")
      .eq("workspace_id", workspaceId)
      .maybeSingle()
      
    deviceId = data?.gowa_session_id || ""
    if (deviceId) {
      deviceIdCache.set(workspaceId, { id: deviceId, expires: Date.now() + 5 * 60 * 1000 })
    }
  }

  if (!deviceId) throw new Error(`No WhatsApp session for ${workspaceId}`)
  
  const formattedPhone = await formatPhoneForGoWA(phone);
  await gowaApiCall('/send/message', deviceId, { phone: formattedPhone, message });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/gowa.ts
git commit -m "perf: implement device ID caching in Gowa library"
```

---

### Task 3: Agent Persona - Schema & Edge Function Backend

**Files:**
- Modify: `src/lib/schemas/agents.ts`
- Modify: `supabase/functions/agent-orchestrator/pipeline/t3-planner.ts` (or relevant logic file)

- [ ] **Step 1: Update UpdateAgentConfigSchema to include traits**

```typescript
// src/lib/schemas/agents.ts
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

- [ ] **Step 2: Update Edge Function to assemble prompt from traits**

Find the prompt assembly logic in `t3-planner.ts` and modify it to use `ctx.session.workspace_agents.config.traits`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/schemas/agents.ts
git commit -m "feat: add structured persona traits to agent config schema"
```

---

### Task 4: Agent Persona - UI Implementation

**Files:**
- Modify: `src/app/(dashboard)/agent-hub/[agentId]/page.tsx`

- [ ] **Step 1: Replace System Instructions Textarea with Traits UI**

Implement a grid of ToggleGroups or Selects for Tone, Formality, Brevity, and Proactivity. Add a smaller Textarea for `custom_directives`.

- [ ] **Step 2: Update `onSubmit` to handle the new structured config**

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/agent-hub/[agentId]/page.tsx
git commit -m "feat: implement Personality Traits UI in Agent Hub"
```

---

### Task 5: Cleanup - AI-isms and Test Data

**Files:**
- Create: `scripts/purge-test-data.ts`
- Modify: `supabase/functions/agent-orchestrator/pipeline/t3-planner.ts` (system instructions)

- [ ] **Step 1: Strip "As an AI" from all default prompts**

Search and replace in edge function pipeline files.

- [ ] **Step 2: Create and run purge script**

```typescript
// scripts/purge-test-data.ts
// Deletes is_test=true rows from messages, conversation_sessions.
// Deletes contacts with 'test' or 'lorem' in name/email.
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "chore: purge test data and remove AI-sounding instructions"
```

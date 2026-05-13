# Groq Migration & AI Betterment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate AI agent to Groq for sub-second latency and implement native tool calling for robust operations.

**Architecture:** Unified orchestrator that uses Groq's `openai/gpt-oss-120b` for intent, tool selection, and response in a single optimized flow.

**Tech Stack:** Deno (Edge Functions), Groq API, Supabase, pgvector.

---

### Task 1: Fix Knowledge Base Embedding Dimensions

**Files:**
- Modify: `supabase/functions/agent-orchestrator/lib/hf-embeddings.ts`

- [ ] **Step 1: Update embedding logic to 384 dimensions**
Remove the 1536 padding and return the raw 384d vector from HuggingFace.

```typescript
// Replace padding logic with:
return embedding; // HF all-MiniLM-L6-v2 returns 384d
```

- [ ] **Step 2: Verify with a test script**
Update `scripts/test-embeddings.ts` (if exists) or run a manual check.

- [ ] **Step 3: Commit**
```bash
git add supabase/functions/agent-orchestrator/lib/hf-embeddings.ts
git commit -m "fix: update KB embeddings to 384 dimensions"
```

### Task 2: Implement Groq Client & Fallback Logic

**Files:**
- Modify: `supabase/functions/agent-orchestrator/lib/kilo.ts` (Rename or refactor to `llm.ts`)

- [ ] **Step 1: Refactor to Groq-first logic**
Update `callAgentModel` to use Groq with the new model stack.

```typescript
const MODELS = {
  PRIMARY: "openai/gpt-oss-120b",
  FALLBACK: "llama-3.3-70b-versatile"
};

// Update fetch to Groq endpoint
```

- [ ] **Step 2: Add Groq API Key to environment**
Ensure `GROQ_API_KEY` is handled.

- [ ] **Step 3: Commit**
```bash
git add supabase/functions/agent-orchestrator/lib/kilo.ts
git commit -m "feat: migrate LLM client to Groq"
```

### Task 3: Refactor Orchestrator for Native Tool Calling

**Files:**
- Modify: `supabase/functions/agent-orchestrator/index.ts`
- Modify: `supabase/functions/agent-orchestrator/lib/router.ts`

- [ ] **Step 1: Define Tools Schema**
Create a tools array in OpenAI format for `match_kb_chunks`, `check_availability`, etc.

- [ ] **Step 2: Update Router to use Tool Calling**
Instead of a separate Router call, use the tools parameter in the primary LLM call.

- [ ] **Step 3: Implement Tool Loop**
If the model returns a `tool_calls` request, execute the tool and re-invoke the model with the result.

- [ ] **Step 4: Commit**
```bash
git add supabase/functions/agent-orchestrator/index.ts supabase/functions/agent-orchestrator/lib/router.ts
git commit -m "feat: implement unified native tool calling"
```

### Task 4: End-to-End Verification

- [ ] **Step 1: Run local test suite**
Run `scripts/diagnostic-test.ts` to ensure the orchestrator still functions.

- [ ] **Step 2: Deploy to Supabase**
```bash
supabase functions deploy agent-orchestrator
```

- [ ] **Step 3: Live WhatsApp Test**
Send a message and verify <1s response time.

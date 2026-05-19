# Audit Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a centralized audit logging system to track administrative actions across the platform.

**Architecture:** A new `audit_logs` table will store events. A centralized `logAudit` utility in `src/lib/audit.ts` will be used by server actions to record changes. RLS will ensure workspace owners can only see their own audit logs.

**Tech Stack:** Supabase (PostgreSQL), TypeScript, Next.js Server Actions.

---

### Task 1: Database Schema

**Files:**
- Create: `supabase/migrations/20260518100000_add_audit_logs.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Add audit_logs table
create table audit_logs (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  actor_id        uuid references auth.users(id) on delete set null,
  action          text not null, -- e.g., 'update_agent_config', 'delete_contact'
  entity_type     text not null, -- e.g., 'agent', 'contact', 'workspace'
  entity_id       uuid,          -- ID of the affected entity
  payload         jsonb not null default '{}', -- Detailed changes
  created_at      timestamptz not null default now()
);

create index idx_audit_workspace on audit_logs(workspace_id, created_at desc);

alter table audit_logs enable row level security;

create policy "audit_logs_owner_access" on audit_logs
  using (workspace_id in (select id from workspaces where owner_id = auth.uid() and deleted_at is null));
```

- [ ] **Step 2: Commit the migration**

```bash
git add supabase/migrations/20260518100000_add_audit_logs.sql
git commit -m "db: add audit_logs table"
```

---

### Task 2: Logging Utility

**Files:**
- Create: `src/lib/audit.ts`

- [ ] **Step 1: Implement the logAudit utility**

```typescript
import { createClient } from "@/lib/supabase/server"

interface AuditLogInput {
  workspace_id: string
  action: string
  entity_type: string
  entity_id?: string
  payload?: Record<string, any>
}

export async function logAudit({
  workspace_id,
  action,
  entity_type,
  entity_id,
  payload = {}
}: AuditLogInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase.from("audit_logs").insert({
      workspace_id,
      actor_id: user?.id,
      action,
      entity_type,
      entity_id,
      payload
    })
  } catch (err) {
    console.error("[AUDIT_LOG_FAILED]", err)
  }
}
```

- [ ] **Step 2: Commit the utility**

```bash
git add src/lib/audit.ts
git commit -m "feat: add logAudit utility"
```

---

### Task 3: Integrate with Workspace Actions

**Files:**
- Modify: `src/app/actions/workspace.ts`

- [ ] **Step 1: Add logging to updateWorkspace**

```typescript
// Add import
import { logAudit } from "@/lib/audit"

// Inside updateWorkspace after successful update:
await logAudit({
  workspace_id: result.data.id,
  action: 'update_workspace',
  entity_type: 'workspace',
  entity_id: result.data.id,
  payload: result.data
})
```

- [ ] **Step 2: Add logging to updateWelcomeTemplate**

```typescript
// Inside updateWelcomeTemplate after successful update:
await logAudit({
  workspace_id,
  action: 'update_welcome_template',
  entity_type: 'workspace',
  entity_id: workspace_id,
  payload: { template_length: template.length }
})
```

- [ ] **Step 3: Commit changes**

```bash
git add src/app/actions/workspace.ts
git commit -m "audit: log workspace updates"
```

---

### Task 4: Integrate with Agent Actions

**Files:**
- Modify: `src/app/actions/agents.ts`

- [ ] **Step 1: Add logging to updateAgentConfig**

```typescript
// Add import
import { logAudit } from "@/lib/audit"

// Inside updateAgentConfig after successful update:
// Note: You'll need to fetch workspace_id or ensure it's available
const { data: agent } = await supabase.from("workspace_agents").select("workspace_id").eq("id", agent_id).single()
if (agent) {
  await logAudit({
    workspace_id: agent.workspace_id,
    action: 'update_agent_config',
    entity_type: 'agent',
    entity_id: agent_id,
    payload: config
  })
}
```

- [ ] **Step 2: Add logging to deleteAgent**

```typescript
// Inside deleteAgent after successful update:
const { data: agent } = await supabase.from("workspace_agents").select("workspace_id").eq("id", agent_id).single()
if (agent) {
  await logAudit({
    workspace_id: agent.workspace_id,
    action: 'delete_agent',
    entity_type: 'agent',
    entity_id: agent_id
  })
}
```

- [ ] **Step 3: Commit changes**

```bash
git add src/app/actions/agents.ts
git commit -m "audit: log agent updates"
```

---

### Task 5: Integrate with Knowledge Base Actions

**Files:**
- Modify: `src/app/actions/knowledge.ts`

- [ ] **Step 1: Add logging to addUrlSource**

```typescript
// Inside addUrlSource after successful insert:
await logAudit({
  workspace_id,
  action: 'add_kb_source',
  entity_type: 'kb_source',
  entity_id: data.id,
  payload: { url, source_type }
})
```

- [ ] **Step 2: Add logging to deleteSource**

```typescript
// Inside deleteSource after successful delete:
// Need to fetch workspace_id before delete or from the deleted record if possible
await logAudit({
  workspace_id: user.app_metadata.workspace_id, // Fallback to metadata
  action: 'delete_kb_source',
  entity_type: 'kb_source',
  entity_id: res.data
})
```

- [ ] **Step 3: Commit changes**

```bash
git add src/app/actions/knowledge.ts
git commit -m "audit: log knowledge base changes"
```

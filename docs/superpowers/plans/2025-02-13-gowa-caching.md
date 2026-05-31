# Gowa Session Caching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement in-memory caching for Gowa session IDs with a 5-minute TTL and migrate to Supabase admin client for database lookups in `src/lib/gowa.ts`.

**Architecture:** Use a `Map` to store `workspaceId` to `{ id, expires }` mappings. Use `createAdminClient` from `@/lib/supabase/admin` for secure database access.

**Tech Stack:** TypeScript, Supabase Admin Client, Node.js Map.

---

### Task 1: Setup Caching and Imports

**Files:**
- Modify: `src/lib/gowa.ts`

- [ ] **Step 1: Add imports and cache initialization**

```typescript
import { createAdminClient } from "@/lib/supabase/admin";

const deviceIdCache = new Map<string, { id: string, expires: number }>();
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/gowa.ts
git commit -m "feat: init gowa device id cache and admin client import"
```

### Task 2: Implement Cached Session Lookup

**Files:**
- Modify: `src/lib/gowa.ts`

- [ ] **Step 1: Update `sendWhatsAppText` to use cache and admin client**

```typescript
export async function sendWhatsAppText(workspaceId: string, phone: string, message: string): Promise<void> {
  let deviceId = "";
  const cached = deviceIdCache.get(workspaceId);
  
  if (cached && cached.expires > Date.now()) {
    deviceId = cached.id;
  } else {
    const supabaseAdmin = createAdminClient();
    
    const { data, error } = await supabaseAdmin
      .from("gowa_sessions")
      .select("gowa_session_id")
      .eq("workspace_id", workspaceId)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching gowa session:", error);
    }

    deviceId = data?.gowa_session_id || "";
    if (deviceId) {
      deviceIdCache.set(workspaceId, { id: deviceId, expires: Date.now() + 5 * 60 * 1000 });
    }
  }

  if (!deviceId) {
    throw new Error(`No WhatsApp session found for workspace ${workspaceId}`);
  }

  const formattedPhone = await formatPhoneForGoWA(phone);
  await gowaApiCall('/send/message', deviceId, { 
    phone: formattedPhone, 
    message 
  });
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc src/lib/gowa.ts --noEmit --esModuleInterop --skipLibCheck`
Expected: Success

- [ ] **Step 3: Commit**

```bash
git add src/lib/gowa.ts
git commit -m "perf: implement device ID caching in Gowa library"
```

# Visual Polish & Compliance Finalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the dashboard's "Neural" aesthetic with glass effects and spring animations, and verify/finalize the WhatsApp compliance layer.

**Architecture:**
- **Visuals:** Refine `globals.css` utility classes. Apply `.glass-neural` to structural layout components. Use Framer Motion for snappy spring transitions.
- **Compliance:** Verify the 24-hour response window and artificial typing delays in the `agent-orchestrator` Edge Function. Ensure inbound hooks correctly update session metadata.

**Tech Stack:** Next.js, Tailwind CSS, Framer Motion, Supabase Edge Functions.

---

### Task 1: Refine Glass-Neural & Layout

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/nav/sidebar.tsx`
- Modify: `src/components/nav/navigation-rail.tsx`
- Modify: `src/components/ui/dialog.tsx`

- [x] **Step 1: Update `.glass-neural` for better contrast**

Update `src/app/globals.css`:
```css
.glass-neural {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(12px) saturate(140%);
  -webkit-backdrop-filter: blur(12px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.02);
}

.dark .glass-neural {
  background: rgba(5, 5, 5, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.03);
}
```

- [x] **Step 2: Apply to Sidebar and Navigation Rail**

In `src/components/nav/sidebar.tsx` and `src/components/nav/navigation-rail.tsx`, ensure `glass-neural` is in the container `className` and `bg-white/40` is replaced with `bg-transparent` (since glass-neural handles the background).

- [x] **Step 3: Apply to Dialog Content**

In `src/components/ui/dialog.tsx`, find `DialogContent` and add `glass-neural` to the container.

---

### Task 2: Snappy Spring Animations

**Files:**
- Modify: `src/components/nav/sidebar.tsx` (if using Framer Motion)
- Modify: `src/app/layout.tsx` (for page transitions)

- [x] **Step 1: Define snappy spring transition**

```typescript
const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 1
};
```

- [x] **Step 2: Apply to Sidebar hover/expand states**

If the Sidebar has an expanded/collapsed state, use the `springTransition`.

---

### Task 3: Compliance Verification & Testing

**Files:**
- Test: `supabase/functions/agent-orchestrator/lib/compliance.ts`
- Modify: `supabase/functions/gowa-webhook/index.ts` (Verify inbound logic)

- [ ] **Step 1: Verify `gowa-webhook` updates `last_customer_message_at`**

Ensure the webhook that receives WhatsApp messages updates the `conversation_sessions.last_customer_message_at` column. This is critical for the 24h window check.

- [ ] **Step 2: Create a diagnostic script to test the 24h window**

Write a script that:
1. Inserts a dummy session with `last_customer_message_at` set to 25 hours ago.
2. Invokes the `agent-orchestrator`.
3. Asserts it returns a 403 / "window expired" error.

---

### Task 4: Finalize Task Tracking

- [ ] **Step 1: Update `tasks.json` to reflect reality**

Mark all subtasks as `done` once verified.

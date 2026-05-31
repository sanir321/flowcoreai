# Design Spec: System Audit & Agent Persona Hardening
**Date:** 2026-05-30
**Topic:** Audit & Persona
**Status:** Draft

---

## 1. Overview
This project addresses core "polishing" and performance issues identified during the system audit. It focuses on the landing page's visual impact, the integration's response speed, and the sophistication of the agent's personality management.

## 2. Agent Persona: Personality Traits UI

### 2.1 Data Structure
We will move from a flat `config.persona` string to a structured `config.traits` object in the `workspace_agents` table.

```typescript
interface AgentTraits {
  tone: 'professional' | 'friendly' | 'enthusiastic';
  formality: 'formal' | 'casual';
  brevity: 'concise' | 'standard' | 'detailed';
  proactivity: 'passive' | 'standard' | 'assertive';
  custom_directives?: string; // For the user to add specific rules
}
```

### 2.2 UI Implementation
- **Location:** `src/app/(dashboard)/agent-hub/[agentId]/page.tsx`
- **Components:** Replace the current Textarea with a "Traits Canvas" using:
  - Button Groups or Sliders for the 4 core traits.
  - A smaller Textarea for "Special Instructions" (Advanced).
- **Prompt Assembly:** The `agent-orchestrator` (Edge Function) will now assemble the prompt:
  1. Load Base Prompt (by `agent_type`).
  2. Inject Trait-based modifiers (e.g., if tone is 'friendly', inject "Use a warm, welcoming tone and emojis where appropriate").
  3. Append `custom_directives`.

## 3. Landing Page: Hero Rescaling

### 3.1 Visual Adjustments
- **Target File:** `src/app/page.tsx`
- **Changes:**
  - Increase `max-w-[820px]` to `max-w-[1040px]`.
  - Heading font size: Increase from `text-5xl md:text-6xl` to `text-6xl md:text-8xl`.
  - Subtitle: Increase max-width and font size to maintain visual balance.
  - Ensure Framer Motion `scrollYProgress` animations (opacity/scale) are recalibrated for the larger viewport footprint.

## 4. Integration Performance (Gowa & Google)

### 4.1 Speed Fixes
- **Gowa Session Lookup:** In `src/lib/gowa.ts`, the `sendWhatsAppText` function currently performs a manual `fetch` to the Supabase REST API to find the `deviceId`. This is slow.
- **Optimization:** 
  - Switch to using the `supabase` client (server-side) which is already initialized and likely reused.
  - Implement a 5-minute cache for `workspace_id -> device_id` mapping to avoid DB hits on every message in a high-traffic session.
- **Middleware:** Audit `middleware.ts` for any synchronous `supabase.auth.getUser()` calls that can be optimized or combined with existing logic.

## 5. Clean & Audit Pass

### 5.1 Removal of "AI-isms"
- Audit all default prompt templates in `supabase/functions/agent-orchestrator` and hardcoded strings in the UI.
- Remove instructions like "As an AI..." or "I am a large language model...".

### 5.2 Test Data Purge
- Create a one-time script/migration to:
  - Delete all rows where `is_test = true` in `conversation_sessions` and `messages`.
  - Scan `contacts` and `knowledge_sources` for common placeholder strings ("test", "lorem", "demo@example.com") and remove them.

---

## 6. Success Criteria
- Hero section feels "premium" and fills the desktop viewport appropriately.
- Agent Hub "Persona" tab uses a structured UI instead of a raw text box.
- WhatsApp message dispatch latency (from action to API call) is reduced by >200ms by removing redundant REST calls.
- No "AI language model" references remain in the agent's output.

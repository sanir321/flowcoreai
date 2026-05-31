# Personality Traits UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "System Instructions" textarea with a structured Personality Traits UI in the Agent Hub's "Persona" tab.

**Architecture:** Use `react-hook-form` to manage structured trait state (`config.traits`). Implement a grid layout with `Select` components for predefined traits and a `Textarea` for custom directives.

**Tech Stack:** React, Next.js, Radix UI (Select), Tailwind CSS, Zod, React Hook Form.

---

### Task 1: Update Imports and Component Structure

**Files:**
- Modify: `src/app/(dashboard)/agent-hub/[agentId]/page.tsx`

- [ ] **Step 1: Add necessary imports for Select components**

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
```

- [ ] **Step 2: Define trait options constants**

```tsx
const TRAIT_OPTIONS = {
  tone: ['professional', 'friendly', 'enthusiastic'],
  formality: ['formal', 'casual'],
  brevity: ['concise', 'standard', 'detailed'],
  proactivity: ['passive', 'standard', 'assertive'],
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/agent-hub/[agentId]/page.tsx
git commit -m "chore: add imports and constants for traits UI"
```

---

### Task 2: Implement Personality Traits UI Grid

**Files:**
- Modify: `src/app/(dashboard)/agent-hub/[agentId]/page.tsx`

- [ ] **Step 1: Locate the "Persona" tab content and replace the "System Instructions" Textarea with the new Traits UI**

```tsx
// Replace lines 341-350 (approx) with:
<div className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {(Object.entries(TRAIT_OPTIONS) as [keyof typeof TRAIT_OPTIONS, string[]][]).map(([key, options]) => (
      <div key={key} className="space-y-1.5">
        <Label className="text-[10px] font-bold text-gray-900 ml-0.5 capitalize">{key}</Label>
        <Select 
          value={form.watch(`config.traits.${key}` as any)} 
          onValueChange={(val) => form.setValue(`config.traits.${key}` as any, val)}
        >
          <SelectTrigger className="h-11 rounded-xl bg-gray-50/30 border-gray-200 focus:bg-white focus:border-[#c65f39] focus:ring-1 focus:ring-[#c65f39]/10 transition-all text-sm font-medium capitalize">
            <SelectValue placeholder={`Select ${key}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option} className="capitalize">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    ))}
  </div>

  <div className="space-y-1.5">
    <Label className="text-[10px] font-bold text-gray-900 ml-0.5">Custom Directives</Label>
    <Textarea 
      {...form.register("config.traits.custom_directives")}
      placeholder="Special instructions for the agent's behavior..."
      className="min-h-[120px] rounded-xl bg-gray-50/30 border-gray-200 focus:bg-white focus:border-[#c65f39] focus:ring-1 focus:ring-[#c65f39]/10 transition-all text-sm p-5 resize-none font-medium leading-relaxed"
    />
  </div>
</div>
```

- [ ] **Step 2: Verify visual layout and form connection**

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/agent-hub/[agentId]/page.tsx
git commit -m "feat: implement structured personality traits UI grid"
```

---

### Task 3: Handle Form Initialization and Submission

**Files:**
- Modify: `src/app/(dashboard)/agent-hub/[agentId]/page.tsx`

- [ ] **Step 1: Ensure default values for traits are set if missing in `fetchData`**

```tsx
// In fetchData, before form.reset:
const config = data.config || {}
if (!config.traits) {
  config.traits = {
    tone: 'professional',
    formality: 'formal',
    brevity: 'standard',
    proactivity: 'standard',
    custom_directives: config.persona || '' // Migrate existing persona text if possible
  }
}

form.reset({
  agent_id: agentId as string,
  config: config
})
```

- [ ] **Step 2: Verify `onSubmit` still works correctly with the nested `config.traits` object**

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/agent-hub/[agentId]/page.tsx
git commit -m "feat: handle traits initialization and migration"
```

---

### Task 4: Final Verification and Cleanup

- [ ] **Step 1: Test saving different trait combinations**
- [ ] **Step 2: Verify that "Save Changes" correctly updates the backend**
- [ ] **Step 3: Final UI polish (spacing, labels)**
- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/agent-hub/[agentId]/page.tsx
git commit -m "feat: complete Personality Traits UI implementation"
```

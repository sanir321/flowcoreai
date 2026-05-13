# Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply `.glass-neural` effects to the Sidebar, Navigation Rail, and Overlays (Command Palette/Dialogs) and fine-tune spring animations for a snappier feel.

**Architecture:** Utilize the existing `.glass-neural` utility class defined in `globals.css`, applying it to structural components via Tailwind. Adjust Framer Motion `transition` objects for snappier spring dynamics.

**Tech Stack:** React, Tailwind CSS, Framer Motion, Shadcn UI.

---

### Task 1: Refine Glass-Neural Utility

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update `.glass-neural` for subtle blur and better contrast**

```css
@layer utilities {
  .glass-neural {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(8px) saturate(160%);
    -webkit-backdrop-filter: blur(8px) saturate(160%);
    border: 1px solid rgba(0, 0, 0, 0.05);
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.04);
  }

  .dark .glass-neural {
    background: rgba(10, 10, 10, 0.7);
    backdrop-filter: blur(12px) saturate(180%);
    -webkit-backdrop-filter: blur(12px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
  }
}
```

- [ ] **Step 2: Commit changes**

```bash
git add src/app/globals.css
git commit -m "style: refine glass-neural utility with subtle blur"
```

---

### Task 2: Apply Glass Effect to Navigation (Option A)

**Files:**
- Modify: `src/components/nav/sidebar.tsx`
- Modify: `src/components/nav/navigation-rail.tsx`

- [ ] **Step 1: Apply glass-neural to Sidebar container**

In `src/components/nav/sidebar.tsx`, add `glass-neural` to the container and adjust borders.

```tsx
    <motion.div 
      initial={false}
      animate={{ width: isCollapsed ? 0 : 240, opacity: isCollapsed ? 0 : 1 }}
      className={cn(
        "glass-neural border-r border-gray-100/50 flex flex-col h-full overflow-hidden font-sans shrink-0 relative z-50",
        "bg-white/0" // Overriding the solid bg-white
      )}
    >
```

- [ ] **Step 2: Apply glass-neural to Navigation Rail container**

Modify `src/components/nav/navigation-rail.tsx` similarly (apply `glass-neural` and ensure transparency).

- [ ] **Step 3: Commit changes**

```bash
git add src/components/nav/sidebar.tsx src/components/nav/navigation-rail.tsx
git commit -m "style: apply glass-neural to sidebar and navigation rail"
```

---

### Task 3: Apply Glass Effect to Overlays (Option C)

**Files:**
- Modify: `src/components/nav/command-palette.tsx`
- Modify: `src/components/ui/dialog.tsx`

- [ ] **Step 1: Apply glass-neural to Command Palette**

Add `glass-neural` to the `CommandDialog` or main wrapper in `src/components/nav/command-palette.tsx`.

- [ ] **Step 2: Apply glass-neural to DialogContent**

In `src/components/ui/dialog.tsx`, add `glass-neural` to the `DialogContent` component's base classes.

```tsx
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        "glass-neural", // Add glass effect
        className
      )}
      {...props}
    >
```

- [ ] **Step 3: Commit changes**

```bash
git add src/components/nav/command-palette.tsx src/components/ui/dialog.tsx
git commit -m "style: apply glass-neural to overlays and dialogs"
```

---

### Task 4: Fine-tune Spring Animations

**Files:**
- Modify: `src/components/ui/page-transition.tsx`
- Modify: `src/components/nav/sidebar.tsx`

- [ ] **Step 1: Calibrate PageTransition spring**

In `src/components/ui/page-transition.tsx`, update stiffness and damping.

```tsx
      transition={{ 
        type: "spring",
        stiffness: 300, // Increased from 260
        damping: 25,    // Increased from 20 for more control
        duration: shouldReduceMotion ? 0 : 0.4, 
      }}
```

- [ ] **Step 2: Calibrate Sidebar animation duration/ease**

In `src/components/nav/sidebar.tsx`, ensure the `motion.div` transition is snappy.

- [ ] **Step 3: Commit changes**

```bash
git add src/components/ui/page-transition.tsx src/components/nav/sidebar.tsx
git commit -m "style: calibrate spring animations for snappier feel"
```

---

### Task 5: Final Review & Verification

- [ ] **Step 1: Visual check**

Verify in browser (`http://localhost:3000`):
1. Sidebar has blur effect.
2. Dialogs/Modals have blur effect.
3. Page transitions feel snappy and controlled.
4. Dark mode compatibility.

# Hero Section Upscale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upscale the hero section in `src/app/page.tsx` for better desktop impact by increasing container width, spacing, and typography sizes.

**Architecture:** Surgical replacement of specific Tailwind classes and inline styles within the `LandingPage` component in `src/app/page.tsx`.

**Tech Stack:** Next.js (App Router), React, Tailwind CSS, Framer Motion.

---

### Task 1: Upscale Hero Section Elements

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update Hero Container**
  - Locate `motion.div` around line 111.
  - Change `max-w-[820px]` to `max-w-[1040px]`.
  - Change `space-y-8` to `space-y-12`.

- [ ] **Step 2: Update Heading (H1)**
  - Locate `<h1>` around line 120.
  - Update classes: Change `leading-[1.1] tracking-tight` to `leading-[1.05] tracking-tighter`.
  - Update styles: 
    - `fontSize: "54.8345px"` -> `fontSize: "84px"`
    - `lineHeight: "63.0597px"` -> `lineHeight: "88px"`
    - `letterSpacing: "-0.15667px"` -> `letterSpacing: "-0.03em"`

- [ ] **Step 3: Update Description (P)**
  - Locate `<p>` around line 125.
  - Update classes: Change `max-w-xl` to `max-w-2xl`.
  - Update styles:
    - `fontSize: "15.667px"` -> `fontSize: "18px"`
    - `color: "#595859"` -> `color: "#888"`

- [ ] **Step 4: Commit changes**
  - Run: `git add src/app/page.tsx`
  - Run: `git commit -m "style: upscale hero section for better desktop impact"`

- [ ] **Step 5: Verify implementation**
  - Ensure the file syntax is correct and no other sections were accidentally modified.

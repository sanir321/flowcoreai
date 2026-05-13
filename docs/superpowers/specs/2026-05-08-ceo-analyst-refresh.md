# CEO Analyst UI & Interaction Spec

## Goal
Improve the CEO Analyst interface to feel more professional, transparent, and responsive by visualizing the AI's "Deep Thinking" process and refining the visual layout.

## 1. Backend Changes (`src/app/api/insights/ceo-query/route.ts`)
- Refactor response parsing to separate the AI's "Reasoning" from the final "Response".
- **Input:** Request includes `reasoning: "deep"`.
- **Output:** Returns `{ reply: string, thought: string }`.
- Logic: Use regex to split content based on "Reasoning:" and "Response:" markers.

## 2. Frontend UI Changes (`src/app/(dashboard)/ceo/page.tsx`)

### 2.1 Interaction Flow
- **Loading State:** Replace simple text loader with a pulsing "Brain" or "Network" icon and a text label: "Analyzing workspace neural data...".
- **Message Rendering:**
    - Analyst (AI) messages will feature an expandable accordion labeled "Show Reasoning".
    - The `thought` content will be displayed inside this accordion in a subtle, monospace font.
    - The `reply` content will be rendered using Markdown for clear bolding of metrics.
- **Animations:** Use `framer-motion` for `initial={{ opacity: 0, y: 10 }}` and `animate={{ opacity: 1, y: 0 }}` on every message chunk.

### 2.2 Visual Style
- **User Bubbles:** Solid Black (`bg-black`), White text, `rounded-2xl rounded-tr-none`.
- **Assistant Bubbles:** Light Gray (`bg-gray-50`), Gray text, `border border-gray-100`, `rounded-2xl rounded-tl-none`.
- **Spacing:** Unified `rounded-2xl` for the input container.
- **Brand Focus:** The send button and input focus ring should use the primary brand orange (`#c65f39`).

## 3. Tech Stack
- React, Next.js (App Router)
- Lucide React (Icons)
- Framer Motion (Animations)
- Tailwind CSS (Styling)

## 4. Verification
- Verify that clicking "Show Reasoning" correctly expands/collapses the thought block.
- Ensure the API correctly parses responses even if the AI doesn't strictly follow the "Reasoning: ... Response: ..." format (provide fallback).
- Visually confirm the brand orange focus rings and button states.

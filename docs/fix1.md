Refactor the Next.js `KnowledgeHubClient` component (`app/(dashboard)/knowledge/page-f7b90448e2ac0d23.js`) to resolve aggressive layout shifting and container dimension collapse when toggling between sidebar tabs.

### THE PROBLEMS (As seen in image_51ffe6.png and image_51fd45.png)
1. Structural Grid Contraction: Clicking "Sources" collapses the right-hand layout bounds, breaking the universal dashboard alignment grid compared to the "Overview" view.
2. Double Header Scaling: The page section titles ("Overview" vs "Sources") have mismatching paddings, fonts, and baseline vertical alignments.
3. Asymmetric Card Sizing: The empty state card for Sources drops off abruptly instead of spanning gracefully across the main content layout shell.

### CORE REFACTORING INSTRUCTIONS

1. ENFORCE COHESIVE SYSTEM SHELL
Ensure that the main workspace wrapper behaves as a strict structural container that remains completely stationary. Toggle views conditionally *only* within the innermost child component slot to prevent re-triggering parent flex recalculations.
- Base Parent Framework Classes: Use `flex w-full max-w-7xl mx-auto min-h-[calc(100vh-8rem)]` to match the global platform constraints.

2. LOCK HEADER TYPOGRAPHY AND MARGINS
Standardize the page layout header block across all sidebar states. 
- The section title text string must preserve identical text styles (`text-2xl font-bold tracking-tight text-gray-900`).
- Ensure it wraps smoothly inside a flexbox header element (`flex items-center justify-between min-h-[40px]`). 
- When the tab state is set to 'Sources', project the primary action button (`+ Add Source`) to float on the far right of this header row.

3. RECONSTRUCT THE SOURCES VIEW (image_51ffe6.png)
- Expand the white empty-state card wrapper to span `w-full` across the standard main view column bounds.
- Apply clean Vercel-style aesthetics: `bg-white border border-gray-100 rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-sm`.
- Replace the standalone, floating upper-right black button from the original layout with the dedicated, unified brand accent CTA button (`bg-[#c65f39] hover:bg-[#b55533] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm`).

4. FIX SIDEBAR SELECTION CONTRAST (image_51fd45.png)
- Standardize the active tracking capsule state for the selected item in the navigation panel (`bg-[#c65f39]/10 text-[#c65f39]`).
- Ensure the active capsule internal paddings match perfectly across all tabs (`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium`).

Please return the cleaned up, production-ready `KnowledgeHubClient` React code using modern Tailwind CSS utility classes.
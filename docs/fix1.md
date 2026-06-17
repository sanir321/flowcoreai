Refactor the React components and router layout for the "Knowledge Hub" dashboard to eliminate structural layout shifting when switching between navigation tabs. 

### THE PROBLEM
Currently, clicking the "Sources" tab ("image_521ae8.png") alters the root container layout entirely compared to the "Overview" tab ("image_521acb.png"). The sidebar alignment shifts, the structural canvas margins disappear, and the main view container collapses into an asymmetrical layout with broken horizontal alignment. 

### THE GOAL
Implement a strict, persistent App Shell pattern using React and Tailwind CSS. The left sidebar and main content canvas framework must remain absolutely fixed, rigid, and stationary. Only the internal child content area should dynamic-swap when switching views.

### REFACTORING REQUIREMENTS

1. PERSISTENT APPSHELL STRUCTURE
- Create a parent viewport wrapper containing a fixed-width sidebar layout (`w-64` or `w-72` shrink-0) and a flexible main workspace pane (`flex-1 min-h-screen bg-slate-50`).
- Ensure that switching states between 'Overview', 'Business Profile', and 'Sources' only renders different inner child fragments, preventing any root layout recalculations.

2. CONTENT WORKSPACE CONTAINMENT
- Wrap the main dynamic content space in a standardized, responsive outer container wrapper (e.g., `p-10 max-w-6xl mx-auto w-full space-y-6`). 
- Both the "Overview" elements and the "Sources" elements must sit within this identical layout grid to maintain structural alignment.

3. PAGE HEADER STANDARD
- Unify the top typography hierarchy across all tabs. 
- The section title (e.g., "Overview" or "Sources") must use the exact same text tracking, weight, and sizing (`text-2xl font-bold tracking-tight text-slate-900`). 
- If a view has a primary CTA (like the orange `+ Add Source` button), it should float gracefully to the right of this header container using a flex-row `justify-between` layout.

4. SOURCES EMPTY STATE CORRECTION (image_521ae8.png)
- Refactor the empty state container card for "Sources" to span the full width of the standardized main content canvas instead of dropping off abruptly.
- Unify the primary CTA button styles. The center black pill button in the empty state must be replaced with the branded orange primary button style (`bg-orange-600 hover:bg-orange-700 text-white`) to match the header's primary action button.

5. SIDEBAR CLEANUP (image_521acb.png)
- Standardize the padding inside the sidebar's navigation list items. 
- Ensure that active state item highlights (the light orange pill background) wrap seamlessly around the left-aligned text links ("Overview", "Business Profile", "Sources").

Please output the fully refactored, single-file React component utilizing clean Tailwind CSS utility classes.
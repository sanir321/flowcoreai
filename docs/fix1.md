I'm getting this runtime error on the Calendar tab of my Next.js 14 app:

"Cannot destructure property 'store' of '(0, o.P)(...)' as it is undefined."

This means a hook or function call is returning undefined, and code is
immediately destructuring `{ store }` out of it.

Do the following, in order:

1. Search the codebase for the exact pattern causing this:
   grep -rn "{ store }" --include="*.tsx" --include="*.ts" .
   grep -rn "const { store } =" --include="*.tsx" --include="*.ts" .

2. For each match, trace the function/hook being called on the right-hand
   side. Identify whether it is:
   a) useContext(SomeContext) — check if the Provider wrapping it actually
      wraps the Calendar route/layout. List the component tree from root
      layout down to the Calendar page and confirm the Provider is present
      at every level this component renders under.
   b) A Zustand/Jotai/custom store hook — check if it's being called during
      SSR or before client hydration, and whether the store needs a
      "use client" boundary or lazy initialization guard.
   c) A broken import — check if the store module's export still exists and
      isn't resolving to undefined due to a circular import or a recent
      refactor (especially anything touched during the multi-tenant
      hardcoding fixes).

3. Narrow it to the Calendar feature specifically — this isn't failing on
   other tabs, so check what's different about the Calendar route's layout,
   providers, or data-fetching compared to working tabs (Inbox, Tasks, etc).

4. Once you find the root cause, fix it and explain in one sentence what
   was broken and why it only affected Calendar.

5. After fixing, double check this doesn't break multi-tenant isolation —
   confirm the store/context is scoped per-tenant and not leaking a shared
   instance across tenants.

Report back: the exact file/line of the bug, the root cause, and the fix
applied.
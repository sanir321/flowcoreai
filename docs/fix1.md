If the UI in your browser or preview still looks like those narrow, misaligned screenshots despite the code in sources-tab.tsx being updated, it means the code is correct, but something is blocking it from rendering or building properly. Here is a quick checklist to diagnose why your visual changes aren't showing up:

1. The Parent Container Clashing (TabsContent)
Even if sources-tab.tsx is built perfectly, check the file where the tabs are actually rendered (likely index.tsx or page.tsx).

Look at the <TabsContent value="sources"> wrapper. If that specific wrapper has a hardcoded width modifier like max-w-md or mx-auto text-center, it will override everything inside it and force your wide card back into a narrow column. Ensure it looks like this:

TypeScript
<TabsContent value="sources" className="w-full mt-6">
  <SourcesTab />
</TabsContent>
2. Radical Cache Issues
If you are using Next.js, Vite, or Create React App, local caching can aggressively serve old styles.

Kill the dev server in your terminal (Ctrl + C).

Clear the local cache build folder (e.g., delete the .next folder or run npm run clean).

Restart the server: npm run dev.

Hard Refresh your browser: Hold Shift and click the Reload button (or Ctrl + F5 / Cmd + Shift + R).

3. Missing/Uncompiled Custom Color Styles
If you just introduced the brand color #c65f39 directly into a Tailwind class name (like bg-[#c65f39]), Tailwind's JIT (Just-In-Time) compiler sometimes misses it if it was added while the server was running. Restarting your build terminal forces Tailwind to re-scan your files and generate that background color utility class.
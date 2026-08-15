# Flowcore AI — Project Context

## Brand
- **Name:** Flowcore (formerly Flowter)
- **Tagline:** Automated Customer Service & AI Assistants
- **Brand orange:** `#c65f39` (light), `#dd6b00` (secondary), `#f9510b` (inline accent)
- **Fonts:** Inter (body), Outfit (headings)
- **Base radius:** 12px
- **Dark mode:** `#050505` background, `#11100f` card

## Tech Stack
- Next.js 15 (App Router) + React 19
- Tailwind v4 (`@import "tailwindcss"`)
- shadcn/ui v4 (base-nova style, base-ui primitives)
- Framer Motion (animations)
- Supabase (DB + Auth + Edge Functions)
- Vercel deployment (`7flowcore.vercel.app`)

## Layout
- **Landing:** dark hero → features grid → integrations → pricing → FAQ/footer
- **Dashboard:** custom three-pane (sidebar nav, content area, optional right panel)
- **Assistant sidebar:** fixed left nav with AI assistant icons

## Existing shadcn components (28)
avatar, badge, button, card, chat-container, checkbox, code-block, command, dialog,
dropdown-menu, feedback-bar, input, label, markdown, message, page-transition,
prompt-input, scroll-area, scroll-button, select, sheet, skeleton, sonner, switch,
table, tabs, textarea, text-shimmer, thinking-bar, tooltip

## Pages
- `/` → Landing (`home-client.tsx`)
- `/ceo` → CEO Analyst chat
- `/inbox` → Agent inbox (WhatsApp conversations)
- `/agent-hub/test` → Test chat playground
- `/features`, `/pricing`, `/faq`, `/changelog`, `/blog` → Marketing
- `/(dashboard)/settings/*` → Settings (widget, billing, integrations, etc.)
- `/(dashboard)/agent-hub/*` → Agent management

## Key Principles
- Compact sizing (text-[13px], text-[9px], thin borders)
- Subtle shadows, minimal decoration
- Orange accents on neutral backgrounds
- No full redesigns — incremental polish only

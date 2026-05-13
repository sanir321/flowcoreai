# 03 — UI/UX Guidelines
## FlowCore AI — High-Fidelity Dashboard System v4.0 (Conduit Sync)

---

## 1. Design Philosophy

The dashboard adopts a "Hyper-Minimalist Neural" aesthetic, emphasizing speed, depth, and clarity.

1. **Dual-Sidebar Navigation:** Fixed icon rail (left) for global switching, secondary context sidebar for module navigation.
2. **Typography as Interface:** Heavy focus on **Outfit** tracking and bold-italic highlights.
3. **Dynamic Layering:** Use `backdrop-blur-3xl` and `z-index` depth to separate primary actions from background context.
4. **Superhuman UX Patterns:** Hotkey-first (`Cmd+K`), fast transitions, and minimalist list-detail views.

---

## 2. Branding (Conduit Sync)

| Element | Value | Purpose |
|---|---|---|
| Primary | `#c34b22` | Brand accents, primary buttons, active icons |
| Secondary | `#a13615` | Hover states, gradient tails |
| Background | `#050505` | Global page background (True Black) |
| Sidebars | `#0a0a0a` | Navigation backgrounds |
| Surface | `#111111` | Card containers, inputs, modals |
| Typography | **Outfit** | Primary UI and Display font |
| Body Font | Inter | Content and data readability |

---

## 3. Core CSS Classes (Tailwind 4.0)

Maintain these central utility tokens:

- **`.nav-rail`**: `w-[64px] h-screen bg-neutral-950 border-r border-white/5`
- **`.nav-sidebar`**: `w-[240px]–[263px] h-screen bg-neutral-900/50 backdrop-blur-3xl`
- **`.glass-neural`**: `bg-neutral-900/40 backdrop-blur-3xl border border-white/5 shadow-2xl`
- **`.tracking-soehne`**: `letter-spacing: -0.02em` (Standard) | `-0.04em` (Hero/Display)

---

## 4. Component Layout Specifications

- **Border Radius Hierarchy**:
    - Interactive Cards: `12px` (`rounded-xl`).
    - Large Layout Containers: `16px` (`rounded-2xl`).
    - Icons/Buttons: `8px` (`rounded-lg`) or `12px` (`rounded-xl`).
- **Surface Contrast**:
    - Background: `#050505` (True Black).
    - Secondary Surfaces: `#0a0a0a`.
    - Active State Backgrounds: `bg-white/10` or `bg-brand-500/10`.
- **Borders**:
    - Default: `1px solid rgba(255, 255, 255, 0.05)`.
    - Active: `1px solid rgba(195, 75, 34, 0.4)`.

---

## 5. Module Blueprints

### Inbox (Superhuman Sync)
- **Pane A (Rail):** 64px icon rail.
- **Pane B (List):** 320px column, 1px right border, text-only tabs (Todo, Follow-up, Done).
- **Pane C (Thread):** Spacious, centered messages, floating bottom-bar with `glass-neural` styling.

### Agent Hub (Neural Config)
- **Cards (Exact "Neural Grid" Spec):** 
    - **Dimensions**: `293px` x `330px`.
    - **Header**: `128px` height, `#F9FAFB` surface with `8px` dot-matrix grid.
    - **Avatar**: `72px` circle, `absolute` top `92px`, centered.
    - **Palette**: Charcoal text (`#0A0A0A`) on pure white background sections.
- **⌘K Command Bar:** Fixed footer bar titled *"Update my agent to..."* for AI-assisted behavior configuration.
- **Settings:** High-contrast `Persona` textarea + specialized `When/Then` escalation cards.
- **Test Lab:** Integrated side-by-side chat with "Deep Reasoning" toggle.

---

## 6. Components Standards

- **Buttons (h-12):** `rounded-xl`, bold-italic uppercase labels, `scale-95` on click.
- **Inputs:** `bg-neutral-900`, `border-white/5`, `h-12` standard.
- **Modals:** `backdrop-blur-3xl`, centered, `spring` entrance.

---

## 6. Motion & Transitions

- **Page Transitions:** `stagger-fade-slide` (Use `PageTransition` wrapper).
- **Interaction Feedback:** `scale-95` on click, `scale-[1.02]` on hover.
- **Micro-animations:** SVG morphing for Lucide icons where possible.

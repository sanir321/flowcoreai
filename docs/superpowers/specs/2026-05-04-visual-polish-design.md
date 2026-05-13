# Design Spec: Visual Polish (Glass-Neural & Animations)
**Date:** 2026-05-04
**Topic:** UI Polish for Sidebar, Overlays, and Navigation
**Status:** Approved

## 1. Overview
Enhance the dashboard's visual depth by applying `.glass-neural` effects to structural navigation components and floating overlays. This will create a "layered" aesthetic consistent with modern AI-driven interfaces.

## 2. Design Changes

### 2.1 Navigation (Option A)
- **Sidebar:** Apply `.glass-neural` to the main container. Reduce the base border opacity. Ensure content remains readable by adjusting the background alpha.
- **Navigation Rail:** Convert the solid background to `.glass-neural`.

### 2.2 Overlays (Option C)
- **Command Palette:** Apply `.glass-neural` to the modal content with a subtle backdrop blur.
- **Dialogs:** Update the shared `DialogContent` to use the glass effect with a **subtle (slight) backdrop blur** and light border, creating a consistent "elevated" feel without overpowering the content.

### 2.3 Animations
- **Spring Calibration:** Fine-tune `PageTransition` and `Sidebar` spring constants for a "snappier" feel (e.g., increasing stiffness slightly).

## 3. Implementation Units
- **`src/app/globals.css`**: Refine `.glass-neural` definition for better contrast in light/dark modes (adjusting `backdrop-filter: blur(8px)` for subtle effect).
- **`src/components/nav/sidebar.tsx`**: Add `.glass-neural` class.
- **`src/components/nav/navigation-rail.tsx`**: Add `.glass-neural` class.
- **`src/components/nav/command-palette.tsx`**: Add `.glass-neural` class.
- **`src/components/ui/dialog.tsx`**: Add `.glass-neural` class to `DialogContent`.

## 4. Verification
- Verify readability in both Light and Dark modes.
- Ensure backdrop-blur doesn't cause performance issues on lower-end devices.
- Confirm animations feel "springy" but not sluggish.

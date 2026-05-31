# Design: Hero Section Upscale for Desktop Impact

## Overview
Upscale the hero section's typography and container sizing to provide a more impactful "premium" feel on desktop screens.

## Proposed Changes

### 1. Hero Container
- **Path:** `src/app/page.tsx`
- **Target:** Hero outer `motion.div` (around line 111)
- **Modifications:**
    - Increase `max-w-[820px]` to `max-w-[1040px]` to allow for a wider layout.
    - Increase vertical spacing `space-y-8` to `space-y-12` to give elements more room to breathe.

### 2. Primary Heading (H1)
- **Path:** `src/app/page.tsx`
- **Target:** `<h1>` element (around line 120)
- **Modifications:**
    - Increase `fontSize` from `54.8345px` to `84px`.
    - Increase `lineHeight` from `63.0597px` to `88px`.
    - Tighten `letterSpacing` from `-0.15667px` to `-0.03em`.
    - Update classes from `leading-[1.1] tracking-tight` to `leading-[1.05] tracking-tighter`.

### 3. Hero Description (P)
- **Path:** `src/app/page.tsx`
- **Target:** `<p>` element (around line 125)
- **Modifications:**
    - Increase `max-w-xl` to `max-w-2xl`.
    - Increase `fontSize` from `15.667px` to `18px`.
    - Change `color` from `#595859` to `#888` for better readability/contrast.

## Success Criteria
- The Hero section looks significantly larger and more prominent on desktop.
- Typography is well-proportioned and follows the requested specs.
- File compiles without syntax errors.

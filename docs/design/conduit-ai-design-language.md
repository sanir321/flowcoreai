# Design Language: Conduit - AI Agents for Support and Sales

> Extracted from `https://conduit.ai/` on April 25, 2026
> 1887 elements analyzed

This document describes the complete design language of the website. It is structured for AI/LLM consumption — use it to faithfully recreate the visual design in any framework.

## Color Palette

### Primary Colors

| Role | Hex | RGB | HSL | Usage Count |
|------|-----|-----|-----|-------------|
| Primary | `#c65f39` | rgb(198, 95, 57) | hsl(16, 55%, 50%) | 48 |
| Secondary | `#dd6b00` | rgb(221, 107, 0) | hsl(29, 100%, 43%) | 18 |
| Accent | `#ffdede` | rgb(255, 222, 222) | hsl(0, 100%, 94%) | 2 |

### Neutral Colors

| Hex | HSL | Usage Count |
|-----|-----|-------------|
| `#11100f` | hsl(30, 6%, 6%) | 2281 |
| `#ffffff` | hsl(0, 0%, 100%) | 737 |
| `#595859` | hsl(300, 1%, 35%) | 376 |
| `#000000` | hsl(0, 0%, 0%) | 133 |
| `#c0c0c0` | hsl(0, 0%, 75%) | 131 |
| `#4a4a4a` | hsl(0, 0%, 29%) | 76 |
| `#222222` | hsl(0, 0%, 13%) | 51 |
| `#e6e6e6` | hsl(0, 0%, 90%) | 33 |
| `#a1a1aa` | hsl(240, 5%, 65%) | 20 |
| `#d9d9d9` | hsl(0, 0%, 85%) | 13 |
| `#f5f5f5` | hsl(0, 0%, 96%) | 7 |
| `#6b6b6b` | hsl(0, 0%, 42%) | 2 |

### Background Colors

Used on large-area elements: `#050505`, `#ffffff`, `#6b6b6b`, `#f7f7f7`, `#f5f5f5`

### Text Colors

Text color palette: `#000000`, `#11100f`, `#4a4a4a`, `#ffffff`, `#595859`, `#bfbfbf`, `#595959`, `#050505`, `#c65f39`, `#f5f5f5`

### Gradients

```css
background-image: linear-gradient(135deg, rgb(191, 191, 191), rgb(201, 201, 201));
```

```css
background-image: linear-gradient(rgba(255, 255, 255, 0), rgb(255, 255, 255));
```

```css
background-image: linear-gradient(90deg, rgb(255, 255, 255), rgba(255, 255, 255, 0));
```

```css
background-image: linear-gradient(270deg, rgb(255, 255, 255), rgba(255, 255, 255, 0));
```

```css
background-image: linear-gradient(rgb(255, 255, 255), rgba(255, 255, 255, 0));
```

```css
background-image: linear-gradient(0deg, rgb(255, 255, 255), rgba(255, 255, 255, 0));
```

```css
background-image: linear-gradient(90deg, rgb(198, 95, 57), rgba(198, 95, 57, 0));
```

```css
background-image: linear-gradient(0deg, rgb(5, 5, 5), rgba(0, 0, 0, 0));
```

### Full Color Inventory

| Hex | Contexts | Count |
|-----|----------|-------|
| `#11100f` | text, border | 2281 |
| `#ffffff` | background, text, border | 737 |
| `#595859` | text, border | 376 |
| `#000000` | text, border, background | 133 |
| `#c0c0c0` | border, text | 131 |
| `#4a4a4a` | text, border, background | 76 |
| `#222222` | text, border | 51 |
| `#c65f39` | background, border, text | 48 |
| `#e6e6e6` | background, border | 33 |
| `#a1a1aa` | text, border | 20 |
| `#dd6b00` | text, border | 18 |
| `#d9d9d9` | background | 13 |
| `#f5f5f5` | text, background, border | 7 |
| `#ffdede` | background | 2 |
| `#6b6b6b` | background | 2 |
| `#343434` | background | 1 |

## Typography

### Font Families

- **Söhne** — used for all (1824 elements)
- **sans-serif** — used for all (53 elements)
- **Roboto** — used for body (10 elements)

### Type Scale

| Size (px) | Size (rem) | Weight | Line Height | Letter Spacing | Used On |
|-----------|------------|--------|-------------|----------------|---------|
| 70.5016px | 4.4063rem | 400 | 77.5517px | -0.15667px | h1, span |
| 54.8345px | 3.4272rem | 400 | 63.0597px | -0.15667px | p, span, br, h2 |
| 43.0843px | 2.6928rem | 300 | 51.7011px | -0.15667px | h2 |
| 35.2508px | 2.2032rem | 400 | 44.0635px | -0.15667px | h3, p |
| 24px | 1.5rem | 400 | 36px | -0.15667px | div |
| 19.5838px | 1.224rem | 300 | 29.3756px | -0.15667px | p, h3, div |
| 17.6254px | 1.1016rem | 300 | 26.4381px | -0.15667px | p |
| 15.667px | 0.9792rem | 400 | normal | normal | html, head, meta, link |
| 14px | 0.875rem | 700 | 21px | normal | button |
| 13.7086px | 0.8568rem | 400 | 20.563px | -0.15667px | a, div, svg, mask |
| 11.7503px | 0.7344rem | 500 | 17.6254px | 2.35005px | div |
| 10px | 0.625rem | 400 | 15px | -0.15667px | div, span |

### Heading Scale

```css
h1 { font-size: 70.5016px; font-weight: 400; line-height: 77.5517px; }
h2 { font-size: 54.8345px; font-weight: 400; line-height: 63.0597px; }
h2 { font-size: 43.0843px; font-weight: 300; line-height: 51.7011px; }
h3 { font-size: 35.2508px; font-weight: 400; line-height: 44.0635px; }
h3 { font-size: 19.5838px; font-weight: 300; line-height: 29.3756px; }
```

### Body Text

```css
body { font-size: 15.667px; font-weight: 400; line-height: normal; }
```

### Font Weights in Use

`400` (1645x), `300` (145x), `500` (94x), `700` (3x)

## Spacing

| Token | Value | Rem |
|-------|-------|-----|
| spacing-1 | 1px | 0.0625rem |
| spacing-47 | 47px | 2.9375rem |
| spacing-63 | 63px | 3.9375rem |
| spacing-71 | 71px | 4.4375rem |
| spacing-78 | 78px | 4.875rem |
| spacing-94 | 94px | 5.875rem |
| spacing-125 | 125px | 7.8125rem |
| spacing-160 | 160px | 10rem |
| spacing-256 | 256px | 16rem |
| spacing-295 | 295px | 18.4375rem |
| spacing-311 | 311px | 19.4375rem |
| spacing-335 | 335px | 20.9375rem |
| spacing-350 | 350px | 21.875rem |
| spacing-413 | 413px | 25.8125rem |

## Border Radii

| Label | Value | Count |
|-------|-------|-------|
| sm | 3px | 3 |
| md | 8px | 16 |
| lg | 11px | 2 |
| lg | 16px | 3 |
| xl | 20px | 22 |
| xl | 24px | 3 |
| full | 39px | 1 |
| full | 100px | 83 |

## Box Shadows

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0.04) 0px 0px 0px 0px;
```

**md** — blur: 10px
```css
box-shadow: rgba(0, 0, 0, 0.07) -2px 2px 10px 0px;
```

**lg** — blur: 20px
```css
box-shadow: rgba(0, 0, 0, 0.15) -4px 4px 20px 10px;
```

**lg** — blur: 6px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 23px 6px 0px, rgba(0, 0, 0, 0.01) 0px 15px 6px 0px, rgba(0, 0, 0, 0.03) 0px 8px 5px 0px, rgba(0, 0, 0, 0.04) 0px 4px 4px 0px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px;
```

**lg** — blur: 25px
```css
box-shadow: rgba(0, 0, 0, 0.03) 0px 4px 25px 0px;
```

**lg** — blur: 27.238px
```css
box-shadow: rgba(0, 0, 0, 0.3) 0px 4.358px 27.238px 0px;
```

**xl** — blur: 35px
```css
box-shadow: rgba(0, 0, 0, 0.25) 0px 0px 35px 0px;
```

**xl** — blur: 40px
```css
box-shadow: rgba(0, 0, 0, 0.1) -4px 4px 40px 0px;
```

**xl** — blur: 66px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 234px 66px 0px, rgba(0, 0, 0, 0.01) 0px 150px 60px 0px, rgba(0, 0, 0, 0.05) 0px 84px 51px 0px, rgba(0, 0, 0, 0.09) 0px 37px 37px 0px, rgba(0, 0, 0, 0.1) 0px 9px 21px 0px;
```

## CSS Custom Properties

### Colors

```css
--text-primary: #11100f;
--bg-grey: whitesmoke;
--text-secondary: #595959;
--background-color--background-success<deleted|variable-879e2a57-3170-38fd-0ae7-d0e890873ab2>: var(--base-color-system--success-green\<deleted\|variable-8fc09a81-a1c7-3c5b-2cf2-835ad5d96212\>);
--text-color--text-success<deleted|variable-17518f72-fb93-45b5-ad9e-fdd3f2b1833a>: var(--base-color-system--success-green-dark\<deleted\|variable-70ae3530-1c64-4d15-f2af-205678316683\>);
--stroke-secondary: #e4e4e7;
--border-color--border-primary<deleted|variable-d4c54ba4-ee41-67ce-58a5-5216ca039f83>: var(--base-color-neutral--neutral-lightest\<deleted\|variable-eede0174-1898-a99e-0c79-395339ec1911\>);
--text-color--text-secondary<deleted|variable-0a60224d-1a94-b160-ae24-af3c6d95a994>: var(--base-color-neutral--neutral-darker\<deleted\|variable-dda6ad91-259a-0202-f70f-965feb273058\>);
--link-color--link-primary<deleted|variable-ad940cb5-1815-151e-2cbc-4f27dec2b1e5>: var(--base-color-brand--blue\<deleted\|variable-de000a4d-0fee-1f9e-af85-624658122d10\>);
--background-color--background-primary<deleted|variable-9f6b6bb4-0795-c8ab-f302-bbebab6f2554>: var(--base-color-neutral--black\<deleted\|variable-419fddc9-288d-5141-33c5-0873c4ce2f53\>);
--background-color--background-secondary<deleted|variable-2dd539ce-5be2-4493-8245-a883e87dab6d>: var(--base-color-brand--blue\<deleted\|variable-de000a4d-0fee-1f9e-af85-624658122d10\>);
--text-color--text-alternate<deleted|variable-2688eaeb-df93-32fe-efb9-d54fbd7bd424>: var(--base-color-neutral--white\<deleted\|variable-248be024-93cf-6ec4-8eec-0e9f047a83ae\>);
--background-color--background-tertiary<deleted|variable-6632d948-2d2d-2556-731d-05a71c92f234>: var(--base-color-brand--pink\<deleted\|variable-c4661572-8a15-7367-e98c-cc1a0987f6d1\>);
--background-color--background-error<deleted|variable-89aecd3e-2fe8-312c-65a2-e3e7c57d326c>: var(--base-color-system--error-red\<deleted\|variable-ad7a5e8d-bd95-fba4-5110-cbccfa2520c4\>);
--text-color--text-error<deleted|variable-4a51c5d2-820c-a0d9-b49e-0e5d273c964f>: var(--base-color-system--error-red-dark\<deleted\|variable-f7a8b234-8033-a5d6-4d85-0326277c2bf8\>);
--stroke-primary: #f0f0f0;
--background-color--background-warning<deleted|variable-0aa1a7ce-e851-b6b5-66db-1a1a96e8e04b>: var(--base-color-system--warning-yellow\<deleted\|variable-b0ee00e7-091a-a3f5-1619-b09d07f4475a\>);
--text-color--text-warning<deleted|variable-825aa1d8-b093-0b89-37c5-87d980df10f5>: var(--base-color-system--warning-yellow-dark\<deleted\|variable-296491a7-483e-1229-36b5-e13808cc9004\>);
--text-color--text-primary<deleted|variable-7cd2a57e-6f21-74f7-6ce6-096306cecf3e>: var(--base-color-neutral--black\<deleted\|variable-419fddc9-288d-5141-33c5-0873c4ce2f53\>);
--bg-primary<deleted|variable-30b1ebc5-2479-81c6-1112-7c2321035a9a>: #fafbfc;
--base-color-neutral--black<deleted|variable-419fddc9-288d-5141-33c5-0873c4ce2f53>: #000;
--color-text: #11100f;
--base-color-system--success-green<deleted|variable-8fc09a81-a1c7-3c5b-2cf2-835ad5d96212>: #cef5ca;
--base-color-system--success-green-dark<deleted|variable-70ae3530-1c64-4d15-f2af-205678316683>: #114e0b;
--base-color-neutral--neutral-lightest<deleted|variable-eede0174-1898-a99e-0c79-395339ec1911>: #eee;
--base-color-neutral--neutral-darker<deleted|variable-dda6ad91-259a-0202-f70f-965feb273058>: #222;
--base-color-brand--blue<deleted|variable-de000a4d-0fee-1f9e-af85-624658122d10>: #2d62ff;
--base-color-neutral--white<deleted|variable-248be024-93cf-6ec4-8eec-0e9f047a83ae>: #fff;
--base-color-brand--pink<deleted|variable-c4661572-8a15-7367-e98c-cc1a0987f6d1>: #dd23bb;
--base-color-system--error-red<deleted|variable-ad7a5e8d-bd95-fba4-5110-cbccfa2520c4>: #f8e4e4;
--base-color-system--error-red-dark<deleted|variable-f7a8b234-8033-a5d6-4d85-0326277c2bf8>: #3b0b0b;
--base-color-system--warning-yellow<deleted|variable-b0ee00e7-091a-a3f5-1619-b09d07f4475a>: #fcf8d8;
--base-color-system--warning-yellow-dark<deleted|variable-296491a7-483e-1229-36b5-e13808cc9004>: #5e5515;
--swiper-theme-color: #007aff;
```

### Spacing

```css
--swiper-navigation-size: 44px;
```

### Typography

```css
--text-subtle: #8c8c8c;
```

### Other

```css
--orange: #c65f39;
--light-grey: #a1a1aa;
--white: white;
--black: #050505;
--link<deleted|variable-fd274687-7d79-970a-67bc-8ed449852329>: #3b82f6;
--nav-current: white;
--step-1-blur: 20px;
--step-2-blur: 20px;
--step-3-blur: 20px;
--step-1-box: #00000005;
--step-2-box: #00000005;
--step-3-box: #00000005;
--navbar-wrapper-width: 82rem;
--swap-duration: 300ms;
--swap-delay: 120ms;
```

### Dependencies

```css
--background-color--background-success<deleted|variable-879e2a57-3170-38fd-0ae7-d0e890873ab2>: --base-color-system--success-green;
--text-color--text-success<deleted|variable-17518f72-fb93-45b5-ad9e-fdd3f2b1833a>: --base-color-system--success-green-dark;
--border-color--border-primary<deleted|variable-d4c54ba4-ee41-67ce-58a5-5216ca039f83>: --base-color-neutral--neutral-lightest;
--text-color--text-secondary<deleted|variable-0a60224d-1a94-b160-ae24-af3c6d95a994>: --base-color-neutral--neutral-darker;
--link-color--link-primary<deleted|variable-ad940cb5-1815-151e-2cbc-4f27dec2b1e5>: --base-color-brand--blue;
--background-color--background-primary<deleted|variable-9f6b6bb4-0795-c8ab-f302-bbebab6f2554>: --base-color-neutral--black;
--background-color--background-secondary<deleted|variable-2dd539ce-5be2-4493-8245-a883e87dab6d>: --base-color-brand--blue;
--text-color--text-alternate<deleted|variable-2688eaeb-df93-32fe-efb9-d54fbd7bd424>: --base-color-neutral--white;
--background-color--background-tertiary<deleted|variable-6632d948-2d2d-2556-731d-05a71c92f234>: --base-color-brand--pink;
--background-color--background-error<deleted|variable-89aecd3e-2fe8-312c-65a2-e3e7c57d326c>: --base-color-system--error-red;
--text-color--text-error<deleted|variable-4a51c5d2-820c-a0d9-b49e-0e5d273c964f>: --base-color-system--error-red-dark;
--background-color--background-warning<deleted|variable-0aa1a7ce-e851-b6b5-66db-1a1a96e8e04b>: --base-color-system--warning-yellow;
--text-color--text-warning<deleted|variable-825aa1d8-b093-0b89-37c5-87d980df10f5>: --base-color-system--warning-yellow-dark;
--text-color--text-primary<deleted|variable-7cd2a57e-6f21-74f7-6ce6-096306cecf3e>: --base-color-neutral--black;
```

### Semantic

```css
success: [object Object];
warning: [object Object];
error: [object Object];
info: [object Object];
```

## Breakpoints

| Name | Value | Type |
|------|-------|------|
| sm | 479px | max-width |
| sm | 584px | max-width |
| md | 736px | max-width |
| md | 767px | max-width |
| md | 768px | min-width |
| 928px | 928px | max-width |
| lg | 991px | max-width |
| lg | 992px | min-width |
| 1120px | 1120px | max-width |
| 1440px | 1440px | max-width |
| 1920px | 1920px | max-width |

## Transitions & Animations

**Easing functions:** `[object Object]`

**Durations:** `0.4s`, `0.3s`, `0.5s`, `0.12s`

### Common Transitions

```css
transition: all;
transition: transform 0.4s;
transition: 0.4s;
transition: background-color 0.3s;
transition: color 0.3s, border-color 0.3s;
transition: width 0.5s;
transition: opacity 0.3s 0.12s;
transition: background-color 0.3s, box-shadow 0.3s;
transition: color 0.3s;
transition: filter 0.3s;
```

### Keyframe Animations

**spin**
```css
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

**go2264125279**
```css
@keyframes go2264125279 {
  0% { transform: scale(0) rotate(45deg); opacity: 0; }
  100% { transform: scale(1) rotate(45deg); opacity: 1; }
}
```

**go3020080000**
```css
@keyframes go3020080000 {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
```

**go463499852**
```css
@keyframes go463499852 {
  0% { transform: scale(0) rotate(90deg); opacity: 0; }
  100% { transform: scale(1) rotate(90deg); opacity: 1; }
}
```

**go1268368563**
```css
@keyframes go1268368563 {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

**go1310225428**
```css
@keyframes go1310225428 {
  0% { transform: scale(0) rotate(45deg); opacity: 0; }
  100% { transform: scale(1) rotate(45deg); opacity: 1; }
}
```

**go651618207**
```css
@keyframes go651618207 {
  0% { height: 0px; width: 0px; opacity: 0; }
  40% { height: 0px; width: 6px; opacity: 1; }
  100% { opacity: 1; height: 10px; }
}
```

**go901347462**
```css
@keyframes go901347462 {
  0% { transform: scale(0.6); opacity: 0.4; }
  100% { transform: scale(1); opacity: 1; }
}
```

**termly-styles-module-rotate-f68cf1**
```css
@keyframes termly-styles-module-rotate-f68cf1 {
  100% { transform: rotate(360deg); }
}
```

**termly-styles-module-dash-e05a10**
```css
@keyframes termly-styles-module-dash-e05a10 {
  0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
  100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
}
```

## Component Patterns

Detected UI component patterns and their most common styles:

### Buttons (15 instances)

```css
.button {
  background-color: rgb(198, 95, 57);
  color: rgb(255, 255, 255);
  font-size: 13.7086px;
  font-weight: 400;
  padding-top: 0px;
  padding-right: 19.5838px;
  border-radius: 12px;
}
```

### Cards (313 instances)

```css
.card {
  background-color: rgb(79, 79, 79);
  border-radius: 0px;
  box-shadow: rgba(0, 0, 0, 0) 0px 23px 6px 0px, rgba(0, 0, 0, 0.01) 0px 15px 6px 0px, rgba(0, 0, 0, 0.03) 0px 8px 5px 0px, rgba(0, 0, 0, 0.04) 0px 4px 4px 0px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px;
  padding-top: 0px;
  padding-right: 0px;
}
```

### Inputs (3 instances)

```css
.input {
  background-color: rgba(255, 255, 255, 0.02);
  color: rgb(255, 255, 255);
  border-color: rgba(255, 255, 255, 0.2);
  border-radius: 11.7503px;
  font-size: 15.667px;
  padding-top: 3.91675px;
  padding-right: 15.667px;
}
```

### Links (88 instances)

```css
.link {
  color: rgb(89, 89, 89);
  font-size: 13.7086px;
  font-weight: 400;
}
```

### Navigation (70 instances)

```css
.navigatio {
  background-color: rgba(89, 89, 89, 0);
  color: rgb(191, 191, 191);
  padding-top: 0px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  position: static;
  box-shadow: rgba(0, 0, 0, 0.07) -2px 2px 10px 0px;
}
```

### Footer (62 instances)

```css
.foote {
  background-color: rgb(255, 255, 255);
  color: rgb(89, 89, 89);
  padding-top: 0px;
  padding-bottom: 0px;
  font-size: 15.667px;
}
```

### Modals (69 instances)

```css
.modal {
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 0px;
  box-shadow: rgba(0, 0, 0, 0.25) 0px 0px 35px 0px;
  padding-top: 0px;
  padding-right: 0px;
  max-width: 1253.36px;
}
```

### Dropdowns (51 instances)

```css
.dropdown {
  background-color: rgba(89, 89, 89, 0);
  border-radius: 0px;
  border-color: rgb(191, 191, 191);
  padding-top: 0px;
}
```

### Badges (30 instances)

```css
.badge {
  background-color: rgb(79, 79, 79);
  color: rgb(17, 16, 15);
  font-size: 15.667px;
  font-weight: 400;
  padding-top: 3.91675px;
  padding-right: 15.667px;
  border-radius: 100px;
}
```

### Tabs (10 instances)

```css
.tab {
  background-color: rgb(255, 255, 255);
  color: rgb(17, 16, 15);
  font-size: 15.667px;
  font-weight: 400;
  padding-top: 0px;
  padding-right: 0px;
  border-color: rgb(17, 16, 15);
  border-radius: 0px;
}
```

### Tooltips (4 instances)

```css
.tooltip {
  background-color: rgb(198, 95, 57);
  color: rgb(74, 74, 74);
  font-size: 14px;
  border-radius: 3px;
  padding-top: 8.75px;
  padding-right: 28px;
  box-shadow: rgba(0, 0, 0, 0.25) 0px 0px 35px 0px;
}
```

### Switches (2 instances)

```css
.switche {
  border-radius: 0px;
  border-color: rgb(191, 191, 191);
}
```

## Component Clusters

Reusable component instances grouped by DOM structure and style similarity:

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgb(255, 255, 255);
  color: rgb(74, 74, 74);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(74, 74, 74);
  font-size: 10px;
  font-weight: 400;
```

### Button — 3 instances, 2 variants

**Variant 1** (1 instance)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(74, 74, 74);
  padding: 8.75px 28px 8.75px 28px;
  border-radius: 3px;
  border: 1px solid rgb(74, 74, 74);
  font-size: 14px;
  font-weight: 700;
```

**Variant 2** (2 instances)

```css
  background: rgb(198, 95, 57);
  color: rgb(255, 255, 255);
  padding: 8.75px 28px 8.75px 28px;
  border-radius: 3px;
  border: 1px solid rgb(198, 95, 57);
  font-size: 14px;
  font-weight: 700;
```

### Button — 10 instances, 4 variants

**Variant 1** (1 instance)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(17, 16, 15);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(17, 16, 15);
  font-size: 15.667px;
  font-weight: 400;
```

**Variant 2** (1 instance)

```css
  background: rgba(255, 255, 255, 0.1);
  color: rgb(255, 255, 255);
  padding: 11.7503px 19.5838px 11.7503px 19.5838px;
  border-radius: 12px;
  border: 0px none rgb(255, 255, 255);
  font-size: 13.7086px;
  font-weight: 400;
```

**Variant 3** (7 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgba(255, 255, 255, 0.35);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgba(255, 255, 255, 0.35);
  font-size: 13.7086px;
  font-weight: 400;
```

**Variant 4** (1 instance)

```css
  background: rgba(52, 52, 52, 0.8);
  color: rgb(255, 255, 255);
  padding: 11.7503px 19.5838px 11.7503px 19.5838px;
  border-radius: 100px;
  border: 2px solid rgba(238, 238, 238, 0.5);
  font-size: 13.7086px;
  font-weight: 400;
```

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(255, 255, 255);
  font-size: 15.667px;
  font-weight: 400;
```

### Button — 4 instances, 2 variants

**Variant 1** (1 instance)

```css
  background: rgba(230, 230, 230, 0.1);
  color: rgb(255, 255, 255);
  padding: 11.7503px 19.5838px 11.7503px 19.5838px;
  border-radius: 12px;
  border: 0px none rgb(255, 255, 255);
  font-size: 13.7086px;
  font-weight: 400;
```

**Variant 2** (3 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(255, 255, 255);
  font-size: 15.667px;
  font-weight: 400;
```

### Button — 3 instances, 1 variant

**Variant 1** (3 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(255, 255, 255);
  font-size: 13.7086px;
  font-weight: 400;
```

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgba(230, 230, 230, 0.1);
  color: rgb(255, 255, 255);
  padding: 11.7503px 19.5838px 11.7503px 19.5838px;
  border-radius: 12px;
  border: 0px none rgb(255, 255, 255);
  font-size: 13.7086px;
  font-weight: 400;
```

### Button — 14 instances, 1 variant

**Variant 1** (14 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgba(255, 255, 255, 0.35);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgba(255, 255, 255, 0.35);
  font-size: 13.7086px;
  font-weight: 500;
```

### Input — 2 instances, 2 variants

**Variant 1** (1 instance)

```css
  background: rgba(255, 255, 255, 0.02);
  color: rgb(255, 255, 255);
  padding: 3.91675px 15.667px 3.91675px 15.667px;
  border-radius: 11.7503px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 15.667px;
  font-weight: 400;
```

**Variant 2** (1 instance)

```css
  background: rgba(198, 95, 57, 0.1);
  color: rgb(255, 255, 255);
  padding: 3.91675px 15.667px 3.91675px 15.667px;
  border-radius: 11.7503px;
  border: 1px solid rgb(198, 95, 57);
  font-size: 15.667px;
  font-weight: 400;
```

### Button — 4 instances, 2 variants

**Variant 1** (1 instance)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(255, 255, 255);
  font-size: 15.667px;
  font-weight: 400;
```

**Variant 2** (3 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(17, 16, 15);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(17, 16, 15);
  font-size: 15.667px;
  font-weight: 400;
```

### Button — 6 instances, 2 variants

**Variant 1** (5 instances)

```css
  background: rgb(198, 95, 57);
  color: rgb(255, 255, 255);
  padding: 11.7503px 19.5838px 11.7503px 19.5838px;
  border-radius: 12px;
  border: 0px none rgb(255, 255, 255);
  font-size: 13.7086px;
  font-weight: 400;
```

**Variant 2** (1 instance)

```css
  background: rgba(255, 255, 255, 0.1);
  color: rgb(255, 255, 255);
  padding: 11.7503px 19.5838px 11.7503px 19.5838px;
  border-radius: 12px;
  border: 0px none rgb(255, 255, 255);
  font-size: 13.7086px;
  font-weight: 400;
```

### Card — 47 instances, 2 variants

**Variant 1** (3 instances)

```css
  background: rgb(245, 245, 245);
  color: rgb(17, 16, 15);
  padding: 23.5005px 23.5005px 23.5005px 23.5005px;
  border-radius: 12px;
  border: 1px solid rgba(198, 95, 57, 0);
  font-size: 15.667px;
  font-weight: 400;
```

**Variant 2** (44 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(17, 16, 15);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(17, 16, 15);
  font-size: 15.667px;
  font-weight: 400;
```

### Link — 22 instances, 1 variant

**Variant 1** (22 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(17, 16, 15);
  padding: 412.984px 0px 0px 0px;
  border-radius: 19.5838px;
  border: 0px none rgb(17, 16, 15);
  font-size: 15.667px;
  font-weight: 400;
```

### Card — 22 instances, 1 variant

**Variant 1** (22 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(17, 16, 15);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(17, 16, 15);
  font-size: 15.667px;
  font-weight: 400;
```

### Card — 22 instances, 1 variant

**Variant 1** (22 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(17, 16, 15);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(17, 16, 15);
  font-size: 15.667px;
  font-weight: 400;
```

### Card — 22 instances, 1 variant

**Variant 1** (22 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(17, 16, 15);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(17, 16, 15);
  font-size: 15.667px;
  font-weight: 400;
```

### Card — 22 instances, 1 variant

**Variant 1** (22 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(17, 16, 15);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(17, 16, 15);
  font-size: 15.667px;
  font-weight: 400;
```

### Card — 21 instances, 1 variant

**Variant 1** (21 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(17, 16, 15);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(17, 16, 15);
  font-size: 15.667px;
  font-weight: 400;
```

### Card — 44 instances, 1 variant

**Variant 1** (44 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(17, 16, 15);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(17, 16, 15);
  font-size: 15.667px;
  font-weight: 400;
```

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(255, 255, 255);
  font-size: 15.667px;
  font-weight: 400;
```

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(17, 16, 15);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(17, 16, 15);
  font-size: 15.667px;
  font-weight: 400;
```

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgb(198, 95, 57);
  color: rgb(255, 255, 255);
  padding: 11.7503px 19.5838px 11.7503px 19.5838px;
  border-radius: 12px;
  border: 0px none rgb(255, 255, 255);
  font-size: 13.7086px;
  font-weight: 400;
```

## Layout System

**19 grid containers** and **457 flex containers** detected.

### Container Widths

| Max Width | Padding |
|-----------|---------|
| 1284.7px | 0px |
| 501.344px | 0px |
| 100% | 0px |
| 50% | 0px |

### Grid Column Patterns

| Columns | Usage Count |
|---------|-------------|
| 2-column | 14x |
| 3-column | 2x |
| 1-column | 1x |
| 12-column | 1x |
| 4-column | 1x |

### Grid Templates

```css
grid-template-columns: 589.094px 589.094px;
gap: 47.001px 23.5005px;
grid-template-columns: 325.047px 812.641px;
gap: 15.667px 64px;
grid-template-columns: 414.188px 724.844px;
grid-template-columns: 414.188px 724.844px;
grid-template-columns: 414.188px 724.844px;
```

### Flex Patterns

| Direction/Wrap | Count |
|----------------|-------|
| row/nowrap | 240x |
| column/nowrap | 167x |
| row/wrap | 50x |

**Gap values:** `0px 31.334px`, `0px 47.001px`, `11.7503px`, `12px`, `15.667px`, `15.667px 64px`, `16px`, `19.5838px`, `23.5005px`, `27.4173px`, `31.334px`, `39.1675px`, `47.001px`, `47.001px 23.5005px`, `6.26681px`, `7.83351px`, `78.3351px normal`, `normal 15.667px`, `normal 7.83351px`

## Accessibility (WCAG 2.1)

**Overall Score: 0%** — 0 passing, 2 failing color pairs

### Failing Color Pairs

| Foreground | Background | Ratio | Level | Used On |
|------------|------------|-------|-------|---------|
| `#ffffff` | `#c65f39` | 4.12:1 | FAIL | button (2x) |

## Design System Score

**Overall: 67/100 (Grade: D)**

| Category | Score |
|----------|-------|
| Color Discipline | 92/100 |
| Typography Consistency | 80/100 |
| Spacing System | 70/100 |
| Shadow Consistency | 90/100 |
| Border Radius Consistency | 80/100 |
| Accessibility | 0/100 |
| CSS Tokenization | 100/100 |

**Strengths:** Tight, disciplined color palette, Clean elevation system, Good CSS variable tokenization

**Issues:**
- 2 WCAG contrast failures
- 94 !important rules — prefer specificity over overrides
- 84% of CSS is unused — consider purging
- 5818 duplicate CSS declarations

## Gradients

**8 unique gradients** detected.

| Type | Direction | Stops | Classification |
|------|-----------|-------|----------------|
| linear | 135deg | 2 | brand |
| linear | — | 2 | brand |
| linear | 90deg | 2 | brand |
| linear | 270deg | 2 | brand |
| linear | — | 2 | brand |
| linear | 0deg | 2 | brand |
| linear | 90deg | 2 | brand |
| linear | 0deg | 2 | brand |

```css
background: linear-gradient(135deg, rgb(191, 191, 191), rgb(201, 201, 201));
background: linear-gradient(rgba(255, 255, 255, 0), rgb(255, 255, 255));
background: linear-gradient(90deg, rgb(255, 255, 255), rgba(255, 255, 255, 0));
background: linear-gradient(270deg, rgb(255, 255, 255), rgba(255, 255, 255, 0));
background: linear-gradient(rgb(255, 255, 255), rgba(255, 255, 255, 0));
```

## Z-Index Map

**10 unique z-index values** across 4 layers.

| Layer | Range | Elements |
|-------|-------|----------|
| modal | 1000,999999 | div.n.a.v._.f.i.x.e.d, div.n.a.v.b.a.r._.c.o.m.p.o.n.e.n.t. .w.-.n.a.v, div.p.t.-.m.o.d.a.l._.p.o.p.u.p |
| dropdown | 900,999 | div.n.a.v.b.a.r.2.7._.m.e.n.u.-.d.r.o.p.d.o.w.n. .w.-.d.r.o.p.d.o.w.n, div.n.a.v.b.a.r.2.7._.m.e.n.u.-.d.r.o.p.d.o.w.n. .w.-.d.r.o.p.d.o.w.n, div.f.s._.m.o.d.a.l.-.1._.w.r.a.p.p.e.r |
| sticky | 10,10 | div.f.s._.m.o.d.a.l.-.1._.c.l.o.s.e |
| base | -1000,2 | span.s.w.i.p.e.r.-.n.o.t.i.f.i.c.a.t.i.o.n, img.h.o.m.e._.h.e.r.o._.b.g, img.h.o.m.e._.h.e.r.o._.b.g. .m.o.b.i.l.e |

**Issues:**
- [object Object]

## SVG Icons

**33 unique SVG icons** detected. Dominant style: **filled**.

| Size Class | Count |
|------------|-------|
| xs | 5 |
| sm | 2 |
| md | 23 |
| lg | 1 |
| xl | 2 |

**Icon colors:** `currentColor`, `#D9D9D9`, `#c65f39`, `rgb(0, 0, 0)`, `white`, `#C65F39`

## Font Files

| Family | Source | Weights | Styles |
|--------|--------|---------|--------|
| webflow-icons | self-hosted | 400 | normal |
| Söhne | self-hosted | 300, 400, 500 | normal |
| swiper-icons | self-hosted | 400 | normal |

## Image Style Patterns

| Pattern | Count | Key Styles |
|---------|-------|------------|
| thumbnail | 115 | objectFit: fill, borderRadius: 0px, shape: square |
| general | 26 | objectFit: cover, borderRadius: 0px, shape: square |
| hero | 7 | objectFit: cover, borderRadius: 10.9669px, shape: rounded |
| gallery | 2 | objectFit: contain, borderRadius: 0px, shape: square |

**Aspect ratios:** 1:1 (62x), 21:9 (37x), 3:4 (23x), 16:9 (7x), 4:3 (4x), 3:2 (3x), 1.16:1 (2x), 25.03:1 (2x)

## Motion Language

**Feel:** smooth · **Scroll-linked:** yes

### Duration Tokens

| name | value | ms |
|---|---|---|
| `xs` | `120ms` | 120 |
| `md` | `300ms` | 300 |
| `lg` | `500ms` | 500 |

### Easing Families

- **ease-in-out** (1 uses) — `ease`

### Keyframes In Use

| name | kind | properties | uses |
|---|---|---|---|
| `slide` | slide-x | transform | 3 |

## Component Anatomy

### card — 200 instances

**Slots:** media

### button — 50 instances

**Slots:** label
**Variants:** primary
**Sizes:** small

| variant | count | sample label |
|---|---|---|
| default | 47 | Preferences
Decline
Accept |
| primary | 3 | Preferences |

### link — 22 instances


### input — 2 instances


## Brand Voice

**Tone:** friendly · **Pronoun:** you-only · **Headings:** unknown (tight)

### Top CTA Verbs

- **how** (11)
- **book** (8)
- **product** (4)
- **why** (4)
- **see** (3)
- **preferences** (2)
- **fake** (2)
- **sign** (2)

### Button Copy Patterns

- "book demo" (6×)
- "product tour" (4×)
- "see conduit in action" (3×)
- "book demo
fake
sign in
product tour" (2×)
- "fake" (2×)
- "sign in" (2×)
- "why moxxi's ai agent is their most valuable team member

88%

resolution rate

10k

customers served" (2×)
- "building “joy”: a custom ai voice agent

5

message channels unified

76%

conversations automated" (2×)
- "how the flex automated 70% of their guest support

17

tools replaced by conduit

90%

of guest communication automated" (2×)
- "how a hotel unlocked over $500k in asset value with conduit

$500,000

added asset value

$3,400

increased in noi per month" (2×)

## Page Intent

**Type:** `landing` (confidence 0.31)
**Description:** Conduit's conversational AI transforms customer interactions into conversions, revenue, and cost savings without compromising on high-quality service.

Alternates: blog-post (0.35)

## Section Roles

Reading order (top→bottom): nav → nav → nav → nav

| # | Role | Heading | Confidence |
|---|------|---------|------------|
| 0 | nav | — | 0.9 |
| 1 | nav | — | 0.9 |
| 2 | nav | — | 0.9 |
| 3 | nav | — | 0.9 |

## Material Language

**Label:** `flat` (confidence 0)

| Metric | Value |
|--------|-------|
| Avg saturation | 0.126 |
| Shadow profile | soft |
| Avg shadow blur | 0px |
| Max radius | 100px |
| backdrop-filter in use | no |
| Gradients | 8 |

## Imagery Style

**Label:** `photography` (confidence 0.108)
**Counts:** total 150, svg 58, icon 54, screenshot-like 0, photo-like 31
**Dominant aspect:** square-ish
**Radius profile on images:** square

## Component Library

**Detected:** `tailwindcss` (confidence 0.348)

Evidence:
- tailwind-like class density 39%

## Quick Start

To recreate this design in a new project:

1. **Install fonts:** Add `Söhne` from Google Fonts or your font provider
2. **Import CSS variables:** Copy `variables.css` into your project
3. **Tailwind users:** Use the generated `tailwind.config.js` to extend your theme
4. **Design tokens:** Import `design-tokens.json` for tooling integration

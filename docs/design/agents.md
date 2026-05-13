# Agent instructions — design system

This project follows the design system extracted from https://conduit.ai/.
Any coding agent working here must use the tokens below and avoid inventing new ones.
Source: https://conduit.ai/
Extracted by designlang v7.0.0 on 2026-04-25T07:34:53.612Z

## Semantic tokens (use these)
- color.action.primary: #c65f39
- color.surface.default: #050505
- color.text.body: #000000
- radius.control: 3px
- typography.body.fontFamily: Söhne

## Regions
- nav
- nav
- nav
- nav

## How to use
- Prefer `semantic.*` tokens over `primitive.*`.
- Never invent new tokens or hex values; reuse the ones above.
- When a value is missing, pick the closest existing semantic token and flag the gap.
- Reference tokens by their dotted path (e.g. `semantic.color.action.primary`).

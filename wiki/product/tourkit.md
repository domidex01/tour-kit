---
title: TourKit — Product Overview
type: product
sources:
  - ../../marketing-strategy/tourkit-product.md
  - ../../CLAUDE.md
  - ../../README.md
updated: 2026-04-19
---

*What TourKit is, how it's built, and the quick start.*

## What it is

A headless React library for product tours and user onboarding. Hooks-based, TypeScript-strict, WCAG 2.1 AA accessible, built natively for the shadcn/ui + Tailwind stack.

## Core design principles

- **Headless-first** — Core is React hooks and utilities. No DOM rendering. No CSS injection. No style conflicts.
- **Composable** — Small hooks that compose, not a monolithic component with 50 props.
- **shadcn/ui native** — Follows shadcn composition patterns, uses the same Radix UI primitives.
- **Tree-shakeable** — ESM + CJS via tsup; install only what you use.
- **Zero runtime CSS** — No style conflicts, no specificity wars.
- **Progressive enhancement** — Works without JS, respects `prefers-reduced-motion`.

## Tech stack (TourKit development)

| Layer | Choice |
|---|---|
| Language | TypeScript (strict mode) |
| Framework | React 18 / 19 (incl. Server Components context) |
| Styling | Tailwind CSS, CSS custom properties (`--tk-*` tokens) |
| UI primitives | Radix UI (same as shadcn/ui) |
| Positioning | Floating UI |
| Monorepo | Turborepo |
| Bundling | tsup (ESM + CJS + declarations) |
| Docs | Fumadocs (Next.js based) |
| Versioning | Changesets |
| Package manager | pnpm (bun also supported) |
| CI | GitHub Actions |

## Quick start

```tsx
import { Tour, TourStep } from '@tour-kit/react';

function App() {
  return (
    <Tour id="onboarding" autoStart>
      <TourStep
        id="welcome"
        target="#welcome-btn"
        title="Welcome!"
        content="Let's take a quick tour."
        placement="bottom"
      />
      <TourStep
        id="dashboard"
        target="#dashboard"
        title="Dashboard"
        content="Your data overview."
        placement="right"
      />
    </Tour>
  );
}
```

## Technical specs

- Focus traps, `aria-live` announcements, full keyboard nav (arrows, Tab, Escape), `prefers-reduced-motion`
- Generic step types, discriminated unions, full inference — no `any`
- Bundle budgets: core <8KB, react <12KB, hints <5KB (gzipped)
- Lighthouse accessibility target: 100

## Quality gates

- TypeScript strict mode enabled
- Test coverage >80%
- WCAG 2.1 AA compliant

## Related

- [product/packages.md](packages.md) — All 10 packages
- [product/architecture.md](architecture.md) — Monorepo + dependency graph
- [product/licensing.md](licensing.md) — Free vs Pro terms
- [brand/positioning.md](../brand/positioning.md) — Positioning statement and value props
- [competitors/index.md](../competitors/index.md) — Competitive map

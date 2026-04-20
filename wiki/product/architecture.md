---
title: Architecture
type: product
sources:
  - ../../CLAUDE.md
updated: 2026-04-19
---

*How the monorepo is organized, built, and released.*

## Monorepo

- **Manager:** pnpm (bun also supported)
- **Orchestration:** Turborepo (`turbo.json`) — proper dependency ordering
- **Bundler:** tsup per package — outputs ESM + CJS + `.d.ts`
- **TypeScript:** strict, ES2020 target, React JSX transform
- **Versioning:** Changesets — all packages linked for versioning

## Layout

```
tour-kit/
├── apps/
│   └── docs/            # Fumadocs (Next.js) docs site
├── packages/
│   ├── core/
│   ├── react/
│   ├── hints/
│   ├── adoption/
│   ├── analytics/
│   ├── announcements/
│   ├── checklists/
│   ├── media/
│   ├── scheduling/
│   └── surveys/
├── examples/
├── e2e/                 # Playwright
└── marketing-strategy/
```

See [product/packages.md](packages.md) for the package map and dependency graph.

## Commands

```bash
# Install
pnpm install   # or bun install

# Build all packages
pnpm build

# Dev mode (watch)
pnpm dev

# Type-check
pnpm typecheck

# Single package
pnpm build --filter=@tour-kit/core
```

## Release flow

```bash
pnpm changeset          # Document a change
pnpm version-packages   # Bump versions from changesets
pnpm release            # Build + publish to npm
```

## Package-specific CLAUDE.md files

Each package has its own CLAUDE.md with domain-specific guidance:

| Package | Focus |
|---|---|
| `packages/core/CLAUDE.md` | Hook composition, position engine, storage adapters |
| `packages/react/CLAUDE.md` | Router adapters, multi-tour registry, Unified Slot |
| `packages/hints/CLAUDE.md` | Hint lifecycle, dismissal patterns |
| `packages/adoption/CLAUDE.md` | Adoption algorithms, nudge scheduler |
| `packages/analytics/CLAUDE.md` | Plugin interface, event types |
| `packages/announcements/CLAUDE.md` | Display variants, queue system, frequency rules |
| `packages/checklists/CLAUDE.md` | Task dependencies, progress calculation |
| `packages/media/CLAUDE.md` | Embed components, URL parsing |
| `packages/scheduling/CLAUDE.md` | Schedule evaluation, timezone handling |
| `packages/surveys/CLAUDE.md` | Survey types, scoring, fatigue, context awareness |
| `apps/docs/CLAUDE.md` | MDX conventions, Fumadocs patterns |

## Automated quality gates

- `safe-ship-gate` hook typechecks affected package after every Write/Edit on package source
- `/safe-ship` slash command runs a full review: type safety, bundle size budgets, security, accessibility, test quality, verdict (SHIP / HOLD / REVIEW)

## Related

- [product/packages.md](packages.md) — Full package map
- [product/tourkit.md](tourkit.md) — Tech stack summary
- [product/licensing.md](licensing.md) — What's MIT vs Pro

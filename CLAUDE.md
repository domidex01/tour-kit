# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tour Kit is a headless onboarding and product tour library for React. It's designed to work well with shadcn/ui and similar component libraries.

## Commands

Both `pnpm` and `bun` are supported. Use whichever you prefer.

```bash
# Install dependencies
pnpm install   # or: bun install

# Build all packages
pnpm build     # or: bun run build

# Run development mode (watch for changes)
pnpm dev       # or: bun run dev

# Type checking
pnpm typecheck # or: bun run typecheck

# Run single package commands (via turbo)
pnpm build --filter=@tour-kit/core   # or: bun run build --filter=@tour-kit/core
```

## Releasing

Uses Changesets for version management. All three packages are linked for versioning.

```bash
# Create a changeset (for documenting changes)
pnpm changeset

# Version packages based on changesets
pnpm version-packages

# Build and publish to npm
pnpm release
```

## Architecture

This is a pnpm monorepo using Turborepo for build orchestration.

### Packages

**Core Packages:**
- **@tour-kit/core** (`packages/core/`) - Framework-agnostic core logic, types, and utilities
- **@tour-kit/react** (`packages/react/`) - React components and hooks, depends on core
- **@tour-kit/hints** (`packages/hints/`) - Hint/beacon components, depends on core

**Extended Packages:**
- **@tour-kit/adoption** (`packages/adoption/`) - Feature adoption tracking and nudge system
- **@tour-kit/analytics** (`packages/analytics/`) - Plugin-based analytics integration
- **@tour-kit/announcements** (`packages/announcements/`) - Product announcements (modal, toast, banner, slideout, spotlight)
- **@tour-kit/checklists** (`packages/checklists/`) - Onboarding checklists with task dependencies
- **@tour-kit/media** (`packages/media/`) - Media embedding (YouTube, Vimeo, Loom, Wistia, GIF, Lottie)
- **@tour-kit/scheduling** (`packages/scheduling/`) - Time-based scheduling with timezone support
- **@tour-kit/surveys** (`packages/surveys/`) - In-app microsurveys (NPS, CSAT, CES) with fatigue prevention

### Build System

- **Turborepo** - Orchestrates builds with proper dependency ordering (`turbo.json`)
- **tsup** - Bundles each package, outputs ESM + CJS with TypeScript declarations
- **TypeScript** - Strict mode, ES2020 target, React JSX transform

### Package Dependencies

```
@tour-kit/react ─┐
                 ├──► @tour-kit/core
@tour-kit/hints ─┘
```

Both `react` and `hints` packages depend on `core`. Turbo handles build order automatically.

## Coding Rules

**You MUST follow the coding rules defined in `tour-kit/rules/`**. These rules ensure code quality, consistency, and maintainability.

### Rule Files

| File | Description |
|------|-------------|
| `typescript.md` | TypeScript strict mode, type patterns, generics |
| `react.md` | React component patterns, JSX conventions |
| `hooks.md` | Custom hook design and implementation |
| `components.md` | Component architecture and composition |
| `accessibility.md` | WCAG 2.1 AA compliance requirements |
| `testing.md` | Testing standards and coverage |
| `architecture.md` | Package structure and dependencies |
| `performance.md` | Bundle size budgets and optimization |

### Core Principles

1. **Headless First** - Logic in `@tour-kit/core`, components are thin wrappers
2. **Composition Over Configuration** - Small focused components that compose
3. **Type Safety** - Full TypeScript coverage with strict mode
4. **Accessibility First** - ARIA, focus management, keyboard navigation built-in
5. **Progressive Enhancement** - Works without JS, respects `prefers-reduced-motion`

### Quality Gates

- TypeScript strict mode enabled
- Test coverage > 80%
- Bundle sizes: core < 8KB, react < 12KB, hints < 5KB (gzipped)
- Lighthouse Accessibility: 100
- WCAG 2.1 AA compliant

## Execution Rules

- **Plan before acting:** For any task touching 3+ files or requiring debugging, state your plan in 2-3 bullet points BEFORE writing code. Wait for approval.
- **Structured debugging:** State your hypothesis before each fix attempt. Max 3 attempts before stepping back and asking for more context. Never shotgun-fix.
- **No rabbit holes:** Never spend more than 2 consecutive tool calls exploring/reading without producing output (code, a plan, or a concrete finding).

## Content Pipeline Rules

- After creating any MDX file, update the corresponding registry/config with `published: true` and verify the content appears in navigation.
- After generating or replacing any image, update all registry/config references to point to the new file path. Verify paths exist.
- **Image formats:** AVIF for blog cards and web display. PNG only for OG/social images. Never generate PNG when AVIF is expected.
- **Environment variables:** Use `.env` files for all external URLs, API keys, and checkout links. Never hardcode service URLs in source code.

## Agent Responsibility

Guidelines for working with AI-generated code, based on [Vercel's "Agent Responsibly"](https://vercel.com/blog/agent-responsibly) principles.

### Automated Gates (hooks)

The `safe-ship-gate` hook runs automatically after every Write/Edit on package source files:
- Typechecks the affected package immediately
- Blocks on type errors before they accumulate
- Suggests `/safe-ship` for full review

### Before Merging Agent-Generated Code

1. **Accountability** — Can you explain what this code does under load? If it breaks at 2am, do you know where to look?
2. **Scope verification** — Does this change touch bundle sizes, performance paths, or peer dependencies?
3. **Test quality** — Are tests meaningful (not just hitting coverage targets with shallow assertions)?
4. **Security** — No `dangerouslySetInnerHTML`, `eval()`, unvalidated `as` casts on external data, or hardcoded secrets

### On-Demand Review

Run `/safe-ship` before any merge to get a structured report covering:
- Type safety, bundle size budgets, security patterns, accessibility, test quality
- Risk level assessment (LOW / MEDIUM / HIGH)
- Clear verdict: SHIP IT / HOLD / REVIEW

## Cross-Package Patterns

### Unified Slot (Radix UI + Base UI)
All UI packages share the `UnifiedSlot` component for `asChild` pattern compatibility:
- Render prop = Base UI style: `children={(props) => <MyComponent {...props} />}`
- Element cloning = Radix UI style: `children={<MyComponent />}`
- Each package has its own copy in `lib/slot.tsx` and `lib/ui-library-context.tsx`

### Provider Architecture
- `@tour-kit/core` provides base providers (TourProvider, TourKitProvider)
- Each package wraps with its own context (AdoptionProvider, ChecklistProvider, etc.)
- All providers support optional analytics integration

### Package Dependency Graph

```
@tour-kit/react ────────┐
@tour-kit/hints ────────┤
@tour-kit/adoption ─────┤
@tour-kit/checklists ───┼──► @tour-kit/core
@tour-kit/analytics ────┤
@tour-kit/announcements ┤
@tour-kit/media ────────┤
@tour-kit/scheduling ───┤
@tour-kit/surveys ──────┘
```

Note: `@tour-kit/scheduling` is an optional peer dependency for `@tour-kit/announcements`.

## Package-Specific Documentation

Each package has its own CLAUDE.md with domain-specific guidance:

| Package | Focus |
|---------|-------|
| `packages/core/CLAUDE.md` | Hook composition, position engine, storage adapters |
| `packages/react/CLAUDE.md` | Router adapters, multi-tour registry, Unified Slot |
| `packages/hints/CLAUDE.md` | Hint lifecycle, dismissal patterns |
| `packages/adoption/CLAUDE.md` | Adoption tracking algorithms, nudge scheduler |
| `packages/analytics/CLAUDE.md` | Plugin interface, event types |
| `packages/announcements/CLAUDE.md` | Display variants, queue system, frequency rules |
| `packages/checklists/CLAUDE.md` | Task dependencies, progress calculation |
| `packages/media/CLAUDE.md` | Embed components, URL parsing, accessibility |
| `packages/scheduling/CLAUDE.md` | Schedule evaluation, timezone handling, recurring patterns |
| `packages/surveys/CLAUDE.md` | Survey types, scoring engine, fatigue prevention, context awareness |
| `apps/docs/CLAUDE.md` | MDX conventions, Fumadocs patterns |

## Documentation Site

Full documentation is available at `apps/docs/`:

- **Getting Started** - Installation, quick start, TypeScript setup
- **Core Package** - Hooks, providers, utilities, types
- **React Package** - Components, headless variants, styling, router adapters
- **Extended Packages** - Adoption, analytics, announcements, checklists, media, scheduling
- **Guides** - Accessibility, persistence, animations, framework integration
- **Examples** - Basic tour, onboarding flow, headless custom
- **API Reference** - Complete API documentation for all packages

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
- Test coverage: thresholds are enforced **per-package** in each `packages/*/vitest.config.ts`,
  not as a blanket repo number. Ten packages hold the canonical floor — ≥80% statements,
  functions, and lines with ≥75% branches: `core`, `react`, `hints`, `adoption`, `checklists`,
  `analytics`, `license`, `surveys`, `vue`, and `svelte`. Three feature packages enforce honest, earned floors
  below canonical (statements/branches/functions/lines): `announcements` 75/70/80/75,
  `scheduling` 75/65/80/75, and `media` 70/60/70/70. `ai` has no per-key threshold yet. Slice 7
  raised these from the temporary phase-5 lows with real behavior tests, and measured coverage
  exceeds every enforced floor (kept in sync by `coverage-claim-alignment.test.ts`).
- Bundle sizes (gzipped): enforced by `tooling/bundle-check/check-dist-gzip.mjs`
  (the binding merge gate — run `pnpm dist:size`). It measures an entry's
  **import closure**: the entry file plus every `chunk-*.js` it statically
  imports, each gzipped and summed. Reading the entry file alone under-counts
  any package that emits more than one tsup entry, because `splitting: true`
  turns the entry into a re-export shell — v2 §1.2 found six packages being
  measured that way. `size-limit` (root [`/.size-limit.json`](/.size-limit.json))
  is a secondary smoke signal in a bundled-with-deps + brotli unit, run
  `pnpm bundlesize`. Per-package dist-gzip closure budgets:
  - core <23 KB, measured 22 621. Target <8 KB, tracked as audit B-1 — and
    B-1 is **not** an engine slice's to earn. The main entry's closure is the
    main barrel (providers, fourteen hooks, `cn`, `UnifiedSlot`, i18n,
    segmentation, diagnostics); reaching 8 KB means trimming that barrel,
    which is a breaking change, so it rides with the 7.0.0 unification (§3.7).
    History: §1.3 raised this from 21 KB at 21 271 (+446 B, the
    module-boundary cost of moving 636 lines out of `tour-provider.tsx`);
    §1.3b left it 43 bytes under 21.5 KB; issue #121 tripped that at 21 851
    (+416 B for the guards in `navigateToStepImpl`, `commitStart` in
    `actions.ts` and the Group B block in `transition-effects.ts`); v2 §1.4
    took it to 22 574. §1.4's +725 B is the import closure FLIPPING by design
    — `<TourProvider>` is a binding over `createTourEngine()` now, so the
    factory and the engine handle really are in the main closure, and the
    ~350 deleted lines of the old adapter do not cover them.
    `engine-not-in-main-closure.test.ts` asserted the opposite and was deleted
    in §1.4e; the invariant that still holds is `no-react-in-engine-dist`.
    v2 §1.5 took it to 22 621 (+47 B) — the six binding-contract re-exports
    on `/engine` plus `attachAdvanceOn`'s deferred bind. v3 Phase 1 took it to
    22 879 (+20 B over the 22 857 the gate actually printed before it) for
    `createHandle`, the engine-agnostic half of `createEngineHandle`. The
    Phase 1 review took it to 22 924 for `createListeners`, the fault-isolated
    subscriber fan-out both engines share — leaving only **76 B of headroom**,
    so Phase 2 must re-baseline this row deliberately rather than discover it)
  - core/engine subpath <18.5 KB (the non-React consumer's worst case: the
    engine — reducer, boot resolver, actions, transition effects, four
    storage adapters — plus the v2 §1.3b DOM behaviours (focus trap,
    keyboard, rect tracker, spotlight, advance-on, test bridge) and the chunk
    it and the main entry both read. Was <9 KB while this was a
    types-and-predicates door with no way to run a tour, and <16 KB after
    §1.3 gave it a way to run one but not to show one; a type-only consumer
    still ships zero. §1.3b raised this from 16 KB against a measured 17 033
    — the ~1.6 KB is the code that left the five view hooks, which is why
    `core` did not move: it lands in the shared chunk both entries read.
    Issue #121 took it to 17 451, still inside 18 KB; that +416 B is the same
    +416 B `core` saw, because both rows read the chunk it landed in. v2 §1.4
    settled it at 17 287 — slightly DOWN, because the binding pulled shared
    code the main entry now reads out of the chunk the engine also reads. v2
    §1.5 took it to 17 732 (+445 B): `engine-handle.ts` enters the engine's
    closure for the first time, because `/engine` now publishes the binding
    contract two non-React bindings sit on. §1.5f raised the ceiling from 18 KB
    to 18.5 KB at a measured 18 098 (+366 B) for `createSpotlight()`, the
    spotlight state machine that §1.5 had shipped in three copies. Most of
    those bytes MOVED rather than appeared — a Vue consumer ships engine +
    binding, and that total went 19 187 → 19 341, so +154 B net for deleting
    two of the three implementations. v3 Phase 1 took it to 18 124 (+25 B):
    `createHandle` plus its `EngineLike`/`Handle` types, which a package with
    its own engine composes instead of writing a second lifecycle —
    `@tour-kit/hints/engine` is the first)
  - core/engine IIFE (`dist/engine/index.global.js`, the CDN door) <18.5 KB,
    measured 17 492. It is the engine closure in one file — same source, one
    format — so it shares `core/engine`'s ceiling instead of the measured-×1.2
    convention, and trips at the same time; rollup drops the chunk boundary,
    which is why it is 606 B *smaller* than the two-file ESM closure it
    mirrors. `platform: 'browser'` on its own tsup item is why it contains no
    `process.env`: without it esbuild leaves four reads, two unguarded, and a
    browser throws `ReferenceError: process is not defined` on the first
    `interpolate()` or segment audience.
  - react <12 KB
  - hints <6.5 KB, measured 6 231. v3 Phase 1 raised this from 6 KB at 5 543:
    the +688 B is the module-boundary cost of the reducer, persistence, engine
    and handle leaving `hints-provider.tsx` for `lib/hints-engine/` (core §1.3
    paid +446 B for the same shape). The provider is a binding over
    `createHintsHandle` now.
  - hints/engine subpath <2.5 KB, measured 2 195 — the hints state machine,
    its persistence, `createHintsHandle` and `getHotspotPosition`; the
    components, hooks and context stay on the main entry. Built with
    `splitting: true`, so the row is the shell plus the two React-free chunks
    it imports, and a guard that read the shell alone would pass forever.
  - analytics <4 KB (root; per-plugin <1.5 KB each)
  - analytics/engine subpath <4 KB, measured 3 312 — the tracker and the five
    plugins with no React, no jsx-runtime and no licence gate; it shares the
    root row's ceiling because it is a strict subset of the root entry.
  - adoption <10 KB, measured 8 552
  - checklists <10.5 KB, measured 10 090. v3 Phase 2 raised this from 10 KB at
    8 604: the reducer, persistence and the three `utils/` leaves moved into
    `lib/checklists-engine/`, and the `engine/index` entry turns on the chunk
    split. The provider is a binding over `createChecklistsHandle` now.
  - checklists/engine subpath <4.5 KB, measured 4 347 — the reducer, the
    dependency graph, progress, persistence, the urlVisit listener and its
    attach leaf, `createChecklistsEngine` and `createChecklistsHandle`; the
    components, hooks, context and the licence gate stay on the main entry.
    Built with `splitting: true`, so the row is the re-export shell plus the
    one React-free chunk it shares with the main entry — a guard that read the
    shell alone would pass forever.
  - announcements <14 KB, surveys <12.5 KB, license <8 KB
  - media <9 KB
  - ai <7 KB (client), <8 KB (server)
  - scheduling <4 KB
  - scheduling/engine subpath <3.6 KB, measured 3 039 — twenty-four evaluation
    functions and three constants; the hooks, the gate and the analytics peer
    stay on the main entry.
  - vue <1.5 KB
  - svelte <1.3 KB

  The hints / announcements / surveys / media / ai numbers rose in v2 §1.2
  **without a byte being added**: they all ship a `headless` entry, so the gate
  had been reading their shell. Compare them to pre-§1.2 numbers only if you
  re-measure the old build the new way.
- Lighthouse Accessibility: 100
- WCAG 2.1 AA compliant

## Execution Rules

- **Plan before acting:** For any task touching 3+ files or requiring debugging, state your plan in 2-3 bullet points BEFORE writing code. Wait for approval.
- **Structured debugging:** State your hypothesis before each fix attempt. Max 3 attempts before stepping back and asking for more context. Never shotgun-fix.
- **No rabbit holes:** Never spend more than 2 consecutive tool calls exploring/reading without producing output (code, a plan, or a concrete finding).
- **Load wiki-tech before coding a package:** before writing or editing under `packages/<name>/`, read `wiki-tech/packages/<name>.md` plus any relevant `wiki-tech/concepts/*.md` it links to. The wiki is the answer; `packages/` is the evidence. If the wiki disagrees with the code, the disagreement *is* the finding — fix the right side and update the other in the same change (see `wiki-tech/CLAUDE.md` "Code a package" workflow).
- **Cross-repo work (cloud-facing changes):** if the task touches license issuance, analytics ingestion, audience-rule sync, billing, or the dashboard read path, load `wiki-tech/sources/tourkit-dash.md` first to pick the right `tourkit-dash-wiki/tour-kit-integration/<name>.md` page. Never restate cloud-side facts; cross-link to dash.

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
- Single canonical source in `@tour-kit/core/lib/unified-slot.tsx`. Six packages
  (`adoption`, `announcements`, `checklists`, `hints`, `media`, `react`) provide a
  thin `lib/slot.tsx` barrel that re-exports from core; `surveys` imports from core directly.

### UI Library Context
`UILibraryProvider` and `useUILibrary` live in `@tour-kit/core/lib/ui-library-context.tsx`.
All UI packages import from `@tour-kit/core`.

### `cn()` utility
Single source in `@tour-kit/core/lib/utils.ts`.

### Reduced motion
All animation-bearing packages honor `prefers-reduced-motion: reduce` via a three-tier defense:
1. **`motion-safe:` Tailwind prefix** on every `tailwindcss-animate` utility (`animate-in`, `fade-*`, `slide-*`, `zoom-*`) in `announcements` and `surveys` cva variants. Compiles to `@media (prefers-reduced-motion: no-preference)` — under reduce, the utility never applies. Required because `tailwindcss-animate` does not auto-respect the OS pref.
2. **`@media (prefers-reduced-motion: reduce)` keyframe wrappers** for custom keyframes we own (`tour-pulse` in `hints`, `tour-spotlight-in`/`tour-card-in` in `react`, `tk-strike`/`tk-check-pop` in `checklists`).
3. **JS gate via `useReducedMotion()`** from `@tour-kit/core` for render-time class branches (`<HintHotspot pulse>`, `<TourCard>` docking transition, checklist `completing` phase). Re-exported from `announcements`, `surveys`, `hints` for ergonomic in-package access.

When adding new animations, prefix with `motion-safe:` if it's a `tailwindcss-animate` utility, wrap custom `@keyframes` in the `@media` block, and use `useReducedMotion()` for any class chosen at render time. Cross-package guarantee documented at [`apps/docs/content/docs/guides/reduced-motion.mdx`](apps/docs/content/docs/guides/reduced-motion.mdx).

### Provider Architecture
- `@tour-kit/core` provides base providers (TourProvider, TourKitProvider)
- Each package wraps with its own context (AdoptionProvider, ChecklistProvider, etc.)
- All providers support optional analytics integration

### Package Dependency Graph

```
@tour-kit/react ────────┐
@tour-kit/hints ────────┤
@tour-kit/adoption ─────┤
@tour-kit/ai ───────────┤
@tour-kit/analytics ────┼──► @tour-kit/core
@tour-kit/announcements ┤
@tour-kit/checklists ───┤
@tour-kit/license ──────┤
@tour-kit/media ────────┤
@tour-kit/scheduling ───┤
@tour-kit/surveys ──────┤
@tour-kit/vue ──────────┤
@tour-kit/svelte ───────┘
```

`@tour-kit/vue` and `@tour-kit/svelte` are the odd ones out on that arrow: they
import the `@tour-kit/core/engine` subpath only, never the main entry, so no
React reaches their `.d.ts` chains. A per-package `no-react-in-dist.test.ts`
enforces it, with a positive control so a broken scan fails loudly.

Note: `@tour-kit/scheduling` is an optional peer dependency for `@tour-kit/announcements`. `@tour-kit/license` is the runtime validator the other Pro packages consult.

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
| `packages/vue/CLAUDE.md` | Vue binding: `watch` not `watchEffect`, SSR rule, lazy `ensure()` |
| `packages/svelte/CLAUDE.md` | Svelte binding: `createSubscriber`, `resolve.conditions`, `svelte-kit sync` |
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

## Sibling Project — `tourkit-dash`

A closed-source SaaS dashboard + API that consumes `@tour-kit/*` lives in a separate repo on disk at `/home/domidex/projects/tourkit-dash/`. When a task spans SDK runtime + cloud consumption (data model, billing/licensing flow, API contract, ADRs, runbooks), the bridge between the two repos lives in pointer pages — start at:

- This repo → dash: [`wiki-tech/sources/tourkit-dash.md`](wiki-tech/sources/tourkit-dash.md) — describes `tourkit-dash/wiki/` and `tourkit-dash/docs/` layout + the cross-link convention (`tourkit-dash-wiki/...`, `tourkit-dash-docs/...`).
- Dash → this repo: `/home/domidex/projects/tourkit-dash/wiki/sources/tour-kit-wiki-tech.md` (already exists) and the per-package pages under `/home/domidex/projects/tourkit-dash/wiki/tour-kit-integration/`.

Rule: never edit dash files from this repo, and never duplicate dash content here. If you're rephrasing a cloud-side fact, link to dash instead. Conversely, the SDK runtime authoritative source is here, not in dash — dash links here for that.

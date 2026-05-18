# Phase 5 — target-as-ref + MultiTourKit Compose

**Duration:** Days 25–29 (~8–10 hours)
**Depends on:** Phase 0 task 0.3 (signed-off `TourTarget` union in `phase-0-validation.md`)
**Blocks:** Phase 6 may opportunistically use the ref pattern for checklist task anchors (not a hard block — Phase 6 keeps working against string selectors if Phase 5 slips)
**Risk Level:** MEDIUM — type widening is backwards compatible (every existing `string` selector keeps working) and the compose-mode provider is additive (existing sibling-style usage continues to render). Risk concentrated in (a) runtime resolver disambiguation across the three target shapes and (b) the best-effort codemod producing valid TSX on edge inputs.
**Stack:** react

---

## Objective

Stop tour selectors silently breaking on portal'd elements, dynamically-IDed nodes, and CSS-Modules-mangled class names by widening the `target` prop from today's `string | RefObject<HTMLElement | null>` (already partial in `packages/core/src/types/step.ts` line 63) to the full three-way `string | RefObject<HTMLElement | null> | (() => HTMLElement | null)` union signed off in Phase 0 §3. Ship `<MultiTourKitProvider>{children}` compose-mode so a deeply-nested `useTour()` consumer can rely on registry-based lookup without caring whether a sibling `<Tour>` was declared before or after the provider's children — removing the documentation footgun where today's example places `<Tour>` and consuming components as siblings. Cap the change with a best-effort jscodeshift codemod that rewrites `target="#foo"` to `target={fooRef}` when a `useRef` is already in scope; emit a TODO comment when the rewrite is uncertain.

## What Success Looks Like

1. `<TourStep target={useRef(buttonEl)} />` renders the spotlight over the ref'd element with zero selector string anywhere in the call site (verified by a Vitest + Testing Library test that mounts a button with a `ref`, hands the ref to a step, starts the tour, and asserts `document.querySelector('[data-tour-spotlight]')` overlaps the button's `getBoundingClientRect()`)
2. `<TourStep target={() => document.querySelector<HTMLElement>('[data-cy="cta"]')} />` resolves at step-enter time (verified by a test that mounts the target node lazily — after the step is configured — and asserts the spotlight lands on it on the first `goToStep('cta')`)
3. Backwards-compat: `<TourStep target="#welcome" />` still resolves via `document.querySelector` and produces a passing snapshot against the pre-Phase-5 render (`pnpm --filter @tour-kit/react test -- --run target-string-backcompat` exits 0; no console warnings)
4. `<MultiTourKitProvider>` compose-mode: a `useTour()` call from a child five `<div>`s deep inside `<MultiTourKitProvider>` returns a non-null controller (verified by a Testing Library test that renders a deeply-nested consumer and asserts `result.current.isActive === false` is exposed rather than the hook throwing "must be used within MultiTourKitProvider")
5. `pnpm --filter @tour-kit/codemods test -- --run target-to-ref` exits 0 with **5 of 5** sample fixtures rewriting cleanly (one of the five is the "ambiguous — emit TODO" case, asserting the codemod leaves the original target untouched and inserts the comment)
6. `pnpm --filter @tour-kit/core typecheck && pnpm --filter @tour-kit/react typecheck && pnpm --filter @tour-kit/codemods typecheck` all exit 0
7. All pre-existing tour + multi-tour tests pass with zero regressions (`pnpm test` at repo root exits 0)
8. New docs page `apps/docs/content/docs/react/target-prop.mdx` renders in dev (`pnpm --filter docs dev` shows it in the React-package sidebar) with one runnable code block per target shape (string, ref, thunk) and a documented order-of-resolution note

---

## Architecture / Key Design Decisions

```
                 packages/core/src/types/target.ts (NEW)
                 ┌──────────────────────────────────────────────────────────┐
                 │  type TourTargetRef    = React.RefObject<HTMLElement|null>│
                 │  type TourTargetGetter = () => HTMLElement | null         │
                 │  type TourTarget = string | TourTargetRef | TourTargetGetter
                 │                                                          │
                 │  function resolveTarget(t: TourTarget): HTMLElement|null │
                 │    1. typeof === 'string' → document.querySelector(t)    │
                 │    2. t && 'current' in t → t.current                    │
                 │    3. typeof === 'function' → t()                        │
                 │    (closed set — never returns undefined)                │
                 └──────────────────────────────────────────────────────────┘
                                     ▲                  ▲
                                     │                  │
              ┌──────────────────────┘                  └────────────────────────┐
              │                                                                  │
   packages/core/src/types/step.ts          packages/react/src/components/tour/tour-step.tsx
   target: TourTarget                       (consumes resolveTarget via the
                                             provider's step-render pipeline)
              │
              ▼
   packages/react/src/components/provider/tourkit-provider.tsx
   <MultiTourKitProvider>{children}</MultiTourKitProvider>
     - Compose-mode: children of the provider declarative-register via
       useTourRegistryContext().registerTour({...}) on mount
     - useTour() lookups walk the registry by id — sibling-vs-wrapper is
       no longer a placement concern
     - Existing sibling-style consumers continue to render (the provider
       always wraps; compose-mode is the documented default)

   packages/codemods/src/transforms/target-to-ref.ts (NEW)
     - jscodeshift transform (parser = 'tsx', matching the existing
       from-driver / from-shepherd / from-joyride convention)
     - Finds JSX <TourStep target="..." /> with a literal string starting
       with '#'; if a matching useRef binding exists in scope, rewrites
       to target={someRef}; else emits `// TODO(tour-kit): target-to-ref`
     - Idempotent: re-running on already-migrated source is a no-op
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| Public target prop on `TourStep` (and `TourStepConfig.target`) | `type` alias `TourTarget` (string \| RefObject \| getter) | Closed union — the runtime resolver branches on `typeof` and `'current' in`. Each branch is statically unambiguous. |
| Internal resolver return | `HTMLElement \| null` | Never `undefined`; missing target is a real null result that the existing positioner already handles by retrying / failing the step. |
| Codemod fixtures | jscodeshift `FileInfo` (input.tsx → output.tsx pairs under `__tests__/fixtures/target-to-ref/`) | Same convention as `from-driver`, `from-shepherd`, `from-joyride` transforms in the same package. |
| `MultiTourKitProvider` compose-mode | unchanged props (`MultiTourKitProviderProps`) | Provider already accepts `children: React.ReactNode`; this phase clarifies semantics and tests deeply-nested registration, no new public API. |

**Critical rules for this phase:**

- **No-op disambiguation.** The resolver MUST branch in this order: `typeof t === 'string'` → `t && typeof t === 'object' && 'current' in t` → `typeof t === 'function'`. Strings can't have `.current`; refs are objects with `.current`; thunks are callables. No two branches overlap.
- **Backwards-compat is sacred.** Existing string selectors keep their `document.querySelector` lookup with no console warning, no deprecation tag. Phase 0 §3 explicitly recorded: "selector string never warns; documented as fallback only."
- **Codemod is best-effort, never destructive.** When in doubt, emit `// TODO(tour-kit): target-to-ref` above the unchanged JSX attribute. The codemod re-running on an already-migrated file produces no diff (idempotent). Existing transforms (`from-driver.ts`, `from-shepherd.ts`) use `attachLeadingComments` + `emitTodo` from `packages/codemods/src/lib/todo-emitter.ts` — reuse that helper.
- **Compose-mode is the documented default.** Update the MDX example in `tourkit-provider.tsx`'s docblock so all three slots (`<Tour>`, `<TourOverlay>`, `<TourCard>`) live as children of `<MultiTourKitProvider>` rather than as siblings of it. Existing sibling-style code keeps working (the provider already wraps a `TourProvider` internally), but the docs lead with compose-mode.
- **No new animations, no new peer deps.** `React.RefObject` is native; jscodeshift is already a dev dep of `@tour-kit/codemods`. The three-tier reduced-motion defense from CLAUDE.md does not apply.
- **`type` over `interface`.** The `TourTarget` discriminated union is exported as a `type` alias (Phase 0 §3 wrote it as a `type` — not an `interface` — because it's a union, not a record shape). `interface` extension semantics aren't useful here.

---

## Tasks

### Task 5.1 — Type widening + runtime resolver (3–4 h)

**Depends on:** Phase 0 task 0.3 (signed-off `TourTarget` union)

Create `packages/core/src/types/target.ts` with the closed union and the runtime resolver. The union and resolver order are pasted verbatim from `phase-0-validation.md` §3 — re-typed here to keep this plan self-contained:

```ts
// packages/core/src/types/target.ts (NEW)
import type * as React from 'react'

export type TourTargetRef = React.RefObject<HTMLElement | null>
export type TourTargetGetter = () => HTMLElement | null

/**
 * Three accepted shapes for `target` on a TourStep / HintHotspot / etc:
 *   - selector string (legacy; runs `document.querySelector` at resolve time)
 *   - RefObject (recommended; survives portals, CSS modules, dynamic ids)
 *   - getter function (escape hatch for lazily-mounted DOM)
 *
 * Backwards-compat: string form is documented as fallback only and emits NO
 * dev warning (Phase 0 §3 sign-off).
 */
export type TourTarget = string | TourTargetRef | TourTargetGetter

/**
 * Resolver order (closed, non-overlapping):
 *   1. typeof t === 'string'                  → document.querySelector(t)
 *   2. t && typeof t === 'object' && 'current' in t → t.current
 *   3. typeof t === 'function'                → t()
 * Returns HTMLElement | null — never undefined.
 */
export function resolveTarget(t: TourTarget): HTMLElement | null {
  if (typeof t === 'string') {
    if (typeof document === 'undefined') return null // SSR-safe
    return document.querySelector<HTMLElement>(t)
  }
  if (t && typeof t === 'object' && 'current' in t) {
    return t.current
  }
  if (typeof t === 'function') {
    return t()
  }
  return null
}
```

Update `packages/core/src/types/step.ts` line 63 — replace `target: string | React.RefObject<HTMLElement | null>` with `target: TourTarget` (imported from `./target`). Audit every other file in `packages/core/src/types/` and `packages/core/src/utils/position.ts` for sites that consume `step.target` as a string and pipe them through `resolveTarget` instead. Same audit pass in `packages/react/src/components/tour/tour-step.tsx` — anywhere the prop is dereferenced as a string, route through `resolveTarget`.

Add unit tests in `packages/core/src/__tests__/types/target.test.ts`:
- string → falls back to `document.querySelector` (jsdom)
- RefObject with `.current` set → returns the element
- RefObject with `.current` null → returns null
- thunk returning element → returns the element
- thunk returning null → returns null
- SSR safety: with `globalThis.document = undefined`, string form returns null without throwing

Add a backwards-compat integration test in `packages/react/src/__tests__/components/tour/tour-step.target-back-compat.test.tsx` that mounts a tour with `target="#a"` and asserts the rendered card snapshot is byte-identical to the pre-widening snapshot.

**Sanity check:** `pnpm --filter @tour-kit/core typecheck && pnpm --filter @tour-kit/core test -- --run target` exits 0; `pnpm --filter @tour-kit/react test -- --run target-string-backcompat` exits 0.

---

### Task 5.2 — `<MultiTourKitProvider>{children}` compose-mode (3–4 h)

The provider at `packages/react/src/components/provider/tourkit-provider.tsx` (lines 75–134) already accepts `children: React.ReactNode` and wraps them in `<CoreTourKitProvider>` → `<TourProvider>` → `{children}`. The current pain — surfaced as part of the dashboard-next walk — is that some example code in docs / Storybook treats `<Tour>` and the consuming components as **siblings of `<MultiTourKitProvider>`**, leaving consumers unsure whether `useTour()` will resolve. Phase 5.2 makes compose-mode the canonical, tested, documented pattern.

Three concrete changes:

1. **Update the docblock example** in `tourkit-provider.tsx` (around lines 60–73) so every consuming component sits **inside** the provider, including `<Tour>`, `<TourOverlay>`, `<TourCard>`, and the app tree.
2. **Add a deeply-nested registration test** at `packages/react/src/__tests__/components/provider/multi-tour-kit-compose.test.tsx`:
   - Renders `<MultiTourKitProvider><A><B><C><Tour id="x" .../></C></B></A></MultiTourKitProvider>` (three intermediate components).
   - Asserts that calling `useTour()` from inside `<C>` returns a controller — does not throw and does not return null.
   - Asserts the tour's id appears in the registry exposed by `useTourRegistryContext().tours`.
   - Asserts that re-rendering `<C>` (key change) re-registers the same tour id idempotently (the existing `registerTour` already handles this — see lines 89–98; the test pins the contract).
3. **No public API changes.** `MultiTourKitProviderProps` and the exported `MultiTourKitProvider` keep their current shape; only docs, examples, and tests change. The existing sibling pattern continues to render because the provider always wraps `TourProvider` internally — backwards compatibility is automatic.

Also: scan `examples/dashboard-next/` and `apps/docs/content/docs/react/*.mdx` for any `<MultiTourKitProvider>` usage where consuming components are siblings rather than children; rewrite to compose-mode in the same PR (callout in CHANGELOG: "docs: switch MultiTourKitProvider examples to compose-mode").

**Sanity check:** `pnpm --filter @tour-kit/react test -- --run multi-tour-kit-compose` exits 0; `pnpm --filter @tour-kit/react typecheck` exits 0.

---

### Task 5.3 — Codemod: `target-to-ref` best-effort transform (2 h)

**Depends on:** 5.1

Create `packages/codemods/src/transforms/target-to-ref.ts` following the existing `from-driver.ts` / `from-shepherd.ts` template (`parser = 'tsx'`, default-exported `transform(file, api)` function returning a `string`).

Heuristic:
- Find JSX attributes named `target` whose value is a `StringLiteral` of form `'#identifier'` (matches `/^#[A-Za-z_][\w-]*$/`).
- In the same source file, look for a `const <name>Ref = useRef<HTMLElement>(null)` (or `useRef<HTMLButtonElement | null>`, etc.) where `<name>` matches the bare identifier from the `#` selector.
- **Match found** → rewrite the JSX attribute to `target={<name>Ref}` (drops the quotes; uses a `JSXExpressionContainer`).
- **No matching ref in scope** → leave the attribute untouched, attach `// TODO(tour-kit): target-to-ref — no matching useRef binding found; pass a RefObject<HTMLElement> or a () => HTMLElement getter` as a leading comment on the JSX opening element. Reuse `emitTodo` + `attachLeadingComments` from `packages/codemods/src/lib/todo-emitter.ts` (same helper the existing transforms use).

Idempotency:
- A `target={someExpr}` attribute (already a `JSXExpressionContainer`, not a `StringLiteral`) is skipped — running the codemod twice on the same file produces a zero-diff second pass.
- The TODO comment is only attached once; re-running checks for the existing comment via substring match on the leading comments.

Register the transform in `packages/codemods/src/cli.ts` so `tour-kit-migrate --list` shows `target-to-ref` (mirror the registration pattern of `from-driver`).

Fixtures live at `packages/codemods/src/__tests__/fixtures/target-to-ref/` — five input/output pairs:

1. **happy-path-single.input.tsx** — one `<TourStep target="#welcome">` + a matching `const welcomeRef = useRef(null)`. Output: `target={welcomeRef}`.
2. **happy-path-multi.input.tsx** — three steps with matching refs. Output: all three rewritten.
3. **no-ref-in-scope.input.tsx** — `<TourStep target="#missing">` with no `useRef` for `missing`. Output: target unchanged, TODO comment attached.
4. **already-ref.input.tsx** — `<TourStep target={someRef} />`. Output: identical (no-op).
5. **mixed-bag.input.tsx** — one step with matching ref + one step without. Output: first rewritten, second carries TODO. (Validates "best-effort 5/5" with the "rest" being half a file, not whole files.)

Add the test runner at `packages/codemods/src/__tests__/transforms/target-to-ref.test.ts` following the `from-driver.test.ts` pattern (read input fixture, run transform, assert output equals expected fixture string).

**Sanity check:** `pnpm --filter @tour-kit/codemods test -- --run target-to-ref` exits 0 with five passing fixture cases; running the codemod twice on `happy-path-single.input.tsx` produces a byte-identical second-pass output (idempotency).

---

## Deliverables

```
packages/core/
├── src/
│   ├── types/
│   │   ├── target.ts                       # NEW — TourTarget union + resolveTarget()
│   │   ├── step.ts                         # UPDATED — `target: TourTarget`
│   │   └── index.ts                        # UPDATED — re-export TourTarget, TourTargetRef,
│   │                                       #            TourTargetGetter, resolveTarget
│   ├── utils/
│   │   └── position.ts                     # UPDATED — pipe step.target through resolveTarget
│   └── __tests__/
│       └── types/
│           └── target.test.ts              # NEW — 6 cases: string/ref-set/ref-null/
│                                           #         thunk-elem/thunk-null/ssr-no-document

packages/react/
├── src/
│   ├── components/
│   │   ├── tour/
│   │   │   └── tour-step.tsx               # UPDATED — consume resolveTarget on prop dereference
│   │   └── provider/
│   │       └── tourkit-provider.tsx        # UPDATED — docblock example switched to compose-mode
│   └── __tests__/
│       ├── components/
│       │   └── tour/
│       │       └── tour-step.target-back-compat.test.tsx   # NEW — string-selector parity
│       └── components/
│           └── provider/
│               └── multi-tour-kit-compose.test.tsx          # NEW — deeply-nested useTour test

packages/codemods/
├── src/
│   ├── transforms/
│   │   └── target-to-ref.ts                # NEW — jscodeshift transform (parser: 'tsx')
│   ├── cli.ts                              # UPDATED — register `target-to-ref`
│   └── __tests__/
│       ├── transforms/
│       │   └── target-to-ref.test.ts       # NEW — fixture runner (5 cases)
│       └── fixtures/
│           └── target-to-ref/
│               ├── happy-path-single.input.tsx     # NEW
│               ├── happy-path-single.output.tsx    # NEW
│               ├── happy-path-multi.input.tsx      # NEW
│               ├── happy-path-multi.output.tsx     # NEW
│               ├── no-ref-in-scope.input.tsx       # NEW
│               ├── no-ref-in-scope.output.tsx      # NEW
│               ├── already-ref.input.tsx           # NEW
│               ├── already-ref.output.tsx          # NEW
│               ├── mixed-bag.input.tsx             # NEW
│               └── mixed-bag.output.tsx            # NEW

apps/docs/
└── content/docs/react/
    └── target-prop.mdx                     # NEW — one runnable code block per target shape;
                                            #        documents resolveTarget order; sidebar slot
                                            #        update in meta.json (existing convention)
```

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/core typecheck && pnpm --filter @tour-kit/react typecheck && pnpm --filter @tour-kit/codemods typecheck` all exit 0
- [ ] `pnpm --filter @tour-kit/core test -- --run target` exits 0 with the six-case `target.test.ts` (string, ref-set, ref-null, thunk-elem, thunk-null, SSR-no-document) all passing
- [ ] `pnpm --filter @tour-kit/react test -- --run target-string-backcompat` exits 0 — proves existing string-selector behaviour is unchanged
- [ ] `pnpm --filter @tour-kit/react test -- --run multi-tour-kit-compose` exits 0 — proves `useTour()` works from a child five `<div>`s deep; registry exposes the registered tour id; double-render is idempotent
- [ ] `pnpm --filter @tour-kit/codemods test -- --run target-to-ref` exits 0 with **5 of 5** fixture cases passing (happy-path-single, happy-path-multi, no-ref-in-scope emit-TODO, already-ref no-op, mixed-bag partial-rewrite)
- [ ] Codemod idempotency: running the transform twice on `happy-path-single.input.tsx` produces a byte-identical second-pass output (asserted in the test runner)
- [ ] `pnpm test` at repo root exits 0 — no regressions in any tour, hint, multi-tour, or codemod suite
- [ ] `pnpm --filter docs build` exits 0; `target-prop.mdx` appears in the React-package sidebar
- [ ] `MultiTourKitProvider` docblock example in `tourkit-provider.tsx` shows `<Tour>`, `<TourOverlay>`, `<TourCard>` as children of the provider (compose-mode), not siblings
- [ ] Audit pass: `grep -rn "target:.*string |.*RefObject" packages/core/src packages/react/src` returns no remaining call sites that hardcode the old two-way union — every site uses `TourTarget`

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to implement this phase:

---
You are building Phase 5 of Tour Kit v2 Package Polish — target-as-ref + MultiTourKit Compose.

### What This Project Is
Tour Kit is a pnpm monorepo of 12 packages providing headless React product-tour primitives (`@tour-kit/core`, `@tour-kit/react`, `@tour-kit/hints`) plus Pro packages (announcements, surveys, checklists, adoption, analytics, ai, scheduling, license, media). v2 closes demo-wiring gaps reported while building `examples/dashboard-next/`. Every phase ships as one PR with backwards-compatible types. Stack: TypeScript strict mode, React 18+, tsup, Turborepo, Vitest + Testing Library, jscodeshift for codemods, pnpm. CLAUDE.md at the repo root and per-package CLAUDE.md files are authoritative for conventions (Unified Slot, ui-library-context, reduced-motion, etc.).

### Established in Prior Phases
- Phase 0 (signed off in `tasks/v2-package-polish/phase-0-validation.md`) locked the `TourTarget` union signature. Pasted verbatim below.
- The existing `target` prop on `TourStepConfig` already accepts `string | React.RefObject<HTMLElement | null>` at `packages/core/src/types/step.ts` line 63 — Phase 5 widens it to also accept a `() => HTMLElement | null` thunk and routes every dereference through a single `resolveTarget` function.
- `MultiTourKitProvider` already lives at `packages/react/src/components/provider/tourkit-provider.tsx` lines 75–134 with `children: React.ReactNode` and an internal `TourRegistryContext`. It already wraps `<CoreTourKitProvider><TourProvider>{children}</TourProvider></CoreTourKitProvider>` — so consuming children inside it already have access to `useTour()`. Phase 5.2 codifies, tests, and documents compose-mode; it adds no new public API.
- The codemods package (`packages/codemods/`) already ships three transforms (`from-driver.ts`, `from-shepherd.ts`, `from-joyride.ts`) under `src/transforms/` and a fixture-based test convention under `src/__tests__/`. The shared helper `packages/codemods/src/lib/todo-emitter.ts` exposes `emitTodo` and `attachLeadingComments` for best-effort TODO insertion — reuse them.

### Signed-off Signature (verbatim from Phase 0 §3)

```ts
export type TourTargetRef = React.RefObject<HTMLElement | null>
export type TourTargetGetter = () => HTMLElement | null

/**
 * Three accepted shapes for `target`:
 *   - selector string (legacy; runs `document.querySelector` on each step)
 *   - RefObject (recommended; survives portals + dynamic IDs)
 *   - getter function (escape hatch; lets callers query the DOM lazily)
 *
 * Runtime resolver order:
 *   1. If typeof target === 'string' → document.querySelector(target)
 *   2. If 'current' in target → target.current
 *   3. If typeof target === 'function' → target()
 */
export type TourTarget = string | TourTargetRef | TourTargetGetter
```

Backwards-compat per Phase 0 §3: the legacy string form emits **no** dev warning. It is documented as fallback only.

### Resolver Signature

```ts
export function resolveTarget(t: TourTarget): HTMLElement | null {
  if (typeof t === 'string') {
    if (typeof document === 'undefined') return null
    return document.querySelector<HTMLElement>(t)
  }
  if (t && typeof t === 'object' && 'current' in t) {
    return t.current
  }
  if (typeof t === 'function') {
    return t()
  }
  return null
}
```

Branches are non-overlapping: strings are not objects with `.current`, refs are not callable, thunks are not strings.

### Your Goal for This Phase
Widen the `target` prop across `@tour-kit/core` and `@tour-kit/react` to the three-way union, introduce a single `resolveTarget` source of truth, make compose-mode the canonical `<MultiTourKitProvider>{children}` pattern (with a deeply-nested `useTour()` test pinning the contract), and ship a best-effort jscodeshift codemod `target-to-ref` with 5 fixture cases. Zero regressions in existing string-selector behaviour.

### Data Model Rules (follow exactly)
- **`type` alias (exported):** `TourTarget`, `TourTargetRef`, `TourTargetGetter` — unions, not records. Live in `packages/core/src/types/target.ts`. Re-exported from the `@tour-kit/core` barrel (`src/types/index.ts` and `src/index.ts`).
- **Function (exported):** `resolveTarget(t: TourTarget): HTMLElement | null` — co-located in `target.ts`. Same source of truth used by `tour-step.tsx`, `position.ts`, and any future hint/announcement consumer.
- **No new Zod schemas this phase.** `target` does not cross an external validation boundary.
- **No `interface` for the target union.** A discriminated union is a `type`, not an `interface`.
- **No new peer deps.** `React.RefObject` is native; jscodeshift is already a `@tour-kit/codemods` dev dep.
- **Backwards-compat is sacred.** Every existing string-selector call site keeps working. Audit `packages/core/src/utils/position.ts` and any other place that touches `step.target` to ensure it goes through `resolveTarget`.

### Architecture
```
@tour-kit/core
  src/types/target.ts                ← NEW: TourTarget union + resolveTarget() function
  src/types/step.ts                  ← UPDATED: line 63 → `target: TourTarget`
  src/types/index.ts                 ← UPDATED: re-export TourTarget*, resolveTarget
  src/utils/position.ts              ← UPDATED: pipe step.target through resolveTarget
  src/__tests__/types/target.test.ts ← NEW: 6 cases per Task 5.1

@tour-kit/react
  src/components/tour/tour-step.tsx                                  ← UPDATED: use resolveTarget
  src/components/provider/tourkit-provider.tsx                       ← UPDATED: compose-mode docblock
  src/__tests__/components/tour/tour-step.target-back-compat.test.tsx  ← NEW: string-selector parity
  src/__tests__/components/provider/multi-tour-kit-compose.test.tsx    ← NEW: deeply-nested useTour

@tour-kit/codemods
  src/transforms/target-to-ref.ts          ← NEW: jscodeshift transform (parser: 'tsx')
  src/cli.ts                               ← UPDATED: register `target-to-ref`
  src/__tests__/transforms/target-to-ref.test.ts   ← NEW: fixture runner
  src/__tests__/fixtures/target-to-ref/    ← NEW: 5 input/output fixture pairs

apps/docs/content/docs/react/target-prop.mdx   ← NEW: docs page; meta.json sidebar slot
```

### Confirmed Library APIs

```ts
// React 18+ — RefObject is native; no import needed for the value, only the type.
import type * as React from 'react'

// jscodeshift — existing convention in packages/codemods/src/transforms/:
import type { API, FileInfo, JSCodeshift } from 'jscodeshift'

export const parser = 'tsx'

export default function transform(file: FileInfo, api: API): string {
  const j: JSCodeshift = api.jscodeshift
  const root = j(file.source)
  // ... find JSX attribute named 'target' with StringLiteral value matching /^#[A-Za-z_][\w-]*$/
  // ... look up matching useRef binding in the same source
  // ... rewrite to JSXExpressionContainer(Identifier(`${name}Ref`)) OR
  // ... attach `// TODO(tour-kit): target-to-ref` via emitTodo + attachLeadingComments
  return root.toSource({ quote: 'single', trailingComma: true })
}
```

```ts
// packages/codemods/src/lib/todo-emitter.ts (existing helper — REUSE):
import { type Todo, attachLeadingComments, emitTodo } from '../lib/todo-emitter'
// emitTodo({ message: 'target-to-ref — no matching useRef binding found ...' }) → Todo
// attachLeadingComments(node, [todo]) → mutates node.comments
```

```ts
// Testing Library — deeply-nested useTour test pattern:
import { render, renderHook } from '@testing-library/react'
import { useTour } from '@tour-kit/react'
import { MultiTourKitProvider, Tour, TourStep } from '@tour-kit/react'

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MultiTourKitProvider>
      <div><div><div><div><div>{children}</div></div></div></div></div>
    </MultiTourKitProvider>
  )
}

const { result } = renderHook(() => useTour(), { wrapper: Wrapper })
expect(result.current).toBeDefined()
expect(result.current.isActive).toBe(false)
```

### Files to Create / Update

#### `packages/core/src/types/target.ts` (NEW)
Export `TourTargetRef`, `TourTargetGetter`, `TourTarget`, and the `resolveTarget` function — verbatim as in the Signed-off Signature + Resolver Signature blocks above. JSDoc the resolver order. SSR-guard the string branch with `typeof document === 'undefined'` returning null. Do not import React's runtime; only `import type * as React from 'react'`.

#### `packages/core/src/types/step.ts` (UPDATED)
At line 63, replace `target: string | React.RefObject<HTMLElement | null>` with `target: TourTarget` and `import type { TourTarget } from './target'` near the top of the file. Do not change any other field. Hidden-step constraints around `target` remain enforced by `validateTour`.

#### `packages/core/src/types/index.ts` (UPDATED)
Re-export `TourTarget`, `TourTargetRef`, `TourTargetGetter` (as types) and `resolveTarget` (as value) from `./target`.

#### `packages/core/src/utils/position.ts` (UPDATED)
Find every site that touches `step.target` directly (it's currently typed as string in some downstream consumers). Pipe it through `resolveTarget` so the position engine sees `HTMLElement | null` regardless of which target shape the consumer supplied. Do not change the public signature of `calculatePosition`.

#### `packages/core/src/__tests__/types/target.test.ts` (NEW)
Six Vitest cases:
1. `resolveTarget('#x')` returns the `<div id="x">` (jsdom; create the element then call).
2. `resolveTarget({ current: el })` returns `el`.
3. `resolveTarget({ current: null })` returns null.
4. `resolveTarget(() => el)` returns `el`.
5. `resolveTarget(() => null)` returns null.
6. `resolveTarget('#anything')` with `globalThis.document = undefined` returns null without throwing. Restore `globalThis.document` in `afterEach`.

#### `packages/react/src/components/tour/tour-step.tsx` (UPDATED)
Anywhere the `target` prop is dereferenced (search for `props.target`, destructured `target` usage), route it through `resolveTarget` imported from `@tour-kit/core`. The component remains a thin wrapper — no logic changes beyond the resolver call.

#### `packages/react/src/components/provider/tourkit-provider.tsx` (UPDATED)
Lines 60–73 — update the JSDoc `@example` block so `<Tour>`, `<TourOverlay>`, `<TourCard>`, and `<App />` all live as children of `<MultiTourKitProvider>` (compose-mode). The implementation (lines 75–134) does not change — the provider already wraps `TourProvider`. No new props.

#### `packages/react/src/__tests__/components/tour/tour-step.target-back-compat.test.tsx` (NEW)
Mount a tour with `target="#a"` (legacy string) and assert the rendered output matches a snapshot. Run the same setup with `target={refToA}` (ref) and assert the spotlight overlaps the same DOM rect. Asserts no console warnings via `vi.spyOn(console, 'warn')`.

#### `packages/react/src/__tests__/components/provider/multi-tour-kit-compose.test.tsx` (NEW)
Render `<MultiTourKitProvider>` wrapping five `<div>`s deep, with a `<Tour id="x" steps={...} />` at the leaf. Use `renderHook(() => useTour(), { wrapper })` to assert (1) the hook returns a controller (not null, not thrown), (2) `useTourRegistryContext().tours` contains the tour id `'x'`, and (3) a re-render of the leaf does not duplicate the registry entry (idempotent register — see the existing `registerTour` body lines 89–98).

#### `packages/codemods/src/transforms/target-to-ref.ts` (NEW)
jscodeshift transform with `parser = 'tsx'`. Find JSX attributes named `target` whose value is a `StringLiteral` matching `/^#[A-Za-z_][\w-]*$/`. For each match, search the surrounding file for a `useRef` binding whose name matches `${bareIdentifier}Ref` (where `bareIdentifier` is the string between `#` and the end of the selector). If found, replace the attribute value with `j.jsxExpressionContainer(j.identifier(${bareIdentifier}Ref))`. If not found, attach a leading comment via `emitTodo` + `attachLeadingComments` (helper at `packages/codemods/src/lib/todo-emitter.ts`) with message `'target-to-ref — no matching useRef binding found; pass a RefObject<HTMLElement> or a () => HTMLElement getter'`. Idempotent: skip attributes whose value is already a `JSXExpressionContainer`, and skip nodes whose leading comments already contain the TODO substring. `return root.toSource({ quote: 'single', trailingComma: true })`.

#### `packages/codemods/src/cli.ts` (UPDATED)
Register `target-to-ref` so it appears in `tour-kit-migrate --list`. Mirror the existing `from-driver` registration pattern exactly.

#### `packages/codemods/src/__tests__/transforms/target-to-ref.test.ts` (NEW)
Vitest suite that reads each `<name>.input.tsx` fixture, runs the transform, and asserts the result equals `<name>.output.tsx`. Five cases per the fixture list in Task 5.3. One additional case asserts idempotency by running the transform twice on `happy-path-single.input.tsx` and asserting the second pass produces a byte-identical output to the first.

#### `packages/codemods/src/__tests__/fixtures/target-to-ref/` (NEW — 10 files)
Five input/output pairs (`.input.tsx` + `.output.tsx`):
- `happy-path-single` — one step, one ref in scope, rewritten cleanly.
- `happy-path-multi` — three steps, three refs, all rewritten.
- `no-ref-in-scope` — one step, no matching ref, TODO comment attached, attribute unchanged.
- `already-ref` — one step already using `target={someRef}`, no-op.
- `mixed-bag` — two steps, one rewritten and one TODO-tagged.

#### `apps/docs/content/docs/react/target-prop.mdx` (NEW)
Frontmatter: `title: target Prop`, `description: Three ways to point a tour step at a DOM element.`. Three H2 sections — `## Selector string (legacy)`, `## RefObject (recommended)`, `## Getter function (escape hatch)` — each with a runnable code block. A fourth section `## Resolution order` documents the `resolveTarget` order verbatim from Phase 0 §3. Update `apps/docs/content/docs/react/meta.json` to slot the new page (alphabetical or end-of-list; mirror existing convention).

### Success Criteria
- `<TourStep target={useRef(buttonEl)} />` works without any selector
- `<TourStep target={() => document.querySelector<HTMLElement>('[data-cy="cta"]')} />` resolves at step-enter time
- Existing `<TourStep target="#welcome" />` still works (zero regressions, zero warnings)
- `<MultiTourKitProvider>` with a five-deep-nested `useTour()` consumer returns a controller, not a throw
- Codemod handles 5/5 sample fixtures (best-effort emit-comment on the "no ref in scope" case)
- All tests pass: `pnpm test` exits 0
- All typecheck pass: `pnpm typecheck` exits 0
- Docs build clean: `pnpm --filter docs build` exits 0

### Expected File Structure at End
```
tasks/v2-package-polish/
├── big-plan.md
├── phase-0.md
├── phase-0-validation.md
├── phase-1.md
├── phase-2.md
├── phase-3.md
├── phase-4.md
└── phase-5.md

packages/core/src/
├── types/
│   ├── target.ts                     # NEW
│   ├── step.ts                       # UPDATED (line 63)
│   └── index.ts                      # UPDATED (re-exports)
├── utils/position.ts                 # UPDATED (resolveTarget piping)
└── __tests__/types/target.test.ts    # NEW

packages/react/src/
├── components/tour/tour-step.tsx                                    # UPDATED
├── components/provider/tourkit-provider.tsx                         # UPDATED (docblock)
└── __tests__/
    ├── components/tour/tour-step.target-back-compat.test.tsx        # NEW
    └── components/provider/multi-tour-kit-compose.test.tsx          # NEW

packages/codemods/src/
├── transforms/target-to-ref.ts                                       # NEW
├── cli.ts                                                            # UPDATED
└── __tests__/
    ├── transforms/target-to-ref.test.ts                              # NEW
    └── fixtures/target-to-ref/                                       # NEW (10 files)

apps/docs/content/docs/react/
├── target-prop.mdx                   # NEW
└── meta.json                         # UPDATED (sidebar slot)
```

---

## Readiness Check

- [PASS] All inputs from prior phases listed and available — Phase 0 §3 (`TourTarget` union signature) is pasted verbatim inside the Execution Prompt; source-of-truth lines in `packages/core/src/types/step.ts` line 63, `packages/react/src/components/provider/tourkit-provider.tsx` lines 75–134, and the existing codemod template at `packages/codemods/src/transforms/from-driver.ts` are cited with file paths and line numbers.
- [PASS] Every sub-task has a clear, testable completion condition — each of 5.1, 5.2, 5.3 ends with a one-line `Sanity check` running a scoped `pnpm --filter ... test` or `pnpm --filter ... typecheck` command.
- [PASS] Execution prompt is self-contained — full project summary in §1; signed-off signature pasted inline (no "see Phase 0"); resolver function spelled out; per-file guidance has one paragraph per NEW/UPDATED file; data model rules listed (`type` not `interface`, no Zod, no new peer deps, backwards-compat sacred); confirmed library APIs include the jscodeshift skeleton and `todo-emitter` helper signature; success criteria are observable.
- [PASS] Exit criteria map 1:1 to deliverables — every NEW/UPDATED file in the deliverables tree is covered by at least one checklist line (typecheck, test, docs build, audit grep, or behaviour assertion). Codemod idempotency is explicitly listed.
- [PASS] Heavy external deps have a fake/stub strategy noted — no heavy deps in Phase 5. jsdom (Vitest default) handles `document.querySelector`. SSR test uses `globalThis.document = undefined` with restore in `afterEach`. No model/network mocking needed.
- [PASS] New libraries have a confirmed snippet from Context7 in the execution prompt — no new libraries this phase (per Phase 0 §5 peer-dep audit). `React.RefObject` is native; jscodeshift is already an existing dev dependency of `@tour-kit/codemods`; the existing `from-driver.ts` transform is cited as the structural template.

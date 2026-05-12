# Phase 0 — Repo Alignment & Gates

**Duration:** Days 1–2 (~8–10 hours)
**Depends on:** Nothing (sprint kickoff)
**Blocks:** Phase 1 (needs type-test harness), Phase 2 (needs catalog + harness), Phase 4 (needs chart-dep decision), Phase 7a (needs codemod-tool spike)
**Risk Level:** MEDIUM — small decisions cascade; getting the gates wrong forces rework across 7 downstream phases
**Stack:** typescript

---

## Objective

Remove every "we'll figure that out when we get there" question before any feature code lands. This phase resolves catalog entries, builds the `.test-d.ts` harness that Phase 1 and Phase 2 depend on, picks the chart dependency for Phase 4, locks the `DiagnosticGate` extension shape for Phase 3, and runs a one-fixture jscodeshift spike to confirm the Phase 7a tool choice (jscodeshift vs ts-morph). All five outputs are inputs to later phases — none of them is a polish task.

## What Success Looks Like

1. `pnpm install` at repo root resolves without warnings; `pnpm why jscodeshift` shows `^17.3.0` reachable from `packages/codemods/package.json` (placeholder package or root devDep, see Task 0.1).
2. `pnpm --filter @tour-kit/core typecheck:types` exits 0 against a fixture file containing `// @ts-expect-error` lines; removing one `@ts-expect-error` makes the same command exit non-zero.
3. `node packages/codemods/__spike__/run-joyride.mjs __spike__/fixtures/joyride-jsx.input.tsx` writes a `joyride-jsx.actual.tsx` next to the input, and `diff` against the committed `joyride-jsx.expected.tsx` is non-empty but parseable TSX (verifies the AST round-trip works).
4. `tasks/sprint-1-ts-first-dx/plan/phase-0-decisions.md` exists with explicit `Chart: native CSS` and `Codemod tool: jscodeshift` (or `ts-morph`) lines, each with one sentence of reasoning.
5. `DiagnosticGate` interface is committed to `packages/core/src/types/diagnostic.ts` as a type-only stub (no runtime export yet) and `pnpm --filter @tour-kit/core typecheck` exits 0.

---

## Architecture / Key Design Decisions

```
Sprint kickoff
       │
       ├── 0.1 catalog ──► pnpm-workspace.yaml is single source of truth
       ├── 0.2 harness ──► tsconfig.type-tests.json + script
       ├── 0.3 decision ─► native CSS funnel (default)
       ├── 0.4 decision ─► DiagnosticGate { id, evaluate(ctx) → GateReason }
       ├── 0.5 corpus ───► packages/codemods/__tests__/fixtures/joyride/* (≥4 patterns)
       ├── 0.6 corpus ───► shepherd/, driver/ (stretch; only if Phase 7b in scope)
       └── 0.7 spike ────► one TSX transform end-to-end → tool choice locked
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| `DiagnosticGate` extension contract | `interface` (TypeScript) | Pure structural API consumed by upper packages; no runtime validation needed |
| Phase-0 decision log | Markdown (`phase-0-decisions.md`) | Human-readable, lives in the plan dir, referenced by every downstream phase |
| Catalog dep entries | YAML in `pnpm-workspace.yaml` | Single source of truth per repo convention; also remove duplicates from `package.json#workspaces.catalog` if they drift |

**Other critical rules for this phase:**
- **No upward imports rule.** `DiagnosticGate` is declared in `@tour-kit/core` only. Do NOT import `@tour-kit/license`, `@tour-kit/scheduling`, or any other upper package — the whole point of the extension shape is to keep core at the bottom of the graph.
- **Spike is throwaway.** `__spike__/` directories must be added to `.gitignore` after the decision is logged. Don't ship spike code in the codemods package.
- **Type-test harness adds zero runtime cost.** It's a TS-only compile pass; no Vitest fixture, no test-runner dependency. Use raw `tsc --noEmit --project tsconfig.type-tests.json`.

---

## Tasks

### Task 0.1 — Pin catalog deps (0.75h)

Add only the deps this sprint actually uses. Resolve any drift between `pnpm-workspace.yaml#catalog` and the legacy `package.json#workspaces.catalog`.

```yaml
# pnpm-workspace.yaml — append to catalog:
catalog:
  jscodeshift: ^17.3.0
  '@types/jscodeshift': ^0.12.0
  jsdom-testing-mocks: ^1.13.0
```

Skip recharts unless Task 0.3 flips the default. `@playwright/test` is already a root devDep at `^1.59.1`; verify and leave it.

**Sanity check:** `pnpm install && pnpm why @types/jscodeshift` shows the catalog entry once.

---

### Task 0.2 — Type-test harness (1.5h)

**Depends on:** 0.1

Add a TS-only typecheck script that lives next to the existing one. Stay native — no `tsd`, no `expect-type` dep unless the next phases prove it necessary.

```jsonc
// packages/core/tsconfig.type-tests.json (new)
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "noEmit": true, "skipLibCheck": false },
  "include": ["src/**/*.test-d.ts", "src/types/**/*.ts", "src/lib/**/*.ts"]
}
```

```jsonc
// packages/core/package.json — add to scripts:
"typecheck:types": "tsc --noEmit --project tsconfig.type-tests.json"
```

Add a self-test fixture so the harness has something to run before Phase 1 lands:

```ts
// packages/core/src/__tests__/types/harness-selftest.test-d.ts
// Removing the `@ts-expect-error` line MUST break `pnpm typecheck:types`.
const _x: number = 'wrong'   // @ts-expect-error intentional
void _x
```

**Sanity check:** `pnpm --filter @tour-kit/core typecheck:types` exits 0. Then delete the `@ts-expect-error` line and re-run — it must exit non-zero. Restore the line.

---

### Task 0.3 — Chart dependency decision (0.25h)

**Depends on:** Nothing

The existing `AdoptionDashboard` uses native CSS bars. Phase 4 ships the funnel the same way unless product asks otherwise. Log the decision so Phase 4 doesn't relitigate it.

Write `tasks/sprint-1-ts-first-dx/plan/phase-0-decisions.md`:

```markdown
# Phase 0 decisions

## Chart dependency for AdoptionFunnel
Decision: native CSS bars (no recharts peer).
Reason: matches existing AdoptionDashboard style, keeps adoption-package
bundle flat, avoids a new optional peer.

## Codemod tool for Phase 7a
Decision: [filled in by Task 0.7]
Reason: [filled in by Task 0.7]

## Diagnostic extension contract
Decision: DiagnosticGate { id, evaluate(ctx) → GateReason } — typed-only
in @tour-kit/core. Upper packages register gates via TourProvider prop.
Reason: prevents @tour-kit/core from importing license/scheduling.
```

---

### Task 0.4 — `DiagnosticGate` extension contract (0.75h)

**Depends on:** 0.3

Declare the type stub now so Phase 3 can implement against it and so any peer package can prototype its own gate during sprint week 2. No runtime code yet — Phase 3.1 owns `EligibilityReport`, `GateReason`, etc.

```ts
// packages/core/src/types/diagnostic.ts (new — type-only stub)
export interface DiagnosticContext {
  userContext?: Record<string, unknown>
  completedTours: readonly string[]
  skippedTours: readonly string[]
  route?: { current: string; matcher: string; mode: 'exact' | 'startsWith' | 'contains' }
  targetResolver?: (selector: string) => HTMLElement | null
  // Phase 3.1 may extend this — keep it open to extension via intersection.
}

export type GateReason =
  | { ok: true; gate: string }
  | {
      ok: false
      gate: string
      code: string
      message: string
      detail?: Record<string, unknown>
    }

export interface DiagnosticGate {
  /** Stable identifier, e.g. 'license', 'scheduling'. Core uses 'structure' | 'audience' | ... */
  id: string
  /** Run synchronously OR async. Must NOT throw — return an `ok: false` reason instead. */
  evaluate: (ctx: DiagnosticContext) => GateReason | Promise<GateReason>
}
```

**Sanity check:** `pnpm --filter @tour-kit/core typecheck` exits 0. `grep -r "from '@tour-kit/license'" packages/core/src/` returns nothing.

---

### Task 0.5 — Joyride fixture corpus (3h)

**Depends on:** 0.4 (so the spike compiles against committed types)

Gather ≥4 real-world Joyride patterns covering both APIs. Each fixture is two files: `<name>.input.tsx` (the Joyride source as you'd find it in an OSS repo) and `<name>.expected.tsx` (the desired Tour Kit output).

Required coverage:
1. `joyride-jsx-basic.input.tsx` — legacy `<Joyride steps run callback />` form.
2. `joyride-jsx-callback.input.tsx` — same, but with a callback that branches on `action: 'next' | 'skip' | 'close'`.
3. `useJoyride-basic.input.tsx` — modern hook form: `const { controls, Tour } = useJoyride({ ... })`.
4. `useJoyride-onEvent.input.tsx` — hook + `onEvent` handler reading `EventData.action`, `index`, `status`.

Pull from MIT-licensed GitHub repos (search "react-joyride" in code); preserve their full filename in a header comment for attribution. Drop fixtures under `packages/codemods/__tests__/fixtures/joyride/`.

**Sanity check:** `ls packages/codemods/__tests__/fixtures/joyride/*.input.tsx | wc -l` shows ≥4.

---

### Task 0.6 — Shepherd & Driver.js corpora (2h, stretch)

**Depends on:** 0.4

Only run this task if Phase 7b is staying in scope. Otherwise skip and re-flag during sprint review.

- `packages/codemods/__tests__/fixtures/shepherd/`: ≥3 patterns covering `new Shepherd.Tour({ steps })`, `tour.addStep(...)`, `tour.start()`.
- `packages/codemods/__tests__/fixtures/driver/`: ≥3 patterns covering `driver({ steps }).drive()`, `highlight`, custom button labels.

**Sanity check:** Both directories have `≥3` input fixtures with matching expected files.

---

### Task 0.7 — Codemod tool spike (1h)

**Depends on:** 0.5

Build a throwaway one-file harness under `packages/codemods/__spike__/` that loads `joyride-jsx-basic.input.tsx`, runs a minimal jscodeshift transform (rename `Joyride` import to `TourProvider`, nothing more), and writes the actual output next to the expected file.

Use the API confirmed at memory entry #178:

```ts
// Confirmed via memory (#178, 2026-05-12). Library: jscodeshift ^17.3.0
// __spike__/transform.ts
import type { API, FileInfo } from 'jscodeshift'

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift
  const root = j(file.source)
  root
    .find(j.ImportDeclaration, { source: { value: 'react-joyride' } })
    .forEach((path) => {
      path.node.source = j.literal('@tour-kit/react')
    })
  return root.toSource({ quote: 'single' })
}
export const parser = 'tsx'
```

Drive it with `jscodeshift -t __spike__/transform.ts __spike__/fixtures/joyride-jsx.input.tsx --parser=tsx --dry --print` or a tiny Node runner. Inspect output by eye: parseable TSX, no `[object Object]`, no unexpected newline mangling.

Decision matrix:
- ✅ Output parseable, types resolve, JSX preserved → `Codemod tool: jscodeshift` in `phase-0-decisions.md`.
- ❌ Type friction, JSX whitespace corrupted, or `Collection` types resist TS strict mode → spike `ts-morph` in a separate file; pick whichever survives.

Add `__spike__/` to `.gitignore` immediately after logging the decision. Do NOT leave spike code in the codemods package.

**Sanity check:** `phase-0-decisions.md` has a non-placeholder line for "Codemod tool".

---

## Deliverables

```
tour-kit/
├── pnpm-workspace.yaml                                          # (M) catalog entries
├── packages/core/
│   ├── tsconfig.type-tests.json                                 # (+) type-test harness config
│   ├── package.json                                             # (M) add typecheck:types script
│   └── src/
│       ├── types/diagnostic.ts                                  # (+) DiagnosticGate stub
│       └── __tests__/types/harness-selftest.test-d.ts           # (+) harness smoke test
├── packages/codemods/
│   └── __tests__/fixtures/joyride/                              # (+) ≥4 input/expected pairs
│       ├── joyride-jsx-basic.{input,expected}.tsx
│       ├── joyride-jsx-callback.{input,expected}.tsx
│       ├── useJoyride-basic.{input,expected}.tsx
│       └── useJoyride-onEvent.{input,expected}.tsx
└── tasks/sprint-1-ts-first-dx/plan/
    └── phase-0-decisions.md                                     # (+) chart + tool + extension decisions
```

(Shepherd/Driver fixtures only if Task 0.6 ran.)

---

## Exit Criteria

- [ ] `pnpm install` resolves clean; `pnpm why jscodeshift` shows `^17.3.0` once.
- [ ] `pnpm --filter @tour-kit/core typecheck:types` exits 0, and removing the `@ts-expect-error` in the selftest breaks it.
- [ ] `pnpm --filter @tour-kit/core typecheck` exits 0 with the new `DiagnosticGate` stub committed.
- [ ] `phase-0-decisions.md` lists explicit Chart, Codemod-tool, and Diagnostic-extension decisions (no `[TBD]` placeholders).
- [ ] Joyride fixture directory contains ≥4 `*.input.tsx` files paired with `*.expected.tsx`.
- [ ] Spike transform's output is parseable TSX (confirmed by re-feeding through `tsc --noEmit --jsx preserve`).
- [ ] `grep -r "from '@tour-kit/license'" packages/core/src/` and `grep -r "from '@tour-kit/scheduling'" packages/core/src/` return nothing.

---

## Execution Prompt

Copy everything between the `---` lines into a fresh Claude session:

---
You are implementing Phase 0 of Tour Kit's Sprint 1 — repo alignment and gates.

### What This Project Is
Tour Kit is a headless React onboarding/product-tour monorepo (pnpm + Turborepo + tsup). Packages: `@tour-kit/core` (framework-agnostic logic), `@tour-kit/react` (components), `@tour-kit/adoption` (commercial dashboards), `@tour-kit/analytics`, `@tour-kit/license`, etc. Stack constraint: `@tour-kit/core` must sit at the BOTTOM of the dependency graph and import no other `@tour-kit/*` package.

### Established Before This Phase
- Nothing — this is the sprint kickoff. Repo state: `main` @ 38c89fb.
- `pnpm-workspace.yaml` already includes `packages/*`, `apps/*`, `tooling/*`, `examples/*` (excludes `apps/smoke`).
- Root `tsconfig.json` only paths/references `core`, `react`, `hints` — new packages need package-local config.
- `@tour-kit/core` v0.11.0 currently has zero `@tour-kit/*` imports and depends only on `clsx`/`tailwind-merge`.

### Your Goal for This Phase
Land the five gates that unblock Phases 1–7a without writing any feature code: catalog deps, type-test harness, chart-dep decision, `DiagnosticGate` type stub, and the Joyride codemod-tool spike.

### Data Model Rules (follow exactly)
- `interface` (TypeScript): `DiagnosticGate`, `DiagnosticContext`, `GateReason` — pure structural API, no Zod / no runtime validation.
- Markdown: `phase-0-decisions.md` — human-readable decision log referenced by Phase 3, 4, 7a.
- No Zod, no Pydantic, no @dataclass — this phase is config + types only.

### Architecture
- `pnpm-workspace.yaml` is the single source of truth for catalog. If `package.json#workspaces.catalog` drifts, leave it for a normalizing PR — don't expand the scope of Phase 0.
- The type-test harness uses plain `tsc --noEmit` with a separate `tsconfig.type-tests.json`. No new test-runner dep.
- The `DiagnosticGate` stub is type-only. Phase 3 owns the runtime side.
- The codemod spike code goes in `__spike__/` and is `.gitignore`d after the decision is logged.

### Confirmed Library APIs

```ts
// jscodeshift ^17.3.0 — confirmed (memory #178, 2026-05-12 via Context7 /facebook/jscodeshift)
import type { API, FileInfo } from 'jscodeshift'
export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift
  const root = j(file.source)
  // root.find(j.ImportDeclaration, { source: { value: '<from>' } })
  //   .forEach((path) => { path.node.source = j.literal('<to>') })
  return root.toSource({ quote: 'single' })
}
export const parser = 'tsx'
```

```yaml
# pnpm-workspace.yaml catalog adds (only what this sprint will consume):
catalog:
  jscodeshift: ^17.3.0
  '@types/jscodeshift': ^0.12.0
  jsdom-testing-mocks: ^1.13.0
```

### Files to Create

#### `packages/core/tsconfig.type-tests.json`
Extends `tsconfig.json` with `noEmit: true`, `skipLibCheck: false`, and `include` covering `src/**/*.test-d.ts` plus `src/types/**/*.ts` and `src/lib/**/*.ts`. Nothing else.

#### `packages/core/package.json` (modify)
Append script `"typecheck:types": "tsc --noEmit --project tsconfig.type-tests.json"`. Do not touch the existing `typecheck` script.

#### `packages/core/src/types/diagnostic.ts`
Type-only stub. Export `DiagnosticContext`, `GateReason`, and `DiagnosticGate` exactly as in Task 0.4 above. Do not export from `src/types/index.ts` yet (Phase 3 owns the public re-export). No runtime code.

#### `packages/core/src/__tests__/types/harness-selftest.test-d.ts`
Single `@ts-expect-error` line proving the harness fails when the assertion is removed. Add a TSDoc comment explaining the file exists to validate the harness.

#### `packages/codemods/__tests__/fixtures/joyride/<name>.{input,expected}.tsx`
Four pairs minimum (see Task 0.5). Each `*.input.tsx` carries a header comment with the source repo (MIT-licensed only) and the original path. Each `*.expected.tsx` shows the Tour Kit migration target — this is a planning artifact for Phase 7a, not the test runner yet.

#### `tasks/sprint-1-ts-first-dx/plan/phase-0-decisions.md`
Three sections, each with a one-line decision and a one-sentence reason: chart dep (native CSS), codemod tool (jscodeshift unless spike fails), diagnostic extension (`DiagnosticGate` interface in core).

#### `packages/codemods/__spike__/transform.ts` and `__spike__/runner.mjs`
Throwaway. The transform renames `react-joyride` → `@tour-kit/react`. The runner reads `fixtures/joyride/joyride-jsx-basic.input.tsx`, applies the transform, prints to stdout. After confirming output parses, append `__spike__/` to `packages/codemods/.gitignore` (or root `.gitignore` if the package doesn't have its own yet).

### Success Criteria
- `pnpm install` exits 0 with the catalog additions.
- `pnpm --filter @tour-kit/core typecheck:types` exits 0; removing the `@ts-expect-error` in the selftest breaks it (verify both states).
- `pnpm --filter @tour-kit/core typecheck` exits 0 with the new diagnostic.ts stub.
- `node packages/codemods/__spike__/runner.mjs` prints parseable TSX containing `@tour-kit/react`.
- `phase-0-decisions.md` has no `[TBD]` placeholders.
- `grep -rn "@tour-kit/license\|@tour-kit/scheduling" packages/core/src/` returns nothing.

### Expected File Structure at End
```
packages/core/
├── tsconfig.type-tests.json
├── package.json                (modified — typecheck:types script)
└── src/
    ├── types/diagnostic.ts     (DiagnosticContext, GateReason, DiagnosticGate)
    └── __tests__/types/harness-selftest.test-d.ts

packages/codemods/
├── .gitignore                  (contains __spike__/)
└── __tests__/fixtures/joyride/
    ├── joyride-jsx-basic.{input,expected}.tsx
    ├── joyride-jsx-callback.{input,expected}.tsx
    ├── useJoyride-basic.{input,expected}.tsx
    └── useJoyride-onEvent.{input,expected}.tsx

tasks/sprint-1-ts-first-dx/plan/
└── phase-0-decisions.md
```

---

## Readiness Check

- [PASS] All inputs from prior phases are listed and available — none (sprint kickoff).
- [PASS] Every sub-task has a clear, testable completion condition (sanity check per task + exit criteria).
- [PASS] Execution prompt is self-contained: includes (a) what the project is, (b) confirmed jscodeshift snippet from memory #178, (c) data model rules, (d) per-file guidance, (e) success criteria with exact commands.
- [PASS] Exit criteria map 1:1 to deliverables (catalog → install check; harness → typecheck command; gate stub → typecheck + grep; fixtures → file count; decisions → grep for placeholders).
- [PASS] Heavy external dep noted: jscodeshift confirmed in memory; no fake/stub needed since it runs locally.
- [PASS] New libraries (`jscodeshift`, `jsdom-testing-mocks`, `@types/jscodeshift`) have version pins in the execution prompt; jscodeshift has a confirmed code snippet inline.

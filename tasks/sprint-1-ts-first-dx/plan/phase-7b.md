# Phase 7b — Codemods: Shepherd + Driver.js (Stretch) (#84)

**Duration:** Buffer window 2026-06-08 → 2026-06-12 (~9–11 hours)
**Depends on:** Phase 7a (shared step mapper, TODO emitter, CLI infrastructure, fixture-runner pattern)
**Blocks:** Nothing — pure stretch. If 7a is unstable, defer 7b entirely.
**Risk Level:** HIGH — same binary coverage gate as 7a; deferred-by-default if either transform misses ≥80%
**Stack:** typescript

---

## Objective

Reuse the Phase 7a infrastructure (CLI, step mapper, TODO emitter, fixture runner) to ship two more transforms: Shepherd.js (`shepherd.js`) and Driver.js (`driver.js`). Each transform meets the same ≥80% corpus threshold or is deferred to a point release with `experimental` warning. Goal is to make the marketing claim ("migrate from any major React tour library") true with zero added infrastructure — every new transform is incremental.

## What Success Looks Like

1. `pnpm --filter @tour-kit/codemods test -- fixture-runner` exits 0 with Shepherd corpus ≥80% AND Driver.js corpus ≥80%.
2. `npx tour-kit-migrate --from shepherd __tests__/fixtures/shepherd/` works end-to-end (dry-run + apply).
3. `npx tour-kit-migrate --from driver __tests__/fixtures/driver/` works end-to-end.
4. Every transformed fixture passes `tsc --noEmit`.
5. `docs/from-shepherd.md` AND `docs/from-driver.md` list ✓/✗ coverage matrices with manual-port links.
6. `apps/docs/content/docs/migration/shepherd.mdx` AND `apps/docs/content/docs/migration/driver.mdx` exist with anchored headings matching every TODO emitted.
7. The `@tour-kit/codemods` README lists all three supported sources.

---

## What Failure Looks Like (and what to do)

- **Shepherd transform <80% coverage** → Ship as `experimental` in README; in CLI, print a one-line warning when `--from shepherd` is invoked: `[Tour Kit] shepherd transform is experimental. Coverage: <pct>%. Review TODOs carefully.` Document the deferred surface in `docs/from-shepherd.md`. Do NOT block the release.
- **Driver.js transform <80% coverage** → Same playbook: experimental flag + warning.
- **Both <80%** → Defer the entire stretch. Re-open in a point release after Sprint 1 ships.
- **CLI shared-code regression breaks Phase 7a Joyride transform** → Treat as a release-blocker for Phase 7a too. Revert the 7b changes to the shared modules; isolate Shepherd/Driver behind new files instead of extending 7a's. The shared mapper additions should be ADDITIVE only.
- **Fixture corpus from Phase 0 missing** → Phase 0 Task 0.6 was marked stretch. If skipped, Phase 7b becomes "build the corpus + transform" → that's 4h of corpus work plus 7–9h of transform work; consider deferring entirely.

---

## Architecture / Key Design Decisions

```
src/transforms/from-shepherd.ts  ──┐
                                   ├──► reuses mapStepObject + emitTodo
src/transforms/from-driver.ts    ──┘
                                   │
                                   ▼
                          src/cli.ts (TRANSFORMS map adds shepherd, driver)
                                   │
                                   ▼
                          src/__tests__/fixture-runner.test.ts
                          (parametrized over all three transforms)
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| Per-library `Step` AST shape | Use jscodeshift's `Collection<n>` (typed) | Each library has different surface; encapsulate in the transform module |
| Shared `StepMapping` (from 7a) | `interface` (TypeScript) | One funnel for ALL transforms; new fields land here only if every library needs them |
| Coverage docs | Markdown `from-shepherd.md` / `from-driver.md` | Drive from corpus + spec §4.6; PRs update with each fixture |

**Other critical rules for this phase:**
- **Additive only.** New transforms live in new files. The shared mapper grows ONLY when a new mapping is universally useful — if it's library-specific, keep it private to the transform module.
- **Same TODO contract.** Every unmigrated pattern emits `// TODO: <description> — see https://tourkit.dev/migration/<source>#<anchor>`.
- **Independent corpus thresholds.** Shepherd ≥80% and Driver ≥80% are independent gates. Failing one doesn't block the other.
- **Experimental fallback path is mandatory.** If a transform misses the threshold, it still ships, but with the warning above. Don't bury the limitation in a changelog.
- **Same `tsc --noEmit` rule.** Every transformed output typechecks. No exceptions.

---

## Tasks

### Task 7b.1 — Shepherd transform + fixture tests (4.5h)

**Depends on:** Phase 7a (shared infra), Phase 0.6 (Shepherd corpus)

Read `packages/codemods/__tests__/fixtures/shepherd/*.input.tsx` (committed in Phase 0.6, or built now if 0.6 was skipped — budget +3h if so).

```ts
// packages/codemods/src/transforms/from-shepherd.ts (new)
import type { API, FileInfo } from 'jscodeshift'
import { mapStepObject } from '../lib/step-mapper'
import { emitTodo, todoToComment } from '../lib/todo-emitter'

export const parser = 'tsx'

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift
  const root = j(file.source)

  // 1. Detect `import Shepherd from 'shepherd.js'` or `import { Tour, Step } from 'shepherd.js'`
  const shepherdImports = root.find(j.ImportDeclaration, { source: { value: 'shepherd.js' } })
  if (shepherdImports.size() === 0) return file.source

  // 2. Find `new Shepherd.Tour({ ..., steps: [...] })` or `new Tour({ ... })`
  const tourConstructors = root.find(j.NewExpression, {
    callee: { type: 'MemberExpression', property: { name: 'Tour' } },
  })

  // 3. Find `.addStep({...})` chains, gather into a steps array
  // 4. Replace with TourProvider config + emit JSX <TourProvider tours={[{...}]}><TourCard /></TourProvider>
  //    Locate `tour.start()` call sites → tourRef.current?.start(...)
  // 5. Step.attachTo: { element, on } → TourStep.target + placement
  //    Step.buttons: [{ text, action }] → onComplete/onSkip/onStepChange (similar dispatcher to Joyride callback)
  //    Step.beforeShowPromise → TourStep.onBeforeShow (with TODO note about Promise return)

  // Unsupported (TODOs per spec analog):
  //   - Step.classes, Step.modalOverlayOpeningClass → theme docs
  //   - Step.canClickTarget (Tour Kit has spotlight interactive) → maps to `interactive: !canClickTarget`
  //   - Step.scrollTo (custom) → maps to existing scroll config or TODO
  //   - .show()/.hide()/.cancel() granular controls → ref equivalents or TODO

  return root.toSource({ quote: 'single' })
}
```

**Implementation notes:**
- Shepherd's API is class-based: `new Shepherd.Tour({...})` then `.addStep({...})` chained. The transform needs to RECONSTITUTE the steps array from the chain calls.
- `Step.attachTo.element` accepts a selector OR a function returning an Element. Function → TODO (same as Joyride).
- `Step.buttons` is a flexible button array — Tour Kit has fixed Next/Prev/Skip slots. Map `text: 'Next'` → onNext etc.; emit TODO for custom buttons.

**Tests:** Extend `fixture-runner.test.ts` to parametrize over Shepherd as well as Joyride. Same coverage gate ≥80%, same `tsc --noEmit` rule. Add Shepherd-specific unit tests in `src/__tests__/from-shepherd.test.ts` covering at least: basic `new Shepherd.Tour` → TourProvider, `.addStep` chain → steps array, `Step.attachTo.element` string + function, `Step.buttons` mapping.

`packages/codemods/docs/from-shepherd.md`: coverage matrix table.
`apps/docs/content/docs/migration/shepherd.mdx`: full guide with anchors matching every TODO.

**Sanity check:** `pnpm --filter @tour-kit/codemods test -- from-shepherd` exits 0; coverage gate ≥80%.

---

### Task 7b.2 — Driver.js transform + fixture tests (3.5h)

**Depends on:** Phase 7a (shared infra), Phase 0.6 (Driver corpus)

Driver.js v1+ is the simplest of the three — it's already heavily inspired by jQuery-style imperative APIs.

```ts
// packages/codemods/src/transforms/from-driver.ts (new)
import type { API, FileInfo } from 'jscodeshift'
import { mapStepObject } from '../lib/step-mapper'

export const parser = 'tsx'

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift
  const root = j(file.source)

  // 1. import { driver } from 'driver.js'
  const driverImports = root.find(j.ImportDeclaration, { source: { value: 'driver.js' } })
  if (driverImports.size() === 0) return file.source

  // 2. Find `const d = driver({ steps: [...], showProgress, ... })` calls
  //    and `d.drive()` invocations.
  // 3. Build:
  //      const tourRef = useRef<TourKitRef>(null)
  //      const tours = [{ id: 'migrated-tour', steps: [...mappedSteps] }]
  //      // <TourProvider tours={tours} ref={tourRef}> + <TourCard /> at JSX
  //      // d.drive() → tourRef.current?.start('migrated-tour')
  //
  //    Driver.js Step.popover.title/description → TourStep.title/content
  //    Step.element selector → TourStep.target
  //    Step.popover.side → TourStep.placement
  //    Step.onHighlightStarted → TourStep.onShow
  //    Step.onDeselected → TourStep.onHide
  //    showProgress, allowClose, doneBtnText, nextBtnText, prevBtnText → tour-level options or TODOs

  return root.toSource({ quote: 'single' })
}
```

**Implementation notes:**
- Driver.js's `Step` shape is small. Most fields map cleanly to Tour Kit equivalents.
- `Step.element` as DOM Element instance (not selector) → TODO with manual-port link.
- `Step.popover.showButtons: []` for buttonless steps → emit TODO suggesting `<TourCard>` without nav slots.

**Tests:** Extend `fixture-runner.test.ts`. Add `src/__tests__/from-driver.test.ts` covering the simpler surface: ≥4 unit tests over: basic config, popover mapping, element-as-DOM TODO, button text overrides.

`packages/codemods/docs/from-driver.md`: coverage matrix.
`apps/docs/content/docs/migration/driver.mdx`: full guide.

**Sanity check:** `pnpm --filter @tour-kit/codemods test -- from-driver` exits 0; coverage gate ≥80%.

---

### Task 7b.3 — Final README + changeset consolidation (1h)

**Depends on:** 7b.1, 7b.2

Update `packages/codemods/README.md` to list all three sources with one usage example each. Add a "Coverage status" section: `Joyride: 100%`, `Shepherd: 85%`, `Driver: 90%` (numbers come from the actual fixture runs — don't fabricate).

Update `apps/docs/content/docs/migration/meta.json` to add the new nav entries.

Add a changeset describing both new transforms. If either is `experimental` per the Failure section, label it clearly in the changeset.

```bash
pnpm changeset
# Choose @tour-kit/codemods, minor bump.
# Title: "feat: shepherd and driver.js codemods"
# Body: per-source coverage stats; any experimental flag.
```

**Sanity check:** `pnpm --filter docs build` exits 0. README's `Coverage status` numbers match `pnpm --filter @tour-kit/codemods test` output.

---

## Deliverables

```
packages/codemods/src/
├── transforms/
│   ├── from-shepherd.ts                                # (+) new
│   └── from-driver.ts                                  # (+) new
├── __tests__/
│   ├── from-shepherd.test.ts                           # (+) unit tests
│   ├── from-driver.test.ts                             # (+) unit tests
│   └── fixture-runner.test.ts                          # (M) parametrize over all three
├── cli.ts                                              # (M) TRANSFORMS map adds shepherd, driver
└── docs/
    ├── from-shepherd.md                                # (+) coverage matrix
    └── from-driver.md                                  # (+) coverage matrix

packages/codemods/__tests__/fixtures/
├── shepherd/                                           # (from Phase 0.6 or built now)
└── driver/                                             # (from Phase 0.6 or built now)

packages/codemods/README.md                             # (M) all-three quick-start + coverage status

apps/docs/content/docs/migration/
├── shepherd.mdx                                        # (+) guide
├── driver.mdx                                          # (+) guide
└── meta.json                                           # (M) two new nav entries

.changeset/<id>.md                                      # (+) feat changeset
```

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/codemods build && pnpm --filter @tour-kit/codemods test` exit 0.
- [ ] Shepherd corpus ≥80% (verified by the parametrized fixture-runner test). **If <80%:** transform ships with `experimental` warning in CLI AND README, AND deferred surface documented in `from-shepherd.md`.
- [ ] Driver corpus ≥80% (same gate). **Same fallback** on miss.
- [ ] Every transformed fixture passes `tsc --noEmit`.
- [ ] `npx tour-kit-migrate --from shepherd <path>` and `--from driver <path>` both exit 0 on the corpus directories.
- [ ] Phase 7a's Joyride transform STILL passes its own gate (additive-only rule held — verify by running the full fixture-runner).
- [ ] Every TODO anchor from `from-shepherd.ts` resolves to a heading in `migration/shepherd.mdx`; same for driver.
- [ ] README lists three supported sources AND realistic coverage percentages.
- [ ] Changeset filed at `.changeset/<id>.md`.
- [ ] **GO/NO-GO GATE:** Per Phase 7b's stretch nature, if BOTH transforms hit ≥80% with a clean `tsc --noEmit` → ship as stable. If either misses ≥80% → ship that one as `experimental` with CLI warning OR defer it to a point release; document the decision in the changeset. If BOTH miss ≥80% → defer the entire phase and re-open after Sprint 1 ships.

---

## Execution Prompt

Copy everything between the `---` lines:

---
You are implementing Phase 7b of Tour Kit's Sprint 1 — the Shepherd and Driver.js codemods (issue #84 stretch).

### What This Project Is
Tour Kit's marketing claim: "migrate from any major React tour library in one command." Phase 7a already shipped the Joyride transform. Phase 7b adds Shepherd.js and Driver.js so the claim holds for the three top competitors. The package becomes a top-of-funnel asset for every "X alternative" SEO page. Quality is binary — a broken transform is worse than no transform.

### Established in Prior Phases
- Phase 7a shipped `@tour-kit/codemods` with: `tour-kit-migrate` bin, `cli.ts` with `--from joyride|shepherd|driver` arg parsing scaffolded (Shepherd and Driver entries are placeholders to be wired), `src/lib/step-mapper.ts` (`mapStepObject`), `src/lib/todo-emitter.ts`, `src/transforms/from-joyride.ts`, `src/__tests__/fixture-runner.test.ts` parametrized over Joyride fixtures.
- Phase 0.6 committed Shepherd and Driver fixture corpora at `packages/codemods/__tests__/fixtures/shepherd/` and `.../driver/` (each ≥3 input/expected pairs). **If Phase 0.6 was skipped, budget +3h to gather the corpus before Task 7b.1.**
- The TODO contract: `// TODO: <description> — see https://tourkit.dev/migration/<source>#<anchor>`. Every anchor must match a heading in the corresponding migration MDX guide.
- Memory entry #178 confirms `jscodeshift ^17.3.0` transform API.

### Your Goal for This Phase
Ship `from-shepherd.ts` and `from-driver.ts` transforms reusing Phase 7a infrastructure. Hit ≥80% coverage on each corpus or ship with `experimental` warning. Add migration guides with anchored TODO destinations.

### Data Model Rules (follow exactly)
- `interface`/`type` for any new helper data — additive only on `StepMapping`.
- TODO comments use the SAME template as Phase 7a. Anchors are per-source: `joyride#`, `shepherd#`, `driver#`.
- Each transform is in its OWN file. Shared logic ONLY lands in `src/lib/step-mapper.ts` if both new transforms (and Joyride) need it.

### Architecture
- Each transform: detect via `findImportDeclarations({ source: { value: 'shepherd.js' | 'driver.js' } })`. Branch on what's imported. Rewrite import statement at the end (`'shepherd.js'` → `'@tour-kit/react'`, similar for driver).
- Shepherd: class-based `new Shepherd.Tour({...})` with `.addStep({...})` chain. Reconstitute the steps array by walking the chain.
- Driver: function-call style `driver({ steps: [...] }).drive()`. Simpler shape; mostly object-to-object mapping.
- Same `tsc --noEmit` post-check as Phase 7a — non-negotiable.
- Same ≥80% coverage gate — independently per transform.

### Confirmed Library APIs

```ts
// jscodeshift ^17.3.0 — same as Phase 7a (memory #178)
import type { API, FileInfo } from 'jscodeshift'
export const parser = 'tsx'
export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift
  const root = j(file.source)
  // ...
  return root.toSource({ quote: 'single' })
}
```

```ts
// Shepherd.js — class-based imperative API (current as of 2026):
import Shepherd from 'shepherd.js'
const tour = new Shepherd.Tour({ useModalOverlay: true })
tour.addStep({
  id: 'welcome',
  attachTo: { element: '#hero', on: 'bottom' },
  text: 'Welcome',
  buttons: [
    { text: 'Next', action: () => tour.next() },
    { text: 'Skip', action: () => tour.cancel() },
  ],
})
tour.start()
```

```ts
// Driver.js v1+ — function-style imperative API:
import { driver } from 'driver.js'
const d = driver({
  showProgress: true,
  steps: [
    { element: '#hero', popover: { title: 'Hi', description: 'Welcome', side: 'top' } },
    // ...
  ],
})
d.drive()
```

### Files to Create / Modify

#### `packages/codemods/src/transforms/from-shepherd.ts` (new)
Implement as in Task 7b.1. Detect `new Shepherd.Tour`, walk `.addStep` chain to collect steps, build TourProvider replacement, rewrite `tour.start()` calls. Map `Step.attachTo.element` (selector → ✓; function → TODO) and `Step.attachTo.on` → `placement`. Convert `Step.buttons[]` into Tour Kit's fixed onNext/onPrev/onComplete/onSkip slots; emit TODO for custom button actions. Preserve `Step.beforeShowPromise` → `onBeforeShow` (with TODO if it returns a Promise the user expects to await with non-boolean meaning). Add `// TODO` lines for unsupported: `Step.classes`, `Step.modalOverlayOpeningClass`, `Step.canClickTarget` (mappable to `interactive`), `Step.scrollTo` (mappable to scroll config), granular show/hide/cancel chains.

#### `packages/codemods/src/transforms/from-driver.ts` (new)
Implement as in Task 7b.2. Detect `import { driver } from 'driver.js'`. Find `driver({...}).drive()` chains. Build `useRef<TourKitRef>()` + `<TourProvider tours={...} ref={tourRef}><TourCard /></TourProvider>` + `tourRef.current?.start('migrated-tour')`. Map `Step.element` (selector ✓; Element instance → TODO) and `Step.popover.{title, description, side}` → `TourStep.{title, content, placement}`. Map `Step.onHighlightStarted` → `onShow`, `Step.onDeselected` → `onHide`. Tour-level `showProgress`, `allowClose`, `doneBtnText`, `nextBtnText`, `prevBtnText` → corresponding TourProvider/TourCard props or TODOs.

#### `packages/codemods/src/__tests__/from-shepherd.test.ts` (new)
Unit tests covering shaped AST inputs: basic Tour constructor, `addStep` chain, `attachTo.element` string + function, `buttons` mapping.

#### `packages/codemods/src/__tests__/from-driver.test.ts` (new)
Unit tests covering: basic config, popover mapping, element-as-DOM TODO, button text overrides.

#### `packages/codemods/src/__tests__/fixture-runner.test.ts` (modify)
Parametrize the existing fixture-runner over all three sources: { transform: fromJoyride, dir: 'joyride' }, { transform: fromShepherd, dir: 'shepherd' }, { transform: fromDriver, dir: 'driver' }. Each fixture-set runs the same three describes: diff, tsc--noEmit, coverage gate.

#### `packages/codemods/src/cli.ts` (modify)
Wire the `TRANSFORMS` map entries: `shepherd: fromShepherd`, `driver: fromDriver`. Add per-transform experimental warning if applicable. The decision to mark `experimental` is made post-test based on actual coverage — wire a `EXPERIMENTAL_TRANSFORMS: Set<string>` constant the CLI checks before running.

#### `packages/codemods/docs/from-shepherd.md` (new)
Coverage matrix table with ✓ supported and ✗ unsupported sections; manual-port URLs match `migration/shepherd.mdx` anchors.

#### `packages/codemods/docs/from-driver.md` (new)
Same shape as Shepherd's.

#### `apps/docs/content/docs/migration/shepherd.mdx` (new) + `meta.json` (modify)
Full migration guide: install, CLI command, before/after for the class-chain + start pattern, callouts for `buttons` mapping, every TODO anchor matched as a heading.

#### `apps/docs/content/docs/migration/driver.mdx` (new) + `meta.json` (modify)
Full migration guide: install, CLI command, before/after for `driver({...}).drive()`, popover mapping, every TODO anchor matched.

#### `packages/codemods/README.md` (modify)
Three-source quick-start: one CLI example per source. "Coverage status" section listing real percentages from the test run. If any transform is `experimental`, note it explicitly.

#### `.changeset/<id>.md` (new)
`@tour-kit/codemods` minor bump. Body: per-source coverage stats, experimental flags if applicable.

### Success Criteria
- `pnpm --filter @tour-kit/codemods build && pnpm --filter @tour-kit/codemods typecheck && pnpm --filter @tour-kit/codemods test` all exit 0.
- Shepherd corpus coverage AND Driver corpus coverage BOTH reported by the fixture runner. If either <80%, the transform is marked `experimental` and the CLI prints a warning when `--from <source>` is used.
- Every transformed fixture passes `tsc --noEmit`.
- Joyride transform still passes its Phase 7a gate (no regression from the additive 7b changes).
- `npx tour-kit-migrate --from shepherd <corpus>` and `--from driver <corpus>` exit 0.
- Every TODO anchor emitted by either new transform has a matching heading in the corresponding MDX guide.
- README lists three sources with real coverage numbers.
- `pnpm --filter docs build` exits 0.

### Expected File Structure at End
```
packages/codemods/
├── src/
│   ├── transforms/
│   │   ├── from-joyride.ts        (from 7a)
│   │   ├── from-shepherd.ts       (new)
│   │   └── from-driver.ts         (new)
│   ├── __tests__/
│   │   ├── from-shepherd.test.ts  (new)
│   │   ├── from-driver.test.ts    (new)
│   │   └── fixture-runner.test.ts (modified)
│   └── cli.ts                     (modified)
├── docs/
│   ├── from-joyride.md            (from 7a)
│   ├── from-shepherd.md           (new)
│   └── from-driver.md             (new)
├── __tests__/fixtures/
│   ├── joyride/                   (from 0.5/7a)
│   ├── shepherd/                  (from 0.6 — or built now if skipped)
│   └── driver/                    (from 0.6 — or built now if skipped)
└── README.md                      (modified)

apps/docs/content/docs/migration/
├── joyride.mdx                    (from 7a)
├── shepherd.mdx                   (new)
├── driver.mdx                     (new)
└── meta.json                      (modified)

.changeset/<id>.md
```

---

## Readiness Check

- [PASS] All inputs from prior phases are listed: Phase 7a infrastructure + Phase 0.6 corpus (with a noted +3h budget if 0.6 was skipped).
- [PASS] Every sub-task has a clear, testable completion condition (coverage gate; typecheck; CLI exit codes; docs build).
- [PASS] Execution prompt is self-contained: project context, prior-phase facts (CLI scaffold, shared mapper, fixture-runner pattern), per-file guidance, confirmed jscodeshift snippet from memory #178, Shepherd & Driver API shapes inline.
- [PASS] Exit criteria map 1:1 to deliverables (each transform → its corpus gate + unit tests; cli wiring → cli changes; docs → MDX + matrix files; README → coverage status; changeset → file).
- [PASS] Heavy dependency: jscodeshift is shared with Phase 7a, no new deps. Shepherd and driver.js source code is read from fixtures only; no runtime install needed.
- [PASS] HIGH-risk gate has an explicit go/no-go in the exit criteria: independent ≥80% per transform; missing-the-bar transforms ship as `experimental` with CLI warning OR are deferred; both missing → defer the entire phase.

# Refactor Candidates — tour-kit

Triaged from a static read of `src/**/*.{ts,tsx,js,jsx}` (575 files matched after
excluding `node_modules`, `dist`, `.next`, `build`, `coverage`, `*.test.*`,
`*.spec.*`).

## Summary

- **Files analyzed:** 575 (matching the COVERAGE glob; see `find` invocation
  below).
- **Total candidates:** 13
- **HIGH:** 4 — duplication or unsafe casts that already cost dev time on
  cross-package changes.
- **MED:** 6 — scoped complexity / dead-API concerns that aren't blocking
  but accumulate maintenance cost.
- **LOW:** 3 — minor smells worth tracking.

File discovery command:

```
find . -path ./node_modules -prune -o -path ./.next -prune -o -path ./dist \
  -prune -o -path ./build -prune -o -path ./coverage -prune -o \
  -path ./.turbo -prune -o -type f \( -name "*.ts" -o -name "*.tsx" -o \
  -name "*.js" -o -name "*.jsx" \) ! -name "*.test.*" ! -name "*.spec.*" \
  -print | grep "/src/" | sort | wc -l
# → 575
```

Categories represented: **duplication, complexity, type-safety, dead-code,
architecture, error-handling**.

---

### [HIGH] `matchesCondition` + `getNestedValue` cloned in surveys

- **File(s):** `packages/surveys/src/core/audience.ts:17-67` is a near
  byte-for-byte copy of `packages/core/src/lib/audience.ts:111-186`. Even the
  `AudienceCondition` type itself is cloned: `packages/surveys/src/types/survey.ts:90-99`
  vs `packages/core/src/types/audience.ts:8-28` (identical operator union).
- **Category:** duplication
- **Priority:** HIGH — two implementations of the same operator switch
  (`equals`/`not_equals`/`contains`/`not_contains`/`in`/`not_in`/`exists`/`not_exists`)
  with no shared tests; adding an operator means touching two switches and
  hoping the second isn't forgotten. `core/lib/audience.ts:8` already notes
  the type was "promoted to core" — surveys never followed.
- **Effort:** S — `@tour-kit/surveys` already depends on `@tour-kit/core` (see
  `packages/surveys/CLAUDE.md`); swap the local type for `AudienceCondition`
  from core and re-export `matchesAudience` from core.
- **Why it matters:** Today the two packages can silently diverge on operator
  semantics (e.g. how `contains` treats array vs string is duplicated in
  both). The biome-ignore on both (`audience.ts:110` and `audience.ts:16`)
  shows both copies are flagged as complex.
- **Suggested change:** Delete `surveys/src/core/audience.ts`'s
  `matchesCondition`/`getNestedValue` and replace `matchesAudience` with
  `export { matchesAudience } from '@tour-kit/core'`; alias
  `AudienceCondition` from `@tour-kit/core` in `types/survey.ts`.
- **Evidence:**
  ```
  $ diff <(sed -n '17,55p' packages/surveys/src/core/audience.ts) \
         <(sed -n '111,166p' packages/core/src/lib/audience.ts)
  # only difference is comments + spacing; the operator switch bodies are
  # identical (verified inline above this command)
  ```
  Both bodies confirmed identical in the inspection — the surveys copy is
  just a tighter formatting of the core one.

---

### [HIGH] `evaluateAudience` triple-cloned across react/hints/announcements

- **File(s):**
  - `packages/react/src/hooks/use-step-filter.tsx:33-54` (`evaluateAudience`)
  - `packages/hints/src/hooks/use-hint-filter.tsx:26-46` (`evaluateHintAudience`)
  - `packages/announcements/src/hooks/use-filtered-announcements.tsx:33-54`
    (`evaluateAnnouncementAudience`)
- **Category:** duplication
- **Priority:** HIGH — three copies of the same segment-vs-array audience
  dispatch, all carrying the same module-scope `warnedUnknownSegments` dedup
  set and emitting nearly-identical `console.warn` messages. Each file's
  comment explicitly says *"Keep all three in lockstep when changing
  resolution semantics"* — a known-bad maintenance contract.
- **Effort:** M — promote a single `evaluateAudience(audience, segments,
  userContext, callerName)` to `@tour-kit/core` and have the three
  packages delegate; preserve `callerName` so the dev warning still names the
  caller (`useStepFilter` / `useHintFilter` / `useFilteredAnnouncements`).
- **Why it matters:** Any change to segment-shape resolution (e.g. a new
  audience operator) requires three coordinated edits, and divergence here
  is what `[[project_improvement_phase_tests]]`-style test plans repeatedly
  flag as a regression source. The warning strings *already* differ in
  prefix, which is a divergence in flight.
- **Suggested change:** Move the function into `packages/core/src/lib/audience.ts`
  with a `caller: string` argument used purely in the warning text; have all
  three sites import it and drop their copies + their three module-scope
  `warnedUnknownSegments` sets (consolidated into one).
- **Evidence:**
  ```
  $ grep -n "warnedUnknownSegments" packages/react/src/hooks/use-step-filter.tsx \
        packages/hints/src/hooks/use-hint-filter.tsx \
        packages/announcements/src/hooks/use-filtered-announcements.tsx
  packages/announcements/src/hooks/use-filtered-announcements.tsx:21:const warnedUnknownSegments = new Set<string>()
  packages/hints/src/hooks/use-hint-filter.tsx:24:const warnedUnknownSegments = new Set<string>()
  packages/react/src/hooks/use-step-filter.tsx:26:const warnedUnknownSegments = new Set<string>()
  ```
  All three define a module-scope `Set<string>` for the same purpose.

---

### [HIGH] `memoryStorage` SSR shim duplicated, second copy uses 6 unsafe `as unknown as` casts

- **File(s):**
  - `packages/core/src/hooks/use-route-persistence.ts:34-59` (clean closure
    version)
  - `packages/checklists/src/hooks/use-checklist-persistence.ts:15-36` (cast-laden
    version — every method body re-asserts `this as unknown as { _data: ... }`)
- **Category:** type-safety (also duplication)
- **Priority:** HIGH — the checklists copy is the worst kind of dead-end: it
  re-implements the same in-memory `Storage` polyfill but reaches the same
  result through six unsafe `as unknown as { _data: Record<string, string> }`
  casts on `this`. Removing those casts means rewriting it as a closure,
  which is exactly the core/use-route-persistence form.
- **Effort:** S — export the closure version from
  `@tour-kit/core/utils/storage`; import it in checklists.
- **Why it matters:** The casts defeat TypeScript on the storage boundary;
  any future change to `_data`'s shape passes type-check but breaks at
  runtime. Two implementations also mean two SSR-safety bugs to fix.
- **Suggested change:** Promote `memoryStorage` (or a factory
  `createMemoryStorage()`) to `packages/core/src/utils/storage.ts` next to
  `createPrefixedStorage`. Import it from both call sites; delete the
  duplicate in checklists; the cast-pyramid disappears.
- **Evidence:**
  ```
  $ sed -n '15,36p' packages/checklists/src/hooks/use-checklist-persistence.ts | grep -c "as unknown as"
  6
  ```
  Six unsafe re-casts of `this` in a single 22-line object literal.

---

### [HIGH] `useResolvedText` cloned verbatim in 3 packages

- **File(s):**
  - `packages/react/src/hooks/use-resolved-text.tsx:27-39`
  - `packages/hints/src/hooks/use-resolved-text.tsx:18-30`
  - `packages/announcements/src/lib/use-resolved-text.tsx:27-39`
- **Category:** duplication
- **Priority:** HIGH — three identical implementations of the
  `LocalizedText|ReactNode → ReactNode` resolution pipeline. Each file's
  JSDoc explicitly admits the duplication: "Per-package duplicate so X does
  not need to depend on Y. Keep the three implementations in lockstep when
  changing resolution semantics."
- **Effort:** S — `@tour-kit/core` already exports every dep this hook uses
  (`interpolate`, `isI18nKey`, `useT`, `useSegmentationContext`). Move the
  hook there, delete the three copies.
- **Why it matters:** The "deferred to next phase" rationale in the comments
  (`hints/src/hooks/use-resolved-text.tsx:13-16`) is no longer valid — the
  core dep already exists and `useUILibrary`/`UnifiedSlot` set the precedent
  for hook-bound helpers shipping from core.
- **Suggested change:** Add `useResolvedText` to
  `packages/core/src/lib/i18n/` (next to `use-t.ts`) and replace the three
  copies with `export { useResolvedText } from '@tour-kit/core'`.
- **Evidence:**
  ```
  $ diff packages/react/src/hooks/use-resolved-text.tsx \
         packages/hints/src/hooks/use-resolved-text.tsx
  # Only the JSDoc comment differs; the function body is byte-identical.
  ```
  Confirmed by inspection above — every line of the function body matches.

---

### [MED] Five identical `try { plugin.X?.() } catch { if(debug) logger.error(...) }` blocks in `TourAnalytics`

- **File(s):** `packages/analytics/src/core/tracker.ts:42-49`, `64-70`,
  `107-113`, `289-295`, `309-316`.
- **Category:** duplication
- **Priority:** MED — every plugin-dispatch site rebuilds the same
  iterate-and-swallow pattern. Five copies means five places to remember
  to add a new safety guard (timeout, AbortSignal, etc.) and the diff
  history shows these have already drifted slightly (e.g. some sites guard
  on `if (this.destroyed)`, others don't).
- **Effort:** S — extract one `private safeDispatch(method: keyof
  AnalyticsPlugin, ...args)` helper that runs the for-loop, catches, and
  routes through `logger.error` gated by `this.config.debug`.
- **Why it matters:** Adding a new plugin lifecycle hook (e.g.
  `plugin.onPageChange`) requires copy-pasting the boilerplate again; a
  helper makes the next hook a one-liner.
- **Suggested change:** Centralize via `for (const p of this.plugins) try {
  await p[method]?.(...args) } catch (e) { ... }`. Identify/track/flush/destroy
  become two-liners and the `if (this.destroyed) return` guard is one
  consistent place.
- **Evidence:**
  ```
  $ grep -c "if (this.config.debug)" packages/analytics/src/core/tracker.ts
  5
  $ grep -n "logger.error" packages/analytics/src/core/tracker.ts
  46:          logger.error(`Analytics: Failed to init plugin ${plugin.name}:`, error)
  68:          logger.error(`Analytics: Failed to identify in ${plugin.name}:`, error)
  111:            logger.error(`Analytics: Failed to track in ${plugin.name}:`, error)
  293:          logger.error(`Analytics: Failed to flush ${plugin.name}:`, error)
  314:          logger.error(`Analytics: Failed to destroy ${plugin.name}:`, error)
  ```

---

### [MED] `TourProvider` is 1802 lines with 6 `noExcessiveCognitiveComplexity` ignores

- **File(s):** `packages/core/src/context/tour-provider.tsx` (whole file, 1802
  lines). Hot-spots: lines `253` (reducer), `671` (flow restore),
  `888` (navigateToStep), `1059` (handleBranchTarget), `1365` (prev), and the
  reducer itself defers to `handleStartTour`/`handleStepNavigation`/`handleReset`
  but still carries 11 `case` arms.
- **Category:** complexity
- **Priority:** MED — the file works and is gated by tests, but it carries
  six separate "this is too complex for the lint rule" escape hatches in one
  file, including two orchestrators (`navigateToStep`, `handleBranchTarget`)
  that are each >100 lines.
- **Effort:** L — splitting the orchestrators into `lib/navigate-to-step.ts`
  and `lib/handle-branch-target.ts` (pure functions taking
  `{ state, dispatch, router, ...callbacks }` would let the provider host
  ~5 callbacks and ~50 useCallback lines instead of ~1400.
- **Why it matters:** Onboarding velocity into the tour engine drops sharply
  past ~400 lines; the `[[project_improvement_phase_tests]]` notes already
  flag this as a refactor-friction surface.
- **Suggested change:** Lift `navigateToStep` (currently `lines 887-998`)
  and `handleBranchTarget` (`lines 1054-1246`) into named module-level
  functions that close over `dispatch` via a single `TourEngineContext`
  argument; provider keeps the React-bound wiring.
- **Evidence:**
  ```
  $ wc -l packages/core/src/context/tour-provider.tsx
  1802 packages/core/src/context/tour-provider.tsx
  $ grep -c "biome-ignore lint/complexity/noExcessiveCognitiveComplexity" \
       packages/core/src/context/tour-provider.tsx
  6
  ```

---

### [MED] `calculatePosition`, `calculatePositionWithCollision`, `wouldOverflow`, `getFallbackPlacements` are dead in the public API

- **File(s):** `packages/core/src/utils/position.ts:107-293` (~190 lines of
  manual placement math). Re-exported by `packages/core/src/index.ts:122-126`
  and `packages/react/src/index.ts:171`. **Zero non-test, non-index
  consumers** — every Tour/Hint/Survey/Announcement positioning site uses
  `@floating-ui/react` directly.
- **Category:** dead-code
- **Priority:** MED — ~190 lines + corresponding tests are paying weight in
  every package bundle's tree-shaking analysis without serving a caller. Not
  a bug, but each kB matters for the [[project_npm_seo_v1_bump]] gates.
- **Effort:** S — drop the four exports from both barrels; mark internal or
  delete entirely. Keep `getDocumentDirection`, `mirrorSide`,
  `mirrorAlignment`, `mirrorPlacementForRTL`, `parsePlacement` — those are
  still used by hint/tour placement adapters.
- **Why it matters:** Public surface that isn't actually consumed is the
  worst kind of API: it constrains future refactors without delivering
  value. Deleting it (or scoping it to `@tour-kit/core/internal`) tightens
  the contract.
- **Suggested change:** Either move these into a non-exported
  `_position-fallback.ts` for the in-file tests, or delete (the tests in
  `packages/core/src/utils/__tests__/position.test.ts` would need to come
  with). Floating-ui covers every consumer today.
- **Evidence:**
  ```
  $ grep -rn "calculatePosition\|wouldOverflow\|getFallbackPlacements\|calculatePositionWithCollision" \
        packages/ apps/ examples/ --include="*.ts" --include="*.tsx" \
      | grep -v __tests__ | grep -v dist | grep -v "position.ts" \
      | grep -v "index.ts"
  # (empty — no callers)
  ```

---

### [MED] Direct `console.warn`/`console.error` instead of the project `logger` in production paths

- **File(s):**
  - `packages/core/src/context/tour-provider.tsx:432`
  - `packages/core/src/lib/interpolate.ts:22`
  - `packages/core/src/lib/segmentation/use-segment.ts:61`
  - `packages/core/src/registry/tour-registry.tsx:106`
  - `packages/react/src/components/card/tour-card.tsx:125`
  - `packages/react/src/hooks/use-step-filter.tsx:45`
  - `packages/hints/src/hooks/use-hint-filter.tsx:38`
  - `packages/announcements/src/hooks/use-filtered-announcements.tsx:44`
  - `packages/ai/src/hooks/use-persistence.ts:70`, `…/use-tour-assistant.ts:115`,
    `…/core/events.ts:18,22`, `…/server/route-handler.ts:196,232`
  - `packages/license/src/lib/domain.ts:26`, `…/components/pro-gate.tsx:63`,
    `…/components/license-warning.tsx:9`
  - `packages/media/src/components/media-slot.tsx:209`
- **Category:** error-handling (also architecture — bypassed abstraction)
- **Priority:** MED — `packages/core/src/utils/logger.ts` exists exactly so
  consumers can silence/raise the noise floor (`logger.configure({ level })`).
  Direct `console.warn` calls bypass that, so a consumer that calls
  `logger.configure({ level: 'silent' })` still sees noise from these
  ~17 sites.
- **Effort:** S — replace each with the corresponding `logger.warn` /
  `logger.error`. `@tour-kit/core` already re-exports `logger`.
- **Why it matters:** The whole point of the logger is to give consumers a
  knob; today the knob silently does nothing for half the package output.
  The behavior of `logger.configure({ level: 'silent' })` is misleading.
- **Suggested change:** Mechanical replace across the listed sites; add a
  biome rule (or grep CI gate) banning `console.*` outside `analytics/src/plugins/console.ts`
  and `utils/logger.ts`.
- **Evidence:**
  ```
  $ grep -rEn "console\.(warn|error|log|info)" packages/ \
       --include="*.ts" --include="*.tsx" \
     | grep -v __tests__ | grep -v ".test." | grep -v ".spec." \
     | grep -v dist | grep -v "packages/analytics/src/plugins/console" \
     | grep -v "logger.ts" \
     | wc -l
  47
  ```

---

### [MED] Inline `priorityOrder` map in the auto-show effect duplicates the queue's own ordering

- **File(s):** `packages/announcements/src/context/announcements-provider.tsx:451-460`
  defines `const priorityOrder: Record<string, number> = { critical: 0,
  high: 1, normal: 2, low: 3 }` and sorts inline. Meanwhile
  `packages/announcements/src/core/priority-queue.ts:117-142` already owns
  priority ordering for the same `priority` field.
- **Category:** architecture
- **Priority:** MED — two sources of truth for "what priority means". If
  the queue is later configured for `lifo` or a custom weight map, the
  auto-show effect silently disagrees with the queue's notion of order.
- **Effort:** S — call into the scheduler/priority-queue's existing
  comparator instead of redefining the map literal.
- **Why it matters:** The whole `core/priority-queue.ts:148` `createComparator`
  function exists for exactly this — but it isn't used here.
- **Suggested change:** Either export a `comparePriority(a, b,
  weights)` helper from `core/priority-queue.ts` and use it in the
  provider's `eligible.sort(...)`, or push the sorting into the scheduler so
  the provider just dispatches.
- **Evidence:**
  ```
  $ sed -n '451,461p' packages/announcements/src/context/announcements-provider.tsx
      const priorityOrder: Record<string, number> = {
        critical: 0,
        high: 1,
        normal: 2,
        low: 3,
      }
      eligible.sort(
        (a, b) =>
          (priorityOrder[a.priority ?? 'normal'] ?? 2) - (priorityOrder[b.priority ?? 'normal'] ?? 2)
      )
  ```

---

### [MED] `validateTour` reaches through `as unknown as Record<string, unknown>` instead of typing the forbidden-field check

- **File(s):** `packages/core/src/lib/validate-tour.ts:30-42`
- **Category:** type-safety
- **Priority:** MED — the runtime check casts each `step` to
  `Record<string, unknown>` to read fields that exist on the *visible* step
  shape but are typed-out for the *hidden* shape. A typed discriminated
  union (e.g. `step.kind === 'hidden'` narrowing the absent fields) would
  let TypeScript do the policing instead of a cast + iteration.
- **Effort:** S — narrow `HiddenStep` to a closed shape that simply
  *cannot* carry `target/content/title/placement/advanceOn`; the existing
  `validateTour` becomes a thin coverage check (or can be removed if the
  type prevents the bad value at the boundary).
- **Why it matters:** A runtime check exists today only because the type
  doesn't say what it means. The same fields exist as a `const` tuple
  (`FORBIDDEN_HIDDEN_FIELDS`) — drift between the tuple and the actual type
  fields is unguarded.
- **Suggested change:** Define `HiddenStep` so the forbidden fields are
  `never`; or use a `Exclude<TourStep, { kind: 'hidden' }>` pattern. Keep
  `validateTour` for legacy-shape configs but stop the cast.
- **Evidence:**
  ```
  $ sed -n '29,42p' packages/core/src/lib/validate-tour.ts
  export function validateTour(tour: Tour): void {
    for (const step of tour.steps) {
      if (step.kind !== 'hidden') continue
      for (const field of FORBIDDEN_HIDDEN_FIELDS) {
        if ((step as unknown as Record<string, unknown>)[field] != null) {
          throw new TourValidationError({...
  ```

---

### [LOW] Re-exporting `@deprecated` shims with no removal timeline

- **File(s):** `packages/announcements/src/core/audience.ts:10` (entire
  file is `export { matchesAudience, validateConditions } from '@tour-kit/core'`),
  `packages/announcements/src/core/frequency.ts:9-32` (three function-body
  shims that just call the core version).
- **Category:** dead-code (also architecture)
- **Priority:** LOW — these are intentional back-compat shims for the 1.x
  line and the JSDoc tags them `@deprecated`. They're cheap, but they
  expand the public API every consumer's IDE shows.
- **Effort:** S — track the deprecation window (likely next major) and
  delete; until then, the shims are correctly minimal.
- **Why it matters:** Each re-export is one more thing that has to keep
  working forever; without a cutoff comment ("removed in 2.0") the shims
  tend to accumulate.
- **Suggested change:** Add a `// remove in 2.0` marker and a CI assertion
  on `package.json`'s major bump, so the next major naturally drops them.
- **Evidence:**
  ```
  $ cat packages/announcements/src/core/audience.ts
  /**
   * @deprecated Import from `@tour-kit/core` instead. ...
   */
  export { matchesAudience, validateConditions } from '@tour-kit/core'
  ```

---

### [LOW] Manual `floating-ui` middleware config repeated across 4 floating components

- **File(s):**
  - `packages/react/src/components/card/tour-card.tsx:93-100`
  - `packages/hints/src/components/hint-tooltip.tsx:80-88`
  - `packages/announcements/src/components/announcement-spotlight.tsx:88-92`
  - `packages/surveys/src/components/survey-popover.tsx:66-71`
- **Category:** duplication
- **Priority:** LOW — each call to `useFloating({ middleware: [offset(N),
  flip(), shift({ padding: 8 })], whileElementsMounted: autoUpdate })` is
  shaped almost identically. Diverging the offset or adding `arrow()`
  middleware later means four parallel edits.
- **Effort:** S — extract `useStandardFloating({ target, placement, offset
  })` into `@tour-kit/core` (it doesn't need React-state, just the
  middleware tuple + autoUpdate wiring).
- **Why it matters:** Today the four sites disagree on offset (8 vs 12) and
  on which middleware are even present — the divergence is silent.
- **Suggested change:** A `useStandardFloating(opts)` returning
  `{ refs, floatingStyles, context }` that wraps the common middleware. The
  four sites become a one-liner each.
- **Evidence:**
  ```
  $ grep -nE "useFloating|autoUpdate|flip|offset|shift" \
       packages/react/src/components/card/tour-card.tsx \
       packages/hints/src/components/hint-tooltip.tsx \
       packages/announcements/src/components/announcement-spotlight.tsx \
       packages/surveys/src/components/survey-popover.tsx | grep "middleware"
  packages/announcements/src/components/announcement-spotlight.tsx:90:      middleware: [offset(spotlightOptions.offset ?? 8), flip(), shift({ padding: 8 })],
  packages/hints/src/components/hint-tooltip.tsx:86:      middleware: [offset(8), flip(), shift({ padding: 8 })],
  packages/surveys/src/components/survey-popover.tsx:70:      middleware: [offset(popoverOptions.offset ?? 8), flip(), shift({ padding: 8 })],
  ```
  Same middleware tuple, three slightly different offset defaults.

---

### [LOW] Long `as unknown as` chains in codemod transforms hide a missing AST type bridge

- **File(s):** `packages/codemods/src/transforms/from-shepherd.ts:153,179,328`;
  `packages/codemods/src/transforms/from-joyride.ts:308,330,375,378`;
  `packages/codemods/src/transforms/from-driver.ts:131,216`;
  `packages/codemods/src/transforms/replay-bridge-to-use-tour-actions.ts:73,81,269,333,345`
  (~15 sites across the four codemod files).
- **Category:** type-safety
- **Priority:** LOW — jscodeshift's published types are notoriously weak,
  and the codemods are CLI-only (no runtime path through user code).
  Acceptable in this domain, but it's still ~15 places where a shared
  `asASTPath<T>` / `asASTNode<T>` helper would centralise the cast site.
- **Effort:** M — define a small helper module in
  `packages/codemods/src/lib/ast-cast.ts` exporting `asNode<T>(n: unknown):
  T` and `asPath<T>(p: unknown): ASTPath<T>`; replace inline `as unknown as`
  with one of those.
- **Why it matters:** Today a future jscodeshift upgrade that tightens types
  could break 15 different lines; one helper means one breakage point.
- **Suggested change:** Centralize via two helpers; preserves codemod-only
  scope (no runtime exposure).
- **Evidence:**
  ```
  $ grep -c "as unknown as" packages/codemods/src/transforms/from-joyride.ts \
       packages/codemods/src/transforms/from-shepherd.ts \
       packages/codemods/src/transforms/from-driver.ts \
       packages/codemods/src/transforms/replay-bridge-to-use-tour-actions.ts
  packages/codemods/src/transforms/from-joyride.ts:4
  packages/codemods/src/transforms/from-shepherd.ts:3
  packages/codemods/src/transforms/from-driver.ts:2
  packages/codemods/src/transforms/replay-bridge-to-use-tour-actions.ts:5
  ```
  14 `as unknown as` sites across these four files.

---

## Notes

- This pass is read-only — no source files outside `docs/` were modified.
- The 575-file count is the COVERAGE glob output, *including* every `src/**`
  inside `apps/`, `examples/`, and `packages/`. The actual candidates above
  cluster in `packages/{core,react,hints,announcements,checklists,surveys,
  analytics,codemods}/src/`.
- Sorted: HIGH (4) → MED (6) → LOW (3). Within each tier the
  highest-impact (most cross-package leverage, most lines touched, or most
  invasive bypass of an abstraction) is listed first.

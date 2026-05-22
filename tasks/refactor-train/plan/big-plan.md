# Tour Kit Refactor Train

**Scope:** Turn the 13 findings in [`docs/refactor-candidates.md`](../../docs/refactor-candidates.md) into a small sequence of reviewable PRs.
**Source audit date:** 2026-05-21.
**Owner:** @domidex01.
**Target window:** Week of 2026-05-25 through the week of 2026-06-29.
**Estimated effort:** 38-52 hours. Phases 1-4 are small/medium mechanical PRs. Phase 5 budgets 14-18 hours and **may ship as one PR or as 5a + 5b** — the cut-point gate in [`phase-5.md`](./phase-5.md) decides at the 8-hour mark, after `handleBranchTarget` is extracted and green. Both forms count against the same 14-18h Phase 5 line in the table below; the split only changes review surface.

---

## Current Codebase Findings

The original plan shape is right, but the detailed files had drifted from the actual repository. These are the source facts this plan now uses:

- `packages/core/src/context/tour-provider.tsx` is currently **1802 lines** and has **5** `noExcessiveCognitiveComplexity` ignores, not 6: reducer, flow restore, `navigateToStep`, `handleBranchTarget`, and `prev`.
- Extracting only `navigateToStep` and `handleBranchTarget` can remove **2** provider ignores. The realistic provider target is **<= 3 ignores remaining**, not <= 2.
- The dead position exports are re-exported from **three** places: `packages/core/src/index.ts`, `packages/core/src/utils/index.ts`, and `packages/react/src/index.ts`.
- `@tour-kit/license` currently does **not** depend on `@tour-kit/core`. The logger migration must either add and externalize that dependency deliberately, or keep license warnings as documented exemptions. It must not import core casually.
- `packages/license/src/components/license-test-mode.tsx` has a deliberately loud production `console.warn` and belongs in the Phase 2 preserve list.
- `packages/core/src/lib/i18n/use-resolve-localized-text.ts` already exists. Phase 1 should add `useResolvedText` as the ReactNode-preserving sibling there, using the existing `LocalizedText` source from `packages/core/src/lib/localized-text`.
- `TourStep` is currently a single interface that requires `target` and `content`, so hidden steps are built with casts in tests. Phase 3 must introduce a visible/hidden union; the current plan's "tighten HiddenStep" wording was naming a type that does not yet exist.
- `TourAnalytics.destroy()` currently sets `destroyed = true` before calling plugin `destroy`. A `safeDispatch` helper with a blanket destroyed guard would skip plugin teardown. Phase 4 must preserve this with an explicit destroy path.

---

## Phase Sequence

| Phase | PR | Main packages | Risk | Effort | Outcome |
| --- | --- | --- | --- | --- | --- |
| 1 | Helper hoisting | core, react, hints, announcements, checklists, surveys | Medium | 8-10 h | HIGH duplication removed; helpers become core-owned |
| 2 | Logger migration + guard rail | core, react, hints, announcements, media, ai, license, codemods | Medium | 6-8 h | Production `console.*` is either routed through logger or explicitly exempt |
| 3 | Dead API + types + comparator | core, react, announcements | Medium | 6-8 h | Position dead exports removed, hidden steps typed correctly, priority sorting unified |
| 4 | Analytics dispatch helper | analytics | Low/Medium | 4-6 h | Repeated plugin try/catch logic consolidated without changing dispatch timing |
| 5 | TourProvider navigation extraction (optionally split 5a/5b) | core | High | 14-18 h | `navigateToStep` and `handleBranchTarget` become isolated, directly testable engine functions |

The order is recommended, not strictly required. Phase 1 reduces console sites before Phase 2. Phase 2 prevents new console drift during later refactors. Phase 5 stays last because it is the broadest behavioral risk.

---

## Planned Source Changes

```text
packages/
├── core/
│   ├── src/lib/audience.ts                         # P1 evaluateAudience
│   ├── src/lib/i18n/use-resolved-text.ts           # P1 new ReactNode-preserving hook
│   ├── src/lib/i18n/index.ts                       # P1 export hook
│   ├── src/utils/storage.ts                        # P1 createMemoryStorage
│   ├── src/hooks/use-route-persistence.ts          # P1 use createMemoryStorage
│   ├── src/utils/position.ts                       # P3 remove dead public math exports
│   ├── src/utils/index.ts                          # P3 remove dead re-exports
│   ├── src/types/step.ts                           # P3 split visible/hidden step types
│   ├── src/lib/validate-tour.ts                    # P3 remove as-unknown cast
│   ├── src/context/tour-provider.tsx               # P5 thin wrappers only
│   └── src/lib/tour-engine/                        # P5 extracted navigation engine
├── react/
│   ├── src/hooks/use-step-filter.tsx               # P1 use core evaluateAudience
│   ├── src/hooks/use-resolved-text.tsx             # P1 re-export core hook
│   └── src/index.ts                                # P3 remove calculatePosition re-export
├── hints/
│   ├── src/hooks/use-hint-filter.tsx               # P1 use core evaluateAudience
│   └── src/hooks/use-resolved-text.tsx             # P1 re-export core hook
├── announcements/
│   ├── src/hooks/use-filtered-announcements.tsx    # P1 use core segment branch, preserve array pass-through
│   ├── src/lib/use-resolved-text.tsx               # P1 re-export core hook
│   ├── src/context/announcements-provider.tsx      # P3 priority comparator
│   └── src/core/priority-queue.ts                  # P3 config-level compare helper if needed
├── checklists/
│   └── src/hooks/use-checklist-persistence.ts      # P1 use createMemoryStorage
├── surveys/
│   ├── src/core/audience.ts                        # P1 re-export matchesAudience
│   └── src/types/survey.ts                         # P1 alias AudienceCondition from core
├── analytics/
│   └── src/core/tracker.ts                         # P4 safeDispatch
└── license/
    ├── package.json                                # P2 only if adding @tour-kit/core deliberately
    └── tsup.config.ts                              # P2 externalize @tour-kit/core if dependency is added
```

---

## Phase Summaries

### Phase 1: Helper Hoisting

Move the four HIGH duplication candidates to `@tour-kit/core`:

- Audience condition matching in surveys.
- Segment/array audience evaluation across react, hints, and announcements.
- Memory storage fallback shared by core route persistence and checklists.
- `useResolvedText` hook shared by react, hints, and announcements.

Important correction: announcements' array-shaped audience behavior is not the same as react/hints. Array audiences must continue to pass through `useFilteredAnnouncements` and be evaluated later by the scheduler against provider `userContext`.

Detailed plan: [`phase-1.md`](./phase-1.md).

### Phase 2: Logger Migration

Classify all production `console.*` calls under `packages/**/src` and either migrate them to `logger` or preserve them with a documented Biome override. Do not include examples, docs scripts, tests, spike files, or generated output in the production gate.

Important correction: license currently has no core dependency and has a deliberately loud `LicenseTestMode` warning. The phase has a dependency decision gate before touching license files.

Detailed plan: [`phase-2.md`](./phase-2.md).

### Phase 3: Dead API, Types, Comparator

Ship three independent MED cleanups together:

- Remove the manual `calculatePosition` family from public barrels.
- Reuse announcements queue ordering instead of the inline `priorityOrder` literal.
- Replace the current single `TourStep` interface with `VisibleTourStep | HiddenTourStep`, using `?: never` forbidden fields on hidden steps so `validateTour` can read them without `as unknown as`.

Detailed plan: [`phase-3.md`](./phase-3.md).

### Phase 4: Analytics `safeDispatch`

Consolidate the repeated plugin try/catch loops in `TourAnalytics` while preserving existing timing:

- `init` and `flush` remain awaited/sequential.
- `track`, `identify`, and `destroy` keep their public `void` return behavior.
- `destroy` still calls plugin destroy hooks after `destroyed` is set.

Detailed plan: [`phase-4.md`](./phase-4.md).

### Phase 5: TourProvider Split

Extract `navigateToStep` and `handleBranchTarget` into internal engine modules. Keep reducer, flow restore, and `prev` in provider for this phase.

Important correction: this removes two provider complexity ignores. The target is 5 provider ignores down to 3, not 6 down to 2.

Detailed plan: [`phase-5.md`](./phase-5.md).

---

## Milestone Gates

- **M1:** No `Keep in lockstep` or `per-package duplicate` comments remain in package source.
- **M2:** `pnpm lint` passes with `noConsole` enabled and all remaining production console use appears in the documented allowlist.
- **M3:** Dead position names are absent from `packages/core/src/index.ts`, `packages/core/src/utils/index.ts`, and `packages/react/src/index.ts`; `validate-tour.ts` contains no `as unknown as`.
- **M4:** `TourAnalytics` lifecycle dispatch has one helper and tests cover throwing plugins, rejected promises, debug logging, and destroy teardown.
- **M5:** `tour-provider.tsx` is smaller, still passes the existing hidden/branching/route tests, and has **<= 3** provider complexity ignores.

Recommended verification commands:

```bash
pnpm --filter @tour-kit/core test
pnpm --filter @tour-kit/react test
pnpm --filter @tour-kit/hints test
pnpm --filter @tour-kit/announcements test
pnpm --filter @tour-kit/checklists test
pnpm --filter @tour-kit/surveys test
pnpm --filter @tour-kit/analytics test
pnpm --filter @tour-kit/license test
pnpm typecheck
pnpm build
pnpm lint
```

Run package-scoped commands during each PR, then run the workspace commands before merge.

---

## Risk Register

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Phase 1 changes announcements audience semantics | High | Keep array-shaped audiences as pass-through in `useFilteredAnnouncements`; add a regression test. |
| Phase 1 exposes test-only reset helpers in public API | Medium | Do not export reset helpers from the package barrel. Use unique segment names or module reset in tests. |
| Phase 2 adds an unwanted core dependency to license | Medium | Make license a decision gate; if adding core, update `package.json`, `tsup.config.ts`, and size checks deliberately. |
| Phase 3 removes public position exports used by an external consumer | Medium | Grep workspace and sibling apps before deletion; changeset must call out removal. |
| Phase 3 hidden-step union breaks broad `TourStep` assumptions | Medium | Add type tests first, then update factory/helpers/tests to use `VisibleTourStep` where UI fields are required. |
| Phase 4 accidentally serializes async `track` plugins | Medium | Use per-method await policy; do not await `track` in the fire-and-forget path. |
| Phase 5 introduces stale closure reads | High | Pass refs/getters in `TourEngineContext`; unit-test extracted functions and run existing provider integration tests unchanged. |

---

## Deferred LOW Items

The following candidates stay out of this train:

- Deprecation cutoff markers for old announcements shims.
- Shared floating-ui middleware helper.
- Codemod AST cast helper.

After Phase 5 lands, update `docs/refactor-candidates.md` with resolved markers for the HIGH and MED items, then re-run the source audit to catch new candidates.

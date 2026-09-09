/**
 * The per-entry gzip budgets the merge gate enforces, as data.
 *
 * Its own module so it can be imported without running the checker — the
 * checker is a script with top-level side effects (it walks every row and sets
 * `process.exitCode`), so a test that wanted these numbers used to recover them
 * by regex-scraping the script's source. Now it imports them.
 *
 * Every row is measured as an IMPORT CLOSURE (see `closure.mjs`), not as the
 * entry file. Once a package emits more than one tsup entry, `splitting: true`
 * moves the shared code into a `chunk-*.js` and the entry becomes a re-export
 * shell. Statting that shell reported a 6 KB *improvement* for core the day the
 * engine subpath landed, while the bytes a consumer resolves went UP 1.2 KB.
 * Single-entry packages measure identically to before, so every pre-existing
 * budget keeps its meaning.
 *
 * The closure is summed as per-file gzip rather than gzipped once as a
 * concatenation, because that is how the bytes actually travel: a server
 * compresses each file it serves on its own, with no shared dictionary.
 *
 * Note the rows are NOT additive. `core` and `core:engine` both count the full
 * shared chunk, because each is what that consumer alone resolves; someone
 * importing both pays for the chunk once.
 *
 * Budgets = the 2026-05-23 audit's raw dist gzip measurement + ~20% headroom.
 * Exceptions documented inline:
 *   - core: 23 KB ceiling against a measured 22 621, measuring the closure.
 *     NOT a relaxation of the old 20 KB: that number measured a self-contained
 *     entry that no longer exists.
 *
 *     The history, because each step was paid for by something specific:
 *     20 825 -> 21 271 in v2 §1.3 (the module-boundary cost of 636 lines
 *     leaving `tour-provider.tsx` for six modules, which esbuild can no longer
 *     inline); 21 271 -> 21 851 with issue #121 (Group A in
 *     `navigateToStepImpl`, `commitStart` in `actions.ts`, the Group B block
 *     in `transition-effects.ts`); 21 851 -> 22 574 in v2 §1.4; 22 574 ->
 *     22 621 in v2 §1.5 (the six binding-contract re-exports on `/engine`
 *     plus `attachAdvanceOn`'s deferred bind); 22 857 -> 22 879 in v3 Phase 1
 *     (+20 B for `createHandle`, the engine-agnostic half of
 *     `createEngineHandle`, and its two type exports on `/engine`).
 *
 *     §1.4's +725 B is the closure FLIPPING, by design. `<TourProvider>` is a
 *     binding over `createTourEngine()` now, so the factory and the engine
 *     handle are genuinely in the main entry's closure — the ~350 lines of
 *     adapter A the provider deleted do not cover the factory it gained.
 *     `engine-not-in-main-closure.test.ts` asserted the opposite and was
 *     DELETED in §1.4e, not skipped. The invariant that still matters is
 *     `no-react-in-engine-dist.test.ts`: the engine subpath must stay
 *     React-free, and it does.
 *
 *     The CLAUDE.md <8 KB target (audit B-1) is NOT §1.4's to earn, and the
 *     sentence that said so has been retired everywhere. The main entry's
 *     closure is the main barrel — providers, fourteen hooks, `cn`,
 *     `UnifiedSlot`, i18n, segmentation, diagnostics — and §1.4 leaves that
 *     barrel untouched by definition. Reaching 8 KB means trimming the barrel,
 *     which is a breaking change; it rides with the 7.0.0 unification (§3.7),
 *     not with any engine slice.
 *   - core:engine: 18.5 KB against a measured 18 098, up from 8.1 KB when this
 *     was a types-and-predicates door and 15.3 KB after §1.3. The difference
 *     is first a working tour engine (reducer, boot resolver, actions,
 *     transition effects, four storage adapters) and then, in v2 §1.3b, the
 *     DOM behaviours: focus trap, keyboard, rect tracker, spotlight,
 *     advance-on and the test bridge. Those ~1.6 KB are exactly the code that
 *     left the five view hooks, which is why `core` did NOT move — it lands in
 *     the shared chunk both entries already read.
 *
 *     v2 §1.5 added 445 B (17 287 -> 17 732) for one reason: `/engine` now
 *     publishes the binding contract (`createEngineHandle`, `pickActions`,
 *     `INITIAL_SNAPSHOT`, `EngineHandle`, `TourEngineLiveOptions`,
 *     `TourEngineAnalytics`), so `engine-handle.ts` is in the ENGINE's closure
 *     for the first time — it was main-entry-only while the React provider was
 *     its only importer. That leaves ~268 B of headroom on this row, and the
 *     §1.6 IIFE is the consumer who pays all of it; re-baseline there, with
 *     the measured number, rather than shaving the contract two shipped
 *     bindings depend on.
 *
 *     v2 §1.5f took the ceiling to 18.5 KB (open question 7 pre-authorised
 *     exactly this) for the last +366 B: `createSpotlight()` moved the
 *     spotlight state machine down here after §1.5 shipped three copies of it
 *     — the React hook, `@tour-kit/vue` and `@tour-kit/svelte` — that differed
 *     only in reactivity primitive. Read the row together with the binding
 *     rows before calling it a regression: most of the bytes did not appear,
 *     they MOVED. A Vue consumer ships engine + binding: 17 732 + 1 455 =
 *     19 187 before, 18 098 + 1 243 = 19 341 after. So +154 B for that
 *     consumer, not the zero an earlier estimate in the §1.5f commit message
 *     guessed — the controller carries a listener set and an explicit snapshot
 *     the three inlined copies did not. 154 B to delete two of three
 *     implementations is the trade, and it is worth stating plainly rather
 *     than rounding to "free".
 *
 *     v3 Phase 1 added 25 B (18 098 -> 18 124): `createHandle`, the
 *     engine-agnostic half of `createEngineHandle` (lazy `ensure()`, the
 *     listener set, the microtask-deferred `release()`), plus its `EngineLike`
 *     and `Handle` types. It is on `/engine` because a package with its own
 *     engine composes it rather than writing a second lifecycle —
 *     `@tour-kit/hints/engine` is the first.
 *
 *     Do NOT split a `/engine/dom` entry to keep this number flat: the row
 *     measures the import-everything worst case, a bundler tree-shakes the
 *     rest (`sideEffects: false`), and the only consumer who pays all of it is
 *     the §1.6 IIFE — where shipping focus/keyboard/spotlight is the point. A
 *     type-only consumer still ships zero.
 *   - core:engine:iife: 18.5 KB against a measured 17 492 — the SAME ceiling as
 *     `core:engine`, deliberately, not the repo's measured-x1.2 convention.
 *     This row is the same source in one format: rollup drops the chunk
 *     boundary, so the IIFE is 606 B SMALLER than the two-file ESM closure it
 *     mirrors (17 492 vs 18 098). It moves in lockstep with the row above, so
 *     it should trip at the same time; x1.2 would put it near 21 000 and leave
 *     3.5 KB nobody would notice drift into. The vue/svelte rows got x1.2
 *     because they have no sibling row to track.
 *
 *     This is also the answer to the prediction in the row above — "the §1.6
 *     IIFE is the consumer who pays all of it". It did, and it fit: no
 *     re-baseline, ~1 KB of headroom. If this row and `core:engine` ever
 *     diverge by more than ~600 B, one of the two builds changed shape
 *     (a lost treeshake, a new format flag), not the source.
 *   - hints, announcements, surveys, media, ai:client: re-baselined in v2 §1.2
 *     WITHOUT a byte being added. All five ship a `headless` entry alongside
 *     `index`, so they have been split since long before core was, and the
 *     entry-file gate was reading their shell (announcements: 6 517 measured
 *     against a 13 322 reality). The new numbers are the first honest ones.
 *     Do not compare them to a pre-§1.2 build unless you re-measure it the
 *     new way.
 *
 * There is no `analytics:console` row. The console plugin ships inside
 * `analytics/dist/index.js` (the always-on default) — it is not a tsup entry
 * point, so no standalone `dist/plugins/console.js` is emitted. Gating a file
 * that is never built would always report MISSING; it is covered by
 * `analytics:main` instead.
 *
 * Adding a row here without stating it in CLAUDE.md fails
 * `bundle-budget-claim-alignment.test.ts`. That is deliberate: a budget nobody
 * can find is a budget nobody defends.
 *
 * @type {Array<[name: string, relPath: string, budgetBytes: number]>}
 */
export const budgets = [
  ['core', 'packages/core/dist/index.js', 23000],
  ['core:engine', 'packages/core/dist/engine/index.js', 18500],
  ['core:engine:iife', 'packages/core/dist/engine/index.global.js', 18500],
  ['react', 'packages/react/dist/index.js', 12000],
  ['hints', 'packages/hints/dist/index.js', 6000],
  ['analytics:main', 'packages/analytics/dist/index.js', 4000],
  ['analytics:posthog', 'packages/analytics/dist/plugins/posthog.js', 1500],
  ['analytics:mixpanel', 'packages/analytics/dist/plugins/mixpanel.js', 1500],
  ['analytics:amplitude', 'packages/analytics/dist/plugins/amplitude.js', 1000],
  ['analytics:ga', 'packages/analytics/dist/plugins/google-analytics.js', 1000],
  // v3 Phase 0 — the React-free door. Measured 3 312 by this gate (main is
  // 3 659; the difference is `core/context.tsx`, the LicenseGate wrapper and
  // React's jsx-runtime import). It shares `analytics:main`'s 4 000 ceiling
  // DELIBERATELY: the engine is a strict SUBSET of main, so a subset that
  // outgrows its superset's budget is a build-shape bug (core bundled in, an
  // external lost), not a size regression to re-baseline. 3 312 x 1.2 = 3 974
  // rounds to the same place anyway.
  ['analytics:engine', 'packages/analytics/dist/engine/index.js', 4000],
  ['adoption', 'packages/adoption/dist/index.js', 10000],
  ['checklists', 'packages/checklists/dist/index.js', 10000],
  ['announcements', 'packages/announcements/dist/index.js', 14000],
  ['surveys', 'packages/surveys/dist/index.js', 12500],
  ['media', 'packages/media/dist/index.js', 9000],
  ['ai:client', 'packages/ai/dist/index.js', 7000],
  ['ai:server', 'packages/ai/dist/server/index.js', 8000],
  ['scheduling', 'packages/scheduling/dist/index.js', 4000],
  // v3 Phase 0 — the React-free door. Measured 3 039 by this gate; the three
  // hooks, <ScheduleGate> and the `@tour-kit/analytics` peer behind them are
  // the 670 B difference from the main row (3 709). Unlike `analytics:engine`,
  // this does NOT share its sibling's ceiling: `scheduling` sits at 4 000 with
  // only 291 B of headroom, so sharing would leave ~1 KB nobody would notice
  // drift into. 3 039 x 1.2 = 3 647, and 3 600 is a hair under that (561 B,
  // 18 % headroom) for a round 3.6 KB claim.
  ['scheduling:engine', 'packages/scheduling/dist/engine/index.js', 3600],
  ['license', 'packages/license/dist/index.js', 8000],
  // v2 §1.5 — the two non-React bindings. Both are `external: ['@tour-kit/core',
  // <framework>]`, so these rows measure the binding's own bytes: state bridge,
  // provider lifecycle, two view helpers and a router adapter. Measured then
  // gated at ~x1.2, the repo convention.
  ['vue', 'packages/vue/dist/index.js', 1500],
  ['svelte', 'packages/svelte/dist/index.js', 1300],
]

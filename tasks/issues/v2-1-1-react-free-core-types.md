# v2 §1.1 — Genericise the 5 type-only React imports in core

issue:  not created
branch: refactor/v2-1-1-react-free-core-types
status: tests-red

<!-- ============ PLANNER owns below. Everyone else: read only. ============ -->

## Problem

`plan/v2/handoff.md` §1.1 wants five core files to stop importing React so
task 1.2 can carve `@tour-kit/core/engine`. The symptom is "5 stray imports";
the root cause is narrower and more useful: **all five imports are
`import type`, so they already emit zero runtime code.** Nothing ships React
today. What leaks is the *emitted `.d.ts`* — a Vue/Svelte consumer with
`skipLibCheck: false` gets `Cannot find module 'react'`, and with
`skipLibCheck: true` (the common case) the types silently degrade to `any`.

So this is a type-shape problem, not a code-movement problem, and it splits
cleanly in two:

- **Three files are pure structural aliases** — `React.RefObject<T>` is
  `{ current: T }` and `React.Dispatch<A>` is `(a: A) => void`. Replacing them
  is a rename with provably identical assignability (spiked below).
- **Two files hold `ReactNode`** (`TourStep.title`/`content`,
  `HintConfig.content`). No React-free type is *mutually* assignable with
  `ReactNode`, so this one genuinely costs something. It is the whole risk of
  the task and the handoff's "2 days" hides it.

## Files touched

- `packages/core/src/types/primitives.ts` — **new.** React-free `TourNode`,
  `TourElementLike`, `TourRef<T>`, `TourDispatch<A>`. ~20 lines, no imports.
- `packages/core/src/types/step.ts` — drop the react import;
  `title?: TourNode | LocalizedText`, `content: TourNode`. Update the two
  doc-comments that say `ReactNode`.
- `packages/core/src/types/hints.ts` — drop the react import;
  `content: TourNode | LocalizedText`.
- `packages/core/src/types/target.ts` — drop the react import;
  `TourTargetRef = TourRef<HTMLElement | null>`.
- `packages/core/src/lib/tour-engine/context.ts` — drop the react import;
  `dispatch: TourDispatch<TourAction>` and the three refs → `TourRef<…>`.
  Internal type (0 hits in `dist/index.d.ts`) — zero external surface.
- `packages/core/src/lib/segmentation/types.ts` — drop the react import by
  **moving** `SegmentationProviderProps` into `segmentation-context.tsx`, its
  only consumer, which already imports React. No new type. Ladder rung 1.
- `packages/core/src/lib/segmentation/index.ts` — repoint the
  `SegmentationProviderProps` re-export at `./segmentation-context`.
- `packages/core/src/types/index.ts` + `packages/core/src/index.ts` — export
  `TourNode`, `TourElementLike`, `TourRef`, `TourDispatch` (additive).
- `packages/core/src/lib/i18n/use-resolved-text.ts` — widen the param to
  `TourNode | LocalizedText | undefined`. Return stays `React.ReactNode`; this
  file legitimately keeps its React import (it is a hook calling `useT`).
- `packages/react/src/components/card/tour-card.tsx` (~line 266) —
  `content={visibleStep.content as React.ReactNode}`. **The only render-site
  break in the entire monorepo.** Comment it, pointing at the identical
  boundary cast already documented in `lib/schemas/parse.ts`.
- `packages/core/src/__tests__/no-react-in-engine-types.test.ts` — **new.**
  Source-scan guard over the five files. This is the RED test.
- `packages/core/src/__tests__/types/tour-node-parity.test-d.ts` — **new.**
  `ReactNode extends TourNode` drift guard, run by `typecheck:types`. Lives
  beside the eight existing `.test-d.ts` files, not under `types/__tests__/`.
- `wiki-tech/packages/core.md` — add the new types to §Types and one
  §Architectural decisions bullet: React types are structurally mirrored, not
  imported.

## Unknowns

All resolved by spike (rung 5 — the docs could not answer assignability for
*this* React version). Probe run under `@types/react@19.2.14`, `strict: true`;
full source in the session scratchpad, every assertion below compiled clean.

1. **Is `React.RefObject<T>` structurally replaceable?** — Yes.
   React 19 defines `interface RefObject<T> { current: T }` (index.d.ts:154).
   `{ current: HTMLElement | null }` and `React.RefObject<HTMLElement | null>`
   proved assignable **in both directions**, with and without `readonly`, and a
   subtype ref (`RefObject<HTMLDivElement | null>`, what `useRef` returns)
   assigns in. Readonly modifiers do not affect object assignability in TS, so
   the React 18 shape (`{ readonly current: T | null }`) is covered too — which
   matters, `peerDependencies` is `^18.0.0 || ^19.0.0`. **Caveat:** no
   `@types/react@18` is installed anywhere in the workspace, so the drift guard
   in Acceptance runs against 19.x only. React 18 coverage rests on this
   reasoning (18's `ReactNode` union is a strict subset of 19's; readonly is
   irrelevant for property assignability), not on a test.

2. **Is `React.Dispatch<A>` replaceable?** — Yes, it is literally
   `type Dispatch<A> = (value: A) => void` (index.d.ts:1645). Proved
   bidirectionally assignable.

3. **Does widening `title`/`content` break the `ai` package or `apps/docs`?**
   — No. `ai` declares its own structural `TourContextLike` with
   `content?: unknown` (`hooks/use-tour-assistant.ts:44-53`) and never imports
   core's `TourStep`. The `apps/docs` hits (`features.tsx:17`,
   `code-preview.tsx:146`) are code samples inside template-literal **strings**,
   and `how-it-works.tsx` uses its own local objects. Separately confirmed
   `` `${unknown}` `` is legal in a TS template literal, so
   `ai/server/system-prompt.ts:105` is safe either way.

4. **Can a React-free type keep authoring safety?** — Yes, and this is the
   finding the plan turns on. With

   ```ts
   interface TourElementLike { readonly type: unknown; readonly props: unknown }
   type TourNode = string | number | bigint | boolean | null | undefined
                 | TourElementLike | Iterable<TourNode> | PromiseLike<unknown>
   ```

   the probe proved all of: `ReactNode extends TourNode` ✅ (so the drift guard
   is satisfiable today); `Symbol()` and `() => {}` still **rejected** ✅;
   `ReactElement`, `ReactNode[]`, primitives, mixed arrays accepted ✅;
   `{ key: 'a' }` is **not** a `TourNode` ✅ — so `TourNode | LocalizedText`
   stays a discriminating union and `isI18nKey` narrowing is unaffected.
   React's `DO_NOT_USE_…_EXPERIMENTAL_REACT_NODES` arm is an empty interface
   (index.d.ts:404), so `keyof` it is `never` — that arm contributes nothing.

5. **Does the repo already answer "React-free content type"?** — Partly, and
   it argues for `unknown`: `types/tour-definition.ts` already ships
   `TourStepDefinition` with `content: unknown`, and `lib/schemas/parse.ts`
   already documents casting **once at the boundary**. That is the JSON path
   though — a deliberately lossier contract (`target` is `string`-only there).
   Reused as a *convention* (one boundary cast), not as the type. See Approach.

## Approach

**Ladder rung 2 for four of the six files, rung 7 for `TourNode`.**

Rung 2 (reuse what is here): `segmentation/types.ts` needs no new type at all —
`SegmentationProviderProps` is a React component's props that drifted into a
types file; moving it to the `.tsx` that consumes it deletes the import. The
ref/dispatch aliases are mechanical renames proved identical by Unknown 1–2.
The single render-site cast reuses the `parse.ts` boundary-cast convention.

Rung 7 (write the minimum) applies only to `TourNode`, and only after rejecting
the cheaper option. **The real decision is `TourNode` vs plain `unknown`,** and
it is the one thing here worth overriding me on:

- `unknown` is a 6-line diff and zero maintenance, but it deletes type-checking
  on `content` — the one **required** field of the library's headline type,
  which today is authored by 100% React users. `content: () => {}` would start
  compiling and fail at runtime in React instead.
- `TourNode` keeps every authoring error (Unknown 4) for ~20 lines, at the cost
  of a hand-maintained mirror that could drift when React's union changes.

I recommend `TourNode`, because the drift risk is neutralised by a compile-time
guard whose idiom **already exists two files away** — `_AssertCoversPlacement`
in `lib/schemas/step.schema.ts:29` does exactly this for `Placement`. That turns
an unbounded maintenance risk into one that fails the build the day it appears.
Nice accident: Vue VNodes also carry `{ type, props }`, so `TourElementLike` is
not secretly React-only.

Either way the boundary cast in `tour-card.tsx` is unavoidable — no React-free
supertype of `ReactNode` is assignable back to it. That is a property of the
type system, not of this design.

**Not in this task:** routing `visibleStep.content` through `useResolvedText`.
It would remove the cast, but it also starts interpolating content strings —
a behaviour change that belongs to i18n §2.2.

## Acceptance

- None of the five named source files imports `react` any more (source-scan
  test). **Not** "a Vue consumer typechecks with `@types/react` absent": the
  bundled `dist/index.d.ts` still opens with `import * as React$1 from 'react'`
  because hooks and providers keep it. That consumer-level guarantee is §1.2's,
  once the engine subpath exists.
- Authoring a step with `content: Symbol()` or `content: () => {}` is still a
  compile error. Authoring `content: <p>hi</p>`, `content: 'text'`,
  `content: [<a/>, 'x']`, or `title: { key: 'welcome' }` still compiles.
- A `TourStep` whose `content` is JSX renders identically in `<TourCard>` —
  same DOM, same `data-slot="tour-card-description"` behaviour.
- A `useRef` from React 18 *or* React 19 is still accepted as a step `target`,
  and `resolveTarget` still returns the element.
- `HiddenTourStep` still rejects `content` / `title` (the `?: never` guard).
- `<SegmentationProvider>` still accepts `children` and
  `SegmentationProviderProps` is still exported from `@tour-kit/core`.
- The build fails loudly if React's `ReactNode` ever gains a member `TourNode`
  does not cover.
- Green means all five nets, not just vitest: `turbo run test --concurrency=3`
  (core 82 files, react 40), repo-wide `pnpm typecheck` (the only net that
  catches the `tour-card.tsx:266` break and any consumer this widening touches
  in `react`, `apps/docs`, `examples`), `typecheck:types` in core, the 19
  Playwright specs under `e2e/next` + `e2e/vite`, and `biome check packages/`.

## Conflicts

**None.** Checked with `gh issue list --state open --json number,title,body` —
`gh` is installed and authenticated; it returned exactly one open issue, #104
("uneed upvotes"), which is spam with no Files-touched section and no overlap.

Worth flagging anyway, from `plan/v2/handoff.md` rather than from an issue:
nothing may touch `context/tour-provider.tsx` while §1.3/§1.4 are open. **This
task does not touch it** — `lib/tour-engine/context.ts` is a separate file, and
the provider's own `React.useRef<TourEngineContext | null>` (line 773) is
unaffected by changing fields *inside* that interface.

## Seen but out of scope

- **`HintConfig` is declared twice and the copies have drifted.**
  `packages/core/src/types/hints.ts` and `packages/hints/src/types/index.ts`
  both define it and both are published; `hints` uses its own and ignores
  core's, so core's `HintConfig` has zero consumers in the monorepo while
  `@tour-kit/react` re-exports it (`react/src/index.ts:209`). Two different
  public types with one name. Real bug, its own issue.
- **`tour-card.tsx:208`** — `` `${stepLabel}: ${resolvedTitle}` `` builds an
  `aria-label` from a value that may be a JSX element, yielding
  "[object Object]" for element titles. Pre-existing; an a11y fix, not a types fix.
- **`isI18nKey` misclassifies keyed React elements.** `lib/localized-text.ts:15`
  returns true for any non-array object with a string `key`. A React element
  with a `key` prop (`<p key="x">`) has that shape, so `useResolvedText` calls
  `t('x')` instead of rendering the element. Pre-existing runtime bug, same
  family as the aria-label one above; the type change here does not touch it.
- `wiki-tech/concepts/positioning-engine.md` still documents the engine deleted
  in refactor phase 3 (already flagged in the handoff).
- `.mailmap` still absent (handoff §3).

## Three checks

**1. Hyrum's Law — what breaks silently.** The loud breaks are typecheck errors
and the sweep found exactly one (`tour-card.tsx:266`). The silent ones:
(a) `TourNode` admits any `{ type, props }` object, so a non-element object in
`content` now compiles and fails inside React at runtime instead of at build
time — strictly narrower than `unknown`, strictly wider than today;
(b) widening `useResolvedText`'s parameter means a symbol passed in now reaches
the `return value as React.ReactNode` pass-through and throws in React rather
than being rejected by TS; (c) IDE hover on `content` changes from `ReactNode`
to `TourNode` — no behaviour change, but every doc example and screenshot
showing the old signature is now stale. Nothing changes at runtime: these are
type-only imports today, so the emitted JS is byte-identical apart from the
`segmentation` file move.

**2. Tesler's Law — where the complexity went.** This is **not** a
simplification and should not be sold as one. Core gains ~20 lines
(`primitives.ts`) plus a drift-guard test, and loses one dependency edge in its
type graph. The complexity React's own types were carrying for free moves to
`types/primitives.ts` and to whoever must respond when the drift guard fires
after a React major. That is the price of the `@tour-kit/core/engine` subpath
in §1.2, paid here.

**3. Inversion — the one assumption that would make this wrong.** That core's
`content` and `title` should stay type-checked at all: if the intent is instead
that core's types become genuinely opaque payload — matching the `unknown` that
`TourStepDefinition` already ships — then `TourNode`, its export surface and its
drift guard are all wasted, and this whole task collapses to a six-line diff
plus one cast.

<!-- ============ TEST WRITER owns below. Planner section is untouched. ============ -->

## TEST WRITER

status: tests-red

### files

Two new files. No source file was touched.

- `packages/core/src/__tests__/no-react-in-engine-types.test.ts` — **new.**
  Runtime source-scan over the five named files (vitest). The primary RED gate.
- `packages/core/src/__tests__/types/tour-node-parity.test-d.ts` — **new.**
  Type-level guards compiled by `pnpm --filter @tour-kit/core typecheck:types`.
  Imports every new primitive through the **public barrel** (`../../index`),
  not `../../types/primitives`, so it also proves the additive export surface
  the plan asks for. Where the plan's Acceptance is already pinned by an
  existing test, I mapped it instead of writing a duplicate.

### acceptance map

| # | Acceptance bullet | Test | State |
|---|---|---|---|
| 1 | Five named files no longer import `react` | `no-react-in-engine-types.test.ts` — 5 cases, one per file | **RED** |
| 2 | `content: Symbol()` / `() => {}` still a compile error; `<p>hi</p>`, `'text'`, `[<a/>,'x']`, `title: {key}` still compile | `tour-node-parity.test-d.ts` § *Authoring still compiles* / § *Authoring errors survive the widening* | **RED** |
| 3 | JSX `content` renders identically in `<TourCard>`, same `data-slot="tour-card-description"` | **existing** `packages/react/src/components/card/tour-card-content.test.tsx` (`renders ReactNode content`, `renders complex ReactNode content`) + `packages/react/src/__tests__/tour-i18n.test.tsx:83` | green — regression pin, do not weaken |
| 4 | A React 18 *or* 19 `useRef` is still a valid `target`; `resolveTarget` still returns the element | type half: `tour-node-parity.test-d.ts` (`_target18` / `_target19`); runtime half: **existing** `src/__tests__/types/target.test.ts` | **RED** (type half) |
| 5 | `HiddenTourStep` still rejects `content` / `title` | **existing** `src/__tests__/types/hidden-step.test-d.ts` (`_bad2`, `_bad3`) | green — pin |
| 6 | `<SegmentationProvider>` still accepts `children`; `SegmentationProviderProps` still exported from `@tour-kit/core` | type half: `tour-node-parity.test-d.ts` § *SegmentationProviderProps survives the file move*; runtime half: **existing** `src/lib/segmentation/segmentation.test.tsx` | **RED** (type half, via the file) |
| 7 | Build fails loudly if `ReactNode` gains a member `TourNode` doesn't cover | `tour-node-parity.test-d.ts` — `expectTypeOf<ReactNode>().toExtend<TourNode>()` | **RED** |
| 8 | "Green means all five nets" | verification protocol, not a test — see *nets* below | — |

Extra guards written beyond the bullets, both cheap and both load-bearing for
the plan's own Unknowns:

- **Ref/dispatch parity, bidirectional** — Unknown 1 and 2 were proved by a
  throwaway spike. `tour-node-parity.test-d.ts` makes that proof permanent
  (`RefObject<T>` ⇄ `TourRef<T>`, `Dispatch<A>` ⇄ `TourDispatch<A>`), so a
  future React major that changes either shape fails the build instead of
  silently degrading.
- **`{ key: 'welcome' }` is NOT a `TourNode`** — Unknown 4's discriminating-union
  claim. If this ever compiles, `TourNode | LocalizedText` stops discriminating
  and `isI18nKey` narrowing breaks silently. `@ts-expect-error`-guarded.

### red proof

**Net 1 — vitest, `pnpm --filter @tour-kit/core test`.** Five assertion
failures, one per file. Each names the exact import line that has to go:

```
 ❯ src/__tests__/no-react-in-engine-types.test.ts (5 tests | 5 failed) 30ms
     × types/step.ts does not import from react 16ms
     × types/hints.ts does not import from react 2ms
     × types/target.ts does not import from react 2ms
     × lib/tour-engine/context.ts does not import from react 1ms
     × lib/segmentation/types.ts does not import from react 2ms

 FAIL  … > types/step.ts does not import from react
 FAIL  … > types/hints.ts does not import from react
AssertionError: expected [ 'import type React from \'react\'' ] to deeply equal []
- Expected
+ Received
- []
+ [
+   "import type React from 'react'",
+ ]
 ❯ src/__tests__/no-react-in-engine-types.test.ts:49:23

 FAIL  … > types/target.ts does not import from react
 FAIL  … > lib/tour-engine/context.ts does not import from react
AssertionError: expected [ Array(1) ] to deeply equal []
+ [
+   "import type * as React from 'react'",
+ ]

 FAIL  … > lib/segmentation/types.ts does not import from react
AssertionError: expected [ Array(1) ] to deeply equal []
+ [
+   "import type { ReactNode } from 'react'",
+ ]

 Test Files  1 failed (1)
      Tests  5 failed (5)
```

Run twice, byte-identical both times (`Tests 5 failed (5)`).

**Net 2 — `pnpm --filter @tour-kit/core typecheck:types`.** Baseline was clean
before these files; it now fails with exactly five errors and no unrelated
noise, which also confirms importing the public barrel from a `.test-d.ts`
doesn't drag in stray errors:

```
src/__tests__/types/tour-node-parity.test-d.ts(15,3): error TS2305: Module '"../../index"' has no exported member 'TourDispatch'.
src/__tests__/types/tour-node-parity.test-d.ts(16,3): error TS2305: Module '"../../index"' has no exported member 'TourElementLike'.
src/__tests__/types/tour-node-parity.test-d.ts(17,3): error TS2305: Module '"../../index"' has no exported member 'TourNode'.
src/__tests__/types/tour-node-parity.test-d.ts(18,3): error TS2305: Module '"../../index"' has no exported member 'TourRef'.
src/__tests__/types/tour-node-parity.test-d.ts(64,1): error TS2578: Unused '@ts-expect-error' directive.
Exit status 2
```

**Honest caveat on net 2.** Four of those five are `TS2305` — module-resolution
errors, not assertion failures. For a type test that *is* the assertion
mechanism (the type under guard doesn't exist yet), but it is weaker evidence
than net 1: it proves the names are missing, not yet that the drift guard and
the `@ts-expect-error` directives actually bite. Two things make it real anyway:

- The fifth error, `TS2578` at line 64, is a genuine assertion failure. It fires
  because `TourNode` currently resolves to `any`, so `{ key: 'welcome' }`
  wrongly compiles and the `@ts-expect-error` above it goes unused. It flips to
  green only when `TourNode` is a real, correctly-narrow type.
- The two `@ts-expect-error` directives on `content: Symbol()` and
  `content: () => {}` are **used today** (no `TS2578` reported for them), which
  proves they bite against the current `React.ReactNode` and will keep biting
  against `TourNode`. That is Acceptance bullet 2's "still a compile error" half
  verified as a live guard, not an aspiration.

The drift guard itself (`expectTypeOf<ReactNode>().toExtend<TourNode>()`) can
only be proved once `TourNode` exists — that is the coder's first green.

### one line per test

- `types/step.ts does not import from react` — guards the `title`/`content`
  `ReactNode` fields, the widest external surface in the task.
- `types/hints.ts does not import from react` — guards `HintConfig.content`.
- `types/target.ts does not import from react` — guards `TourTargetRef`.
- `lib/tour-engine/context.ts does not import from react` — guards `dispatch`
  and the three refs; zero external surface, so this one is pure §1.2 setup.
- `lib/segmentation/types.ts does not import from react` — guards the
  `SegmentationProviderProps` move; must stay green with the type still
  exported from the barrel (bullet 6).
- *drift guard* — fails the build the day React's `ReactNode` union grows a
  member `TourNode` doesn't mirror.
- *ref/dispatch parity ⇄* — fails if `TourRef`/`TourDispatch` ever stop being
  structurally interchangeable with React's.
- *authoring still compiles* — fails if the widening loses JSX, string, mixed
  array, or `{ key }` authoring.
- *authoring errors survive* — fails if `TourNode` gets loose enough to admit a
  symbol or a bare function.
- *`{ key }` is not a `TourNode`* — fails if the content union stops
  discriminating against `LocalizedText`.
- *React 18/19 useRef is a valid target* — fails if `TourRef` narrows past
  either ref shape. The 18 shape is written out by hand because no
  `@types/react@18` exists in the workspace (planner Unknown 1's caveat).
- *`SegmentationProviderProps` survives the file move* — fails if the type stops
  being reachable from `@tour-kit/core` or loses `children`.

### heads-up for the coder

`packages/core/__tests__/phase-0/phase-0-harness.test.ts >
typecheck:types exits 0 on the committed selftest` **also fails right now**, so
`pnpm --filter @tour-kit/core test` reports `6 failed`, not 5. That harness
shells out to `typecheck:types` and asserts exit 0, so any red `.test-d.ts`
cascades into it. It is not broken and needs no edit — it goes green the moment
`tour-node-parity.test-d.ts` compiles. Do not "fix" it by excluding the new
file.

### not covered

- **The emitted `dist/index.d.ts` staying React-free.** Deliberate — the planner
  is right that the bundle still opens with `import * as React$1 from 'react'`
  because hooks and providers keep it. That guarantee is §1.2's, once the
  engine subpath exists. Nothing here tests dist.
- **React 18 for real.** No `@types/react@18` is installed anywhere in the
  workspace, so the 18 ref shape is a hand-written structural stand-in. If 18
  support is load-bearing for the release, installing `@types/react@18` as a
  core devDependency and compiling the type tests against both is its own task.
- **`use-resolved-text.ts` param widening.** No Acceptance bullet covers it and
  its runtime behaviour is already pinned by
  `src/lib/i18n/use-resolved-text.test.tsx`. Note the planner's own Hyrum's-Law
  item (b): after the widening, a symbol reaching the `return value as
  React.ReactNode` pass-through throws in React instead of being rejected by
  TS. That is accepted, not tested.
- **The `tour-card.tsx:266` cast itself.** Not directly asserted — bullet 3's
  existing render tests are the net. If the cast is written wrong (e.g.
  `String(content)` instead of `as React.ReactNode`),
  `tour-card-content.test.tsx > renders complex ReactNode content` fails.
- **The three "Seen but out of scope" bugs** (duplicate `HintConfig`, the
  `aria-label` `[object Object]`, `isI18nKey` misclassifying keyed elements) and
  the `wiki-tech/packages/core.md` doc update.

### nets to run before calling it green

`turbo run test --concurrency=3` (not bare `pnpm test` — it scatters false
failures on this machine), repo-wide `pnpm typecheck`, `pnpm --filter
@tour-kit/core typecheck:types`, the `e2e/next` + `e2e/vite` Playwright specs,
and `biome check packages/`. Both new files are already biome-clean.

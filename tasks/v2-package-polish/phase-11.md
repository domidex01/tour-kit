# Phase 11 — Inline Surveys + Skip-Logic HUD

**Duration:** Days 57–61 (~9–11 hours)
**Depends on:** Phase 2 task 2.2 (turnkey modal interfaces — `CsatModal` / `NpsModal` / `CesModal` and the `<SurveyModal>` + `<QuestionRating>` composition pattern; this phase reuses the same scoring primitives via inline rendering instead of a modal)
**Blocks:** Nothing direct (Phase 12+ are independent; no downstream phase reads from `<InlineSurvey>` or `<SurveyDebugger>`)
**Risk Level:** MEDIUM — additive components composing existing primitives, plus a tree-shake guard that must produce zero production bytes. Surface area is small but the dev-only HUD has a hard build-output contract: a single missed import would leak the debugger into a consumer's production bundle.
**Stack:** react

---

## Objective

Phase 11 closes two demo-wiring gaps for `@tour-kit/surveys` discovered while wiring `examples/dashboard-next/`:

1. **`<InlineSurvey>` — render a survey *inside* another announcement surface.** Today, asking a CSAT/NPS/CES question always summons a modal (`<CsatModal>`, etc., shipped in Phase 2.2) or forces the consumer to hand-compose `<SurveyInline>` + `<QuestionRating>` + Submit/Skip themselves. The dashboard-next demo wants to ride an existing Spotlight or Banner: "user lands on this onboarding step, the Spotlight is already visible — slot the CSAT into the Spotlight body instead of stacking a second dialog on top." `<InlineSurvey surveyId="..." layout="spotlight" />` (or `'banner'` / `'inline'`) renders the survey body — question + rating control + Submit/Skip — without any `role="dialog"` in the tree. It shares state with `useSurvey()` so a consumer can still call `useSurvey(id).show()` / `.dismiss()` / `.answer()` from anywhere; the inline and modal forms read the same underlying `SurveyState`.
2. **`<SurveyDebugger />` — dev-mode HUD for skip logic.** The package already supports conditional question flow with function predicates and visited-step cycle detection (see surveys CLAUDE.md "Skip Logic"). When a survey misbehaves ("why is question 4 not showing after the user picked option B?"), today the only recourse is `console.log` inside the predicate. The HUD subscribes to the survey state machine and shows, per active answer, the current `currentStep`, the resolved `nextQuestion`, the active branch, and the skip-logic evaluation result. It is **dev-only** — the production bundle must contain zero bytes of debugger code. Verified by a build-output test that greps `dist/index.js` for the debugger's named export.

Both changes are PR-sized, backwards-compatible at the type level, and observable in dashboard-next. The HUD lives behind an env-gated import pattern that tsup's `process.env.NODE_ENV === 'production'` literal substitution (already configured for the package) tree-shakes to nothing when consumers build for production.

## What Success Looks Like

1. `<InlineSurvey surveyId="csat-onboarding" layout="spotlight" />` renders the survey question + rating + Submit inside a non-dialog container — verified by `packages/surveys/__tests__/inline-survey.test.tsx` mounting the component, asserting (a) the question text is in the DOM, (b) `queryByRole('dialog')` returns `null`, (c) `[data-survey-inline-layout="spotlight"]` is present, (d) clicking Submit fires the survey's `complete()` path and emits `onComplete`.
2. `<InlineSurvey>` shares state with `useSurvey()` — verified by a test that registers one survey, mounts both `<InlineSurvey surveyId="x" layout="inline" />` and `useSurvey("x")` in the same provider, and asserts: calling `survey.answer("q1", 4)` from the hook updates the inline render (the rating control shows `4` selected). Single context, no duplicate state.
3. `<SurveyDebugger surveyId="csat-onboarding" />` shows, after a `survey.answer("q1", 9)` call, a DOM node whose text contains `currentStep: 0`, `nextQuestion: q2`, `branch:` (the resolved branch label or `default`), and `skipLogic: passed | failed | n/a` for that answer — verified by `__tests__/survey-debugger.test.tsx` driving the survey through three answers and snapshotting the HUD's resolved fields per step.
4. Production bundle has **zero bytes** of the debugger — verified by `packages/surveys/__tests__/build-output-no-debugger.test.ts` which runs `pnpm --filter @tour-kit/surveys build` then `grep -c "SurveyDebugger" dist/index.js dist/index.cjs` and asserts `0` for both files. The named export `SurveyDebugger` is only reachable when `process.env.NODE_ENV !== 'production'` at build time.
5. Bundle delta for `<InlineSurvey>` is `<4 KB gzipped` — measured by the existing tsup build output. Importing only `<InlineSurvey>` does not pull `<SurveyModal>`, `<CsatModal>`, `<NpsModal>`, or `<CesModal>` into the consumer bundle (tree-shake assertion via the existing `build-output` test harness pattern).
6. HUD renders in real time across the survey state machine — Storybook (or a dashboard-next fixture page in dev mode) shows the debugger updating on every `answer` / `nextQuestion` / `prevQuestion` dispatch with no manual refresh. Verified by an RTL test that asserts the HUD re-renders without remount when `useSurvey().answer()` is invoked three times in succession.
7. `pnpm --filter @tour-kit/surveys typecheck` exits 0; `pnpm --filter @tour-kit/surveys test` exits 0 (existing tests + 3 new test files).

---

## Architecture / Key Design Decisions

```
                 ┌──────────────────────────────────────────────────────────────┐
                 │ Consumer code                                                 │
                 │                                                               │
                 │  <SurveysProvider surveys={[csatConfig]}>                     │
                 │    <AnnouncementSpotlight id="onboard-step-4">                │
                 │      <InlineSurvey                                            │
                 │        surveyId="csat-onboarding"                             │
                 │        layout="spotlight"                                     │
                 │        onComplete={() => track('csat-done')}                  │
                 │      />                                                       │
                 │    </AnnouncementSpotlight>                                   │
                 │  </SurveysProvider>                                           │
                 └────────────────────────────┬─────────────────────────────────┘
                                              │
                                              ▼
                 ┌──────────────────────────────────────────────────────────────┐
                 │ <InlineSurvey> (~120 LOC)                                     │
                 │   1. useSurvey(surveyId) — same hook the modal uses           │
                 │   2. Renders current question via <QuestionRating> /          │
                 │      <QuestionText> / <QuestionSelect> based on type          │
                 │   3. data-survey-inline-layout={layout} on root for styling   │
                 │   4. No <SurveyModal> wrap — no role="dialog", no portal      │
                 │   5. Submit calls survey.nextQuestion() OR survey.complete()  │
                 │      depending on whether currentStep is the last step        │
                 │   6. Skip calls survey.dismiss('close_button')                │
                 │      when onSkip is omitted (parity with turnkey modals)      │
                 └────────────────────────────┬─────────────────────────────────┘
                                              │
                                              ▼
                 ┌──────────────────────────────────────────────────────────────┐
                 │ useSurvey() + SurveysProvider — UNCHANGED                     │
                 │   state.surveys.get(surveyId) is the SINGLE source of truth   │
                 │   for both InlineSurvey and any concurrent SurveyModal        │
                 └──────────────────────────────────────────────────────────────┘


                 ┌──────────────────────────────────────────────────────────────┐
                 │ <SurveyDebugger> (dev-only, ~80 LOC)                          │
                 │   1. const survey = useSurvey(surveyId)                       │
                 │   2. Computes per-render snapshot:                            │
                 │        currentStep:   survey.state.currentStep                │
                 │        currentQuestion: config.questions[currentStep].id      │
                 │        nextQuestion: resolveNextQuestion(config, state)       │
                 │        branch:       resolveBranch(config, state)             │
                 │        skipLogic:    evaluateSkipLogic(config, state)         │
                 │   3. Renders as fixed-position panel (bottom-right) with      │
                 │      <pre>-formatted JSON of the snapshot.                    │
                 │   4. data-survey-debugger={surveyId} for E2E hooks.           │
                 └──────────────────────────────────────────────────────────────┘
                                              │
                                              ▼
                 ┌──────────────────────────────────────────────────────────────┐
                 │ Env-gated import — keeps prod bundle clean                    │
                 │                                                               │
                 │ // packages/surveys/src/index.ts                              │
                 │ export { InlineSurvey, type InlineSurveyProps }               │
                 │   from './components/inline-survey'                           │
                 │                                                               │
                 │ // SurveyDebugger is NEVER imported from src/index.ts.        │
                 │ // It is exported ONLY via a subpath:                         │
                 │ // packages/surveys/src/dev/index.ts                          │
                 │ //   export { SurveyDebugger } from './survey-debugger'       │
                 │ //                                                            │
                 │ // package.json "exports" map:                                │
                 │ //   "./dev": {                                               │
                 │ //     "import": { "default": "./dist/dev/index.js", ... },   │
                 │ //     "require": { ... }                                     │
                 │ //   }                                                        │
                 │ //                                                            │
                 │ // Consumers opt in:                                          │
                 │ //   import { SurveyDebugger } from '@tour-kit/surveys/dev'   │
                 │ //                                                            │
                 │ // In their app code, they ALSO env-gate the import           │
                 │ // (dynamic lazy) so the dev bundle is the only one that     │
                 │ // pulls it. Pattern in docs:                                 │
                 │ //                                                            │
                 │ //   const SurveyDebugger =                                   │
                 │ //     process.env.NODE_ENV !== 'production'                  │
                 │ //       ? React.lazy(() => import('@tour-kit/surveys/dev')   │
                 │ //           .then(m => ({ default: m.SurveyDebugger })))    │
                 │ //       : null                                               │
                 │ //                                                            │
                 │ // tsup substitutes process.env.NODE_ENV at consumer build    │
                 │ // time (esbuild does this natively); the `false` branch is   │
                 │ // tree-shaken to nothing.                                    │
                 └──────────────────────────────────────────────────────────────┘
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| `<InlineSurvey>` public props | `interface InlineSurveyProps` (exported) | Public API; `interface` gets better declaration-merging errors than `type` and matches the convention used by `CsatModalProps`, `NpsModalProps`, `CesModalProps` from Phase 2.2 |
| `<SurveyDebugger>` public props | `interface SurveyDebuggerProps` (exported from subpath only) | Same convention; lives under `@tour-kit/surveys/dev` subpath, never re-exported from main barrel |
| Internal HUD snapshot | `interface DebuggerSnapshot` (NOT exported) | Used by the per-render compute in `<SurveyDebugger>`; consumers do not need to construct one. Closed shape: `currentStep`, `currentQuestion`, `nextQuestion`, `branch`, `skipLogic`, `responsesSize` |
| `layout` prop | union literal `'spotlight' \| 'banner' \| 'inline'` | Closed set; default is `'inline'`. The literal drives `data-survey-inline-layout=` for consumer styling hooks; the component does not render any layout chrome itself — it sets a data attr and lets the parent container (`<AnnouncementSpotlight>`, `<AnnouncementBanner>`, or arbitrary `<div>`) handle positioning |
| Shared survey state | `useSurvey(id)` return — existing `UseSurveyReturn` from `packages/surveys/src/hooks/use-survey.ts` | One context, one reducer, one storage write path. InlineSurvey and the modal forms read the same `SurveyState` |

**Other critical rules for this phase:**

- **No new core logic.** `<InlineSurvey>` MUST compose `useSurvey()` + the existing question primitives (`<QuestionRating>`, `<QuestionText>`, `<QuestionSelect>`, `<QuestionBoolean>`). Do not duplicate the scoring engine, skip-logic resolver, frequency check, or fatigue prevention. If a primitive is missing something needed by inline mode, fix the primitive — don't fork.
- **No `role="dialog"` in the inline render.** This is the load-bearing differentiator vs. `<SurveyModal>`. Verified by an explicit `queryByRole('dialog')` returns `null` assertion in `inline-survey.test.tsx`.
- **Single context guarantee.** `<InlineSurvey>` and `useSurvey()` MUST resolve to the same `SurveysContext`. If a consumer renders both `<InlineSurvey surveyId="x" />` and `<CsatModal>` referencing the same `surveyId` simultaneously (unusual but legal), they share state — answering in one updates the other. Verified by a contract test.
- **Subpath-only debugger export.** `packages/surveys/src/index.ts` MUST NOT contain any reference to `./dev/survey-debugger` or `./dev/index`. Verified by `expect(readFileSync('src/index.ts', 'utf8')).not.toMatch(/dev\//)`.
- **`exports` map + tsup `entry` updated atomically.** Main entry, headless entry, and the new `./dev` entry. tsup's existing `splitting: true` + `treeshake: true` config plus esbuild's `process.env.NODE_ENV` literal substitution does the work — no manual `define` is required, but the subpath must be a separate tsup entry so the main bundle stays clean.
- **Env-gated lazy import documented at the consumer boundary.** The package itself ships the debugger as a regular export under `/dev`. The tree-shake guarantee is achieved by *how consumers import it* — the docs MDX example uses `React.lazy` wrapped in a `process.env.NODE_ENV !== 'production'` ternary. The build-output test we ship asserts the package side of the contract: nothing in `dist/index.js` references the debugger. The consumer side is documented but not enforced (cannot be — it's their bundler).
- **Reduced motion.** No new animations introduced in Phase 11. `<InlineSurvey>` reuses the static `<QuestionRating>` / `<QuestionText>` / `<QuestionSelect>` controls which are already reduced-motion safe per the cross-package contract in CLAUDE.md. The debugger's panel has no animation. No new `motion-safe:` work required.

---

## Tasks

### Task 11.1 — `<InlineSurvey>` component (5–6 h)

**Depends on:** Phase 2 task 2.2 (`<CsatModal>` / `<NpsModal>` / `<CesModal>` established the turnkey wrapping pattern over `<SurveyModal>` + `<QuestionRating>`; Phase 11 mirrors that pattern but skips the modal wrap).

Create `packages/surveys/src/components/inline-survey.tsx`. The component owns no state of its own — `useSurvey(surveyId)` is the single source of truth. It selects the right question primitive (`<QuestionRating>` / `<QuestionText>` / `<QuestionSelect>` / `<QuestionBoolean>`) for the current step, wires `onChange` to `survey.answer(questionId, value)`, and provides Submit + Skip buttons.

```ts
// packages/surveys/src/components/inline-survey.tsx
'use client'

import * as React from 'react'
import { useSurvey } from '../hooks/use-survey'
import type { AnswerValue, QuestionConfig } from '../types/question'

export interface InlineSurveyProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Survey id — must match a SurveyConfig registered in SurveysProvider */
  surveyId: string
  /**
   * Layout hint applied as `data-survey-inline-layout=` on the root div.
   * Does NOT render layout chrome — the parent container owns positioning.
   * Default: 'inline'.
   */
  layout?: 'spotlight' | 'banner' | 'inline'
  /** Override the Submit button label. Default 'Submit'. */
  submitLabel?: string
  /** Override the Skip button label. Default 'Skip'. When `onSkip` is undefined,
   *  the Skip button is hidden entirely. */
  skipLabel?: string
  /** Optional explicit skip handler. When omitted, the Skip button is hidden. */
  onSkip?: () => void
  /** Fired after the FINAL question's Submit closes the survey
   *  (i.e. when survey.complete() runs). */
  onComplete?: () => void
  /** When true, the inline body renders even if the survey is hidden
   *  (useful for Storybook previews + dev tools). Default: false. */
  alwaysRender?: boolean
}
```

Implementation notes:
- Get the survey via `const survey = useSurvey(surveyId)`. If `!survey.config` (not registered) → render `null` and emit a one-time dev `console.warn`: `[tour-kit] <InlineSurvey surveyId="${surveyId}"> — no survey registered with this id`.
- Visibility gate: `if (!alwaysRender && !survey.state?.isVisible) return null`. Mirrors `<SurveyInline>`'s existing behavior.
- Pick the current question: `const question = survey.config.questions[survey.state?.currentStep ?? 0]`. If `question` is undefined (out-of-range step) → render `null`.
- Render the question via a small dispatcher (inline switch on `question.type` — no new abstraction). Map:
  - `'rating'` → `<QuestionRating id={question.id} preset={question.preset} ratingScale={question.ratingScale} value={currentResponse} onChange={(v) => survey.answer(question.id, v)} label={question.label} />`
  - `'text'` / `'textarea'` → `<QuestionText … />`
  - `'single-select'` / `'multi-select'` → `<QuestionSelect … />`
  - `'boolean'` → `<QuestionBoolean … />`
  - Unknown type → render `null` and warn.
- `currentResponse`: `survey.state?.responses.get(question.id) ?? null`. Pass this down so navigating back via `prevQuestion()` preserves the answer.
- Submit button:
  - `disabled` when the current question requires a value and `currentResponse` is `null`/`undefined`/`''`/empty array. The required check defers to the question's existing `required` flag if present.
  - `onClick`:
    - If `survey.state.currentStep === survey.config.questions.length - 1` → call `survey.complete()` then `props.onComplete?.()`.
    - Else → call `survey.nextQuestion()`. The provider's existing skip-logic engine handles branching.
- Skip button: `if (onSkip) <button onClick={onSkip}>{skipLabel ?? 'Skip'}</button>` else hidden. Skip button is a tertiary text-link button (visual hierarchy parity with the turnkey modals).
- Root div data attrs (load-bearing for tree-shake/contract tests + consumer styling):
  - `data-survey-inline={surveyId}`
  - `data-survey-inline-layout={layout ?? 'inline'}`
  - `role="region"`, `aria-label={config.title ?? 'Survey'}`
- Use `React.forwardRef<HTMLDivElement, InlineSurveyProps>` for parity with `<SurveyInline>`. Pass through `className` and `...rest`.
- Export from `packages/surveys/src/components/index.ts` as a named export.
- Update `packages/surveys/src/index.ts` to re-export `InlineSurvey` and `InlineSurveyProps` from `./components/inline-survey`.

**Sanity check:** `pnpm --filter @tour-kit/surveys typecheck` exits 0. `pnpm --filter @tour-kit/surveys test -- inline-survey` mounts `<SurveysProvider surveys={[csatConfig]}><InlineSurvey surveyId="csat" layout="spotlight" /></SurveysProvider>`, calls `show("csat")` via a probe hook, and asserts: (a) question text in DOM, (b) `queryByRole('dialog')` is `null`, (c) `[data-survey-inline-layout="spotlight"]` present, (d) clicking rating "4" then Submit dispatches `complete()` and fires `onComplete`.

---

### Task 11.2 — `<SurveyDebugger />` dev HUD + subscription hook (3–4 h)

**Depends on:** —

Create `packages/surveys/src/dev/survey-debugger.tsx` and (if non-trivial subscription logic is needed) `packages/surveys/src/dev/use-debugger-state.ts`.

The HUD subscribes to the survey state machine via the existing `useSurvey()` hook (no new subscription mechanism — `useSurvey` already returns the live `state`, which re-renders the component on every reducer dispatch). It computes a `DebuggerSnapshot` per render and prints it as readable JSON.

```ts
// packages/surveys/src/dev/survey-debugger.tsx
'use client'

import * as React from 'react'
import { useSurvey } from '../hooks/use-survey'
import { useDebuggerState } from './use-debugger-state'

export interface SurveyDebuggerProps {
  /** Survey id to introspect — must be registered in SurveysProvider. */
  surveyId: string
  /** Fixed position on screen. Default 'bottom-right'. */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** Optional class for the fixed panel. */
  className?: string
}

interface DebuggerSnapshot {
  surveyId: string
  isVisible: boolean
  currentStep: number
  currentQuestion: string | null
  nextQuestion: string | null
  branch: string
  skipLogic: 'passed' | 'failed' | 'n/a'
  responsesCount: number
}

export function SurveyDebugger({ surveyId, position = 'bottom-right', className }: SurveyDebuggerProps) {
  const snapshot = useDebuggerState(surveyId)
  if (!snapshot) return null
  return (
    <div
      data-survey-debugger={surveyId}
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        zIndex: 9999,
        [position.includes('top') ? 'top' : 'bottom']: 8,
        [position.includes('left') ? 'left' : 'right']: 8,
        maxWidth: 360,
        padding: 8,
        background: 'rgba(0,0,0,0.8)',
        color: '#fff',
        font: '12px ui-monospace,monospace',
        borderRadius: 6,
      }}
      className={className}
    >
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(snapshot, null, 2)}
      </pre>
    </div>
  )
}
```

```ts
// packages/surveys/src/dev/use-debugger-state.ts
import { useMemo } from 'react'
import { useSurvey } from '../hooks/use-survey'
import type { AnswerValue, QuestionConfig } from '../types/question'

interface DebuggerSnapshot {
  surveyId: string
  isVisible: boolean
  currentStep: number
  currentQuestion: string | null
  nextQuestion: string | null
  branch: string
  skipLogic: 'passed' | 'failed' | 'n/a'
  responsesCount: number
}

/**
 * Computes the live debugger snapshot for a survey on every state change.
 * No external subscription — useSurvey() already re-renders on dispatch.
 */
export function useDebuggerState(surveyId: string): DebuggerSnapshot | null {
  const survey = useSurvey(surveyId)
  return useMemo(() => {
    if (!survey.config || !survey.state) return null
    const step = survey.state.currentStep
    const currentQ: QuestionConfig | undefined = survey.config.questions[step]
    const currentResp: AnswerValue | undefined = currentQ
      ? survey.state.responses.get(currentQ.id)
      : undefined

    const next = resolveNextQuestion(survey.config, survey.state, currentResp)
    const branch = resolveBranch(survey.config, survey.state)
    const skipLogic = evaluateSkipLogic(currentQ, currentResp)

    return {
      surveyId,
      isVisible: survey.state.isVisible,
      currentStep: step,
      currentQuestion: currentQ?.id ?? null,
      nextQuestion: next,
      branch,
      skipLogic,
      responsesCount: survey.state.responses.size,
    }
  }, [survey.state, survey.config, surveyId])
}

// Helpers — kept local to the dev module so they never leak into main bundle.
function resolveNextQuestion(config: import('../types/survey').SurveyConfig, state: import('../types/survey').SurveyState, currentResp: AnswerValue | undefined): string | null {
  // Mirror the provider's existing skip-logic resolution. If a `skipLogic`
  // predicate is present on the current question, evaluate it; otherwise
  // return the next question id by index, or null if at the end.
  const idx = state.currentStep
  const q = config.questions[idx]
  if (!q) return null
  // If the question carries a function predicate for routing, evaluate it.
  // (Question-level skip predicates live on QuestionConfig.skipLogic per
  // the package's existing skip-logic surface — see types/question.ts.)
  // biome-ignore lint/suspicious/noExplicitAny: skip-logic shape is internal
  const sl = (q as any).skipLogic as ((value: AnswerValue | undefined, responses: Map<string, AnswerValue>) => string | null) | undefined
  if (typeof sl === 'function') {
    const target = sl(currentResp, state.responses)
    if (target === null) return null
    if (target) return target
  }
  return config.questions[idx + 1]?.id ?? null
}

function resolveBranch(config: import('../types/survey').SurveyConfig, state: import('../types/survey').SurveyState): string {
  // If the package has a notion of named branches, surface it. Otherwise
  // 'default' is the honest fallback.
  // biome-ignore lint/suspicious/noExplicitAny: branch shape is internal
  const branch = (state as any).branch as string | undefined
  return branch ?? 'default'
}

function evaluateSkipLogic(currentQ: QuestionConfig | undefined, currentResp: AnswerValue | undefined): 'passed' | 'failed' | 'n/a' {
  if (!currentQ) return 'n/a'
  // biome-ignore lint/suspicious/noExplicitAny: skip-logic shape is internal
  const sl = (currentQ as any).skipLogic
  if (typeof sl !== 'function') return 'n/a'
  // The HUD doesn't *re-evaluate* skip logic destructively — it just shows
  // whether the predicate ran and what it returned.
  try {
    const result = sl(currentResp, new Map())
    return result === null || result === undefined ? 'failed' : 'passed'
  } catch {
    return 'failed'
  }
}
```

Implementation notes:
- The HUD does not subscribe to any new event source — `useSurvey()` already re-renders on every reducer dispatch, which is sufficient.
- The internal `DebuggerSnapshot` interface is NOT exported from the dev module. Only `SurveyDebugger` and `SurveyDebuggerProps` are exported.
- The HUD must be tolerant: if `surveyId` is not registered, `useDebuggerState` returns `null` and the component renders `null`. No throw.
- `aria-live="polite"` so screen readers announce snapshot changes if the HUD ends up in the a11y tree (developer setting — fine).
- Style is inline so the dev module has zero CSS dependencies. Do not import any utility from `../lib` that would force the main bundle to ship the same CSS.
- Create `packages/surveys/src/dev/index.ts` with `export { SurveyDebugger, type SurveyDebuggerProps } from './survey-debugger'`. **Do not** re-export anything else.

**Sanity check:** `pnpm --filter @tour-kit/surveys typecheck` exits 0. `pnpm --filter @tour-kit/surveys test -- survey-debugger` mounts the debugger inside a provider, drives `survey.answer("q1", 9)` and `survey.nextQuestion()`, and asserts the rendered `<pre>` text contains `"currentStep": 1` and `"nextQuestion":` updated to `"q2"`.

---

### Task 11.3 — Subpath export + tree-shake guarantee + docs (1 h)

**Depends on:** 11.2

Wire the subpath export and a build-output test that proves no debugger bytes leak into the main bundle.

Update `packages/surveys/package.json` `exports` map:

```json
"exports": {
  ".": {
    "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
  },
  "./headless": { /* unchanged */ },
  "./dev": {
    "import": {
      "types": "./dist/dev/index.d.ts",
      "default": "./dist/dev/index.js"
    },
    "require": {
      "types": "./dist/dev/index.d.cts",
      "default": "./dist/dev/index.cjs"
    }
  },
  "./package.json": "./package.json"
}
```

Update `packages/surveys/tsup.config.ts` to add the new entry:

```ts
entry: {
  index: 'src/index.ts',
  headless: 'src/headless.ts',
  'dev/index': 'src/dev/index.ts', // NEW
},
```

No new `external` entries needed — the dev module imports only `react` (already external) and internal modules under `../hooks` / `../types` which are bundled normally for the dev entry. tsup's existing `splitting: true` ensures shared internals are de-duplicated; the main entry should still grep clean for `SurveyDebugger`.

Create the build-output guard test `packages/surveys/__tests__/build-output-no-debugger.test.ts`:

```ts
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('build output — debugger is dev-only', () => {
  const distDir = resolve(__dirname, '../dist')

  it('skips when dist/ is not built (CI orders build before test in `pnpm test`)', () => {
    if (!existsSync(distDir)) {
      console.warn('[build-output] dist/ not present — skipping. Run `pnpm --filter @tour-kit/surveys build` first.')
      return
    }
  })

  it('dist/index.js does NOT reference SurveyDebugger', () => {
    if (!existsSync(resolve(distDir, 'index.js'))) return
    const src = readFileSync(resolve(distDir, 'index.js'), 'utf8')
    expect(src).not.toMatch(/SurveyDebugger/)
    expect(src).not.toMatch(/survey-debugger/)
    expect(src).not.toMatch(/use-debugger-state/)
  })

  it('dist/index.cjs does NOT reference SurveyDebugger', () => {
    if (!existsSync(resolve(distDir, 'index.cjs'))) return
    const src = readFileSync(resolve(distDir, 'index.cjs'), 'utf8')
    expect(src).not.toMatch(/SurveyDebugger/)
    expect(src).not.toMatch(/survey-debugger/)
  })

  it('dist/dev/index.js DOES export SurveyDebugger', () => {
    const devPath = resolve(distDir, 'dev/index.js')
    if (!existsSync(devPath)) return
    const src = readFileSync(devPath, 'utf8')
    expect(src).toMatch(/SurveyDebugger/)
  })
})
```

This is a **post-build** test. Add a `test:build-output` script to `packages/surveys/package.json`:

```json
"scripts": {
  "build": "tsup",
  "test": "vitest run",
  "test:build-output": "pnpm build && vitest run __tests__/build-output-no-debugger.test.ts"
}
```

CI / local verification: `pnpm --filter @tour-kit/surveys test:build-output`. The bare `pnpm --filter @tour-kit/surveys test` skips the build-output assertions when `dist/` is missing (so existing test runs don't break).

Create docs at `apps/docs/content/docs/surveys/inline.mdx` with two examples:

```mdx
---
title: Inline Surveys
description: Render a survey inside a Spotlight or Banner without a modal.
published: true
---

import { InlineSurvey } from '@tour-kit/surveys'
import { AnnouncementSpotlight } from '@tour-kit/announcements'

## Inside a Spotlight

```tsx
<AnnouncementSpotlight id="onboard-step-4">
  <InlineSurvey
    surveyId="csat-onboarding"
    layout="spotlight"
    onComplete={() => track('csat-done')}
  />
</AnnouncementSpotlight>
```

## Skip-logic debugger (dev only)

The `<SurveyDebugger>` HUD shows per-answer decisions for skip logic. It lives at a
subpath so it tree-shakes out of production:

```tsx
import * as React from 'react'

// Env-gated lazy import keeps the debugger out of production bundles.
const SurveyDebugger =
  process.env.NODE_ENV !== 'production'
    ? React.lazy(() =>
        import('@tour-kit/surveys/dev').then((m) => ({ default: m.SurveyDebugger }))
      )
    : null

export function App() {
  return (
    <>
      <InlineSurvey surveyId="csat-onboarding" />
      {SurveyDebugger ? (
        <React.Suspense fallback={null}>
          <SurveyDebugger surveyId="csat-onboarding" />
        </React.Suspense>
      ) : null}
    </>
  )
}
```
```

Register the page in the surveys nav (`apps/docs/content/docs/surveys/meta.json` — verify the exact filename by listing the directory).

**Sanity check:** `pnpm --filter @tour-kit/surveys build && pnpm --filter @tour-kit/surveys test:build-output` exits 0 and reports zero `SurveyDebugger` references in `dist/index.{js,cjs}` and ≥1 in `dist/dev/index.js`. `pnpm --filter @tour-kit/docs build` succeeds and `/docs/surveys/inline` appears in the rendered nav.

---

## Deliverables

```
packages/surveys/src/components/inline-survey.tsx                       # NEW — InlineSurvey component (~120 LOC); composes useSurvey + question primitives, no role=dialog
packages/surveys/src/components/index.ts                                # UPDATE — add InlineSurvey named export
packages/surveys/src/dev/survey-debugger.tsx                            # NEW — fixed-position HUD that prints DebuggerSnapshot per render
packages/surveys/src/dev/use-debugger-state.ts                          # NEW — subscription hook that derives the snapshot from useSurvey() state
packages/surveys/src/dev/index.ts                                       # NEW — subpath barrel: exports SurveyDebugger + SurveyDebuggerProps only
packages/surveys/src/index.ts                                           # UPDATE — re-export InlineSurvey + InlineSurveyProps; MUST NOT reference dev/
packages/surveys/__tests__/inline-survey.test.tsx                       # NEW — RTL: no dialog role, shared state with useSurvey, layout data attr, Submit fires complete
packages/surveys/__tests__/survey-debugger.test.tsx                     # NEW — RTL: HUD updates on answer/nextQuestion; snapshot fields match resolved skip logic
packages/surveys/__tests__/build-output-no-debugger.test.ts             # NEW — post-build smoke; greps dist/index.{js,cjs} for zero SurveyDebugger references
packages/surveys/package.json                                           # UPDATE — exports map adds ./dev; add test:build-output script
packages/surveys/tsup.config.ts                                         # UPDATE — add dev/index entry
apps/docs/content/docs/surveys/inline.mdx                               # NEW — docs page with InlineSurvey + env-gated SurveyDebugger examples
apps/docs/content/docs/surveys/meta.json                                # UPDATE — register inline page in nav
```

No new runtime dependencies. No peer-dep changes. No changes to the surveys reducer, scoring engine, frequency check, or storage adapter.

---

## Exit Criteria

- [ ] `<InlineSurvey surveyId="csat-x" layout="spotlight" />` renders the survey body with no `role="dialog"` in the tree — `inline-survey.test.tsx` `queryByRole('dialog')` returns `null`; `[data-survey-inline-layout="spotlight"]` is present.
- [ ] HUD shows skip-logic evaluation in real time — `survey-debugger.test.tsx` drives three `answer()` / `nextQuestion()` calls and asserts the rendered `<pre>` text reflects updated `currentStep`, `nextQuestion`, and `skipLogic` after each (no remount; same component instance re-renders). Also visible in the Storybook (or dashboard-next dev) fixture.
- [ ] Production bundle has zero bytes from the debugger — `pnpm --filter @tour-kit/surveys build && grep -c "SurveyDebugger" packages/surveys/dist/index.js packages/surveys/dist/index.cjs` returns `0` for both files. `__tests__/build-output-no-debugger.test.ts` exits 0 via `pnpm --filter @tour-kit/surveys test:build-output`.
- [ ] `useSurvey()` state shared between inline + modal forms — `inline-survey.test.tsx` mounts `<InlineSurvey surveyId="x" />` alongside a sibling component calling `useSurvey("x").answer("q1", 4)`; asserts the rating control inside `<InlineSurvey>` shows `4` selected. Single context, no duplicate state.
- [ ] Bundle delta for `<InlineSurvey>` `<4 KB gzipped` — measured by the tsup build output; tree-shake assertion in the existing `build-output` pattern confirms importing `InlineSurvey` does not pull `<CsatModal>`, `<NpsModal>`, `<CesModal>`, or `<SurveyModal>` into the test bundle.
- [ ] `packages/surveys/src/index.ts` does NOT import from `./dev/*` — `grep -c "dev/" packages/surveys/src/index.ts` returns `0`.
- [ ] `packages/surveys/package.json` `exports` map contains `./dev` entry pointing at `./dist/dev/index.{js,cjs,d.ts,d.cts}`.
- [ ] `ls packages/surveys/dist/dev/index.js packages/surveys/dist/dev/index.cjs packages/surveys/dist/dev/index.d.ts` returns all three files (subpath built).
- [ ] `pnpm --filter @tour-kit/surveys typecheck` exits 0; no `any` introduced outside the documented `biome-ignore` lines that index the existing skip-logic shape; no new `@ts-expect-error` / `@ts-ignore`.
- [ ] `pnpm --filter @tour-kit/surveys test` exits 0 (existing tests + the 2 new RTL test files); `pnpm --filter @tour-kit/surveys test:build-output` exits 0 (the build-output smoke).
- [ ] `apps/docs/content/docs/surveys/inline.mdx` exists, is registered in nav with `published: true`, and `pnpm --filter @tour-kit/docs build` succeeds. The page renders at `/docs/surveys/inline` and shows both the `<InlineSurvey>` example and the env-gated `<SurveyDebugger>` lazy-import snippet.

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to implement this phase:

---
You are building Phase 11 of Tour Kit v2 Package Polish — Inline Surveys + Skip-Logic HUD.

### What This Project Is
Tour Kit is a pnpm monorepo of 12 packages providing headless React product-tour primitives (`@tour-kit/core`, `react`, `hints`) plus pro packages (`announcements`, `surveys`, `checklists`, `adoption`, `analytics`, `ai`, `scheduling`, `license`, `media`). v2 closes demo-wiring gaps reported while building `examples/dashboard-next/`. Every phase ships as one PR with backwards-compatible types. Stack: TypeScript strict mode, React 18+, tsup, Turborepo, Vitest + React Testing Library, pnpm. The `@tour-kit/surveys` package is currently at v3.0.0.

### Established in Prior Phases
- **Phase 2 task 2.2** shipped `<CsatModal>`, `<NpsModal>`, `<CesModal>` in `packages/surveys/src/components/`. They wrap `<SurveyModal>` + `<QuestionRating>` + Submit/Skip and own one transient `useState<number | null>` for the selected rating. Their props are `interface` (not `type`) per the package's convention. The submit callback contracts are:
  - `<CsatModal>`: `onSubmit: (rating: number) => void`
  - `<NpsModal>`: `onSubmit: (score: number, category: NpsCategory) => void`
  - `<CesModal>`: `onSubmit: (score: number, category: CesCategory) => void`
- **Phase 7** redesigned `<AnnouncementSpotlight>` and added a peer-optional Sonner adapter. Spotlight accepts `children: ReactNode` (verified at line 28 / 42 of `announcement-spotlight.tsx`) — `<InlineSurvey>` can be passed as a child. No coupling beyond that; this phase does not change the spotlight.
- `useSurvey(id)` already exists at `packages/surveys/src/hooks/use-survey.ts` and returns the live `state` (re-renders on every reducer dispatch). It is the single subscription point for both the inline survey body and the dev HUD. Signature:

```ts
interface UseSurveyReturn {
  state: SurveyState | undefined
  config: SurveyConfig | undefined
  show: () => void
  hide: () => void
  dismiss: (reason?: DismissalReason) => void
  snooze: () => void
  answer: (questionId: string, value: AnswerValue) => void
  nextQuestion: () => void
  prevQuestion: () => void
  complete: () => void
  reset: () => void
  canShow: boolean
}
export function useSurvey(surveyId: string): UseSurveyReturn
```

- Existing primitives in `packages/surveys/src/components/`: `question-rating.tsx`, `question-text.tsx`, `question-select.tsx`, `question-boolean.tsx`, `question-media.tsx`, `survey-modal.tsx`, `survey-inline.tsx`, `survey-banner.tsx`. The `<SurveyInline>` component (existing, 38 LOC) renders a `<section role="region">` shell and accepts children but does NOT auto-render the current question — consumers must hand-compose. Phase 11's `<InlineSurvey>` is the auto-composing replacement.
- `SurveysProvider` (668 LOC) uses `useReducer`; storage adapter persists on every dispatch; the reducer mutates `state.surveys: Map<string, SurveyState>` and `state.queue: string[]`. The skip-logic engine evaluates `QuestionConfig.skipLogic` predicates during `nextQuestion()` dispatch (see provider source). DO NOT touch the provider.

### Your Goal for This Phase
1. Add `<InlineSurvey>` — renders the current question of a registered survey *inside* an arbitrary container (no modal, no portal, no `role="dialog"`). Shares state with `useSurvey()` because it IS `useSurvey()` under the hood.
2. Add `<SurveyDebugger>` — dev-only HUD that prints `currentStep`, `currentQuestion`, `nextQuestion`, `branch`, and `skipLogic` evaluation per render. Lives at the subpath `@tour-kit/surveys/dev` so it never leaks into a consumer's production bundle.
3. Add `__tests__/build-output-no-debugger.test.ts` — post-build smoke that greps `dist/index.{js,cjs}` for zero references to `SurveyDebugger`. Wired into a new `test:build-output` npm script.
4. Add docs page `apps/docs/content/docs/surveys/inline.mdx` showing both the `<InlineSurvey>` usage and the env-gated `React.lazy` import pattern that keeps the debugger tree-shaken in production.

### Data Model Rules (follow exactly)
- **Public component props are `interface`** (not `type`). Export `InlineSurveyProps` from `src/components/inline-survey.tsx`; export `SurveyDebuggerProps` from `src/dev/survey-debugger.tsx`. Match the convention from Phase 2.2's `CsatModalProps` / `NpsModalProps` / `CesModalProps`.
- **`InlineSurveyProps.layout`** is a closed union literal: `'spotlight' | 'banner' | 'inline'`. Default `'inline'`. The literal is applied as `data-survey-inline-layout=` on the root div for consumer styling — the component does NOT render layout chrome itself. The parent container (Spotlight/Banner/div) owns positioning.
- **No new state in `<InlineSurvey>`.** All state lives in `useSurvey()`. Read the current question via `survey.config.questions[survey.state.currentStep]`; read the current response via `survey.state.responses.get(question.id)`.
- **No new state in `<SurveyDebugger>`.** Derive `DebuggerSnapshot` from `useSurvey()` via `useMemo`. The internal `DebuggerSnapshot` interface is NOT exported.
- **`<SurveyDebugger>` lives ONLY under the `/dev` subpath.** `packages/surveys/src/index.ts` MUST NOT import from `./dev/*`. Verified by grep in the exit criteria.
- **No new Zod schemas, no new core logic.** This phase composes existing primitives. If you find a missing primitive feature, fix the primitive — don't fork.

### Architecture

```
Consumer renders:
  <SurveysProvider surveys={[csatConfig]}>
    <AnnouncementSpotlight id="onboard-step-4">
      <InlineSurvey surveyId="csat" layout="spotlight" onComplete={track} />
    </AnnouncementSpotlight>
    {/* Dev-only HUD — env-gated by consumer */}
    <SurveyDebugger surveyId="csat" />
  </SurveysProvider>

InlineSurvey internals:
  const survey = useSurvey(surveyId)
  if (!survey.config) return null + warn
  if (!alwaysRender && !survey.state.isVisible) return null
  const q = survey.config.questions[survey.state.currentStep]
  switch (q.type) {
    case 'rating':        <QuestionRating onChange={(v) => survey.answer(q.id, v)} />
    case 'text'/'textarea': <QuestionText ... />
    case 'single-select'/'multi-select': <QuestionSelect ... />
    case 'boolean':       <QuestionBoolean ... />
  }
  <button onClick={() => isLast ? survey.complete() : survey.nextQuestion()}>Submit</button>
  {onSkip && <button onClick={onSkip}>Skip</button>}

SurveyDebugger internals:
  const snapshot = useDebuggerState(surveyId)
  return <div data-survey-debugger={surveyId} style={fixedPositionStyle}>
           <pre>{JSON.stringify(snapshot, null, 2)}</pre>
         </div>

Subpath export — tsup config:
  entry: { index, headless, 'dev/index' }
  → dist/index.js (no SurveyDebugger)
  → dist/dev/index.js (SurveyDebugger only)
```

### Confirmed Library APIs

No new libraries this phase. The env-gated tree-shake is achieved by:
1. **Package side:** `<SurveyDebugger>` lives only at `src/dev/`. A separate tsup entry `'dev/index': 'src/dev/index.ts'` produces `dist/dev/index.{js,cjs,d.ts}`. The main entry `src/index.ts` never references `./dev/*`. esbuild's existing `splitting: true` + `treeshake: true` in `tsup.config.ts` ensures the main bundle stays clean. No `define` config needed.
2. **Consumer side (documented but not enforced):** `const SurveyDebugger = process.env.NODE_ENV !== 'production' ? React.lazy(() => import('@tour-kit/surveys/dev').then(m => ({ default: m.SurveyDebugger }))) : null`. Bundlers (esbuild, webpack, vite, rollup) substitute `process.env.NODE_ENV` as a literal at production build time, then dead-code-eliminate the `false` branch including the dynamic `import()`.

Verbatim references from the existing repo:

```ts
// packages/surveys/src/hooks/use-survey.ts — DO NOT change
import { useMemo } from 'react'
import { useSurveysContext } from '../context/surveys-context'
import type { AnswerValue } from '../types/question'
import type { DismissalReason, SurveyConfig, SurveyState } from '../types/survey'

interface UseSurveyReturn {
  state: SurveyState | undefined
  config: SurveyConfig | undefined
  show: () => void
  hide: () => void
  dismiss: (reason?: DismissalReason) => void
  snooze: () => void
  answer: (questionId: string, value: AnswerValue) => void
  nextQuestion: () => void
  prevQuestion: () => void
  complete: () => void
  reset: () => void
  canShow: boolean
}

export function useSurvey(surveyId: string): UseSurveyReturn
```

```ts
// Phase 2.2 turnkey modal prop interfaces — VERBATIM (from phase-2.md)
// CsatModal
export interface CsatModalProps
  extends Omit<SurveyModalProps, 'surveyId' | 'children'> {
  surveyId?: string
  question: string
  ratingScale?: RatingScale
  onSubmit: (rating: number) => void
  onSkip?: () => void
  submitLabel?: string
  skipLabel?: string
}

// NpsModal
export interface NpsModalProps
  extends Omit<SurveyModalProps, 'surveyId' | 'children'> {
  surveyId?: string
  question: string
  ratingScale?: RatingScale
  onSubmit: (score: number, category: NpsCategory) => void
  onSkip?: () => void
  submitLabel?: string
  skipLabel?: string
}

// CesModal
export interface CesModalProps
  extends Omit<SurveyModalProps, 'surveyId' | 'children'> {
  surveyId?: string
  question: string
  ratingScale?: RatingScale
  onSubmit: (score: number, category: CesCategory) => void
  onSkip?: () => void
  submitLabel?: string
  skipLabel?: string
}
```

Phase 11 reuses the same scoring primitives but renders inline. The `InlineSurveyProps` interface (defined in Files-to-Create below) follows the same conventions but takes `surveyId` as the load-bearing input (not `question` — because a real survey config is already registered) and adds the `layout` literal.

```ts
// Existing SurveyInline (38 LOC, packages/surveys/src/components/survey-inline.tsx)
// Read it to understand the visibility gate + role/aria pattern.
// InlineSurvey replaces SurveyInline's "consumer hand-composes children" model
// with auto-composition of the current question, but keeps the same
// data-survey-inline={surveyId} attr for backward-compatible E2E selectors.

// Existing question primitives (packages/surveys/src/components/):
//   <QuestionRating  id label preset? ratingScale? value? onChange? lowLabel? highLabel? />
//   <QuestionText    id label value? onChange? required? />
//   <QuestionSelect  id label options value? onChange? multiSelect? />
//   <QuestionBoolean id label value? onChange? />
// All accept controlled value/onChange; reuse without wrapping.

// Existing SurveyConfig.questions: QuestionConfig[]
// QuestionConfig fields used by InlineSurvey: id, type, label, required?,
// preset?, ratingScale?, options?, and (existing) skipLogic? predicate.
```

```bash
# Bundle-analyzer verification command (paste verbatim into Exit Criteria run):
pnpm --filter @tour-kit/surveys build && \
  grep -c "SurveyDebugger" packages/surveys/dist/index.js packages/surveys/dist/index.cjs
# Expect: both lines print 0
```

### Files to Create / Update

#### `packages/surveys/src/components/inline-survey.tsx` (NEW, ~120 LOC)
Export `InlineSurveyProps` interface and `InlineSurvey` component (React.forwardRef<HTMLDivElement>). Use `useSurvey(surveyId)` only — no internal state. Visibility gate: `if (!alwaysRender && !survey.state?.isVisible) return null`. Pick current question by index from `survey.config.questions[survey.state.currentStep]`. Render the right question primitive via a switch on `question.type` (no new abstraction — keep the switch local). Wire each primitive's `onChange` to `survey.answer(question.id, value)`. Submit button: `disabled` until response is present; click runs `survey.complete()` + `props.onComplete?.()` on the last question, else `survey.nextQuestion()`. Skip button is hidden when `onSkip` is undefined. Root div gets `data-survey-inline={surveyId}`, `data-survey-inline-layout={layout ?? 'inline'}`, `role="region"`, `aria-label={config.title ?? 'Survey'}`. Pass through `className` and `...rest`. No animations, no `motion-safe:` needed (no `tailwindcss-animate` utilities used).

#### `packages/surveys/src/components/index.ts` (UPDATE)
Add `export { InlineSurvey, type InlineSurveyProps } from './inline-survey'`.

#### `packages/surveys/src/index.ts` (UPDATE)
Re-export `InlineSurvey` + `InlineSurveyProps`. **DO NOT** add any import that resolves to `./dev/*`. Verify with `grep "dev/" src/index.ts` returns nothing.

#### `packages/surveys/src/dev/survey-debugger.tsx` (NEW, ~80 LOC)
Export `SurveyDebugger` component + `SurveyDebuggerProps` interface. Read state via `useDebuggerState(surveyId)`. Render a fixed-position `<div>` (inline style, no Tailwind class — keeps the dev module CSS-free) with `data-survey-debugger={surveyId}`, `role="status"`, `aria-live="polite"`, and a `<pre>` containing `JSON.stringify(snapshot, null, 2)`. Default `position="bottom-right"`. Renders `null` when `snapshot` is `null` (survey not registered).

#### `packages/surveys/src/dev/use-debugger-state.ts` (NEW, ~70 LOC)
Export `useDebuggerState(surveyId)` hook returning `DebuggerSnapshot | null`. Computes the snapshot per render via `useMemo([survey.state, survey.config, surveyId])`. Local helpers `resolveNextQuestion`, `resolveBranch`, `evaluateSkipLogic` interpret the existing `QuestionConfig.skipLogic` predicate (type narrowed via documented `biome-ignore` annotations on the `as any` casts that index the internal shape). Returns `'passed' | 'failed' | 'n/a'` for skip-logic evaluation. The internal `DebuggerSnapshot` interface is NOT exported.

#### `packages/surveys/src/dev/index.ts` (NEW)
`export { SurveyDebugger, type SurveyDebuggerProps } from './survey-debugger'`. Nothing else.

#### `packages/surveys/__tests__/inline-survey.test.tsx` (NEW)
- Mount `<SurveysProvider surveys={[csatConfig]}><InlineSurvey surveyId="csat" layout="spotlight" alwaysRender /></SurveysProvider>` (use `alwaysRender` to skip the visibility gate for the static cases).
- Assert: (a) `screen.queryByText(csatConfig.questions[0].label)` is in DOM, (b) `screen.queryByRole('dialog')` is `null`, (c) `screen.getByText(/csat-onboarding|.../).closest('[data-survey-inline-layout="spotlight"]')` is non-null.
- Drive a rating click + Submit: assert `survey.complete()` is invoked (use a probe hook that exposes the live state) and `onComplete` fires.
- **Shared-state test:** render a sibling probe component that calls `useSurvey("csat").answer("q1", 4)` on mount, then assert the rating control inside `<InlineSurvey>` has `aria-pressed="true"` (or whatever the rating preset uses) on the "4" option — proves single context.

#### `packages/surveys/__tests__/survey-debugger.test.tsx` (NEW)
- Mount the debugger inside a provider with a 2-question CSAT config.
- Probe hook drives `survey.answer("q1", 9)`, then `survey.nextQuestion()`, then `survey.answer("q2", 5)`.
- After each step, assert the rendered `<pre>` text JSON contains the expected `currentStep` and `nextQuestion` values. No remount — the debugger updates in place.

#### `packages/surveys/__tests__/build-output-no-debugger.test.ts` (NEW)
Post-build smoke. Reads `dist/index.js` and `dist/index.cjs` via `node:fs`, asserts neither matches `/SurveyDebugger/`. Also asserts `dist/dev/index.js` matches `/SurveyDebugger/`. Skips gracefully if `dist/` is missing so plain `vitest run` doesn't fail in dev. Run via `pnpm --filter @tour-kit/surveys test:build-output`.

#### `packages/surveys/package.json` (UPDATE)
Add `./dev` to `exports` map pointing at `./dist/dev/index.{js,cjs,d.ts,d.cts}`. Add `"test:build-output": "pnpm build && vitest run __tests__/build-output-no-debugger.test.ts"` to `scripts`. Do not bump version yet (that's a Changeset concern).

#### `packages/surveys/tsup.config.ts` (UPDATE)
Add `'dev/index': 'src/dev/index.ts'` to the `entry` object. Keep all existing settings (`format`, `dts`, `clean`, `external`, `treeshake: true`, `splitting: true`, `minify`, `sourcemap`, `target`).

#### `apps/docs/content/docs/surveys/inline.mdx` (NEW)
Two examples: (1) `<InlineSurvey>` inside `<AnnouncementSpotlight>`; (2) env-gated `React.lazy` import of `<SurveyDebugger>` from `@tour-kit/surveys/dev`. Frontmatter: `title: Inline Surveys`, `description: ...`, `published: true`. Per the project's Content Pipeline Rules, after creating the MDX file update the surveys nav so the page appears in navigation.

#### `apps/docs/content/docs/surveys/meta.json` (UPDATE)
Add `inline` to the surveys page list (verify the exact filename by listing `apps/docs/content/docs/surveys/`).

### Success Criteria
- `pnpm --filter @tour-kit/surveys typecheck` exits 0.
- `pnpm --filter @tour-kit/surveys test` exits 0 (existing tests + `inline-survey.test.tsx` + `survey-debugger.test.tsx`).
- `pnpm --filter @tour-kit/surveys build` exits 0; `dist/dev/index.js`, `dist/dev/index.cjs`, `dist/dev/index.d.ts` all exist.
- `grep -c "SurveyDebugger" packages/surveys/dist/index.js packages/surveys/dist/index.cjs` prints `0` for both files.
- `pnpm --filter @tour-kit/surveys test:build-output` exits 0.
- `pnpm --filter @tour-kit/docs build` succeeds; `/docs/surveys/inline` renders in nav.
- `grep "dev/" packages/surveys/src/index.ts` returns nothing.

Implement task-by-task in order (11.1 → 11.2 → 11.3). Run the per-task sanity check before moving to the next task. If any sanity check fails, stop and report — do not move on.

---

## Readiness Check

- [PASS] All inputs from prior phases listed and available — Phase 2.2's turnkey modal interfaces (`CsatModalProps`, `NpsModalProps`, `CesModalProps`) are pasted verbatim under "Confirmed Library APIs"; `useSurvey()` signature verified from source (`packages/surveys/src/hooks/use-survey.ts` lines 1–45) and pasted verbatim; existing question primitives confirmed via `ls` of `packages/surveys/src/components/`; `<SurveyInline>`, `<SurveyBanner>` patterns confirmed and the new component inherits their `role="region"` / `data-survey-inline=` conventions; Phase 7's spotlight `children: React.ReactNode` confirmed at line 28 of `announcement-spotlight.tsx`.
- [PASS] Every sub-task has a clear, testable completion condition — 11.1 has typecheck + RTL test sanity check; 11.2 has typecheck + RTL test sanity check; 11.3 has build + `test:build-output` + docs build sanity check, plus an explicit `grep -c` command for the no-debugger-bytes contract.
- [PASS] Execution prompt is self-contained — prior facts copied inline (Phase 2.2 modal interfaces verbatim, `useSurvey` signature verbatim, existing primitive shapes listed); data model rules explicit (`interface` over `type`, closed union for `layout`, no internal state, subpath-only debugger); per-file implementation guidance specifies LOC budget, key code paths, what to do, what NOT to do; bundle-analyzer command pasted verbatim with expected output.
- [PASS] Exit criteria map 1:1 to deliverables — 11 exit checkboxes covering: no dialog role (deliverable: `inline-survey.test.tsx`), HUD real-time updates (`survey-debugger.test.tsx`), zero debugger bytes (`build-output-no-debugger.test.ts` + grep command), shared state (`inline-survey.test.tsx`), bundle delta <4KB (tsup output + tree-shake test), `src/index.ts` clean (grep guard), `package.json` exports (config), `dist/dev/*` built (ls), typecheck, tests, docs page registered. Each maps to a named deliverable file.
- [PASS] Heavy external deps have a fake/stub strategy noted — no heavy deps in Phase 11. Existing test patterns cover the boundaries: RTL + Vitest for component tests; `node:fs` + `readFileSync` for the build-output smoke (no subprocess spawn needed because `pnpm build` runs first via the `test:build-output` script).
- [PASS] New libraries have a confirmed snippet from Context7 in the execution prompt — no new libraries this phase. The env-gated tree-shake pattern is tsup/esbuild native and documented at the consumer-boundary level (the package side is enforced by the subpath entry; the consumer side is documented in the MDX example with the canonical `process.env.NODE_ENV !== 'production'` literal substitution that all major bundlers honor).

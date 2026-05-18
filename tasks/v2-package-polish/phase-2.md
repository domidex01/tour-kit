# Phase 2 — Surveys Turnkey + viewCount Reset

**Duration:** Days 9–14 (~9–13 hours)
**Depends on:** Phase 1 (task 1.3 — `forceShow(id)` introduces the in-memory dispatch + persist pattern that Phase 2.1's `reset()` reuses to clear `viewCount` alongside `isDismissed`)
**Blocks:** Phase 11 (inline surveys + skip-logic HUD extends the `<CsatModal>` / `<NpsModal>` / `<CesModal>` base shipped here)
**Risk Level:** MEDIUM — additive new components plus a tiny reducer tweak; surface area is small and well-contained, but the `reset()` change is observable to any consumer relying on the current (broken) behaviour and the three new modals add public-API surface that must stay stable through v2.x.
**Stack:** react

---

## Objective

Phase 2 closes two demo-wiring papercuts at once. First, it ships three turnkey survey modals — `<CsatModal>`, `<NpsModal>`, `<CesModal>` — that wrap `<SurveyModal>` + `<QuestionRating>` + Submit/Skip buttons into a one-import, two-prop API. Today the dashboard-next demo hand-composes six children, three callbacks, and a controlled-state hook per survey; after this phase, a CSAT is `<CsatModal question="..." onSubmit={fn} />`. Second, it fixes a long-standing bug in `AnnouncementsProvider.reset(id)`: the `RESET` reducer branch (provider lines 172–186) clears `isDismissed` but leaves `viewCount` non-zero, so a `frequency: "once"` announcement stays gated after a reset. Phase 2.1 widens the branch to also reset `viewCount`, `lastViewedAt`, and `completedAt` so the announcement is truly back to its initial state. Both changes are PR-sized, backwards-compatible at the type level, and observable in dashboard-next with zero downstream consumer churn.

## What Success Looks Like

1. `<CsatModal question="How easy was checkout?" onSubmit={(rating) => console.log(rating)} />` renders without any other `@tour-kit/surveys` imports — verified by `packages/surveys/src/__tests__/turnkey-modals.test.tsx` mounting the component with only those two props and asserting (a) the question text is in the DOM, (b) clicking a rating button fires `onSubmit(rating)` with an integer value in the configured scale (default 1..5).
2. `<NpsModal question="How likely are you to recommend us?" onSubmit={(score, category) => ...} />` renders an 11-point scale (0–10) and the `onSubmit` callback receives the score plus an `NpsCategory` (`'promoter' | 'passive' | 'detractor'`) computed via `packages/surveys/src/core/scoring.ts` — verified by a parameterized test covering one value per category bucket.
3. `<CesModal question="How easy was..." onSubmit={(score, category) => ...} />` renders a 7-point scale (1–7) and the callback receives the score plus a `CesCategory` (`'easy' | 'neutral' | 'difficult'`) — verified the same way.
4. `AnnouncementsProvider.reset("welcome-modal")` followed by `show("welcome-modal")` actually displays the announcement when `frequency: 'once'` and the announcement had previously been viewed — verified by `packages/announcements/src/__tests__/provider-reset-view-count.test.tsx` regression test that fails on the current `main` branch (because `viewCount >= 1` blocks re-show) and passes after Phase 2.1.
5. Bundle delta for the three new components combined is `<2 KB gzipped`, measured by the existing `pnpm --filter @tour-kit/surveys build` size-limit report. Each modal must be tree-shakeable: importing only `<CsatModal>` MUST NOT pull `<NpsModal>` or `<CesModal>` into the consumer bundle.
6. Snapshot tests for all three turnkey modals pass under both default and `prefers-reduced-motion: reduce` — same three-tier defense as the underlying `SurveyModal` (`motion-safe:` prefix on `tailwindcss-animate` utilities).

---

## Architecture / Key Design Decisions

```
Consumer Code
    │
    ▼
┌────────────────────────────────────────────────────────────────┐
│  <CsatModal question onSubmit onSkip ratingScale? />           │
│  <NpsModal  question onSubmit onSkip />                        │
│  <CesModal  question onSubmit onSkip />                        │
│                                                                │
│  Each component (~80 LOC):                                     │
│    1. Internal useState<number | null>(null) for selection     │
│    2. <SurveyModal surveyId={internalId}>                      │
│         <QuestionRating preset="csat" | "nps" | "ces" />       │
│         <Skip /> <Submit disabled={value === null} />          │
│       </SurveyModal>                                           │
│    3. On Submit: call onSubmit(value, category?) then hide()   │
└────────────────────────────────────────────────────────────────┘
    │
    ▼
SurveyModal (existing)  ◄──  QuestionRating (existing)
    │
    ▼
useSurvey() + SurveysProvider (existing)
```

```
AnnouncementsProvider.reset(id)  — Phase 2.1 widening
    │
    ▼
dispatch({ type: 'RESET', id })
    │
    ▼
reducer 'RESET' branch (lines 172–186 today):
   BEFORE:                       AFTER (Phase 2.1):
   isDismissed: false             isDismissed: false
   dismissedAt: null              dismissedAt: null
   dismissalReason: null          dismissalReason: null
                                  viewCount: 0          ← NEW
                                  lastViewedAt: null    ← NEW
                                  completedAt: null     ← NEW
    │
    ▼
storage adapter persists merged state (same write path as today)
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| Turnkey modal props | `interface` per modal (`CsatModalProps`, `NpsModalProps`, `CesModalProps`) | Public API surface — `interface` gets better declaration-merging error messages than `type` and is the convention everywhere else in `@tour-kit/surveys` |
| Internal selected-value state | `React.useState<number \| null>` | One transient piece of state per render; no need for a reducer, no need for context — keep the component flat |
| Submit callback contract | `(value: number, category?: NpsCategory \| CesCategory) => void` | CSAT has no canonical category bucket (just a raw 1–5), so `category` is `undefined` there. NPS/CES include the category so consumers don't re-implement scoring |
| `reset()` reducer payload | Existing `AnnouncementState` shape | No new type. The fix is widening the spread to include three more fields — `viewCount`, `lastViewedAt`, `completedAt` — that were already on `AnnouncementState` but missed by the original `RESET` branch |

**Other critical rules for this phase:**
- **No new core logic.** Each turnkey modal MUST compose `<SurveyModal>` + `<QuestionRating>` from the existing package — do not duplicate the modal-opening, escape-key, focus-trap, or scoring logic. If a feature is missing in the primitive, fix the primitive, don't reimplement in the wrapper.
- **Tree-shakeable named exports.** Add to `packages/surveys/src/components/index.ts` as named exports only (no default export, no barrel re-export). Verify with the existing `build-output.test.ts` pattern that consumes `dist/index.mjs` and asserts byte deltas per import.
- **Reduced motion.** The wrappers inherit the `motion-safe:` prefix and reduced-motion gate from `SurveyModal` automatically; no new keyframes are introduced, so no `@media (prefers-reduced-motion)` block is needed in these files. Add a one-line test in `turnkey-modals.test.tsx` that mounts each modal with `matchMedia('(prefers-reduced-motion: reduce)') = true` and confirms the underlying `data-survey-modal` element renders.
- **`reset()` semantics: clear three fields, keep config.** The `RESET` branch resets `AnnouncementState` to its `createInitialState(id)` shape EXCEPT it does not touch `AnnouncementsState.configs` — the registered config stays. This matches `RESET_ALL` and avoids accidentally unregistering an announcement at reset time.
- **Storage adapter receives the merged write.** Today the reducer writes back via the existing persistence effect (see `announcements-provider.tsx` `useEffect` that subscribes to `state.announcements`). Phase 2.1 does not change the persistence path — the wider state object flows through the same write. Add a test that mocks the storage adapter and asserts the persisted payload after reset has `viewCount: 0`.

---

## Tasks

### Task 2.1 — `reset()` clears `viewCount` (2–3 h)

**Depends on:** Phase 1 task 1.3 (provider already takes a dispatch+persist hit per state mutation; the same path carries the wider reset payload).

Widen the `RESET` reducer branch in `packages/announcements/src/context/announcements-provider.tsx` lines 172–186 to also clear `viewCount`, `lastViewedAt`, and `completedAt`. The `RESET_ALL` branch at lines 188–199 gets the identical widening so the two stay in lockstep.

```diff
 case 'RESET': {
   const newAnnouncements = new Map(state.announcements)
   const announcement = newAnnouncements.get(action.id)

   if (announcement) {
     newAnnouncements.set(action.id, {
       ...announcement,
       isDismissed: false,
       dismissedAt: null,
       dismissalReason: null,
+      viewCount: 0,
+      lastViewedAt: null,
+      completedAt: null,
     })
     return { ...state, announcements: newAnnouncements }
   }
   return state
 }

 case 'RESET_ALL': {
   const newAnnouncements = new Map(state.announcements)
   newAnnouncements.forEach((announcement, id) => {
     newAnnouncements.set(id, {
       ...announcement,
       isDismissed: false,
       dismissedAt: null,
       dismissalReason: null,
+      viewCount: 0,
+      lastViewedAt: null,
+      completedAt: null,
     })
   })
   return { ...state, announcements: newAnnouncements }
 }
```

Add a regression test `packages/announcements/src/__tests__/provider-reset-view-count.test.tsx` (or extend the existing `provider-reset.test.tsx` if one exists) that:
1. Registers an announcement with `frequency: 'once'`.
2. Calls `show(id)` — asserts visible, then `dismiss(id)` — asserts hidden, `viewCount === 1`.
3. Calls `reset(id)` — asserts `viewCount === 0`, `isDismissed === false`, `lastViewedAt === null`, `completedAt === null`.
4. Calls `show(id)` again — asserts visible (this is the regression today fails on).

**Sanity check:** `pnpm --filter @tour-kit/announcements test -- provider-reset-view-count` exits 0 with all four assertions green. `pnpm --filter @tour-kit/announcements test` overall stays green (no other regression).

---

### Task 2.2 — `<CsatModal>` turnkey component (3–4 h)

**Depends on:** Nothing (uses existing `<SurveyModal>` + `<QuestionRating>` primitives).

Create `packages/surveys/src/components/csat-modal.tsx`. The component owns one piece of state (the selected rating) and delegates everything else to existing primitives.

```ts
// packages/surveys/src/components/csat-modal.tsx
'use client'

import * as React from 'react'
import { SurveyModal, type SurveyModalProps } from './survey-modal'
import { QuestionRating } from './question-rating'
import type { RatingScale } from '../types/question'

export interface CsatModalProps
  extends Omit<SurveyModalProps, 'surveyId' | 'children'> {
  /** Survey id; defaults to a stable internal id when omitted. */
  surveyId?: string
  /** The question to ask (e.g. "How easy was checkout?"). */
  question: string
  /**
   * Rating scale override; defaults to the canonical CSAT preset
   * (1–5 numeric). Use this to swap to stars or emoji.
   */
  ratingScale?: RatingScale
  /** Submit handler; fires with the selected rating value. */
  onSubmit: (rating: number) => void
  /** Optional skip handler; when omitted the Skip button is hidden. */
  onSkip?: () => void
  /** Override the Submit button label. */
  submitLabel?: string
  /** Override the Skip button label. */
  skipLabel?: string
}
```

Implementation notes:
- Use `React.useId()` for the default `surveyId` so SSR is stable.
- The Submit button is `disabled={value === null}` to enforce a selection before submit.
- On Submit, call `onSubmit(value)` then trigger the underlying modal's `hide()` via the `onOpenChange` prop (mirrors how `SurveyModal.handleDismiss` is wired today — see `survey-modal.tsx` lines 33–49).
- Pass through any unrecognized HTML props to `SurveyModal` via `...rest`.
- Wire `onSkip` to a tertiary text-link button placed inside the modal body, not a primary button — matches the visual hierarchy decision recorded in Phase 0's component guidance and the TourCard refresh slated for Phase 4.

**Sanity check:** `pnpm --filter @tour-kit/surveys typecheck` exits 0; `pnpm --filter @tour-kit/surveys test -- csat-modal` mounts `<CsatModal question="Q" onSubmit={fn} />` and asserts the question text renders + clicking rating "4" calls `fn(4)`.

---

### Task 2.3 — `<NpsModal>` and `<CesModal>` (3–4 h)

**Depends on:** 2.2 (mirrors the CSAT API; same composition pattern).

Create `packages/surveys/src/components/nps-modal.tsx` and `packages/surveys/src/components/ces-modal.tsx`. Both follow the CSAT shape but use the package's NPS / CES scoring helpers (already in `packages/surveys/src/core/scoring.ts`) to compute a category alongside the raw score.

```ts
// packages/surveys/src/components/nps-modal.tsx
export interface NpsModalProps
  extends Omit<SurveyModalProps, 'surveyId' | 'children'> {
  surveyId?: string
  question: string
  /** Override the default 0–10 scale; rarely needed. */
  ratingScale?: RatingScale
  /** Submit handler; receives the raw score and the NPS category. */
  onSubmit: (score: number, category: NpsCategory) => void
  onSkip?: () => void
  submitLabel?: string
  skipLabel?: string
}

// packages/surveys/src/components/ces-modal.tsx
export interface CesModalProps
  extends Omit<SurveyModalProps, 'surveyId' | 'children'> {
  surveyId?: string
  question: string
  /** Override the default 1–7 scale; rarely needed. */
  ratingScale?: RatingScale
  /** Submit handler; receives the raw score and the CES category. */
  onSubmit: (score: number, category: CesCategory) => void
  onSkip?: () => void
  submitLabel?: string
  skipLabel?: string
}
```

Implementation notes:
- Default `<NpsModal>` scale is `{ min: 0, max: 10, style: 'numeric' }`; pass `lowLabel="Not likely"` and `highLabel="Very likely"` to `<QuestionRating>` so the standard NPS endpoints render.
- Default `<CesModal>` scale is `{ min: 1, max: 7, style: 'numeric' }`; pass `lowLabel="Very difficult"` and `highLabel="Very easy"`.
- Compute the category once on Submit (not on every render): `const category = computeNpsCategory(value)` or `computeCesCategory(value)` then call `onSubmit(value, category)`.
- Both components must be tree-shakeable from each other — `<CsatModal>` MUST NOT pull `<NpsModal>` and vice versa. Verify with the existing `build-output.test.ts` pattern: import only one modal, assert the dist chunk's gzipped size delta is below the per-modal budget.

**Sanity check:** `pnpm --filter @tour-kit/surveys typecheck` exits 0; `pnpm --filter @tour-kit/surveys test -- nps-modal ces-modal` covers one value per category bucket (e.g., NPS 9 → promoter, NPS 7 → passive, NPS 3 → detractor; CES 6 → easy, CES 4 → neutral, CES 2 → difficult).

---

### Task 2.4 — Snapshot tests + docs page (1–2 h)

**Depends on:** 2.3.

Create `packages/surveys/src/__tests__/turnkey-modals.test.tsx` with:
- One snapshot per modal at default props.
- One snapshot per modal under `prefers-reduced-motion: reduce` (use the existing `matchMedia` mock pattern from `reduced-motion.test.tsx`).
- One assertion per modal that no other turnkey modal is rendered (so a regression in tree-shaking surfaces as a snapshot diff).

Create `apps/docs/content/docs/surveys/turnkey.mdx` with three one-line examples:

```mdx
import { CsatModal, NpsModal, CesModal } from '@tour-kit/surveys'

<CsatModal question="How easy was checkout?" onSubmit={(r) => track('csat', r)} />
<NpsModal  question="How likely are you to recommend us?" onSubmit={(s, c) => track('nps', s, c)} />
<CesModal  question="How easy was that?" onSubmit={(s, c) => track('ces', s, c)} />
```

Add the page to the surveys nav in `apps/docs/content/docs/surveys/meta.json` (or equivalent — verify the right config file by listing `apps/docs/content/docs/surveys/`). Per the project's Content Pipeline Rules, after creating the MDX file update the registry/config with `published: true` and verify the page appears in navigation.

Also update `packages/surveys/src/components/index.ts` to export the three new components.

**Sanity check:** `pnpm --filter @tour-kit/surveys test` green; `pnpm --filter @tour-kit/docs build` succeeds; the new docs page appears in the rendered nav at `/docs/surveys/turnkey`.

---

## Deliverables

```
packages/surveys/src/components/csat-modal.tsx                          # NEW — turnkey CSAT modal (~80 LOC)
packages/surveys/src/components/nps-modal.tsx                           # NEW — turnkey NPS modal with category scoring
packages/surveys/src/components/ces-modal.tsx                           # NEW — turnkey CES modal with category scoring
packages/surveys/src/components/index.ts                                # UPDATE — add 3 named exports
packages/announcements/src/context/announcements-provider.tsx           # UPDATE — RESET + RESET_ALL clear viewCount, lastViewedAt, completedAt
packages/surveys/src/__tests__/turnkey-modals.test.tsx                  # NEW — snapshots + behaviour + tree-shake assertion for all three modals
packages/announcements/src/__tests__/provider-reset-view-count.test.tsx # NEW — regression test for reset() clearing viewCount
apps/docs/content/docs/surveys/turnkey.mdx                              # NEW — docs page with one-line examples for each modal
apps/docs/content/docs/surveys/meta.json                                # UPDATE — register turnkey page in nav
```

No new dependencies. No peer-dep changes. No changes to `package.json` files except optionally bumping the `exports` map if the build pipeline doesn't pick up the new components automatically (verify with `pnpm --filter @tour-kit/surveys build` and inspect `dist/index.d.ts`).

---

## Exit Criteria

- [ ] `<CsatModal question="How easy was checkout?" onSubmit={fn} />` works with zero other `@tour-kit/surveys` imports — `turnkey-modals.test.tsx` mounts it with exactly those two props and the test passes.
- [ ] `<NpsModal>` and `<CesModal>` each render the correct scale and `onSubmit` receives `(score, category)` with the category computed from the existing scoring helpers; one assertion per category bucket per modal is green.
- [ ] Regression test `packages/announcements/src/__tests__/provider-reset-view-count.test.tsx` is green: `reset(id)` followed by `show(id)` re-displays a `frequency: 'once'` announcement.
- [ ] `pnpm --filter @tour-kit/surveys build` size-limit report shows combined gzipped bundle delta for the three new components `<2 KB`, and importing one does not pull the other two (tree-shake assertion in `build-output.test.ts`).
- [ ] Snapshot tests for all three modals pass under both default and `prefers-reduced-motion: reduce`.
- [ ] `pnpm typecheck` (root) exits 0; no `any` introduced; no new `@ts-expect-error` or `@ts-ignore`.
- [ ] `pnpm --filter @tour-kit/announcements test` and `pnpm --filter @tour-kit/surveys test` are both green with no skipped tests.
- [ ] `apps/docs/content/docs/surveys/turnkey.mdx` exists, is registered in nav, and `pnpm --filter @tour-kit/docs build` succeeds. The page renders at `/docs/surveys/turnkey`.

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to implement this phase:

---
You are building Phase 2 of Tour Kit v2 Package Polish — Surveys Turnkey + viewCount Reset. Implement three new turnkey survey modals plus a small fix to `AnnouncementsProvider.reset()`.

### What This Project Is
Tour Kit is a pnpm monorepo of 12 packages providing headless React product-tour primitives (`@tour-kit/core`, `react`, `hints`) plus pro packages (`announcements`, `surveys`, `checklists`, `adoption`, `analytics`, `ai`, `scheduling`, `license`, `media`). v2 closes demo-wiring gaps reported while building `examples/dashboard-next/`. Every phase ships as one PR with backwards-compatible types. See `tasks/v2-package-polish/big-plan.md` for the full roadmap.

### Established in Prior Phases
- **Phase 0** locked the cross-cutting API contracts in `tasks/v2-package-polish/phase-0-validation.md` (signed off before Phase 1 started). The `forceShow(id)` behaviour matrix and the `viewCount` semantics are recorded there.
- **Phase 1** added `useTourActions(id)` to `@tour-kit/core` (registry hook for standalone tours) and `forceShow(id)` to `AnnouncementsProvider`. `forceShow` introduced an in-memory dispatch + persist pattern that bypasses `frequency`, `cooldown`, `viewCount`, and `isDismissed` gates — but it still increments `viewCount` so admins see real telemetry deltas. The pattern lives in `packages/announcements/src/context/announcements-provider.tsx`. Phase 2 builds on this by widening the `RESET` reducer branch in the same file.

### Your Goal for This Phase
Ship three new components in `@tour-kit/surveys` — `<CsatModal>`, `<NpsModal>`, `<CesModal>` — and fix `AnnouncementsProvider.reset(id)` so it actually clears `viewCount` (today it only clears `isDismissed`, which leaves `frequency: 'once'` announcements gated after a reset).

### Data Model Rules (follow exactly)
- **Public-API types are `interface`** (not `type`). Each modal exports `CsatModalProps` / `NpsModalProps` / `CesModalProps`. The `Submit` callback contract differs by modal:
  - `<CsatModal>`: `onSubmit: (rating: number) => void`
  - `<NpsModal>`: `onSubmit: (score: number, category: NpsCategory) => void`
  - `<CesModal>`: `onSubmit: (score: number, category: CesCategory) => void`
- **Internal selected-value state is `React.useState<number | null>(null)`** — no reducer, no context. One transient piece of state per render.
- **The `reset()` reducer payload uses the existing `AnnouncementState` shape** — no new type. The change is widening the spread to include `viewCount: 0`, `lastViewedAt: null`, `completedAt: null` in both the `RESET` and `RESET_ALL` branches.
- **No new core logic.** The three turnkey modals MUST compose `<SurveyModal>` + `<QuestionRating>` from the existing package. Do not duplicate the modal opening/closing, focus-trap, escape-key, or scoring logic. If the primitive is missing something, fix the primitive — don't fork.

### Architecture
```
Consumer Code
    │
    ▼
<CsatModal question onSubmit onSkip ratingScale? />
<NpsModal  question onSubmit onSkip />
<CesModal  question onSubmit onSkip />
    │  (each component is ~80 LOC; owns one useState<number | null> for selection)
    ▼
<SurveyModal surveyId={React.useId()}>
  <QuestionRating preset="csat" | "nps" | "ces" />
  <Skip /> <Submit disabled={value === null} />
</SurveyModal>
    │
    ▼
useSurvey() + SurveysProvider  (existing — unchanged)
```

For Phase 2.1's `reset()` fix:
```
AnnouncementsProvider.reset(id)
    │
    ▼
dispatch({ type: 'RESET', id })  →  reducer 'RESET' branch (provider lines 172–186)
    │
    ▼  (widen the state spread)
BEFORE                    AFTER
isDismissed: false        isDismissed: false
dismissedAt: null         dismissedAt: null
dismissalReason: null     dismissalReason: null
                          viewCount: 0          ← NEW
                          lastViewedAt: null    ← NEW
                          completedAt: null     ← NEW
    │
    ▼
state persisted via existing storage-adapter useEffect — no change to write path.
```

### Confirmed Library APIs
No new libraries this phase. Verbatim references from the existing repo:

```ts
// packages/surveys/src/components/survey-modal.tsx (existing — DO NOT change)
export interface SurveyModalProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof modalContentVariants> {
  surveyId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  options?: ModalOptions
  children?: React.ReactNode
}
```

```ts
// packages/surveys/src/components/question-rating.tsx (existing — DO NOT change)
export interface QuestionRatingProps {
  id: string
  min?: number
  max?: number
  style?: 'numeric' | 'stars' | 'emoji'
  value?: number | null
  onChange?: (value: number) => void
  label: string
  lowLabel?: string
  highLabel?: string
  preset?: RatingPreset           // 'nps' | 'csat' | 'ces' | ...
  ratingScale?: RatingScale       // { min, max, style }
  // ... see file for full shape
}
```

```ts
// packages/announcements/src/context/announcements-provider.tsx — current 'RESET' branch (lines 172–186)
case 'RESET': {
  const newAnnouncements = new Map(state.announcements)
  const announcement = newAnnouncements.get(action.id)
  if (announcement) {
    newAnnouncements.set(action.id, {
      ...announcement,
      isDismissed: false,
      dismissedAt: null,
      dismissalReason: null,
      // ADD: viewCount: 0, lastViewedAt: null, completedAt: null
    })
    return { ...state, announcements: newAnnouncements }
  }
  return state
}
// 'RESET_ALL' (lines 188–199) gets the identical widening.
```

```ts
// packages/surveys/src/core/scoring.ts (existing — use these helpers verbatim)
// computeNpsCategory(score: number): 'promoter' | 'passive' | 'detractor'
// computeCesCategory(score: number): 'easy' | 'neutral' | 'difficult'
// Verify exact import shape with: grep -rn "export.*computeNps\|export.*computeCes" packages/surveys/src/core/
```

### Files to Create / Modify

#### `packages/announcements/src/context/announcements-provider.tsx` (modify)
Widen the `RESET` and `RESET_ALL` reducer branches to also clear `viewCount: 0`, `lastViewedAt: null`, `completedAt: null`. Three new lines per branch. No other changes anywhere in the file.

#### `packages/announcements/src/__tests__/provider-reset-view-count.test.tsx` (new)
Regression test:
1. Render `<AnnouncementsProvider>` with one announcement, `frequency: 'once'`.
2. `show(id)` — assert `isVisible === true`.
3. `dismiss(id)` — assert `isVisible === false`, `viewCount === 1`, `isDismissed === true`.
4. `reset(id)` — assert `viewCount === 0`, `isDismissed === false`, `lastViewedAt === null`, `completedAt === null`.
5. `show(id)` again — assert `isVisible === true` (this is the regression today fails on).

#### `packages/surveys/src/components/csat-modal.tsx` (new, ~80 LOC)
- Export `CsatModalProps` interface and `CsatModal` component.
- Internal state: `const [value, setValue] = React.useState<number | null>(null)`.
- Default `surveyId` from `React.useId()`.
- Composes `<SurveyModal>` + `<QuestionRating preset="csat" ratingScale={ratingScale ?? { min: 1, max: 5, style: 'numeric' }} />` + Skip/Submit buttons.
- Submit fires `onSubmit(value)` then closes the modal via `onOpenChange?.(false)`.
- Skip is a tertiary text-link button (hidden when `onSkip` is undefined).

#### `packages/surveys/src/components/nps-modal.tsx` (new, ~80 LOC)
- Same shape as CsatModal, but:
  - Default scale `{ min: 0, max: 10, style: 'numeric' }`.
  - Pass `lowLabel="Not likely"` and `highLabel="Very likely"` to `<QuestionRating>`.
  - On Submit: `onSubmit(value, computeNpsCategory(value))`.

#### `packages/surveys/src/components/ces-modal.tsx` (new, ~80 LOC)
- Same shape, but:
  - Default scale `{ min: 1, max: 7, style: 'numeric' }`.
  - Pass `lowLabel="Very difficult"` and `highLabel="Very easy"`.
  - On Submit: `onSubmit(value, computeCesCategory(value))`.

#### `packages/surveys/src/components/index.ts` (modify)
Add three named exports: `export { CsatModal, type CsatModalProps } from './csat-modal'`; same for NPS and CES.

#### `packages/surveys/src/__tests__/turnkey-modals.test.tsx` (new)
For each of CSAT / NPS / CES:
- Renders question text.
- Submit fires the callback with the right arity (1 for CSAT, 2 for NPS/CES) and the right values for one selected option per category bucket.
- Snapshot under default props.
- Snapshot under `matchMedia('(prefers-reduced-motion: reduce)') = true` (use the existing mock pattern from `reduced-motion.test.tsx`).
- Tree-shake assertion: importing only one modal does not bring the others into the test bundle (assert via the existing `build-output.test.ts` pattern).

#### `apps/docs/content/docs/surveys/turnkey.mdx` (new)
One-line example per modal. Set `published: true` in the page frontmatter. Per the project's Content Pipeline Rules, after creating the MDX file update the surveys nav config so the page appears in navigation.

#### `apps/docs/content/docs/surveys/meta.json` (modify, or equivalent nav config)
Add `turnkey` to the surveys page list.

### Success Criteria
- `pnpm typecheck` (root) exits 0.
- `pnpm --filter @tour-kit/announcements test` green; `provider-reset-view-count.test.tsx` passes all 5 assertions.
- `pnpm --filter @tour-kit/surveys test` green; `turnkey-modals.test.tsx` snapshots + behaviour assertions pass.
- `pnpm --filter @tour-kit/surveys build` size-limit shows combined gzipped delta `<2 KB` for the three new components.
- `pnpm --filter @tour-kit/docs build` succeeds; `/docs/surveys/turnkey` appears in the rendered nav.
- `git diff packages/announcements/src/context/announcements-provider.tsx` shows exactly 6 added lines (3 per branch) — no other file changes in the announcements package outside of the new test file.

### Expected File Structure at End
```
packages/
├── announcements/
│   ├── src/context/announcements-provider.tsx           # MODIFIED — RESET + RESET_ALL widened
│   └── src/__tests__/provider-reset-view-count.test.tsx # NEW
└── surveys/
    ├── src/components/
    │   ├── csat-modal.tsx                               # NEW
    │   ├── nps-modal.tsx                                # NEW
    │   ├── ces-modal.tsx                                # NEW
    │   └── index.ts                                     # MODIFIED — 3 exports added
    └── src/__tests__/turnkey-modals.test.tsx            # NEW
apps/docs/content/docs/surveys/
├── turnkey.mdx                                          # NEW
└── meta.json                                            # MODIFIED — turnkey added to nav
```

Implement task-by-task in order (2.1 → 2.2 → 2.3 → 2.4). Run the per-task sanity check before moving to the next task. If any sanity check fails, stop and report — do not move on.

---

## Readiness Check

- [PASS] All inputs from prior phases listed and available — Phase 1's `forceShow(id)` work in `announcements-provider.tsx` is the prerequisite; the file exists at the cited path, the `RESET` branch is verified at lines 172–186, and the scoring helpers in `packages/surveys/src/core/scoring.ts` provide `computeNpsCategory` / `computeCesCategory` for the NPS/CES wrappers.
- [PASS] Every sub-task has a clear, testable completion condition — each task has a `Sanity check` one-liner (typecheck, test filter, or build verification).
- [PASS] Execution prompt is self-contained — prior facts copied inline (Phase 1's `forceShow` context, the `RESET` reducer source, `SurveyModalProps` and `QuestionRatingProps` verbatim, scoring helper signatures); data model rules explicit (`interface` over `type`, `useState<number | null>`, no new core logic); per-file implementation guidance specifies exact LOC budget, default scales, label strings, and callback arity per modal.
- [PASS] Exit criteria map 1:1 to deliverables — 8 exit checkboxes covering: (1) one-line CSAT works, (2) NPS/CES emit category, (3) regression test green, (4) bundle <2KB + tree-shake, (5) reduced-motion snapshot, (6) root typecheck, (7) per-package tests green, (8) docs page registered. Each maps to a named deliverable file.
- [PASS] Heavy external deps have a fake/stub strategy noted — no heavy deps in Phase 2; existing test patterns (`reduced-motion.test.tsx` `matchMedia` mock, `build-output.test.ts` tree-shake harness) cover the boundaries.
- [PASS] New libraries have a confirmed snippet from Context7 in the execution prompt — no new libraries this phase; all referenced primitives (`SurveyModal`, `QuestionRating`, the reducer) are pinned to verbatim snippets pulled from the current repo source.

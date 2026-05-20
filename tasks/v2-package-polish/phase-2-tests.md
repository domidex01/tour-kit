# Phase 2 — Testing: Surveys Turnkey + viewCount Reset

**Scope:** Three new turnkey survey wrappers (`<CsatModal>`, `<NpsModal>`, `<CesModal>`) composing existing `<SurveyModal>` + `<QuestionRating>`; two single-score category helpers (`computeNpsCategory`, `computeCesCategory`) in `packages/surveys/src/core/scoring.ts`; a tiny reducer widening in `packages/announcements/src/context/announcements-provider.tsx` (`RESET` + `RESET_ALL` branches gain `viewCount: 0`, `lastViewedAt: null`, `completedAt: null`); a docs page + nav entry under `apps/docs/content/docs/surveys/components/`.
**Key Pattern:** Pure logic + component composition — no heavy deps, no network, no model. Unit-test the category helpers as pure functions; component-test the three modals against the existing `<SurveysProvider>` + `<AnnouncementsProvider>` harnesses; regression-test the `reset()` viewCount fix with a "render → show → dismiss → reset → show" sequence that fails on `main` and passes after the widening.
**Dependencies:** vitest, @testing-library/react, jsdom env, the existing `reduced-motion.test.tsx` `matchMedia` mock pattern, the existing `build-output.test.ts` tree-shake harness.

---

## 1. User Stories

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | As a demo author, I want `<CsatModal question="..." onSubmit={fn} />` to work without importing `<SurveyModal>` or `<QuestionRating>` directly | `turnkey-modals.test.tsx` mounts CSAT with two props + `<SurveysProvider>`; clicks rating 4 | Question text in DOM; `fn(4)` called once |
| US-2 | As a CSAT consumer, I want the rating scale to default to 1–5 and the Submit button disabled until I pick | `turnkey-modals.test.tsx` snapshot + interaction | Default scale renders 5 numeric options; Submit `disabled` attribute is `true` until selection |
| US-3 | As an NPS consumer, I want `onSubmit(score, category)` where category is computed from the score by a deterministic helper | `turnkey-modals.test.tsx` per-bucket parameterized test + `scoring-category.test.ts` | NPS 9 → `'promoter'`, NPS 7 → `'passive'`, NPS 3 → `'detractor'` |
| US-4 | As a CES consumer, I want `onSubmit(score, category)` on a 1–7 scale with category buckets matching common CES definitions | Same as US-3, for CES | CES 6 → `'easy'`, CES 4 → `'neutral'`, CES 2 → `'difficult'` |
| US-5 | As an admin, I want `reset(id)` on a `frequency: 'once'` announcement followed by `show(id)` to actually re-display it (today it stays gated by viewCount) | `provider-reset-view-count.test.tsx` regression test | After reset: `viewCount === 0`, `isDismissed === false`, `lastViewedAt === null`, `completedAt === null`; subsequent `show(id)` renders the modal |
| US-6 | As a reduced-motion user, I want the three turnkey modals to render without entrance animation | `turnkey-modals.test.tsx` snapshot under `matchMedia('(prefers-reduced-motion: reduce)') = true` | Snapshot does NOT contain `animate-in` / `fade-in` / `zoom-in` utility classes |
| US-7 | As a bundle-conscious consumer, I want importing only `<CsatModal>` to not pull `<NpsModal>` or `<CesModal>` into my app | `build-output.test.ts` tree-shake check | Importing one modal produces a chunk that does NOT reference the other two component names |

---

## 2. Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|---|---|---|---|
| `computeNpsCategory(score)` / `computeCesCategory(score)` | No mock — pure helpers | One assertion per category boundary (NPS: 9/7/0; CES: 5/4/3) | US-3, US-4 |
| `<CsatModal>` | No mock — render real component inside `<SurveysProvider>` | Question text in DOM; rating click fires `onSubmit(rating)`; Submit `disabled` until selection | US-1, US-2 |
| `<NpsModal>` / `<CesModal>` | Same pattern, per-bucket parametrize | `onSubmit(score, category)` arity is 2; category matches helper output | US-3, US-4 |
| `<SurveyModal>` / `<QuestionRating>` | No mock — used as real primitives | The wrappers compose these without re-implementing focus-trap/escape; verified by the wrapper test re-using existing modal a11y assertions | US-1 |
| `useReducedMotion` (via `@tour-kit/core`) | Mock the `matchMedia('(prefers-reduced-motion: reduce)')` return per the existing `reduced-motion.test.tsx` pattern; do NOT replace the hook | Snapshot under reduce omits motion utility classes | US-6 |
| `AnnouncementsProvider.reset(id)` | No mock — exercise the real reducer; test priming via the initial `announcements` prop | Reducer dispatches `RESET` with widened spread (`viewCount: 0`, etc.); subsequent `show(id)` un-gates the once-frequency announcement | US-5 |
| Storage adapter persist effect | No mock — assert the persisted state shape via the same in-memory adapter used elsewhere in the announcements suite | Persisted payload after reset has `viewCount: 0` | US-5 |
| `build-output.test.ts` tree-shake check | Extend the existing dist-shape test (currently checks `dist/index.js`, `dist/index.cjs`, and declarations) with a targeted ESM/CJS content scan | Built outputs expose the new modal exports and do not statically cross-reference unrelated turnkey modal component names in per-entry chunks, if separate chunks are introduced | US-7 |

---

## 3. Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|-------------|-------|-------------|
| Unit (scoring helpers) | vitest | <0.5s | Every push |
| Component (modals + reset) | vitest + @testing-library/react + jsdom | <5s | Every push |
| Snapshot (reduced-motion) | vitest + `matchMedia` mock | <2s | Every push |
| Build smoke (tree-shake + size) | `pnpm --filter @tour-kit/surveys build` + `build-output.test.ts` | ~10–15s | Pre-merge CI |

---

## 4. No Fake Implementations (Pure Logic + Component Composition Phase)

Phase 2 has zero heavy dependencies. The three modals are ~80 LOC wrappers around primitives already shipped by `@tour-kit/surveys`. The category helpers are pure functions. The `reset()` widening is three additional lines in two existing reducer branches. The closest thing to a "fake" is the existing `matchMedia` mock pattern in `reduced-motion.test.tsx` — reused, not introduced.

No new mocks needed for the announcement provider; tests prime state via the initial `announcements` prop following the established idiom in `packages/announcements/src/__tests__/*.test.tsx`.

---

## 5. Test File List

```
packages/surveys/src/__tests__/
├── turnkey-modals.test.tsx                                # NEW — CSAT/NPS/CES render, click, callback arity, snapshot,
│                                                          #       reduced-motion, tree-shake per-modal
└── scoring-category.test.ts                               # NEW — computeNpsCategory + computeCesCategory boundary cases

packages/announcements/src/__tests__/
└── provider-reset-view-count.test.tsx                     # NEW — register frequency:once, show→dismiss (viewCount=1),
                                                           #       reset (viewCount=0, etc.), show again → renders
```

| File | Tier | Tests | Description |
|------|------|-------|-------------|
| `turnkey-modals.test.tsx` | Component | ≥12 | One render test per modal (3); one Submit-disabled-until-selected (3); per-category bucket for NPS/CES (3+3); reduced-motion snapshot per modal (3); tree-shake assertion. |
| `scoring-category.test.ts` | Unit | ≥6 | NPS boundaries at 9/8/7/6/0; CES boundaries at 7/5/4/3/1. |
| `provider-reset-view-count.test.tsx` | Component | 5 | Register; show → visible; dismiss → hidden + viewCount=1 + isDismissed=true; reset → viewCount=0 + isDismissed=false + lastViewedAt=null + completedAt=null; show again → visible (this assertion fails on `main`). |

---

## 6. Test Setup (Vitest + jsdom + existing harnesses)

**Additions to existing `packages/surveys/vitest.config.ts`:** none. The config already runs `*.test.tsx` files under jsdom. Reduced-motion tests reuse `globalThis.matchMedia` mock per `reduced-motion.test.tsx` (the canonical idiom in this repo):

```ts
// Pattern reused — see packages/surveys/src/__tests__/reduced-motion.test.tsx for the existing impl.
import { beforeEach, vi } from 'vitest'
function mockReducedMotion(reduce: boolean) {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true, value: vi.fn().mockImplementation((q: string) => ({
      matches: reduce && q.includes('reduce'),
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })),
  })
}
```

**Additions to existing `packages/announcements/vitest.config.ts`:** none.

For the tree-shake assertion, extend the existing `packages/surveys/src/__tests__/build-output.test.ts` rather than creating a new file. The current file reads `dist/index.js` / `dist/index.cjs` and verifies build artifacts exist; add any per-modal checks there so build-shape assertions stay in one place. If tsup still emits a single bundled entry, assert public exports and the combined gzip budget instead of pretending there are separate chunks.

---

## 7. Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Modals composed of existing primitives — do NOT re-test focus-trap/escape-key | Trust existing `<SurveyModal>` tests | Phase 2 says "no new core logic"; re-testing the primitives would be both wasted work and a fragile coupling. |
| Internal selected-value state is `useState<number \| null>`, not a reducer | One render per assertion; click → expect call | Single transient state — testing it via `act()` + button click is direct. |
| Category helpers are pure, tested without React | `expect(computeNpsCategory(9)).toBe('promoter')` | The helpers are the only new logic. Pure tests are fast and unambiguous. |
| Reduced-motion uses the established `matchMedia` mock | Reuse `reduced-motion.test.tsx` idiom | Re-implementing the mock would drift from the canonical pattern. The mock matches the cross-package contract from `CLAUDE.md`. |
| Tree-shake check extends `build-output.test.ts`, not a new file | One file owns build-shape assertions; adapt the assertion to the actual tsup output (`dist/index.js` / `dist/index.cjs`) | Avoid scattering build assertions across multiple test files, and avoid false failures from checking non-existent `*.mjs` files. |
| Regression test for reset() is intentionally written to fail on `main` first | Run against `main` before applying the fix to confirm the test catches the bug | Without this step, the test could pass on `main` for unrelated reasons (e.g., wrong frequency config) and silently regress when the fix lands. |
| Bundle delta test is one assertion, <2 KB combined | `expect(gzipped).toBeLessThan(2048)` | Easy to read, easy to update when the budget changes. Per-modal budgets would over-constrain. |
| Snapshot tests cover the rendered DOM, not pixel images | `toMatchSnapshot()` on `container.outerHTML` | Pixel snapshots are Playwright territory (Phase 3/4); component snapshots catch className drift cheaply. |
| Storage-adapter persist assertion uses the existing in-memory adapter | No `localStorage` mocking | Existing adapter exposes its written payload; reading it is deterministic. |

---

## 8. Example Test Case

The `<NpsModal>` test is the most representative — it exercises the modal composition, the category helper, and the callback arity all in one pass.

```tsx
// packages/surveys/src/__tests__/turnkey-modals.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NpsModal, SurveysProvider } from '../index'

describe('<NpsModal>', () => {
  function setup(onSubmit = vi.fn()) {
    render(
      <SurveysProvider>
        <NpsModal question="How likely are you to recommend us?" onSubmit={onSubmit} />
      </SurveysProvider>,
    )
    return { onSubmit }
  }

  it('renders the question and an 0–10 numeric scale by default', () => {
    setup()
    expect(screen.getByText('How likely are you to recommend us?')).toBeInTheDocument()
    for (let i = 0; i <= 10; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument()
    }
  })

  it('Submit is disabled until the user picks a score', async () => {
    setup()
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: '9' }))
    expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled()
  })

  it.each([
    [9, 'promoter'],
    [7, 'passive'],
    [3, 'detractor'],
  ])('onSubmit receives (score, category) for value %i', async (value, category) => {
    const { onSubmit } = setup()
    await userEvent.click(screen.getByRole('button', { name: String(value) }))
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(onSubmit).toHaveBeenCalledWith(value, category)
  })
})
```

---

## 9. Execution Prompt

Copy everything between the `---` lines into a new Claude session to write this test suite:

---

You are writing the test suite for Phase 2 of Tour Kit v2 Package Polish — Surveys Turnkey + viewCount Reset.

### What This Project Is

Tour Kit is a pnpm + Turborepo monorepo of 12 React packages. `@tour-kit/surveys` ships in-app microsurveys (NPS, CSAT, CES) composing `<SurveyModal>` + `<QuestionRating>`. `@tour-kit/announcements` ships modal/toast/banner/spotlight/slideout. Stack: TypeScript strict mode, React 18+, Vitest + @testing-library/react (jsdom). No heavy deps; no network.

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | `<CsatModal question onSubmit />` works without primitive imports | render + click rating | `onSubmit(4)` called once |
| US-2 | Submit disabled until selection | initial state + post-click | `disabled` toggles correctly |
| US-3 | NPS emits `(score, category)` | per-bucket parametrize | 9→promoter, 7→passive, 3→detractor |
| US-4 | CES emits `(score, category)` | per-bucket parametrize | 6→easy, 4→neutral, 2→difficult |
| US-5 | `reset(id)` re-displays once-frequency announcement | sequence test | `viewCount: 0` post-reset; subsequent `show()` renders |
| US-6 | Reduced-motion strips animation classes | matchMedia mock + snapshot | No `animate-in/fade-in/zoom-in` in className |
| US-7 | Tree-shakeable per-modal | build-output check | Chunks don't cross-reference modal names |

### Why Fakes Are Required

None. Phase 2 has zero heavy dependencies — pure functions + ~80 LOC component wrappers + a 6-line reducer widening. The only mock is the existing `matchMedia` pattern from `reduced-motion.test.tsx` (reused, not introduced).

### What NOT to Test

- Don't re-test `<SurveyModal>` focus-trap, escape-key, or aria-modal behavior — covered by existing modal tests. The wrappers compose; they don't re-implement.
- Don't test scoring aggregate calculators (`calculateNPS`/`calculateCSAT`/`calculateCES`) — those exist already and remain unchanged. Phase 2 only adds **single-score** category helpers.
- Don't test the storage adapter's write path beyond reading back the persisted payload after reset.
- Don't add a Playwright e2e for this phase — component tests + a docs build smoke cover the contract.

### Critical: No Fake Implementations

This is a pure logic + component composition phase. See §4 of this plan. The only reuse is the `matchMedia` mock idiom — copy-paste from `packages/surveys/src/__tests__/reduced-motion.test.tsx` rather than re-inventing.

### Test Files to Create

```
packages/surveys/src/__tests__/turnkey-modals.test.tsx       # NEW
packages/surveys/src/__tests__/scoring-category.test.ts      # NEW
packages/announcements/src/__tests__/provider-reset-view-count.test.tsx  # NEW
```

### Per-File Coverage Guidance

#### `packages/surveys/src/__tests__/scoring-category.test.ts`
≥6 cases. NPS boundaries: 10→promoter, 9→promoter, 8→passive, 7→passive, 6→detractor, 0→detractor. CES boundaries: 7→easy, 5→easy, 4→neutral, 3→difficult, 1→difficult. One assertion per `it`. Use `expect.each` for terseness.

#### `packages/surveys/src/__tests__/turnkey-modals.test.tsx`
≥12 cases organized in three `describe` blocks (one per modal). For each modal: (a) renders question + correct scale; (b) Submit disabled until selection; (c) per-category bucket via `it.each` (CSAT just asserts arity-1 callback with the raw rating; NPS/CES assert arity-2 with category). Snapshot per modal under default props; snapshot per modal under `matchMedia('(prefers-reduced-motion: reduce)') = true` — assert the className chain does NOT include `animate-in`, `fade-in`, `zoom-in`. Keep tree-shake/build-shape assertions in `build-output.test.ts`; if the package remains a single tsup entry, assert export presence + gzip budget rather than nonexistent per-modal chunks.

#### `packages/announcements/src/__tests__/provider-reset-view-count.test.tsx`
Exactly 5 cases in a single sequence test (or 5 separate cases sharing setup):
1. Render `<AnnouncementsProvider announcements={[{ id: 'a', config: { frequency: 'once' } }]}>` plus a consumer that calls `show('a')`. Assert `isVisible === true`.
2. Call `dismiss('a')`. Assert `isVisible === false`, `viewCount === 1`, `isDismissed === true`.
3. Call `reset('a')`. Assert `viewCount === 0`, `isDismissed === false`, `lastViewedAt === null`, `completedAt === null`.
4. Call `show('a')` again. Assert `isVisible === true` — **this assertion fails on `main` and passes after the Phase 2.1 widening**.
5. Read the persisted state from the in-memory storage adapter; assert it matches the post-reset shape (`viewCount: 0`, etc.).

### Data Model Notes

- `CsatModalProps` / `NpsModalProps` / `CesModalProps` are `interface`s (per Phase 2's data-model rule). Test their shape via TS — drift surfaces at compile time.
- `NpsCategory` / `CesCategory` are `type` unions exported from `core/scoring.ts`. Tests import them directly.
- The `RESET` / `RESET_ALL` reducer payload uses the existing `AnnouncementState` shape — no new type. The test asserts on the persisted state, not the type.

### Success Criteria

- `pnpm typecheck` (root) exits 0
- `pnpm --filter @tour-kit/announcements test -- --run provider-reset-view-count` exits 0 with all 5 assertions green
- `pnpm --filter @tour-kit/surveys test -- --run turnkey-modals scoring-category` exits 0 with ≥18 cases green (≥12 modal + ≥6 scoring)
- `pnpm --filter @tour-kit/surveys build` reports combined gzipped delta < 2 KB for the three new modals
- Snapshot under reduced-motion does NOT contain animation utility classes
- `pnpm --filter @tour-kit/docs build` exits 0; turnkey-modals page renders

### Expected File Structure at End

```
packages/surveys/src/__tests__/
├── turnkey-modals.test.tsx        # NEW
└── scoring-category.test.ts       # NEW
packages/announcements/src/__tests__/
└── provider-reset-view-count.test.tsx  # NEW
```

---

## 10. Run Commands

```bash
# Fast path — every push
pnpm --filter @tour-kit/surveys test -- --run scoring-category turnkey-modals
pnpm --filter @tour-kit/announcements test -- --run provider-reset-view-count

# Full per-package suites
pnpm --filter @tour-kit/surveys test -- --run
pnpm --filter @tour-kit/announcements test -- --run

# Build smoke (tree-shake + size)
pnpm --filter @tour-kit/surveys build

# Docs build
pnpm --filter @tour-kit/docs build

# Coverage
pnpm --filter @tour-kit/surveys test -- --coverage
```

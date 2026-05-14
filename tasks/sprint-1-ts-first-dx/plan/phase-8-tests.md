# Phase 8 Test Plan - License Soft Gate + Try-Before-Buy Watermark

**Scope:** `LicenseGate` soft no-provider behavior, `LicenseWatermark` portal badge, singleton ownership, GA/GTM click tracking, 8 Pro package gate swaps, Pro package mock cleanup, docs-copy verification.

**Primary stack:** Vitest, `@testing-library/react`, `@testing-library/jest-dom`, jsdom, one `@vitest-environment node` import smoke.

**Important repo correction:** `packages/license/src/__tests__/license-watermark.test.tsx` already exists and asserts the old full-screen `UNLICENSED` overlay. Replace those assertions. Do not add a second test file with conflicting behavior.

---

## Test Inventory

| Area | Current state | Required Phase 8 change |
| --- | --- | --- |
| `license-watermark.test.tsx` | 4 tests assert visible `UNLICENSED`, fixed full-screen overlay, no class name, `userSelect`. | Replace with portal, singleton, link, GA/GTM, pointer boundary, cleanup, owner handoff tests. |
| `license-gate.test.tsx` | Final test asserts `LicenseGate` throws outside `LicenseProvider`. | Replace that assertion with no-provider soft rendering; keep valid/invalid/loading/fallback coverage. |
| `license-provider` / cache tests | Existing coverage validates provider state and cache behavior. | Do not rewrite unless a new gate test needs a cache mock. |
| 8 Pro `license-integration.test.tsx` files | Mock `ProGate` and assert hard placeholder when unlicensed. | Mock `LicenseGate` and assert children plus badge when unlicensed. |
| Incidental package mocks | Several non-integration tests mock only `ProGate`. | Add `LicenseGate` passthrough to those mocks after provider imports change. |
| Node import safety | No current watermark node-environment import test. | Add `license-watermark.import.test.ts`, but only after guarding shared setup against missing `document`. The test only asserts `import()` resolves — it does not mount or invoke the component. Its purpose is to prove there are no module-level references to `document`, `window`, or DOM-touching side effects at parse time. |
| StrictMode dev double-mount | Not currently exercised. | Add a StrictMode case to `license-watermark.test.tsx` to prove id-based instance dedup holds under double-effect. |
| No-provider console warning | Not currently exercised. | Two cases in `license-gate.test.tsx`: warns when `NODE_ENV !== 'production'`, silent when `NODE_ENV === 'production'`. |

---

## User Stories

| # | User Story | Validation Check | Pass Condition |
| --- | --- | --- | --- |
| US-1 | As a developer evaluating Pro, I want a Pro package to render on a preview URL without a license. | Each Pro package `license-integration.test.tsx` unlicensed case. | Provider/component UI renders, badge mock renders, hard placeholder copy is absent. |
| US-2 | As a licensed buyer, I want no badge. | `license-gate.test.tsx` valid pro case. | Children render; no `[data-tourkit-watermark]`. |
| US-3 | As an unlicensed evaluator, I want only one badge even with many Pro providers. | `license-watermark.test.tsx` multiple instances case. | Multiple `<LicenseWatermark />` instances produce one DOM node. |
| US-4 | As an app user, I do not want the badge wrapper to block app clicks. | `license-watermark.test.tsx` pointer boundary. | Wrapper has inline `pointerEvents: none`; link has `pointerEvents: auto`. |
| US-5 | As marketing, I want badge clicks tracked in GA. | `license-watermark.test.tsx` `gtag` case. | `window.gtag('event', 'unlicensed_badge_clicked', payload)` is called once. |
| US-6 | As a GTM-only site owner, I still want badge clicks tracked. | `license-watermark.test.tsx` `dataLayer` fallback case. | One payload is pushed to `window.dataLayer` when `gtag` is absent. |
| US-7 | As a Next.js user, I do not want SSR or import-time crashes. | `license-watermark.import.test.ts` and `license-gate.test.tsx` SSR case. | Import without DOM succeeds; `renderToString` succeeds. |
| US-8 | As a package maintainer, I want all Pro package tests to pass after the import swap. | Package-level `pnpm --filter ... test`. | All 8 Pro package test commands pass. |
| US-9 | As a downstream consumer, I want render-key context to keep working when licensed. | Existing `LicenseRenderContext` test in `license-gate.test.tsx`. | Consumer reads the provider's render key on valid pro. |
| US-10 | As a developer evaluating Pro, I can omit `<LicenseProvider>` and still see the UI. | `license-gate.test.tsx` no-provider case. | Children and badge render; no `"useLicense must be used within a <LicenseProvider>"` throw. |
| US-11 | As a localhost developer, I do not want a badge. | `license-gate.test.tsx` dev-host no-provider case. | Children render; no badge. |
| US-12 | As a React app with dynamic Pro surfaces, I want the badge to remain if the first provider unmounts. | `license-watermark.test.tsx` owner handoff case. | Removing the first instance while another remains leaves one badge in the DOM. |
| US-13 | As a TypeScript maintainer, I want the swap to compile. | `pnpm typecheck`. | Internal usages pass `require="pro"` or the prop is deliberately made optional. |
| US-14 | As a dev evaluating Pro without `<LicenseProvider>`, I want a one-line console hint. | `license-gate.test.tsx` no-provider warning case. | `console.warn` fires when `NODE_ENV !== 'production'`; stays silent when `NODE_ENV === 'production'`. |
| US-15 | As a developer using React StrictMode, I want one badge, not two. | `license-watermark.test.tsx` StrictMode case. | Wrapping the tree in `<StrictMode>` leaves exactly one `[data-tourkit-watermark]`. |

---

## License Package Tests

### Shared Setup Guard

Before adding any node-environment test, update `packages/license/src/__tests__/setup.ts`:

```ts
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  if (typeof document !== 'undefined') {
    document.body.innerHTML = ''
  }
})
```

Without this guard, a node-environment import smoke can fail from test setup even if `LicenseWatermark` is SSR-safe.

### `license-watermark.test.tsx`

Replace the current tests with these cases:

| Test | Notes |
| --- | --- |
| Renders into `document.body` via portal | Query `document.body.querySelector('[data-tourkit-watermark]')`. |
| Does not render before client effect | Optional if implementation has a `mounted` state. |
| Singleton dedup with 5 instances | Render 5 instances in one tree; expect one watermark node. |
| Same-tick double mount | Render 2 instances in one tree; expect one watermark node. |
| Owner handoff | Render two controllable instances, remove the first, expect one badge remains. |
| StrictMode owner stability | Wrap two `<LicenseWatermark />` in `<StrictMode>`; assert one badge (covers id-based dedup against double-effect). |
| Last unmount cleanup | Unmount all instances; expect no portal root. |
| Link href includes UTM params | Assert `utm_source=unlicensed_badge`, `utm_medium=in_app`, `utm_campaign=watermark`. |
| `gtag` dispatch | Stub `window.gtag`; click the link; assert event name and payload. |
| `dataLayer` fallback | Stub `window.dataLayer = []` and `delete (window as any).gtag` **before render** so the click handler captures the absent `gtag`. Assert exactly one pushed object with `event: 'unlicensed_badge_clicked'`. |
| No analytics globals | Click does not throw. |
| Pointer boundary | Assert inline styles directly, not `getComputedStyle`. |
| No old overlay text dependency | Do not assert `screen.getByText('UNLICENSED')`; copy is changing. |

Implementation test pattern:

```tsx
beforeEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
  vi.resetModules()
})

function findWatermark() {
  return document.body.querySelector('[data-tourkit-watermark]')
}
```

Use dynamic import inside tests after `vi.resetModules()` so module-level singleton state resets:

```tsx
const { LicenseWatermark } = await import('../components/license-watermark')
```

Use `waitFor` only when the assertion depends on `useEffect`:

```tsx
await waitFor(() => {
  expect(findWatermark()).toBeInTheDocument()
})
```

Owner handoff shape:

```tsx
function Harness({ showFirst = true }) {
  return (
    <>
      {showFirst ? <LicenseWatermark /> : null}
      <LicenseWatermark />
    </>
  )
}

const { rerender } = render(<Harness />)
await waitFor(() => expect(document.body.querySelectorAll('[data-tourkit-watermark]')).toHaveLength(1))
rerender(<Harness showFirst={false} />)
await waitFor(() => expect(document.body.querySelectorAll('[data-tourkit-watermark]')).toHaveLength(1))
```

### `license-watermark.import.test.ts`

Add:

```ts
// @vitest-environment node
import { describe, expect, it } from 'vitest'

describe('LicenseWatermark module load', () => {
  it('is safe to import without window or document', async () => {
    await expect(import('../components/license-watermark')).resolves.toBeDefined()
  })
})
```

This test is import-time only. Runtime DOM behavior belongs in jsdom tests.

### `license-gate.test.tsx`

Keep the existing valid, invalid, fallback, loading, and render-key tests, then update and add these cases:

| Test | Required assertion |
| --- | --- |
| No provider on non-dev host | `<LicenseGate require="pro">` renders children plus badge and does not throw. |
| No provider on non-dev host warns in dev NODE_ENV | Stub `process.env.NODE_ENV = 'development'`; `console.warn` is called once with the `[TourKit]` prefix. |
| No provider on non-dev host is silent in production NODE_ENV | Stub `process.env.NODE_ENV = 'production'`; `console.warn` is not called. |
| No provider on dev host | Children render and badge is absent; `console.warn` not called. |
| SSR safety | `renderToString(<LicenseGate require="pro">...</LicenseGate>)` does not throw. |
| Fallback with provider gated | Fallback renders; children and badge are absent. |
| Invalid/free with no fallback | Children and badge render. |
| Valid pro | Children render and badge is absent. |

The old test below must be deleted:

```tsx
it('throws when used outside LicenseProvider', () => {
  // This is no longer true for <LicenseGate>.
})
```

`useLicense()` itself should keep its throwing contract. That belongs in `hooks.test.tsx`, not in `license-gate.test.tsx`.

---

## Pro Package Mock Strategy

### Integration Tests

**Mocking style decision.** `vi.mock(...)` is hoisted and per-file; `vi.doMock(...)` is dynamic and only takes effect on subsequent `await import(...)`. To avoid module-cache surprises, structure the integration suite as:

- **One file, one default mock**: top-level `vi.mock('@tour-kit/license', ...)` with a passthrough `LicenseGate`. Use this file for the licensed case.
- **Toggle via `await import` only when both cases live in the same file**: in a `beforeEach` call `vi.resetModules()`, then call `vi.doMock(...)` with the unlicensed implementation, then `const { Provider } = await import('...')`. Static `import` at file top will bind to the licensed mock and not switch.
- **Or split into two files** (`*.licensed.test.tsx`, `*.unlicensed.test.tsx`) — usually simpler than the toggle dance.

Each of these files needs a licensed passthrough case and an unlicensed soft-gate case:

- `packages/adoption/src/__tests__/license-integration.test.tsx`
- `packages/announcements/src/__tests__/license-integration.test.tsx`
- `packages/checklists/src/__tests__/license-integration.test.tsx`
- `packages/ai/src/__tests__/license-integration.test.tsx`
- `packages/surveys/src/__tests__/license-integration.test.tsx`
- `packages/scheduling/src/__tests__/license-integration.test.tsx`
- `packages/analytics/src/__tests__/license-integration.test.tsx`
- `packages/media/src/__tests__/license-integration.test.tsx`

Licensed mock:

```tsx
vi.mock('@tour-kit/license', () => ({
  LicenseGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
```

Unlicensed mock:

```tsx
vi.doMock('@tour-kit/license', () => ({
  LicenseGate: ({ children }: { children: React.ReactNode }) => (
    <>
      {children}
      <div data-testid="license-watermark">Tour Kit - Unlicensed</div>
    </>
  ),
}))
```

Assertions:

- The actual provider or component UI renders.
- `screen.getByTestId('license-watermark')` is present in the unlicensed case.
- `screen.queryByText(/Tour Kit Pro license required/i)` is absent.
- The old `pro-gate-placeholder` assertions are removed.

### Incidental Mocks

After provider files import `LicenseGate`, any test that mocks `@tour-kit/license` with only `ProGate` can fail with an invalid React component. Update these mocks to include a passthrough `LicenseGate`.

Files found by repo search:

- `packages/surveys/src/__tests__/survey-popover-focus.test.tsx`
- `packages/surveys/src/__tests__/question-rating.test.tsx`
- `packages/surveys/src/__tests__/question-text.test.tsx`
- `packages/surveys/src/__tests__/display-components.test.tsx`
- `packages/surveys/src/__tests__/storage.test.tsx`
- `packages/surveys/src/__tests__/survey-modal.test.tsx`
- `packages/surveys/src/__tests__/queue-drain.test.tsx`
- `packages/surveys/src/__tests__/question-boolean.test.tsx`
- `packages/surveys/src/__tests__/headless-questions.test.tsx`
- `packages/surveys/src/__tests__/show-guards.test.tsx`
- `packages/surveys/src/__tests__/question-select.test.tsx`
- `packages/checklists/src/__tests__/url-visit-completion.test.tsx`

Recommended low-risk mock for incidental tests:

```tsx
vi.mock('@tour-kit/license', () => ({
  LicenseGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ProGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useLicenseGate: () => ({ isGated: false, isLoading: false }),
}))
```

Keep `ProGate` in incidental mocks if the test imports a file that still directly uses the hard gate or `useLicenseGate`.

---

## Package-Specific Assertions

| Package | Minimum assertion after unlicensed mock |
| --- | --- |
| `adoption` | Child inside `AdoptionProvider` renders plus `license-watermark`. |
| `announcements` | Child inside `AnnouncementsProvider` renders plus `license-watermark`. |
| `checklists` | Child inside `ChecklistProvider` renders plus `license-watermark`. |
| `ai` | Child inside `AiChatProvider` renders plus `license-watermark`; keep existing `@ai-sdk/react` and `ai` mocks. |
| `surveys` | Child inside `SurveysProvider` renders plus `license-watermark`; unrelated survey component tests use passthrough mock. |
| `scheduling` | `ScheduleGate` renders children plus `license-watermark`. |
| `analytics` | `AnalyticsProvider` renders children plus `license-watermark`. |
| `media` | `YouTubeEmbed` renders iframe plus `license-watermark`; `TourMedia` routed embeds render their target media plus `license-watermark`. |

For `media`, the old regression expectation "raw iframe is blocked by placeholder" becomes "routed embed still goes through the license gate, but the real media renders with a badge."

---

## Docs and URL Tests

Update or add assertions where tests already cover these files:

- `packages/license/src/__tests__/pro-gate.test.tsx` should expect `https://usertourkit.com/pricing` if Phase 8 aligns `ProGate` URLs.
- `LicenseWarning` warning text should use `https://usertourkit.com/pricing`.
- `LicenseWatermark` link should include the full UTM URL.

No new docs test is required for `apps/docs/components/landing/pricing.tsx` unless an existing docs component test already renders the FAQ.

---

## Verification Commands

Run package tests first to isolate failures:

```sh
pnpm --filter @tour-kit/license test
pnpm --filter @tour-kit/adoption test
pnpm --filter @tour-kit/announcements test
pnpm --filter @tour-kit/checklists test
pnpm --filter @tour-kit/ai test
pnpm --filter @tour-kit/surveys test
pnpm --filter @tour-kit/scheduling test
pnpm --filter @tour-kit/analytics test
pnpm --filter @tour-kit/media test
```

Then run workspace validation:

```sh
pnpm typecheck
pnpm test
```

If `pnpm test` is too slow for the PR loop, run it before merge after all filtered package suites pass.

---

## Manual QA Checklist

On a non-localhost preview or staging host:

- Mount at least one component from each Pro package.
- Confirm all components render their real UI with no hard placeholder.
- Confirm exactly one `[data-tourkit-watermark]` node exists.
- Confirm removing one Pro surface while others remain does not remove the badge.
- Confirm clicking the badge opens pricing with UTM params.
- Confirm `window.gtag` receives `unlicensed_badge_clicked` when present.
- Confirm `window.dataLayer` receives the event when `gtag` is absent.
  - **If the preview has no GA install** (typical), in DevTools before clicking:
    ```js
    window.gtag = (...args) => console.log('gtag', args)
    window.dataLayer = []
    ```
    Click the badge, then verify the console log and `window.dataLayer[0]`.
- Confirm no hydration warning appears.
- Confirm app controls under the page still receive clicks outside the badge link.

On localhost:

- Confirm Pro package UI renders.
- Confirm no badge.
- Confirm no license warning is logged from `LicenseWarning`.

---

## Out of Scope for Tests

- Live Polar API calls.
- Purchase flow or Polar webhook attribution.
- Pixel-diff visual regression.
- Browser extension badge blocking.
- MutationObserver anti-tamper behavior.
- Sitewide `tourkit.dev` historical URL cleanup.

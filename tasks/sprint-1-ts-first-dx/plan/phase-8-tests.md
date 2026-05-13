# Phase 8 — License Soft Gate + Try-Before-Buy Watermark

**Scope:** `<LicenseWatermark>` redesign (portal, singleton dedup, corner pill, GA event); 8 Pro provider gate swaps; 8 license-integration test updates; new watermark unit test.
**Key Pattern:** Unit + component tests via Vitest + `@testing-library/react` + jsdom. SSR safety verified by import-time smoke (file should not crash at require-time). Singleton dedup verified by mounting the watermark twice and asserting one DOM node.
**Dependencies:** `vitest@catalog:`, `@testing-library/react@catalog:`, `@testing-library/jest-dom@catalog:`, `jsdom@catalog:`.

---

## User Stories

| # | User Story | Validation Check | Pass Condition |
|---|------------|------------------|----------------|
| US-1 | As a developer evaluating Pro, I want `@tour-kit/announcements` to render on a preview URL without a license so my team can see it before I pay | `<package>/__tests__/license-integration.test.tsx` `renders children when unlicensed` | Provider renders its visible UI; placeholder copy ("Pro license required") is absent |
| US-2 | As a Pro buyer, I want my licensed app to show no watermark | `license-watermark.test.tsx` `does not render when license is valid` | No `[data-tourkit-watermark]` node in document |
| US-3 | As a developer with no license in production, I want a single small badge linking to checkout — not 5 badges if I mount 5 Pro providers | `license-watermark.test.tsx` `singleton dedup` | Mounting 5 `<LicenseWatermark>` instances → exactly one `[data-tourkit-watermark]` in `document.body` |
| US-4 | As a Pro buyer who scrolls or opens a modal, I want the badge to stay accessible without trapping clicks on app content | `license-watermark.test.tsx` `pointer events` | Wrapper has `pointer-events: none`; link has `pointer-events: auto` |
| US-5 | As a marketing analyst, I want every badge click to fire a GA event with UTM attribution | `license-watermark.test.tsx` `dispatches GA event on click` | `window.gtag` called once with `'event', 'unlicensed_badge_clicked', { placement: 'watermark', hostname: …, … }`; link href contains all three `utm_*` params |
| US-6 | As a dev running `pnpm dev`, I want a console warning so I know the badge is showing | existing `license-warning.test.tsx` unchanged | `console.warn` called once in development; silent in production |
| US-7 | As a Next.js user, I don't want SSR to crash because the watermark touches `document` | `license-watermark.test.tsx` `safe to import without window` | `require('./license-watermark')` succeeds in node environment without `document` |
| US-8 | As a CI engineer, I want all 8 Pro packages' license-integration suites to pass after the gate swap | `pnpm test` per Pro pkg | All `license-integration.test.tsx` exit 0; assertions updated from "placeholder" to "children + watermark" |
| US-9 | As a Pro provider author, I want `<LicenseRenderContext>` to still provide the render key on the licensed path so downstream consumers work | new test `license-gate-context.test.tsx` | `LicenseRenderContext` value is the licensed `renderKey` on licensed path; `undefined` on unlicensed path |

---

## Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|-----------|---------------|----------------|------------|
| `<LicenseWatermark>` (portal singleton) | No mock — render real component into a `<LicenseProvider>` test wrapper with `isDevEnvironment` stub returning `false` | Renders into `document.body` via portal; node has `data-tourkit-watermark`; singleton flag dedups | US-3, US-4 |
| `validateLicenseKey` (Polar fetch) | `vi.mock('../lib/polar-client', () => ({ validateLicenseKey: vi.fn() }))` — return `{ status: 'valid', tier: 'pro', renderKey: 'ok' }` for licensed tests, `{ status: 'invalid', tier: 'free' }` for unlicensed | Watermark renders only when status is not valid+pro | US-1, US-2 |
| `isDevEnvironment()` | `vi.mock('../lib/domain', () => ({ ...actual, isDevEnvironment: () => false, getCurrentDomain: () => 'app.acme.com' }))` per-test | Watermark only renders on non-dev hosts | US-1 |
| `window.gtag` | `vi.stubGlobal('gtag', vi.fn())` for the dispatch test; omit for the no-op test | When present, called with `('event', 'unlicensed_badge_clicked', payload)`; when absent, click does not throw | US-5 |
| `createPortal` | No mock — testing-library + jsdom support portals natively | Rendered node found via `document.body.querySelector` not `screen` (because screen scoped to render container) | US-3 |
| `<LicenseGate>` upstream of Pro providers | In each Pro `license-integration.test.tsx`: previously mocked `@tour-kit/license.ProGate`; now mock `LicenseGate` (or use real `<LicenseProvider>` + stubbed `validateLicenseKey`) | Children render; watermark element present in unlicensed test | US-8 |
| `console.warn` | `vi.spyOn(console, 'warn').mockImplementation(() => {})` in `license-warning.test.tsx` (unchanged) | Called once in dev mode | US-6 |
| Node-environment import smoke | `vi.config: { environment: 'node' }` in a single test file `license-watermark.import.test.ts` | `await import('../components/license-watermark')` succeeds without `document` | US-7 |

---

## Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|--------------|-------|-------------|
| Unit — watermark | vitest, jsdom, RTL | <1s | Every push |
| Unit — singleton dedup | vitest, jsdom, RTL | <1s | Every push |
| Unit — SSR import smoke (node env) | vitest (node env) | <500ms | Every push |
| Integration — 8 Pro packages license-integration | vitest, jsdom, RTL | <3s per pkg | Every push |
| Visual QA — preview deploy | manual; Dokploy staging | ~10 min | Before release only |

No E2E tier — Playwright is overkill for a single rendered badge. Visual QA on a real deploy is the substitute.

---

## Fake / Mock Implementations

**Minimal mocking.** The watermark, the gate, the provider context — all real. Only the Polar `fetch` boundary and the `isDevEnvironment` host check are stubbed.

Shared helpers:

```ts
// packages/license/src/__tests__/_helpers.ts
import { vi } from 'vitest'

export function stubProdHost(host = 'app.acme.com') {
  vi.mock('../lib/domain', async (orig) => ({
    ...(await orig<typeof import('../lib/domain')>()),
    isDevEnvironment: () => false,
    getCurrentDomain: () => host,
  }))
}

export function stubLicense(status: 'valid' | 'invalid' | 'error' = 'invalid') {
  vi.mock('../lib/polar-client', () => ({
    validateLicenseKey: vi.fn(async () => ({
      status,
      tier: status === 'valid' ? 'pro' : 'free',
      activations: 0,
      maxActivations: 5,
      domain: null,
      expiresAt: null,
      validatedAt: Date.now(),
      renderKey: status === 'valid' ? 'ok' : undefined,
    })),
  }))
}

export function findWatermark(): HTMLElement | null {
  return document.body.querySelector('[data-tourkit-watermark]')
}
```

---

## Concrete Test Cases

### `packages/license/src/__tests__/license-watermark.test.tsx` (new)

```ts
describe('<LicenseWatermark>', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    // reset module-level singleton state
    vi.resetModules()
  })

  it('renders into document.body via portal', async () => {
    const { LicenseWatermark } = await import('../components/license-watermark')
    render(<LicenseWatermark />)
    expect(findWatermark()).toBeInTheDocument()
    expect(findWatermark()?.parentElement).toBe(document.body)
  })

  it('singleton dedup — five instances render one node', async () => {
    const { LicenseWatermark } = await import('../components/license-watermark')
    render(
      <>
        <LicenseWatermark />
        <LicenseWatermark />
        <LicenseWatermark />
        <LicenseWatermark />
        <LicenseWatermark />
      </>
    )
    expect(document.body.querySelectorAll('[data-tourkit-watermark]')).toHaveLength(1)
  })

  it('removes the portal node on last unmount', async () => {
    const { LicenseWatermark } = await import('../components/license-watermark')
    const { unmount } = render(<LicenseWatermark />)
    expect(findWatermark()).toBeInTheDocument()
    unmount()
    expect(findWatermark()).toBeNull()
  })

  it('link href contains UTM attribution', async () => {
    const { LicenseWatermark } = await import('../components/license-watermark')
    render(<LicenseWatermark />)
    const link = findWatermark()?.querySelector('a')
    expect(link?.getAttribute('href')).toMatch(/utm_source=unlicensed_badge/)
    expect(link?.getAttribute('href')).toMatch(/utm_medium=in_app/)
    expect(link?.getAttribute('href')).toMatch(/utm_campaign=watermark/)
  })

  it('dispatches GA event on click when gtag is present', async () => {
    const gtagSpy = vi.fn()
    vi.stubGlobal('gtag', gtagSpy)
    const { LicenseWatermark } = await import('../components/license-watermark')
    render(<LicenseWatermark />)
    fireEvent.click(findWatermark()!.querySelector('a')!)
    expect(gtagSpy).toHaveBeenCalledWith(
      'event',
      'unlicensed_badge_clicked',
      expect.objectContaining({ placement: 'watermark' })
    )
  })

  it('click does not throw when gtag is absent', async () => {
    const { LicenseWatermark } = await import('../components/license-watermark')
    render(<LicenseWatermark />)
    expect(() => fireEvent.click(findWatermark()!.querySelector('a')!)).not.toThrow()
  })

  it('pointer-events boundary', async () => {
    const { LicenseWatermark } = await import('../components/license-watermark')
    render(<LicenseWatermark />)
    const wrapper = findWatermark()!
    const link = wrapper.querySelector('a')!
    expect(getComputedStyle(wrapper).pointerEvents).toBe('none')
    expect(getComputedStyle(link).pointerEvents).toBe('auto')
  })
})
```

### `packages/license/src/__tests__/license-watermark.import.test.ts` (new, node env)

```ts
// @vitest-environment node
import { describe, expect, it } from 'vitest'

describe('LicenseWatermark module load', () => {
  it('is safe to import without window/document', async () => {
    await expect(import('../components/license-watermark')).resolves.toBeDefined()
  })
})
```

### Existing `packages/<pkg>/src/__tests__/license-integration.test.tsx` (8 files, updated)

Each currently:
```ts
vi.mock('@tour-kit/license', () => ({
  ProGate: ({ children }) => <>{children}</>,
  // …
}))
```
plus a sibling `describe('… — ProGate blocks when unlicensed')` block that re-mocks `ProGate` to render a placeholder.

After this phase, each becomes:
```ts
vi.mock('@tour-kit/license', () => ({
  LicenseGate: ({ children }) => <>{children}<LicenseWatermark /></>,
  LicenseProvider: ({ children }) => <>{children}</>,
  LicenseWatermark: () => <div data-testid="watermark" />,
  // …
}))

it('renders children AND watermark when unlicensed', () => {
  render(<AnnouncementsProvider … />)
  expect(screen.getByTestId('watermark')).toBeInTheDocument()
  expect(screen.getByRole('dialog')).toBeInTheDocument()  // the actual provider UI
  expect(screen.queryByText(/Pro license required/i)).not.toBeInTheDocument()
})
```

The "placeholder when unlicensed" assertion is **deleted** in each file — that behavior no longer exists by design.

---

## Out of Scope for Tests

- **Polar API live test.** Already covered by `packages/license/src/__tests__/polar-client.test.ts`.
- **Watermark visual regression / pixel diff.** Visual QA on the preview deploy is the substitute; setting up Storybook visual tests for one badge isn't worth the maintenance.
- **End-to-end purchase test.** Polar webhook attribution is a separate phase.
- **Anti-tamper detection** (someone removes the badge via devtools). The `data-tourkit-watermark` re-mount effect is best-effort; testing it would mean racing a `MutationObserver` against deliberate tampering, which adds flake.
- **Browser extension blocking.** Acceptable failure mode, not tested.

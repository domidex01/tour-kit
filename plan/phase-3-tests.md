# Phase 3 — Testing: Pro Package License Integration

**Scope:** License check integration across 7 pro packages (analytics, announcements, checklists, adoption, media, scheduling, ai) + free-package isolation verification (core, react, hints)
**Key Pattern:** Mock `@tour-kit/license` module entirely via `vi.mock()`. Test each pro package provider/component in 3 license states: (1) package not installed, (2) installed but invalid key, (3) valid key. No real license validation — Phase 1/2 already tested that.
**Dependencies:** vitest, @testing-library/react, jsdom

---

## User Stories

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | As a developer, I want pro packages to work without `@tour-kit/license` installed, so that I can evaluate them before purchasing | 7x `license-integration.test.tsx` — "no crash without license package" test in each | `render()` succeeds, no error thrown, children visible in DOM |
| US-2 | As a developer, I want a visible watermark when using pro packages without a valid license, so that I know licensing is required | 7x `license-integration.test.tsx` — "watermark visible when unlicensed" test | `screen.queryByText('UNLICENSED')` is not null |
| US-3 | As a developer, I want a console warning in dev mode when unlicensed, so that I notice without inspecting the DOM | 7x `license-integration.test.tsx` — "console.warn fires" test | `vi.spyOn(console, 'warn')` called with string containing package name |
| US-4 | As a licensed developer, I want zero watermarks and zero warnings, so that my users see a clean UI | 7x `license-integration.test.tsx` — "no watermark with valid license" test | `screen.queryByText('UNLICENSED')` is null, `console.warn` not called |
| US-5 | As a maintainer, I want free packages to have zero license imports, so that they remain MIT and lightweight | `free-package-isolation.test.ts` — grep source + dist for `@tour-kit/license` | grep returns zero matches across core, react, hints source and dist |

---

## Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|-----------|--------------|----------------|------------|
| `useLicenseCheck()` in each pro package | `vi.mock('@tour-kit/license', ...)` — 3 variants: (a) throw on require (not installed), (b) return `{ useLicense: () => ({ status: 'invalid' }) }`, (c) return `{ useLicense: () => ({ status: 'active' }) }` | Hook return value: `{ isLicensed, isLoading }` matches expected state | US-1, US-2, US-4 |
| `ProWatermark` in each pro package | Rendered via parent provider/component — no direct mocking | DOM contains/lacks `UNLICENSED` text node with `aria-hidden="true"` | US-2, US-4 |
| `console.warn` | `vi.spyOn(console, 'warn')` | Called once per mount with package name when unlicensed; not called when licensed | US-3, US-4 |
| `AnalyticsProvider` | Render with mock `AnalyticsConfig` (empty plugins array, `enabled: false`) | Children render in all 3 license states | US-1, US-2, US-4 |
| `AnnouncementsProvider` | Render with minimal required props | Children render in all 3 license states | US-1, US-2, US-4 |
| `ChecklistProvider` | Render with minimal required props | Children render in all 3 license states | US-1, US-2, US-4 |
| `AdoptionProvider` | Render with minimal required props | Children render in all 3 license states | US-1, US-2, US-4 |
| Media embed components (e.g., `YouTubeEmbed`) | Render with mock video ID/URL | Component renders in all 3 license states; HOC wraps with watermark | US-1, US-2, US-4 |
| `ScheduleGate` | Render with children | Children render in all 3 license states; watermark overlay when unlicensed | US-1, US-2, US-4 |
| `AiChatProvider` | Render with minimal required props | Children render in all 3 license states | US-1, US-2, US-4 |
| Free packages (core, react, hints) | No mock — static analysis via grep | Zero occurrences of `@tour-kit/license` in source and dist | US-5 |

---

## Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|-------------|-------|-------------|
| Unit | vitest, @testing-library/react, jsdom — all mocked, no real license validation | <5s total | Every push |
| Static analysis | grep/ripgrep on filesystem — no runtime deps | <1s | Every push |

No integration tier needed — real license validation is tested in Phase 1/2. Phase 3 tests only verify the wiring between pro packages and the license module interface.

---

## Fake / Mock Implementations

### License Module Mock — replaces `@tour-kit/license`

Three mock configurations are used across all 7 test files. These are not fake classes but `vi.mock()` factory functions:

```typescript
// ── Mock: license package NOT installed ─────────────────────────────────
// Simulates require('@tour-kit/license') throwing MODULE_NOT_FOUND
vi.mock('@tour-kit/license', () => {
  throw new Error('Cannot find module \'@tour-kit/license\'')
})

// ── Mock: license package installed, no valid key ───────────────────────
// Simulates useLicense() returning invalid status
vi.mock('@tour-kit/license', () => ({
  useLicense: () => ({ status: 'invalid' }),
}))

// ── Mock: license package installed, valid key ──────────────────────────
// Simulates useLicense() returning active status
vi.mock('@tour-kit/license', () => ({
  useLicense: () => ({ status: 'active' }),
}))
```

Since `vi.mock()` is hoisted and applies per-file, each license state requires a **separate `describe` block** with `vi.mock()` reset between states. Use `vi.doMock()` (non-hoisted) inside `beforeEach` for parametric testing, or split into separate test files per state.

**Recommended approach:** Use a single test file per package with `describe.each` and dynamic `vi.doMock()` + `vi.resetModules()` to re-import the component under test with different mock configurations:

```typescript
function setupLicenseMock(state: 'not-installed' | 'invalid' | 'active') {
  vi.resetModules()

  if (state === 'not-installed') {
    vi.doMock('@tour-kit/license', () => {
      throw new Error("Cannot find module '@tour-kit/license'")
    })
  } else {
    vi.doMock('@tour-kit/license', () => ({
      useLicense: () => ({ status: state }),
    }))
  }
}
```

---

## Test File List

```
packages/
├── analytics/src/__tests__/
│   └── license-integration.test.tsx       # AnalyticsProvider: 3 license states, watermark, console.warn, children render
├── announcements/src/__tests__/
│   └── license-integration.test.tsx       # AnnouncementsProvider: 3 license states, watermark, console.warn, children render
├── checklists/src/__tests__/
│   └── license-integration.test.tsx       # ChecklistProvider: 3 license states, watermark, console.warn, children render
├── adoption/src/__tests__/
│   └── license-integration.test.tsx       # AdoptionProvider: 3 license states, watermark, console.warn, children render
├── media/src/__tests__/
│   └── license-integration.test.tsx       # YouTubeEmbed (representative): 3 license states, HOC wrapping, watermark, console.warn
├── scheduling/src/__tests__/
│   └── license-integration.test.tsx       # ScheduleGate: 3 license states, watermark, console.warn; useSchedule: dev warning
├── ai/src/__tests__/
│   └── license-integration.test.tsx       # AiChatProvider: 3 license states, watermark, console.warn, children render
└── __tests__/
    └── free-package-isolation.test.ts     # Static grep: core, react, hints have zero @tour-kit/license imports in src/ and dist/
```

**Total: 8 test files** (7 per-package integration + 1 free-package isolation)

---

## Setup / Shared Utilities

Each pro package already has a vitest config with `environment: 'jsdom'` and a setup file. No new `conftest.py` equivalent is needed. The license mock helper should be defined **inline in each test file** (not shared across packages) because each package is tested independently with its own vitest instance.

**Shared test helper pattern** (copy into each test file):

```typescript
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type LicenseState = 'not-installed' | 'invalid' | 'active'

/**
 * Reset module registry and configure license mock for the given state.
 * Must call vi.resetModules() before each test to get fresh imports.
 */
function setupLicenseMock(state: LicenseState) {
  vi.resetModules()

  if (state === 'not-installed') {
    vi.doMock('@tour-kit/license', () => {
      throw new Error("Cannot find module '@tour-kit/license'")
    })
  } else {
    vi.doMock('@tour-kit/license', () => ({
      useLicense: () => ({ status: state }),
    }))
  }
}

/**
 * Dynamically import the component under test AFTER mock is configured.
 * This ensures the module-level try-catch in use-license-check.ts
 * picks up the mocked (or missing) @tour-kit/license module.
 */
async function importProvider() {
  // Each test file replaces this with its own package import
  const mod = await import('../../path/to/provider')
  return mod.SomeProvider
}
```

---

## Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Use `vi.doMock()` + `vi.resetModules()` instead of hoisted `vi.mock()` | Dynamic mocking allows testing 3 license states in one file | `vi.mock()` is hoisted and cannot be changed between `describe` blocks; `vi.doMock()` + dynamic `import()` resets the module-level `try-catch` in `use-license-check.ts` |
| Dynamic `import()` after mock setup | Each test re-imports the provider/component after configuring the license mock | The `use-license-check.ts` pattern runs `require('@tour-kit/license')` at module scope; the mock must be in place BEFORE the module loads |
| Test one representative media component, not all 6 | Test `YouTubeEmbed` as representative; HOC is the same for all | The `withLicenseCheck()` HOC is shared — testing one component proves the pattern; testing all 6 adds noise without coverage value |
| Free-package isolation via shell grep, not runtime test | Run `grep -r` on source and dist directories | This is a static property (no imports exist) — runtime testing would require building the packages first and inspecting bundles, which grep does more directly |
| Console.warn tested via `vi.spyOn` | Spy on `console.warn` before render, assert after | Direct and idiomatic in vitest; no need for custom logger injection |
| Each package tested in isolation | Separate test file per package, each with its own mock setup | Packages are independently published — their license integration must work independently |
| Watermark detected via text content, not CSS inspection | `screen.queryByText('UNLICENSED')` | Text content is the user-visible signal; CSS properties (opacity, z-index) are implementation details that could change without breaking the feature |
| `aria-hidden="true"` verified on watermark element | `expect(watermarkEl).toHaveAttribute('aria-hidden', 'true')` | Accessibility requirement — screen readers must not announce the watermark |

---

## Example Test Case

```typescript
// packages/analytics/src/__tests__/license-integration.test.tsx

import { cleanup, render, screen } from '@testing-library/react'
import type * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type LicenseState = 'not-installed' | 'invalid' | 'active'

function setupLicenseMock(state: LicenseState) {
  vi.resetModules()

  if (state === 'not-installed') {
    vi.doMock('@tour-kit/license', () => {
      throw new Error("Cannot find module '@tour-kit/license'")
    })
  } else {
    vi.doMock('@tour-kit/license', () => ({
      useLicense: () => ({ status: state }),
    }))
  }
}

async function importAnalyticsProvider() {
  const mod = await import('../../core/context')
  return mod.AnalyticsProvider
}

function createMinimalConfig() {
  return {
    plugins: [],
    enabled: false,
  }
}

describe('AnalyticsProvider — license integration', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  describe('when @tour-kit/license is NOT installed', () => {
    beforeEach(() => {
      setupLicenseMock('not-installed')
    })

    it('renders children without errors', async () => {
      const AnalyticsProvider = await importAnalyticsProvider()

      render(
        <AnalyticsProvider config={createMinimalConfig()}>
          <div data-testid="child">Hello</div>
        </AnalyticsProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('does not render watermark', async () => {
      const AnalyticsProvider = await importAnalyticsProvider()

      render(
        <AnalyticsProvider config={createMinimalConfig()}>
          <div>Hello</div>
        </AnalyticsProvider>
      )

      expect(screen.queryByText('UNLICENSED')).toBeNull()
    })

    it('does not fire console.warn', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const AnalyticsProvider = await importAnalyticsProvider()

      render(
        <AnalyticsProvider config={createMinimalConfig()}>
          <div>Hello</div>
        </AnalyticsProvider>
      )

      expect(warnSpy).not.toHaveBeenCalled()
    })
  })

  describe('when @tour-kit/license is installed but license is invalid', () => {
    beforeEach(() => {
      setupLicenseMock('invalid')
    })

    it('renders children (soft enforcement — never blank screen)', async () => {
      const AnalyticsProvider = await importAnalyticsProvider()

      render(
        <AnalyticsProvider config={createMinimalConfig()}>
          <div data-testid="child">Hello</div>
        </AnalyticsProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('renders UNLICENSED watermark overlay', async () => {
      const AnalyticsProvider = await importAnalyticsProvider()

      render(
        <AnalyticsProvider config={createMinimalConfig()}>
          <div>Hello</div>
        </AnalyticsProvider>
      )

      const watermark = screen.getByText('UNLICENSED')
      expect(watermark).toBeInTheDocument()
      expect(watermark).toHaveAttribute('aria-hidden', 'true')
    })

    it('fires console.warn with package name in development', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const AnalyticsProvider = await importAnalyticsProvider()

      render(
        <AnalyticsProvider config={createMinimalConfig()}>
          <div>Hello</div>
        </AnalyticsProvider>
      )

      expect(warnSpy).toHaveBeenCalledOnce()
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('@tour-kit/analytics')
      )
    })

    it('analytics functionality still works when unlicensed', async () => {
      const AnalyticsProvider = await importAnalyticsProvider()
      const { useAnalytics } = await import('../../core/context')

      function Consumer() {
        const analytics = useAnalytics()
        return <div data-testid="has-analytics">{analytics ? 'yes' : 'no'}</div>
      }

      render(
        <AnalyticsProvider config={createMinimalConfig()}>
          <Consumer />
        </AnalyticsProvider>
      )

      expect(screen.getByTestId('has-analytics')).toHaveTextContent('yes')
    })
  })

  describe('when @tour-kit/license is installed with valid license', () => {
    beforeEach(() => {
      setupLicenseMock('active')
    })

    it('renders children without watermark', async () => {
      const AnalyticsProvider = await importAnalyticsProvider()

      render(
        <AnalyticsProvider config={createMinimalConfig()}>
          <div data-testid="child">Hello</div>
        </AnalyticsProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
      expect(screen.queryByText('UNLICENSED')).toBeNull()
    })

    it('does not fire console.warn', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const AnalyticsProvider = await importAnalyticsProvider()

      render(
        <AnalyticsProvider config={createMinimalConfig()}>
          <div>Hello</div>
        </AnalyticsProvider>
      )

      expect(warnSpy).not.toHaveBeenCalled()
    })
  })
})
```

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to write this test suite:

---

You are writing the complete test suite for Phase 3 of Tour Kit — Pro Package License Integration.

### What This Project Is

Tour Kit is a headless React onboarding/product tour library (TypeScript monorepo, pnpm + Turborepo, Vitest + @testing-library/react). Phase 3 wires license checks into 7 pro packages so they show a watermark when unlicensed. Components always render — this is soft enforcement.

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | As a developer, I want pro packages to work without `@tour-kit/license` installed | 7x "no crash without license package" test | `render()` succeeds, children visible |
| US-2 | As a developer, I want a visible watermark when unlicensed | 7x "watermark visible" test | `screen.queryByText('UNLICENSED')` is not null |
| US-3 | As a developer, I want a console warning in dev mode when unlicensed | 7x "console.warn fires" test | `console.warn` called with package name string |
| US-4 | As a licensed developer, I want zero watermarks and warnings | 7x "no watermark with valid license" test | `screen.queryByText('UNLICENSED')` is null, warn not called |
| US-5 | As a maintainer, I want free packages to have zero license imports | `free-package-isolation.test.ts` — grep verification | Zero matches for `@tour-kit/license` in core/react/hints |

### Why Mocks Are Required

The `@tour-kit/license` package uses Polar.sh API for license validation — it requires network access and valid API keys. Unit tests must NEVER make real API calls. The `useLicenseCheck()` hook in each pro package uses a module-level `require('@tour-kit/license')` that must be intercepted via `vi.doMock()` before the module loads.

### What NOT to Test

- Do not test `@tour-kit/license` internals (Polar API, cache, domain validation) — Phase 1/2 covers that
- Do not test the pro package's core functionality in depth (analytics tracking, checklist progress, etc.) — existing test suites cover that
- Do not test watermark CSS properties (opacity, z-index, pointer-events) — implementation details
- Do not test `useLicenseCheck()` hook in isolation — test it through the provider/component that uses it
- Do not test all 6 media embed components — test one (YouTubeEmbed) as representative of the HOC pattern

### Critical: Mock Implementations

All unit tests use this mock helper. Copy into each test file:

```typescript
type LicenseState = 'not-installed' | 'invalid' | 'active'

function setupLicenseMock(state: LicenseState) {
  vi.resetModules()

  if (state === 'not-installed') {
    vi.doMock('@tour-kit/license', () => {
      throw new Error("Cannot find module '@tour-kit/license'")
    })
  } else {
    vi.doMock('@tour-kit/license', () => ({
      useLicense: () => ({ status: state }),
    }))
  }
}
```

After calling `setupLicenseMock()`, you MUST dynamically `import()` the component under test so the module-level `require()` in `use-license-check.ts` executes against the configured mock.

### Test Files to Create

```
packages/analytics/src/__tests__/license-integration.test.tsx       # AnalyticsProvider: 3 states
packages/announcements/src/__tests__/license-integration.test.tsx   # AnnouncementsProvider: 3 states
packages/checklists/src/__tests__/license-integration.test.tsx      # ChecklistProvider: 3 states
packages/adoption/src/__tests__/license-integration.test.tsx        # AdoptionProvider: 3 states
packages/media/src/__tests__/license-integration.test.tsx           # YouTubeEmbed via HOC: 3 states
packages/scheduling/src/__tests__/license-integration.test.tsx      # ScheduleGate + useSchedule warn: 3 states
packages/ai/src/__tests__/license-integration.test.tsx              # AiChatProvider: 3 states
packages/__tests__/free-package-isolation.test.ts                   # grep-based: core/react/hints clean
```

### Per-File Coverage Guidance

#### packages/analytics/src/__tests__/license-integration.test.tsx
- Import `AnalyticsProvider` dynamically after mock setup
- Minimal config: `{ plugins: [], enabled: false }` to avoid async init
- 3 describe blocks: not-installed, invalid, active
- Each block: children render, watermark presence/absence, console.warn presence/absence
- Invalid block: verify analytics context still provides a value (core functionality works)

#### packages/announcements/src/__tests__/license-integration.test.tsx
- Import `AnnouncementsProvider` dynamically after mock setup
- Provide minimal required props (check the provider's interface)
- Same 3-state pattern as analytics
- Verify announcements children render in all states

#### packages/checklists/src/__tests__/license-integration.test.tsx
- Import `ChecklistProvider` dynamically after mock setup
- Provide minimal required props (items array, etc.)
- Same 3-state pattern
- Verify checklist children render in all states

#### packages/adoption/src/__tests__/license-integration.test.tsx
- Import `AdoptionProvider` dynamically after mock setup
- Provide minimal required props
- Same 3-state pattern
- Verify adoption children render in all states

#### packages/media/src/__tests__/license-integration.test.tsx
- Test `YouTubeEmbed` as representative of the `withLicenseCheck()` HOC
- Import the wrapped component dynamically after mock setup
- Provide a mock video ID (e.g., `videoId="dQw4w9WgXcQ"`)
- Same 3-state pattern
- Verify the HOC `displayName` is `Licensed(YouTubeEmbed)`

#### packages/scheduling/src/__tests__/license-integration.test.tsx
- Test `ScheduleGate` component: same 3-state watermark pattern
- Test `useSchedule` hook: in invalid state, verify `console.warn` fires once with `@tour-kit/scheduling`
- Use `renderHook()` from @testing-library/react for the hook test
- Provide a minimal schedule object for useSchedule

#### packages/ai/src/__tests__/license-integration.test.tsx
- Import `AiChatProvider` dynamically after mock setup
- Provide minimal required props
- Same 3-state pattern
- Verify AI chat children render in all states

#### packages/__tests__/free-package-isolation.test.ts
- Use Node.js `child_process.execSync` to run `grep -r "@tour-kit/license" packages/core/src/ packages/react/src/ packages/hints/src/`
- Assert exit code is non-zero (grep returns 1 when no matches)
- Alternatively, use `fs.readFileSync` to read all `.ts`/`.tsx` files in free packages and assert none contain the string `@tour-kit/license`
- Also check `package.json` files of free packages for no `@tour-kit/license` in any dependency field

### Success Criteria

- `pnpm test --filter=@tour-kit/analytics` exits 0 (includes license-integration test)
- `pnpm test --filter=@tour-kit/announcements` exits 0
- `pnpm test --filter=@tour-kit/checklists` exits 0
- `pnpm test --filter=@tour-kit/adoption` exits 0
- `pnpm test --filter=@tour-kit/media` exits 0
- `pnpm test --filter=@tour-kit/scheduling` exits 0
- `pnpm test --filter=@tour-kit/ai` exits 0
- Free-package isolation test passes
- All 7 pro package test files follow the same 3-state pattern
- No test file imports or requires the real `@tour-kit/license` module without mocking

### Expected File Structure at End

```
packages/analytics/src/__tests__/license-integration.test.tsx
packages/announcements/src/__tests__/license-integration.test.tsx
packages/checklists/src/__tests__/license-integration.test.tsx
packages/adoption/src/__tests__/license-integration.test.tsx
packages/media/src/__tests__/license-integration.test.tsx
packages/scheduling/src/__tests__/license-integration.test.tsx
packages/ai/src/__tests__/license-integration.test.tsx
packages/__tests__/free-package-isolation.test.ts
```

---

---

## Run Commands

```bash
# Run all pro package tests (includes license integration)
pnpm test

# Run a single package's tests
pnpm test --filter=@tour-kit/analytics

# Run only license integration tests across all packages
pnpm test -- --testPathPattern="license-integration"

# Run a specific package's license integration test
pnpm --filter @tour-kit/analytics test -- src/__tests__/license-integration.test.tsx

# Run with coverage
pnpm test --filter=@tour-kit/analytics -- --coverage

# Run the free-package isolation test
pnpm test -- --testPathPattern="free-package-isolation"
```

---

## Coverage Checklist

- [x] Phase type identified: **Integration** (7 pro packages hooking into license system)
- [x] Mock strategy stated: Mock `@tour-kit/license` module via `vi.doMock()` + `vi.resetModules()`
- [x] User stories block present with 5 stories derived from phase deliverables
- [x] Every user story traces to at least one component in the mock strategy table
- [x] Every deliverable from phase plan has at least one test file (7 providers/components + free-package check)
- [x] Every external dependency has a mock (`@tour-kit/license` mocked 3 ways)
- [x] Unit tests contain zero references to real license validation or API calls
- [x] No integration tier needed (real license validation tested in Phase 1/2)
- [x] Run commands section present

# Phase 3 — Testing: Pro Package Integration

**Scope:** 7x `lib/use-license-check.ts`, 7x provider/component integration, free package isolation
**Key Pattern:** Manipulate `globalThis['__tourkit_license__']` to simulate license package presence/absence; spy on `console.warn` for dev warnings
**Dependencies:** vitest, @testing-library/react, vi.spyOn

---

## User Stories

1. **Graceful degradation** — As a developer using a pro package without `@tour-kit/license` installed, all providers and components render their children normally with no crash and no console noise.
2. **Dev warning on missing provider** — As a developer who installed `@tour-kit/license` but forgot to wrap with `<LicenseProvider>`, I see a single `console.warn` per package in development mode telling me what to add.
3. **Production silence** — As a developer shipping to production without a license, no warnings are emitted — the dev warning is suppressed when `process.env.NODE_ENV === 'production'`.
4. **Free package isolation** — As a maintainer, free-tier packages (`core`, `react`, `hints`) never import or reference `@tour-kit/license` or `__tourkit_license__` in source or dist.
5. **No behavioral change for licensed users** — As a Pro customer with a valid license, providers and components behave identically to pre-integration behavior — children render, no extra DOM nodes, no performance regression.

---

## 1. Component Mock Strategy

Each pro package's integration test renders its own provider (e.g., `AnalyticsProvider`, `ChecklistProvider`) with the minimum required props. Package-internal dependencies are NOT mocked — they use real implementations so the test exercises the actual render path.

The only thing manipulated is the license layer:

| Scenario | globalThis Setup |
|----------|-----------------|
| No license package installed | `delete (globalThis as any).__tourkit_license__` |
| License package installed, no provider | Set `(globalThis as any).__tourkit_license__` to a valid React context, but render without a provider wrapping (context value is `undefined`) |
| Valid license | Set context and wrap with a mock provider returning `{ status: 'valid' }` |
| Invalid license | Set context and wrap with a mock provider returning `{ status: 'invalid' }` |

Each package test file creates a minimal React context for scenarios 2-4 rather than importing from `@tour-kit/license`, ensuring tests work without the license package in the dependency graph.

---

## 2. Test Tier Table

| Tier | What | Count | Files |
|------|------|-------|-------|
| Unit | `useLicenseCheck` hook in isolation (all 4 scenarios) | 1 | `use-license-check.test.ts` |
| Integration | Each pro package provider/component renders under all scenarios | 7 | `*-license-integration.test.tsx` |
| Exit Criterion | Free package grep (not a vitest test) | 1 | Shell command |

**Total vitest test files:** 9 (1 unit + 7 integration + 1 free-package-isolation exit criterion via grep)

---

## 3. Fake / Mock Implementations

No heavy dependencies need faking. The test infrastructure is minimal:

| Fake | Purpose | Implementation |
|------|---------|----------------|
| `globalThis.__tourkit_license__` | Simulate license package presence/absence | `React.createContext(undefined)` assigned to globalThis key |
| Mock license provider | Provide license status via context | Thin wrapper: `<ctx.Provider value={{ status: 'valid' }}>` |
| `console.warn` spy | Assert dev warnings are emitted / suppressed | `vi.spyOn(console, 'warn')` |
| `process.env.NODE_ENV` | Toggle production silence | `vi.stubEnv('NODE_ENV', 'production')` |

No fetch mocks, no localStorage mocks, no router mocks needed for Phase 3 tests.

---

## 4. Test File List

| # | File Path | Type | Description |
|---|-----------|------|-------------|
| 1 | `packages/analytics/src/__tests__/license-integration.test.tsx` | Integration | AnalyticsProvider renders under all 4 license scenarios |
| 2 | `packages/announcements/src/__tests__/license-integration.test.tsx` | Integration | AnnouncementsProvider renders under all 4 license scenarios |
| 3 | `packages/checklists/src/__tests__/license-integration.test.tsx` | Integration | ChecklistProvider renders under all 4 license scenarios |
| 4 | `packages/adoption/src/__tests__/license-integration.test.tsx` | Integration | AdoptionProvider renders under all 4 license scenarios |
| 5 | `packages/media/src/__tests__/license-integration.test.tsx` | Integration | TourMedia component renders under all 4 license scenarios |
| 6 | `packages/scheduling/src/__tests__/license-integration.test.tsx` | Integration | useSchedule hook returns correct values under all 4 scenarios |
| 7 | `packages/ai/src/__tests__/license-integration.test.tsx` | Integration | AiChatProvider renders under all 4 license scenarios |
| 8 | `packages/analytics/src/__tests__/use-license-check.test.ts` | Unit | Standalone useLicenseCheck hook (all return shapes) |
| — | *Free package grep (exit criterion)* | Shell | Verify zero `@tour-kit/license` or `__tourkit_license__` references in `core`, `react`, `hints` |

> Note: The unit test for `useLicenseCheck` lives in `packages/analytics` arbitrarily — the hook is copy-pasted into each package with the same implementation. Testing it once in isolation is sufficient; the 7 integration tests verify the wiring per package.

---

## 5. Test Setup

Every test file uses the same setup/teardown pattern:

```typescript
import { createContext } from 'react'
import { afterEach, beforeEach, vi } from 'vitest'

const LICENSE_CONTEXT_KEY = '__tourkit_license__'

beforeEach(() => {
  // Clean slate: remove any leftover globalThis context
  delete (globalThis as any)[LICENSE_CONTEXT_KEY]

  // Reset the internal "warned" flag that prevents duplicate warnings.
  // Each package's useLicenseCheck uses a module-level `warned` Set.
  // Since vitest re-imports modules per test file, this resets automatically.
  // For within-file ordering, vi.resetModules() is called if needed.

  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  delete (globalThis as any)[LICENSE_CONTEXT_KEY]
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})
```

**Helper to simulate "license package installed but no provider":**

```typescript
function simulateLicensePackageInstalled() {
  const ctx = createContext<{ status: string } | undefined>(undefined)
  ;(globalThis as any)[LICENSE_CONTEXT_KEY] = ctx
  return ctx
}
```

**Helper to simulate "valid license":**

```typescript
function createLicenseWrapper(ctx: React.Context<any>, status: 'valid' | 'invalid') {
  return ({ children }: { children: React.ReactNode }) => (
    <ctx.Provider value={{ status }}>{children}</ctx.Provider>
  )
}
```

---

## 6. Key Testing Decisions

### Why test each package separately instead of a shared parameterized test?

Each package has a different integration point (provider vs component vs hook). The rendering setup differs — `AnalyticsProvider` needs analytics config props, `TourMedia` needs a `src` prop, `useSchedule` needs schedule config. A parameterized test would require so many conditional branches it would be harder to maintain than 7 focused files.

### Why manipulate globalThis instead of mocking imports?

The `useLicenseCheck` pattern uses runtime `globalThis` sniffing specifically to avoid hard import dependencies. Mocking the import (`vi.mock('@tour-kit/license')`) would test a code path that doesn't exist. The real code never imports `@tour-kit/license` — it reads from `globalThis`. Tests must exercise the actual mechanism.

### Why is the free package check a grep, not a vitest test?

The assertion is "these packages contain zero references to licensing code." This is a static property of the source and dist files, not a runtime behavior. A grep is the correct tool — it catches accidental imports that vitest would never exercise. It also runs in CI without needing a test environment.

### Why spy on console.warn instead of a custom logger?

The `useLicenseCheck` pattern calls `console.warn` directly (via a `warnUnlicensed()` helper). This is intentional — no custom logging infrastructure means zero extra bytes. The spy verifies the exact behavior users will see.

---

## 7. Example Test Case

Full integration test for `@tour-kit/analytics`:

```typescript
// packages/analytics/src/__tests__/license-integration.test.tsx
import { createContext } from 'react'
import { render, screen } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AnalyticsProvider } from '../core/context'

const LICENSE_CONTEXT_KEY = '__tourkit_license__'

function simulateLicensePackageInstalled() {
  const ctx = createContext<{ status: string } | undefined>(undefined)
  ;(globalThis as any)[LICENSE_CONTEXT_KEY] = ctx
  return ctx
}

function createLicenseWrapper(
  ctx: React.Context<{ status: string } | undefined>,
  status: 'valid' | 'invalid'
) {
  return ({ children }: { children: React.ReactNode }) => (
    <ctx.Provider value={{ status }}>{children}</ctx.Provider>
  )
}

beforeEach(() => {
  delete (globalThis as any)[LICENSE_CONTEXT_KEY]
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  delete (globalThis as any)[LICENSE_CONTEXT_KEY]
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('AnalyticsProvider — license integration', () => {
  const minimalProps = {
    plugins: [],
    children: <div data-testid="child">Analytics content</div>,
  }

  describe('when @tour-kit/license is NOT installed (globalThis key absent)', () => {
    it('renders children normally', () => {
      render(<AnalyticsProvider {...minimalProps} />)
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('does not emit any console.warn', () => {
      render(<AnalyticsProvider {...minimalProps} />)
      expect(console.warn).not.toHaveBeenCalled()
    })
  })

  describe('when @tour-kit/license is installed but no LicenseProvider wraps the tree', () => {
    it('renders children (graceful passthrough)', () => {
      simulateLicensePackageInstalled()
      render(<AnalyticsProvider {...minimalProps} />)
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('emits a dev warning', () => {
      simulateLicensePackageInstalled()
      render(<AnalyticsProvider {...minimalProps} />)
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('analytics')
      )
    })

    it('suppresses warning in production', () => {
      vi.stubEnv('NODE_ENV', 'production')
      simulateLicensePackageInstalled()
      render(<AnalyticsProvider {...minimalProps} />)
      expect(console.warn).not.toHaveBeenCalled()
    })
  })

  describe('when license is valid', () => {
    it('renders children normally', () => {
      const ctx = simulateLicensePackageInstalled()
      const LicenseWrapper = createLicenseWrapper(ctx, 'valid')
      render(
        <LicenseWrapper>
          <AnalyticsProvider {...minimalProps} />
        </LicenseWrapper>
      )
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('does not emit any console.warn', () => {
      const ctx = simulateLicensePackageInstalled()
      const LicenseWrapper = createLicenseWrapper(ctx, 'valid')
      render(
        <LicenseWrapper>
          <AnalyticsProvider {...minimalProps} />
        </LicenseWrapper>
      )
      expect(console.warn).not.toHaveBeenCalled()
    })
  })

  describe('when license is invalid', () => {
    it('renders children (graceful degradation, not hard block)', () => {
      const ctx = simulateLicensePackageInstalled()
      const LicenseWrapper = createLicenseWrapper(ctx, 'invalid')
      render(
        <LicenseWrapper>
          <AnalyticsProvider {...minimalProps} />
        </LicenseWrapper>
      )
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('emits a dev warning about invalid license', () => {
      const ctx = simulateLicensePackageInstalled()
      const LicenseWrapper = createLicenseWrapper(ctx, 'invalid')
      render(
        <LicenseWrapper>
          <AnalyticsProvider {...minimalProps} />
        </LicenseWrapper>
      )
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('analytics')
      )
    })
  })
})
```

---

## 8. Execution Prompt

Use this prompt to generate all Phase 3 test files:

---

**Context:** You are writing integration tests for the Tour Kit licensing system Phase 3. Each of the 7 pro packages contains a `lib/use-license-check.ts` file with this pattern:

```typescript
const LICENSE_CONTEXT_KEY = '__tourkit_license__'

export function useLicenseCheck(packageName: string): LicenseCheckResult {
  try {
    const ctx = (globalThis as any)[LICENSE_CONTEXT_KEY]
    if (!ctx) return { valid: true, reason: 'no-license-package' }
    const license = useContext(ctx)
    if (!license) {
      warnUnlicensed(packageName)
      return { valid: false, reason: 'no-provider' }
    }
    return license.status === 'valid'
      ? { valid: true, reason: 'licensed' }
      : { valid: false, reason: 'invalid' }
  } catch {
    return { valid: true, reason: 'no-license-package' }
  }
}
```

**Per-package integration points:**

| Package | Integration Point | Minimal Props |
|---------|-------------------|---------------|
| analytics | `AnalyticsProvider` in `src/core/context.tsx` | `{ plugins: [], children }` |
| announcements | `AnnouncementsProvider` in `src/context/announcements-provider.tsx` | `{ children }` |
| checklists | `ChecklistProvider` in `src/context/checklist-provider.tsx` | `{ items: [], children }` |
| adoption | `AdoptionProvider` in `src/context/adoption-provider.tsx` | `{ features: [], children }` |
| media | `TourMedia` in `src/components/tour-media.tsx` | `{ src: 'https://example.com/video.mp4' }` |
| scheduling | `useSchedule` in `src/hooks/use-schedule.ts` | `{ schedule: { start: new Date() } }` |
| ai | `AiChatProvider` in `src/context/ai-chat-provider.tsx` | `{ apiEndpoint: '/api/chat', children }` |

**For each package, write a `license-integration.test.tsx` file that tests these 4 scenarios:**

1. **No license package** — `globalThis.__tourkit_license__` absent. Children render. No warnings.
2. **License package installed, no provider** — globalThis key set to a React context, but no provider in tree. Children render (passthrough). Dev warning emitted. Warning suppressed in production.
3. **Valid license** — Context provides `{ status: 'valid' }`. Children render. No warnings.
4. **Invalid license** — Context provides `{ status: 'invalid' }`. Children render (graceful degradation). Dev warning emitted.

**Also write one unit test** `use-license-check.test.ts` that tests the hook in isolation using `renderHook`, covering all 4 scenarios and verifying the exact `{ valid, reason }` return values.

**Test setup pattern:** See Section 5 of the test plan.

**Stack:** vitest, @testing-library/react, vi.spyOn(console, 'warn'), vi.stubEnv.

---

## 9. Run Commands

**Run all Phase 3 tests across all pro packages:**

```bash
pnpm test --filter=@tour-kit/analytics --filter=@tour-kit/announcements --filter=@tour-kit/checklists --filter=@tour-kit/adoption --filter=@tour-kit/media --filter=@tour-kit/scheduling --filter=@tour-kit/ai -- license-integration
```

**Run a single package's license integration test:**

```bash
pnpm test --filter=@tour-kit/analytics -- license-integration
```

**Run the useLicenseCheck unit test:**

```bash
pnpm test --filter=@tour-kit/analytics -- use-license-check
```

**Run all Phase 3 tests with coverage:**

```bash
pnpm test --filter=@tour-kit/analytics --filter=@tour-kit/announcements --filter=@tour-kit/checklists --filter=@tour-kit/adoption --filter=@tour-kit/media --filter=@tour-kit/scheduling --filter=@tour-kit/ai -- --coverage license-integration
```

---

## Coverage Check

### PASS criteria (all must be true):

- [ ] `useLicenseCheck.test.ts` — all 4 return shapes verified (`no-license-package`, `no-provider`, `licensed`, `invalid`)
- [ ] 7x `license-integration.test.tsx` — all 4 scenarios pass per package (28 scenario groups total)
- [ ] Dev warning emitted exactly once per package name (dedup check)
- [ ] Dev warning suppressed when `NODE_ENV=production`
- [ ] Children always render (no blank screen in any scenario)
- [ ] No test imports `@tour-kit/license` (tests use raw `globalThis` + `createContext`)

### Exit criterion (grep, not vitest):

```bash
# Source check — must return zero results
grep -r "@tour-kit/license" packages/core/src/ packages/react/src/ packages/hints/src/

# Dist check — must return zero results (run after build)
grep -r "__tourkit_license__" packages/core/dist/ packages/react/dist/ packages/hints/dist/
```

If either grep returns any match, Phase 3 **FAILS** — free packages must have zero license coupling.

### FAIL criteria (any one fails the phase):

- [ ] Any pro package crashes when `globalThis.__tourkit_license__` is absent
- [ ] Any pro package renders blank when license is invalid
- [ ] Dev warning leaks into production mode
- [ ] Free package grep returns any match
- [ ] Any test depends on importing from `@tour-kit/license`

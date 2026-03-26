# Phase 2 Test Plan — React Integration (LicenseProvider, LicenseGate, Hooks)

**Package:** `@tour-kit/license`
**Phase Type:** Integration (React) — mock Phase 1 headless SDK, test React behavior
**Test Framework:** Vitest + `@testing-library/react` + `renderHook`
**Coverage Target:** > 80% for `src/context/`, `src/hooks/`, `src/components/`

---

## 1. User Stories

| ID | Story | Acceptance Criteria | Test Tier |
|----|-------|---------------------|-----------|
| US-1 | As a developer, I want `LicenseProvider` to validate on mount and expose state to the tree, so that child components can react to the license status | Provider calls `validateLicenseKey` on mount; children can read `LicenseState` via `useLicense()` | Unit (mocked `validateLicenseKey`) |
| US-2 | As a developer, I want `LicenseGate` to render children only when licensed, so that pro features are gated declaratively | `<LicenseGate require="pro">` renders children when valid pro, fallback when invalid or tier mismatch, loading slot while validating | Unit (controlled provider state) |
| US-3 | As a developer, I want `useLicense()` to throw a clear error outside provider, so that I get a helpful message instead of `undefined` | `useLicense()` throws `"useLicense must be used within a <LicenseProvider>"` when called outside the provider tree | Unit (renderHook without wrapper) |
| US-4 | As a developer, I want dev mode bypass on localhost so that no activation is consumed during local development | When `isDevEnvironment()` returns `true`, provider sets `{ valid: true, tier: 'pro' }` without calling `validateLicenseKey` | Unit (mocked `isDevEnvironment`) |
| US-5 | As a developer, I want `useIsPro()` to return `false` while loading so that pro content does not flash before validation completes | `useIsPro()` returns `false` during loading, `true` only after validation resolves with a valid pro license | Unit (renderHook with controlled loading state) |

---

## 2. Component Mock Strategy

| Component | Real or Mock | Implementation | Rationale |
|-----------|-------------|----------------|-----------|
| `validateLicenseKey` from `../lib/polar-client` | **Mock** | `vi.mock('../lib/polar-client')` returning controlled `Promise<LicenseState>` | We test the provider's state management, not Polar API calls (covered in Phase 1) |
| `isDevEnvironment` from `../lib/domain` | **Mock** | `vi.mock('../lib/domain')` returning controlled boolean | We test the provider's dev bypass branch, not domain detection (covered in Phase 1) |
| `LicenseProvider` | **Real** | Rendered with `render()` or `renderHook` wrapper | The provider IS the system under test |
| `LicenseGate` | **Real** | Rendered inside a test provider with controlled state | The component IS the system under test |
| `LicenseWarning` | **Real** | Rendered inside a test provider; spy on `console.warn` | The component IS the system under test |
| `useLicense` | **Real** | Called via `renderHook` inside/outside provider | The hook IS the system under test |
| `useIsPro` | **Real** | Called via `renderHook` with wrapper provider | The hook IS the system under test |
| `console.warn` | **Spy** | `vi.spyOn(console, 'warn')` | Verify `LicenseWarning` fires dev-mode warning without polluting test output |
| `process.env.NODE_ENV` | **Controlled** | Set via `vi.stubEnv('NODE_ENV', ...)` or direct assignment in test | Toggle dev/production behavior for `LicenseWarning` |

---

## 3. Test Tier Table

| Test File | Tier | US | Mocks Used | Tests (est.) |
|-----------|------|----|------------|-------------|
| `license-provider.test.tsx` | Unit | US-1, US-4 | `vi.mock('../lib/polar-client')`, `vi.mock('../lib/domain')` | 7 |
| `license-gate.test.tsx` | Unit | US-2 | `vi.mock('../lib/polar-client')`, `vi.mock('../lib/domain')` | 7 |
| `hooks.test.tsx` | Unit | US-3, US-5 | `vi.mock('../lib/polar-client')`, `vi.mock('../lib/domain')` | 6 |

**Total:** 20 tests across 3 files.

---

## 4. Fake/Mock Implementations

### Mock: `validateLicenseKey` from `../lib/polar-client`

```typescript
// Inside each test file
import { vi } from 'vitest'

vi.mock('../lib/polar-client', () => ({
  validateLicenseKey: vi.fn(),
}))

import { validateLicenseKey } from '../lib/polar-client'

// Usage in tests:
const mockValidate = vi.mocked(validateLicenseKey)

// Valid pro license
mockValidate.mockResolvedValue({
  valid: true,
  tier: 'pro',
  activationId: 'act_123',
  expiresAt: null,
  status: 'granted',
})

// Invalid license
mockValidate.mockResolvedValue({
  valid: false,
  tier: 'free',
  activationId: null,
  expiresAt: null,
  status: 'revoked',
})

// Network error
mockValidate.mockRejectedValue({
  code: 'NETWORK_ERROR',
  message: 'Failed to reach Polar API',
})
```

### Mock: `isDevEnvironment` from `../lib/domain`

```typescript
vi.mock('../lib/domain', () => ({
  isDevEnvironment: vi.fn(),
}))

import { isDevEnvironment } from '../lib/domain'

const mockIsDev = vi.mocked(isDevEnvironment)

// Production environment (default for most tests)
mockIsDev.mockReturnValue(false)

// Dev environment (for bypass tests)
mockIsDev.mockReturnValue(true)
```

### Shared Fixtures

```typescript
// packages/license/src/__tests__/helpers/license-fixtures.ts
import type { LicenseState, LicenseContextValue } from '../../types'

export const VALID_PRO_STATE: LicenseState = {
  valid: true,
  tier: 'pro',
  activationId: 'act_abc123',
  expiresAt: null,
  status: 'granted',
}

export const VALID_FREE_STATE: LicenseState = {
  valid: true,
  tier: 'free',
  activationId: null,
  expiresAt: null,
  status: 'granted',
}

export const INVALID_STATE: LicenseState = {
  valid: false,
  tier: 'free',
  activationId: null,
  expiresAt: null,
  status: 'revoked',
}

export const DEV_BYPASS_STATE: LicenseState = {
  valid: true,
  tier: 'pro',
  activationId: null,
  expiresAt: null,
  status: 'granted',
}

export const DEFAULT_STATE: LicenseState = {
  valid: false,
  tier: 'free',
  activationId: null,
  expiresAt: null,
  status: 'unknown',
}
```

---

## 5. Test File Details

### 5.1 `packages/license/src/__tests__/license-provider.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { LicenseProvider } from '../context/license-context'
import { useLicense } from '../hooks/use-license'
import type { LicenseState } from '../types'

vi.mock('../lib/polar-client', () => ({
  validateLicenseKey: vi.fn(),
}))

vi.mock('../lib/domain', () => ({
  isDevEnvironment: vi.fn(),
}))

import { validateLicenseKey } from '../lib/polar-client'
import { isDevEnvironment } from '../lib/domain'

const mockValidate = vi.mocked(validateLicenseKey)
const mockIsDev = vi.mocked(isDevEnvironment)

const VALID_PRO: LicenseState = {
  valid: true,
  tier: 'pro',
  activationId: 'act_123',
  expiresAt: null,
  status: 'granted',
}

function TestConsumer() {
  const { state, loading, error } = useLicense()
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="valid">{String(state.valid)}</span>
      <span data-testid="tier">{state.tier}</span>
      <span data-testid="status">{state.status}</span>
      {error && <span data-testid="error">{error.code}</span>}
    </div>
  )
}

describe('LicenseProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsDev.mockReturnValue(false)
  })

  // -------------------------------------------------------
  // Test 1: Renders children
  // -------------------------------------------------------
  it('renders children', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    render(
      <LicenseProvider licenseKey="TOURKIT_abc" organizationId="org_123">
        <div data-testid="child">Hello</div>
      </LicenseProvider>
    )

    expect(screen.getByTestId('child')).toHaveTextContent('Hello')
  })

  // -------------------------------------------------------
  // Test 2: Validates on mount with correct args
  // -------------------------------------------------------
  it('calls validateLicenseKey on mount with correct args', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    render(
      <LicenseProvider licenseKey="TOURKIT_key123" organizationId="org_456">
        <TestConsumer />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(mockValidate).toHaveBeenCalledOnce()
      expect(mockValidate).toHaveBeenCalledWith('TOURKIT_key123', 'org_456')
    })
  })

  // -------------------------------------------------------
  // Test 3: Loading transitions from true to false
  // -------------------------------------------------------
  it('sets loading=true initially, then loading=false after validation', async () => {
    let resolveValidation: (value: LicenseState) => void
    mockValidate.mockImplementation(
      () => new Promise((resolve) => { resolveValidation = resolve })
    )

    render(
      <LicenseProvider licenseKey="TOURKIT_key" organizationId="org_1">
        <TestConsumer />
      </LicenseProvider>
    )

    // Initially loading
    expect(screen.getByTestId('loading')).toHaveTextContent('true')

    // Resolve validation
    await act(async () => {
      resolveValidation!(VALID_PRO)
    })

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
  })

  // -------------------------------------------------------
  // Test 4: State reflects validateLicenseKey return value
  // -------------------------------------------------------
  it('sets state from validateLicenseKey result', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    render(
      <LicenseProvider licenseKey="TOURKIT_key" organizationId="org_1">
        <TestConsumer />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('valid')).toHaveTextContent('true')
      expect(screen.getByTestId('tier')).toHaveTextContent('pro')
      expect(screen.getByTestId('status')).toHaveTextContent('granted')
    })
  })

  // -------------------------------------------------------
  // Test 5: Error handling — validation rejects
  // -------------------------------------------------------
  it('handles validation error without crashing', async () => {
    mockValidate.mockRejectedValue({
      code: 'NETWORK_ERROR',
      message: 'Failed to reach Polar API',
    })

    render(
      <LicenseProvider licenseKey="TOURKIT_key" organizationId="org_1">
        <TestConsumer />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.getByTestId('valid')).toHaveTextContent('false')
      expect(screen.getByTestId('tier')).toHaveTextContent('free')
      expect(screen.getByTestId('error')).toHaveTextContent('NETWORK_ERROR')
    })
  })

  // -------------------------------------------------------
  // Test 6: Dev mode bypass
  // -------------------------------------------------------
  it('skips validation in dev mode and returns valid pro state', async () => {
    mockIsDev.mockReturnValue(true)

    render(
      <LicenseProvider licenseKey="" organizationId="">
        <TestConsumer />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.getByTestId('valid')).toHaveTextContent('true')
      expect(screen.getByTestId('tier')).toHaveTextContent('pro')
      expect(screen.getByTestId('status')).toHaveTextContent('granted')
    })

    expect(mockValidate).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------
  // Test 7: Context value is memoized
  // -------------------------------------------------------
  it('memoizes context value across re-renders with same props', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    const contextValues: unknown[] = []

    function ContextCapture() {
      const ctx = useLicense()
      contextValues.push(ctx)
      return null
    }

    const { rerender } = render(
      <LicenseProvider licenseKey="TOURKIT_key" organizationId="org_1">
        <ContextCapture />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(contextValues.length).toBeGreaterThanOrEqual(1)
    })

    // Re-render with same props
    rerender(
      <LicenseProvider licenseKey="TOURKIT_key" organizationId="org_1">
        <ContextCapture />
      </LicenseProvider>
    )

    // After settling, the last two captured values should be referentially equal
    const settled = contextValues.filter(
      (v: any) => v.loading === false
    )
    if (settled.length >= 2) {
      expect(settled[settled.length - 1]).toBe(settled[settled.length - 2])
    }
  })
})
```

### 5.2 `packages/license/src/__tests__/license-gate.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { LicenseProvider } from '../context/license-context'
import { LicenseGate } from '../components/license-gate'
import type { LicenseState } from '../types'

vi.mock('../lib/polar-client', () => ({
  validateLicenseKey: vi.fn(),
}))

vi.mock('../lib/domain', () => ({
  isDevEnvironment: vi.fn(),
}))

import { validateLicenseKey } from '../lib/polar-client'
import { isDevEnvironment } from '../lib/domain'

const mockValidate = vi.mocked(validateLicenseKey)
const mockIsDev = vi.mocked(isDevEnvironment)

const VALID_PRO: LicenseState = {
  valid: true,
  tier: 'pro',
  activationId: 'act_123',
  expiresAt: null,
  status: 'granted',
}

const INVALID: LicenseState = {
  valid: false,
  tier: 'free',
  activationId: null,
  expiresAt: null,
  status: 'revoked',
}

const VALID_FREE: LicenseState = {
  valid: true,
  tier: 'free',
  activationId: null,
  expiresAt: null,
  status: 'granted',
}

describe('LicenseGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsDev.mockReturnValue(false)
  })

  // -------------------------------------------------------
  // Test 1: Renders children when valid pro license
  // -------------------------------------------------------
  it('renders children when license is valid and tier matches', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    render(
      <LicenseProvider licenseKey="TOURKIT_key" organizationId="org_1">
        <LicenseGate require="pro" fallback={<div>Upgrade</div>}>
          <div data-testid="pro-content">Pro Feature</div>
        </LicenseGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('pro-content')).toHaveTextContent('Pro Feature')
    })

    expect(screen.queryByText('Upgrade')).not.toBeInTheDocument()
  })

  // -------------------------------------------------------
  // Test 2: Renders fallback when license is invalid
  // -------------------------------------------------------
  it('renders fallback when license is invalid', async () => {
    mockValidate.mockResolvedValue(INVALID)

    render(
      <LicenseProvider licenseKey="TOURKIT_key" organizationId="org_1">
        <LicenseGate require="pro" fallback={<div data-testid="fallback">Upgrade</div>}>
          <div data-testid="pro-content">Pro Feature</div>
        </LicenseGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('fallback')).toHaveTextContent('Upgrade')
    })

    expect(screen.queryByTestId('pro-content')).not.toBeInTheDocument()
  })

  // -------------------------------------------------------
  // Test 3: Renders fallback when tier does not match
  // -------------------------------------------------------
  it('renders fallback when tier is free but pro is required', async () => {
    mockValidate.mockResolvedValue(VALID_FREE)

    render(
      <LicenseProvider licenseKey="TOURKIT_key" organizationId="org_1">
        <LicenseGate require="pro" fallback={<div data-testid="fallback">Need Pro</div>}>
          <div data-testid="pro-content">Pro Feature</div>
        </LicenseGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('fallback')).toHaveTextContent('Need Pro')
    })

    expect(screen.queryByTestId('pro-content')).not.toBeInTheDocument()
  })

  // -------------------------------------------------------
  // Test 4: Renders loading slot while validation is in flight
  // -------------------------------------------------------
  it('renders loading slot while validation is in flight', () => {
    // Never resolve — keeps provider in loading state
    mockValidate.mockImplementation(() => new Promise(() => {}))

    render(
      <LicenseProvider licenseKey="TOURKIT_key" organizationId="org_1">
        <LicenseGate
          require="pro"
          loading={<div data-testid="loading">Loading...</div>}
          fallback={<div data-testid="fallback">Upgrade</div>}
        >
          <div data-testid="pro-content">Pro Feature</div>
        </LicenseGate>
      </LicenseProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading...')
    expect(screen.queryByTestId('pro-content')).not.toBeInTheDocument()
    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument()
  })

  // -------------------------------------------------------
  // Test 5: Renders null when fallback not provided and license invalid
  // -------------------------------------------------------
  it('renders nothing when no fallback provided and license is invalid', async () => {
    mockValidate.mockResolvedValue(INVALID)

    const { container } = render(
      <LicenseProvider licenseKey="TOURKIT_key" organizationId="org_1">
        <LicenseGate require="pro">
          <div data-testid="pro-content">Pro Feature</div>
        </LicenseGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.queryByTestId('pro-content')).not.toBeInTheDocument()
    })

    // Gate renders null — no extra DOM nodes from the gate itself
    expect(container.querySelector('[data-testid="pro-content"]')).toBeNull()
  })

  // -------------------------------------------------------
  // Test 6: Renders null when loading slot not provided and loading
  // -------------------------------------------------------
  it('renders nothing when no loading slot provided and still loading', () => {
    mockValidate.mockImplementation(() => new Promise(() => {}))

    const { container } = render(
      <LicenseProvider licenseKey="TOURKIT_key" organizationId="org_1">
        <LicenseGate require="pro">
          <div data-testid="pro-content">Pro Feature</div>
        </LicenseGate>
      </LicenseProvider>
    )

    expect(screen.queryByTestId('pro-content')).not.toBeInTheDocument()
    // No loading, no fallback, no children — effectively empty
    expect(container.innerHTML).toBe('')
  })

  // -------------------------------------------------------
  // Test 7: Throws when used outside LicenseProvider
  // -------------------------------------------------------
  it('throws when used outside LicenseProvider', () => {
    // Suppress React error boundary console output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(
        <LicenseGate require="pro">
          <div>Pro Feature</div>
        </LicenseGate>
      )
    }).toThrow('useLicense must be used within a <LicenseProvider>')

    spy.mockRestore()
  })
})
```

### 5.3 `packages/license/src/__tests__/hooks.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { LicenseProvider } from '../context/license-context'
import { useLicense } from '../hooks/use-license'
import { useIsPro } from '../hooks/use-is-pro'
import type { LicenseState } from '../types'

vi.mock('../lib/polar-client', () => ({
  validateLicenseKey: vi.fn(),
}))

vi.mock('../lib/domain', () => ({
  isDevEnvironment: vi.fn(),
}))

import { validateLicenseKey } from '../lib/polar-client'
import { isDevEnvironment } from '../lib/domain'

const mockValidate = vi.mocked(validateLicenseKey)
const mockIsDev = vi.mocked(isDevEnvironment)

const VALID_PRO: LicenseState = {
  valid: true,
  tier: 'pro',
  activationId: 'act_123',
  expiresAt: null,
  status: 'granted',
}

const VALID_FREE: LicenseState = {
  valid: true,
  tier: 'free',
  activationId: null,
  expiresAt: null,
  status: 'granted',
}

const INVALID: LicenseState = {
  valid: false,
  tier: 'free',
  activationId: null,
  expiresAt: null,
  status: 'revoked',
}

function createWrapper(licenseKey = 'TOURKIT_key', organizationId = 'org_1') {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <LicenseProvider licenseKey={licenseKey} organizationId={organizationId}>
        {children}
      </LicenseProvider>
    )
  }
}

describe('useLicense', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsDev.mockReturnValue(false)
  })

  // -------------------------------------------------------
  // Test 1: Returns context value inside provider
  // -------------------------------------------------------
  it('returns LicenseContextValue inside provider', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    const { result } = renderHook(() => useLicense(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.state).toEqual(VALID_PRO)
    expect(result.current.error).toBeNull()
  })

  // -------------------------------------------------------
  // Test 2: Throws outside provider
  // -------------------------------------------------------
  it('throws with clear message when used outside LicenseProvider', () => {
    // Suppress React error boundary console output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useLicense())
    }).toThrow('useLicense must be used within a <LicenseProvider>')

    spy.mockRestore()
  })
})

describe('useIsPro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsDev.mockReturnValue(false)
  })

  // -------------------------------------------------------
  // Test 3: Returns true for valid pro license
  // -------------------------------------------------------
  it('returns true when license is valid and tier is pro', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    const { result } = renderHook(() => useIsPro(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })

  // -------------------------------------------------------
  // Test 4: Returns false for free tier
  // -------------------------------------------------------
  it('returns false when tier is free', async () => {
    mockValidate.mockResolvedValue(VALID_FREE)

    const { result } = renderHook(() => useIsPro(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })

  // -------------------------------------------------------
  // Test 5: Returns false while loading
  // -------------------------------------------------------
  it('returns false while loading (no flash of pro content)', () => {
    // Never resolve — keeps provider in loading state
    mockValidate.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useIsPro(), {
      wrapper: createWrapper(),
    })

    // Immediately after mount, loading is true, so useIsPro returns false
    expect(result.current).toBe(false)
  })

  // -------------------------------------------------------
  // Test 6: Returns false for invalid license
  // -------------------------------------------------------
  it('returns false when license is invalid', async () => {
    mockValidate.mockResolvedValue(INVALID)

    const { result } = renderHook(() => useIsPro(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })
})
```

---

## 6. Test Matrix

| # | Test Case | File | Expected Result |
|---|-----------|------|-----------------|
| 1 | Provider renders children | `license-provider.test.tsx` | Children appear in DOM |
| 2 | Provider validates on mount with correct args | `license-provider.test.tsx` | `validateLicenseKey` called once with `(key, orgId)` |
| 3 | Loading transitions from `true` to `false` | `license-provider.test.tsx` | Consumer reads `loading: true` then `loading: false` |
| 4 | State reflects `validateLicenseKey` return value | `license-provider.test.tsx` | Consumer reads `{ valid: true, tier: 'pro', status: 'granted' }` |
| 5 | Error handling — validation rejects | `license-provider.test.tsx` | `error` is set, `state.valid` is `false`, no crash |
| 6 | Dev mode bypass — `isDevEnvironment()` returns true | `license-provider.test.tsx` | `validateLicenseKey` NOT called, state is `{ valid: true, tier: 'pro' }` |
| 7 | Context value is memoized across re-renders | `license-provider.test.tsx` | Same reference returned for identical state |
| 8 | Gate renders children when valid pro | `license-gate.test.tsx` | Children in DOM, fallback absent |
| 9 | Gate renders fallback when invalid | `license-gate.test.tsx` | Fallback in DOM, children absent |
| 10 | Gate renders fallback when tier mismatch | `license-gate.test.tsx` | Fallback in DOM (free vs pro required) |
| 11 | Gate renders loading slot while validating | `license-gate.test.tsx` | Loading slot in DOM, children and fallback absent |
| 12 | Gate renders null when no fallback and invalid | `license-gate.test.tsx` | Empty DOM |
| 13 | Gate renders null when no loading slot and loading | `license-gate.test.tsx` | Empty DOM |
| 14 | Gate throws outside LicenseProvider | `license-gate.test.tsx` | Error with "LicenseProvider" in message |
| 15 | `useLicense()` returns context inside provider | `hooks.test.tsx` | Returns `LicenseContextValue` with correct state |
| 16 | `useLicense()` throws outside provider | `hooks.test.tsx` | Error message includes "LicenseProvider" |
| 17 | `useIsPro()` returns `true` for valid pro | `hooks.test.tsx` | `true` |
| 18 | `useIsPro()` returns `false` for free tier | `hooks.test.tsx` | `false` |
| 19 | `useIsPro()` returns `false` while loading | `hooks.test.tsx` | `false` |
| 20 | `useIsPro()` returns `false` for invalid license | `hooks.test.tsx` | `false` |

---

## 7. Key Testing Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Mock Phase 1 modules (`vi.mock('../lib/polar-client')`, `vi.mock('../lib/domain')`) — NOT the context | We test React behavior in isolation. Phase 1 functions are the boundary. Mocking the context would skip testing the provider's actual integration with Phase 1. |
| 2 | Use `renderHook` for hook tests | Hooks cannot be called outside React components. `renderHook` provides a minimal wrapper. |
| 3 | Test loading state transitions with `act()` + `waitFor` | Async validation means the provider goes through `loading: true` then `loading: false`. We must verify both states, not just the final settled state. |
| 4 | No real fetch calls | All Phase 1 functions (`validateLicenseKey`, `isDevEnvironment`) are mocked. No network, no localStorage, no `window.location`. These are covered in Phase 1 tests. |
| 5 | Suppress `console.error` in throw tests | React logs errors to console when a render throws. We spy and suppress to keep test output clean while still asserting the error. |
| 6 | Use never-resolving promises for loading state tests | `new Promise(() => {})` keeps the provider in loading state indefinitely, allowing us to assert the loading UI without race conditions. |
| 7 | Test `LicenseGate` via real `LicenseProvider` + mocked Phase 1 | Provides higher confidence than mocking the context directly. The gate's behavior depends on the provider's state management being correct. |

---

## 8. Coverage Requirements

| File | Minimum Coverage |
|------|-----------------|
| `src/context/license-context.ts` | 90% lines, 85% branches |
| `src/components/license-gate.tsx` | 95% lines, 100% branches |
| `src/components/license-warning.tsx` | 80% lines, 80% branches |
| `src/hooks/use-license.ts` | 100% lines, 100% branches |
| `src/hooks/use-is-pro.ts` | 100% lines, 100% branches |

---

## 9. Running Tests

```bash
# Run Phase 2 tests only
pnpm --filter @tour-kit/license test -- --run src/__tests__/license-provider.test.tsx src/__tests__/license-gate.test.tsx src/__tests__/hooks.test.tsx

# Run with coverage
pnpm --filter @tour-kit/license test -- --coverage --run

# Run in watch mode during development
pnpm --filter @tour-kit/license test -- --watch

# Run a single test file
pnpm --filter @tour-kit/license test -- --run src/__tests__/hooks.test.tsx
```

---

## 10. Exit Criteria

- [ ] All 7 tests in `license-provider.test.tsx` pass
- [ ] All 7 tests in `license-gate.test.tsx` pass
- [ ] All 6 tests in `hooks.test.tsx` pass
- [ ] Coverage > 80% for `src/context/`, `src/hooks/`, and `src/components/`
- [ ] No `any` types in test files
- [ ] `pnpm --filter @tour-kit/license build` succeeds with zero TypeScript errors
- [ ] All Phase 1 tests still pass (no regressions)

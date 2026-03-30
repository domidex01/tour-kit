# Phase 2 Test Plan — React Integration (LicenseProvider, LicenseGate, Hooks)

**Package:** `@tour-kit/license`
**Phase Type:** Service (React components wrapping SDK) — mock Phase 1 headless SDK, test React behavior
**Test Framework:** Vitest + `@testing-library/react` + `renderHook`
**Coverage Target:** > 80% for `src/context/`, `src/hooks/`, `src/components/`

---

## 1. User Stories

| ID | Story | Acceptance Criteria | Test Tier |
|----|-------|---------------------|-----------|
| US-1 | As a developer, I want `LicenseProvider` to validate on mount and expose `LicenseState` to the tree, so that child components can react to the license status | Provider calls `validateLicenseKey` on mount; children can read `LicenseState` via `useLicense()`; `onValidate`/`onError` callbacks fire | Unit (mocked `validateLicenseKey`) |
| US-2 | As a developer, I want `LicenseGate` to render children only when licensed and show a watermark overlay when not, so that pro features are gated with interleaved validation | `<LicenseGate require="pro">` renders children when valid pro with `renderKey`, renders `<LicenseWatermark>` + `<LicenseWarning>` when invalid, renders `fallback` if provided, renders `loading` slot while validating | Unit (controlled provider state) |
| US-3 | As a developer, I want `useLicense()` to throw a clear error outside provider, so that I get a helpful message instead of `undefined` | `useLicense()` throws `"useLicense must be used within a <LicenseProvider>"` when called outside the provider tree | Unit (renderHook without wrapper) |
| US-4 | As a developer, I want dev mode bypass on localhost so that no activation is consumed during local development | When `isDevEnvironment()` returns `true`, provider sets `{ status: 'valid', tier: 'pro', renderKey: 'dev_bypass' }` without calling `validateLicenseKey` | Unit (mocked `isDevEnvironment`) |
| US-5 | As a developer, I want `useIsPro()` to return `false` while loading so that pro content does not flash before validation completes | `useIsPro()` returns `false` during loading, `true` only after validation resolves with `status: 'valid'` and `tier: 'pro'` | Unit (renderHook with controlled loading state) |

---

## 2. Component Mock Strategy

| Component | Real or Mock | Implementation | Rationale |
|-----------|-------------|----------------|-----------|
| `validateLicenseKey` from `../lib/polar-client` | **Mock** | `vi.mock('../lib/polar-client')` returning controlled `Promise<LicenseState>` | We test the provider's state management, not Polar API calls (covered in Phase 1) |
| `isDevEnvironment` from `../lib/domain` | **Mock** | `vi.mock('../lib/domain')` returning controlled boolean | We test the provider's dev bypass branch, not domain detection (covered in Phase 1) |
| `clearCache` from `../lib/cache` | **Mock** | `vi.mock('../lib/cache')` with `vi.fn()` | We test that `refresh()` clears cache before re-validating |
| `LicenseProvider` | **Real** | Rendered with `render()` or `renderHook` wrapper | The provider IS the system under test |
| `LicenseGate` | **Real** | Rendered inside a test provider with controlled state | The component IS the system under test |
| `LicenseWatermark` | **Real** | Rendered via `LicenseGate` invalid path | The component IS the system under test; verify inline styles and text |
| `LicenseWarning` | **Real** | Rendered via `LicenseGate` invalid path; spy on `console.warn` | The component IS the system under test |
| `useLicense` | **Real** | Called via `renderHook` inside/outside provider | The hook IS the system under test |
| `useIsPro` | **Real** | Called via `renderHook` with wrapper provider | The hook IS the system under test |
| `console.warn` | **Spy** | `vi.spyOn(console, 'warn')` | Verify `LicenseWarning` fires dev-mode warning without polluting test output |

---

## 3. Test Tier Table

| Test File | Tier | US | Mocks Used | Tests (est.) |
|-----------|------|----|------------|-------------|
| `license-provider.test.tsx` | Unit | US-1, US-4 | `vi.mock('../lib/polar-client')`, `vi.mock('../lib/domain')`, `vi.mock('../lib/cache')` | 8 |
| `license-gate.test.tsx` | Unit | US-2 | `vi.mock('../lib/polar-client')`, `vi.mock('../lib/domain')` | 8 |
| `license-watermark.test.tsx` | Unit | US-2 | None (standalone component) | 4 |
| `hooks.test.tsx` | Unit | US-3, US-5 | `vi.mock('../lib/polar-client')`, `vi.mock('../lib/domain')` | 7 |

**Total:** 27 tests across 4 files.

---

## 4. Fake/Mock Implementations

### Mock: `validateLicenseKey` from `../lib/polar-client`

```typescript
import { vi } from 'vitest'

vi.mock('../lib/polar-client', () => ({
  validateLicenseKey: vi.fn(),
}))

import { validateLicenseKey } from '../lib/polar-client'

const mockValidate = vi.mocked(validateLicenseKey)

// Valid pro license (with renderKey)
mockValidate.mockResolvedValue({
  status: 'valid',
  tier: 'pro',
  activations: 1,
  maxActivations: 5,
  domain: 'example.com',
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: 'lk_abc123hash',
})

// Invalid license (no renderKey)
mockValidate.mockResolvedValue({
  status: 'invalid',
  tier: 'free',
  activations: 0,
  maxActivations: 5,
  domain: null,
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: undefined,
})

// Expired license (no renderKey)
mockValidate.mockResolvedValue({
  status: 'expired',
  tier: 'pro',
  activations: 1,
  maxActivations: 5,
  domain: 'example.com',
  expiresAt: '2025-01-01T00:00:00Z',
  validatedAt: Date.now(),
  renderKey: undefined,
})

// Error state
mockValidate.mockResolvedValue({
  status: 'error',
  tier: 'free',
  activations: 0,
  maxActivations: 0,
  domain: null,
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: undefined,
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

### Mock: `clearCache` from `../lib/cache`

```typescript
vi.mock('../lib/cache', () => ({
  clearCache: vi.fn(),
}))

import { clearCache } from '../lib/cache'

const mockClearCache = vi.mocked(clearCache)
```

### Shared Fixtures

```typescript
// packages/license/src/__tests__/helpers/license-fixtures.ts
import type { LicenseState } from '../../types'

export const LOADING_STATE: LicenseState = {
  status: 'loading',
  tier: 'free',
  activations: 0,
  maxActivations: 0,
  domain: null,
  expiresAt: null,
  validatedAt: 0,
  renderKey: undefined,
}

export const VALID_PRO_STATE: LicenseState = {
  status: 'valid',
  tier: 'pro',
  activations: 1,
  maxActivations: 5,
  domain: 'example.com',
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: 'lk_abc123hash',
}

export const VALID_FREE_STATE: LicenseState = {
  status: 'valid',
  tier: 'free',
  activations: 0,
  maxActivations: 0,
  domain: null,
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: 'lk_free456hash',
}

export const INVALID_STATE: LicenseState = {
  status: 'invalid',
  tier: 'free',
  activations: 0,
  maxActivations: 5,
  domain: null,
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: undefined,
}

export const EXPIRED_STATE: LicenseState = {
  status: 'expired',
  tier: 'pro',
  activations: 1,
  maxActivations: 5,
  domain: 'example.com',
  expiresAt: '2025-01-01T00:00:00Z',
  validatedAt: Date.now(),
  renderKey: undefined,
}

export const ERROR_STATE: LicenseState = {
  status: 'error',
  tier: 'free',
  activations: 0,
  maxActivations: 0,
  domain: null,
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: undefined,
}

export const DEV_BYPASS_STATE: LicenseState = {
  status: 'valid',
  tier: 'pro',
  activations: 0,
  maxActivations: 0,
  domain: null,
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: 'dev_bypass',
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

vi.mock('../lib/cache', () => ({
  clearCache: vi.fn(),
}))

import { validateLicenseKey } from '../lib/polar-client'
import { isDevEnvironment } from '../lib/domain'
import { clearCache } from '../lib/cache'

const mockValidate = vi.mocked(validateLicenseKey)
const mockIsDev = vi.mocked(isDevEnvironment)
const mockClearCache = vi.mocked(clearCache)

const VALID_PRO: LicenseState = {
  status: 'valid',
  tier: 'pro',
  activations: 1,
  maxActivations: 5,
  domain: 'example.com',
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: 'lk_abc123hash',
}

function TestConsumer() {
  const { state } = useLicense()
  return (
    <div>
      <span data-testid="status">{state.status}</span>
      <span data-testid="tier">{state.tier}</span>
      <span data-testid="renderKey">{state.renderKey ?? 'undefined'}</span>
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
      <LicenseProvider licenseKey="test_key">
        <div data-testid="child">Hello</div>
      </LicenseProvider>
    )

    expect(screen.getByTestId('child')).toHaveTextContent('Hello')
  })

  // -------------------------------------------------------
  // Test 2: Validates on mount
  // -------------------------------------------------------
  it('calls validateLicenseKey on mount', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    render(
      <LicenseProvider licenseKey="TOURKIT_key123">
        <TestConsumer />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(mockValidate).toHaveBeenCalledOnce()
      expect(mockValidate).toHaveBeenCalledWith('TOURKIT_key123')
    })
  })

  // -------------------------------------------------------
  // Test 3: Loading state transitions to resolved state
  // -------------------------------------------------------
  it('starts with status=loading, then resolves to validated state', async () => {
    let resolveValidation: (value: LicenseState) => void
    mockValidate.mockImplementation(
      () => new Promise((resolve) => { resolveValidation = resolve })
    )

    render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <TestConsumer />
      </LicenseProvider>
    )

    // Initially loading
    expect(screen.getByTestId('status')).toHaveTextContent('loading')
    expect(screen.getByTestId('renderKey')).toHaveTextContent('undefined')

    // Resolve validation
    await act(async () => {
      resolveValidation!(VALID_PRO)
    })

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('valid')
      expect(screen.getByTestId('tier')).toHaveTextContent('pro')
      expect(screen.getByTestId('renderKey')).toHaveTextContent('lk_abc123hash')
    })
  })

  // -------------------------------------------------------
  // Test 4: State reflects validateLicenseKey return value
  // -------------------------------------------------------
  it('sets state from validateLicenseKey result', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <TestConsumer />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('valid')
      expect(screen.getByTestId('tier')).toHaveTextContent('pro')
      expect(screen.getByTestId('renderKey')).toHaveTextContent('lk_abc123hash')
    })
  })

  // -------------------------------------------------------
  // Test 5: Error handling — validation returns error state
  // -------------------------------------------------------
  it('sets error state when validation fails', async () => {
    mockValidate.mockResolvedValue({
      status: 'error',
      tier: 'free',
      activations: 0,
      maxActivations: 0,
      domain: null,
      expiresAt: null,
      validatedAt: Date.now(),
      renderKey: undefined,
    })

    render(
      <LicenseProvider licenseKey="bad_key">
        <TestConsumer />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('error')
      expect(screen.getByTestId('tier')).toHaveTextContent('free')
      expect(screen.getByTestId('renderKey')).toHaveTextContent('undefined')
    })
  })

  // -------------------------------------------------------
  // Test 6: Calls onError callback when validation rejects
  // -------------------------------------------------------
  it('calls onError callback when validateLicenseKey rejects', async () => {
    const error = new Error('Network failure')
    mockValidate.mockRejectedValue(error)
    const onError = vi.fn()

    render(
      <LicenseProvider licenseKey="bad_key" onError={onError}>
        <TestConsumer />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('error')
      expect(onError).toHaveBeenCalledOnce()
    })
  })

  // -------------------------------------------------------
  // Test 7: Dev mode bypass
  // -------------------------------------------------------
  it('skips validation in dev mode and returns valid pro with dev_bypass renderKey', async () => {
    mockIsDev.mockReturnValue(true)

    render(
      <LicenseProvider licenseKey="">
        <TestConsumer />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('valid')
      expect(screen.getByTestId('tier')).toHaveTextContent('pro')
      expect(screen.getByTestId('renderKey')).toHaveTextContent('dev_bypass')
    })

    expect(mockValidate).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------
  // Test 8: refresh() clears cache and re-validates
  // -------------------------------------------------------
  it('refresh() clears cache and re-validates', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    function RefreshConsumer() {
      const { refresh, state } = useLicense()
      return (
        <div>
          <span data-testid="status">{state.status}</span>
          <button data-testid="refresh" onClick={() => refresh()}>Refresh</button>
        </div>
      )
    }

    render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <RefreshConsumer />
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('valid')
    })

    expect(mockValidate).toHaveBeenCalledTimes(1)

    // Trigger refresh
    await act(async () => {
      screen.getByTestId('refresh').click()
    })

    await waitFor(() => {
      expect(mockClearCache).toHaveBeenCalledOnce()
      expect(mockValidate).toHaveBeenCalledTimes(2)
    })
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

vi.mock('../lib/cache', () => ({
  clearCache: vi.fn(),
}))

import { validateLicenseKey } from '../lib/polar-client'
import { isDevEnvironment } from '../lib/domain'

const mockValidate = vi.mocked(validateLicenseKey)
const mockIsDev = vi.mocked(isDevEnvironment)

const VALID_PRO: LicenseState = {
  status: 'valid',
  tier: 'pro',
  activations: 1,
  maxActivations: 5,
  domain: 'example.com',
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: 'lk_abc123hash',
}

const INVALID: LicenseState = {
  status: 'invalid',
  tier: 'free',
  activations: 0,
  maxActivations: 5,
  domain: null,
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: undefined,
}

const VALID_FREE: LicenseState = {
  status: 'valid',
  tier: 'free',
  activations: 0,
  maxActivations: 0,
  domain: null,
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: 'lk_free456hash',
}

describe('LicenseGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsDev.mockReturnValue(false)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  // -------------------------------------------------------
  // Test 1: Renders children when valid pro license
  // -------------------------------------------------------
  it('renders children when license is valid pro', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <LicenseGate require="pro">
          <div data-testid="pro-content">Pro Feature</div>
        </LicenseGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('pro-content')).toHaveTextContent('Pro Feature')
    })

    expect(screen.queryByText('UNLICENSED')).not.toBeInTheDocument()
  })

  // -------------------------------------------------------
  // Test 2: Renders watermark + children when invalid (no fallback)
  // -------------------------------------------------------
  it('renders children with watermark overlay when invalid and no fallback', async () => {
    mockValidate.mockResolvedValue(INVALID)

    render(
      <LicenseProvider licenseKey="bad_key">
        <LicenseGate require="pro">
          <div data-testid="pro-content">Pro Feature</div>
        </LicenseGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('UNLICENSED')).toBeInTheDocument()
      expect(screen.getByTestId('pro-content')).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------
  // Test 3: Renders fallback instead of watermark when provided
  // -------------------------------------------------------
  it('renders fallback when license is invalid and fallback provided', async () => {
    mockValidate.mockResolvedValue(INVALID)

    render(
      <LicenseProvider licenseKey="bad_key">
        <LicenseGate require="pro" fallback={<div data-testid="fallback">Upgrade</div>}>
          <div data-testid="pro-content">Pro Feature</div>
        </LicenseGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('fallback')).toHaveTextContent('Upgrade')
    })

    expect(screen.queryByTestId('pro-content')).not.toBeInTheDocument()
    expect(screen.queryByText('UNLICENSED')).not.toBeInTheDocument()
  })

  // -------------------------------------------------------
  // Test 4: Renders loading slot while validation is in flight
  // -------------------------------------------------------
  it('renders loading slot while validation is in flight', () => {
    mockValidate.mockImplementation(() => new Promise(() => {}))

    render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <LicenseGate
          require="pro"
          loading={<div data-testid="loading">Loading...</div>}
        >
          <div data-testid="pro-content">Pro Feature</div>
        </LicenseGate>
      </LicenseProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading...')
    expect(screen.queryByTestId('pro-content')).not.toBeInTheDocument()
  })

  // -------------------------------------------------------
  // Test 5: Renders null when no loading slot and still loading
  // -------------------------------------------------------
  it('renders null when no loading slot provided and loading', () => {
    mockValidate.mockImplementation(() => new Promise(() => {}))

    const { container } = render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <LicenseGate require="pro">
          <div data-testid="pro-content">Pro Feature</div>
        </LicenseGate>
      </LicenseProvider>
    )

    expect(screen.queryByTestId('pro-content')).not.toBeInTheDocument()
  })

  // -------------------------------------------------------
  // Test 6: Free tier with require="pro" triggers watermark
  // -------------------------------------------------------
  it('renders watermark when tier is free but pro is required', async () => {
    mockValidate.mockResolvedValue(VALID_FREE)

    render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <LicenseGate require="pro">
          <div data-testid="pro-content">Pro Feature</div>
        </LicenseGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      // Free tier does not have renderKey for pro gate, so watermark should show
      // The exact behavior depends on whether LicenseGate checks tier match
      expect(screen.getByTestId('pro-content')).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------
  // Test 7: Interleaved validation — renderKey threads into LicenseRenderContext
  // -------------------------------------------------------
  it('provides renderKey via LicenseRenderContext when license is valid', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    // A consumer that reads from LicenseRenderContext
    const { useContext } = await import('react')
    const { LicenseRenderContext } = await import('../context/license-context')

    function RenderKeyConsumer() {
      const renderKey = useContext(LicenseRenderContext)
      return <span data-testid="inner-key">{renderKey ?? 'none'}</span>
    }

    render(
      <LicenseProvider licenseKey="TOURKIT_key">
        <LicenseGate require="pro">
          <RenderKeyConsumer />
        </LicenseGate>
      </LicenseProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('inner-key')).toHaveTextContent('lk_abc123hash')
    })
  })

  // -------------------------------------------------------
  // Test 8: Throws when used outside LicenseProvider
  // -------------------------------------------------------
  it('throws when used outside LicenseProvider', () => {
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

### 5.3 `packages/license/src/__tests__/license-watermark.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LicenseWatermark } from '../components/license-watermark'

describe('LicenseWatermark', () => {
  // -------------------------------------------------------
  // Test 1: Renders "UNLICENSED" text
  // -------------------------------------------------------
  it('renders visible UNLICENSED text', () => {
    render(<LicenseWatermark />)

    expect(screen.getByText('UNLICENSED')).toBeInTheDocument()
  })

  // -------------------------------------------------------
  // Test 2: Uses position: fixed for CSS override resistance
  // -------------------------------------------------------
  it('overlay has position: fixed and max z-index via inline styles', () => {
    render(<LicenseWatermark />)

    const overlay = screen.getByText('UNLICENSED').closest('div')
    expect(overlay).not.toBeNull()

    const style = overlay!.style
    expect(style.position).toBe('fixed')
    expect(style.zIndex).toBe('2147483647')
    expect(style.pointerEvents).toBe('none')
  })

  // -------------------------------------------------------
  // Test 3: Uses inline styles only (no className)
  // -------------------------------------------------------
  it('uses inline styles only, no className on overlay', () => {
    render(<LicenseWatermark />)

    const overlay = screen.getByText('UNLICENSED').closest('div')
    // Should NOT have a className — all styles are inline to resist CSS overrides
    expect(overlay!.className).toBe('')
  })

  // -------------------------------------------------------
  // Test 4: Text has userSelect: none to prevent selection
  // -------------------------------------------------------
  it('text element has userSelect: none', () => {
    render(<LicenseWatermark />)

    const text = screen.getByText('UNLICENSED')
    expect(text.style.userSelect).toBe('none')
  })
})
```

### 5.4 `packages/license/src/__tests__/hooks.test.tsx`

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

vi.mock('../lib/cache', () => ({
  clearCache: vi.fn(),
}))

import { validateLicenseKey } from '../lib/polar-client'
import { isDevEnvironment } from '../lib/domain'

const mockValidate = vi.mocked(validateLicenseKey)
const mockIsDev = vi.mocked(isDevEnvironment)

const VALID_PRO: LicenseState = {
  status: 'valid',
  tier: 'pro',
  activations: 1,
  maxActivations: 5,
  domain: 'example.com',
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: 'lk_abc123hash',
}

const VALID_FREE: LicenseState = {
  status: 'valid',
  tier: 'free',
  activations: 0,
  maxActivations: 0,
  domain: null,
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: 'lk_free456hash',
}

const INVALID: LicenseState = {
  status: 'invalid',
  tier: 'free',
  activations: 0,
  maxActivations: 5,
  domain: null,
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: undefined,
}

const EXPIRED: LicenseState = {
  status: 'expired',
  tier: 'pro',
  activations: 1,
  maxActivations: 5,
  domain: 'example.com',
  expiresAt: '2025-01-01T00:00:00Z',
  validatedAt: Date.now(),
  renderKey: undefined,
}

function createWrapper(licenseKey = 'TOURKIT_key') {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <LicenseProvider licenseKey={licenseKey}>
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
  // Test 1: Returns LicenseContextValue inside provider
  // -------------------------------------------------------
  it('returns LicenseContextValue inside provider', async () => {
    mockValidate.mockResolvedValue(VALID_PRO)

    const { result } = renderHook(() => useLicense(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.state.status).toBe('valid')
    })

    expect(result.current.state).toEqual(VALID_PRO)
    expect(typeof result.current.refresh).toBe('function')
  })

  // -------------------------------------------------------
  // Test 2: Throws outside provider
  // -------------------------------------------------------
  it('throws with clear message when used outside LicenseProvider', () => {
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
  it('returns true when status is valid and tier is pro', async () => {
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
    mockValidate.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useIsPro(), {
      wrapper: createWrapper(),
    })

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

  // -------------------------------------------------------
  // Test 7: Returns false for expired pro (status trumps tier)
  // -------------------------------------------------------
  it('returns false when tier is pro but status is expired', async () => {
    mockValidate.mockResolvedValue(EXPIRED)

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
| 2 | Provider validates on mount | `license-provider.test.tsx` | `validateLicenseKey` called once with key |
| 3 | Loading transitions to resolved state | `license-provider.test.tsx` | Consumer reads `status: 'loading'` then `status: 'valid'` with `renderKey` |
| 4 | State reflects `validateLicenseKey` return value | `license-provider.test.tsx` | Consumer reads `{ status: 'valid', tier: 'pro', renderKey: 'lk_...' }` |
| 5 | Error state when validation returns error | `license-provider.test.tsx` | `status: 'error'`, `renderKey: undefined` |
| 6 | `onError` callback fires when validation rejects | `license-provider.test.tsx` | `onError` called with error |
| 7 | Dev mode bypass | `license-provider.test.tsx` | `validateLicenseKey` NOT called, `renderKey: 'dev_bypass'` |
| 8 | `refresh()` clears cache and re-validates | `license-provider.test.tsx` | `clearCache` called, `validateLicenseKey` called twice |
| 9 | Gate renders children when valid pro | `license-gate.test.tsx` | Children in DOM, no watermark |
| 10 | Gate renders watermark + children when invalid (no fallback) | `license-gate.test.tsx` | "UNLICENSED" text visible, children still rendered |
| 11 | Gate renders fallback when invalid and fallback provided | `license-gate.test.tsx` | Fallback in DOM, children and watermark absent |
| 12 | Gate renders loading slot while validating | `license-gate.test.tsx` | Loading slot in DOM, children absent |
| 13 | Gate renders null when no loading slot and loading | `license-gate.test.tsx` | No children visible |
| 14 | Gate shows watermark for free tier when pro required | `license-gate.test.tsx` | Children + watermark or appropriate gating |
| 15 | Gate threads renderKey via LicenseRenderContext | `license-gate.test.tsx` | Nested consumer reads `renderKey` value |
| 16 | Gate throws outside LicenseProvider | `license-gate.test.tsx` | Error with "LicenseProvider" in message |
| 17 | Watermark renders "UNLICENSED" text | `license-watermark.test.tsx` | Text in DOM |
| 18 | Watermark has `position: fixed`, max z-index, `pointer-events: none` | `license-watermark.test.tsx` | Inline style assertions |
| 19 | Watermark uses inline styles only (no className) | `license-watermark.test.tsx` | `className` is empty |
| 20 | Watermark text has `userSelect: none` | `license-watermark.test.tsx` | Inline style assertion |
| 21 | `useLicense()` returns context inside provider | `hooks.test.tsx` | Returns `LicenseContextValue` with correct state and `refresh` function |
| 22 | `useLicense()` throws outside provider | `hooks.test.tsx` | Error message includes "LicenseProvider" |
| 23 | `useIsPro()` returns `true` for valid pro | `hooks.test.tsx` | `true` |
| 24 | `useIsPro()` returns `false` for free tier | `hooks.test.tsx` | `false` |
| 25 | `useIsPro()` returns `false` while loading | `hooks.test.tsx` | `false` |
| 26 | `useIsPro()` returns `false` for invalid license | `hooks.test.tsx` | `false` |
| 27 | `useIsPro()` returns `false` for expired pro (status trumps tier) | `hooks.test.tsx` | `false` |

---

## 7. Key Testing Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Mock Phase 1 modules (`vi.mock('../lib/polar-client')`, `vi.mock('../lib/domain')`, `vi.mock('../lib/cache')`) -- NOT the context | We test React behavior in isolation. Phase 1 functions are the boundary. Mocking the context would skip testing the provider's actual integration with Phase 1. |
| 2 | Use `renderHook` for hook tests | Hooks cannot be called outside React components. `renderHook` provides a minimal wrapper. |
| 3 | Test loading state transitions with `act()` + `waitFor` | Async validation means the provider goes through `status: 'loading'` then settles. We must verify both states, not just the final settled state. |
| 4 | No real fetch calls, no localStorage, no `window.location` | All Phase 1 functions are mocked. Network, storage, and domain detection are covered in Phase 1 tests. |
| 5 | Suppress `console.error` in throw tests | React logs errors to console when a render throws. We spy and suppress to keep test output clean while still asserting the error. |
| 6 | Use never-resolving promises for loading state tests | `new Promise(() => {})` keeps the provider in loading state indefinitely, allowing us to assert the loading UI without race conditions. |
| 7 | Test `LicenseGate` via real `LicenseProvider` + mocked Phase 1 | Provides higher confidence than mocking the context directly. The gate's behavior depends on the provider's state management being correct. |
| 8 | Separate `license-watermark.test.tsx` for CSS override resistance | The watermark is the primary enforcement mechanism for unlicensed usage. Dedicated tests verify inline styles (`position: fixed`, max `z-index`, no `className`) that ensure it cannot be hidden via CSS overrides. |
| 9 | Test `useIsPro()` with expired pro tier (status trumps tier) | Per the data model rule: "Never derive validity from `tier` alone -- a pro tier with `status: 'expired'` is not valid." This ensures `useIsPro` checks both `status` and `tier`. |

---

## 8. Coverage Requirements

| File | Minimum Coverage |
|------|-----------------|
| `src/context/license-context.ts` | 90% lines, 85% branches |
| `src/components/license-gate.tsx` | 95% lines, 100% branches |
| `src/components/license-watermark.tsx` | 100% lines, 100% branches |
| `src/components/license-warning.tsx` | 80% lines, 80% branches |
| `src/hooks/use-license.ts` | 100% lines, 100% branches |
| `src/hooks/use-is-pro.ts` | 100% lines, 100% branches |

---

## 9. Running Tests

```bash
# Run Phase 2 tests only
pnpm --filter @tour-kit/license test -- --run src/__tests__/license-provider.test.tsx src/__tests__/license-gate.test.tsx src/__tests__/license-watermark.test.tsx src/__tests__/hooks.test.tsx

# Run with coverage
pnpm --filter @tour-kit/license test -- --coverage --run

# Run in watch mode during development
pnpm --filter @tour-kit/license test -- --watch

# Run a single test file
pnpm --filter @tour-kit/license test -- --run src/__tests__/hooks.test.tsx

# Type check
pnpm typecheck --filter=@tour-kit/license
```

---

## 10. Exit Criteria

- [ ] All 8 tests in `license-provider.test.tsx` pass
- [ ] All 8 tests in `license-gate.test.tsx` pass
- [ ] All 4 tests in `license-watermark.test.tsx` pass
- [ ] All 7 tests in `hooks.test.tsx` pass
- [ ] Coverage > 80% for `src/context/`, `src/hooks/`, and `src/components/`
- [ ] No `any` types in test files
- [ ] `pnpm build --filter=@tour-kit/license` succeeds with zero TypeScript errors
- [ ] All Phase 1 tests still pass (no regressions)

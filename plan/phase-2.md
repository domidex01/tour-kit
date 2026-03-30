# Phase 2 — React Integration (License System)

| Field | Value |
|-------|-------|
| **Duration** | Days 7--10, ~9--12 hours |
| **Depends on** | Phase 1 (core SDK: validateLicenseKey, cache, domain, types) |
| **Blocks** | Phase 3 (Pro Package Integration), Phase 5 (npm publish + docs) |
| **Risk Level** | MEDIUM -- standard React patterns, core SDK already built |
| **Stack** | react |

---

## 1. Objective + What Success Looks Like

Build the React API layer that consumers use to integrate Tour Kit licensing into their apps. This phase produces four public APIs -- `<LicenseProvider>`, `<LicenseGate>`, `useLicense()`, and `useIsPro()` -- plus two enforcement components (`<LicenseWatermark>`, `<LicenseWarning>`).

**Success looks like:**

- A consumer wraps their app in `<LicenseProvider licenseKey={key}>` and every pro component downstream can read license state via hooks.
- `<LicenseGate require="pro">` renders children when licensed, overlays a visible "UNLICENSED" watermark when not -- removing the license check breaks rendering entirely (interleaved validation).
- On localhost, everything works without a key (dev-mode bypass returns `{ valid: true, tier: 'pro' }`).
- The entire `@tour-kit/license` package ships under 3KB gzipped.
- All React tests pass with >80% coverage.

---

## 2. Key Design Decisions

### Client Components Only -- No Server Components

Every file in `@tour-kit/license` that touches React uses the `'use client'` directive. License validation happens in the browser (reads `window.location.hostname`, writes to `localStorage`). There is no RSC path.

### Context Over Zustand

License state lives in a single React context (`LicenseContext`). Rationale:

- The license package has zero runtime dependencies beyond React -- adding Zustand would increase bundle size.
- License state is read-only after mount (validate once, cache for 24h). There is no complex derived state or frequent updates that would benefit from Zustand selectors.
- Context is the standard pattern used across all other Tour Kit providers (`TourProvider`, `AdoptionProvider`, etc.).

### Props Interface -- No Zod at the React Boundary

Provider and component props use TypeScript interfaces. Zod validation lives at the Polar API boundary (Phase 1's `schemas.ts`), not at the React props boundary. Props are compile-time checked; runtime input from Polar is runtime checked.

### Interleaved Validation Pattern

`<LicenseGate>` does not use a simple `if (valid) children else fallback` pattern. Instead, the license state provides a `renderKey` -- a value derived from the validation result that the component tree consumes during rendering. If someone strips the license check, the `renderKey` is `undefined` and the children cannot render correctly. This follows the AG Grid / MUI X pattern where the license validation is structurally required, not just a conditional wrapper.

### Dual Entry Points

`tsup.config.ts` gets a second entry point (`src/headless.ts`) so non-React consumers (Node scripts, build tools) can import types and validation functions without pulling in React.

### LicenseState Shape (from Phase 1)

```ts
interface LicenseState {
  status: 'valid' | 'invalid' | 'expired' | 'revoked' | 'loading' | 'error'
  tier: LicenseTier            // 'free' | 'pro'
  activations: number
  maxActivations: number
  domain: string | null
  expiresAt: string | null
  validatedAt: number          // Date.now() of last validation
  renderKey: string | undefined // defined only when valid -- consumed by LicenseGate
}
```

The `renderKey` is a stable string (e.g. `"lk_" + hash(licenseKey + domain)`) set only when `status === 'valid'`. It is consumed by `<LicenseGate>` to interleave validation into the render tree.

---

## 3. Tasks

### 2.1 -- LicenseContext and LicenseProvider (2h)

Create `src/context/license-context.ts`:

- Define `LicenseContext` via `React.createContext<LicenseContextValue | null>(null)`.
- `LicenseProvider` accepts `{ licenseKey, children, onValidate?, onError? }`.
- On mount: call `validateLicenseKey(key)` from Phase 1. While validating, state is `{ status: 'loading' }`.
- On success: set full `LicenseState`, call `onValidate` callback.
- On error: set `{ status: 'error' }`, call `onError` callback.
- Expose `refresh()` to re-validate on demand.
- Memoize context value to prevent unnecessary re-renders.

### 2.2 -- Dev-mode Bypass (0.5h)

Inside `LicenseProvider`, before calling `validateLicenseKey`:

- Call `isDevEnvironment()` from Phase 1.
- If `true`, skip Polar API call entirely and set state to `{ status: 'valid', tier: 'pro', renderKey: 'dev_bypass' }`.
- Log `[TourKit] Dev mode -- license validation bypassed` to console once.

### 2.3 -- useLicense() Hook (0.5h)

Create `src/hooks/use-license.ts`:

- Reads `LicenseContext`.
- If context is `null`, throw `Error('useLicense must be used within a <LicenseProvider>')`.
- Returns the full `LicenseContextValue`.

### 2.4 -- useIsPro() Hook (0.5h)

Create `src/hooks/use-is-pro.ts`:

- Calls `useLicense()` internally.
- Returns `boolean` -- `true` when `state.tier === 'pro' && state.status === 'valid'`.

### 2.5 -- LicenseGate Component (1h)

Create `src/components/license-gate.tsx`:

- Props: `{ require: 'pro', children: ReactNode, fallback?: ReactNode, loading?: ReactNode }`.
- Reads license state via `useLicense()`.
- When `status === 'loading'`: render `loading ?? null`.
- When valid: render `children`.
- When invalid: render `<LicenseWatermark>` wrapping `children` (components still function, but watermark is visible). If `fallback` is provided, render `fallback` instead.

### 2.6 -- LicenseWarning Component (0.5h)

Create `src/components/license-warning.tsx`:

- Uses `useEffect` to log a styled console warning on mount when license is invalid.
- Message: `[TourKit] This application is using Tour Kit Pro without a valid license. Purchase a license at https://tourkit.dev/pricing`.
- Only logs in development (`process.env.NODE_ENV !== 'production'`), once per mount.
- Renders `null` -- no visible DOM output.

### 2.7 -- Update src/index.ts Exports (0.5h)

Rewrite `src/index.ts` to export:

- All types from `src/types/index.ts` (updated for new Polar-based types).
- `LicenseProvider` from `src/context/license-context.ts`.
- `LicenseGate` from `src/components/license-gate.tsx`.
- `LicenseWatermark` from `src/components/license-watermark.tsx`.
- `LicenseWarning` from `src/components/license-warning.tsx`.
- `useLicense` from `src/hooks/use-license.ts`.
- `useIsPro` from `src/hooks/use-is-pro.ts`.
- Re-export headless utilities: `validateLicenseKey`, `isDevEnvironment`, `getCurrentDomain`.

### 2.8 -- Update tsup.config.ts for Dual Entry Points (0.5h)

Change `entry` from `['src/index.ts']` to `['src/index.ts', 'src/headless.ts']`.

Add a second export path in `package.json`:

```json
"./headless": {
  "import": { "types": "./dist/headless.d.ts", "default": "./dist/headless.js" },
  "require": { "types": "./dist/headless.d.cts", "default": "./dist/headless.cjs" }
}
```

Remove `jose` from `dependencies` (Phase 1 already removed it, but verify). Remove `jwt` from keywords, add `polar`, `license-key`.

### 2.9 -- Write Tests (2h)

Three test files:

**`src/__tests__/license-provider.test.tsx`:**
- Mock `validateLicenseKey` from Phase 1.
- Test: provider renders children while loading.
- Test: provider sets valid state after successful validation.
- Test: provider sets error state on failed validation.
- Test: dev-mode bypass skips validation and returns pro.
- Test: `refresh()` re-validates.

**`src/__tests__/license-gate.test.tsx`:**
- Test: renders children when licensed.
- Test: renders watermark overlay when unlicensed.
- Test: renders fallback when provided and unlicensed.
- Test: renders null during loading.
- Test: interleaved validation -- removing renderKey breaks rendering.

**`src/__tests__/hooks.test.tsx`:**
- Test: `useLicense()` throws outside provider.
- Test: `useLicense()` returns state inside provider.
- Test: `useIsPro()` returns `true` for pro tier.
- Test: `useIsPro()` returns `false` for free tier.

### 2.10 -- Verify Bundle Size (0.5h)

Run `pnpm build --filter=@tour-kit/license`, check gzipped output is under 3KB. If over budget, audit imports and tree-shaking.

### 2.11 -- LicenseWatermark Component (1.5h)

Create `src/components/license-watermark.tsx`:

- Renders a `<div>` overlay with inline styles (not a stylesheet -- resists CSS overrides):
  - `position: fixed`, `inset: 0`, `z-index: 2147483647` (max 32-bit int).
  - `pointer-events: none` -- does not block interaction with underlying content.
  - `display: flex`, `align-items: center`, `justify-content: center`.
  - Text: "UNLICENSED" in semi-transparent gray, rotated 45deg, large font.
- Uses `style` prop directly on the element (not `className`) to resist CSS overrides.
- Wraps children in a relative container so the overlay positions correctly.
- Cannot be hidden by setting `display: none` on a parent -- it uses `position: fixed`.

### 2.12 -- Interleaved Validation in LicenseGate (1h)

Refactor `<LicenseGate>` so that the license `renderKey` is structurally required for rendering:

- `LicenseGate` reads `renderKey` from context.
- It passes `renderKey` as a React `key` prop on the wrapper element around `children`.
- When `renderKey` is `undefined` (no valid license), the wrapper has `key={undefined}` -- but the real enforcement is: without `renderKey`, the gate renders the watermark path, not the children path.
- Additionally, `LicenseGate` injects `renderKey` into a nested `LicenseRenderContext` that pro package components can consume to verify they are inside a valid gate. If `renderKey` is missing from this inner context, pro components detect the bypass.
- This means simply deleting the `if (!valid)` check is not enough -- the `renderKey` threading must also be replicated.

---

## 4. Deliverables

```
packages/license/src/
  context/
    license-context.ts          # LicenseContext, LicenseProvider, LicenseRenderContext
  components/
    license-gate.tsx            # <LicenseGate require="pro">
    license-watermark.tsx       # <LicenseWatermark> overlay
    license-warning.tsx         # <LicenseWarning> console logger
  hooks/
    use-license.ts              # useLicense()
    use-is-pro.ts               # useIsPro()
  index.ts                      # Updated public API exports
  __tests__/
    license-provider.test.tsx   # Provider tests
    license-gate.test.tsx       # Gate + interleaved validation tests
    hooks.test.tsx              # Hook tests

packages/license/
  tsup.config.ts                # Dual entry points (index + headless)
  package.json                  # Updated exports map, jose removed
```

---

## 5. Exit Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| EC-1 | `<LicenseProvider>` validates key on mount and provides `LicenseState` via context | `license-provider.test.tsx` -- mock fetch returns valid, context value matches |
| EC-2 | `<LicenseGate require="pro">` renders children when licensed, watermark overlay when not | `license-gate.test.tsx` -- assert children visible / watermark visible |
| EC-3 | `<LicenseWatermark>` renders visible "UNLICENSED" overlay with inline styles, survives basic CSS overrides | `license-gate.test.tsx` -- assert overlay element present with `position: fixed` and text "UNLICENSED" |
| EC-4 | Removing license check from `<LicenseGate>` breaks component rendering (interleaved validation) | `license-gate.test.tsx` -- test that without `renderKey`, children do not render correctly |
| EC-5 | `useLicense()` throws outside provider, returns state inside | `hooks.test.tsx` -- assert throw + assert state shape |
| EC-6 | `useIsPro()` returns `true` for pro tier, `false` otherwise | `hooks.test.tsx` -- assert boolean values |
| EC-7 | Dev mode (localhost) bypasses activation and returns valid pro | `license-provider.test.tsx` -- mock `isDevEnvironment()` returning `true`, assert state |
| EC-8 | Bundle size: `@tour-kit/license` < 3KB gzipped | `pnpm build --filter=@tour-kit/license` output log |
| EC-9 | All React tests pass with >80% coverage | `pnpm test:coverage --filter=@tour-kit/license` |

---

## 6. Execution Prompt

You are implementing Phase 2 of the Tour Kit licensing system: React Integration. This phase builds the React API layer on top of the core SDK built in Phase 1.

**Package location:** `packages/license/`
**Monorepo:** pnpm + Turborepo. Build with tsup, ESM + CJS, TypeScript strict mode.
**Test framework:** Vitest + React Testing Library + jsdom (already configured).

### What Phase 1 Established

Phase 1 replaced the old JWT-based validation (using `jose`) with Polar.sh-backed license key validation. The following are available in `packages/license/src/`:

**Functions (from `src/lib/polar-client.ts`):**

```ts
validateLicenseKey(key: string, orgId?: string): Promise<LicenseState>
// Orchestrator: cache check -> Polar validate -> auto-activate if first domain -> cache write
// Returns LicenseState with status, tier, activations, renderKey, etc.

activateKey(key: string, label: string, orgId?: string): Promise<ActivationResult>
deactivateKey(key: string, activationId: string, orgId?: string): Promise<void>
```

**Functions (from `src/lib/cache.ts`):**

```ts
readCache(domain: string): LicenseState | null   // localStorage, 24h TTL, Zod integrity
writeCache(domain: string, state: LicenseState): void
clearCache(): void
```

**Functions (from `src/lib/domain.ts`):**

```ts
getCurrentDomain(): string | null             // window.location.hostname, null on server
isDevEnvironment(): boolean                   // true for localhost, 127.0.0.1, *.local
validateDomainAtRender(): void                // logs warning on hostname mismatch
```

**Types (from `src/types/index.ts`):**

```ts
type LicenseTier = 'free' | 'pro'

interface LicenseState {
  status: 'valid' | 'invalid' | 'expired' | 'revoked' | 'loading' | 'error'
  tier: LicenseTier
  activations: number
  maxActivations: number
  domain: string | null
  expiresAt: string | null
  validatedAt: number
  renderKey: string | undefined  // defined only when status === 'valid'
}

// Also exported: LicenseCache, LicenseError, PolarValidateResponse, PolarActivateResponse
```

**Schemas (from `src/lib/schemas.ts`):**

Zod schemas for Polar API responses and cache shape. Not needed in Phase 2 directly -- the core SDK handles all Zod parsing internally.

**Headless exports (`src/headless.ts`):**

```ts
export { validateLicenseKey, activateKey, deactivateKey } from './lib/polar-client'
export { readCache, writeCache, clearCache } from './lib/cache'
export { getCurrentDomain, isDevEnvironment, validateDomainAtRender } from './lib/domain'
export type { LicenseState, LicenseTier, LicenseCache, LicenseError, ... } from './types'
```

### Data Model Rules

1. **`renderKey`** is the core anti-bypass mechanism. It is a stable string (`"lk_" + hash`) set only when `status === 'valid'`. It is `undefined` when the license is invalid/expired/revoked/loading/error. `<LicenseGate>` threads this value into a `LicenseRenderContext` that pro package components consume.
2. **`LicenseState.status`** is the single source of truth. Never derive validity from `tier` alone -- a pro tier with `status: 'expired'` is not valid.
3. **Dev bypass** sets `renderKey` to the literal string `'dev_bypass'` -- this is intentionally distinct from production keys so it can be detected if needed.
4. **Context value must be memoized** with `useMemo` keyed on `state` to prevent re-renders when the parent re-renders but license state has not changed.

### Per-File Guidance

**`src/context/license-context.ts`:**

- `'use client'` directive at top.
- Two contexts: `LicenseContext` (full state + actions) and `LicenseRenderContext` (just `renderKey: string | undefined`).
- `LicenseContextValue` interface:

```ts
interface LicenseContextValue {
  state: LicenseState
  refresh: () => Promise<void>
}
```

- `LicenseProvider` component:
  - `useState<LicenseState>` initialized to `{ status: 'loading', tier: 'free', activations: 0, maxActivations: 0, domain: null, expiresAt: null, validatedAt: 0, renderKey: undefined }`.
  - `useEffect` on mount: if `isDevEnvironment()`, set dev bypass state and return. Otherwise, call `validateLicenseKey(licenseKey)` and set result.
  - `refresh` function: clears cache via `clearCache()`, re-runs validation.
  - Wraps children in both context providers: `<LicenseContext.Provider><LicenseRenderContext.Provider>`.
  - Memoize both context values with `useMemo`.
- Export: `LicenseProvider`, `LicenseContext`, `LicenseRenderContext`.

**`src/hooks/use-license.ts`:**

- `'use client'` directive.
- `useContext(LicenseContext)` -- throw if `null`.
- Return type: `LicenseContextValue`.

**`src/hooks/use-is-pro.ts`:**

- `'use client'` directive.
- Call `useLicense()`, return `state.status === 'valid' && state.tier === 'pro'`.

**`src/components/license-gate.tsx`:**

- `'use client'` directive.
- Props: `{ require: 'pro', children: ReactNode, fallback?: ReactNode, loading?: ReactNode }`.
- Read state via `useLicense()`.
- Read `renderKey` from `LicenseRenderContext`.
- Loading path: render `loading ?? null`.
- Valid path (renderKey defined): render children wrapped in `<LicenseRenderContext.Provider value={renderKey}>`.
- Invalid path (renderKey undefined): render `fallback` if provided, otherwise render `<>{children}<LicenseWatermark /><LicenseWarning /></>`.
- The `LicenseRenderContext.Provider` re-provision ensures nested gates and pro components see the validated renderKey.

**`src/components/license-watermark.tsx`:**

- `'use client'` directive.
- All styles inline via `style` prop -- zero CSS classes.
- Outer container:

```ts
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 2147483647,
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
```

- Inner text:

```ts
const textStyle: React.CSSProperties = {
  fontSize: '6rem',
  fontWeight: 900,
  color: 'rgba(0, 0, 0, 0.08)',
  transform: 'rotate(-45deg)',
  userSelect: 'none',
  whiteSpace: 'nowrap',
  fontFamily: 'system-ui, sans-serif',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
}
```

- Text content: `"UNLICENSED"`.
- No props needed -- this is an internal component.

**`src/components/license-warning.tsx`:**

- `'use client'` directive.
- `useEffect` that logs a styled console warning once.
- Only in dev: `if (process.env.NODE_ENV === 'production') return`.
- Use `console.warn` with `%c` styling for visibility:

```ts
console.warn(
  '%c[TourKit]%c This application is using Tour Kit Pro without a valid license.\nPurchase a license at https://tourkit.dev/pricing',
  'color: #e74c3c; font-weight: bold',
  'color: inherit'
)
```

- Renders `null`.

**`src/index.ts`:**

- `'use client'` directive.
- Re-export types: `LicenseState`, `LicenseTier`, `LicenseError` (and any other public types).
- Re-export components: `LicenseProvider`, `LicenseGate`, `LicenseWatermark`, `LicenseWarning`.
- Re-export hooks: `useLicense`, `useIsPro`.
- Re-export headless utilities: `validateLicenseKey`, `isDevEnvironment`, `getCurrentDomain`.
- Do NOT re-export internal functions like `readCache`, `writeCache`, `activateKey`, `deactivateKey` from the main entry -- those are headless-only.

**`tsup.config.ts`:**

- Change `entry` to `['src/index.ts', 'src/headless.ts']`.
- Keep all other options the same (format, dts, clean, external, treeshake, splitting, minify, sourcemap, target, outDir).
- The `'use client'` banner applies to both entries -- headless consumers will ignore it.

**`package.json`:**

- Add `"./headless"` export path to `"exports"`.
- Remove `jose` from `dependencies` (verify it is gone after Phase 1).
- Remove `jwt` from keywords, add `polar`, `license-key`.

### Test Strategy

Use Vitest + React Testing Library + jsdom (already configured in the package).

**Mocking:**

- Mock `validateLicenseKey` by mocking `../lib/polar-client`.
- Mock `isDevEnvironment` by mocking `../lib/domain`.
- Mock `clearCache` by mocking `../lib/cache`.
- Use `vi.fn()` for callbacks (`onValidate`, `onError`).

**Key test patterns:**

```tsx
import { renderHook, render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { LicenseProvider } from '../context/license-context'
import { useLicense } from '../hooks/use-license'
import { useIsPro } from '../hooks/use-is-pro'

// Mock Phase 1 modules
vi.mock('../lib/polar-client')
vi.mock('../lib/domain')
vi.mock('../lib/cache')

// Wrap in provider for hook tests
function wrapper({ children }: { children: React.ReactNode }) {
  return <LicenseProvider licenseKey="test_key">{children}</LicenseProvider>
}

// Test hook outside provider
it('throws outside provider', () => {
  expect(() => {
    renderHook(() => useLicense())
  }).toThrow('useLicense must be used within a <LicenseProvider>')
})

// Test gate rendering
it('renders watermark when unlicensed', async () => {
  const { validateLicenseKey } = await import('../lib/polar-client')
  vi.mocked(validateLicenseKey).mockResolvedValue({
    status: 'invalid',
    tier: 'free',
    renderKey: undefined,
    activations: 0,
    maxActivations: 5,
    domain: null,
    expiresAt: null,
    validatedAt: Date.now(),
  })

  render(
    <LicenseProvider licenseKey="bad_key">
      <LicenseGate require="pro">
        <div>Pro Content</div>
      </LicenseGate>
    </LicenseProvider>
  )

  await waitFor(() => {
    expect(screen.getByText('UNLICENSED')).toBeInTheDocument()
  })
})
```

### Build Verification

After all code is written:

```bash
# Build with dual entry points
pnpm build --filter=@tour-kit/license
# Verify output: dist/index.js, dist/index.cjs, dist/headless.js, dist/headless.cjs
# Check gzipped size of dist/index.js -- must be < 3KB

# Run tests with coverage
pnpm test:coverage --filter=@tour-kit/license
# All tests pass, >80% coverage on src/context/, src/components/, src/hooks/

# Type check
pnpm typecheck --filter=@tour-kit/license
# Zero type errors
```

---

## Readiness Check

Before starting Phase 2, verify:

- [ ] Phase 1 is complete: `src/lib/polar-client.ts`, `src/lib/cache.ts`, `src/lib/domain.ts`, `src/lib/schemas.ts`, `src/types/index.ts`, `src/headless.ts` all exist and export the functions listed above.
- [ ] `validateLicenseKey()` works: `pnpm test --filter=@tour-kit/license` passes all Phase 1 tests.
- [ ] `jose` is removed from `package.json` dependencies.
- [ ] `src/context/`, `src/components/`, `src/hooks/` directories exist (they are currently empty -- ready for Phase 2 files).
- [ ] Vitest + React Testing Library + jsdom are configured in the package.
- [ ] `react` and `react-dom` are in `peerDependencies` (confirmed: `^18.0.0 || ^19.0.0`).

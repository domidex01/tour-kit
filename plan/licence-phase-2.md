# Phase 2 — React Integration

**Duration:** Days 7–10 (~8.5 hours)
**Depends on:** Phase 1 (Core SDK complete — `validateLicenseKey()`, `LicenseState`, cache, domain utils)
**Blocks:** Phase 3, Phase 5
**Risk Level:** MEDIUM — standard React patterns but must coordinate with Phase 1 types correctly
**Stack:** react, typescript

---

## 1. Objective + What Success Looks Like

1. A `<LicenseProvider licenseKey="..." organizationId="...">` component exists that validates the license key on mount via the Phase 1 `validateLicenseKey()` orchestrator, caches the result, and exposes `LicenseState` to the tree via React context.
2. On `localhost`, `127.0.0.1`, `*.local`, and `*.test` domains, the provider skips activation entirely and returns `{ valid: true, tier: 'pro' }` — developers never consume activation slots during local development.
3. `useLicense()` returns the full `LicenseState` (including `valid`, `tier`, `loading`, `error`) when called inside a `<LicenseProvider>`. When called outside, it throws an invariant error with a clear message: `"useLicense must be used within a <LicenseProvider>"`.
4. `useIsPro()` returns a single boolean — `true` when `state.valid && state.tier === 'pro'`, `false` otherwise (including while loading).
5. `<LicenseGate require="pro">` renders its `children` when the license is valid and the tier matches, renders `fallback` (or nothing) when it does not, and renders `loading` (or nothing) while validation is in flight.
6. `<LicenseWarning>` renders nothing in the DOM but logs a styled `console.warn` in development mode when the license is missing or invalid — zero production impact.
7. `src/index.ts` re-exports all React components, hooks, and types. `src/headless.ts` (from Phase 1) re-exports only types and functions — no React dependency.
8. `tsup.config.ts` builds dual entry points: `index.ts` (React, ~2–3KB gzipped) and `headless.ts` (no React, <1KB gzipped). Total `@tour-kit/license` bundle < 3KB gzipped.
9. All React tests pass with >80% coverage of `src/context/`, `src/hooks/`, and `src/components/`.

---

## 2. Architecture / Key Design Decisions

### Context Shape

The context value is the full `LicenseState` from Phase 1, extended with a `loading` flag and an optional `error`:

```typescript
// From Phase 1 — src/types/index.ts
interface LicenseState {
  valid: boolean;
  tier: 'free' | 'pro';
  activationId: string | null;
  expiresAt: string | null;
  status: 'granted' | 'revoked' | 'disabled' | 'unknown';
}

// Phase 2 context value
interface LicenseContextValue {
  state: LicenseState;
  loading: boolean;
  error: LicenseError | null;
}
```

No Zustand, no external state library. A single `React.createContext<LicenseContextValue | null>(null)` is sufficient — the state is write-once (validated on mount, cached for 24h) with no frequent updates.

### Provider Lifecycle

```
Mount
  ├─ isDevEnvironment()? ──yes──► setState({ valid: true, tier: 'pro', ... }), skip fetch
  │
  └─ no
      ├─ readCache()? ──hit──► setState(cached), done
      │
      └─ miss
          ├─ setState({ loading: true })
          ├─ await validateLicenseKey(key, orgId)
          ├─ writeCache(result)
          └─ setState(result)
```

The provider calls `validateLicenseKey()` from Phase 1 — it does NOT re-implement validation logic. Phase 1's orchestrator handles the cache-check-then-validate-then-activate flow internally; the provider simply calls it and stores the result.

### Dev Mode Bypass

The dev bypass lives inside the provider, not in Phase 1's `validateLicenseKey()`. Rationale: `validateLicenseKey()` is a headless function that might be called in non-React contexts (Node scripts, SSR). The dev bypass is a React-developer convenience — it belongs in the React layer.

The bypass uses Phase 1's `isDevEnvironment()` from `src/lib/domain.ts`. When it returns `true`, the provider immediately sets state to `{ valid: true, tier: 'pro', status: 'granted', activationId: null, expiresAt: null }` and never calls `validateLicenseKey()`.

### LicenseGate Rendering Strategy

```tsx
<LicenseGate require="pro" fallback={<UpgradeBanner />} loading={<Spinner />}>
  <ProFeatureContent />
</LicenseGate>
```

- `require` — the minimum tier: `'pro'` (only valid value today, but typed as `LicenseTier` for future extensibility).
- `fallback` — rendered when license is invalid or tier does not match. Defaults to `null` (render nothing).
- `loading` — rendered while validation is in flight. Defaults to `null`.
- `children` — rendered when licensed.

Internally, `LicenseGate` calls `useLicense()` and applies simple conditional rendering. No portal, no overlay, no DOM injection.

### LicenseWarning Strategy

`<LicenseWarning>` is a zero-DOM component. It uses a `useEffect` that fires once on mount. In development mode (`process.env.NODE_ENV !== 'production'`), if the license is invalid, it calls `console.warn` with a styled message. In production, it is a no-op. This is for DX — it helps developers notice they forgot to configure the license key.

### Prop Types

```typescript
interface LicenseProviderProps {
  licenseKey: string;
  organizationId: string;
  children: React.ReactNode;
}

interface LicenseGateProps {
  require: LicenseTier;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
  children: React.ReactNode;
}
```

### Dual Entry Points

`tsup.config.ts` builds two entry points:

| Entry | File | Externals | Contains |
|-------|------|-----------|----------|
| `index` | `src/index.ts` | `react` | Provider, Gate, Warning, hooks, types |
| `headless` | `src/headless.ts` | — | `validateLicenseKey()`, cache utils, domain utils, types |

React is an `external` — it is not bundled. This keeps the React entry point small (provider + gate + hooks = ~150 lines of actual logic).

---

## 3. Tasks

### Task 2.1 — Implement `LicenseContext` and `LicenseProvider` (2h)

**What:** The core React integration — a context and provider that validates the license key on mount and makes the result available to the component tree.

**File:** `packages/license/src/context/license-context.ts`

**Implementation details:**

1. Create `LicenseContext` via `React.createContext<LicenseContextValue | null>(null)`.
2. `LicenseProvider` accepts `licenseKey`, `organizationId`, and `children` props.
3. Internal state: `useState<LicenseState>` initialized to `{ valid: false, tier: 'free', activationId: null, expiresAt: null, status: 'unknown' }`.
4. Internal state: `useState<boolean>(true)` for `loading` (starts `true`).
5. Internal state: `useState<LicenseError | null>(null)` for `error`.
6. `useEffect` on mount:
   - Call `validateLicenseKey(licenseKey, organizationId)` from Phase 1.
   - On success: `setState(result)`, `setLoading(false)`.
   - On error: `setError(error)`, `setLoading(false)`. State remains `{ valid: false, tier: 'free' }`.
7. Memoize the context value with `useMemo` to prevent unnecessary re-renders:
   ```typescript
   const value = useMemo(() => ({ state, loading, error }), [state, loading, error]);
   ```
8. Render `<LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>`.

**Phase 1 imports used:**
- `validateLicenseKey` from `src/lib/polar-client.ts`
- `LicenseState`, `LicenseError` from `src/types/index.ts`

**Depends on:** Phase 1 complete.

---

### Task 2.2 — Implement Dev-Mode Bypass in Provider (0.5h)

**What:** When running on localhost or a dev domain, skip the real validation and immediately return a valid pro state.

**File:** `packages/license/src/context/license-context.ts` (same file as 2.1)

**Implementation details:**

1. At the top of the `useEffect` in `LicenseProvider`, before calling `validateLicenseKey()`:
   ```typescript
   if (isDevEnvironment()) {
     setState({
       valid: true,
       tier: 'pro',
       activationId: null,
       expiresAt: null,
       status: 'granted',
     });
     setLoading(false);
     return;
   }
   ```
2. Import `isDevEnvironment` from Phase 1's `src/lib/domain.ts`.
3. The `licenseKey` prop can be an empty string in dev mode — the provider will not attempt validation.

**Edge case:** If `isDevEnvironment()` returns `true` but the developer explicitly wants to test real validation (e.g., staging on `*.local`), they cannot. This is acceptable for Phase 2. Phase 5 can add an optional `forceValidation` prop if needed.

**Depends on:** Task 2.1.

---

### Task 2.3 — Implement `useLicense()` Hook (0.5h)

**What:** A context consumer hook that returns the full `LicenseContextValue` and throws if used outside the provider.

**File:** `packages/license/src/hooks/use-license.ts`

**Implementation:**

```typescript
import { useContext } from 'react';
import { LicenseContext } from '../context/license-context';
import type { LicenseContextValue } from '../context/license-context';

export function useLicense(): LicenseContextValue {
  const context = useContext(LicenseContext);
  if (context === null) {
    throw new Error(
      'useLicense must be used within a <LicenseProvider>. ' +
      'Wrap your app (or the pro feature subtree) in <LicenseProvider licenseKey="..." organizationId="...">.'
    );
  }
  return context;
}
```

The error message includes the fix — this is a DX decision. Developers should not need to search docs to resolve this.

**Depends on:** Task 2.1.

---

### Task 2.4 — Implement `useIsPro()` Convenience Hook (0.5h)

**What:** A boolean shortcut hook for the most common check.

**File:** `packages/license/src/hooks/use-is-pro.ts`

**Implementation:**

```typescript
import { useLicense } from './use-license';

export function useIsPro(): boolean {
  const { state, loading } = useLicense();
  if (loading) return false;
  return state.valid && state.tier === 'pro';
}
```

Returns `false` while loading — this is a deliberate choice. Components gated by `useIsPro()` will not flash pro content before validation completes. If a consumer needs to distinguish "loading" from "not pro", they should use `useLicense()` directly.

**Depends on:** Task 2.3.

---

### Task 2.5 — Implement `<LicenseGate>` Component (1h)

**What:** A declarative gating component that renders children only when the license is valid for the required tier.

**File:** `packages/license/src/components/license-gate.tsx`

**Implementation:**

```typescript
import type { ReactNode } from 'react';
import { useLicense } from '../hooks/use-license';
import type { LicenseTier } from '../types';

interface LicenseGateProps {
  require: LicenseTier;
  fallback?: ReactNode;
  loading?: ReactNode;
  children: ReactNode;
}

export function LicenseGate({
  require,
  fallback = null,
  loading: loadingSlot = null,
  children,
}: LicenseGateProps) {
  const { state, loading } = useLicense();

  if (loading) return loadingSlot;

  const meetsRequirement = state.valid && meetsMinimumTier(state.tier, require);
  return meetsRequirement ? children : fallback;
}

function meetsMinimumTier(current: LicenseTier, required: LicenseTier): boolean {
  const tierOrder: Record<LicenseTier, number> = { free: 0, pro: 1 };
  return tierOrder[current] >= tierOrder[required];
}
```

The `meetsMinimumTier` function is forward-compatible — if a `'team'` or `'enterprise'` tier is added later, it is a one-line change to the `tierOrder` map.

**Fragment return:** `LicenseGate` returns `ReactNode`, not `JSX.Element`. It does not wrap children in a fragment or div — zero DOM overhead.

**Depends on:** Task 2.3.

---

### Task 2.6 — Implement `<LicenseWarning>` Component (0.5h)

**What:** A dev-mode-only component that logs a console warning when no valid license is detected.

**File:** `packages/license/src/components/license-warning.tsx`

**Implementation:**

```typescript
import { useEffect } from 'react';
import { useLicense } from '../hooks/use-license';

export function LicenseWarning() {
  const { state, loading } = useLicense();

  useEffect(() => {
    if (loading) return;
    if (state.valid) return;
    if (process.env.NODE_ENV === 'production') return;

    console.warn(
      '%c[Tour Kit] %cPro license not detected. ' +
      'Pro features are running in evaluation mode. ' +
      'Get a license at https://tourkit.dev/pricing',
      'color: #f59e0b; font-weight: bold;',
      'color: inherit;'
    );
  }, [state.valid, loading]);

  return null;
}
```

**Zero DOM:** Returns `null` always. No `<div>`, no portal, no visual output.

**Production safety:** The `process.env.NODE_ENV === 'production'` guard ensures the warning is tree-shaken in production builds (bundlers replace `process.env.NODE_ENV` at compile time and dead-code-eliminate the branch).

**Depends on:** Task 2.3.

---

### Task 2.7 — Update `src/index.ts` Main Exports (0.5h)

**What:** Wire all Phase 2 React exports into the package's main entry point.

**File:** `packages/license/src/index.ts`

**Implementation:**

```typescript
// React components
export { LicenseProvider } from './context/license-context';
export { LicenseGate } from './components/license-gate';
export { LicenseWarning } from './components/license-warning';

// React hooks
export { useLicense } from './hooks/use-license';
export { useIsPro } from './hooks/use-is-pro';

// Types (re-export from Phase 1)
export type {
  LicenseState,
  LicenseError,
  LicenseTier,
  LicenseCache,
  LicenseContextValue,
} from './types';

// Headless utilities (re-export from Phase 1 for convenience)
export { validateLicenseKey } from './lib/polar-client';
export { clearCache } from './lib/cache';
```

**Prop types:** `LicenseProviderProps` and `LicenseGateProps` are exported as types from their respective files but re-exported here for consumers who need them (e.g., wrapper components).

**Depends on:** Tasks 2.1–2.6.

---

### Task 2.8 — Update `tsup.config.ts` for Dual Entry Points (0.5h)

**What:** Configure tsup to build both the React entry point and the headless entry point.

**File:** `packages/license/tsup.config.ts`

**Implementation:**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    headless: 'src/headless.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  clean: true,
  external: ['react'],
  treeshake: true,
});
```

**Key decisions:**
- `splitting: true` — shared code between `index` and `headless` (Phase 1 utilities) is extracted into a shared chunk, not duplicated.
- `external: ['react']` — React is a peer dependency, not bundled.
- `treeshake: true` — dead code elimination within the bundle.
- `dts: true` — TypeScript declaration files for both entry points.

**`package.json` exports** (verify these exist from Phase 1, update if needed):
```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./headless": {
      "import": "./dist/headless.mjs",
      "require": "./dist/headless.js",
      "types": "./dist/headless.d.ts"
    }
  }
}
```

**Depends on:** Task 2.7, Phase 1 task 1.9.

---

### Task 2.9 — Write Tests (2h)

**What:** React testing with mocked Phase 1 dependencies. Three test files covering provider, gate, and hooks.

#### File: `packages/license/src/__tests__/license-provider.test.tsx`

**Test cases:**

| # | Test | Assertion |
|---|------|-----------|
| 1 | Provider renders children | Children appear in DOM |
| 2 | Provider validates on mount | `validateLicenseKey` called once with correct args |
| 3 | Provider sets loading=true initially, then loading=false after validation | Consumer sees loading transition |
| 4 | Provider sets state from validateLicenseKey result | Consumer reads correct `LicenseState` |
| 5 | Provider handles validation error | `error` is set, `state.valid` is `false`, no crash |
| 6 | Dev mode bypass — `isDevEnvironment()` returns true | `validateLicenseKey` NOT called, state is `{ valid: true, tier: 'pro' }` |
| 7 | Context value is memoized | Re-render with same props does not create new context object |

**Mocking strategy:**
- Mock `validateLicenseKey` from `../lib/polar-client` — return controlled `LicenseState`.
- Mock `isDevEnvironment` from `../lib/domain` — control dev/prod behavior.
- Use `@testing-library/react` for rendering and `renderHook` for hook tests.

#### File: `packages/license/src/__tests__/license-gate.test.tsx`

**Test cases:**

| # | Test | Assertion |
|---|------|-----------|
| 1 | Gate renders children when license is valid and tier matches | Children in DOM |
| 2 | Gate renders fallback when license is invalid | Fallback in DOM, children not in DOM |
| 3 | Gate renders fallback when tier does not match (free vs pro required) | Fallback in DOM |
| 4 | Gate renders loading slot while validation is in flight | Loading slot in DOM |
| 5 | Gate renders null when fallback not provided and license invalid | Nothing in DOM |
| 6 | Gate renders null when loading slot not provided and loading | Nothing in DOM |
| 7 | Gate throws when used outside LicenseProvider | Error thrown with correct message |

**Mocking strategy:** Wrap `<LicenseGate>` inside a test `<LicenseProvider>` with mocked `validateLicenseKey` returning controlled states, OR mock the context directly.

#### File: `packages/license/src/__tests__/hooks.test.tsx`

**Test cases:**

| # | Test | Assertion |
|---|------|-----------|
| 1 | `useLicense()` returns context value inside provider | Returns `LicenseContextValue` |
| 2 | `useLicense()` throws outside provider | Error message includes "LicenseProvider" |
| 3 | `useIsPro()` returns `true` for valid pro license | `true` |
| 4 | `useIsPro()` returns `false` for free tier | `false` |
| 5 | `useIsPro()` returns `false` while loading | `false` |
| 6 | `useIsPro()` returns `false` for invalid license | `false` |

**Depends on:** Tasks 2.1–2.6.

---

### Task 2.10 — Verify Bundle Size (0.5h)

**What:** Build the package and verify gzipped output is under 3KB.

**Command:** `pnpm build --filter=@tour-kit/license`

**Verification:**
1. Check `packages/license/dist/` for output files.
2. Run `gzip -c dist/index.mjs | wc -c` — must be < 3072 bytes (3KB).
3. Run `gzip -c dist/headless.mjs | wc -c` — should be < 1024 bytes (1KB).
4. Verify `dist/index.d.ts` and `dist/headless.d.ts` exist (TypeScript declarations).
5. Verify `react` is NOT in the bundle (check with `grep -l 'createElement' dist/index.mjs` — should not find React internals, only `import` references).

**If over budget:** Profile with `npx esbuild-visualizer` or inspect the bundle manually. Likely causes: Zod schemas being pulled into the React entry point (they should only be in headless), or unnecessary re-exports.

**Depends on:** Task 2.8.

---

## 4. Deliverables

```
packages/license/src/
├── context/
│   └── license-context.ts          # LicenseContext + LicenseProvider (tasks 2.1, 2.2)
├── components/
│   ├── license-gate.tsx             # <LicenseGate require="pro"> (task 2.5)
│   └── license-warning.tsx          # Dev-mode console warning (task 2.6)
├── hooks/
│   ├── use-license.ts               # useLicense() hook (task 2.3)
│   └── use-is-pro.ts               # useIsPro() hook (task 2.4)
├── index.ts                         # Updated public API (task 2.7)
├── __tests__/
│   ├── license-provider.test.tsx    # Provider tests (task 2.9)
│   ├── license-gate.test.tsx        # Gate tests (task 2.9)
│   └── hooks.test.tsx               # Hook tests (task 2.9)
└── tsup.config.ts                   # Dual entry points (task 2.8)
```

**New files created in Phase 2:** 7 source files + 3 test files = 10 files total.

**Files modified from Phase 1:** `src/index.ts`, `tsup.config.ts` (both updated, not replaced).

---

## 5. Exit Criteria

| # | Criterion | Measurement |
|---|-----------|-------------|
| EC-1 | `<LicenseProvider>` validates key on mount and provides `LicenseState` via context | Test 2.9 provider tests 2–4 pass |
| EC-2 | `<LicenseGate require="pro">` renders children when licensed, fallback when not | Test 2.9 gate tests 1–3 pass |
| EC-3 | `useLicense()` throws outside provider, returns state inside | Test 2.9 hooks tests 1–2 pass |
| EC-4 | `useIsPro()` returns `true` for pro tier, `false` otherwise | Test 2.9 hooks tests 3–6 pass |
| EC-5 | Dev mode (localhost) bypasses activation and returns valid | Test 2.9 provider test 6 passes |
| EC-6 | Bundle size: `@tour-kit/license` index entry < 3KB gzipped | `gzip -c dist/index.mjs \| wc -c` < 3072 |
| EC-7 | Bundle size: headless entry < 1KB gzipped | `gzip -c dist/headless.mjs \| wc -c` < 1024 |
| EC-8 | React is not bundled (external) | `dist/index.mjs` contains `import` from `react`, not React source code |
| EC-9 | TypeScript declarations generated for both entry points | `dist/index.d.ts` and `dist/headless.d.ts` exist |
| EC-10 | All React tests pass with >80% coverage of `src/context/`, `src/hooks/`, `src/components/` | `vitest --coverage` output |

**Gate:** Phase 3 does not begin until EC-1 through EC-10 all pass.

---

## 6. Execution Prompt

> **Build Brief — React Integration for @tour-kit/license**
>
> You are building the React layer for Tour Kit's license validation system. Phase 1 is complete — the headless SDK (`validateLicenseKey()`, cache, domain detection) is working. Your job is to wrap it in React primitives: a provider, two hooks, and two components.
>
> ### What Phase 1 Established
>
> Phase 1 built the framework-agnostic core in `packages/license/src/`. The following files exist and are tested:
>
> | File | Exports | Purpose |
> |------|---------|---------|
> | `src/types/index.ts` | `LicenseState`, `LicenseTier`, `LicenseError`, `LicenseCache`, `PolarValidateResponse`, `PolarActivateResponse` | All type definitions |
> | `src/lib/polar-client.ts` | `validateLicenseKey(key: string, organizationId: string): Promise<LicenseState>` | Orchestrator: cache check → Polar validate → auto-activate if new domain → cache write |
> | `src/lib/cache.ts` | `readCache(domain: string): LicenseCache \| null`, `writeCache(domain: string, state: LicenseState): void`, `clearCache(): void` | localStorage with 24h TTL, domain-scoped keys |
> | `src/lib/domain.ts` | `getCurrentDomain(): string`, `isDevEnvironment(): boolean` | Domain detection; dev = localhost, 127.0.0.1, *.local, *.test |
> | `src/lib/schemas.ts` | Zod schemas for Polar API responses | Response validation |
> | `src/headless.ts` | Re-exports types + `validateLicenseKey` + cache utils | Headless entry point (no React) |
>
> ### Exact Types from Phase 1
>
> ```typescript
> // src/types/index.ts
>
> type LicenseTier = 'free' | 'pro';
>
> interface LicenseState {
>   valid: boolean;
>   tier: LicenseTier;
>   activationId: string | null;
>   expiresAt: string | null;
>   status: 'granted' | 'revoked' | 'disabled' | 'unknown';
> }
>
> interface LicenseError {
>   code: 'NETWORK_ERROR' | 'VALIDATION_FAILED' | 'ACTIVATION_LIMIT' | 'INVALID_RESPONSE';
>   message: string;
> }
>
> interface LicenseCache {
>   state: LicenseState;
>   timestamp: number;
>   domain: string;
> }
> ```
>
> ### Files to Create
>
> **1. `src/context/license-context.ts`** — LicenseContext + LicenseProvider
>
> - Create `LicenseContextValue`: `{ state: LicenseState; loading: boolean; error: LicenseError | null }`
> - Create context: `React.createContext<LicenseContextValue | null>(null)`
> - `LicenseProvider` props: `{ licenseKey: string; organizationId: string; children: ReactNode }`
> - On mount `useEffect`:
>   1. Check `isDevEnvironment()` — if true, set `{ valid: true, tier: 'pro', status: 'granted', activationId: null, expiresAt: null }`, set `loading: false`, return early.
>   2. Otherwise, call `await validateLicenseKey(licenseKey, organizationId)`.
>   3. On success: set state, set `loading: false`.
>   4. On error: set error, set `loading: false`, state stays `{ valid: false, tier: 'free' }`.
> - Memoize context value with `useMemo`.
> - Export `LicenseContext` (for the hook) and `LicenseProvider` (for consumers).
>
> **2. `src/hooks/use-license.ts`** — useLicense()
>
> - Call `useContext(LicenseContext)`.
> - If `null`, throw: `"useLicense must be used within a <LicenseProvider>. Wrap your app (or the pro feature subtree) in <LicenseProvider licenseKey=\"...\" organizationId=\"...\">."`.
> - Return `LicenseContextValue`.
>
> **3. `src/hooks/use-is-pro.ts`** — useIsPro()
>
> - Call `useLicense()`.
> - Return `false` if `loading` is `true`.
> - Return `state.valid && state.tier === 'pro'`.
>
> **4. `src/components/license-gate.tsx`** — LicenseGate
>
> - Props: `{ require: LicenseTier; fallback?: ReactNode; loading?: ReactNode; children: ReactNode }`
> - If `loading`, return `loading` slot (default `null`).
> - If `state.valid` and `meetsMinimumTier(state.tier, require)`, return `children`.
> - Otherwise return `fallback` (default `null`).
> - `meetsMinimumTier`: use a tier order map `{ free: 0, pro: 1 }` — return `current >= required`.
>
> **5. `src/components/license-warning.tsx`** — LicenseWarning
>
> - Returns `null` always (zero DOM).
> - `useEffect`: if `!loading && !state.valid && process.env.NODE_ENV !== 'production'`, `console.warn` with styled message.
> - Warning text: `"[Tour Kit] Pro license not detected. Pro features are running in evaluation mode. Get a license at https://tourkit.dev/pricing"`.
>
> **6. `src/index.ts`** — Update exports
>
> - Export `LicenseProvider`, `LicenseGate`, `LicenseWarning` (components).
> - Export `useLicense`, `useIsPro` (hooks).
> - Export `validateLicenseKey`, `clearCache` (headless utilities, re-exported for convenience).
> - Export types: `LicenseState`, `LicenseError`, `LicenseTier`, `LicenseCache`, `LicenseContextValue`, `LicenseProviderProps`, `LicenseGateProps`.
>
> **7. `tsup.config.ts`** — Dual entry points
>
> - Entry: `{ index: 'src/index.ts', headless: 'src/headless.ts' }`
> - Format: `['esm', 'cjs']`
> - `dts: true`, `splitting: true`, `clean: true`, `treeshake: true`
> - `external: ['react']`
>
> ### Tests to Write
>
> **`src/__tests__/license-provider.test.tsx`:**
> - Mock `validateLicenseKey` and `isDevEnvironment` from their respective modules.
> - Test: renders children.
> - Test: calls `validateLicenseKey` on mount with correct args.
> - Test: `loading` starts `true`, transitions to `false`.
> - Test: state reflects `validateLicenseKey` return value.
> - Test: error state set on rejection.
> - Test: dev mode bypass — `isDevEnvironment()` returns `true`, `validateLicenseKey` never called, state is `{ valid: true, tier: 'pro' }`.
>
> **`src/__tests__/license-gate.test.tsx`:**
> - Test: renders children when valid pro license.
> - Test: renders fallback when invalid license.
> - Test: renders fallback when tier mismatch (free vs pro required).
> - Test: renders loading slot while loading.
> - Test: renders null when no fallback provided and invalid.
> - Test: throws when used outside provider.
>
> **`src/__tests__/hooks.test.tsx`:**
> - Test: `useLicense()` returns context inside provider.
> - Test: `useLicense()` throws outside provider with message containing "LicenseProvider".
> - Test: `useIsPro()` returns `true` for valid pro.
> - Test: `useIsPro()` returns `false` for free.
> - Test: `useIsPro()` returns `false` while loading.
>
> ### Success Criteria
>
> 1. `pnpm build --filter=@tour-kit/license` succeeds with zero type errors.
> 2. `pnpm test --filter=@tour-kit/license` — all 18+ tests pass.
> 3. Coverage: >80% of `src/context/`, `src/hooks/`, `src/components/`.
> 4. `gzip -c dist/index.mjs | wc -c` < 3072 bytes.
> 5. `gzip -c dist/headless.mjs | wc -c` < 1024 bytes.
> 6. `react` is external — not bundled in output.
> 7. Both `dist/index.d.ts` and `dist/headless.d.ts` exist.
>
> Do not begin Phase 3 until all 7 criteria pass.

---

## Readiness Check

| # | Item | Status |
|---|------|--------|
| 1 | Phase 1 deliverables exist: `src/types/index.ts`, `src/lib/polar-client.ts`, `src/lib/cache.ts`, `src/lib/domain.ts`, `src/lib/schemas.ts`, `src/headless.ts` | VERIFY — check before starting |
| 2 | Phase 1 tests pass: `pnpm test --filter=@tour-kit/license` | VERIFY — run before starting |
| 3 | `validateLicenseKey()` signature matches: `(key: string, organizationId: string) => Promise<LicenseState>` | VERIFY — read `src/lib/polar-client.ts` |
| 4 | `isDevEnvironment()` signature matches: `() => boolean` | VERIFY — read `src/lib/domain.ts` |
| 5 | `LicenseState`, `LicenseTier`, `LicenseError` types match the shapes documented above | VERIFY — read `src/types/index.ts` |
| 6 | React 18+ is a peer dependency in `packages/license/package.json` | VERIFY — check `peerDependencies` |
| 7 | `@testing-library/react` is available as a dev dependency | VERIFY — check `devDependencies` |
| 8 | tsup is configured and working (Phase 1 used it for the headless build) | VERIFY — `pnpm build --filter=@tour-kit/license` runs |

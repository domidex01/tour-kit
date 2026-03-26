# Phase 3 — Pro Package Integration

**Duration:** Days 11–13 (~7.5 hours)
**Depends on:** Phase 2 (React integration complete — LicenseProvider, useLicense(), LicenseGate working)
**Blocks:** Phase 5
**Risk Level:** LOW — repetitive wiring work with well-defined pattern
**Stack:** react, typescript

---

## 1. Objective + What Success Looks Like

Wire license checks into all 7 extended packages (`analytics`, `announcements`, `checklists`, `adoption`, `media`, `scheduling`, `ai`) so they gracefully degrade without a Pro license. The critical constraint — **zero bundle impact on free-tier users** — is preserved: free packages (`core`, `react`, `hints`) never import `@tour-kit/license`.

**What success looks like:**

1. Each of the 7 pro packages lists `@tour-kit/license` as an **optional peer dependency** in its `package.json`.
2. A shared `useLicenseCheck()` pattern exists in each package that safely handles the case where `@tour-kit/license` is not installed — it returns `{ valid: true }` as a passthrough, ensuring zero bundle impact for free-tier users who happen to install a pro package without a license.
3. Each package's provider (or top-level component, for packages without providers) calls `useLicenseCheck()` on mount. Without a valid license, it renders children normally (passthrough) but logs a `console.warn` in development mode. No crash, no blank screen, no hard block.
4. With a valid license, components render identically to today — zero behavioral change.
5. Free packages (`core`, `react`, `hints`) have **zero** imports from `@tour-kit/license` — confirmed by grep and bundle analysis.
6. 7 integration tests prove each pro package renders without crashing when no license key is provided.

---

## 2. Architecture / Key Design Decisions

### 2.1 Optional Peer Dependency Strategy

`@tour-kit/license` is added as an **optional peer dependency** (not a hard dependency) to each pro package. This means:

- If a user installs `@tour-kit/analytics` without `@tour-kit/license`, the package still works — no missing module errors.
- The license package is never bundled into pro packages. It exists only in the consumer's dependency tree when explicitly installed.
- Package managers (`pnpm`, `npm`, `bun`) will not auto-install optional peer deps — the user must explicitly add `@tour-kit/license`.

```json
{
  "peerDependencies": {
    "@tour-kit/license": ">=0.1.0"
  },
  "peerDependenciesMeta": {
    "@tour-kit/license": {
      "optional": true
    }
  }
}
```

### 2.2 The `useLicenseCheck()` Pattern

Each pro package gets a `lib/use-license-check.ts` file containing a hook that attempts to read the license context. The design handles three scenarios:

| Scenario | `@tour-kit/license` installed? | `LicenseProvider` in tree? | Result |
|----------|-------------------------------|---------------------------|--------|
| Free-tier user | No | No | `{ valid: true, reason: 'no-license-package' }` — silent passthrough |
| Pro user without provider | Yes | No | `{ valid: false, reason: 'no-provider' }` — dev warning |
| Pro user with valid license | Yes | Yes | `{ valid: true, reason: 'licensed' }` — normal operation |
| Pro user with invalid/expired license | Yes | Yes | `{ valid: false, reason: 'invalid' }` — dev warning, passthrough |

**Implementation approach — context sniffing (not dynamic import):**

The hook does NOT use `import()` or `require()` — those would force bundlers to attempt resolution even for optional deps. Instead, it uses a **React context check pattern**:

```typescript
// lib/use-license-check.ts (in each pro package)
import { createContext, useContext } from 'react'

// This symbol must match the one used by @tour-kit/license's LicenseContext.
// We read it from a well-known global or use a shared context key pattern.
const LICENSE_CONTEXT_KEY = '__tourkit_license__'

interface LicenseCheckResult {
  valid: boolean
  reason: 'licensed' | 'no-license-package' | 'no-provider' | 'invalid'
}

export function useLicenseCheck(): LicenseCheckResult {
  // Attempt to read the license context that LicenseProvider injects.
  // If @tour-kit/license is not installed, this context won't exist — return passthrough.
  try {
    // Use the global context registry pattern from @tour-kit/core
    const ctx = (globalThis as any)[LICENSE_CONTEXT_KEY]
    if (!ctx) {
      return { valid: true, reason: 'no-license-package' }
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const license = useContext(ctx)
    if (!license) {
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

**Why this approach:**

- **Zero bundle impact.** No `import '@tour-kit/license'` statement appears anywhere — bundlers never resolve the package.
- **No dynamic import.** `import()` creates a code-split chunk reference that some bundlers (webpack, Vite) still try to resolve at build time for optional deps. Context sniffing avoids this entirely.
- **SSR safe.** `globalThis` works in Node.js and browsers. The `try-catch` handles any edge case.
- **Phase 2 responsibility.** `@tour-kit/license`'s `LicenseProvider` (built in Phase 2) registers its React context on `globalThis[LICENSE_CONTEXT_KEY]` during initialization. This is a one-line addition to Phase 2's provider.

**Alternative considered and rejected:** A `try { require('@tour-kit/license') }` pattern. Rejected because `require()` is not available in ESM, and bundlers still attempt to resolve the path even inside try-catch blocks, causing build warnings or errors.

### 2.3 Per-Package Integration Points

Not all 7 packages have the same architecture. The license check integrates at different points:

| Package | Has Provider? | Integration Point |
|---------|--------------|-------------------|
| `analytics` | Yes — `AnalyticsProvider` in `src/core/context.tsx` | Inside provider, before creating analytics instance |
| `announcements` | Yes — `AnnouncementsProvider` in `src/context/announcements-provider.tsx` | Inside provider, at top of component |
| `checklists` | Yes — `ChecklistProvider` in `src/context/checklist-provider.tsx` | Inside provider, at top of component |
| `adoption` | Yes — `AdoptionProvider` in `src/context/adoption-provider.tsx` | Inside provider, at top of component |
| `media` | No provider — component-based (`TourMedia`) | Inside `TourMedia` component in `src/components/tour-media.tsx` |
| `scheduling` | No provider — hook/utility-based | Inside `useSchedule` hook in `src/hooks/use-schedule.ts` |
| `ai` | Yes — `AiChatProvider` in `src/context/ai-chat-provider.tsx` | Inside provider, at top of component |

For packages **with providers**, the pattern is identical: call `useLicenseCheck()` at the top of the provider component. If invalid, log a dev warning and render children as passthrough.

For **media** (no provider), the check goes into the main `TourMedia` component.

For **scheduling** (no provider, hook-based), the check goes into the `useSchedule` hook — it logs a dev warning on first call if unlicensed but continues to return schedule data normally.

### 2.4 Dev Warning Pattern

The dev warning is identical across all 7 packages — only the package name changes:

```typescript
function warnUnlicensed(packageName: string): void {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[Tour Kit] ${packageName} requires a Pro license. ` +
      `Get one at https://tourkit.dev/pricing. ` +
      `The package will continue to work, but this message will appear in development.`
    )
  }
}
```

Key behaviors:

- **Development only.** `process.env.NODE_ENV !== 'production'` ensures the warning is tree-shaken in production builds (never appears in user-facing apps).
- **Warn once.** Use a module-level `let warned = false` flag to prevent spamming the console on re-renders.
- **No crash.** The warning is informational. Components always render children.

### 2.5 What Does NOT Change

- **No new dependencies for free packages.** `core`, `react`, and `hints` are not touched.
- **No behavioral changes for licensed users.** The `useLicenseCheck()` call adds negligible overhead (one context read).
- **No new exports.** `useLicenseCheck` is internal to each package — not exported in `index.ts`.
- **No breaking changes.** Existing users who never install `@tour-kit/license` see zero difference (passthrough mode).

---

## 3. Tasks

### Task 3.1 — Add `@tour-kit/license` as Optional Peer Dependency (1h)

**What:** Update `package.json` for all 7 extended packages to declare `@tour-kit/license` as an optional peer dependency.

**Files to modify (7):**
- `packages/analytics/package.json`
- `packages/announcements/package.json`
- `packages/checklists/package.json`
- `packages/adoption/package.json`
- `packages/media/package.json`
- `packages/scheduling/package.json`
- `packages/ai/package.json`

**Changes per file:**
```json
{
  "peerDependencies": {
    "@tour-kit/license": ">=0.1.0"
  },
  "peerDependenciesMeta": {
    "@tour-kit/license": {
      "optional": true
    }
  }
}
```

**Verification:** `pnpm install` completes without errors. No package resolution failures.

**Important:** Do NOT add `@tour-kit/license` to `dependencies` or `devDependencies`. It must be a **peer** dependency only, and marked **optional**.

---

### Task 3.2 — Create Shared `useLicenseCheck()` Pattern (1h)

**What:** Implement the `useLicenseCheck()` hook and `warnUnlicensed()` utility that all 7 packages will use.

**Approach:** Since each package is independently built by tsup, the hook must be duplicated into each package (not shared via a common package — that would create a dependency). However, the implementation is identical.

**Create 7 files — one per package:**
- `packages/analytics/src/lib/use-license-check.ts`
- `packages/announcements/src/lib/use-license-check.ts`
- `packages/checklists/src/lib/use-license-check.ts`
- `packages/adoption/src/lib/use-license-check.ts`
- `packages/media/src/lib/use-license-check.ts`
- `packages/scheduling/src/lib/use-license-check.ts`
- `packages/ai/src/lib/use-license-check.ts`

**Each file contains:**

```typescript
import { useContext } from 'react'

const LICENSE_CONTEXT_KEY = '__tourkit_license__'

interface LicenseCheckResult {
  valid: boolean
  reason: 'licensed' | 'no-license-package' | 'no-provider' | 'invalid'
}

let warned = false

export function useLicenseCheck(packageName: string): LicenseCheckResult {
  try {
    const ctx = (globalThis as any)[LICENSE_CONTEXT_KEY]
    if (!ctx) {
      // @tour-kit/license not installed — free-tier passthrough
      return { valid: true, reason: 'no-license-package' }
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const license = useContext(ctx)
    if (!license) {
      warnUnlicensed(packageName)
      return { valid: false, reason: 'no-provider' }
    }

    if (license.status !== 'valid') {
      warnUnlicensed(packageName)
      return { valid: false, reason: 'invalid' }
    }

    return { valid: true, reason: 'licensed' }
  } catch {
    // Safety net — never crash
    return { valid: true, reason: 'no-license-package' }
  }
}

function warnUnlicensed(packageName: string): void {
  if (process.env.NODE_ENV !== 'production' && !warned) {
    warned = true
    console.warn(
      `[Tour Kit] ${packageName} requires a Pro license. ` +
      `Get one at https://tourkit.dev/pricing. ` +
      `The package will continue to work, but this message will appear in development.`
    )
  }
}
```

**Phase 2 prerequisite:** Confirm that `@tour-kit/license`'s `LicenseProvider` registers its context on `globalThis[LICENSE_CONTEXT_KEY]`. If Phase 2 did not include this, add it now (one line in the provider's `useEffect`).

**Do NOT export `useLicenseCheck` from any package's `index.ts`.** It is an internal utility.

**Note on the `scheduling` package:** This package has no React components or providers — it is hook/utility-based. The `useLicenseCheck` hook still works here because `useSchedule` is already a React hook that calls `useContext` internally. The license check is just another hook call at the top.

---

### Task 3.3 — Integrate into `@tour-kit/analytics` Provider (0.5h)

**File:** `packages/analytics/src/core/context.tsx`

**Change:** Add `useLicenseCheck()` call at the top of `AnalyticsProvider`. If the check returns `{ valid: false }`, still render children and provide the analytics context — the dev warning is sufficient.

```typescript
import { useLicenseCheck } from '../lib/use-license-check'

export function AnalyticsProvider({ config, children }: AnalyticsProviderProps) {
  useLicenseCheck('@tour-kit/analytics')
  // ... rest of existing implementation unchanged
}
```

**Behavior:** Analytics continues to function without a license. The dev warning is the only difference. This is deliberate — hard-blocking analytics would break tour tracking for users evaluating the library.

---

### Task 3.4 — Integrate into `@tour-kit/announcements` Provider (0.5h)

**File:** `packages/announcements/src/context/announcements-provider.tsx`

**Change:** Add `useLicenseCheck()` at the top of `AnnouncementsProvider`.

```typescript
import { useLicenseCheck } from '../lib/use-license-check'

export function AnnouncementsProvider({ children, ...props }: AnnouncementsProviderProps) {
  useLicenseCheck('@tour-kit/announcements')
  // ... rest unchanged
}
```

---

### Task 3.5 — Integrate into `@tour-kit/checklists` Provider (0.5h)

**File:** `packages/checklists/src/context/checklist-provider.tsx`

**Change:** Add `useLicenseCheck()` at the top of `ChecklistProvider`.

```typescript
import { useLicenseCheck } from '../lib/use-license-check'

export function ChecklistProvider({ children, ...props }: ChecklistProviderProps) {
  useLicenseCheck('@tour-kit/checklists')
  // ... rest unchanged
}
```

---

### Task 3.6 — Integrate into `@tour-kit/adoption` Provider (0.5h)

**File:** `packages/adoption/src/context/adoption-provider.tsx`

**Change:** Add `useLicenseCheck()` at the top of `AdoptionProvider`.

```typescript
import { useLicenseCheck } from '../lib/use-license-check'

export function AdoptionProvider({ children, ...props }: AdoptionProviderProps) {
  useLicenseCheck('@tour-kit/adoption')
  // ... rest unchanged
}
```

---

### Task 3.7 — Integrate into `@tour-kit/media` Component (0.5h)

**File:** `packages/media/src/components/tour-media.tsx`

**Note:** The media package has no provider. The license check goes into the main `TourMedia` component, which is the top-level entry point users render.

```typescript
import { useLicenseCheck } from '../lib/use-license-check'

export function TourMedia(props: TourMediaProps) {
  useLicenseCheck('@tour-kit/media')
  // ... rest unchanged
}
```

---

### Task 3.8 — Integrate into `@tour-kit/scheduling` Hook (0.5h)

**File:** `packages/scheduling/src/hooks/use-schedule.ts`

**Note:** The scheduling package has no provider and no top-level component. The license check goes into the `useSchedule` hook, which is the primary entry point.

```typescript
import { useLicenseCheck } from '../lib/use-license-check'

export function useSchedule(config: ScheduleConfig) {
  useLicenseCheck('@tour-kit/scheduling')
  // ... rest unchanged
}
```

**Consideration:** If `useSchedule` is called frequently (e.g., in a render loop), the `warned` flag in `useLicenseCheck` ensures the console warning fires only once. The context read itself is negligible overhead.

---

### Task 3.9 — Integrate into `@tour-kit/ai` Provider (0.5h)

**File:** `packages/ai/src/context/ai-chat-provider.tsx`

**Change:** Add `useLicenseCheck()` at the top of `AiChatProvider`.

```typescript
import { useLicenseCheck } from '../lib/use-license-check'

export function AiChatProvider({ config, children, tourContextValue }: AiChatProviderProps) {
  useLicenseCheck('@tour-kit/ai')
  // ... rest unchanged
}
```

---

### Task 3.10 — Write Integration Tests (1.5h)

**What:** Write 7 integration tests, one per pro package. Each test renders the package's provider/component **without** `@tour-kit/license` installed and verifies: no crash, children rendered, dev warning logged.

**Test files to create (7):**
- `packages/analytics/src/__tests__/license-integration.test.tsx`
- `packages/announcements/src/__tests__/license-integration.test.tsx`
- `packages/checklists/src/__tests__/license-integration.test.tsx`
- `packages/adoption/src/__tests__/license-integration.test.tsx`
- `packages/media/src/__tests__/license-integration.test.tsx`
- `packages/scheduling/src/__tests__/license-integration.test.tsx`
- `packages/ai/src/__tests__/license-integration.test.tsx`

**Test structure (example for analytics):**

```typescript
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AnalyticsProvider } from '../core/context'

describe('AnalyticsProvider — license integration', () => {
  it('renders children without @tour-kit/license installed', () => {
    // Ensure the global context key is NOT set (simulates no license package)
    delete (globalThis as any).__tourkit_license__

    render(
      <AnalyticsProvider config={{ plugins: [] }}>
        <div data-testid="child">Hello</div>
      </AnalyticsProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('logs dev warning when LicenseProvider is missing but license package is present', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Simulate license package installed but no provider in tree
    const { createContext } = require('react')
    ;(globalThis as any).__tourkit_license__ = createContext(null)

    render(
      <AnalyticsProvider config={{ plugins: [] }}>
        <div data-testid="child">Hello</div>
      </AnalyticsProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('@tour-kit/analytics requires a Pro license')
    )

    warnSpy.mockRestore()
    delete (globalThis as any).__tourkit_license__
  })

  it('does not warn in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(
      <AnalyticsProvider config={{ plugins: [] }}>
        <div data-testid="child">Hello</div>
      </AnalyticsProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(warnSpy).not.toHaveBeenCalled()

    warnSpy.mockRestore()
    process.env.NODE_ENV = originalEnv
  })
})
```

**Adapt per package:**
- Each test uses the correct provider/component and required props for that package.
- The media test renders `<TourMedia>` instead of a provider.
- The scheduling test calls `useSchedule()` inside a test component wrapper.
- Reset the `warned` flag between tests by re-importing the module or using `vi.resetModules()`.

---

### Task 3.11 — Verify Free Packages Have Zero License Imports (0.5h)

**What:** Confirm that `core`, `react`, and `hints` have absolutely no imports from `@tour-kit/license`.

**Step 1 — Source grep:**
```bash
# Must return zero results
grep -r "@tour-kit/license" packages/core/src/ packages/react/src/ packages/hints/src/
grep -r "use-license-check" packages/core/src/ packages/react/src/ packages/hints/src/
grep -r "__tourkit_license__" packages/core/src/ packages/react/src/ packages/hints/src/
```

**Step 2 — Built bundle grep:**
```bash
pnpm build --filter=@tour-kit/core --filter=@tour-kit/react --filter=@tour-kit/hints
grep -r "license" packages/core/dist/ packages/react/dist/ packages/hints/dist/
grep -r "__tourkit_license__" packages/core/dist/ packages/react/dist/ packages/hints/dist/
```

**Step 3 — Bundle size comparison:**

Record the gzipped sizes of `core`, `react`, and `hints` **before** and **after** this phase. They must be identical (within 1 byte — no new code was added to these packages).

```bash
# Before (record at start of phase)
du -b packages/core/dist/*.js packages/react/dist/*.js packages/hints/dist/*.js

# After (record at end of phase)
du -b packages/core/dist/*.js packages/react/dist/*.js packages/hints/dist/*.js
```

**Expected:** Zero matches for all greps. Identical bundle sizes.

---

## 4. Deliverables

```
packages/
├── analytics/
│   ├── package.json                              # Updated — optional peer dep (3.1)
│   ├── src/lib/use-license-check.ts              # New — license check hook (3.2)
│   ├── src/core/context.tsx                       # Modified — useLicenseCheck() call (3.3)
│   └── src/__tests__/license-integration.test.tsx # New — integration test (3.10)
├── announcements/
│   ├── package.json                              # Updated (3.1)
│   ├── src/lib/use-license-check.ts              # New (3.2)
│   ├── src/context/announcements-provider.tsx     # Modified (3.4)
│   └── src/__tests__/license-integration.test.tsx # New (3.10)
├── checklists/
│   ├── package.json                              # Updated (3.1)
│   ├── src/lib/use-license-check.ts              # New (3.2)
│   ├── src/context/checklist-provider.tsx         # Modified (3.5)
│   └── src/__tests__/license-integration.test.tsx # New (3.10)
├── adoption/
│   ├── package.json                              # Updated (3.1)
│   ├── src/lib/use-license-check.ts              # New (3.2)
│   ├── src/context/adoption-provider.tsx          # Modified (3.6)
│   └── src/__tests__/license-integration.test.tsx # New (3.10)
├── media/
│   ├── package.json                              # Updated (3.1)
│   ├── src/lib/use-license-check.ts              # New (3.2)
│   ├── src/components/tour-media.tsx              # Modified (3.7)
│   └── src/__tests__/license-integration.test.tsx # New (3.10)
├── scheduling/
│   ├── package.json                              # Updated (3.1)
│   ├── src/lib/use-license-check.ts              # New (3.2)
│   ├── src/hooks/use-schedule.ts                  # Modified (3.8)
│   └── src/__tests__/license-integration.test.tsx # New (3.10)
└── ai/
    ├── package.json                              # Updated (3.1)
    ├── src/lib/use-license-check.ts              # New (3.2)
    ├── src/context/ai-chat-provider.tsx           # Modified (3.9)
    └── src/__tests__/license-integration.test.tsx # New (3.10)
```

**Total: 7 new `use-license-check.ts` files, 7 modified provider/component files, 7 new test files, 7 updated `package.json` files.**

---

## 5. Exit Criteria

| # | Criterion | Measurement |
|---|-----------|-------------|
| EC-1 | All 7 pro packages declare `@tour-kit/license` as optional peer dependency | `grep -l "peerDependenciesMeta" packages/{analytics,announcements,checklists,adoption,media,scheduling,ai}/package.json` returns 7 files |
| EC-2 | Each pro package has a `lib/use-license-check.ts` file | 7 files exist at the expected paths |
| EC-3 | Without `@tour-kit/license` installed: all 7 packages render children, no crash | 7 integration tests pass — "renders children without @tour-kit/license installed" |
| EC-4 | Without `LicenseProvider` but with license package: dev warning logged | 7 integration tests pass — "logs dev warning when LicenseProvider is missing" |
| EC-5 | Warning does not appear in production | 7 integration tests pass — "does not warn in production mode" |
| EC-6 | Free packages have zero license imports (source) | `grep -r "@tour-kit/license" packages/core/src/ packages/react/src/ packages/hints/src/` returns 0 results |
| EC-7 | Free packages have zero license references (bundle) | `grep -r "license\|__tourkit_license__" packages/core/dist/ packages/react/dist/ packages/hints/dist/` returns 0 results |
| EC-8 | Free package bundle sizes unchanged | `core`, `react`, `hints` gzipped sizes match pre-phase baseline |
| EC-9 | All 7 pro packages build successfully | `pnpm build --filter=@tour-kit/analytics --filter=@tour-kit/announcements --filter=@tour-kit/checklists --filter=@tour-kit/adoption --filter=@tour-kit/media --filter=@tour-kit/scheduling --filter=@tour-kit/ai` exits 0 |
| EC-10 | All 7 pro packages pass typecheck | `pnpm typecheck` exits 0 with no errors in the 7 pro packages |

---

## 6. Execution Prompt

> **Build Brief — Pro Package License Integration**
>
> ### Project Context
>
> Tour Kit is a headless onboarding/product tour library for React, structured as a pnpm monorepo with Turborepo and tsup. It has 3 free packages (`@tour-kit/core`, `@tour-kit/react`, `@tour-kit/hints`) and 7 pro packages (`@tour-kit/analytics`, `@tour-kit/announcements`, `@tour-kit/checklists`, `@tour-kit/adoption`, `@tour-kit/media`, `@tour-kit/scheduling`, `@tour-kit/ai`).
>
> We are replacing JWT-based licensing with Polar.sh-backed license key validation. The critical constraint is **zero bundle impact on free-tier users** — free packages must never import `@tour-kit/license`.
>
> ### What Phase 1 Established
>
> Phase 1 built the framework-agnostic license SDK in `packages/license/`:
> - `validateLicenseKey()` — orchestrator: cache check, Polar API validate, auto-activate, cache write
> - `LicenseState` type — `{ status: 'valid' | 'invalid' | 'revoked' | 'loading' | 'error', tier: 'free' | 'pro' }`
> - `cache.ts` — localStorage with 24h TTL
> - `domain.ts` — `isDevEnvironment()` for localhost detection
> - `schemas.ts` — Zod schemas for Polar API responses
> - `headless.ts` — exports types + functions without React
>
> ### What Phase 2 Established
>
> Phase 2 built the React integration in `packages/license/`:
> - `LicenseProvider` — validates key on mount, provides `LicenseState` via React context, dev-mode bypass on localhost
> - `LicenseGate` — renders children if licensed, fallback if not
> - `useLicense()` — context consumer hook (throws outside provider)
> - `useIsPro()` — boolean shortcut
> - **Critical for Phase 3:** `LicenseProvider` registers its React context on `globalThis['__tourkit_license__']` so pro packages can read it without importing `@tour-kit/license`
>
> ### Your Task
>
> Wire license checks into all 7 pro packages. Follow the exact pattern below.
>
> #### Step 1: Add Optional Peer Dependency (all 7 packages)
>
> In each pro package's `package.json`, add:
> ```json
> "peerDependencies": {
>   "@tour-kit/license": ">=0.1.0"
> },
> "peerDependenciesMeta": {
>   "@tour-kit/license": {
>     "optional": true
>   }
> }
> ```
>
> #### Step 2: Create `lib/use-license-check.ts` (all 7 packages)
>
> Create this identical file in each package at `src/lib/use-license-check.ts`:
>
> ```typescript
> import { useContext } from 'react'
>
> const LICENSE_CONTEXT_KEY = '__tourkit_license__'
>
> interface LicenseCheckResult {
>   valid: boolean
>   reason: 'licensed' | 'no-license-package' | 'no-provider' | 'invalid'
> }
>
> let warned = false
>
> export function useLicenseCheck(packageName: string): LicenseCheckResult {
>   try {
>     const ctx = (globalThis as any)[LICENSE_CONTEXT_KEY]
>     if (!ctx) {
>       return { valid: true, reason: 'no-license-package' }
>     }
>
>     // eslint-disable-next-line react-hooks/rules-of-hooks
>     const license = useContext(ctx)
>     if (!license) {
>       warnUnlicensed(packageName)
>       return { valid: false, reason: 'no-provider' }
>     }
>
>     if (license.status !== 'valid') {
>       warnUnlicensed(packageName)
>       return { valid: false, reason: 'invalid' }
>     }
>
>     return { valid: true, reason: 'licensed' }
>   } catch {
>     return { valid: true, reason: 'no-license-package' }
>   }
> }
>
> function warnUnlicensed(packageName: string): void {
>   if (process.env.NODE_ENV !== 'production' && !warned) {
>     warned = true
>     console.warn(
>       `[Tour Kit] ${packageName} requires a Pro license. ` +
>       `Get one at https://tourkit.dev/pricing. ` +
>       `The package will continue to work, but this message will appear in development.`
>     )
>   }
> }
> ```
>
> #### Step 3: Add License Check to Each Package
>
> Add a single `useLicenseCheck('<package-name>')` call at the top of each package's main entry point:
>
> | Package | File | Function | Line to Add |
> |---------|------|----------|-------------|
> | analytics | `src/core/context.tsx` | `AnalyticsProvider` | `useLicenseCheck('@tour-kit/analytics')` |
> | announcements | `src/context/announcements-provider.tsx` | `AnnouncementsProvider` | `useLicenseCheck('@tour-kit/announcements')` |
> | checklists | `src/context/checklist-provider.tsx` | `ChecklistProvider` | `useLicenseCheck('@tour-kit/checklists')` |
> | adoption | `src/context/adoption-provider.tsx` | `AdoptionProvider` | `useLicenseCheck('@tour-kit/adoption')` |
> | media | `src/components/tour-media.tsx` | `TourMedia` | `useLicenseCheck('@tour-kit/media')` |
> | scheduling | `src/hooks/use-schedule.ts` | `useSchedule` | `useLicenseCheck('@tour-kit/scheduling')` |
> | ai | `src/context/ai-chat-provider.tsx` | `AiChatProvider` | `useLicenseCheck('@tour-kit/ai')` |
>
> Import it as: `import { useLicenseCheck } from '../lib/use-license-check'`
>
> **Do NOT export `useLicenseCheck` from any package's `index.ts`.**
>
> #### Step 4: Write Integration Tests (7 files)
>
> Create `src/__tests__/license-integration.test.tsx` in each package with 3 tests:
> 1. Renders children without `@tour-kit/license` installed (delete `globalThis.__tourkit_license__` before test)
> 2. Logs dev warning when license package is present but no `LicenseProvider` in tree (set `globalThis.__tourkit_license__` to a context with null value)
> 3. Does not warn in production mode (set `process.env.NODE_ENV = 'production'`)
>
> #### Step 5: Verify Free Package Isolation
>
> Run these commands and confirm zero matches:
> ```bash
> grep -r "@tour-kit/license" packages/core/src/ packages/react/src/ packages/hints/src/
> grep -r "use-license-check" packages/core/src/ packages/react/src/ packages/hints/src/
> grep -r "__tourkit_license__" packages/core/src/ packages/react/src/ packages/hints/src/
> ```
>
> Build the free packages and grep their output:
> ```bash
> pnpm build --filter=@tour-kit/core --filter=@tour-kit/react --filter=@tour-kit/hints
> grep -r "__tourkit_license__" packages/core/dist/ packages/react/dist/ packages/hints/dist/
> ```
>
> ### Success Criteria
>
> - [ ] 7 `package.json` files updated with optional peer dependency
> - [ ] 7 `use-license-check.ts` files created (identical content, one per package)
> - [ ] 7 provider/component files modified (one `useLicenseCheck()` call each)
> - [ ] 7 integration test files created and passing
> - [ ] `pnpm build` succeeds for all 7 pro packages
> - [ ] `pnpm typecheck` passes
> - [ ] Free packages (`core`, `react`, `hints`) have zero license-related imports in source and dist
> - [ ] Free package bundle sizes unchanged
>
> ### What NOT to Do
>
> - Do NOT add `@tour-kit/license` as a hard dependency (only optional peer)
> - Do NOT use `import()` or `require()` to load `@tour-kit/license` — use the globalThis context pattern
> - Do NOT export `useLicenseCheck` from any package's public API
> - Do NOT modify any files in `packages/core/`, `packages/react/`, or `packages/hints/`
> - Do NOT hard-block rendering — unlicensed packages always render children

---

## Readiness Check

| # | Item | Status |
|---|------|--------|
| 1 | Phase 2 complete — `LicenseProvider`, `useLicense()`, `LicenseGate`, `useIsPro()` working | VERIFY before starting |
| 2 | `LicenseProvider` registers context on `globalThis['__tourkit_license__']` | VERIFY — if missing, add to Phase 2 provider first |
| 3 | All 7 pro package provider/component files identified and paths confirmed | PASS — see Section 2.3 table |
| 4 | `pnpm install` and `pnpm build` pass on current main branch | VERIFY before starting |
| 5 | Test runner (vitest) configured in all 7 pro packages | PASS — existing `__tests__/` directories confirm test setup |
| 6 | `useLicenseCheck` pattern reviewed and approved (context sniffing, not dynamic import) | PASS — see Section 2.2 |
| 7 | Free package baseline bundle sizes recorded | RECORD at start of phase |
| 8 | No circular dependency risk (pro packages read from globalThis, not import from license) | PASS — no import statement, no bundler resolution |

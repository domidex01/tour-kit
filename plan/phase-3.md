# Phase 3 — Pro Package Integration

**Duration:** Days 11-13 (~6-8h)
**Depends on:** Phase 2 (LicenseProvider, LicenseGate, LicenseWatermark, useLicense, useIsPro)
**Blocks:** Phase 5
**Risk Level:** LOW — repetitive integration across 7 packages following the same pattern
**Stack:** react

---

## 1. Objective + What Success Looks Like

Wire license checks into all 7 extended (Pro) packages so they display a watermark overlay and a dev-mode console warning when no valid Pro license is present. Components continue to render and function in all cases — this is soft enforcement, never a blank screen.

**Success looks like:**

- A developer installs `@tour-kit/analytics` without `@tour-kit/license` installed. The analytics provider renders its children normally with zero errors — no watermark, no warning, no crash. The license package is truly optional.
- A developer installs `@tour-kit/analytics` WITH `@tour-kit/license` installed but provides no license key. The analytics provider renders its children with a semi-transparent "UNLICENSED" watermark overlay and a `console.warn` in development. All analytics functionality still works.
- A developer provides a valid license key via `<LicenseProvider>`. All 7 pro packages render cleanly with no watermark and no warnings.
- Free packages (`core`, `react`, `hints`) have zero imports from `@tour-kit/license`. Their bundle sizes are unchanged.

---

## 2. Key Design Decisions

### 2.1 Optional Peer Dependency Pattern

Each pro package declares `@tour-kit/license` as an **optional** peer dependency (`peerDependenciesMeta: { optional: true }`). This means:
- If the license package is not installed, the pro package works normally — no watermark, no gating.
- If the license package IS installed, the pro package detects it and checks license status.
- pnpm/npm will not error when the peer is missing.

### 2.2 Try-Catch Dynamic Import via `useLicenseCheck()`

Each pro package contains its own `useLicenseCheck()` hook that attempts to import `@tour-kit/license` at runtime:

1. Module-level try-catch around `require('@tour-kit/license')` to detect availability.
2. If available: hook calls `useLicense()` from the license package and returns `{ isLicensed, isLoading }`.
3. If unavailable: hook returns `{ isLicensed: true, isLoading: false }` (free-tier zero-impact).
4. If license package is installed but no `<LicenseProvider>` wraps the tree: try-catch around context read, default to unlicensed if provider is missing but package is installed.

### 2.3 Watermark Ownership — Lives in the Pro Package

The watermark rendering code lives **inside each pro package**, not in `@tour-kit/license`. This is a critical anti-piracy design decision:
- If someone replaces `@tour-kit/license` with a fake module that always returns `{ valid: true }`, the pro package's own watermark logic still fires because it checks its own embedded conditions.
- Each pro package renders a `<div>` with inline styles (high z-index, pointer-events: none, semi-transparent) when `useLicenseCheck()` returns `isLicensed: false`.
- The watermark text includes the package name (e.g., "UNLICENSED — @tour-kit/analytics").

### 2.4 Zero Impact on Free Packages

The three free packages (`core`, `react`, `hints`) must **never** import `@tour-kit/license`:
- No `peerDependencies` entry.
- No `import` or `require` statements referencing the license package.
- Bundle sizes remain identical before and after this phase.
- Verified via grep on source + dist and bundle size comparison in Task 3.11.

### 2.5 Per-Package Integration Points

Different pro packages have different architectures. The license check integration point varies:

| Package | Integration Point | Notes |
|---------|------------------|-------|
| `@tour-kit/analytics` | `AnalyticsProvider` (`src/core/context.tsx`) | Wraps children with watermark overlay |
| `@tour-kit/announcements` | `AnnouncementsProvider` (`src/context/announcements-provider.tsx`) | Wraps children with watermark overlay |
| `@tour-kit/checklists` | `ChecklistProvider` (`src/context/checklist-provider.tsx`) | Wraps children with watermark overlay |
| `@tour-kit/adoption` | `AdoptionProvider` (`src/context/adoption-provider.tsx`) | Wraps children with watermark overlay |
| `@tour-kit/media` | Component-level (no provider) — wrap each embed component | Use HOC for consistent wrapping |
| `@tour-kit/scheduling` | Hooks-only (no provider) — create `ScheduleGate` wrapper | Thin component that wraps scheduled content |
| `@tour-kit/ai` | `AiChatProvider` (`src/context/ai-chat-provider.tsx`) | Wraps children with watermark overlay |

---

## 3. Tasks

### 3.1 Add `@tour-kit/license` as optional peer dependency to all 7 pro packages (1h)

Update `package.json` for each of the 7 pro packages:

```jsonc
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

**Files:** 7x `packages/<name>/package.json` (analytics, announcements, checklists, adoption, media, scheduling, ai)

Verify that `pnpm install` still succeeds without `@tour-kit/license` installed as a direct dependency in any of the 7 packages.

### 3.2 Create shared `useLicenseCheck()` pattern and inline watermark component (1h)

Each pro package gets two files:

**`src/lib/use-license-check.ts`** — The hook that detects `@tour-kit/license` and reads license state:

```tsx
import * as React from 'react'

interface LicenseCheckResult {
  isLicensed: boolean
  isLoading: boolean
}

// Module-level detection: is @tour-kit/license installed?
let licenseModule: { useLicense: () => { status: string } } | null = null
let licenseDetected = false

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  licenseModule = require('@tour-kit/license')
  licenseDetected = true
} catch {
  // Package not installed — pro package works without it
}

export function useLicenseCheck(): LicenseCheckResult {
  // If license package is not installed, assume licensed (free-tier zero-impact)
  if (!licenseDetected || !licenseModule) {
    return { isLicensed: true, isLoading: false }
  }

  // License package is installed — check status via context
  try {
    const { status } = licenseModule.useLicense()
    return {
      isLicensed: status === 'active' || status === 'loading',
      isLoading: status === 'loading',
    }
  } catch {
    // useLicense() threw — likely no LicenseProvider in tree
    // If license package is installed but no provider, treat as unlicensed
    return { isLicensed: false, isLoading: false }
  }
}
```

**`src/lib/pro-watermark.tsx`** — Inline watermark component owned by the pro package:

```tsx
import * as React from 'react'
import { useLicenseCheck } from './use-license-check'

const PACKAGE_NAME = '@tour-kit/<package-name>'

const watermarkStyles: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 2147483647,
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0.12,
  fontSize: '14px',
  fontFamily: 'monospace',
  fontWeight: 700,
  color: '#000',
  userSelect: 'none',
  letterSpacing: '2px',
  textTransform: 'uppercase',
}

export function ProWatermark() {
  const { isLicensed, isLoading } = useLicenseCheck()
  const warnedRef = React.useRef(false)

  React.useEffect(() => {
    if (!isLicensed && !isLoading && !warnedRef.current) {
      warnedRef.current = true
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[${PACKAGE_NAME}] Unlicensed usage detected. ` +
          'Purchase a license at tourkit.dev/pricing'
        )
      }
    }
  }, [isLicensed, isLoading])

  if (isLicensed || isLoading) return null

  return <div style={watermarkStyles} aria-hidden="true">UNLICENSED</div>
}
```

**Pattern:** Implement the first copy in `@tour-kit/analytics`, then replicate to the other 6 packages with `PACKAGE_NAME` substitution.

### 3.3 Integrate license check into `@tour-kit/analytics` (0.5h)

**File:** `packages/analytics/src/core/context.tsx`

- Import `ProWatermark` from `../lib/pro-watermark`.
- Wrap the `AnalyticsProvider` return JSX: add a `<div style={{ position: 'relative' }}>` container around children, and render `<ProWatermark />` alongside.
- All analytics functionality (tracking, plugins, flush) works regardless of license status.

### 3.4 Integrate license check into `@tour-kit/announcements` (0.5h)

**File:** `packages/announcements/src/context/announcements-provider.tsx`

Same pattern as 3.3. The announcements provider wraps children with relative container and renders `<ProWatermark />`.

### 3.5 Integrate license check into `@tour-kit/checklists` (0.5h)

**File:** `packages/checklists/src/context/checklist-provider.tsx`

Same pattern as 3.3.

### 3.6 Integrate license check into `@tour-kit/adoption` (0.5h)

**File:** `packages/adoption/src/context/adoption-provider.tsx`

Same pattern as 3.3.

### 3.7 Integrate license check into `@tour-kit/media` (0.5h)

**Files:** Individual embed components in `packages/media/src/components/`.

Media has no provider — it exports individual embed components. Create a `withLicenseCheck()` HOC to avoid modifying every component individually:

```tsx
// packages/media/src/lib/with-license-check.tsx
import * as React from 'react'
import { ProWatermark } from './pro-watermark'

export function withLicenseCheck<P extends object>(
  Component: React.ComponentType<P>,
  displayName: string
): React.ComponentType<P> {
  const Wrapped = React.forwardRef<unknown, P>((props, ref) => (
    <div style={{ position: 'relative' }}>
      <Component {...props} ref={ref} />
      <ProWatermark />
    </div>
  ))
  Wrapped.displayName = `Licensed(${displayName})`
  return Wrapped as unknown as React.ComponentType<P>
}
```

Apply to all exported embed components: `YouTubeEmbed`, `VimeoEmbed`, `LoomEmbed`, `WistiaEmbed`, `GifPlayer`, `LottiePlayer`.

### 3.8 Integrate license check into `@tour-kit/scheduling` (0.5h)

**Files:** `packages/scheduling/src/`

Scheduling is hooks-only (no provider, no visual components). The integration is:

1. Create `<ScheduleGate>` component (`src/components/schedule-gate.tsx`) that wraps scheduled content with watermark overlay when unlicensed. Export from package index.
2. Add `console.warn` to `useSchedule` hook by calling `useLicenseCheck()` inside the hook (dev-mode only, once per mount).

### 3.9 Integrate license check into `@tour-kit/ai` (0.5h)

**File:** `packages/ai/src/context/ai-chat-provider.tsx`

Same pattern as 3.3. The AI chat provider wraps children with relative container and renders `<ProWatermark />`.

### 3.10 Write integration tests for all 7 pro packages (1.5h)

**Files:** 7x `packages/<name>/src/__tests__/license-integration.test.tsx`

Each test file covers 5 scenarios:

1. **No crash without license package** — mock `require('@tour-kit/license')` to throw. Render provider/component. Assert children render without errors.
2. **Watermark visible when unlicensed** — mock `@tour-kit/license` available with `useLicense` returning `{ status: 'invalid' }`. Assert "UNLICENSED" text in DOM.
3. **Console warning in dev** — same setup as (2). Assert `console.warn` called with package name.
4. **Component still functions** — same setup as (2). Assert core functionality works (package-specific assertions).
5. **No watermark with valid license** — mock `useLicense` returning `{ status: 'active' }`. Assert "UNLICENSED" NOT in DOM.

Use `vi.mock()` (Vitest) for module mocking. Test each package in isolation.

### 3.11 Verify free packages have zero license imports (0.5h)

- Run `grep -r "@tour-kit/license" packages/core/ packages/react/ packages/hints/` — must return zero results.
- Run `pnpm build --filter=@tour-kit/core --filter=@tour-kit/react --filter=@tour-kit/hints`.
- Compare bundle sizes before and after Phase 3 changes — must be identical (within 1 byte).
- Run `grep -r "license" packages/core/dist/ packages/react/dist/ packages/hints/dist/` — must return zero results in built output.

---

## 4. Deliverables

```
packages/analytics/
├── package.json                                  # +optional peer dep
├── src/
│   ├── lib/
│   │   ├── use-license-check.ts                  # NEW
│   │   └── pro-watermark.tsx                     # NEW
│   ├── core/
│   │   └── context.tsx                           # MODIFIED (watermark integration)
│   └── __tests__/
│       └── license-integration.test.tsx          # NEW

packages/announcements/
├── package.json                                  # +optional peer dep
├── src/
│   ├── lib/
│   │   ├── use-license-check.ts                  # NEW
│   │   └── pro-watermark.tsx                     # NEW
│   ├── context/
│   │   └── announcements-provider.tsx            # MODIFIED
│   └── __tests__/
│       └── license-integration.test.tsx          # NEW

packages/checklists/
├── package.json                                  # +optional peer dep
├── src/
│   ├── lib/
│   │   ├── use-license-check.ts                  # NEW
│   │   └── pro-watermark.tsx                     # NEW
│   ├── context/
│   │   └── checklist-provider.tsx                # MODIFIED
│   └── __tests__/
│       └── license-integration.test.tsx          # NEW

packages/adoption/
├── package.json                                  # +optional peer dep
├── src/
│   ├── lib/
│   │   ├── use-license-check.ts                  # NEW
│   │   └── pro-watermark.tsx                     # NEW
│   ├── context/
│   │   └── adoption-provider.tsx                 # MODIFIED
│   └── __tests__/
│       └── license-integration.test.tsx          # NEW

packages/media/
├── package.json                                  # +optional peer dep
├── src/
│   ├── lib/
│   │   ├── use-license-check.ts                  # NEW
│   │   ├── pro-watermark.tsx                     # NEW
│   │   └── with-license-check.tsx                # NEW (HOC)
│   └── __tests__/
│       └── license-integration.test.tsx          # NEW

packages/scheduling/
├── package.json                                  # +optional peer dep
├── src/
│   ├── lib/
│   │   ├── use-license-check.ts                  # NEW
│   │   └── pro-watermark.tsx                     # NEW
│   ├── components/
│   │   └── schedule-gate.tsx                     # NEW
│   ├── hooks/
│   │   └── use-schedule.ts                       # MODIFIED (console.warn)
│   └── __tests__/
│       └── license-integration.test.tsx          # NEW

packages/ai/
├── package.json                                  # +optional peer dep
├── src/
│   ├── lib/
│   │   ├── use-license-check.ts                  # NEW
│   │   └── pro-watermark.tsx                     # NEW
│   ├── context/
│   │   └── ai-chat-provider.tsx                  # MODIFIED
│   └── __tests__/
│       └── license-integration.test.tsx          # NEW
```

**Total new files:** 23 (7x use-license-check + 7x pro-watermark + 7x integration tests + 1 HOC for media + 1 ScheduleGate for scheduling)
**Total modified files:** 14 (7x package.json + 5x provider files + 1x media index + 1x scheduling hook)

---

## 5. Exit Criteria

- [ ] All 7 pro packages list `@tour-kit/license` as an optional peer dependency in `package.json`
- [ ] Each pro package contains `src/lib/use-license-check.ts` and `src/lib/pro-watermark.tsx`
- [ ] Without `@tour-kit/license` installed: all 7 pro packages render normally with zero errors, zero watermarks, zero warnings
- [ ] With `@tour-kit/license` installed but no valid key: all 7 pro packages render with visible watermark overlay + `console.warn` in development — components still function (no crash, no blank screen)
- [ ] With a valid Pro license key: all 7 pro packages render normally with no watermark
- [ ] Free packages (`core`, `react`, `hints`) have zero imports from `@tour-kit/license` — verified by grep on source AND dist
- [ ] Free package bundle sizes unchanged (within 1 byte) before vs. after Phase 3
- [ ] All 7 integration test files pass (`pnpm test` across all pro packages)
- [ ] `pnpm build` succeeds for all packages with zero TypeScript errors
- [ ] `pnpm typecheck` passes across the entire monorepo

---

## 6. Execution Prompt

You are implementing Phase 3 of the Tour Kit Licensing System. Your job is to wire license checks into all 7 extended (Pro) packages so they show a watermark overlay and dev console warning when no valid Pro license is detected. Components must always render and function — soft enforcement only.

### What Prior Phases Establish

**Phase 1 (Core License SDK)** built these in `packages/license/src/`:
- `validateLicenseKey()` — orchestrator: cache check -> Polar API validate -> auto-activate -> cache write
- `src/lib/polar-client.ts` — raw fetch wrappers for Polar.sh validate/activate/deactivate
- `src/lib/cache.ts` — localStorage with 24h TTL, Zod integrity checks
- `src/lib/domain.ts` — `getCurrentDomain()`, `isDevEnvironment()`, `validateDomainAtRender()`
- `src/lib/schemas.ts` — Zod schemas for Polar API responses and cache shape
- `src/types/index.ts` — `LicenseState`, `LicenseCache`, `LicenseError`, etc.
- `src/headless.ts` — framework-agnostic exports (types + functions, no React)

**Phase 2 (React Integration)** built these in `packages/license/src/`:
- `LicenseProvider` (`src/context/license-context.ts`) — validates on mount, caches, provides `LicenseState` via React context, dev-mode bypass on localhost
- `LicenseGate` (`src/components/license-gate.tsx`) — renders children when licensed, watermark when not; interleaved validation (removing gate breaks rendering)
- `LicenseWatermark` (`src/components/license-watermark.tsx`) — semi-transparent "UNLICENSED" overlay with inline styles, high z-index, pointer-events: none
- `LicenseWarning` (`src/components/license-warning.tsx`) — dev-mode console warning component
- `useLicense()` (`src/hooks/use-license.ts`) — context consumer, throws outside provider
- `useIsPro()` (`src/hooks/use-is-pro.ts`) — boolean shortcut
- Bundle size: `@tour-kit/license` < 3KB gzipped
- Exports via `src/index.ts` (React + types) and `src/headless.ts` (no React)

### The 7 Pro Packages (MUST integrate)

1. `@tour-kit/analytics` — Provider: `packages/analytics/src/core/context.tsx` (`AnalyticsProvider`)
2. `@tour-kit/announcements` — Provider: `packages/announcements/src/context/announcements-provider.tsx` (`AnnouncementsProvider`)
3. `@tour-kit/checklists` — Provider: `packages/checklists/src/context/checklist-provider.tsx` (`ChecklistProvider`)
4. `@tour-kit/adoption` — Provider: `packages/adoption/src/context/adoption-provider.tsx` (`AdoptionProvider`)
5. `@tour-kit/media` — No provider, component-based. Use HOC `withLicenseCheck()` to wrap embed components.
6. `@tour-kit/scheduling` — Hooks-only. Create `<ScheduleGate>` wrapper component. Add `console.warn` to `useSchedule` hook.
7. `@tour-kit/ai` — Provider: `packages/ai/src/context/ai-chat-provider.tsx` (`AiChatProvider`)

### The 3 Free Packages (MUST NOT touch)

- `@tour-kit/core` — NO license imports
- `@tour-kit/react` — NO license imports
- `@tour-kit/hints` — NO license imports

### `useLicenseCheck()` Implementation

Each pro package gets its own copy at `src/lib/use-license-check.ts`. The pattern uses module-level try-catch around `require('@tour-kit/license')` to detect availability at import time. If the package is found, the hook calls `useLicense()` and maps the status to `{ isLicensed, isLoading }`. If the package is not found, the hook returns `{ isLicensed: true, isLoading: false }`. If `useLicense()` throws (no provider in tree), the hook returns `{ isLicensed: false, isLoading: false }`.

Key implementation details:
- The `require()` call happens at module scope (top of file), not inside the hook. This avoids repeated try-catch on every render.
- The hook itself is a normal React hook that calls `useLicense()` from the cached module reference. This satisfies the rules of hooks (no conditional hook calls).
- When `licenseDetected` is false, the hook returns early before any hook calls. This is safe because the branch is stable for the lifetime of the module.

### `ProWatermark` Implementation

Each pro package gets its own copy at `src/lib/pro-watermark.tsx`. The component:
- Calls `useLicenseCheck()` internally.
- Returns `null` when licensed or loading.
- Renders a `<div>` with inline styles when unlicensed: `position: absolute`, `inset: 0`, `z-index: 2147483647`, `pointer-events: none`, `opacity: 0.12`, monospace "UNLICENSED" text.
- Fires `console.warn` once per mount in development mode with the package name and a link to `tourkit.dev/pricing`.
- Sets `aria-hidden="true"` so screen readers ignore the watermark.

### Provider Integration Pattern

For the 5 packages with providers (analytics, announcements, checklists, adoption, ai):

```tsx
// BEFORE
return (
  <SomeContext.Provider value={contextValue}>
    {children}
  </SomeContext.Provider>
)

// AFTER
return (
  <SomeContext.Provider value={contextValue}>
    <div style={{ position: 'relative' }}>
      {children}
      <ProWatermark />
    </div>
  </SomeContext.Provider>
)
```

### Media Package (HOC pattern)

Create `packages/media/src/lib/with-license-check.tsx` as a higher-order component that wraps any component in a relative container with `<ProWatermark />`. Apply to all exported embed components: `YouTubeEmbed`, `VimeoEmbed`, `LoomEmbed`, `WistiaEmbed`, `GifPlayer`, `LottiePlayer`.

### Scheduling Package (ScheduleGate + hook warning)

1. Create `packages/scheduling/src/components/schedule-gate.tsx` — a component that wraps children with a relative container and `<ProWatermark />`. Export from package index.
2. In `packages/scheduling/src/hooks/use-schedule.ts`, call `useLicenseCheck()` and fire `console.warn` once per mount in dev mode when unlicensed.

### Execution Order

1. Task 3.1: Update all 7 `package.json` files with optional peer dep.
2. Task 3.2: Build `use-license-check.ts` and `pro-watermark.tsx` in `@tour-kit/analytics` first as the template.
3. Tasks 3.3-3.9: Integrate into each package, copying from analytics. Adjust for media (HOC) and scheduling (ScheduleGate + hook).
4. Task 3.10: Write integration tests for all 7 packages.
5. Task 3.11: Verify free packages are clean.
6. Run `pnpm build && pnpm typecheck && pnpm test` to confirm everything passes.

### Per-Package Notes

- **analytics**: Simplest integration. `AnalyticsProvider` in `src/core/context.tsx` is a thin context wrapper.
- **announcements**: Has queue system and frequency rules. Watermark must not interfere with announcement display logic. Provider is at `src/context/announcements-provider.tsx`.
- **checklists**: Has task dependencies and progress calculation. Provider is at `src/context/checklist-provider.tsx`.
- **adoption**: Has nudge scheduler. Provider is at `src/context/adoption-provider.tsx`.
- **media**: No provider. Exports embed components directly. Use `withLicenseCheck()` HOC on each exported embed component.
- **scheduling**: Hooks-only. Exports `useSchedule`, `useScheduleStatus`, utility functions. Create `<ScheduleGate>` as new component export. Add `console.warn` inside `useSchedule` hook.
- **ai**: `AiChatProvider` at `src/context/ai-chat-provider.tsx` wraps the chat interface.

---

## Readiness Check

Before starting Phase 3, verify:

- [ ] Phase 2 is complete: `@tour-kit/license` builds, exports `LicenseProvider`, `LicenseGate`, `LicenseWatermark`, `LicenseWarning`, `useLicense`, `useIsPro`
- [ ] `pnpm build --filter=@tour-kit/license` succeeds with bundle < 3KB gzipped
- [ ] Phase 2 tests pass: `pnpm test --filter=@tour-kit/license`
- [ ] All 7 pro package providers/components are identified and their file paths confirmed
- [ ] `pnpm build && pnpm typecheck` passes for the full monorepo (clean baseline)
- [ ] Free package bundle sizes recorded as baseline for comparison in Task 3.11

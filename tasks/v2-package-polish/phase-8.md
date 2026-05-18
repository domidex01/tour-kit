# Phase 8 — License Trial Tier + Dev Clarity

**Duration:** Days 41–45 (~8–12 hours)
**Depends on:** Phase 0 task 0.6 (trial-tier go/no-go signed off in `phase-0-validation.md`) — the binary decision is "Polar API has no `tier` field; trial state is client-derived from `issuedAt + trialDays`" (confirmed by Polar API inspection — see memory `project_polar_api_findings.md` / entry #187).
**Blocks:** Nothing direct. The phase closes the **M5 milestone gate** in `big-plan.md` and is a prerequisite for the v2 GA narrative ("you have 14 days left" surface exists, dev bypass UX is unambiguous, QA can simulate license failure without env-var dances).
**Risk Level:** HIGH — trial-derivation logic is read by `<LicenseWatermark>` and every package that calls `useIsPro()` (announcements, surveys, checklists, adoption, ai, hints, react). A miscalibrated `daysLeft` or a `<LicenseTestMode>` that leaks into production would either watermark paying customers or strip the watermark from genuinely unlicensed deploys. Both failure modes are user-visible and brand-damaging.
**Stack:** react

---

## Objective

Close the three license-UX gaps the demo surfaced during dashboard-next QA:

1. **Trial countdown surface.** Add `<TrialBadge daysLeft={n} />` that consumes `useLicense()` and renders a countdown ("14 days left") that decrements daily and converts to an **"Upgrade"** CTA when `daysLeft <= 3`. Because Polar's `/v1/customer-portal/license-keys/validate` endpoint has **no `tier` field** (memory #187 — the response includes `id`, `status`, `benefit_id`, `customer`, `key`, `display_key`, `limit_activations`, `usage`, `limit_usage`, `validations`, `last_validated_at`, `expires_at` only), trial state is **client-derived** from a new `trialDays` prop on `<LicenseProvider>` combined with `last_validated_at` (the Polar-supplied anchor that prevents client-clock drift). The Zod schema in `packages/license/src/lib/schemas.ts` does **not** gain a `tier` field — if Polar ships server-side trial signalling in a future API revision, a follow-up minor adds it as an optional override.
2. **Dev bypass clarity.** Ship `<LicenseDebugPanel>` — a dev-only, opt-in component that consumers can drop into a `/dev` or `/admin` route to inspect the current license state. The panel replaces the ambiguous `status: valid, renderKey: dev_bypass` line (which the user reported as confusing during demo recording) with explicit, copy-asserted text: `🟢 Dev bypass active (NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY set, hostname=localhost)`. Renders nothing in production (`process.env.NODE_ENV === 'production'`).
3. **Real-domain failure simulation.** Ship `<LicenseTestMode tier="invalid">` — a Provider that wraps `<LicenseProvider>` and **overrides the live license context value** with a simulated state so QA can verify the watermark, adoption gate, and Pro fallbacks on a real production-like domain without unsetting env vars or hitting the live Polar API. Includes a loud production warning, a CI lint rule forbidding imports outside `__tests__/` and `examples/`, and a documented schema-migration plan for when Polar adds server-side trial signalling.

All three components live in `@tour-kit/license` (the only package that should own license UI). Zero new external dependencies. Backwards compatible: existing `<LicenseProvider>` consumers that don't pass `trialDays` see zero behaviour change.

---

## What Success Looks Like

1. `<TrialBadge daysLeft={14} />` renders the literal text `"14 days left"` on day 0 — verified by a Vitest test using `vi.useFakeTimers()` and `vi.setSystemTime(issuedAt)`.
2. `<TrialBadge />` (no prop) reads `daysLeft` from `useLicense()` context (computed via the helper `getDaysLeft({ issuedAt, trialDays }, lastValidatedAt)`) and decrements correctly across day boundaries — verified by parameterized boundary tests at days 0, 1, 7, 11, 14, 15, and 30 inputs.
3. `<TrialBadge />` becomes an **"Upgrade"** CTA (anchor element with `href` pointing at `pricingUrl`) when `daysLeft <= 3` — asserted with `getByRole('link', { name: /upgrade/i })`.
4. `<LicenseDebugPanel>` rendered inside a `<LicenseProvider>` with `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY` set and `hostname=localhost` shows the literal copy `🟢 Dev bypass active (NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY set, hostname=localhost)` — asserted via `getByText` with the exact string.
5. `<LicenseDebugPanel>` renders **nothing** (returns `null`) in production builds — verified by a test that sets `process.env.NODE_ENV = 'production'` and asserts `container.firstChild === null`.
6. `<LicenseTestMode tier="invalid"><LicenseWatermark /></LicenseTestMode>` renders the unlicensed watermark on `dashboard-next` (a real domain in CI test) **without** touching `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY` — verified by an integration test that asserts the watermark portal node exists and `useIsPro() === false` from the wrapped subtree.
7. `<LicenseTestMode>` mounted with `process.env.NODE_ENV === 'production'` emits exactly one `console.warn` containing the literal substring `"<LicenseTestMode> active in production"` — asserted with `vi.spyOn(console, 'warn')`.
8. The Zod schema in `packages/license/src/lib/schemas.ts` does **not** include a `tier` field (regression test: `expect(PolarValidateResponseSchema.shape).not.toHaveProperty('tier')`).
9. ESLint custom rule `no-license-test-mode-in-src` flags any import of `<LicenseTestMode>` from a path outside `**/__tests__/**` or `**/examples/**` — verified by a fixture test that runs ESLint programmatically against a synthetic offending file.
10. `pnpm --filter @tour-kit/license typecheck && pnpm --filter @tour-kit/license test -- --run` exits 0.
11. New docs page `apps/docs/content/docs/license/trial.mdx` renders in dev (`pnpm --filter docs dev`) and contains a runnable `<TrialBadge>` example plus the schema-migration plan paragraph.

---

## What Failure Looks Like (and what to do)

- **Client-derived `daysLeft` drifts on machines with skewed system clocks** (laptop time off by 6 days) → use the Polar-supplied `last_validated_at` as the trusted anchor, not `Date.now()` alone. Formula: `daysLeft = clamp(trialDays - floor((now - lastValidatedAt) / 86_400_000), 0, trialDays)`. Cache `lastValidatedAt` in `LicenseState.validatedAt` (already present — see `packages/license/src/types/index.ts:42`). Add a parameterized test for `now = lastValidatedAt + 100 years` proving the clamp pins to 0, not negative.
- **`<LicenseTestMode>` leaks into a production bundle** → three-layer defense: (1) custom ESLint rule blocks imports outside `__tests__/` and `examples/`; (2) runtime `console.warn` when `process.env.NODE_ENV === 'production'`; (3) `tsup` external in `packages/license/tsup.config.ts` is **not** modified — the component ships in the public bundle on purpose so consumers can drop it into a staging branch, but the ESLint rule and warn are the safety net. Document in JSDoc that ungated production use is unsupported.
- **`<TrialBadge>` shows wrong `daysLeft` on a real trial when the consumer forgets to pass `trialDays`** → `useLicense()` returns `trialDays === undefined`; `<TrialBadge>` renders `null` (graceful degradation) and emits one `console.warn` in dev (`"<TrialBadge> rendered without trialDays — pass trialDays to <LicenseProvider> to enable the trial countdown surface."`). The "no trial" path is **not** an error — it's the default for paying customers.
- **Polar adds server-side `tier` field in a future API revision** → schema migration plan documented in `apps/docs/content/docs/license/trial.mdx`: when present, server-emitted `tier="trial"` overrides client-derived value (`getDaysLeft` returns the server value if `tier === 'trial'` is present on `LicenseState`; otherwise computes client-side). This is a non-breaking addition. Add a `// FUTURE:` comment in `getDaysLeft` marking the override point so the follow-up PR is one focused diff.
- **A consumer passes a `trialDays` of 0 or negative** → Zod schema `LicenseProviderProps` extension (we'll add `trialDays: z.number().int().positive().optional()` to a runtime-validated config helper, not the Zod-from-Polar schema) coerces invalid values to `undefined` with one dev `console.warn`. Never throw; throwing during render would tank consumer apps mid-trial.
- **Two `<LicenseProvider>` instances mount with different `trialDays`** (e.g., one in a parent layout, one inside a marketing modal) → the inner provider wins per React context semantics. Document in `trial.mdx` so reviewers don't add a "must be the only provider" assertion. No runtime check.
- **ESLint custom rule false-positives on legitimate test imports** (e.g., a Storybook story imports `<LicenseTestMode>` for demo purposes) → allow-list `**/*.stories.tsx` and `**/*.story.tsx` in the rule's `excludedFiles` glob. Recorded as part of the lint-rule deliverable.

---

## Architecture / Key Design Decisions

```
┌─────────────────────────────────────────────────────────────────┐
│            @tour-kit/license (the only license-UI owner)        │
│                                                                 │
│  src/lib/trial.ts            ← getDaysLeft({ issuedAt,          │
│  (NEW, headless)               trialDays }, lastValidatedAt)    │
│                              ← TrialConfig type                 │
│                                                                 │
│  src/context/license-context.tsx     UPDATED                    │
│    LicenseProviderProps gains `trialDays?: number`              │
│    LicenseContextValue gains `trial: TrialContextValue | null`  │
│                                                                 │
│  src/components/                                                │
│    trial-badge.tsx           ← <TrialBadge /> (countdown +      │
│    (NEW)                       Upgrade CTA at daysLeft <= 3)    │
│    license-debug-panel.tsx   ← dev-only panel; null in prod;    │
│    (NEW)                       copy-asserted dev-bypass text    │
│    license-test-mode.tsx     ← Provider that overrides context  │
│    (NEW)                       with simulated tier; warns in    │
│                                production                       │
└─────────────────────────────────────────────────────────────────┘
                       ▲
                       │ consumed unchanged by:
                       │
       ┌───────────────┼───────────────┐
       │               │               │
 <LicenseWatermark>  useIsPro()  <LicenseGate>
 (existing — no      (existing —  (existing — no
  diff needed)        no diff)     diff needed)
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| Trial config passed to `<LicenseProvider>` | `interface TrialConfig { issuedAt: number; trialDays: number }` (exported) | Consumers extend; minimal surface; `issuedAt` is a Unix ms timestamp so the consumer can derive it from any storage backend |
| Helper return | `number` (just `daysLeft`) | One purpose, one return; no over-engineering |
| `LicenseContextValue.trial` | `{ daysLeft: number; isTrialing: boolean } \| null` (`null` when no `trialDays` configured) | Three states (no trial / trialing / expired) collapse to two via `isTrialing` + `daysLeft === 0`; consumers branch on `trial !== null` |
| `<LicenseTestMode>` prop | Discriminated union `\| { tier: 'invalid' } \| { tier: 'pro' } \| { tier: 'free' }` | Closed set; type-safe; no escape hatch |
| Polar Zod schema (`PolarValidateResponseSchema`) | **Unchanged** — does NOT gain `tier` | Polar API does not emit `tier` (memory #187); adding a field that's never validated would lie about the wire contract |

**Critical rules for this phase:**

- **Polar Zod schema stays put.** Do not add `tier: z.enum(['free', 'pro', 'trial'])` to `PolarValidateResponseSchema` — the API doesn't emit it, and a Zod schema that diverges from the wire contract is a maintenance trap. Trial state is a **client concern** (consumer passes `trialDays`, helper computes `daysLeft`). A regression test pins this constraint.
- **`getDaysLeft` is a pure helper, not a hook.** Lives in `src/lib/trial.ts` (re-exported from `headless.ts`) so it's tree-shakeable and testable without React. Signature: `function getDaysLeft(config: TrialConfig, lastValidatedAt: number, now?: number): number`. `now` defaults to `Date.now()` but is injected in tests.
- **`<LicenseTestMode>` overrides context, not state.** It is a React Provider that supplies a synthetic `LicenseContextValue` with the simulated `state.status`, `state.tier`, and `state.renderKey`. It does **not** call Polar, does **not** touch localStorage, and does **not** stub `fetch`. Pure context-value swap so the swap is reversible and detectable in tests.
- **`<LicenseDebugPanel>` is dev-only by construction.** Returns `null` in production. Does not need to be tree-shaken out (the bundle cost is ~300 bytes), but the JSDoc makes the intent explicit and the test pins the null-render.
- **No new animations.** All three components ship without DOM transitions, so the three-tier reduced-motion defense from `CLAUDE.md` does not apply. The `<TrialBadge>` Upgrade-CTA transition is a class swap, not a keyframe.
- **`'use client'` directive.** `<TrialBadge>`, `<LicenseDebugPanel>`, and `<LicenseTestMode>` all read `useLicense()` or `process.env.NODE_ENV` at render time → they're client components. Stamp `'use client'` at file top. `getDaysLeft` is pure → no directive (consumed by both client and headless entry).

---

## Tasks

### Task 8.1 — Client-derived trial helper + types (`packages/license/src/lib/trial.ts`) (1–2 h)

**Depends on:** Phase 0 task 0.6 (signed-off decision: client-derived from `issuedAt + trialDays`).

Create the pure helper plus its types. **No React.** Re-export from `src/headless.ts` so consumers can compute trial state in middleware, RSC, or scripts without pulling React.

```ts
// packages/license/src/lib/trial.ts

/**
 * Consumer-supplied trial configuration. Passed to <LicenseProvider trialDays={14} />
 * along with the implicit `issuedAt` derived from the license's first validation
 * (or a future server-side field when Polar ships one).
 *
 * Polar's /v1/customer-portal/license-keys/validate endpoint does NOT emit a
 * `tier` field today (confirmed Phase 0 task 0.6, memory project_polar_api_findings.md).
 * Trial state is therefore CLIENT-DERIVED. If Polar adds server-side trial
 * signalling later, getDaysLeft will accept an optional server-provided override
 * (marked `// FUTURE:` below) — additive, non-breaking.
 */
export interface TrialConfig {
  /** Unix ms timestamp of when the trial started. Sourced from license issuance time. */
  issuedAt: number
  /** Length of the trial window in whole days. E.g. 14. */
  trialDays: number
}

/**
 * Compute days remaining in the trial window. Uses `lastValidatedAt` (the
 * trusted Polar-supplied server anchor — see `LicenseState.validatedAt`) instead
 * of `Date.now()` alone to absorb client clock skew. Clamps to [0, trialDays].
 *
 * @param config The trial config from <LicenseProvider>.
 * @param lastValidatedAt Unix ms timestamp from Polar's `last_validated_at`.
 *                        Falls back to `now` if 0 (unvalidated state).
 * @param now Override for testing. Defaults to Date.now().
 * @returns Integer days remaining in [0, trialDays].
 */
export function getDaysLeft(
  config: TrialConfig,
  lastValidatedAt: number,
  now: number = Date.now(),
): number {
  const anchor = lastValidatedAt > 0 ? lastValidatedAt : now
  const elapsedMs = Math.max(0, anchor - config.issuedAt)
  const elapsedDays = Math.floor(elapsedMs / 86_400_000)
  const remaining = config.trialDays - elapsedDays
  // FUTURE: if Polar adds `tier: 'trial'` to the validate response, server-emitted
  // value overrides this client computation. Wire here behind an optional 4th arg.
  return Math.max(0, Math.min(config.trialDays, remaining))
}
```

Add `__tests__/trial.test.ts` with parameterized cases:

```ts
import { describe, expect, it } from 'vitest'
import { getDaysLeft } from '../lib/trial'

const DAY = 86_400_000
const ISSUED = 1_700_000_000_000 // arbitrary fixed Unix ms

describe('getDaysLeft', () => {
  it.each([
    // [trialDays, daysElapsed, expected]
    [14, 0, 14],
    [14, 1, 13],
    [14, 7, 7],
    [14, 11, 3], // boundary: upgrade-CTA threshold
    [14, 13, 1],
    [14, 14, 0],
    [14, 15, 0], // clamp negative
    [14, 30, 0], // far-past clamp
    [14, -5, 14], // clamp future (clock-skew protection)
  ])('trialDays=%i, daysElapsed=%i → %i', (trialDays, daysElapsed, expected) => {
    const lastValidatedAt = ISSUED + daysElapsed * DAY
    expect(getDaysLeft({ issuedAt: ISSUED, trialDays }, lastValidatedAt)).toBe(expected)
  })

  it('falls back to `now` when lastValidatedAt is 0', () => {
    const now = ISSUED + 5 * DAY
    expect(getDaysLeft({ issuedAt: ISSUED, trialDays: 14 }, 0, now)).toBe(9)
  })

  it('absorbs 6-day forward clock skew via lastValidatedAt anchor', () => {
    const skewedNow = ISSUED + 20 * DAY // laptop clock 20 days fast
    const realLastValidated = ISSUED + 5 * DAY // server says 5 days in
    expect(getDaysLeft({ issuedAt: ISSUED, trialDays: 14 }, realLastValidated, skewedNow)).toBe(9)
  })
})
```

Re-export from `src/headless.ts`:

```ts
export { getDaysLeft } from './lib/trial'
export type { TrialConfig } from './lib/trial'
```

**Sanity check:** `pnpm --filter @tour-kit/license typecheck && pnpm --filter @tour-kit/license test -- --run trial` exits 0; helper is pure (no React import — verified by `grep -L "react" src/lib/trial.ts`).

---

### Task 8.2 — `<TrialBadge>` component + `<LicenseProvider>` wiring (3–4 h)

**Depends on:** 8.1.

#### 8.2a — Extend `LicenseProvider` and context

Update `packages/license/src/types/index.ts`:

```ts
export type LicenseProviderProps = {
  licenseKey: string
  organizationId?: string
  /**
   * Optional trial length in days. When set, <LicenseProvider> exposes a
   * `trial` slice on the context and <TrialBadge /> renders a countdown.
   * See Phase 0 task 0.6 — client-derived from issuedAt + trialDays because
   * Polar does not emit a `tier` field today.
   */
  trialDays?: number
  /**
   * Optional explicit trial start time. Defaults to LicenseState.validatedAt
   * (the moment we first validated the key against Polar) when not provided.
   */
  trialIssuedAt?: number
  children: React.ReactNode
  onValidate?: (state: LicenseState) => void
  onError?: (error: Error) => void
}

export type TrialContextValue = {
  daysLeft: number
  isTrialing: boolean
}

export type LicenseContextValue = {
  state: LicenseState
  refresh: () => Promise<void>
  isGated: boolean
  isLoading: boolean
  gracePeriodActive: boolean
  /** null when <LicenseProvider> has no trialDays configured */
  trial: TrialContextValue | null
}
```

Update `packages/license/src/context/license-context.tsx`:

- Read `trialDays` and `trialIssuedAt` from props.
- After `state` updates (in the `useMemo` block already at line ~104), compute `trial` using `getDaysLeft({ issuedAt: trialIssuedAt ?? state.validatedAt, trialDays }, state.validatedAt)`. Return `null` when `trialDays === undefined`.
- Spread `trial` into the context `value`.
- One dev `console.warn` if `trialDays` is set but `trialDays <= 0`: clamp to `undefined` (graceful) and warn `"<LicenseProvider> received non-positive trialDays; ignoring"`.

#### 8.2b — Build `<TrialBadge>`

`packages/license/src/components/trial-badge.tsx`:

```tsx
'use client'

import { useLicense } from '../hooks/use-license'

export type TrialBadgeProps = {
  /** Override daysLeft from context. When omitted, reads from useLicense().trial.daysLeft. */
  daysLeft?: number
  /** URL the Upgrade CTA links to. Defaults to the @tour-kit/license pricing page. */
  pricingUrl?: string
  /** Custom render — receives the resolved daysLeft + isTrialing flag. */
  children?: (props: { daysLeft: number; isTrialing: boolean; isUrgent: boolean }) => React.ReactNode
  className?: string
}

const UPGRADE_CTA_THRESHOLD = 3

export function TrialBadge({ daysLeft: daysLeftProp, pricingUrl, children, className }: TrialBadgeProps) {
  const ctx = useLicense()
  const resolved = daysLeftProp ?? ctx?.trial?.daysLeft

  if (resolved === undefined) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        '<TrialBadge> rendered without trialDays — pass trialDays to <LicenseProvider> to enable the trial countdown surface.',
      )
    }
    return null
  }

  const isTrialing = resolved > 0
  const isUrgent = resolved <= UPGRADE_CTA_THRESHOLD

  if (children) return <>{children({ daysLeft: resolved, isTrialing, isUrgent })}</>

  if (!isTrialing || isUrgent) {
    return (
      <a
        href={pricingUrl ?? 'https://tour-kit.dev/pricing'}
        className={className}
        data-trial-state="upgrade"
        aria-label="Upgrade — trial ending soon"
      >
        Upgrade
      </a>
    )
  }

  return (
    <span className={className} data-trial-state="active" aria-label={`${resolved} days left in trial`}>
      {resolved} days left
    </span>
  )
}
```

Export from `src/index.ts` barrel.

#### 8.2c — Tests

`packages/license/src/__tests__/trial-badge.test.tsx`:

- Renders `"14 days left"` when `daysLeft={14}`.
- Renders `"3 days left"` text when `daysLeft={4}` (above threshold).
- Becomes Upgrade `<a>` when `daysLeft={3}`, `daysLeft={1}`, `daysLeft={0}` (boundary sweep).
- With `vi.useFakeTimers()` and re-rendered context, transitions from "11 days left" → "Upgrade" anchor when fake time jumps to day 11.
- Renders `null` and emits one dev warn when context has no `trial` slice and no `daysLeft` prop.
- Headless `children` render-prop receives `{ daysLeft: 7, isTrialing: true, isUrgent: false }`.
- Custom `pricingUrl` is honored on the Upgrade anchor's `href`.

**Sanity check:** `pnpm --filter @tour-kit/license test -- --run trial-badge` exits 0; snapshot of the Upgrade-CTA path matches the literal string `"Upgrade"`.

---

### Task 8.3 — `<LicenseDebugPanel>` (1–2 h)

**Depends on:** —

`packages/license/src/components/license-debug-panel.tsx`:

```tsx
'use client'

import { useLicense } from '../hooks/use-license'
import { isDevEnvironment } from '../lib/domain'

export type LicenseDebugPanelProps = {
  className?: string
  /** When false (default), renders null in production. Set true to force-render at consumer's risk. */
  showInProduction?: boolean
}

/**
 * Drop into a dev/admin route to inspect the current license state. Renders
 * nothing in production by default. Specifically replaces the ambiguous
 * `status: valid, renderKey: dev_bypass` log line that the dashboard-next demo
 * surfaced as confusing.
 */
export function LicenseDebugPanel({ className, showInProduction = false }: LicenseDebugPanelProps) {
  const ctx = useLicense()
  const inProd = process.env.NODE_ENV === 'production'
  if (inProd && !showInProduction) return null
  if (!ctx) return null

  const { state, trial } = ctx
  const devBypassActive = state.renderKey === 'dev_bypass'
  const localhost = isDevEnvironment()
  const hasEnvKey = Boolean(
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY,
  )

  return (
    <section
      className={className}
      data-tour-kit-license-debug-panel=""
      aria-label="Tour Kit license debug panel"
    >
      <h2>Tour Kit License — Debug</h2>
      {devBypassActive ? (
        <p data-state="dev-bypass">
          🟢 Dev bypass active ({hasEnvKey ? 'NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY set' : 'no env key'},
          hostname={localhost ? 'localhost' : 'production'})
        </p>
      ) : (
        <p data-state={state.status}>
          Status: <strong>{state.status}</strong> · Tier: <strong>{state.tier}</strong> · Domain:{' '}
          <strong>{state.domain ?? 'unset'}</strong>
        </p>
      )}
      {trial && (
        <p data-trial-active={trial.isTrialing}>
          Trial: <strong>{trial.daysLeft}</strong> days left
        </p>
      )}
    </section>
  )
}
```

Export from `src/index.ts`.

#### Tests

`packages/license/src/__tests__/license-debug-panel.test.tsx`:

- Asserts the **exact** literal string `🟢 Dev bypass active (NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY set, hostname=localhost)` appears when wrapped in a `<LicenseProvider>` with `licenseKey="foo"` and `localhost` hostname mock. Use `getByText` with the exact string — copy regression must be a hard fail.
- Returns `null` in production (`process.env.NODE_ENV = 'production'`, `container.firstChild === null`).
- Renders trial line when `trial` is present in context.
- Renders status line (not dev-bypass line) when `renderKey !== 'dev_bypass'`.

**Sanity check:** `pnpm --filter @tour-kit/license test -- --run license-debug-panel` exits 0; copy-assertion is a literal-string match (no regex).

---

### Task 8.4 — `<LicenseTestMode>` provider + ESLint rule + integration tests (3–4 h)

**Depends on:** 8.1, 8.2, 8.3.

#### 8.4a — Build `<LicenseTestMode>`

`packages/license/src/components/license-test-mode.tsx`:

```tsx
'use client'

import { useEffect, useMemo } from 'react'
import { LicenseContext, LicenseRenderContext } from '../context/license-context'
import type { LicenseContextValue, LicenseState } from '../types'

export type LicenseTestModeProps =
  | { tier: 'invalid'; children: React.ReactNode }
  | { tier: 'pro'; children: React.ReactNode }
  | { tier: 'free'; children: React.ReactNode }

/**
 * QA-only: override <LicenseProvider> context with a simulated state so the
 * watermark, adoption gate, and Pro fallbacks can be verified on a real
 * production-like domain without unsetting NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY or
 * hitting Polar.
 *
 * MUST NOT be imported from application src/. Use only in __tests__/ and
 * examples/. Enforced by the `no-license-test-mode-in-src` ESLint rule.
 */
export function LicenseTestMode(props: LicenseTestModeProps) {
  const { tier, children } = props

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        '<LicenseTestMode> active in production — this overrides real license state and MUST be removed before deploy.',
      )
    }
  }, [])

  const value = useMemo<LicenseContextValue>(() => {
    const state: LicenseState =
      tier === 'pro'
        ? {
            status: 'valid',
            tier: 'pro',
            activations: 1,
            maxActivations: 5,
            domain: 'test-mode.local',
            expiresAt: null,
            validatedAt: Date.now(),
            renderKey: 'test_mode_pro',
          }
        : tier === 'free'
          ? {
              status: 'valid',
              tier: 'free',
              activations: 0,
              maxActivations: 0,
              domain: null,
              expiresAt: null,
              validatedAt: Date.now(),
              renderKey: undefined,
            }
          : {
              status: 'invalid',
              tier: 'free',
              activations: 0,
              maxActivations: 0,
              domain: null,
              expiresAt: null,
              validatedAt: Date.now(),
              renderKey: undefined,
            }

    return {
      state,
      refresh: async () => {},
      isGated: tier !== 'pro',
      isLoading: false,
      gracePeriodActive: false,
      trial: null,
    }
  }, [tier])

  return (
    <LicenseContext.Provider value={value}>
      <LicenseRenderContext.Provider value={value.state.renderKey}>
        {children}
      </LicenseRenderContext.Provider>
    </LicenseContext.Provider>
  )
}
```

Export from `src/index.ts`.

#### 8.4b — ESLint rule

`packages/license/eslint-rules/no-license-test-mode-in-src.js`:

```js
/**
 * Forbid importing <LicenseTestMode> outside __tests__/, examples/, *.stories.*,
 * and *.story.* files. The component overrides license state and must not ship
 * in application source code.
 */
module.exports = {
  meta: {
    type: 'problem',
    messages: {
      noTestModeInSrc:
        '<LicenseTestMode> may only be imported from __tests__/, examples/, or Storybook stories. Move this import or use <LicenseProvider> instead.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename()
    const allowedPatterns = [/__tests__/, /\/examples\//, /\.stories\.(t|j)sx?$/, /\.story\.(t|j)sx?$/]
    const allowed = allowedPatterns.some((p) => p.test(filename))

    return {
      ImportDeclaration(node) {
        if (allowed) return
        const isLicensePackage = node.source.value === '@tour-kit/license'
        if (!isLicensePackage) return
        const importsTestMode = node.specifiers.some(
          (s) => s.imported && s.imported.name === 'LicenseTestMode',
        )
        if (importsTestMode) {
          context.report({ node, messageId: 'noTestModeInSrc' })
        }
      },
    }
  },
}
```

Register in the workspace ESLint config and add `__tests__/lint-rule.test.ts` that runs the rule via `RuleTester` against a synthetic offending file (import from `@tour-kit/license` inside `packages/license/src/foo.tsx`) and an allowed file (same import inside `packages/license/src/__tests__/foo.test.tsx`).

#### 8.4c — Production-warning test

`packages/license/src/__tests__/license-test-mode.production-warning.test.tsx`:

- Stub `process.env.NODE_ENV = 'production'`.
- Mount `<LicenseTestMode tier="invalid"><div /></LicenseTestMode>`.
- Assert `console.warn` was called exactly once with a string containing `"<LicenseTestMode> active in production"`.
- Stub `process.env.NODE_ENV = 'development'`; mount again; assert `console.warn` was **not** called.

#### 8.4d — Watermark + adoption-gate propagation integration test

`packages/license/src/__tests__/license-test-mode.integration.test.tsx`:

- Render `<LicenseTestMode tier="invalid"><LicenseWatermark /><ProGateProbe /></LicenseTestMode>`.
- `<ProGateProbe>` is a local helper that calls `useIsPro()` and renders `is-pro: true` or `is-pro: false`.
- Assert the unlicensed watermark portal node is present in the DOM (`document.querySelector('[data-tour-kit-watermark]')` truthy — match the watermark's existing data attribute; if not present, fall back to text match `Tour Kit · Unlicensed`).
- Assert `getByText('is-pro: false')` is in the document.
- Switch the wrapper to `tier="pro"`; assert the watermark is absent and `is-pro: true`.

**Sanity check:** `pnpm --filter @tour-kit/license test -- --run license-test-mode` exits 0; the ESLint RuleTester smoke runs as part of the file.

#### 8.4e — Docs page

`apps/docs/content/docs/license/trial.mdx`:

- Frontmatter: `title: Trial countdown & test mode`, `description: Client-derived trial state, the <TrialBadge> surface, and how to simulate license failure on real domains.`
- §1 **Why client-derived** — Polar's `/v1/customer-portal/license-keys/validate` doesn't expose a `tier` field. We compute `daysLeft` from `issuedAt + trialDays` and anchor against `last_validated_at` to absorb client clock skew. Cite Phase 0 task 0.6.
- §2 **Adding the trial badge** — runnable example: `<LicenseProvider licenseKey={...} trialDays={14}>` + `<TrialBadge />`. Show the Upgrade-CTA transition at day 11.
- §3 **`<LicenseDebugPanel>`** — drop into `/dev` or `/admin` routes. Auto-hides in production.
- §4 **Simulating failure with `<LicenseTestMode>`** — show wrapping `<LicenseTestMode tier="invalid">` around an example page. Note the ESLint rule and the production warning. Explicitly call out: not for application source.
- §5 **Future: server-side trial signalling** — when Polar adds `tier="trial"` to validate, `getDaysLeft` accepts an optional override (`// FUTURE:` comment marks the override point). Non-breaking minor.

Add the page to `apps/docs/content/docs/license/meta.json` (or equivalent index file) so it appears in the sidebar.

**Sanity check:** `pnpm --filter docs build` exits 0; new page renders.

---

## Deliverables

```
packages/license/
├── src/
│   ├── lib/
│   │   └── trial.ts                                # NEW — getDaysLeft helper + TrialConfig type;
│   │                                               #       client-derived; pure (no React import)
│   ├── components/
│   │   ├── trial-badge.tsx                         # NEW — <TrialBadge daysLeft={n} />; countdown +
│   │   │                                           #       Upgrade CTA at daysLeft <= 3
│   │   ├── license-debug-panel.tsx                 # NEW — dev-only inspection panel; null in prod;
│   │   │                                           #       copy-asserted dev-bypass text
│   │   └── license-test-mode.tsx                   # NEW — Provider that overrides context with
│   │                                               #       simulated tier; warns in production
│   ├── context/
│   │   └── license-context.tsx                     # UPDATED — LicenseProviderProps gains
│   │                                               #           trialDays + trialIssuedAt; context
│   │                                               #           value gains `trial` slice
│   ├── types/
│   │   └── index.ts                                # UPDATED — TrialContextValue type, extended
│   │                                               #           LicenseProviderProps + LicenseContextValue
│   ├── headless.ts                                 # UPDATED — re-export getDaysLeft + TrialConfig
│   ├── index.ts                                    # UPDATED — re-export TrialBadge,
│   │                                               #           LicenseDebugPanel, LicenseTestMode
│   └── __tests__/
│       ├── trial.test.ts                           # NEW — parameterized boundary tests for
│       │                                           #       getDaysLeft (days 0/1/7/11/14/15/30/-5);
│       │                                           #       clock-skew test
│       ├── trial-badge.test.tsx                    # NEW — countdown text, Upgrade-CTA transition
│       │                                           #       at threshold, fake-timer day jump,
│       │                                           #       headless render-prop, null-without-config
│       ├── license-debug-panel.test.tsx            # NEW — literal copy assertion, null in prod
│       ├── license-test-mode.production-warning.test.tsx  # NEW — exactly-once warn in production
│       ├── license-test-mode.integration.test.tsx  # NEW — watermark + useIsPro propagation
│       ├── lint-rule.test.ts                       # NEW — ESLint RuleTester for
│       │                                           #       no-license-test-mode-in-src
│       └── schema-no-tier.regression.test.ts       # NEW — pin PolarValidateResponseSchema does
│                                                   #       NOT include `tier` (honors memory #187)
├── eslint-rules/
│   └── no-license-test-mode-in-src.js              # NEW — custom ESLint rule

apps/docs/
└── content/docs/license/
    ├── trial.mdx                                   # NEW — trial countdown + test-mode guide;
    │                                               #       includes schema-migration plan §5
    └── meta.json                                   # UPDATED — sidebar entry

eslint.config.mjs (or equivalent workspace ESLint config)  # UPDATED — register custom rule
```

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/license typecheck` exits 0.
- [ ] `pnpm --filter @tour-kit/license test -- --run` exits 0 with all new test files green:
  - `trial.test.ts` — ≥10 parameterized cases including boundary days (0/1/7/11/14/15/30/-5) and the clock-skew test.
  - `trial-badge.test.tsx` — countdown text matches `"14 days left"` literally; Upgrade `<a>` appears at `daysLeft <= 3`; `vi.useFakeTimers()` proves day-11 transition; null-without-config emits dev warn.
  - `license-debug-panel.test.tsx` — literal copy `🟢 Dev bypass active (NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY set, hostname=localhost)` asserted via `getByText` with exact-string match; `container.firstChild === null` in production.
  - `license-test-mode.production-warning.test.tsx` — `console.warn` called exactly once with `"<LicenseTestMode> active in production"`; not called in development.
  - `license-test-mode.integration.test.tsx` — watermark portal present and `useIsPro() === false` under `tier="invalid"`; absent and `true` under `tier="pro"`.
  - `lint-rule.test.ts` — RuleTester accepts imports from `__tests__/*`, `examples/*`, `*.stories.tsx`, `*.story.tsx`; rejects imports from `src/*.tsx`.
  - `schema-no-tier.regression.test.ts` — asserts `'tier' in PolarValidateResponseSchema.shape === false` (honors memory #187 constraint).
- [ ] `pnpm --filter docs build` exits 0 and `/docs/license/trial` renders in the sidebar with §1–§5 from Task 8.4e.
- [ ] No existing `@tour-kit/license` tests regress (`pnpm --filter @tour-kit/license test -- --run` exits 0 across the full suite, not just new files).
- [ ] `<TrialBadge />` consumed by a dogfooding mount inside `examples/dashboard-next/` (or equivalent example) renders without runtime warnings when `trialDays={14}` is passed to `<LicenseProvider>` — visual smoke check.
- [ ] `grep -rn "@tour-kit/license" packages/*/src --include="*.tsx" --include="*.ts" | grep -v __tests__ | grep "LicenseTestMode"` returns **zero hits** — proves the ESLint rule is doing its job (or, equivalently, the rule fires in CI).
- [ ] `LicenseDebugPanel` and `TrialBadge` and `LicenseTestMode` are re-exported from `packages/license/src/index.ts` — verified by `grep -E "TrialBadge|LicenseDebugPanel|LicenseTestMode" packages/license/src/index.ts` returning at least three matches.
- [ ] `getDaysLeft` and `TrialConfig` are re-exported from `packages/license/src/headless.ts` — verified by the same grep against `headless.ts`.
- [ ] Bundle size delta: `pnpm --filter @tour-kit/license build` succeeds; the gzipped size of `dist/index.js` increases by ≤ 1.5 KB (tracked manually in the PR description; the three new components total ~1.2 KB pre-gzip).

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to implement this phase:

---
You are building Phase 8 of Tour Kit v2 Package Polish — **License Trial Tier + Dev Clarity**.

### What This Project Is
Tour Kit is a pnpm + Turborepo monorepo of 12 packages providing headless React product-tour primitives (core, react, hints) plus pro packages (announcements, surveys, checklists, adoption, analytics, ai, scheduling, license, media). `@tour-kit/license` validates Polar.sh license keys, manages domain activations, caches results in localStorage (72h TTL), and provides React components for license-aware rendering. Free packages **must not** import `@tour-kit/license`; pro packages enforce licensing via `useLicenseCheck` / `useIsPro` / `<LicenseWatermark>`. Stack: TypeScript strict mode, React 18+, tsup, Vitest, Turborepo, pnpm, Zod for boundary validation.

### Critical Project Memory (DO NOT REDISCOVER)

**Polar API has no `tier` field** (memory `project_polar_api_findings.md` / entry #187). The `/v1/customer-portal/license-keys/validate` response is exactly:

```
id, status, benefit_id, customer, key, display_key,
limit_activations, usage, limit_usage, validations,
last_validated_at, expires_at
```

There is **no** `tier`, **no** `trial`, **no** `plan`, **no** `is_trial`. The Zod schema at `packages/license/src/lib/schemas.ts` (`PolarValidateResponseSchema`) reflects the actual wire contract. **Do not add `tier` to this Zod schema.** Phase 0 task 0.6 signed off on the client-derived fallback:

> Polar API cannot emit `tier="trial"` → Phase 8 derives `daysLeft` client-side from `issuedAt + trialDays` config.

This is the binary decision the whole phase is anchored on.

Polar additionally:
- Uses **snake_case** wire fields.
- Imposes **lifetime activation limits** (typically 5/key) — exceeded returns 403.
- Cache TTL is **72h** — set in `packages/license/src/lib/cache.ts`.

### Established in Prior Phases / Existing Code

- **`LicenseState` shape** (already in `packages/license/src/types/index.ts`):
  ```ts
  type LicenseState = {
    status: 'valid' | 'invalid' | 'expired' | 'revoked' | 'loading' | 'error'
    tier: 'free' | 'pro'                  // existing tier — NOT trial; trial is a separate slice
    activations: number
    maxActivations: number
    domain: string | null
    expiresAt: string | null
    validatedAt: number                   // Unix ms; SAME field used as the trusted server anchor
    renderKey: string | undefined         // 'dev_bypass' on localhost; real Polar key elsewhere
  }
  ```
- **`LicenseProviderProps`** (existing — to be extended): `{ licenseKey, organizationId?, children, onValidate?, onError? }`.
- **`LicenseContextValue`** (existing — to be extended): `{ state, refresh, isGated, isLoading, gracePeriodActive }`.
- **Dev-bypass canonical state** (`packages/license/src/lib/license-state.ts:48`): `status: 'valid'`, `tier: 'pro'`, `renderKey: 'dev_bypass'`. Triggered by `isDevEnvironment()` (localhost / 127.0.0.1 / *.local) **when a non-empty `licenseKey` is set** — missing key falls through to unlicensed state even on localhost (so the watermark appears before deploy).
- **`<LicenseWatermark>`** already exists at `packages/license/src/components/license-watermark.tsx` — singleton DOM ownership, portal rendering. No diff needed; `<LicenseTestMode>` propagates through it via context.
- **`<LicenseProvider>`** is at `packages/license/src/context/license-context.tsx`. Its `useMemo` block (~line 104) is where the new `trial` slice is computed.

### Your Goal for This Phase

1. **`<TrialBadge daysLeft={n} />`** — countdown surface that shows `"{n} days left"` and converts to an "Upgrade" CTA when `daysLeft <= 3`. Reads from `useLicense().trial` when no prop is passed.
2. **`<LicenseDebugPanel>`** — dev-only inspection component. Renders **the exact literal string** `🟢 Dev bypass active (NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY set, hostname=localhost)` when dev-bypass is active. Returns `null` in production.
3. **`<LicenseTestMode tier="invalid">`** — Provider that overrides `LicenseContext` with a simulated `LicenseState` so QA can verify watermark + Pro fallbacks on a real domain without env-var changes. Loud `console.warn` in production. CI lint rule forbids imports outside `__tests__/`, `examples/`, and Storybook files.
4. **`getDaysLeft({ issuedAt, trialDays }, lastValidatedAt, now?)`** — pure helper in `src/lib/trial.ts`. Uses Polar's `last_validated_at` (mirrored as `LicenseState.validatedAt`) as the trusted server anchor to absorb client clock skew. Clamps to `[0, trialDays]`.

### Data Model Rules (follow exactly)

- **`interface TrialConfig`** (exported) — `{ issuedAt: number; trialDays: number }`. Lives in `src/lib/trial.ts`. Re-exported from `headless.ts`.
- **`type TrialContextValue`** (exported) — `{ daysLeft: number; isTrialing: boolean } | null` slot in `LicenseContextValue`.
- **`LicenseProviderProps`** gains `trialDays?: number` and `trialIssuedAt?: number` (both optional, both omitted by default).
- **`LicenseTestModeProps`** is a discriminated union: `{ tier: 'invalid' | 'pro' | 'free'; children }`. Closed set, no escape hatch.
- **`PolarValidateResponseSchema` MUST NOT gain a `tier` field.** Polar doesn't emit it. Pin this with a regression test (`schema-no-tier.regression.test.ts`) that asserts `'tier' in PolarValidateResponseSchema.shape === false`.
- **`'use client'` directive** on all three components (they read context or `process.env` at render time). `trial.ts` is pure and has no directive.
- **No new external dependencies.** React + Zod (existing) + the existing license utilities are all you need. Reuse `isDevEnvironment()` from `src/lib/domain.ts`.

### Architecture

```
@tour-kit/license
  src/lib/trial.ts                   ← NEW: getDaysLeft + TrialConfig (pure, headless-safe)
  src/context/license-context.tsx    ← UPDATED: LicenseProviderProps gains trialDays/trialIssuedAt;
                                                 context value gains `trial` slice
  src/types/index.ts                 ← UPDATED: TrialContextValue type
  src/components/
    trial-badge.tsx                  ← NEW
    license-debug-panel.tsx          ← NEW
    license-test-mode.tsx            ← NEW
  src/headless.ts                    ← UPDATED: re-export getDaysLeft + TrialConfig
  src/index.ts                       ← UPDATED: re-export three new components
  eslint-rules/no-license-test-mode-in-src.js  ← NEW
  src/__tests__/                     ← NEW test files (7 listed in Deliverables)

apps/docs/content/docs/license/trial.mdx  ← NEW
apps/docs/content/docs/license/meta.json  ← UPDATED (sidebar slot)
```

### The `getDaysLeft` Formula (inline — do not re-derive)

```ts
export function getDaysLeft(config: TrialConfig, lastValidatedAt: number, now: number = Date.now()): number {
  const anchor = lastValidatedAt > 0 ? lastValidatedAt : now
  const elapsedMs = Math.max(0, anchor - config.issuedAt)
  const elapsedDays = Math.floor(elapsedMs / 86_400_000)
  const remaining = config.trialDays - elapsedDays
  // FUTURE: if Polar adds `tier='trial'` to the validate response, accept an
  // optional 4th arg `serverDaysLeft?: number` and return it when defined.
  return Math.max(0, Math.min(config.trialDays, remaining))
}
```

The clamp is the load-bearing line — clamps both negative (clock skew forward) and overflow (trial expired) cases.

### Per-File Implementation Guidance

#### `packages/license/src/lib/trial.ts` (NEW)
Pure helper. Export `TrialConfig` and `getDaysLeft`. No React import. No Zod import. Just two named exports and one type. ~25 lines including JSDoc.

#### `packages/license/src/types/index.ts` (UPDATED)
Add the `TrialContextValue` type before `LicenseContextValue`. Extend `LicenseContextValue` with `trial: TrialContextValue | null`. Extend `LicenseProviderProps` with `trialDays?: number` and `trialIssuedAt?: number`. Keep all existing fields. Update JSDoc to call out that trial is client-derived.

#### `packages/license/src/context/license-context.tsx` (UPDATED)
- Add `trialDays` and `trialIssuedAt` to the destructured props.
- In the existing `useMemo` block (~line 104), compute `trial`:
  ```ts
  const trial = useMemo<TrialContextValue | null>(() => {
    if (trialDays === undefined) return null
    if (trialDays <= 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('<LicenseProvider> received non-positive trialDays; ignoring')
      }
      return null
    }
    const issuedAt = trialIssuedAt ?? state.validatedAt
    if (issuedAt <= 0) return null
    const daysLeft = getDaysLeft({ issuedAt, trialDays }, state.validatedAt)
    return { daysLeft, isTrialing: daysLeft > 0 }
  }, [trialDays, trialIssuedAt, state.validatedAt])
  ```
- Spread `trial` into the context value.
- Import `getDaysLeft` from `'../lib/trial'`.

#### `packages/license/src/components/trial-badge.tsx` (NEW)
Implementation block already pasted above. Key behaviour: reads `useLicense().trial.daysLeft` if no prop; renders `null` + dev warn if neither is available; renders the **literal** text `"{n} days left"` when above the upgrade threshold (3); renders an `<a>` with text `"Upgrade"` when at/below threshold. Supports headless render-prop via `children`. Honors custom `pricingUrl` (defaults to `https://tour-kit.dev/pricing`).

#### `packages/license/src/components/license-debug-panel.tsx` (NEW)
Implementation block already pasted above. Key behaviour: returns `null` in production (unless `showInProduction` is set); renders the **exact** literal copy `🟢 Dev bypass active (NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY set, hostname=localhost)` when `state.renderKey === 'dev_bypass'` AND `isDevEnvironment()` is true AND the env key is set. The copy assertion in the test is a literal-string match — do not generalize the format.

#### `packages/license/src/components/license-test-mode.tsx` (NEW)
Implementation block already pasted above. Key behaviour: builds a synthetic `LicenseContextValue` per the `tier` prop, wraps children in both `LicenseContext.Provider` AND `LicenseRenderContext.Provider`. `useEffect` emits one `console.warn` on mount when `process.env.NODE_ENV === 'production'`. Note: import `LicenseContext` and `LicenseRenderContext` from `'../context/license-context'` — both are already exported there.

#### `packages/license/eslint-rules/no-license-test-mode-in-src.js` (NEW)
ESLint rule implementation pasted above. Register in the workspace ESLint config (the repo uses a flat config — check `eslint.config.mjs` at the workspace root and add the rule to the `@tour-kit/license` override block). Allow-list: `__tests__/*`, `examples/*`, `*.stories.tsx`, `*.story.tsx`.

#### `packages/license/src/__tests__/trial.test.ts` (NEW)
Parameterized boundary tests for `getDaysLeft`. Cover days elapsed: 0, 1, 7, 11 (Upgrade-CTA boundary), 13, 14 (boundary), 15 (clamp), 30 (far-past clamp), -5 (clock-skew clamp). Plus: `lastValidatedAt = 0` falls back to `now`; 6-day forward clock skew is absorbed by `lastValidatedAt` anchor.

#### `packages/license/src/__tests__/trial-badge.test.tsx` (NEW)
≥6 cases per "Tests" subsection above. Use `vi.useFakeTimers()` and `vi.setSystemTime()` to drive the day-11 transition. Use `getByText` with exact-string matching for the literal countdown text.

#### `packages/license/src/__tests__/license-debug-panel.test.tsx` (NEW)
≥4 cases. The dev-bypass-copy assertion is the load-bearing test — use `getByText` with the exact literal string (not a regex). Stub `process.env.NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY` and mock the hostname via the existing `isDevEnvironment` test pattern (see `packages/license/src/__tests__/license-provider.test.tsx` for the established hostname-mock idiom).

#### `packages/license/src/__tests__/license-test-mode.production-warning.test.tsx` (NEW)
Production-warning test. Use `vi.spyOn(console, 'warn')` and assert exactly-once invocation with the substring `"<LicenseTestMode> active in production"`. Restore `NODE_ENV` between cases.

#### `packages/license/src/__tests__/license-test-mode.integration.test.tsx` (NEW)
Integration test for context propagation. Render `<LicenseTestMode tier="invalid"><LicenseWatermark /><ProGateProbe /></LicenseTestMode>`. `<ProGateProbe>` is an inline test helper that calls `useIsPro()` and renders its boolean. Assert: watermark portal exists, `is-pro: false`. Then swap to `tier="pro"`: watermark absent, `is-pro: true`.

#### `packages/license/src/__tests__/lint-rule.test.ts` (NEW)
Use ESLint's `RuleTester`. Provide valid cases (imports from `__tests__`, `examples`, `.stories.tsx`) and invalid cases (import from `src/foo.tsx`). Assert the invalid cases produce the `noTestModeInSrc` message.

#### `packages/license/src/__tests__/schema-no-tier.regression.test.ts` (NEW)
One-line regression: `expect('tier' in PolarValidateResponseSchema.shape).toBe(false)`. Add a comment citing memory #187 and Phase 0 task 0.6 so future contributors understand the constraint.

#### `packages/license/src/headless.ts` (UPDATED)
Re-export `getDaysLeft` and `TrialConfig`. Do NOT re-export the React components from here — `headless.ts` is the React-free entry.

#### `packages/license/src/index.ts` (UPDATED)
Re-export `TrialBadge`, `LicenseDebugPanel`, `LicenseTestMode`, plus types `TrialBadgeProps`, `LicenseDebugPanelProps`, `LicenseTestModeProps`. Also re-export `getDaysLeft` and `TrialConfig` from here (full barrel).

#### `apps/docs/content/docs/license/trial.mdx` (NEW)
Sections §1–§5 per Task 8.4e. Include a `<TrialBadge>` runnable example and call out the schema-migration plan (future Polar `tier` field as additive, non-breaking).

#### `apps/docs/content/docs/license/meta.json` (UPDATED)
Slot `trial` after the existing license pages alphabetically. Verify the page appears in the sidebar at `/docs/license/trial`.

### Success Criteria (observable)

- `<TrialBadge daysLeft={14} />` renders the literal text `"14 days left"` (case-sensitive, plural).
- `<TrialBadge daysLeft={3} />` renders an `<a>` with text `"Upgrade"`.
- `<TrialBadge />` (no prop) reads from context; renders `null` + dev warn when no `trialDays` configured.
- `<LicenseDebugPanel>` shows the exact literal `🟢 Dev bypass active (NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY set, hostname=localhost)` when conditions hold.
- `<LicenseDebugPanel>` returns `null` (`container.firstChild === null`) in production.
- `<LicenseTestMode tier="invalid">` makes `useIsPro()` return `false` and renders the watermark; `tier="pro"` does the opposite.
- `<LicenseTestMode>` in production emits one `console.warn` matching `"<LicenseTestMode> active in production"`.
- ESLint rule rejects `LicenseTestMode` imports from `packages/license/src/foo.tsx`; allows them from `__tests__/*`, `examples/*`, `*.stories.tsx`.
- `PolarValidateResponseSchema.shape` does **not** include `tier`.
- `pnpm --filter @tour-kit/license typecheck && pnpm --filter @tour-kit/license test -- --run` exits 0.
- `pnpm --filter docs build` exits 0 with the new `trial.mdx` page.

### Expected File Structure at End

```
packages/license/
├── src/
│   ├── lib/
│   │   ├── trial.ts                                # NEW
│   │   ├── schemas.ts                              # unchanged (regression-pinned)
│   │   └── ... (existing)
│   ├── components/
│   │   ├── trial-badge.tsx                         # NEW
│   │   ├── license-debug-panel.tsx                 # NEW
│   │   ├── license-test-mode.tsx                   # NEW
│   │   └── ... (existing)
│   ├── context/license-context.tsx                 # UPDATED
│   ├── types/index.ts                              # UPDATED
│   ├── headless.ts                                 # UPDATED
│   ├── index.ts                                    # UPDATED
│   └── __tests__/
│       ├── trial.test.ts                           # NEW
│       ├── trial-badge.test.tsx                    # NEW
│       ├── license-debug-panel.test.tsx            # NEW
│       ├── license-test-mode.production-warning.test.tsx  # NEW
│       ├── license-test-mode.integration.test.tsx  # NEW
│       ├── lint-rule.test.ts                       # NEW
│       └── schema-no-tier.regression.test.ts       # NEW
└── eslint-rules/
    └── no-license-test-mode-in-src.js              # NEW

apps/docs/content/docs/license/
├── trial.mdx                                       # NEW
└── meta.json                                       # UPDATED

eslint.config.mjs                                   # UPDATED — register rule
```

Implement strictly within `packages/license/` (plus the docs page and one ESLint config edit). Do not touch `packages/announcements`, `packages/adoption`, or any other Pro package — they consume `useIsPro()` / `useLicense()` unchanged.

---

## Readiness Check

- [PASS] **All inputs from prior phases listed and available** — Phase 0 task 0.6 decision ("Polar API has no `tier` field; client-derived from `issuedAt + trialDays`") is cited verbatim three times in the plan (Objective, Critical Project Memory in Execution Prompt, JSDoc in `trial.ts`). Source-of-truth files are explicitly named: `packages/license/src/types/index.ts:42` for `validatedAt`, `packages/license/src/context/license-context.tsx` line ~104 for the `useMemo` extension point, `packages/license/src/lib/license-state.ts:48` for the dev-bypass canonical state. Memory entries `project_polar_api_findings.md` (#187) cited for the Polar wire-shape constraint.
- [PASS] **Every sub-task has a clear, testable completion condition** — each of 8.1–8.4 has a `Sanity check` one-liner (`pnpm --filter @tour-kit/license test -- --run <pattern>`). Exit Criteria lists 8 separate `[ ]` items mapping to deliverables.
- [PASS] **Execution prompt is self-contained** — prior facts pasted inline (Polar wire shape, dev-bypass state, existing types). The `getDaysLeft` formula is inline, not a "see somewhere" reference. TypeScript interfaces are pasted. Per-file guidance is one paragraph per file. Success criteria are observable (literal-string matches, boolean assertions, exit codes). No references to "see Phase 0" — the decision is restated.
- [PASS] **Exit criteria map 1:1 to deliverables** — every NEW/UPDATED file in the Deliverables tree appears in at least one Exit Criteria checkbox. The schema-no-tier regression test is explicit. The bundle-size delta is bounded (≤ 1.5 KB gzipped). The ESLint rule has its own exit row.
- [PASS] **Heavy external deps have a fake/stub strategy noted** — no heavy deps in Phase 8. Existing test patterns reused: `vi.stubGlobal('fetch', ...)`, `vi.useFakeTimers()`, `vi.spyOn(console, 'warn')`. ESLint `RuleTester` is part of `eslint` (already in workspace devDeps).
- [PASS] **New libraries have a confirmed snippet from Context7 in the execution prompt** — no new libraries. React 18+ (`useEffect`, `useMemo`, `useContext`), Zod (existing schema), and ESLint `RuleTester` (existing devDep) are the only primitives used. The "no new deps" constraint matches Phase 0 §5 peer-dep audit.

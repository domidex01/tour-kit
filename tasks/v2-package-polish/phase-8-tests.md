# Phase 8 — Testing: License Trial Tier + Dev Clarity

**Scope:** New pure helper `getDaysLeft({ issuedAt, trialDays, validatedAt, serverValidatedAt }, now?)` in `packages/license/src/lib/trial.ts`; extended `LicenseProviderProps` (`trialDays?`, `trialIssuedAt?`), `LicenseState.serverValidatedAt?`, and `LicenseContextValue.trial`; three new components (`<TrialBadge>`, `<LicenseDebugPanel>`, `<LicenseTestMode>`); a static guard script forbidding `<LicenseTestMode>` imports outside `__tests__/`, `examples/`, and Storybook files; a regression test pinning `PolarValidateResponseSchema` to NOT include `tier`; CHANGELOG + docs page.
**Key Pattern:** Pure-helper unit tests (boundary + clock-skew) + component tests with **literal copy assertions** (the dev-bypass string is the load-bearing UX guarantee) + production-warning + integration via the existing `<LicenseWatermark>` + a static guard that fails CI on production import + a schema regression test that pins the wire-contract decision recorded in memory #187.
**Dependencies:** vitest, @testing-library/react (jsdom), `vi.useFakeTimers()` + `vi.setSystemTime()` for day-boundary tests, Node built-ins for the static guard, existing `<LicenseProvider>` test idioms.

---

## 1. User Stories

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | As a Pro consumer on day 0 of a 14-day trial, I want to see "14 days left" | `trial-badge.test.tsx` with `daysLeft={14}` | `getByText('14 days left')` is in the document (exact-string match) |
| US-2 | As that consumer crossing into the last 3 days, I want the badge to flip to an "Upgrade" CTA | Same file with `daysLeft={3, 1, 0}` | `getByRole('link', { name: /upgrade/i })` is in the document with `href` ≠ `#` |
| US-3 | As a developer with skew (laptop clock off by 6 days), I want `getDaysLeft` to absorb skew via the server anchor | `trial.test.ts` clock-skew case | `getDaysLeft({issuedAt: I, trialDays: 14, validatedAt: I + 20d, serverValidatedAt: I + 5d}, I + 21d) === 8` |
| US-4 | As a dev with `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY` set on localhost, I want the debug panel to show the **exact literal** copy that replaces the confusing v3.x log line | `license-debug-panel.test.tsx` literal-string match | `getByText('🟢 Dev bypass active (NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY set, hostname=localhost)')` returns the element (no regex) |
| US-5 | As an engineer testing in production, I want `<LicenseDebugPanel>` to render NOTHING by default | Same file with `NODE_ENV='production'` | `container.firstChild === null` |
| US-6 | As QA testing on a real domain, I want `<LicenseTestMode tier="invalid">` to make `useIsPro()` return `false` AND render the watermark — without touching env vars | `license-test-mode.integration.test.tsx` | Watermark element present; `useIsPro()` returns `false`. Switching to `tier="pro"` flips both. |
| US-7 | As a release engineer, I want `<LicenseTestMode>` to LOUDLY warn if it ever ships to production | `license-test-mode.production-warning.test.tsx` | `console.warn` called exactly once with substring `"<LicenseTestMode> active in production"` |
| US-8 | As CI, I want imports of `<LicenseTestMode>` outside `__tests__/`, `examples/`, and Storybook files to fail loudly | `license-test-mode-guard.test.ts` + `scripts/check-license-test-mode.mjs` | Guard exits non-zero on `src/foo.tsx` import; exits 0 for allowed paths |
| US-9 | As the maintainer, I want a regression test pinning `PolarValidateResponseSchema` to NOT include a `tier` field (memory #187 contract) | `schema-no-tier.regression.test.ts` | `expect('tier' in PolarValidateResponseSchema.shape).toBe(false)` |
| US-10 | As a docs reader, I want `apps/docs/content/docs/licensing/trial.mdx` to compile and ship the schema-migration plan | `pnpm --filter @tour-kit/docs build` | Exit 0; page renders at `/docs/licensing/trial` |

---

## 2. Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|---|---|---|---|
| `getDaysLeft(config, now)` | No mock — pure helper, parameterized over boundaries | One assertion per day-elapsed value (0, 1, 7, 11, 13, 14, 15, 30, -5) | US-3 |
| `<TrialBadge daysLeft={n} />` | No mock — render real component; `vi.useFakeTimers()` for time-jump cases | Literal text `"{n} days left"` for n>3; `<a>` with text `"Upgrade"` for n≤3; `null` + dev warn if no `daysLeft` available | US-1, US-2 |
| `<LicenseDebugPanel>` (dev-bypass copy) | Wrap in `<LicenseProvider licenseKey="foo">` with mocked `isDevEnvironment() → true` and stubbed `process.env.NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY` | `getByText` with EXACT literal string (no regex) — copy regression breaks CI | US-4 |
| `<LicenseDebugPanel>` in production | `vi.stubEnv('NODE_ENV', 'production')` | `container.firstChild === null` | US-5 |
| `<LicenseTestMode>` integration | No mock for license — the component IS the test-mode | Watermark visible + `useIsPro()=== false` for `tier="invalid"`; watermark absent + `useIsPro()=== true` for `tier="pro"` | US-6 |
| `<LicenseTestMode>` production warn | `vi.spyOn(console, 'warn')`; flip `NODE_ENV='production'` | Exactly one warn with substring `"<LicenseTestMode> active in production"`; zero in dev | US-7 |
| Static guard `scripts/check-license-test-mode.mjs` | Spawn the script via `node:child_process` with synthetic fixture files in `tmp_dir`; or set up tmpfile in `__tests__/fixtures/` | Exits 0 for allowed paths; exits 1 for disallowed paths; stderr contains `'LicenseTestMode' may only be imported` | US-8 |
| `PolarValidateResponseSchema` | No mock — import the Zod schema directly | `'tier' in PolarValidateResponseSchema.shape === false` | US-9 |
| Docs build | No mock — `pnpm --filter @tour-kit/docs build` | Exit 0; sidebar entry exists | US-10 |

---

## 3. Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|-------------|-------|-------------|
| Unit (pure helper) | vitest | <0.5s | Every push |
| Component (badge, panel, test-mode) | vitest + @testing-library/react (jsdom) + `vi.useFakeTimers()` | <3s | Every push |
| Integration (test-mode + watermark + useIsPro) | vitest + existing license test idioms | <2s | Every push |
| Static guard | `node:child_process` spawning the script + temp fixtures | <2s | Every push; ALSO wired into the package's `test` script |
| Schema regression | vitest, pure import | <0.2s | Every push |
| Docs build | `pnpm --filter @tour-kit/docs build` | ~10–20s | Pre-merge CI |

---

## 4. No Fake Implementations (Pure Helper + Component Phase)

Phase 8 has no heavy dependencies. The helper is 15 lines; the components are dev-only or test-only utilities. Tests exercise real `<LicenseProvider>` contexts via the existing `packages/license/src/__tests__/license-provider.test.tsx` idioms (`../lib/domain` mock, `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY` stub). The static guard runs as a real Node script via `child_process.spawnSync`.

The only mocking patterns:
- `vi.useFakeTimers()` + `vi.setSystemTime()` for the day-boundary tests in `trial-badge.test.tsx`.
- `vi.stubEnv('NODE_ENV', 'production')` for the production-warning + null-render tests.
- The existing `../lib/domain` mock (see `packages/license/src/__tests__/license-provider.test.tsx`) for the dev-bypass copy assertion.

---

## 5. Test File List

```
packages/license/src/__tests__/
├── trial.test.ts                                    # NEW — getDaysLeft parametrized: 0/1/7/11/13/14/15/30/-5 + clock-skew
├── trial-badge.test.tsx                             # NEW — literal-text countdown, Upgrade CTA at threshold, fake-timer day jump,
│                                                    #       render-prop, null-without-config + dev warn, custom pricingUrl
├── license-debug-panel.test.tsx                     # NEW — EXACT literal copy via getByText (no regex), null-in-production
├── license-test-mode.production-warning.test.tsx    # NEW — exactly-once warn in production; zero in dev
├── license-test-mode.integration.test.tsx           # NEW — watermark + useIsPro propagation for tier=invalid/pro
├── license-test-mode-guard.test.ts                  # NEW — static guard accepts/rejects synthetic fixture paths
└── schema-no-tier.regression.test.ts                # NEW — PolarValidateResponseSchema does NOT include tier

packages/license/scripts/
└── check-license-test-mode.mjs                      # NEW — Node script; static guard for production imports
```

| File | Tier | Tests | Description |
|------|------|-------|-------------|
| `trial.test.ts` | Unit | ≥10 | Boundary days (0/1/7/11/13/14/15/30/-5); clock-skew absorption; `serverValidatedAt = null` fallback to `now`. |
| `trial-badge.test.tsx` | Component | ≥6 | "14 days left" literal; "4 days left" above threshold; Upgrade `<a>` at days 3/1/0; `vi.useFakeTimers()` transitions to Upgrade at day 11; null + dev warn when no `daysLeft` in context; custom `pricingUrl` honored. |
| `license-debug-panel.test.tsx` | Component | ≥4 | EXACT literal copy assertion (load-bearing); `null` in production; renders trial line when `ctx.trial` present; renders status line when `renderKey !== 'dev_bypass'`. |
| `license-test-mode.production-warning.test.tsx` | Component | 2 | Production: exactly one warn with the substring; dev: zero warns. |
| `license-test-mode.integration.test.tsx` | Integration | ≥2 | `tier="invalid"`: watermark present + `useIsPro()=== false`; `tier="pro"`: watermark absent + `useIsPro()=== true`. |
| `license-test-mode-guard.test.ts` | Guard | ≥3 | Valid fixture paths (`__tests__/`, `examples/`, `*.stories.tsx`); invalid fixture paths (`src/foo.tsx`); script exits non-zero with stderr containing the rejection message. |
| `schema-no-tier.regression.test.ts` | Regression | 1 | `expect('tier' in PolarValidateResponseSchema.shape).toBe(false)` — pins memory #187 contract. |

---

## 6. Test Setup (Vitest + jsdom + helpers)

**Additions to existing `packages/license/vitest.config.ts`:** none. Existing config covers `src/**/*.test.(ts|tsx)` under jsdom.

For the dev-bypass copy assertion in `license-debug-panel.test.tsx`, reuse the existing domain-module mock idiom from `packages/license/src/__tests__/license-provider.test.tsx` instead of trying to mutate `window.location` directly:

```tsx
import { beforeEach, vi } from 'vitest'

vi.mock('../lib/domain', () => ({
  isDevEnvironment: vi.fn(),
  getCurrentDomain: vi.fn(),
}))
import { getCurrentDomain, isDevEnvironment } from '../lib/domain'

beforeEach(() => {
  vi.mocked(isDevEnvironment).mockReturnValue(true)
  vi.mocked(getCurrentDomain).mockReturnValue('localhost')
  vi.stubEnv('NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY', 'test-key')
})
```

For the static guard test, spawn the real script with synthetic fixtures in a tmp dir:

```ts
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const guardScript = resolve(__dirname, '../../scripts/check-license-test-mode.mjs')

it('rejects LicenseTestMode imports from application source', () => {
  const dir = mkdtempSync(join(tmpdir(), 'license-guard-'))
  mkdirSync(join(dir, 'src'))
  writeFileSync(join(dir, 'src', 'app.tsx'), `import { LicenseTestMode } from '@tour-kit/license'`)
  const result = spawnSync('node', [guardScript], { cwd: dir })
  expect(result.status).toBe(1)
  expect(result.stderr.toString()).toContain("'LicenseTestMode' may only be imported")
})
```

Wire the guard into `packages/license/package.json` so CI runs it. Prefer a separate script such as `"test:license-test-mode-guard": "node scripts/check-license-test-mode.mjs"` and reference it from the package/root CI pipeline; avoid replacing `"test": "vitest run"` with a chained command if the package relies on forwarding Vitest file filters through `pnpm --filter @tour-kit/license test -- <pattern>`.

---

## 7. Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Dev-bypass copy is asserted via `getByText` with the EXACT literal string | No regex, no substring match | The copy is the user-visible UX guarantee from the Phase 8 plan — the v3.x ambiguous log line is what we're explicitly replacing. Tolerance would hide regressions. |
| `getDaysLeft` is parameterized via `it.each` | One assertion per boundary day | Reads as a table; reviewers see at a glance which days are pinned. |
| Clock-skew test uses real-looking timestamps | `validatedAt = ISSUED + 20d`, `serverValidatedAt = ISSUED + 5d`, `now = validatedAt + 1d` | Tests the algebra of `serverValidatedAt + (now - validatedAt)` against a known-skewed local clock. |
| Production-warning test uses `vi.stubEnv` | Not `process.env.NODE_ENV = ...` direct mutation | `vi.stubEnv` restores between tests automatically and is the canonical Vitest pattern. |
| Static guard test spawns the real script via `child_process` | Not re-implements the matcher in JS | Exercises the script that ships to CI; mocking the matcher would test the test, not the guard. |
| Schema regression is one line | `expect('tier' in PolarValidateResponseSchema.shape).toBe(false)` | Pins the wire-contract decision from memory #187 / Phase 0 §6 against silent additions. |
| `<LicenseTestMode>` integration test uses real `<LicenseWatermark>` + `useIsPro` | No mock | The test verifies context propagation; mocking would defeat the purpose. |
| `<TrialBadge>` Upgrade transition tested with `vi.useFakeTimers()` + `vi.setSystemTime()` | Real time-jump simulation | Verifies the day-11 boundary across re-renders; without fake timers, we'd need to mount fresh per case. |
| `null` + dev warn for `<TrialBadge>` without `trialDays` | Graceful degradation, not throw | Phase 8 plan explicitly says throwing mid-render would tank consumer apps. The test pins this contract. |
| Static guard allow-list includes Storybook files | `*.stories.tsx`, `*.story.tsx` | The Phase 8 plan calls out this case explicitly; without the allow-list, demos that import the test-mode would fail CI. |

---

## 8. Example Test Case

The `<LicenseDebugPanel>` literal-copy test is the most representative — it pins the user-visible UX guarantee that's the whole point of the dev-clarity work.

```tsx
// packages/license/src/__tests__/license-debug-panel.test.tsx
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LicenseDebugPanel } from '../components/license-debug-panel'
import { LicenseProvider } from '../context/license-context'

vi.mock('../lib/domain', () => ({
  isDevEnvironment: vi.fn(),
  getCurrentDomain: vi.fn(),
}))
import { getCurrentDomain, isDevEnvironment } from '../lib/domain'

describe('<LicenseDebugPanel>', () => {
  beforeEach(() => {
    vi.mocked(isDevEnvironment).mockReturnValue(true)
    vi.mocked(getCurrentDomain).mockReturnValue('localhost')
    vi.stubEnv('NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY', 'test-key')
    vi.stubEnv('NODE_ENV', 'development')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('renders the EXACT dev-bypass copy (literal — no regex)', () => {
    render(
      <LicenseProvider licenseKey="test-key">
        <LicenseDebugPanel />
      </LicenseProvider>,
    )
    // The dev-bypass copy is the contract — drift breaks CI.
    expect(
      screen.getByText('🟢 Dev bypass active (NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY set, hostname=localhost)'),
    ).toBeInTheDocument()
  })

  it('returns null in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const { container } = render(
      <LicenseProvider licenseKey="test-key">
        <LicenseDebugPanel />
      </LicenseProvider>,
    )
    expect(container.firstChild).toBeNull()
  })
})
```

---

## 9. Execution Prompt

Copy everything between the `---` lines into a new Claude session to write this test suite:

---

You are writing the test suite for Phase 8 of Tour Kit v2 Package Polish — License Trial Tier + Dev Clarity.

### What This Project Is

Tour Kit is a pnpm + Turborepo monorepo of 12 React packages. `@tour-kit/license` validates Polar.sh license keys, manages domain activations, caches results (72h TTL), and provides React components for license-aware rendering. Phase 8 closes three license-UX gaps: a client-derived trial countdown (because Polar has no `tier` field — memory #187), an explicit `<LicenseDebugPanel>` replacing the ambiguous v3.x log line, and a `<LicenseTestMode>` provider for QA on real domains. Stack: TypeScript strict mode, React 18+, Vitest + @testing-library/react (jsdom), Zod for boundary validation. No new external deps.

### Critical Project Memory (DO NOT REDISCOVER)

**Polar API has NO `tier` field** (memory `project_polar_api_findings.md` / #187). The `/v1/customer-portal/license-keys/validate` response includes: `id, status, benefit_id, customer, key, display_key, limit_activations, usage, limit_usage, validations, last_validated_at, expires_at`. No tier, no trial, no plan. **Do NOT add `tier` to `PolarValidateResponseSchema`** — the regression test pins this.

Trial state is **client-derived** from `issuedAt + trialDays`, using `serverValidatedAt` (parsed from `last_validated_at`) plus local elapsed time from `validatedAt` to absorb client clock skew.

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | `daysLeft={14}` shows "14 days left" | `getByText` | Exact-string match |
| US-2 | `daysLeft<=3` → Upgrade `<a>` | `getByRole('link')` | text matches `/upgrade/i`; `href` ≠ `#` |
| US-3 | Clock-skew absorbed via server anchor | algebra | `getDaysLeft(...skewed...) === 8` |
| US-4 | Exact dev-bypass literal copy | `getByText` literal | "🟢 Dev bypass active (NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY set, hostname=localhost)" |
| US-5 | DebugPanel null in production | `vi.stubEnv` | `container.firstChild === null` |
| US-6 | TestMode flips useIsPro + watermark | real render | `tier="invalid"` → false + watermark; `tier="pro"` → true + no watermark |
| US-7 | TestMode warns in production | `vi.spyOn(console, 'warn')` | Exactly 1 with substring `"<LicenseTestMode> active in production"` |
| US-8 | Static guard rejects app-source imports | spawn script | exit 1 + stderr contains rejection |
| US-9 | PolarValidateResponseSchema has no tier | regression | `'tier' in shape === false` |
| US-10 | Docs page builds | Fumadocs build | Exit 0 |

### Why Fakes Are Required

None. Phase 8 has no heavy dependencies. The helper is pure; components render with real contexts. Mock patterns:
- `vi.useFakeTimers()` + `vi.setSystemTime()` for day-boundary transitions in the badge tests.
- `vi.stubEnv('NODE_ENV', 'production')` for the panel + test-mode production cases (auto-restored between tests).
- Existing `../lib/domain` mock idiom from `packages/license/src/__tests__/license-provider.test.tsx` for the dev-bypass copy assertion.

### What NOT to Test

- Don't test Polar's wire shape — covered by existing `PolarValidateResponseSchema` parsing tests. Phase 8 adds a regression-pinning test that the schema does NOT include `tier`; that's the contract this phase enforces.
- Don't test `<LicenseWatermark>` itself — covered by existing tests. The integration test only verifies that `<LicenseTestMode>` propagates context to it.
- Don't test the helper through React — it's pure. Unit-test it directly.
- Don't test the static guard by re-implementing its matcher in JS — spawn the real script.
- Don't add Playwright specs — Phase 8 ships components that are best verified in jsdom with literal-copy assertions.

### Critical: No Fake Implementations

See §4 of this plan. The mock patterns are `vi.useFakeTimers`, `vi.stubEnv`, and the existing `../lib/domain` mock idiom.

### Test Files to Create

```
packages/license/src/__tests__/
├── trial.test.ts
├── trial-badge.test.tsx
├── license-debug-panel.test.tsx
├── license-test-mode.production-warning.test.tsx
├── license-test-mode.integration.test.tsx
├── license-test-mode-guard.test.ts
└── schema-no-tier.regression.test.ts

packages/license/scripts/check-license-test-mode.mjs  # SHIP (not a test file, but the test exercises it)
```

### Per-File Coverage Guidance

#### `packages/license/src/__tests__/trial.test.ts` (NEW — ≥10 cases)
`it.each` over `[trialDays, daysElapsed, expected]` pairs:
- `[14, 0, 14]`, `[14, 1, 13]`, `[14, 7, 7]`, `[14, 11, 3]` (Upgrade boundary), `[14, 13, 1]`, `[14, 14, 0]`, `[14, 15, 0]` (clamp negative), `[14, 30, 0]` (far past clamp), `[14, -5, 14]` (future clamp / clock-skew protection).
- Plus: `serverValidatedAt = null` fallback uses `now` directly.
- Plus: clock-skew absorption — `validatedAt = ISSUED + 20d`, `serverValidatedAt = ISSUED + 5d`, `now = validatedAt + 1d` → expect 8.

#### `packages/license/src/__tests__/trial-badge.test.tsx` (NEW — ≥6 cases)
1. `<TrialBadge daysLeft={14} />` → `getByText('14 days left')` (exact-string).
2. `<TrialBadge daysLeft={4} />` → still days-left text, not Upgrade.
3. `<TrialBadge daysLeft={3 | 1 | 0} />` (parameterized) → `getByRole('link', { name: /upgrade/i })` with `href` matching the default or custom `pricingUrl`.
4. `vi.useFakeTimers()`: render `<TrialBadge />` reading from context with `trialDays=14, issuedAt=now`. Advance `vi.setSystemTime(issuedAt + 11d)` and re-render. Assert badge flips to Upgrade.
5. `<TrialBadge />` with no `trialDays` in context and no prop → renders `null`; spy on `console.warn`; assert exactly one warn in dev (mode `development`).
6. `<TrialBadge daysLeft={2} pricingUrl="https://my.example/upgrade" />` → Upgrade `<a>` has the custom `href`.

#### `packages/license/src/__tests__/license-debug-panel.test.tsx` (NEW — ≥4 cases)
Use the `getByText` LITERAL-STRING pattern from §8 of this plan.
1. Dev bypass active → exact copy `'🟢 Dev bypass active (NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY set, hostname=localhost)'`.
2. `NODE_ENV='production'` → `container.firstChild === null`.
3. With `trial` slice present in context → renders "Trial: X days left".
4. `renderKey !== 'dev_bypass'` → renders the status line (status/tier/domain), NOT the dev-bypass copy.

#### `packages/license/src/__tests__/license-test-mode.production-warning.test.tsx` (NEW — 2 cases)
1. `vi.stubEnv('NODE_ENV', 'production')`; render `<LicenseTestMode tier="invalid"><div /></LicenseTestMode>`; assert `console.warn` called exactly once with `expect.stringContaining('<LicenseTestMode> active in production')`.
2. `vi.stubEnv('NODE_ENV', 'development')`; same render; assert `console.warn` NOT called.

#### `packages/license/src/__tests__/license-test-mode.integration.test.tsx` (NEW — ≥2 cases)
1. Render `<LicenseTestMode tier="invalid"><LicenseWatermark /><ProGateProbe /></LicenseTestMode>` where `<ProGateProbe>` is an inline helper calling `useIsPro()` and rendering its boolean. Assert watermark element is present in the DOM (use `[data-tour-kit-watermark]` selector or text-match `Tour Kit · Unlicensed` per the existing component's render); assert `getByText('is-pro: false')`.
2. Swap to `<LicenseTestMode tier="pro">`; assert watermark absent; `getByText('is-pro: true')`.

#### `packages/license/src/__tests__/license-test-mode-guard.test.ts` (NEW — ≥3 cases)
Use `spawnSync` from `node:child_process`. Create tmp dirs/files via `mkdtempSync`. For each fixture file: write the content, run the script with `cwd: tmpDir`, assert the exit status + stderr.
1. Valid path `src/__tests__/foo.test.tsx` importing `LicenseTestMode` → exit 0.
2. Valid path `examples/foo/app.tsx` → exit 0.
3. Valid path `src/Demo.stories.tsx` → exit 0.
4. Invalid path `src/app.tsx` → exit 1; stderr contains `"'LicenseTestMode' may only be imported"`.

#### `packages/license/src/__tests__/schema-no-tier.regression.test.ts` (NEW — 1 case)
```ts
import { describe, expect, it } from 'vitest'
import { PolarValidateResponseSchema } from '../lib/schemas'

describe('PolarValidateResponseSchema regression (memory #187, Phase 0 §6)', () => {
  it('does NOT include a `tier` field — Polar API has no tier; trial is client-derived', () => {
    expect('tier' in PolarValidateResponseSchema.shape).toBe(false)
  })
})
```

#### `packages/license/scripts/check-license-test-mode.mjs` (NEW — the script itself)
Use the implementation from the Phase 8 plan §8.4b verbatim. Allow-list: `/__tests__/`, `/(^|\/)examples\//`, `/\.stories\.(t|j)sx?$/`, `/\.story\.(t|j)sx?$/`. Reject any other path that imports `LicenseTestMode` from `@tour-kit/license`. Exit non-zero with stderr listing offenders.

### Data Model Notes

- `TrialConfig` is an `interface` exported from `lib/trial.ts`. Re-exported from `headless.ts` (React-free entry).
- `TrialContextValue` is a `type` exported from `types/index.ts`. `LicenseContextValue.trial` is `TrialContextValue | null`.
- `LicenseTestModeProps` is a discriminated union over `tier: 'invalid' | 'pro' | 'free'`.
- `PolarValidateResponseSchema` is a Zod schema — tests import it directly and assert against `.shape`.

### Success Criteria

- `pnpm --filter @tour-kit/license typecheck` exits 0
- `pnpm --filter @tour-kit/license test -- --run` exits 0 with all 7 new test files green
- `node packages/license/scripts/check-license-test-mode.mjs` exits 0 on the repository (no application-source imports of `LicenseTestMode`)
- Optional audit grep for production imports returns no matches: `rg "LicenseTestMode.*@tour-kit/license|@tour-kit/license.*LicenseTestMode" packages/*/src -g '*.ts' -g '*.tsx' -g '!**/__tests__/**'`. The shipped guard script remains the source of truth because it handles path allow-lists and multiline files.
- `pnpm --filter @tour-kit/docs build` exits 0; `/docs/licensing/trial` renders
- No existing license tests regress
- Bundle size delta ≤ 1.5 KB gzipped (PR description records the number)

### Expected File Structure at End

```
packages/license/src/__tests__/
├── trial.test.ts                                    # NEW
├── trial-badge.test.tsx                             # NEW
├── license-debug-panel.test.tsx                     # NEW
├── license-test-mode.production-warning.test.tsx    # NEW
├── license-test-mode.integration.test.tsx           # NEW
├── license-test-mode-guard.test.ts                  # NEW
└── schema-no-tier.regression.test.ts                # NEW
packages/license/scripts/check-license-test-mode.mjs # NEW (ships; tests exercise it)
```

---

## 10. Run Commands

```bash
# Fast path — pure helper + components
pnpm --filter @tour-kit/license test -- --run trial trial-badge license-debug-panel license-test-mode schema-no-tier

# Full per-package suite
pnpm --filter @tour-kit/license test -- --run

# Static guard (runs on real repo state)
node packages/license/scripts/check-license-test-mode.mjs

# Optional audit grep — production imports of LicenseTestMode (script is authoritative)
! rg "LicenseTestMode.*@tour-kit/license|@tour-kit/license.*LicenseTestMode" packages/*/src -g '*.ts' -g '*.tsx' -g '!**/__tests__/**'

# Docs build
pnpm --filter @tour-kit/docs build

# Coverage on the trial helper
pnpm --filter @tour-kit/license test -- --coverage --run trial
```

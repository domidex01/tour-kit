# Phase 7 — Testing: Announcements Sonner Pipe + Spotlight Design

**Scope:** New peer-optional Sonner adapter at the subpath `@tour-kit/announcements/adapters/sonner`; new `ToastAdapter` interface in main package; new `<ToastRouter>` internal that swaps render path; redesigned `<AnnouncementSpotlight>` with inset-stroke + directional arrow + `variant: 'default' | 'legacy-spotlight'` + `strokeColor: 'auto' | string`; tsup `entry` adds `adapters/sonner`; package `exports` map gains `./adapters/sonner`; `peerDependencies` + `peerDependenciesMeta` add optional `sonner`; new bash guard `scripts/check-no-sonner-in-main.sh`; CHANGELOG entry.
**Key Pattern:** Peer-optional integration + WCAG-AA contrast verification — exercise the adapter under both present and absent peer states via per-case `vi.doMock('sonner', ...)`; verify the main bundle has ZERO sonner bytes via a post-build grep guard wired into the package's `build` script; verify Spotlight contrast across three light backgrounds with deterministic contrast-ratio checks plus axe semantic scans; pin the legacy-variant rendering via computed-style assertion so the v3.0 radial-gradient stays available for one minor cycle.
**Dependencies:** vitest, @testing-library/react (jsdom), vitest-axe (existing devDep), `sonner` (existing/new workspace devDep so the dynamic import resolves in tests; consumers install it themselves), bash for the no-sonner-in-main guard.

---

## 1. User Stories

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | As a consumer who already adopted Sonner, I want `<AnnouncementsProvider toastAdapter={sonnerAdapter}>` + `<Toaster />` to route `variant="toast"` announcements through Sonner (zero duplicate stacks) | `sonner-adapter.test.ts` "present" case | `sonner.toast.custom` called exactly once with `(callback, options)`; returned handle has `id` matching the mock |
| US-2 | As a consumer who has NOT installed Sonner, I want my app to keep working — fallback to the existing portal toast + one-time dev warn | `sonner-adapter.test.ts` "absent" case | Adapter `render()` returns `null`; `console.warn` called once with message containing `'sonner'` |
| US-3 | As CI, I want **ZERO** Sonner bytes in `dist/index.js` so consumers never pay the cost unless they opt in via the subpath | `scripts/check-no-sonner-in-main.sh` post-build | `grep -c "sonner" dist/index.js` returns 0; `grep -c "sonner" dist/index.cjs` returns 0 |
| US-4 | As a Pro consumer, I want the redesigned Spotlight to pass WCAG 2.1 AA contrast on white, off-white, and light-gray backgrounds | `spotlight.contrast.test.tsx` × 3 backgrounds | Axe semantic scan has no violations; a contrast-ratio helper verifies cutout stroke/arrow/text colors against each background |
| US-5 | As the same consumer, I want the inset-stroke cutout to actually be a 2px inset on a fixed-position element so it survives any background | Same file, computed-style assertion | `getComputedStyle(cutout).boxShadow` matches `/inset/` AND `/2px/` |
| US-6 | As a v3.0 consumer with a theme that depends on the old radial gradient, I want `variant="legacy-spotlight"` to keep the v3.0 render available for one minor | Same file, legacy-variant case | Rendering `<AnnouncementSpotlight variant="legacy-spotlight">` produces an element with a `radial-gradient` `background` style |
| US-7 | As a future contributor "simplifying" the dynamic import to module-top, I want CI to break loudly | Same guard as US-3 | Any `from 'sonner'` in the main bundle is a hard fail |
| US-8 | As a CHANGELOG reader, I want the v4.0.0 entry to mention the subpath, the legacy variant, and the strokeColor prop | grep on CHANGELOG | `grep -cE "adapters/sonner\|legacy-spotlight\|strokeColor" packages/announcements/CHANGELOG.md` ≥ 3 |

---

## 2. Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|---|---|---|---|
| `sonnerAdapter.render(...)` — present case | `vi.doMock('sonner', () => ({ toast: Object.assign(vi.fn(), { custom: vi.fn(() => 'mock-id'), dismiss: vi.fn() }), Toaster: () => null }))` before importing the adapter | Adapter calls `toast.custom(callback, { duration, position, onDismiss })`; returns handle `{ id: 'mock-id', dismiss }` | US-1 |
| `sonnerAdapter.render(...)` — absent case | `vi.doMock('sonner', () => { throw new Error('not installed') })` before importing the adapter | Adapter returns `null`; `console.warn` called once with substring `'sonner'`; second call does not re-warn (warned flag is module-scope) | US-2 |
| No Sonner bytes in main bundle | No mock — real `pnpm --filter @tour-kit/announcements build` + `scripts/check-no-sonner-in-main.sh` | `grep -c "sonner" dist/index.js` returns 0; `dist/adapters/sonner.js` exists | US-3, US-7 |
| Spotlight inset-stroke contrast | Axe semantic scan plus a local contrast-ratio helper for three wrappers (`#ffffff`, `#f5f5f5`, `#e5e7eb`) | No structural violations; contrast ratios meet WCAG threshold per background | US-4 |
| Spotlight inset-stroke computed style | `getComputedStyle(cutout).boxShadow` | Matches `/inset/` AND `/2px/` | US-5 |
| Legacy variant | No mock — render `<AnnouncementSpotlight variant="legacy-spotlight">`; assert `getComputedStyle(overlay).background` contains `radial-gradient` | Legacy radial-gradient is preserved | US-6 |
| `package.json` exports map | No mock — read file content, assert `./adapters/sonner` entry exists | `JSON.parse(...)["exports"]["./adapters/sonner"]` has `import.default` pointing to `./dist/adapters/sonner.js` | US-3 |
| `src/index.ts` purity | Static grep | `grep -c "adapters/sonner" packages/announcements/src/index.ts` returns 0 | US-3 |

---

## 3. Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|-------------|-------|-------------|
| Unit (adapter present/absent) | vitest + `vi.doMock('sonner', ...)` | <2s | Every push |
| Unit (Spotlight contrast + computed style) | vitest + @testing-library/react + vitest-axe + contrast helper (jsdom) | <3s | Every push |
| Build smoke (no-sonner-in-main guard) | `pnpm --filter @tour-kit/announcements build && bash scripts/check-no-sonner-in-main.sh` | ~10–15s | Pre-merge CI; wired into the package's `build` script |
| Existing regression suite | Existing `__tests__/**` | <30s | Every push |

---

## 4. Fake / Mock Implementations — `sonner` (peer-optional)

`sonner` is the only external touched this phase. It's a peer-optional dep. Tests cover both operational states:

```ts
// PRESENT — sonnerAdapter.render() routes through toast.custom
const customSpy = vi.fn(() => 'mock-id')
const dismissSpy = vi.fn()
vi.doMock('sonner', () => ({
  toast: Object.assign(vi.fn(), { custom: customSpy, dismiss: dismissSpy }),
  Toaster: () => null,
}))

// ABSENT — module not installed; dynamic import throws
vi.doMock('sonner', () => { throw new Error('Cannot find module sonner') })
```

The adapter uses `await import('sonner').catch(() => null)` inside `render`, so the mock pattern must work via dynamic import resolution. Use `vi.doMock` plus `vi.resetModules()` before importing `../adapters/sonner`; that gives each case an isolated peer state while preserving the adapter's dynamic-import boundary.

For the "absent" case, the adapter's `warnOnce` is module-scope — the second call within the same Vitest module load will NOT re-warn. Tests assert exactly-one warn per first-encounter, and either reset module state via `vi.resetModules()` between cases or accept the once-per-file semantics.

---

## 5. Test File List

```
packages/announcements/src/__tests__/
├── sonner-adapter.test.ts                     # NEW — present + absent peer cases; toast.custom args;
│                                              #       warn-once contract; main-bundle does not import this file
└── spotlight.contrast.test.tsx                # NEW — 3 background contrast scans; inset-stroke computed style;
                                               #       legacy variant radial-gradient preserved
packages/announcements/scripts/
└── check-no-sonner-in-main.sh                 # NEW — bash guard; wired into the package's `build` script
```

| File | Tier | Tests | Description |
|------|------|-------|-------------|
| `sonner-adapter.test.ts` | Unit | ≥4 | Present: `toast.custom` called with the expected callback + options; returned handle has `dismiss`. Absent: returns `null`; warn fired once. Subpath isolation: importing the main entry does not pull `sonner`. |
| `spotlight.contrast.test.tsx` | Component | ≥4 | One axe semantic scan + token contrast-ratio assertion per background (`#ffffff`, `#f5f5f5`, `#e5e7eb`); inset-stroke computed-style assertion; legacy variant `radial-gradient` preserved. |
| `scripts/check-no-sonner-in-main.sh` | Build guard | n/a | Greps `dist/index.js` and `dist/index.cjs` for `sonner`; exits non-zero on match. |

---

## 6. Test Setup (Vitest + jsdom + build-guard wiring)

**Additions to existing `packages/announcements/vitest.config.ts`:** none. The config already covers `src/**/*.test.(ts|tsx)` under jsdom.

For the contrast tests, the `vitest-axe` matcher is added via the existing devDep — see existing a11y tests for the matcher idiom. Do not rely on jsdom axe `color-contrast` alone as the proof of contrast; jsdom does not render actual pixels. Add a tiny helper that converts the resolved foreground/background tokens to relative luminance and asserts the WCAG ratio for the three backgrounds.

Wire the bash guard into the `build` script in `packages/announcements/package.json`:

```jsonc
{
  "scripts": {
    "build": "tsup && bash scripts/check-no-sonner-in-main.sh",
    // ...existing scripts unchanged
  }
}
```

Make the script executable in the PR (`chmod +x packages/announcements/scripts/check-no-sonner-in-main.sh`).

---

## 7. Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Adapter mock uses `vi.doMock` per case | The adapter does `await import('sonner').catch(() => null)`; `vi.doMock` registered before importing the adapter lets the same test file cover present and absent peer states | `vi.resetModules()` between cases defeats the module-scope `warned` flag and prevents one peer-state mock from leaking into the next. |
| Absent-case `warn` is asserted exactly-once | Module-scope `warned` flag in the adapter | Without it, the warn would fire every time a consumer mounts a `variant="toast"` announcement, drowning real telemetry. |
| Build guard is bash, not Node | Tiny, portable, fast | Adding a Node dep purely for grep would be silly. `set -euo pipefail` makes the script robust. |
| Build guard is wired into the `build` script directly | `"build": "tsup && bash scripts/check-no-sonner-in-main.sh"` | The guard MUST run on every build; making it part of `build` ensures CI catches violations without separate wiring. |
| Spotlight contrast tested on 3 backgrounds | white, off-white, light-gray with deterministic color-ratio math, plus axe semantics | `auto` `strokeColor` must work across the realistic page palette; testing only on white or relying only on jsdom axe would miss the off-white failure mode. |
| Computed-style assertion uses substring match | `/inset/` AND `/2px/` | The exact boxShadow string varies by browser/jsdom version; substrings catch the contract without false negatives. |
| Legacy variant tested via radial-gradient detection | `getComputedStyle(overlay).background` contains `radial-gradient` | Pinning to the literal string would over-constrain; the contract is "it's a radial-gradient render." |
| Bundle audit is two checks: bash grep + JSON parse | `dist/*.js` grep + `package.json`'s exports map | Catches both the runtime ("did the file get bundled") and the contract ("is the subpath exposed correctly"). |
| No Playwright tests this phase | Spotlight visual snapshot can be added in a follow-up | Phase 7's contract is contrast + computed style + bundle purity. A pixel-perfect snapshot would over-constrain the redesign during review. |

---

## 8. Example Test Case

The Sonner adapter present/absent suite is the most representative — it covers both peer states with one mock pattern.

```ts
// packages/announcements/src/__tests__/sonner-adapter.test.ts
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

describe('sonnerAdapter — sonner present', () => {
  const customSpy = vi.fn(() => 'mock-id')
  const dismissSpy = vi.fn()

  beforeEach(() => {
    vi.resetModules()
    vi.doMock('sonner', () => ({
      toast: Object.assign(vi.fn(), { custom: customSpy, dismiss: dismissSpy }),
      Toaster: () => null,
    }))
  })
  afterEach(() => { vi.doUnmock('sonner'); customSpy.mockClear(); dismissSpy.mockClear() })

  it('routes the toast through sonner.toast.custom with our options', async () => {
    const { sonnerAdapter } = await import('../adapters/sonner')
    const handle = await sonnerAdapter.render({
      id: 'a',
      content: <div>hello</div>,
      options: { duration: 5000, position: 'bottom-right' },
    })
    expect(customSpy).toHaveBeenCalledTimes(1)
    expect(customSpy).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ duration: 5000, position: 'bottom-right' }))
    expect(handle).not.toBeNull()
    expect(handle!.id).toBe('mock-id')
    handle!.dismiss()
    expect(dismissSpy).toHaveBeenCalledWith('mock-id')
  })
})

describe('sonnerAdapter — sonner absent', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('sonner', () => { throw new Error('Cannot find module sonner') })
  })
  afterEach(() => { vi.doUnmock('sonner') })

  it('returns null and warns once when sonner is not installed', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { sonnerAdapter } = await import('../adapters/sonner')
    const handle = await sonnerAdapter.render({ id: 'a', content: <div>x</div> })
    expect(handle).toBeNull()
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0]![0]).toEqual(expect.stringContaining('sonner'))
  })
})
```

---

## 9. Execution Prompt

Copy everything between the `---` lines into a new Claude session to write this test suite:

---

You are writing the test suite for Phase 7 of Tour Kit v2 Package Polish — Announcements Sonner Pipe + Spotlight Design.

### What This Project Is

Tour Kit is a pnpm + Turborepo monorepo of 12 React packages. `@tour-kit/announcements` ships modal/toast/banner/spotlight/slideout primitives. Phase 7 adds a peer-optional Sonner adapter at the subpath `@tour-kit/announcements/adapters/sonner` (zero sonner bytes in the main bundle) and redesigns `<AnnouncementSpotlight>` with an inset-stroke cutout + directional arrow (`variant="legacy-spotlight"` opt-out for one minor). Stack: TypeScript strict mode, React 18+, tsup (dual ESM/CJS), Vitest + @testing-library/react + vitest-axe (jsdom). `sonner` (Context7-confirmed 2.0.7) uses `toast.custom(node, options)` for arbitrary React node rendering.

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | Sonner-present routes via `toast.custom` | mocked sonner + adapter call | `toast.custom` called once with `(callback, options)`; returned handle has `dismiss` |
| US-2 | Sonner-absent → null + warn-once | mock that throws | `render()` returns `null`; `console.warn` called once with `'sonner'` |
| US-3 | Zero sonner bytes in main bundle | bash guard | `grep -c "sonner" dist/index.js` returns 0 |
| US-4 | Spotlight passes AA contrast on 3 backgrounds | axe semantic scan + contrast-ratio helper | No structural violations; resolved stroke/arrow/text contrast meets WCAG thresholds per background |
| US-5 | Inset-stroke computed style | `getComputedStyle` match | boxShadow contains `inset` AND `2px` |
| US-6 | Legacy variant preserves radial-gradient | computed-style match | `background` contains `radial-gradient` |
| US-7 | CI breaks if future contributor static-imports `sonner` | same guard as US-3 | Hard fail |
| US-8 | CHANGELOG entry mentions all three changes | grep | ≥3 matches for `adapters/sonner\|legacy-spotlight\|strokeColor` |

### Why Fakes Are Required

`sonner` is the only external. It's a peer-optional dep loaded via `await import()` inside the adapter's `render`. Tests must cover both states (present + absent). Use per-case `vi.doMock('sonner', ...)` with `vi.resetModules()` before importing the adapter — the adapter's module-scope `warned` flag means we must reset modules to test the warn-once contract cleanly.

### What NOT to Test

- Don't test sonner internals — it's an MIT library. Verify our call args; trust the library.
- Don't test the existing `AnnouncementsProvider.show()` gate path — covered by existing tests. Phase 7 only swaps the render path inside `<ToastRouter>`, not the gate path.
- Don't test all 12 Spotlight placements — Phase 4 covers TourCard placement matrix; Phase 7's contract is contrast + computed style + the legacy escape hatch.
- Don't add Playwright snapshots for the Spotlight redesign — visual review happens manually in the PR. Add screenshots in a follow-up if needed.
- Don't test the `<Toaster />` consumer wiring — that's a Sonner convention; verify our dev warn fires when `[data-sonner-toaster]` is absent, but don't render `<Toaster />` ourselves.

### Critical: Fake Implementations

See §4 of this plan. Two `vi.doMock('sonner', ...)` patterns: one with the `toast.custom` spy, one that throws on import. Use `vi.resetModules()` between cases to defeat the module-scope `warned` flag.

### Test Files to Create

```
packages/announcements/src/__tests__/sonner-adapter.test.ts        # NEW
packages/announcements/src/__tests__/spotlight.contrast.test.tsx   # NEW
packages/announcements/scripts/check-no-sonner-in-main.sh          # NEW
```

### Per-File Coverage Guidance

#### `packages/announcements/src/__tests__/sonner-adapter.test.ts` (NEW)
Use the structure from §8 of this plan. Two `describe` blocks (present + absent). Plus one extra case asserting that the main barrel does NOT import the adapter:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

it('main barrel does not import the sonner adapter (subpath isolation)', () => {
  const indexSrc = readFileSync(join(__dirname, '../index.ts'), 'utf8')
  expect(indexSrc).not.toMatch(/adapters\/sonner/)
})
```

#### `packages/announcements/src/__tests__/spotlight.contrast.test.tsx` (NEW)
≥4 cases:
1–3. For each background `#ffffff`, `#f5f5f5`, `#e5e7eb`: render `<AnnouncementsProvider announcements={[{id: 's', config: { variant: 'spotlight', target: '#anchor' }}]}><AnnouncementSpotlight id="s" strokeColor="auto" /></AnnouncementsProvider>` inside a `<div style={{ background, minHeight: 400 }}>`. Use the existing pattern from `license-integration.test.tsx` or `reduced-motion.test.tsx` for the provider boilerplate. Run `axe(container)` for semantic regressions, then use a contrast-ratio helper against the resolved stroke/arrow/text tokens and the wrapper background; assert the applicable WCAG ratio.
4. Same setup; query the cutout element (likely `[data-tk-spotlight-cutout]` or similar — check the actual selector after Phase 7 lands); assert `getComputedStyle(cutout).boxShadow` matches `/inset/` AND `/2px/`.
5. Render `<AnnouncementSpotlight variant="legacy-spotlight">`; assert `getComputedStyle(overlay).background` contains `radial-gradient`.

#### `packages/announcements/scripts/check-no-sonner-in-main.sh` (NEW)
```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
for file in dist/index.js dist/index.cjs; do
  if grep -q "sonner" "$file"; then
    echo "FAIL: '$file' contains 'sonner'. Adapter must live only in dist/adapters/sonner.*"
    exit 1
  fi
done
test -f dist/adapters/sonner.js || { echo "FAIL: dist/adapters/sonner.js missing — tsup entry config drift?"; exit 1; }
echo "OK: zero sonner bytes in main entry"
```

Make executable (`chmod +x`). Wire into `package.json`: `"build": "tsup && bash scripts/check-no-sonner-in-main.sh"`.

### Data Model Notes

- `ToastAdapter`, `ToastAdapterRenderArgs`, `ToastAdapterHandle` are exported `interface`s from `src/types/toast-adapter.ts`. Tests import them via `@tour-kit/announcements` to verify the public contract.
- `sonnerAdapter` is exported ONLY from `src/adapters/sonner.ts`. The main barrel `src/index.ts` must NOT re-export it — the subpath isolation test asserts this.
- `<AnnouncementSpotlight>` props gain `variant?: 'default' | 'legacy-spotlight'` and `strokeColor?: 'auto' | string`. `'auto'` resolves at render via `useSyncExternalStore` over `matchMedia('(prefers-color-scheme: dark)')`.

### Success Criteria

- `pnpm --filter @tour-kit/announcements typecheck` exits 0
- `pnpm --filter @tour-kit/announcements build` exits 0 AND the post-build guard prints "OK: zero sonner bytes in main entry"
- `grep -c "sonner" packages/announcements/dist/index.js` returns 0 (independent of the guard)
- `pnpm --filter @tour-kit/announcements test -- --run sonner-adapter` exits 0 with ≥4 cases (present, absent, warn-once, subpath isolation)
- `pnpm --filter @tour-kit/announcements test -- --run spotlight.contrast` exits 0 with ≥4 cases
- All existing announcement tests still pass: `pnpm --filter @tour-kit/announcements test -- --run` exits 0
- CHANGELOG.md grep returns ≥3 matches for `adapters/sonner|legacy-spotlight|strokeColor`
- `packages/announcements/src/index.ts` does NOT import `./adapters/sonner` (asserted in the unit test)

### Expected File Structure at End

```
packages/announcements/src/__tests__/
├── sonner-adapter.test.ts                          # NEW
└── spotlight.contrast.test.tsx                     # NEW
packages/announcements/scripts/
└── check-no-sonner-in-main.sh                      # NEW
```

---

## 10. Run Commands

```bash
# Fast path
pnpm --filter @tour-kit/announcements test -- --run sonner-adapter spotlight.contrast

# Build (runs the no-sonner-in-main guard automatically)
pnpm --filter @tour-kit/announcements build

# Manual guard
bash packages/announcements/scripts/check-no-sonner-in-main.sh

# Full per-package suite
pnpm --filter @tour-kit/announcements test -- --run

# Coverage
pnpm --filter @tour-kit/announcements test -- --coverage
```

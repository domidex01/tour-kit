# Phase 1 — Testing: Externalize `@amplitude/analytics-browser` (B-2)

**Scope:** `packages/analytics/tsup.config.ts` (external array),
`packages/analytics/package.json` (`peerDependencies` +
`peerDependenciesMeta`), and the resulting `packages/analytics/dist/*`.
**Phase type:** **Config + metadata.** The only "source change" is build
config and package metadata; the plugin TS file is untouched. The test plan
proves that (a) the bundle delta lands, (b) existing analytics behavior is
preserved, and (c) downstream consumers still build.
**Key Pattern:** Build-output assertions (gzip-byte gates + grep for SDK
strings) and a thin vitest regression suite that exercises the
graceful-degradation path of `amplitudePlugin` when the optional peer is
missing. No real Amplitude SDK is loaded by unit tests.
**Dependencies:** `vitest`, `@testing-library/react` (already in package),
`tsup`, `gzip`, `wc`, `grep`, `node`. Existing `packages/analytics/src/__tests__/`
test infra is the baseline; we add to it, not replace it.

---

## User Stories

| #    | User Story                                                                                                                          | Validation Check                                                                                                                | Pass Condition                                                                              |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| US-1 | As a consumer who doesn't use Amplitude, I want `@tour-kit/analytics` to NOT inline the Amplitude SDK in my bundle.                 | `gzip -c packages/analytics/dist/index.js \| wc -c` and `gzip -c packages/analytics/dist/plugins/amplitude.js \| wc -c`         | index.js < 8000 B gz; amplitude.js < 1000 B gz                                              |
| US-2 | As a build-tool maintainer, I want SDK references to be import statements, not inlined function bodies.                             | `grep -c '@amplitude/plugin-' packages/analytics/dist/plugins/amplitude.js`                                                     | == 0 after Phase 1; was ≥ 10 at Phase 0 baseline                                            |
| US-3 | As a downstream package maintainer (8 packages import analytics), I want the externalization to not break my build.                 | `pnpm build --filter='./packages/*'` exit code                                                                                  | 0 (no consumer broken)                                                                       |
| US-4 | As a consumer who DOES use Amplitude, I want a clear contract that I must install the SDK myself.                                   | `packages/analytics/package.json` `peerDependencies` + `peerDependenciesMeta` entries for `@amplitude/analytics-browser`        | Both present; `optional: true` in meta                                                       |
| US-5 | As a plugin author, I want `amplitudePlugin()` to safely no-op when the peer isn't installed (don't crash the host app).            | `vitest` test that mocks dynamic import to fail, then asserts plugin returns a no-op tracker with no throws                     | New test passes; no thrown error; tracker `.track()` is a function                          |
| US-6 | As a CI engineer, I want the analytics unit suite (11 tests today) to remain green — externalization must not change behavior.      | `pnpm --filter @tour-kit/analytics test`                                                                                        | 11 + new tests pass; baseline `test-run.log` from Phase 0 still matches for analytics       |

---

## Component Mock Strategy

| Component                              | Mock Strategy                                                                | What to Assert                                                                            | User Story  |
| -------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------- |
| `tsup.config.ts` external array        | None — real build                                                            | Bundle file sizes; absence of SDK strings                                                 | US-1, US-2  |
| `package.json` peer metadata           | None — JSON read in node                                                     | Presence and `optional: true`                                                              | US-4        |
| `amplitudePlugin` (with peer present)  | `vi.mock('@amplitude/analytics-browser', () => fakeAmpSdk)`                  | `init` called once with `apiKey`; `track` forwards event name + properties                | US-5, US-6  |
| `amplitudePlugin` (peer absent)        | `vi.doMock('@amplitude/analytics-browser', () => { throw ... })`             | Plugin returns a tracker whose methods are no-ops; no thrown error; `console.warn` once    | US-5        |
| Downstream consumers (analytics users) | None — real workspace build                                                  | `pnpm build --filter='./packages/*'` exits 0                                              | US-3        |
| Bundle-size gate                       | Real `gzip` on real dist                                                     | Two hard thresholds                                                                       | US-1        |

---

## Test Tier Table

| Tier             | Dependencies                                              | Speed     | When to Run                              |
| ---------------- | --------------------------------------------------------- | --------- | ---------------------------------------- |
| Unit (vitest)    | Mocked SDK via `vi.mock`; no real network                 | < 5 s     | Every push (existing suite + new tests)  |
| Build assertion  | Real `tsup` build; `gzip`/`grep` on dist                  | ~30 s     | Pre-PR, in `pnpm dist:size` (Phase 7)    |
| Workspace build  | All packages built once                                   | ~3 min    | Pre-PR, on CI for the analytics-touching branch |
| Optional E2E     | Real `@amplitude/analytics-browser` from npm in a temp dir| ~2 min    | Nightly or pre-release smoke             |

Optional E2E is **not** a PR gate. See `tasks/sprint-1-stop-the-bleeding/phase-8-tests.md` for the cross-sprint smoke.

---

## Fake / Mock Implementations

### `fakeAmplitudeSdk` — replaces `@amplitude/analytics-browser`

Used in vitest with `vi.mock`. Mirrors only the surface the plugin calls
(read `packages/analytics/src/plugins/amplitude.ts` to confirm before
changing anything below).

```ts
// packages/analytics/src/__tests__/__fakes__/fake-amplitude-sdk.ts
import { vi } from 'vitest'

export const fakeAmplitudeSdk = {
  init: vi.fn((_apiKey: string, _userId?: string, _options?: unknown) => ({
    promise: Promise.resolve(),
  })),
  track: vi.fn((_eventName: string, _properties?: Record<string, unknown>) => ({
    promise: Promise.resolve(),
  })),
  identify: vi.fn(),
  setUserId: vi.fn(),
  reset: vi.fn(),
  flush: vi.fn(() => ({ promise: Promise.resolve() })),
}

// Matches real call shape:
//   import * as amplitude from '@amplitude/analytics-browser'
//   amplitude.init(apiKey, undefined, { ... })   ← same arity
//   amplitude.track(name, props)
```

### `fakeMissingPeer` — simulates the peer not installed

```ts
// packages/analytics/src/__tests__/__fakes__/missing-peer.ts
// Use vi.doMock so we can swap per-test; vi.mock is hoisted and global.
export function mockMissingAmplitude() {
  return import('vitest').then(({ vi }) => {
    vi.doMock('@amplitude/analytics-browser', () => {
      throw new Error("Cannot find module '@amplitude/analytics-browser'")
    })
  })
}
```

> The plugin uses dynamic `import('@amplitude/analytics-browser')`. The
> "missing peer" path must reject the import promise and the plugin must
> swallow that into a no-op tracker. If the plugin source changes shape,
> update the fake to match — don't water down the assertion.

---

## Test File List

```
packages/analytics/
├── src/__tests__/
│   ├── plugins/
│   │   └── amplitude.test.ts             # NEW or extend: init/track forwarding + missing-peer no-op
│   ├── __fakes__/
│   │   ├── fake-amplitude-sdk.ts         # NEW: surface-matching SDK fake
│   │   └── missing-peer.ts               # NEW: doMock helper
│   └── (existing 11 tests untouched)

tooling/bundle-check/
└── check-dist-gzip.mjs                   # NEW (or pulled forward from Phase 7) — gz threshold gate

# Out-of-package, sprint-1 scoped:
tasks/sprint-1-stop-the-bleeding/
└── verify-phase-1.sh                     # NEW: idempotent post-build gate runner
```

The phase plan instructs editing `tsup.config.ts` and `package.json`; no new
source files in `src/`. Test additions live under `src/__tests__/`.

---

## Vitest Setup Additions

```ts
// packages/analytics/vitest.config.ts (already exists — only confirm)
// No additions required; existing setup imports work.

// packages/analytics/src/__tests__/plugins/amplitude.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Module-level mock = "peer is installed" case (US-5 happy path + US-6).
vi.mock('@amplitude/analytics-browser', async () => {
  const { fakeAmplitudeSdk } = await import('../__fakes__/fake-amplitude-sdk')
  return fakeAmplitudeSdk
})

beforeEach(() => {
  vi.resetModules()           // each test re-imports the plugin fresh
})

afterEach(() => {
  vi.restoreAllMocks()
})
```

---

## Key Testing Decisions

| Decision                                                          | Approach                                                      | Rationale                                                                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Test against the dist, not the source                             | `gzip -c dist/index.js`                                       | The bug WAS in the dist (tsup config). Source-level tests pass the bug; dist-level gates catch it.                       |
| Mock SDK with `vi.mock`, not stub the dynamic `import()`           | Module-level mock                                             | The plugin uses `import('@amplitude/...')`. Vitest hoists `vi.mock` for ESM imports — covers both the dynamic and static forms. |
| Add a "missing peer" test even though it's the no-fix path        | `vi.doMock` + `await expect(...).not.toThrow()`               | This is exactly the contract being promised in the changeset. If it regresses, every Amplitude-less consumer crashes.    |
| Don't add an E2E that actually installs `@amplitude/analytics-browser`| Defer to Phase 8 smoke                                        | Adding a real-install test to PR CI inflates duration ~2 minutes for one packaging concern.                              |
| Keep existing 11 tests untouched                                  | No edits to old files                                         | They're a "did anything else move?" canary. Edits would mask coupled regressions.                                        |
| Hard byte thresholds, not "smaller than before"                   | `[ $gz -lt 8000 ]`                                            | Phase 7's CI gate uses the same bytes. Sprint-1 acceptance gate (`< 8000`) is the binding contract.                      |

---

## Example Test Case

```ts
// packages/analytics/src/__tests__/plugins/amplitude.test.ts
import { describe, expect, it, vi } from 'vitest'

vi.mock('@amplitude/analytics-browser', async () => {
  const { fakeAmplitudeSdk } = await import('../__fakes__/fake-amplitude-sdk')
  return fakeAmplitudeSdk
})

describe('amplitudePlugin', () => {
  describe('with peer installed (mocked SDK)', () => {
    it('initializes the SDK exactly once with the api key', async () => {
      const { amplitudePlugin } = await import('../../plugins/amplitude')
      const { fakeAmplitudeSdk } = await import('../__fakes__/fake-amplitude-sdk')

      const plugin = amplitudePlugin({ apiKey: 'test-key-123' })
      await plugin.init()

      expect(fakeAmplitudeSdk.init).toHaveBeenCalledTimes(1)
      expect(fakeAmplitudeSdk.init).toHaveBeenCalledWith(
        'test-key-123',
        expect.anything(),
        expect.anything(),
      )
    })

    it('forwards track() to amplitude.track() with event name + properties', async () => {
      const { amplitudePlugin } = await import('../../plugins/amplitude')
      const { fakeAmplitudeSdk } = await import('../__fakes__/fake-amplitude-sdk')
      const plugin = amplitudePlugin({ apiKey: 'k' })
      await plugin.init()

      plugin.track('tour_started', { tourId: 'demo', stepCount: 4 })

      expect(fakeAmplitudeSdk.track).toHaveBeenCalledWith(
        'tour_started',
        expect.objectContaining({ tourId: 'demo', stepCount: 4 }),
      )
    })
  })

  describe('with peer missing (US-5)', () => {
    it('returns a no-op tracker and does not throw', async () => {
      vi.resetModules()
      vi.doMock('@amplitude/analytics-browser', () => {
        throw new Error("Cannot find module '@amplitude/analytics-browser'")
      })
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { amplitudePlugin } = await import('../../plugins/amplitude')
      const plugin = amplitudePlugin({ apiKey: 'k' })

      await expect(plugin.init()).resolves.not.toThrow()
      expect(() => plugin.track('x', {})).not.toThrow()
      // Documented degradation: at least one warning.
      expect(warn).toHaveBeenCalled()

      warn.mockRestore()
    })
  })
})
```

---

## Build / Bundle Asserter

```bash
#!/usr/bin/env bash
# tasks/sprint-1-stop-the-bleeding/verify-phase-1.sh
# Run after `pnpm --filter @tour-kit/analytics build`.
set -u
fails=0
gate() { if eval "$1"; then echo "✓ $2"; else echo "✗ $2 — $(eval "$3")"; fails=$((fails+1)); fi; }

gz_idx=$(gzip -c packages/analytics/dist/index.js | wc -c | tr -d ' ')
gz_amp=$(gzip -c packages/analytics/dist/plugins/amplitude.js | wc -c | tr -d ' ')
amp_strings=$(grep -c '@amplitude/plugin-' packages/analytics/dist/plugins/amplitude.js)

gate "[ $gz_idx -lt 8000 ]"   "US-1: dist/index.js gz < 8000 B"     "echo got $gz_idx"
gate "[ $gz_amp -lt 1000 ]"   "US-1: dist/plugins/amplitude.js gz < 1000 B" "echo got $gz_amp"
gate "[ $amp_strings -eq 0 ]" "US-2: no @amplitude/plugin- strings in dist" "echo got $amp_strings"

# US-4: package metadata
gate 'node -e "const p=require(\"./packages/analytics/package.json\"); process.exit(p.peerDependencies?.[\"@amplitude/analytics-browser\"] ? 0 : 1)"' \
     'US-4: @amplitude/analytics-browser in peerDependencies' "echo missing"
gate 'node -e "const p=require(\"./packages/analytics/package.json\"); process.exit(p.peerDependenciesMeta?.[\"@amplitude/analytics-browser\"]?.optional ? 0 : 1)"' \
     'US-4: peerDependenciesMeta optional flag' "echo missing"
gate 'node -e "const p=require(\"./packages/analytics/package.json\"); process.exit(p.peerDependencies?.[\"posthog-js\"] && p.peerDependencies?.[\"mixpanel-browser\"] ? 0 : 1)"' \
     'US-4: posthog + mixpanel also declared as peers' "echo missing"

# US-3: downstream still builds
gate 'pnpm build --filter=./packages/* >/tmp/phase-1-build.log 2>&1' \
     'US-3: monorepo build green' "tail -n3 /tmp/phase-1-build.log"

# US-6: analytics tests still pass
gate 'pnpm --filter @tour-kit/analytics test --run >/tmp/phase-1-test.log 2>&1' \
     'US-6: analytics vitest green' "tail -n5 /tmp/phase-1-test.log"

[ "$fails" -eq 0 ] || { echo "Phase 1 FAILED gates: $fails"; exit 1; }
echo "Phase 1 all gates green."
```

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to write the
Phase 1 tests:

---
You are writing the test additions for Phase 1 of Sprint 1 in the tour-kit
monorepo — externalizing `@amplitude/analytics-browser` in
`packages/analytics/tsup.config.ts` and declaring it (plus `posthog-js` and
`mixpanel-browser`) as real optional peers in `packages/analytics/package.json`.

### What This Project Is
`@tour-kit/analytics` is a plugin-based analytics adapter for tour-kit. It
ships vendor plugins (PostHog, Mixpanel, Amplitude, Google Analytics, console)
that dynamically import the vendor SDK so consumers only pay for what they
use — IF the SDK is externalized. A tsup misconfiguration silently inlined
the entire Amplitude SDK (`~217 KB raw`, `~62 KB gz`) into the published
dist. Phase 1 fixes that.

### Acceptance Criteria (from User Stories)
| #    | User Story                                                                                       | Validation Check                                                                                       | Pass Condition                              |
| ---- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| US-1 | Consumer without Amplitude shouldn't pay for the SDK                                             | `gzip -c packages/analytics/dist/index.js \| wc -c`, `gzip -c .../plugins/amplitude.js \| wc -c`       | index.js < 8000, amplitude.js < 1000        |
| US-2 | SDK strings gone from dist                                                                       | `grep -c '@amplitude/plugin-' .../amplitude.js`                                                        | == 0                                        |
| US-3 | 8 downstream packages still build                                                                | `pnpm build --filter='./packages/*'`                                                                   | exit 0                                      |
| US-4 | Clear peer-dep contract                                                                          | `package.json` `peerDependencies` + `peerDependenciesMeta`                                              | 3 SDKs present + `optional: true`           |
| US-5 | Plugin no-ops gracefully when SDK absent                                                         | New vitest test                                                                                        | No throw; `console.warn` called once        |
| US-6 | Existing 11 analytics tests stay green                                                           | `pnpm --filter @tour-kit/analytics test`                                                               | 11 + new pass                               |

### Why Fakes Are Required
The real `@amplitude/analytics-browser` is ~217 KB and pulls a network
identity service when its `init()` is called. Unit tests must NOT touch it.
We use `vi.mock` for the happy path and `vi.doMock` to simulate the
"peer not installed" path.

### What NOT to Test
- Don't test the Amplitude SDK itself — that's their problem.
- Don't try to install Amplitude in CI to verify "real wiring." That belongs
  in Phase 8's release smoke; in PR CI it just inflates duration.
- Don't edit any of the existing 11 analytics tests. They're the canary that
  the externalization didn't change behavior.
- Don't add tests for `consolePlugin`, `posthogPlugin`, `mixpanelPlugin`,
  `googleAnalyticsPlugin` — they're not affected by Phase 1. Phase 2 owns
  their public-path contract.
- Don't gate PR CI on the optional E2E install smoke — Phase 8 owns that.

### Critical: Fake Implementations

```ts
// packages/analytics/src/__tests__/__fakes__/fake-amplitude-sdk.ts
import { vi } from 'vitest'

export const fakeAmplitudeSdk = {
  init: vi.fn((_apiKey: string, _userId?: string, _options?: unknown) => ({
    promise: Promise.resolve(),
  })),
  track: vi.fn((_eventName: string, _properties?: Record<string, unknown>) => ({
    promise: Promise.resolve(),
  })),
  identify: vi.fn(),
  setUserId: vi.fn(),
  reset: vi.fn(),
  flush: vi.fn(() => ({ promise: Promise.resolve() })),
}
```

Mirror only what `packages/analytics/src/plugins/amplitude.ts` actually calls
— do not over-stub.

### Files to Create
```
packages/analytics/src/__tests__/__fakes__/fake-amplitude-sdk.ts
packages/analytics/src/__tests__/__fakes__/missing-peer.ts        # optional helper
packages/analytics/src/__tests__/plugins/amplitude.test.ts        # new (or extend existing)
tasks/sprint-1-stop-the-bleeding/verify-phase-1.sh                # bash asserter
```

### Per-File Coverage Guidance

#### `amplitude.test.ts`
- `describe('with peer installed')`: assert `init` called once with the
  configured `apiKey`; assert `track('tour_started', { tourId, stepCount })`
  forwards to `fakeAmplitudeSdk.track` with the same args.
- `describe('with peer missing')`: use `vi.resetModules()` + `vi.doMock` to
  reject the dynamic import, then `await import('../../plugins/amplitude')`
  fresh. `plugin.init()` must not reject; `plugin.track('x', {})` must not
  throw; `console.warn` called at least once.
- DO NOT assert specific warning message text — that's brittle. Assert
  "at least one warn fired."

### Success Criteria
- `pnpm --filter @tour-kit/analytics test --run` exits 0.
- `bash tasks/sprint-1-stop-the-bleeding/verify-phase-1.sh` prints all ✓.
- `git diff packages/analytics/src/plugins/amplitude.ts` is empty (no source
  changes to the plugin file in this phase).

### Expected End State
```
packages/analytics/
├── src/__tests__/
│   ├── __fakes__/
│   │   ├── fake-amplitude-sdk.ts
│   │   └── missing-peer.ts
│   └── plugins/
│       └── amplitude.test.ts
├── package.json                          # 3 new peer entries
└── tsup.config.ts                        # @amplitude/analytics-browser in external

tasks/sprint-1-stop-the-bleeding/
└── verify-phase-1.sh
```
---

---

## Run Commands

```bash
# Unit tests
pnpm --filter @tour-kit/analytics test --run

# Bundle + metadata gate (after build)
pnpm --filter @tour-kit/analytics build
bash tasks/sprint-1-stop-the-bleeding/verify-phase-1.sh

# Single test file
pnpm --filter @tour-kit/analytics test --run src/__tests__/plugins/amplitude.test.ts

# Whole monorepo (downstream guard)
pnpm build --filter='./packages/*'
pnpm test --filter='./packages/*' --run
```

---

**Next:** [phase-2-tests.md](phase-2-tests.md)

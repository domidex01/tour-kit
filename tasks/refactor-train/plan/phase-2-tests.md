# Phase 2 — Testing: Logger Migration And Console Guard Rail

**Scope:** `packages/core/src/utils/logger.ts` runtime; ~14 "migrate"-bucket call sites; 8 "preserve"-bucket sites (kept loud); `tooling/biome/biome.json` `noConsole` rule + overrides; optional `scripts/check-console-usage.sh`.
**Key Pattern:** Integration phase. Mock strategy is **spy-on-console**, not "fake an external service" — the test must verify that after `logger.configure({ level: 'silent' })` a migrated call site does **not** reach `console.*`, while a preserved call site does. The Biome rule and overrides are validated by running `pnpm lint` itself, not by re-implementing the rule logic.
**Dependencies:** vitest, @testing-library/react (only where the migrated site is a hook/component), `@tour-kit/core` `logger`, Biome CLI for the lint gate.

---

## User Stories

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | As a production consumer, I want `logger.configure({ level: 'silent' })` to silence every migrated dev warning (segment, registry, AI, license trial badge), so my production console isn't noisy | `logger-silencing.test.ts` per migrated site | `console.error/warn` spy not called when level is `'silent'`; called when level is `'warn'`/`'error'` (default) |
| US-2 | As a license consumer using `LicenseTestMode`, I want the production "test mode active" warning to remain loud and bypass any `logger.configure` silence, so I can't accidentally ship a test license | `license-test-mode.test.tsx` preserve test | `console.warn` spy called when `<LicenseTestMode>` mounts even after `logger.configure({ level: 'silent' })` |
| US-3 | As a maintainer, I want `pnpm lint` to fail when any new production source file adds a `console.*` call outside the documented preserve list, so the gate cannot drift | `biome-noConsole.test.ts` + CI lint job | `pnpm lint` exits non-zero on a fixture file with `console.warn` in a non-overridden path; exits 0 with current preserve list |
| US-4 | As an announcements / media / react consumer, I want the runtime adapter and component warnings to be silenced by `logger.configure`, so my dashboard doesn't get a console flood | `announcements-sonner.test.ts`, `media-slot.test.tsx`, `tour-card.test.tsx` | Each respective warning, after migration, respects `logger.configure({ level: 'silent' })` |
| US-5 | As a license package maintainer, I want the license dependency-on-core decision to be reflected in the build outputs (no double-bundling of core if added, no broken imports if not added), so consumers don't get a surprise bundle-size regression | `package-json-deps.test.ts` + `pnpm --filter @tour-kit/license build` | If core was added: `@tour-kit/core` in `dependencies` AND in `tsup.config.ts` `external` (size delta < 2KB gzipped); if not added: no `@tour-kit/core` import remains in license source |

---

## Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|-----------|--------------|----------------|------------|
| `logger.configure({ level })` | None — real implementation | After `'silent'`, downstream `logger.warn/error` is a no-op (spy on `console.warn` / `console.error` counts 0) | US-1, US-4 |
| `console.warn` / `console.error` | `vi.spyOn(console, 'warn').mockImplementation(() => {})` in `beforeEach`; restore in `afterEach` | Call count and first-call substring | US-1, US-2, US-3, US-4 |
| `useSegment` (unknown-segment warn) | Render via `<SegmentationProvider segments={{}}>`; read unknown segment | `console.warn` spy: 0 when silent; 1 when level allows; called once per unknown segment | US-1 |
| `TourRegistry` duplicate registration | Construct registry; register same `id` twice | Spy called once per duplicate; substring `"useTourRegistry"` or `"register"` | US-1 |
| `<LicenseTestMode>` two warnings | Mount component once with valid license; mount again with test license | `console.warn` spy called for the production-warning sites (preserve list) regardless of logger level | US-2 |
| `<ProGate>` console.error | Mount with `<License>` denied | `console.error` spy called (preserve list, bypasses logger) | US-2 |
| Biome `noConsole` rule | Real Biome CLI invocation; spawn process | `pnpm exec biome lint <fixture>` exits non-zero with a fresh `console.warn` outside overrides | US-3 |
| `scripts/check-console-usage.sh` (if added) | Bash invocation against a fixture tree | Returns 0 on current tree; 1 on a fixture with a non-allowed `console.*` line | US-3 |
| License `package.json` dependency check | Read `packages/license/package.json` and `packages/license/tsup.config.ts` as JSON/text | If decision = "add core": both contain `@tour-kit/core`; if "preserve standalone": neither | US-5 |

---

## Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|-------------|-------|-------------|
| Unit | jsdom + vitest spies on `console.*`; real `logger` | <5s per package | Every push |
| Lint gate | Biome CLI; runs against repo working tree | <15s | Every push (via `pnpm lint` in `turbo` graph) |
| Build gate (license only) | tsup build of license + headless entries | ~10s | Pre-merge if license touched |
| Audit gate | `rg` against `packages/**/src` against the preserve allowlist | <2s | Pre-merge, also in CI shell script |

No integration tier loads a real model or API — Phase 2 has no heavy deps.

---

## Fake / Mock Implementations

**No fakes.** Phase 2 is a logger plumbing migration. The closest thing to a "fake" is the **console spy pattern**, which is universal:

```ts
// Reusable per-test setup, paste into each migrated site's test file
import { logger } from '@tour-kit/core'

let warnSpy: ReturnType<typeof vi.spyOn>
let errorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  logger.configure({ level: 'warn' }) // reset to default
})

afterEach(() => {
  warnSpy.mockRestore()
  errorSpy.mockRestore()
  logger.configure({ level: 'warn' })
})
```

The two flavors of test:

**Migrate-bucket assertion (US-1, US-4):**
```ts
it('respects logger silence after migration', () => {
  logger.configure({ level: 'silent' })
  triggerTheMigratedWarning()
  expect(warnSpy).not.toHaveBeenCalled()
})

it('still warns at default level', () => {
  triggerTheMigratedWarning()
  expect(warnSpy).toHaveBeenCalledOnce()
})
```

**Preserve-bucket assertion (US-2):**
```ts
it('keeps loud warning even under logger silence', () => {
  logger.configure({ level: 'silent' })
  triggerThePreservedWarning()
  expect(warnSpy).toHaveBeenCalledOnce()
})
```

---

## Test File List

```
packages/core/src/__tests__/utils/
└── logger.test.ts                                              # NEW or EXTEND: logger.configure level filtering (silent, error, warn, info, debug); restoreDefaults

packages/core/src/__tests__/lib/segmentation/
└── use-segment.test.tsx                                        # EXTEND: unknown segment warns via logger; logger.configure('silent') silences

packages/core/src/__tests__/registry/
└── tour-registry.test.tsx                                      # EXTEND: duplicate-registration warns via logger; silenced under 'silent'

packages/core/src/lib/
└── interpolate.test.ts                                         # EXTEND: warnOnMissing path — assert decision from PR is honored (migrate OR preserve), test both branches under the chosen decision

packages/announcements/src/__tests__/adapters/
└── sonner.test.ts                                              # NEW or EXTEND: adapter warning routed through logger

packages/media/src/__tests__/components/
└── media-slot.test.tsx                                         # NEW or EXTEND: invalid embed warning routed through logger

packages/react/src/__tests__/components/card/
└── tour-card.test.tsx                                          # EXTEND: runtime warning routed through logger

packages/ai/src/__tests__/core/
├── events.test.ts                                              # NEW or EXTEND: async-handler error logging via logger; silenced
└── use-persistence.test.tsx                                    # NEW or EXTEND: error path via logger

packages/ai/src/__tests__/hooks/
└── use-tour-assistant.test.tsx                                 # NEW or EXTEND: error path via logger

packages/ai/src/__tests__/server/
└── route-handler.test.ts                                       # NEW or EXTEND: two error paths via logger

packages/license/src/__tests__/components/
├── trial-badge.test.tsx                                        # NEW: DX warning via logger (assuming decision = migrate); silenced
├── license-test-mode.test.tsx                                  # NEW or EXTEND: PRESERVE — warning fires regardless of logger level
├── license-warning.test.tsx                                    # NEW or EXTEND: PRESERVE — warning fires regardless of logger level
├── pro-gate.test.tsx                                           # NEW or EXTEND: PRESERVE — error fires regardless of logger level
└── domain.test.ts                                              # NEW or EXTEND: PRESERVE — domain mismatch warning fires regardless

packages/license/src/__tests__/context/
└── license-context.test.tsx                                    # NEW or EXTEND: DX warning via logger (assuming decision = migrate); silenced

packages/license/src/__tests__/
└── package-json-deps.test.ts                                   # EXTEND: assert @tour-kit/core dependency state matches the decision gate outcome

tooling/biome/__tests__/
└── biome-noConsole.test.ts                                     # NEW: run Biome CLI on a fixture file, assert pass/fail behavior matches override config

scripts/__tests__/                                              # OPTIONAL
└── check-console-usage.test.sh                                 # NEW IF the optional grep gate ships: shellcheck-clean, exits 0 on clean tree, 1 on injected violation
```

Every "migrate" entry in [`phase-2.md`'s Per-Site Classification](../phase-2.md#per-site-classification) has a test row. Every "preserve" entry has an explicit no-silence-bypass test row to lock the contract.

---

## `conftest.ts` Equivalent — Vitest Setup Additions

**Additions to** existing setup files. No new global setup needed; the console-spy + logger-reset pattern lives inside each test file because the spy must be created **before** the source-under-test imports `logger`.

Per-file pattern (paste at top of every migrate-bucket test):

```ts
import { logger } from '@tour-kit/core'
import { afterEach, beforeEach, vi } from 'vitest'

let warnSpy: ReturnType<typeof vi.spyOn>
let errorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  logger.configure({ level: 'warn' })
})

afterEach(() => {
  warnSpy.mockRestore()
  errorSpy.mockRestore()
  logger.configure({ level: 'warn' })
})
```

For the Biome rule test:

```ts
// tooling/biome/__tests__/biome-noConsole.test.ts
import { execSync } from 'node:child_process'
import { writeFileSync, unlinkSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
```

---

## Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Don't re-test what Biome already tests | Test that **our config** triggers, not that `noConsole` rule itself works | Biome is an external tool; we don't own its rule logic. We own the override list. |
| Spy on `console.*` before the source-under-test runs | Spy in `beforeEach`, then trigger the warning | If you spy after the call, `console.*` has already executed |
| Reset `logger.configure` in `afterEach` | `logger` is a module-scope singleton across packages | Memory #45 — singleton state leaks across tests. Explicit reset prevents flaky cross-suite ordering |
| Lock the preserve list with explicit tests | Each preserve-bucket file gets a test that asserts loudness survives `logger.configure({ level: 'silent' })` | Memory #208: a future maintainer might "fix" `LicenseTestMode` by routing through logger; this test fails loudly when they try |
| Honor the license decision gate as a test parameter | One test file with `describe.if(licenseHasCoreDependency)` blocks for both routes | The PR records the decision; the test enforces consistency between `package.json`, `tsup.config.ts`, and the migrated/preserved source |
| Test `interpolate.ts`'s `warnOnMissing` path under both decisions | One test that asserts the chosen path; comment notes the alternative | Phase 2's open decision (preserve vs migrate); whichever way the PR goes, the test pins it |
| Run real Biome CLI in a test | `execSync('pnpm exec biome lint <fixture>')` against a temp fixture | Validates the actual rule + override config, not a re-implementation |
| Skip `noConsole` suppression-directive testing | Don't add `biome-ignore noConsole` directives | Memory #208: noConsole isn't currently enforced; directives become unused-suppression errors |
| Cross-reference Phase 1 outcome | Re-run audit after Phase 1 lands BEFORE starting Phase 2 | Per [`phase-2.md`'s note](../phase-2.md#per-site-classification): Phase 1 changes the audit count by 3 (one per audience evaluator) |

---

## Example Test Case

```ts
// packages/core/src/__tests__/lib/segmentation/use-segment.test.tsx

import { logger, SegmentationProvider } from '@tour-kit/core'
import { renderHook } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSegment } from '../../../lib/segmentation/use-segment'
import { uniqueSegment } from '../../_helpers/unique-segment'

function wrapper(segments: Record<string, boolean> = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <SegmentationProvider segments={segments}>{children}</SegmentationProvider>
  }
}

describe('useSegment — unknown-segment warning (migrated to logger)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logger.configure({ level: 'warn' })
  })

  afterEach(() => {
    warnSpy.mockRestore()
    logger.configure({ level: 'warn' })
  })

  describe('default logger level', () => {
    it('warns once for an unknown segment', () => {
      const seg = uniqueSegment('unk')
      renderHook(() => useSegment(seg), { wrapper: wrapper({}) })
      expect(warnSpy).toHaveBeenCalledOnce()
      expect(warnSpy.mock.calls[0]?.[0]).toMatch(/useSegment/)
    })

    it('does not re-warn for the same unknown segment', () => {
      const seg = uniqueSegment('unk-dup')
      renderHook(() => useSegment(seg), { wrapper: wrapper({}) })
      renderHook(() => useSegment(seg), { wrapper: wrapper({}) })
      expect(warnSpy).toHaveBeenCalledOnce()
    })
  })

  describe('logger.configure({ level: "silent" })', () => {
    it('suppresses the unknown-segment warning', () => {
      logger.configure({ level: 'silent' })
      const seg = uniqueSegment('unk-silent')
      renderHook(() => useSegment(seg), { wrapper: wrapper({}) })
      expect(warnSpy).not.toHaveBeenCalled()
    })
  })

  describe('regression — was console.warn before migration', () => {
    it('routes through logger, not direct console (proves the migration happened)', () => {
      const loggerSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
      renderHook(() => useSegment(uniqueSegment('routed')), { wrapper: wrapper({}) })
      expect(loggerSpy).toHaveBeenCalledOnce()
      loggerSpy.mockRestore()
    })
  })
})

// ─── Companion test for a PRESERVE-bucket site ───────────────────────────────
// packages/license/src/__tests__/components/license-test-mode.test.tsx

describe('LicenseTestMode — PRESERVE (does not respect logger.configure)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
    logger.configure({ level: 'warn' })
  })

  it('still warns when logger is silent (loud-by-design)', () => {
    logger.configure({ level: 'silent' })
    render(<LicenseTestMode />)
    expect(warnSpy).toHaveBeenCalled()
  })
})
```

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session:

---
You are writing the complete test suite for Phase 2 of the **Tour Kit Refactor Train** — Logger Migration And Console Guard Rail.

### What This Project Is
Tour Kit is a TypeScript React monorepo (~12 packages). `@tour-kit/core`'s `logger` (`packages/core/src/utils/logger.ts`) already supports `logger.configure({ level: 'silent' | 'error' | 'warn' | 'info' | 'debug' })`, but ~14 production source files still call `console.warn` / `console.error` directly. Phase 2 migrates "migrate"-bucket sites to `logger.*` and keeps "preserve"-bucket sites loud (license enforcement, the analytics console plugin, etc.). It also adds a Biome `noConsole` rule with overrides.

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | Migrated warnings respect `logger.configure({ level: 'silent' })` | Per-site silence test | `console.warn` spy not called under silent |
| US-2 | Preserve-bucket warnings stay loud | Per-site loud-survives-silent test | `console.warn` spy called under silent |
| US-3 | Biome rule blocks new `console.*` outside overrides | `biome-noConsole.test.ts` | `pnpm exec biome lint <fixture>` exits non-zero on injected violation |
| US-4 | Adapter/component runtime warnings respect silence | sonner/media-slot/tour-card tests | `console.warn` spy not called under silent |
| US-5 | License decision-gate consistency | `package-json-deps.test.ts` + license build | dependency state matches PR decision |

### Why Fakes Are Required
None. The mock surface is `vi.spyOn(console, 'warn')` and `vi.spyOn(console, 'error')`. The Biome rule test uses real `execSync('pnpm exec biome lint ...')` against a tmpdir fixture.

### What NOT to Test
- Don't re-test Biome's `noConsole` rule itself — test only that **our override list** is correct
- Don't test `console.log` migrations in `packages/codemods/src/cli.ts` — it's exempt (CLI output is intentional)
- Don't test build scripts (`tsup.config.ts`) — exempt
- Don't migrate examples, docs scripts, tests, or spike code under any test assertion
- Don't add `biome-ignore noConsole` directives anywhere — Memory #208 says the rule isn't enforced repo-wide today, so directives flag as unused-suppression errors
- Don't test `interpolate.ts` both ways. Pick the PR's decision and pin it. Note the other branch in a comment.

### Critical: Setup Pattern (Paste Into Every Migrate-Bucket Test)

```ts
import { logger } from '@tour-kit/core'
import { afterEach, beforeEach, vi } from 'vitest'

let warnSpy: ReturnType<typeof vi.spyOn>
let errorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  logger.configure({ level: 'warn' })
})

afterEach(() => {
  warnSpy.mockRestore()
  errorSpy.mockRestore()
  logger.configure({ level: 'warn' })
})
```

### Test Files to Create

```
packages/core/src/__tests__/utils/logger.test.ts
packages/core/src/__tests__/lib/segmentation/use-segment.test.tsx
packages/core/src/__tests__/registry/tour-registry.test.tsx
packages/core/src/lib/interpolate.test.ts                                    # EXTEND
packages/announcements/src/__tests__/adapters/sonner.test.ts
packages/media/src/__tests__/components/media-slot.test.tsx
packages/react/src/__tests__/components/card/tour-card.test.tsx              # EXTEND
packages/ai/src/__tests__/core/events.test.ts
packages/ai/src/__tests__/hooks/use-persistence.test.tsx
packages/ai/src/__tests__/hooks/use-tour-assistant.test.tsx
packages/ai/src/__tests__/server/route-handler.test.ts
packages/license/src/__tests__/components/trial-badge.test.tsx
packages/license/src/__tests__/components/license-test-mode.test.tsx         # PRESERVE
packages/license/src/__tests__/components/license-warning.test.tsx           # PRESERVE
packages/license/src/__tests__/components/pro-gate.test.tsx                  # PRESERVE
packages/license/src/__tests__/components/domain.test.ts                     # PRESERVE
packages/license/src/__tests__/context/license-context.test.tsx
packages/license/src/__tests__/package-json-deps.test.ts                     # EXTEND
tooling/biome/__tests__/biome-noConsole.test.ts
```

### Per-File Coverage Guidance

#### `packages/core/src/__tests__/utils/logger.test.ts`
Test `logger.configure({ level })` filtering at all 5 levels:
- `silent`: `logger.error/warn/info/debug` calls produce 0 `console.*` calls
- `error`: only `logger.error` calls `console.error`
- `warn`: `logger.error` and `logger.warn` reach console; `info`/`debug` don't
- `info`: through `info`
- `debug`: all reach console
Test `logger.configure({ level: 'warn' })` resets state after `'silent'`.

#### Per migrate-bucket file (sonner, media-slot, tour-card, ai/*, trial-badge, license-context, use-segment, tour-registry)
Three tests per file:
1. **Default level**: trigger the warning, assert `console.*` spy called with substring matching the new prefix (e.g., `useSegment:` or `AI:`)
2. **Silent level**: `logger.configure({ level: 'silent' })`, trigger, assert spy NOT called
3. **Routes through logger**: spy on `logger.warn`/`logger.error` (not console), trigger, assert called once — this proves the migration happened, not just that the warning still works

#### Per preserve-bucket file (license-test-mode, license-warning, pro-gate, domain)
Two tests per file:
1. Trigger, assert `console.warn`/`console.error` spy called
2. `logger.configure({ level: 'silent' })`, trigger, **assert spy STILL called** (this is the contract — preserve sites bypass logger)

#### `packages/license/src/__tests__/package-json-deps.test.ts`
- Read `packages/license/package.json` JSON. Decision = add core: assert `@tour-kit/core` in `dependencies`. Decision = standalone: assert NOT in `dependencies`.
- Read `packages/license/tsup.config.ts` as text. Decision = add core: assert `@tour-kit/core` appears in the `external` array.

#### `tooling/biome/__tests__/biome-noConsole.test.ts`
```ts
import { execSync } from 'node:child_process'
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('Biome noConsole rule', () => {
  let dir: string
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'biome-noconsole-')) })
  afterEach(() => { rmSync(dir, { recursive: true, force: true }) })

  it('flags console.warn in a non-overridden path', () => {
    const file = join(dir, 'fixture.ts')
    writeFileSync(file, "console.warn('should fail')\n")
    expect(() => execSync(`pnpm exec biome lint ${file}`, { stdio: 'pipe' }))
      .toThrow()
  })

  it('allows console.warn in preserve-listed paths (e.g. packages/core/src/utils/logger.ts)', () => {
    // Don't rewrite the real file — assert by reading the override config
    const config = readFileSync('tooling/biome/biome.json', 'utf-8')
    expect(config).toMatch(/packages\/core\/src\/utils\/logger\.ts/)
    expect(config).toMatch(/packages\/license\/src\/components\/license-test-mode\.tsx/)
  })
})
```

### Data Model Notes
- `logger` is a module-scope singleton — `logger.configure` MUST be reset in `afterEach`
- The spy must be installed in `beforeEach`, before the source-under-test runs
- For React component sites, `render(<Component/>)` + the spy must come AFTER the spy is set up
- `process.env.NODE_ENV` is `'test'` under vitest; dev-only branches are active

### Success Criteria
- `pnpm lint` exits 0 with the new `noConsole` config + overrides
- `pnpm --filter @tour-kit/core test` exits 0
- `pnpm --filter @tour-kit/license test` exits 0
- `pnpm --filter @tour-kit/license build` exits 0 (license decision honored)
- All migrated sites have **3 tests** (default, silent, routes-through-logger)
- All preserve sites have **2 tests** (loud-by-default, loud-under-silent)
- Re-running the audit command from `phase-2.md` returns only paths matching the documented preserve/exempt list

### Expected File Structure at End
See "Test Files to Create" — every path above contains at least one `describe`.
---

---

## Run Commands

```bash
# Per-package fast unit tests
pnpm --filter @tour-kit/core test
pnpm --filter @tour-kit/announcements test
pnpm --filter @tour-kit/media test
pnpm --filter @tour-kit/react test
pnpm --filter @tour-kit/ai test
pnpm --filter @tour-kit/license test

# Lint gate (the actual rule + overrides)
pnpm lint
pnpm exec biome explain noConsole

# Workspace pre-merge
pnpm test
pnpm typecheck
pnpm build

# Production-audit re-run (should match preserve/exempt list only)
rg -n "console\.(warn|error|log|info)" packages \
  --glob '*.{ts,tsx}' \
  --glob '!**/dist/**' \
  --glob '!**/__tests__/**' \
  --glob '!**/*.test.*' \
  --glob '!**/*.spec.*' \
  --glob '!**/__spikes__/**'

# Single migrated site
pnpm --filter @tour-kit/core test -- use-segment

# Biome rule test
pnpm --filter tooling-biome test  # if added as a workspace package, otherwise: pnpm vitest run tooling/biome
```

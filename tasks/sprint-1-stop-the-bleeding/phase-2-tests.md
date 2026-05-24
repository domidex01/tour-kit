# Phase 2 — Testing: Remove Plugin Re-exports from Analytics Root (B-3)

**Scope:** `packages/analytics/src/index.ts` (delete 5 `export { *Plugin }` lines),
`packages/analytics/package.json` (add `./console` subpath), `packages/analytics/tsup.config.ts`
(add `plugins/console` entry), `packages/analytics/MIGRATION.md` (new),
internal call-sites that imported plugins from the root, and docs MDX.
**Phase type:** **Breaking API contract.** This is a deliberate consumer-facing
break. Tests fall into three buckets: (a) the dist no longer carries plugin
code at the root, (b) every subpath still resolves and ships an identical
plugin object, (c) every internal consumer was updated. No new runtime logic
to mock — the plugin code is unchanged; only the public path changed.
**Key Pattern:** Build-output grep gates + a subpath-equivalence vitest suite
that imports the same plugin from old (root) and new (subpath) paths and
asserts identity (after the source change, the root import must fail at
type-check, which is itself part of the contract). No SDK mocks beyond what
Phase 1 already established.
**Dependencies:** `vitest`, `tsup`, `gzip`, `grep`, `node`, the Phase 1
`fakeAmplitudeSdk` fake (reused as-is — do not duplicate).

---

## User Stories

| #    | User Story                                                                                                                                       | Validation Check                                                                                                                  | Pass Condition                                                                              |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| US-1 | As a consumer who only uses PostHog, I want my bundle to NOT contain Mixpanel/Amplitude/GA/console plugin code.                                  | `grep -cE 'posthogPlugin\|mixpanelPlugin\|amplitudePlugin\|googleAnalyticsPlugin\|consolePlugin' packages/analytics/dist/index.js` | `== 0` after Phase 2; was 5 before                                                          |
| US-2 | As any consumer, I want the analytics root entry to be tiny (just `createAnalytics` + `AnalyticsProvider` + types).                              | `gzip -c packages/analytics/dist/index.js \| wc -c`                                                                               | `< 4000 B` (was ~6 KB after Phase 1)                                                        |
| US-3 | As a consumer migrating, I want every plugin reachable via its subpath — including `console`, which previously had no subpath.                   | Five dynamic imports from subpaths in a vitest run                                                                                | All 5 resolve and export a function whose return implements the `AnalyticsPlugin` shape    |
| US-4 | As a documenter, I want a `MIGRATION.md` next to the package so consumers have an authoritative single page.                                     | `test -f packages/analytics/MIGRATION.md` + grep for each before/after row                                                        | File exists; all 5 mappings present                                                          |
| US-5 | As a downstream package maintainer (8 packages import analytics), I want the externalization to not break my build.                              | `pnpm build --filter='./packages/*'`                                                                                              | exit 0                                                                                       |
| US-6 | As an examples/docs/blog maintainer, I want every in-repo file to have been updated to subpath form — no stale root imports of plugin functions. | `rg "from ['\"]@tour-kit/analytics['\"]" packages apps examples \| rg "(posthog\|mixpanel\|amplitude\|googleAnalytics\|console)Plugin"` | `0` matches                                                                              |
| US-7 | As a CI engineer, I want existing analytics unit tests (11+ Phase 1 additions) to remain green — this is a path change, not a behavior change.   | `pnpm --filter @tour-kit/analytics test --run`                                                                                    | All pre-existing + Phase 1 tests still pass; new subpath tests pass                          |

---

## Component Mock Strategy

| Component                                  | Mock Strategy                                              | What to Assert                                                                            | User Story  |
| ------------------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------- |
| `src/index.ts` (root barrel)               | None — real build                                          | No plugin names in `dist/index.js`; root gz `< 4 KB`                                       | US-1, US-2  |
| Per-plugin subpath builds                  | None — real build                                          | `dist/plugins/{console,posthog,mixpanel,amplitude,google-analytics}.js` all exist          | US-3        |
| Subpath equivalence (vitest)               | Reuse `fakeAmplitudeSdk` from Phase 1; no other mocks       | Each `import { xPlugin } from '@tour-kit/analytics/x'` returns a function; calling it yields an object with `.init` + `.track` | US-3        |
| `package.json` `exports` map               | None — JSON read                                           | `./console` block present with `import.types`, `import.default`, `require.types`, `require.default` | US-3        |
| `MIGRATION.md`                              | None — file read                                           | 5 mapping rows present (one per plugin); call-out about types staying at root             | US-4        |
| Monorepo consumers                          | None — real workspace build                                | `pnpm build --filter='./packages/*'` exits 0                                              | US-5        |
| Internal call-site sweep                    | None — ripgrep                                             | Zero matches for plugin-name root imports                                                  | US-6        |
| Existing 11 + Phase 1 analytics tests       | None — re-run                                              | Still green                                                                                | US-7        |

---

## Test Tier Table

| Tier             | Dependencies                                              | Speed     | When to Run                              |
| ---------------- | --------------------------------------------------------- | --------- | ---------------------------------------- |
| Unit (vitest)    | `vi.mock` for `@amplitude/analytics-browser` (Phase 1 reuse) | < 5 s   | Every push                                |
| Build assertion  | Real `tsup` build of analytics; `gzip` + `grep` on dist   | ~30 s     | Pre-PR, gated in `verify-phase-2.sh`     |
| Workspace build  | All packages built once                                   | ~3 min    | Pre-PR, on CI                             |
| Source-sweep grep| `rg` over `packages apps examples` MDX/TS files            | < 2 s    | Pre-PR + first CI step                    |

There is no E2E tier for Phase 2 — the migration is mechanical and the
behavior is unchanged. The Phase 8 smoke covers "real npm-installed
consumer."

---

## Fake / Mock Implementations

Phase 2 introduces **zero new fakes.** The Amplitude SDK fake from Phase 1
(`packages/analytics/src/__tests__/__fakes__/fake-amplitude-sdk.ts`) covers
the only third-party module touched here. If the Phase 2 subpath-equivalence
test needs to invoke `amplitudePlugin(...)`, it imports the fake from the
same path Phase 1 created.

> **Do not write a `consolePlugin` fake.** `console.log` is the dependency.
> Spy on it with `vi.spyOn(console, 'log')` in-test.

```ts
// Optional, only if the subpath-equivalence test invokes consolePlugin.
// Co-locate inside the test file, do not add a new fake module.
const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
afterEach(() => logSpy.mockClear())
```

---

## Test File List

```
packages/analytics/
├── src/__tests__/
│   ├── subpath-imports.test.ts          # NEW: 5 imports from subpaths, identity + shape assertions
│   ├── root-exports.test.ts             # NEW: ensures plugin names are NOT in root barrel
│   ├── __fakes__/
│   │   ├── fake-amplitude-sdk.ts        # EXISTING (Phase 1) — reused, not modified
│   │   └── missing-peer.ts              # EXISTING (Phase 1) — reused
│   └── (Phase 1 + pre-existing tests untouched)
├── MIGRATION.md                          # NEW (also asserted by build asserter)
├── package.json                          # MODIFIED — `./console` export block
├── src/index.ts                          # MODIFIED — 5 lines deleted, comment added
└── tsup.config.ts                        # MODIFIED — `plugins/console` entry

tasks/sprint-1-stop-the-bleeding/
└── verify-phase-2.sh                     # NEW: idempotent post-build gate runner

# Out-of-package (touched by §2.3, validated by US-6 grep):
apps/smoke/app/providers.tsx              # plugin import switched to subpath
examples/vite-app/src/App.tsx             # same
examples/next-app/src/app/providers.tsx   # same
examples/dashboard-next/app/providers.tsx # same
packages/analytics/README.md              # quick-start uses subpath imports
apps/docs/content/docs/analytics/**/*.mdx # all plugin imports use subpath
apps/docs/content/docs/migration/analytics-0-12-breaking-changes.mdx # NEW or extended
```

---

## Vitest Setup Additions

No global vitest setup changes. Phase 1's hoisted `vi.mock` of
`@amplitude/analytics-browser` only applies to the test file that declares
it; the new Phase 2 test files re-declare it locally.

```ts
// packages/analytics/src/__tests__/subpath-imports.test.ts (top)
import { vi } from 'vitest'

// Reuse Phase 1 fake — do not duplicate the surface.
vi.mock('@amplitude/analytics-browser', async () => {
  const { fakeAmplitudeSdk } = await import('./__fakes__/fake-amplitude-sdk')
  return fakeAmplitudeSdk
})
```

---

## Key Testing Decisions

| Decision                                                          | Approach                                                      | Rationale                                                                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Assert the *absence* of plugin names in `dist/index.js`           | `grep -cE 'posthogPlugin\|mixpanelPlugin\|...' \| == 0`       | A grep is the simplest gate that proves the re-exports were genuinely deleted and tsup didn't silently re-inline.        |
| Use subpath imports in the new tests, not relative `../../plugins/...` | `await import('@tour-kit/analytics/posthog')`             | The whole point is the public path. Relative imports would pass even if the package's `exports` map was broken.          |
| Don't test plugin *behavior* — just shape                         | `expect(plugin).toHaveProperty('init')`                       | Phase 1 already covered behavior (Amplitude). Re-testing PostHog/Mixpanel/GA here just bloats the suite and overlaps with the package's pre-existing tests. |
| `root-exports.test.ts` runs against the *source*, not the dist     | `import * as root from '../index'` + `expect(root).not.toHaveProperty('posthogPlugin')` | Catches accidental re-introduction at PR review time, before a build runs.                                               |
| Internal-callsite sweep is a bash grep, not a vitest test         | `rg` in `verify-phase-2.sh`                                   | Vitest can't easily enumerate the whole monorepo. A grep is faster and matches the §2.3 audit command verbatim.          |
| MIGRATION.md is a file-shape gate, not a doc-test                 | `grep -c '@tour-kit/analytics/posthog' MIGRATION.md`          | We care that all 5 mappings are present and the new paths are quoted exactly. A renderer test would be ceremony.          |
| No codemod tests                                                  | None — codemod explicitly out of scope per §2.5               | Phase 2 plan defers the codemod to a future sprint; testing a thing that doesn't exist is pointless.                      |

---

## Example Test Case

```ts
// packages/analytics/src/__tests__/subpath-imports.test.ts
import { describe, expect, it, vi } from 'vitest'

vi.mock('@amplitude/analytics-browser', async () => {
  const { fakeAmplitudeSdk } = await import('./__fakes__/fake-amplitude-sdk')
  return fakeAmplitudeSdk
})

describe('analytics subpath imports (post-B-3)', () => {
  it('@tour-kit/analytics/console exports consolePlugin', async () => {
    const mod = await import('@tour-kit/analytics/console')
    expect(typeof mod.consolePlugin).toBe('function')
    const plugin = mod.consolePlugin()
    expect(plugin).toHaveProperty('init')
    expect(plugin).toHaveProperty('track')
  })

  it('@tour-kit/analytics/posthog exports posthogPlugin', async () => {
    const mod = await import('@tour-kit/analytics/posthog')
    expect(typeof mod.posthogPlugin).toBe('function')
    const plugin = mod.posthogPlugin({ apiKey: 'x' })
    expect(plugin).toHaveProperty('init')
  })

  it('@tour-kit/analytics/mixpanel exports mixpanelPlugin', async () => {
    const mod = await import('@tour-kit/analytics/mixpanel')
    expect(typeof mod.mixpanelPlugin).toBe('function')
  })

  it('@tour-kit/analytics/amplitude exports amplitudePlugin', async () => {
    const mod = await import('@tour-kit/analytics/amplitude')
    expect(typeof mod.amplitudePlugin).toBe('function')
  })

  it('@tour-kit/analytics/google-analytics exports googleAnalyticsPlugin', async () => {
    const mod = await import('@tour-kit/analytics/google-analytics')
    expect(typeof mod.googleAnalyticsPlugin).toBe('function')
  })
})
```

```ts
// packages/analytics/src/__tests__/root-exports.test.ts
import { describe, expect, it } from 'vitest'
import * as root from '../index'

describe('analytics root barrel (post-B-3)', () => {
  it('does NOT re-export plugin functions', () => {
    expect(root).not.toHaveProperty('consolePlugin')
    expect(root).not.toHaveProperty('posthogPlugin')
    expect(root).not.toHaveProperty('mixpanelPlugin')
    expect(root).not.toHaveProperty('amplitudePlugin')
    expect(root).not.toHaveProperty('googleAnalyticsPlugin')
  })

  it('still exports the core surface', () => {
    expect(root).toHaveProperty('createAnalytics')
    expect(root).toHaveProperty('AnalyticsProvider')
    expect(root).toHaveProperty('useAnalytics')
    expect(root).toHaveProperty('useAnalyticsOptional')
  })
})
```

---

## Build / Bundle Asserter

```bash
#!/usr/bin/env bash
# tasks/sprint-1-stop-the-bleeding/verify-phase-2.sh
# Run after `pnpm --filter @tour-kit/analytics build`.
set -u
fails=0
gate() { if eval "$1"; then echo "✓ $2"; else echo "✗ $2 — $(eval "$3")"; fails=$((fails+1)); fi; }

# US-1: root barrel has no plugin code
plugin_strings=$(grep -cE 'posthogPlugin|mixpanelPlugin|amplitudePlugin|googleAnalyticsPlugin|consolePlugin' \
  packages/analytics/dist/index.js)
gate "[ $plugin_strings -eq 0 ]" "US-1: no plugin names in dist/index.js" "echo got $plugin_strings"

# US-2: root entry under 4 KB gz
gz_idx=$(gzip -c packages/analytics/dist/index.js | wc -c | tr -d ' ')
gate "[ $gz_idx -lt 4000 ]" "US-2: dist/index.js gz < 4000 B" "echo got $gz_idx"

# US-3: every plugin subpath built
for p in console posthog mixpanel amplitude google-analytics; do
  gate "[ -f packages/analytics/dist/plugins/$p.js ]" "US-3: dist/plugins/$p.js exists" "echo missing"
done

# US-3: console subpath in package.json exports
gate 'node -e "const p=require(\"./packages/analytics/package.json\"); process.exit(p.exports?.[\"./console\"] ? 0 : 1)"' \
     'US-3: package.json exports has ./console' "echo missing"

# US-4: MIGRATION.md exists and lists all 5 mappings
gate '[ -f packages/analytics/MIGRATION.md ]' "US-4: MIGRATION.md exists" "echo missing"
for p in posthog mixpanel amplitude google-analytics console; do
  gate "grep -q '@tour-kit/analytics/$p' packages/analytics/MIGRATION.md" \
       "US-4: MIGRATION.md mentions /$p" "echo missing"
done

# US-5: downstream still builds
gate 'pnpm build --filter=./packages/* >/tmp/phase-2-build.log 2>&1' \
     'US-5: monorepo build green' "tail -n3 /tmp/phase-2-build.log"

# US-6: no internal callers import plugins from root
# (ripgrep returns exit 1 when no match; invert with || true and count)
n=$(rg -n "from ['\"]@tour-kit/analytics['\"]" packages apps examples \
      --glob '*.{ts,tsx,md,mdx}' 2>/dev/null \
   | rg "(posthog|mixpanel|amplitude|googleAnalytics|console)Plugin" \
   | wc -l | tr -d ' ')
gate "[ $n -eq 0 ]" "US-6: no internal plugin-from-root imports" "echo got $n"

# US-7: tests green
gate 'pnpm --filter @tour-kit/analytics test --run >/tmp/phase-2-test.log 2>&1' \
     'US-7: analytics vitest green' "tail -n5 /tmp/phase-2-test.log"

[ "$fails" -eq 0 ] || { echo "Phase 2 FAILED gates: $fails"; exit 1; }
echo "Phase 2 all gates green."
```

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to write
the Phase 2 tests:

---
You are writing the test additions for Phase 2 of Sprint 1 in the tour-kit
monorepo — removing plugin re-exports from `@tour-kit/analytics` root entry,
adding the `./console` subpath, and writing the migration documentation.

### What This Project Is
`@tour-kit/analytics` is a plugin-based analytics adapter. Before this PR,
it re-exported five plugin functions from its root entry, which meant
bundlers couldn't tree-shake unused providers — a consumer who only used
PostHog still pulled in Mixpanel/Amplitude/GA/console plugin code. This PR
deletes the re-exports, requiring subpath imports for plugins (e.g.
`@tour-kit/analytics/posthog`).

### Acceptance Criteria (from User Stories)
| #    | User Story                                                            | Validation Check                                                            | Pass Condition                          |
| ---- | --------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------- |
| US-1 | Plugin code gone from root barrel                                     | `grep -cE '...Plugin' dist/index.js`                                        | `== 0`                                  |
| US-2 | Root entry tiny                                                        | `gzip -c dist/index.js \| wc -c`                                            | `< 4000`                                |
| US-3 | All 5 plugins reachable via subpath                                   | dynamic `import()` from each subpath in vitest                              | All 5 resolve + export function         |
| US-4 | MIGRATION.md exists                                                    | `test -f packages/analytics/MIGRATION.md` + 5 grep checks                   | Present                                  |
| US-5 | 8 downstream packages still build                                     | `pnpm build --filter='./packages/*'`                                        | exit 0                                  |
| US-6 | No internal `plugin from root` imports                                | `rg ... \| rg 'PluginsName' \| wc -l`                                        | `== 0`                                  |
| US-7 | Existing analytics tests + Phase 1 additions still green              | `pnpm --filter @tour-kit/analytics test`                                    | All pass                                |

### Why Fakes Are Required
The Amplitude SDK from Phase 1 is still mocked the same way — reuse the
existing fake at `packages/analytics/src/__tests__/__fakes__/fake-amplitude-sdk.ts`.
Do not duplicate it. PostHog, Mixpanel, and GA don't need fakes for Phase 2
because we only assert plugin *shape*, not behavior.

### What NOT to Test
- Don't write behavior tests for `posthogPlugin`, `mixpanelPlugin`,
  `googleAnalyticsPlugin`. They already have coverage in the package's
  pre-existing suite; Phase 2 is a path change, not a behavior change.
- Don't write a codemod test. The MIGRATION.md says no codemod ships in
  Sprint 1.
- Don't snapshot `MIGRATION.md` content. A snapshot of prose is brittle
  and noise-generating. Grep for the 5 plugin path strings and call it done.
- Don't try to install `@tour-kit/analytics@0.12.0` from npm — it's not
  published yet. Use the in-tree workspace.
- Don't add a "deprecation warning" test for old root imports — there is
  no deprecation shim; the breaking change is hard.

### Critical: Fake Implementations Reused from Phase 1

```ts
// EXISTING — do not redefine. Reuse from Phase 1.
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

### Files to Create

```
packages/analytics/src/__tests__/subpath-imports.test.ts
packages/analytics/src/__tests__/root-exports.test.ts
packages/analytics/MIGRATION.md
tasks/sprint-1-stop-the-bleeding/verify-phase-2.sh
```

### Per-File Coverage Guidance

#### `subpath-imports.test.ts`
- One `it()` per plugin (5 total). Each does `await import('@tour-kit/analytics/<name>')`,
  asserts the named export is a function, calls it with a minimal config, and
  asserts the returned object has `.init` and `.track`.
- Use the Amplitude mock at the top of the file (Phase 1 fake).
- Don't assert behavior — just shape.

#### `root-exports.test.ts`
- Import `* as root from '../index'`.
- 5 `expect(root).not.toHaveProperty('<plugin>Plugin')` assertions.
- 4 `expect(root).toHaveProperty(...)` assertions for the preserved core
  surface (`createAnalytics`, `AnalyticsProvider`, `useAnalytics`,
  `useAnalyticsOptional`).

#### `MIGRATION.md`
- Markdown table with 5 rows: was → now for each plugin.
- "Why" section: 2-3 sentences.
- "How to migrate" section: pointer to find-and-replace.
- Explicit note that no codemod ships in Sprint 1.

#### `verify-phase-2.sh`
- Bash gates as shown in the Build/Bundle Asserter section above.

### Success Criteria
- `pnpm --filter @tour-kit/analytics test --run` exits 0.
- `bash tasks/sprint-1-stop-the-bleeding/verify-phase-2.sh` prints all ✓.
- `grep -cE 'posthogPlugin|mixpanelPlugin|amplitudePlugin|googleAnalyticsPlugin|consolePlugin' packages/analytics/dist/index.js` == 0.
- `gzip -c packages/analytics/dist/index.js | wc -c` < 4000.
- `pnpm build --filter='./packages/*'` exits 0.

### Expected End State

```
packages/analytics/
├── src/__tests__/
│   ├── subpath-imports.test.ts          # NEW
│   ├── root-exports.test.ts             # NEW
│   └── __fakes__/                        # UNCHANGED (Phase 1)
├── MIGRATION.md                          # NEW
├── package.json                          # ./console added to exports
├── src/index.ts                          # 5 plugin re-exports deleted
└── tsup.config.ts                        # plugins/console added to entry

tasks/sprint-1-stop-the-bleeding/
└── verify-phase-2.sh                     # NEW
```
---

---

## Run Commands

```bash
# Build + bundle gate
pnpm --filter @tour-kit/analytics build
bash tasks/sprint-1-stop-the-bleeding/verify-phase-2.sh

# Unit tests
pnpm --filter @tour-kit/analytics test --run

# Targeted re-runs
pnpm --filter @tour-kit/analytics test --run src/__tests__/subpath-imports.test.ts
pnpm --filter @tour-kit/analytics test --run src/__tests__/root-exports.test.ts

# Downstream guard (full monorepo)
pnpm build --filter='./packages/*'
pnpm typecheck

# Internal callsite sweep (US-6, also runs inside verify-phase-2.sh)
rg -n "from ['\"]@tour-kit/analytics['\"]" packages apps examples \
  --glob '*.{ts,tsx,md,mdx}' \
  | rg "(posthog|mixpanel|amplitude|googleAnalytics|console)Plugin"
# Expected: zero output.
```

---

**Next:** [phase-3-tests.md](phase-3-tests.md)

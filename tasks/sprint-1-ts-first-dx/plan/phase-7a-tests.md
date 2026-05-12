# Phase 7a — Testing: Codemods — Joyride First (#84)

**Scope:** New package `@tour-kit/codemods`. `tour-kit-migrate` bin; `cli.ts` (parse args, exit codes 0/1/2/3, `--dry-run`/`--print`/`--from`/`--parser`/`--extensions`/`--verbose`); `from-joyride.ts` transform covering BOTH JSX `<Joyride>` AND `useJoyride()` hook APIs (memory #181); shared `mapStepObject` step mapper; `todoToComment` emitter; fixture corpus runner with diff + `tsc --noEmit` post-check + ≥80% coverage gate; coverage matrix in `docs/from-joyride.md`; migration MDX with anchored TODO destinations.
**Key Pattern:** Integration phase (codemod tool round-trip). Tests run REAL `jscodeshift` against the REAL committed fixture corpus from Phase 0. No fakes — fixtures ARE the test data. The HARD ≥80% coverage gate is asserted directly in a vitest case; missing it fails the build.
**Dependencies:** `vitest@^4.1.0`, `jscodeshift@^17.3.0` (memory #178), `@types/jscodeshift@^0.12.0`, `typescript@^5.9.3` (for `tsc --noEmit` post-check on transformed output), Phase 0 fixture corpus.

---

## User Stories

| # | User Story | Validation Check | Pass Condition |
|---|------------|------------------|----------------|
| US-1 | As a Joyride consumer migrating to Tour Kit, I want `npx tour-kit-migrate --from joyride ./src` to rewrite my code so I don't hand-port every file | `fixture-runner.test.ts` per-fixture diff against committed `*.expected.tsx` | ≥80% of fixtures match (after whitespace normalization) |
| US-2 | As a migrator, I want every transformed file to typecheck so the codemod doesn't ship broken code | `fixture-runner.test.ts` TestTscClean | Each transformed output passes `tsc --noEmit` |
| US-3 | As a migrator running the codemod by accident, I want `--dry-run` to leave files unchanged | `cli.test.ts` TestDryRunReadOnly | After `--dry-run` against a fixture dir copy, `git status` shows no modifications |
| US-4 | As a CI engineer, I want predictable exit codes so I can wire the codemod into automation | `cli.test.ts` TestExitCodes | 0 ok / 1 parse-failure / 2 bad-args / 3 no-paths |
| US-5 | As a Joyride hook-API user, I want `useJoyride({steps})` migrated too — not just `<Joyride>` JSX | `fixture-runner.test.ts` runs hook-form fixtures | ≥1 hook fixture passes; transformed output references `useRef<TourKitRef>` + `<TourProvider>` |
| US-6 | As a future-maintainer auditing my output, I want every unmigrated pattern emitted as `// TODO: <msg> — see <url>` so nothing fails silently | `step-mapper.test.ts` Test*Unsupported* | `unsupportedFields` includes each Joyride-only key; `todos` has matching `Todo` entries |
| US-7 | As a docs reader, I want every TODO anchor to resolve to a heading in `migration/joyride.mdx` | `docs-anchors.test.ts` greps anchor list against MDX headings | Every anchor appears as a heading; no orphans |
| US-8 | As a sprint reviewer, I want the ≥80% gate to fail the build if coverage regresses | `fixture-runner.test.ts` TestCoverageGate | Pass ratio across all fixtures ≥ 0.8 |

---

## Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|-----------|---------------|----------------|------------|
| `from-joyride.ts` transform | No mock — run REAL transform programmatically (`{ jscodeshift, j, stats, report }` API) | Output equals `*.expected.tsx` (after whitespace normalize); reparseable TSX; contains `'@tour-kit/react'` literal | US-1, US-5 |
| Joyride fixture corpus | Files on disk from Phase 0; `readdirSync` enumerates inputs | ≥4 input/expected pairs; both JSX and hook fixtures present | US-1, US-5 |
| `tsc --noEmit` post-check on transformed output | Spawn `tsc --noEmit --jsx preserve --target es2020 --module esnext <tempFile>` against each transformed fixture | Exit 0 for every fixture in the pass-set; failures count against the 80% gate | US-2 |
| `mapStepObject` (shared step mapper) | No mock — pass real jscodeshift `ObjectExpression` nodes built via `j.parseExpression` | `StepMapping.target/placement/etc.` correct; `unsupportedFields` lists every Joyride-only key; `todos` non-empty for unsupported | US-6 |
| `todoToComment(t)` emitter | No mock — pure function | Returns `// TODO: <msg> — see https://tourkit.dev/migration/joyride#<anchor>` | US-6 |
| `cli.ts` arg parsing | No mock — call `runMigrate(argv)` directly | Exit codes match: 0/1/2/3 per spec; `--dry-run` doesn't write | US-3, US-4 |
| Dry-run write protection | Run `runMigrate(['--from', 'joyride', '--dry-run', tmpDir])` against a tmpdir copy; compare file SHA before/after | SHAs unchanged | US-3 |
| Bin shebang executable | After `pnpm build`: `existsSync('dist/bin/tour-kit-migrate.cjs')` + spawn `node <bin> --from foo` | File exists; exit code 2 (bad args) | US-4 |
| TODO anchor coverage | `docs-anchors.test.ts`: scan transform output for emitted `// TODO: ... #<anchor>`; assert each `#anchor` matches a `## <heading>` in `apps/docs/content/docs/migration/joyride.mdx` | No orphan anchors | US-7 |
| ≥80% coverage gate | Count fixtures passing diff + tsc check / total fixtures | ratio ≥ 0.8 (FAIL build if <0.8 → ship/no-ship gate) | US-8 |

---

## Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|--------------|-------|-------------|
| Unit (step-mapper + todo-emitter + cli) | `vitest`, `jscodeshift` | <3s | Every push |
| Integration (fixture runner: diff + tsc) | `vitest`, `jscodeshift`, `typescript` CLI, fs | <15s (depends on `tsc` invocation × N fixtures) | Every push — gates Phase 7b |
| Coverage gate | counts within fixture runner | <1s | Every push |
| Bin smoke | `pnpm build`, then `node dist/bin/...` | <3s | Every push (CI) |
| Docs anchor parity | `apps/docs/.../joyride.mdx` + emitted TODOs | <2s | Every push |

No browser / E2E tier — codemods run server-side.

---

## Fake / Mock Implementations

**No fakes.** The codemod, the AST library, the fixture corpus, and `tsc` are all real. The point of a codemod test is the round-trip — mocking jscodeshift would mock away what we're testing.

Shared helpers:

```ts
// packages/codemods/src/__tests__/_helpers.ts
import jscodeshift from 'jscodeshift'
import { execSync } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const j = jscodeshift.withParser('tsx')

export function runTransform(transform: any, source: string, path = 'fixture.tsx'): string {
  const api = { jscodeshift: j, j, stats: () => {}, report: () => {} }
  const result = transform.default ? transform.default({ source, path }, api, {}) : transform({ source, path }, api, {})
  return typeof result === 'string' ? result : source  // null/undefined return means "no change"
}

export function reparses(tsx: string): boolean {
  try { j(tsx); return true } catch { return false }
}

export function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

export interface TscResult { ok: boolean; output: string }

export function tscNoEmit(tsx: string): TscResult {
  const dir = mkdtempSync(join(tmpdir(), 'tk-codemod-'))
  const file = join(dir, 'output.tsx')
  writeFileSync(file, tsx, 'utf8')
  try {
    execSync(`pnpm exec tsc --noEmit --jsx preserve --target es2020 --module esnext --moduleResolution bundler --skipLibCheck --isolatedModules "${file}"`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    return { ok: true, output: '' }
  } catch (e: any) {
    return { ok: false, output: String(e.stdout ?? '') + String(e.stderr ?? '') }
  }
}
```

The `--isolatedModules` + `--skipLibCheck` flags keep tsc from chasing `@tour-kit/react` types — we want to verify the transformed code is well-formed TSX, not that it integrates with the workspace's full type graph. (If full integration is needed, gate that as a separate "post-tsup-build" tier, not in unit tests.)

---

## Test File List

```
packages/codemods/src/__tests__/
├── _helpers.ts                                          # runTransform, normalize, tscNoEmit, reparses
├── step-mapper.test.ts                                  # ≥8 cases — target/placement/content + unsupported fields + TODO emission
├── cli.test.ts                                          # ≥6 cases — exit codes; --dry-run leaves files; --from invalid; no paths
├── fixture-runner.test.ts                               # Parametrized over fixtures/joyride/*.input.tsx
│                                                          • Per-fixture diff against expected (normalized)
│                                                          • Per-fixture tscNoEmit on transformed output
│                                                          • Coverage gate: ratio ≥ 0.8
├── bin-smoke.test.ts                                    # After build: dist/bin/tour-kit-migrate.cjs exists; node <bin> --from foo exits 2
└── docs-anchors.test.ts                                 # Every emitted // TODO anchor resolves to a heading in joyride.mdx

packages/codemods/__tests__/fixtures/joyride/             # FROM PHASE 0
└── *.{input,expected}.tsx
```

The fixture-runner is the heaviest file; everything else stays small and focused.

---

## `setup` / Fixtures Structure

**New setup for `@tour-kit/codemods` package:**

```ts
// packages/codemods/vitest.config.ts
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    environment: 'node',                  // codemods are node-side; no DOM
    include: ['src/__tests__/**/*.test.ts'],
    testTimeout: 30_000,                  // tsc invocations can be slow on cold cache
    pool: 'forks',                        // execSync in tsc check plays nicer with forks than threads
  },
})
```

```ts
// packages/codemods/vitest.setup.ts (optional — if shared concerns emerge)
// initially empty; add when needed
```

No CLI flags (no `--with-X` gating). The fixture corpus is the single integration target.

---

## Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Run the REAL transform via the REAL jscodeshift API | `runTransform(transformModule, source)` with the standard `{ jscodeshift, j, stats, report }` API | Mocking the AST library tests the test, not the codemod |
| Diff after whitespace normalization | `normalize(s) === normalize(expected)` | Formatting differences are not semantic; assert on STRUCTURE not bytes |
| Post-transform `tsc --noEmit` for every fixture | Spawn `tsc` once per output; per-fixture pass/fail | A transform that produces broken code is worse than no transform — spec §What Failure Looks Like |
| Coverage ratio is a vitest case, not a CI script | `it('≥80%', () => expect(ratio).toBeGreaterThanOrEqual(0.8))` | Keeps the gate in the same green/red signal as everything else; no "yellow CI step" surprise |
| `--dry-run` tested via SHA comparison, not by inspecting writes | `crypto.createHash('sha256').update(readFileSync(...))` before and after | Bullet-proof: doesn't depend on whether the tool returns a buffer vs writes |
| Bin smoke test gated on dist existing | `existsSync(MAIN_CJS)` → `it.skip` | Local dev doesn't always rebuild; CI does |
| Docs-anchor test scans transform output, not the transform source | Run transforms over inputs; collect every `// TODO: ... #anchor`; cross-check against MDX headings | Catches anchor drift even when emission code looks fine |
| Hook-form coverage is required | Spec calls out US-5 explicitly; corpus has hook fixtures from Phase 0 | If hook-form fixtures all fail, the ≥80% gate may still pass on JSX alone — add a separate explicit subset assertion |
| `tsc --isolatedModules --skipLibCheck` | Don't chase the full type graph | We're verifying syntax + emit, not full integration; full integration is the smoke target (out of scope for unit tier) |
| `pool: 'forks'` in vitest config | `execSync` reliability | Threads + child_process can race on shared file handles |

---

## Example Test Case

```ts
// packages/codemods/src/__tests__/fixture-runner.test.ts
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import transform from '../transforms/from-joyride'
import { runTransform, normalize, tscNoEmit } from './_helpers'

const FIXTURES = join(__dirname, '..', '..', '__tests__', 'fixtures', 'joyride')
const inputs = readdirSync(FIXTURES).filter((f) => f.endsWith('.input.tsx'))

type FixtureResult = { name: string; diffOk: boolean; tscOk: boolean; tscOutput: string }
const results: FixtureResult[] = inputs.map((file) => {
  const name = file.replace('.input.tsx', '')
  const expected = join(FIXTURES, `${name}.expected.tsx`)
  if (!existsSync(expected)) return { name, diffOk: false, tscOk: false, tscOutput: 'expected file missing' }

  const input = readFileSync(join(FIXTURES, file), 'utf8')
  const actual = runTransform(transform, input, file)
  const diffOk = normalize(actual) === normalize(readFileSync(expected, 'utf8'))
  const tsc = tscNoEmit(actual)
  return { name, diffOk, tscOk: tsc.ok, tscOutput: tsc.output }
})

describe('Joyride transform — per-fixture diff', () => {
  for (const r of results) {
    it(`${r.name} matches expected output (normalized whitespace)`, () => {
      expect(r.diffOk).toBe(true)
    })
  }
})

describe('Joyride transform — per-fixture tsc clean', () => {
  for (const r of results) {
    if (!r.diffOk) continue   // tsc only matters for fixtures we claim to support
    it(`${r.name} output passes tsc --noEmit`, () => {
      expect(r.tscOk, r.tscOutput).toBe(true)
    })
  }
})

describe('Joyride transform — coverage gate', () => {
  it('hits ≥80% of committed fixtures with diff AND tsc clean', () => {
    const passed = results.filter((r) => r.diffOk && r.tscOk).length
    const ratio = passed / results.length
    expect(ratio, `passed ${passed}/${results.length}; failing: ${results.filter((r) => !(r.diffOk && r.tscOk)).map((r) => r.name).join(', ')}`).toBeGreaterThanOrEqual(0.8)
  })

  it('includes at least one JSX-form AND one useJoyride-hook-form fixture in the pass-set', () => {
    const passed = results.filter((r) => r.diffOk && r.tscOk).map((r) => r.name)
    expect(passed.some((n) => n.startsWith('joyride-jsx'))).toBe(true)
    expect(passed.some((n) => n.startsWith('useJoyride'))).toBe(true)
  })
})
```

```ts
// packages/codemods/src/__tests__/cli.test.ts
import { describe, it, expect } from 'vitest'
import { runMigrate } from '../cli'
import { mkdtempSync, writeFileSync, readFileSync, copyFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'

const FIXTURES = join(__dirname, '..', '..', '__tests__', 'fixtures', 'joyride')

describe('CLI exit codes', () => {
  it('exits 2 on missing --from', async () => {
    const code = await runMigrate(['./some/path'])
    expect(code).toBe(2)
  })
  it('exits 2 on unsupported --from value', async () => {
    const code = await runMigrate(['--from', 'notreal', './some/path'])
    expect(code).toBe(2)
  })
  it('exits 3 when no paths match', async () => {
    const code = await runMigrate(['--from', 'joyride'])
    expect(code).toBe(3)
  })
  it('exits 0 on a successful dry-run', async () => {
    const code = await runMigrate(['--from', 'joyride', '--dry-run', FIXTURES])
    expect(code).toBe(0)
  })
})

describe('CLI --dry-run safety', () => {
  it('does not modify files on disk', async () => {
    // Copy fixtures into a tmpdir
    const dir = mkdtempSync(join(tmpdir(), 'tk-dry-'))
    for (const f of readdirSync(FIXTURES).filter((f) => f.endsWith('.input.tsx'))) {
      copyFileSync(join(FIXTURES, f), join(dir, f))
    }
    const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')
    const before = readdirSync(dir).map((f) => [f, sha(join(dir, f))] as const)
    const code = await runMigrate(['--from', 'joyride', '--dry-run', dir])
    const after = readdirSync(dir).map((f) => [f, sha(join(dir, f))] as const)
    expect(code).toBe(0)
    expect(after).toEqual(before)
  })
})
```

```ts
// packages/codemods/src/__tests__/docs-anchors.test.ts
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import transform from '../transforms/from-joyride'
import { runTransform } from './_helpers'

const FIXTURES = join(__dirname, '..', '..', '__tests__', 'fixtures', 'joyride')
const MDX = join(__dirname, '..', '..', '..', '..', 'apps', 'docs', 'content', 'docs', 'migration', 'joyride.mdx')

describe('TODO anchors resolve to MDX headings', () => {
  it('every emitted anchor has a matching ## heading in joyride.mdx', () => {
    const mdx = readFileSync(MDX, 'utf8')
    const headingIds = new Set(
      [...mdx.matchAll(/^#{2,4}\s+(.+)$/gm)].map(([, h]) => h.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')),
    )
    const emittedAnchors = new Set<string>()
    for (const file of readdirSync(FIXTURES).filter((f) => f.endsWith('.input.tsx'))) {
      const out = runTransform(transform, readFileSync(join(FIXTURES, file), 'utf8'), file)
      for (const [, anchor] of out.matchAll(/\/\/ TODO:.*?#([a-z0-9-]+)/g)) {
        emittedAnchors.add(anchor)
      }
    }
    const orphans = [...emittedAnchors].filter((a) => !headingIds.has(a))
    expect(orphans, `orphan anchors with no MDX heading: ${orphans.join(', ')}`).toEqual([])
  })
})
```

```ts
// packages/codemods/src/__tests__/step-mapper.test.ts
import { describe, it, expect } from 'vitest'
import jscodeshift from 'jscodeshift'
import { mapStepObject } from '../lib/step-mapper'

const j = jscodeshift.withParser('tsx')

function parseObject(src: string) {
  // Wrap into an expression statement to get a clean ObjectExpression node
  const root = j(`const _ = ${src}`)
  return root.find(j.ObjectExpression).at(0).nodes()[0]!
}

describe('mapStepObject — supported fields', () => {
  it('maps string target to selector', () => {
    const obj = parseObject(`{ target: '#hero', content: 'Hi' }`)
    const m = mapStepObject(j, obj)
    expect(m.target).toBe('#hero')
    expect(m.todos).toEqual([])
  })

  it('maps placement', () => {
    const obj = parseObject(`{ target: '#hero', content: 'Hi', placement: 'top' }`)
    const m = mapStepObject(j, obj)
    expect(m.placement).toBe('top')
  })
})

describe('mapStepObject — unsupported fields emit TODOs', () => {
  it.each([
    ['styles', '{}'],
    ['tooltipComponent', 'CustomTip'],
    ['beaconComponent', 'CustomBeacon'],
    ['isFixed', 'true'],
    ['scrollTarget', '"#scrollable"'],
  ])('emits TODO for %s', (field, value) => {
    const obj = parseObject(`{ target: '#a', content: '', ${field}: ${value} }`)
    const m = mapStepObject(j, obj)
    expect(m.unsupportedFields).toContain(field)
    expect(m.todos.some((t) => t.message.includes(`Step.${field}`))).toBe(true)
  })
})

describe('mapStepObject — target as function emits TODO', () => {
  it('emits TODO with target-function anchor', () => {
    const obj = parseObject(`{ target: () => document.body, content: '' }`)
    const m = mapStepObject(j, obj)
    expect(m.todos.some((t) => t.anchor === 'target-function')).toBe(true)
  })
})
```

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to write this test suite:

---
You are writing the complete test suite for Phase 7a of Tour Kit's Sprint 1 — the Joyride codemod (issue #84).

### What This Project Is
Tour Kit competes with react-joyride for the React product-tour space. "Tour Kit vs Joyride" SEO pages convert poorly because every blog post ends with "now rewrite your code." Phase 7a ships `npx tour-kit-migrate --from joyride ./src` — the artifact that closes the migration gap. Every unmigrated pattern emits a `// TODO: <msg> — see <url>` comment with a docs link. The package becomes pure top-of-funnel leverage; a transform that mangles user code is worse than no transform.

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|------------|------------------|----------------|
| US-1 | Fixture corpus rewrites correctly | fixture-runner per-fixture diff | ≥80% match |
| US-2 | Every output passes tsc --noEmit | fixture-runner tsc check | every passing-fixture tsc-clean |
| US-3 | --dry-run is read-only | cli.test SHA comparison | SHAs unchanged |
| US-4 | Predictable exit codes 0/1/2/3 | cli.test | each code asserted |
| US-5 | useJoyride hook fixture transforms | fixture-runner subset assertion | ≥1 hook fixture in pass-set |
| US-6 | Every unmigrated pattern emits TODO | step-mapper.test | unsupported fields produce TODOs |
| US-7 | TODO anchors resolve to MDX headings | docs-anchors.test | zero orphan anchors |
| US-8 | Build fails if coverage drops below 80% | fixture-runner coverage gate | ratio ≥ 0.8 |

### Why Fakes Are Required
**None.** The codemod IS the artifact; jscodeshift is the real library; the fixture corpus is real code from MIT-licensed repos (Phase 0). The whole value of a codemod test is the round-trip — mocking jscodeshift, tsc, or the fixtures would invalidate the test.

### What NOT to Test
- Don't test `jscodeshift` itself — Phase 0 spike already de-risked the library; here we test OUR transform.
- Don't test the JSX equality byte-for-byte — formatting differences are noise; assert on normalized whitespace.
- Don't test the bin's stdout formatting in detail — assert exit codes; stdout text will drift.
- Don't test the CLI's `--verbose` log output — flag presence is enough.
- Don't test transform performance — a codemod runs at dev-time once per file; perf doesn't matter at this scale.
- Don't fall back to `ts-morph` in the tests — Phase 0 already picked the tool; if jscodeshift fails, that's a code change, not a test concern.
- Don't widen the diff tolerance below "normalized whitespace" — semantic structure must match.

### Critical: Fake Implementations

No fakes. Add one shared helper file:

```ts
// packages/codemods/src/__tests__/_helpers.ts
import jscodeshift from 'jscodeshift'
import { execSync } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const j = jscodeshift.withParser('tsx')

export function runTransform(transform: any, source: string, path = 'fixture.tsx'): string {
  const api = { jscodeshift: j, j, stats: () => {}, report: () => {} }
  const result = transform.default ? transform.default({ source, path }, api, {}) : transform({ source, path }, api, {})
  return typeof result === 'string' ? result : source
}

export function reparses(tsx: string): boolean { try { j(tsx); return true } catch { return false } }
export function normalize(s: string): string { return s.replace(/\s+/g, ' ').trim() }

export interface TscResult { ok: boolean; output: string }
export function tscNoEmit(tsx: string): TscResult {
  const dir = mkdtempSync(join(tmpdir(), 'tk-codemod-'))
  const file = join(dir, 'output.tsx')
  writeFileSync(file, tsx, 'utf8')
  try {
    execSync(`pnpm exec tsc --noEmit --jsx preserve --target es2020 --module esnext --moduleResolution bundler --skipLibCheck --isolatedModules "${file}"`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    return { ok: true, output: '' }
  } catch (e: any) {
    return { ok: false, output: String(e.stdout ?? '') + String(e.stderr ?? '') }
  }
}
```

### Test Files to Create

```
packages/codemods/
├── vitest.config.ts                                     # node environment, fork pool, 30s timeout
└── src/__tests__/
    ├── _helpers.ts
    ├── step-mapper.test.ts                              # ≥8 cases — supported + unsupported + TODO emission
    ├── cli.test.ts                                      # ≥6 cases — exit codes + --dry-run safety
    ├── fixture-runner.test.ts                           # parametrized; diff + tsc + coverage gate + JSX/hook subset
    ├── bin-smoke.test.ts                                # bin file exists + spawned exit-2 case (after build)
    └── docs-anchors.test.ts                             # every emitted TODO anchor → MDX heading
```

### Per-File Coverage Guidance

#### `src/__tests__/step-mapper.test.ts`
≥8 cases organized into:
- Supported fields: `target` string → selector; `placement` mapping; `content`/`title` pass-through; `id`/`data` ✓
- Unsupported fields (`it.each`): `styles`, `tooltipComponent`, `beaconComponent`, `isFixed`, `scrollTarget`, `portalElement` → each in `unsupportedFields`; each produces a `Todo` with the matching anchor
- `target` as function expression → `Todo` with anchor `'target-function'`
- `disableBeacon`/`skipBeacon` → silent ✓ (no-op note in todos but NOT in unsupportedFields)

#### `src/__tests__/cli.test.ts`
≥6 cases:
- `runMigrate(['./path'])` → 2 (missing --from)
- `runMigrate(['--from', 'notreal', './path'])` → 2 (unsupported --from)
- `runMigrate(['--from', 'joyride'])` → 3 (no paths)
- `runMigrate(['--from', 'joyride', '--dry-run', FIXTURES])` → 0
- `--dry-run` does NOT modify any file in a tmpdir copy (SHA comparison)
- Bad path argument → 1 OR 3 depending on impl; assert specific behavior

#### `src/__tests__/fixture-runner.test.ts`
Build a `results: FixtureResult[]` array once at module level. Three describes:
- Per-fixture diff: `expect(r.diffOk).toBe(true)` — one `it` per fixture
- Per-fixture tsc (only for fixtures in the diff-pass-set): `expect(r.tscOk, r.tscOutput).toBe(true)`
- Coverage gate: `passed/total ≥ 0.8` with the failing fixture names in the error message
- Subset gate: at least one `joyride-jsx*` AND one `useJoyride*` in pass-set

#### `src/__tests__/bin-smoke.test.ts`
Gated on `existsSync('dist/bin/tour-kit-migrate.cjs')`. 2 cases:
- Spawn `node dist/bin/tour-kit-migrate.cjs --from foo` → exit code 2
- Spawn `node dist/bin/tour-kit-migrate.cjs` (no args) → exit code 2 (missing --from)

#### `src/__tests__/docs-anchors.test.ts`
1 case: collect every `// TODO: ... #<anchor>` from the OUTPUT of running the transform over every fixture; compute heading-ids from `apps/docs/content/docs/migration/joyride.mdx` by lowercasing+kebab-casing every `## ...` line; assert the set difference (emitted minus headings) is empty.

### Data Model Notes
- jscodeshift transform signature: `(file: FileInfo, api: API) => string`. Programmatic `api` shape: `{ jscodeshift, j, stats, report }` — `stats`/`report` are no-op functions.
- `runTransform` handles both default-export and named-export transforms; pick whichever shape the implementation lands on.
- The `tsc` post-check uses `--isolatedModules --skipLibCheck` to skip full type-graph integration. If you need true type-integration testing, add a separate post-build smoke that uses the compiled `@tour-kit/react` package — but that belongs to Phase 6's territory or a release-gate, NOT this phase's unit tier.
- `normalize(s)` collapses whitespace; PR'd transform output formatting drift won't fail tests.

### Success Criteria
- `pnpm --filter @tour-kit/codemods build && pnpm --filter @tour-kit/codemods typecheck && pnpm --filter @tour-kit/codemods test` exit 0.
- Coverage gate test reports ≥80% pass ratio.
- Subset gate test confirms BOTH a JSX-form AND a `useJoyride`-form fixture pass.
- `docs-anchors.test.ts` reports zero orphan anchors.
- `cli.test.ts` SHA-comparison case shows `--dry-run` leaves files unchanged.
- `bin-smoke.test.ts` (after build) confirms `dist/bin/tour-kit-migrate.cjs` runs and returns exit code 2 for bad args.

### Expected File Structure at End
```
packages/codemods/
├── vitest.config.ts
└── src/__tests__/
    ├── _helpers.ts
    ├── step-mapper.test.ts
    ├── cli.test.ts
    ├── fixture-runner.test.ts
    ├── bin-smoke.test.ts
    └── docs-anchors.test.ts
```
---

---

## Run Commands

```bash
# All Phase 7a unit + integration tests (includes ≥80% gate)
pnpm --filter @tour-kit/codemods test

# Single integration suite (debugging a fixture)
pnpm --filter @tour-kit/codemods test -- fixture-runner

# Single fixture (debugging)
pnpm --filter @tour-kit/codemods test -- fixture-runner -t "joyride-jsx-callback"

# Bin smoke (after build)
pnpm --filter @tour-kit/codemods build && \
  pnpm --filter @tour-kit/codemods test -- bin-smoke

# Docs anchor parity
pnpm --filter @tour-kit/codemods test -- docs-anchors

# Manual sanity — dry-run a real corpus
npx tour-kit-migrate --from joyride --dry-run packages/codemods/__tests__/fixtures/joyride/

# Full Phase 7a gate (CI)
pnpm --filter @tour-kit/codemods typecheck && \
  pnpm --filter @tour-kit/codemods build && \
  pnpm --filter @tour-kit/codemods test
```

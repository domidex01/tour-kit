# Phase 0 — Testing: Repo Alignment & Gates

**Scope:** type-test harness (`tsconfig.type-tests.json` + `typecheck:types` script), `DiagnosticGate` type stub, Joyride fixture corpus, `phase-0-decisions.md` decision log, jscodeshift spike round-trip.
**Key Pattern:** Validation phase — the deliverables ARE configuration and types, so tests verify "gate works" rather than "feature behaves." No runtime fakes needed; tests are: (1) shell assertions on commands exiting 0/non-zero, (2) `tsc --noEmit` against a self-test fixture that's expected to fail when broken, (3) corpus inventory + AST parseability checks.
**Dependencies:** `vitest@^4.1.0`, `typescript@^5.9.3`, `jscodeshift@^17.3.0`, `@types/jscodeshift@^0.12.0`. No new test-runner deps.

---

## User Stories

| # | User Story | Validation Check | Pass Condition |
|---|------------|------------------|----------------|
| US-1 | As a Phase 1 implementer, I want a working type-test harness so my `.test-d.ts` fixtures fail compile when I break a generic | `phase-0-harness.test.ts` runs `pnpm --filter @tour-kit/core typecheck:types` against the committed selftest; flips the `@ts-expect-error` line and re-runs | Baseline run exits 0; broken-fixture run exits non-zero |
| US-2 | As a Phase 3 implementer, I want the `DiagnosticGate` stub committed so I can build the orchestrator against a stable interface | `phase-0-types.test-d.ts` imports `DiagnosticGate`, `GateReason`, `DiagnosticContext` from `@tour-kit/core` and asserts each member type | `pnpm --filter @tour-kit/core typecheck` exits 0; `grep "from '@tour-kit/license\|@tour-kit/scheduling'" packages/core/src/` returns no hits |
| US-3 | As a Phase 4 implementer, I want the chart-dependency decision committed so I don't re-litigate Recharts vs CSS | `phase-0-decisions.test.ts` reads `phase-0-decisions.md`, asserts non-placeholder values for Chart, Codemod-tool, Diagnostic-extension lines | All three regex matches succeed; no `[TBD]` substrings remain |
| US-4 | As a Phase 7a implementer, I want a corpus of ≥4 Joyride fixtures so my transform has real-world inputs from day one | `phase-0-corpus.test.ts` enumerates `__tests__/fixtures/joyride/*.input.tsx`, pairs them with `*.expected.tsx`, parses each with jscodeshift `parser: 'tsx'` | ≥4 input/expected pairs; every file parses without error |
| US-5 | As a Phase 7a implementer, I want the jscodeshift round-trip proven to work on at least one Joyride fixture so the tool choice is locked | `phase-0-spike.test.ts` runs the spike transform on `joyride-jsx-basic.input.tsx`; asserts output contains `'@tour-kit/react'` and parses as TSX | Output string contains `from '@tour-kit/react'`; reparsing the output with jscodeshift does not throw |

---

## Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|-----------|---------------|----------------|------------|
| `tsconfig.type-tests.json` + `typecheck:types` script | No mock — invoke via `execSync('pnpm --filter @tour-kit/core typecheck:types')` | Exit code 0 on baseline; non-zero after temporarily mutating the selftest to remove `@ts-expect-error` (test mutates a tmp copy, never the committed file) | US-1 |
| `DiagnosticGate` / `DiagnosticContext` / `GateReason` types | No mock — these ARE the artifact; verify via a `.test-d.ts` consumer file | Each type's member shape compiles in a consumer position; `evaluate(ctx)` accepts `DiagnosticContext` and returns `GateReason \| Promise<GateReason>` | US-2 |
| `phase-0-decisions.md` | Read file directly with `fs.readFileSync`; regex match | Three non-empty lines for Chart / Codemod tool / Diagnostic extension; zero `[TBD]` substrings | US-3 |
| Joyride fixture corpus | No mock — files on disk are the artifact | Count of `*.input.tsx` ≥ 4; each has a matching `*.expected.tsx`; each parses cleanly with `parser: 'tsx'` | US-4 |
| jscodeshift spike transform | No mock — run the real transform programmatically against the committed input fixture | Output string includes `'@tour-kit/react'` import source; output re-parses without throwing; no `[object Object]` / no unexpected newline mangling | US-5 |
| `@tour-kit/license`, `@tour-kit/scheduling` (upward-import ban) | No mock — grep | `grep -rn "from '@tour-kit/license'\|from '@tour-kit/scheduling'" packages/core/src/` returns 0 lines | US-2 |

---

## Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|--------------|-------|-------------|
| Unit (type-check) | `typescript`, the new `tsconfig.type-tests.json` | <3s | Every push — gates Phase 1's PR |
| Unit (shell + fs) | `vitest`, `node:fs`, `node:child_process` for `execSync('pnpm ... typecheck:types')` | <5s | Every push |
| Spike replay | `jscodeshift@^17.3.0` — runs the throwaway transform from `__spike__/` (kept available for the test even after `.gitignore`-ing the dir for ship) | <2s | Every push until Phase 7a lands a real transform; then delete this tier |

No integration / E2E tier — this phase has no runtime services.

---

## Fake / Mock Implementations

**No fakes needed (Validation Phase).** Phase 0 outputs are configuration (tsconfig), Markdown, types, and on-disk fixture files. Tests assert *on the artifacts themselves*, not on simulated behavior. Mocking jscodeshift would defeat the spike's purpose — the spike's value is proving the real library round-trips TSX.

The one near-mock is a **scratch copy of the selftest fixture** that US-1 mutates: the test writes a temporary `.test-d.ts` next to the committed one with the `@ts-expect-error` line removed, runs `typecheck:types` scoped to a temp tsconfig that includes only that file, asserts non-zero exit, then deletes the scratch file. This avoids touching the committed selftest.

---

## Test File List

```
packages/core/__tests__/phase-0/
├── phase-0-harness.test.ts            # Verify typecheck:types exits 0 on baseline AND non-zero after removing @ts-expect-error on a scratch copy
├── phase-0-decisions.test.ts          # Read phase-0-decisions.md; assert three non-placeholder lines (Chart, Codemod tool, Diagnostic extension)
├── phase-0-types.test-d.ts            # Type-only fixture: imports DiagnosticGate/GateReason/DiagnosticContext; verifies member shapes via assignability checks
├── phase-0-no-upward-imports.test.ts  # grep packages/core/src/ for "from '@tour-kit/license'" or "from '@tour-kit/scheduling'"; assert zero matches
├── phase-0-corpus.test.ts             # Enumerate fixtures/joyride/*.input.tsx; assert ≥4 pairs; each parses with jscodeshift TSX parser
└── phase-0-spike.test.ts              # Programmatic run of spike transform on joyride-jsx-basic.input.tsx; assert '@tour-kit/react' literal + reparseable output
```

All six files live under `packages/core/__tests__/phase-0/`. The `.test-d.ts` is picked up by `tsconfig.type-tests.json` (verify the `include` glob covers `__tests__/phase-0/**` — extend Phase 0's tsconfig if needed). The `.test.ts` files are picked up by the standard `pnpm --filter @tour-kit/core test` run (already covered by the existing `include: ['src/**/*.{test,spec}.{ts,tsx}']` — note: Phase 0 tests live under `__tests__/phase-0/`, NOT under `src/__tests__/`, so extend the vitest `include` glob to `['src/**/*.{test,spec}.{ts,tsx}', '__tests__/phase-0/**/*.test.ts']`).

---

## `setup` / Fixtures Structure

**Additions to existing setup at `packages/core/src/__tests__/setup.ts`** — that file mocks browser globals (ResizeObserver, matchMedia, scrollTo, offsetParent) for jsdom-environment tests. Phase 0 tests are shell + filesystem checks; they should run with `environment: 'node'` to avoid loading jsdom unnecessarily.

Propose a Phase-0-specific vitest config block via an `environmentMatchGlobs` entry:

```ts
// packages/core/vitest.config.ts — add to defineConfig({ test: { ... } })
environmentMatchGlobs: [
  ['__tests__/phase-0/**', 'node'],   // shell + fs only; no DOM
  // existing tests stay on the default jsdom environment
],
include: [
  'src/**/*.{test,spec}.{ts,tsx}',
  '__tests__/phase-0/**/*.test.ts',
],
```

Shared helpers for Phase 0 tests live in `packages/core/__tests__/phase-0/_helpers.ts` (new):

```ts
// packages/core/__tests__/phase-0/_helpers.ts
import { execSync, type ExecSyncOptions } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

export interface RunResult { code: number; stdout: string; stderr: string }

/** Run a shell command at the monorepo root. Captures stdout/stderr; never throws. */
export function run(cmd: string, opts: ExecSyncOptions = {}): RunResult {
  try {
    const stdout = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts })
    return { code: 0, stdout, stderr: '' }
  } catch (e: any) {
    return { code: e.status ?? 1, stdout: String(e.stdout ?? ''), stderr: String(e.stderr ?? '') }
  }
}

/** Make a temp dir; auto-clean. Use for scratch .test-d.ts copies. */
export function withTempDir<T>(fn: (dir: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), 'phase-0-'))
  try { return fn(dir) } finally { rmSync(dir, { recursive: true, force: true }) }
}

export function writeFile(path: string, contents: string): void {
  writeFileSync(path, contents, 'utf8')
}
```

The spike test imports the throwaway transform from `packages/codemods/__spike__/transform.ts`. To keep the test working after Phase 0 ships (`__spike__/` is `.gitignore`d but not deleted), Phase 0's "Task 0.7" deliverable must check the transform.ts into `packages/codemods/__spike__/transform.ts` and add `__spike__/` to `.gitignore`. The test's `import('../../../packages/codemods/__spike__/transform.ts')` works because the file is on disk even if untracked. **If a CI environment clones fresh and `__spike__/` is missing, the test must skip cleanly** — gate `phase-0-spike.test.ts` on file existence:

```ts
import { existsSync } from 'node:fs'
const SPIKE = 'packages/codemods/__spike__/transform.ts'
if (!existsSync(SPIKE)) { it.skip('spike not present in this checkout', () => {}); return }
```

---

## Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Don't mock jscodeshift in the spike test | Run the real transform on the real fixture | The spike's purpose is proving the library works for our use; mocking it would only re-test the test |
| Mutate a scratch copy of the selftest fixture, not the committed file | `withTempDir` + temporary tsconfig pointing at the scratch | Avoids racing the committed code; preserves the canonical selftest for human inspection |
| Use `environment: 'node'` for Phase 0 tests | `environmentMatchGlobs` entry scoped to `__tests__/phase-0/**` | These tests touch fs + child_process only; jsdom adds 200ms+ per worker for no value |
| Skip spike test if `__spike__/` is gitignored away | `existsSync` guard with `it.skip` | The corpus/decisions/types tests cover the durable artifacts; the spike test is a transitional safety net that Phase 7a deletes |
| Assert grep counts via shelling out, not regex over re-read files | `run('grep -rn ...')` returns lines | grep matches the spec language ("returns nothing") exactly; a fs-walk + regex would be a re-implementation of grep with its own bugs |
| One `.test-d.ts` file in this phase, not a directory | `phase-0-types.test-d.ts` only | The harness selftest already covers harness behavior; the types test is one assignability check, not a suite |
| `phase-0-decisions.test.ts` parses Markdown by line | Regex on raw text | The file is human-authored; do NOT introduce a Markdown parser dep just to read three headings |

---

## Example Test Case

```ts
// packages/core/__tests__/phase-0/phase-0-harness.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { run, withTempDir, writeFile } from './_helpers'

const REPO = process.cwd()
const SELFTEST = 'packages/core/src/__tests__/types/harness-selftest.test-d.ts'

describe('Phase 0 — type-test harness', () => {
  it('typecheck:types exits 0 on the committed selftest', () => {
    const r = run('pnpm --filter @tour-kit/core typecheck:types', { cwd: REPO })
    expect(r.code).toBe(0)
  })

  it('typecheck:types exits non-zero when @ts-expect-error is removed from a scratch copy', () => {
    const committed = readFileSync(join(REPO, SELFTEST), 'utf8')
    const broken = committed.replace(/\s*\/\/ @ts-expect-error.*$/m, '')
    expect(broken).not.toBe(committed) // sanity — we actually mutated something

    withTempDir((dir) => {
      const scratchFile = join(dir, 'harness-broken.test-d.ts')
      writeFile(scratchFile, broken)
      const scratchTsconfig = join(dir, 'tsconfig.json')
      writeFile(scratchTsconfig, JSON.stringify({
        extends: join(REPO, 'packages/core/tsconfig.type-tests.json'),
        include: [scratchFile],
        exclude: ['node_modules'],
      }))
      const r = run(`pnpm exec tsc --noEmit --project "${scratchTsconfig}"`, { cwd: REPO })
      expect(r.code).not.toBe(0)
      expect(r.stdout + r.stderr).toMatch(/Type 'string' is not assignable/)
    })
  })
})

describe('Phase 0 — DiagnosticGate stub does not import upper packages', () => {
  it('packages/core/src/ has no imports from @tour-kit/license or @tour-kit/scheduling', () => {
    const r = run(
      `grep -rln "from '@tour-kit/license'\\|from '@tour-kit/scheduling'" packages/core/src || true`,
      { cwd: REPO },
    )
    expect(r.stdout.trim()).toBe('')
  })
})
```

```ts
// packages/core/__tests__/phase-0/phase-0-corpus.test.ts
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import jscodeshift from 'jscodeshift'

const FIXTURES = 'packages/codemods/__tests__/fixtures/joyride'
const REPO = process.cwd()
const j = jscodeshift.withParser('tsx')

describe('Phase 0 — Joyride fixture corpus', () => {
  const dir = join(REPO, FIXTURES)
  const inputs = readdirSync(dir).filter((f) => f.endsWith('.input.tsx'))

  it('contains ≥4 input fixtures', () => {
    expect(inputs.length).toBeGreaterThanOrEqual(4)
  })

  it.each(inputs)('%s has a matching .expected.tsx', (input) => {
    const expected = input.replace('.input.tsx', '.expected.tsx')
    expect(readdirSync(dir)).toContain(expected)
  })

  it.each(inputs)('%s parses as TSX without errors', (input) => {
    const source = readFileSync(join(dir, input), 'utf8')
    expect(() => j(source)).not.toThrow()
  })
})
```

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to write this test suite:

---
You are writing the complete test suite for Phase 0 of Tour Kit's Sprint 1 — Repo Alignment & Gates.

### What This Project Is
Tour Kit is a headless React onboarding/product-tour monorepo (pnpm + Turborepo + tsup, Vitest for tests). Sprint 1 ships TypeScript-first DX upgrades. Phase 0 is the kickoff: it lands configuration, types, and fixture corpora that every later phase depends on. No feature code in this phase — only scaffolding gates.

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|------------|------------------|----------------|
| US-1 | Type-test harness fails when a fixture is broken | run typecheck:types on the committed selftest, then on a scratch copy without `@ts-expect-error` | baseline exits 0; mutated exits non-zero |
| US-2 | `DiagnosticGate` stub is consumable AND core doesn't import upper packages | `.test-d.ts` consumer + grep for upward imports | typecheck:types passes; grep returns zero lines |
| US-3 | `phase-0-decisions.md` has three non-placeholder decisions | regex over the Markdown file | three matches; no `[TBD]` |
| US-4 | Joyride fixture corpus ≥4 input/expected pairs | enumerate `*.input.tsx`; check pairing; parse each | count ≥4; each file parses |
| US-5 | jscodeshift spike round-trip works on a real fixture | run the throwaway transform on `joyride-jsx-basic.input.tsx` | output contains `'@tour-kit/react'`; reparses without throwing |

### Why Fakes Are Required
**None.** Phase 0 ships configuration files, types, and Markdown. Tests assert on the artifacts themselves — there is nothing to fake. The jscodeshift spike test uses the real library because that is the entire point of the spike.

### What NOT to Test
- Don't test `jscodeshift` itself — the spike test verifies our integration, not the library's correctness.
- Don't test TypeScript's `--noEmit` flag — we trust `tsc`; we test that *our* config makes it surface the right errors.
- Don't reimplement grep with a fs-walk + regex — shell out to `grep` and parse its output.
- Don't write a `.mdx` parser to read `phase-0-decisions.md` — three regex matches over the raw bytes is enough.
- Don't add `expect-type` or `tsd`; we already have the native `tsc --noEmit` harness — it's the contract we're testing.

### Critical: Fake Implementations

No fake classes — this is a validation phase. The only test infrastructure is a tiny shell helper:

```ts
// packages/core/__tests__/phase-0/_helpers.ts
import { execSync, type ExecSyncOptions } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

export interface RunResult { code: number; stdout: string; stderr: string }
export function run(cmd: string, opts: ExecSyncOptions = {}): RunResult {
  try {
    const stdout = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts })
    return { code: 0, stdout, stderr: '' }
  } catch (e: any) {
    return { code: e.status ?? 1, stdout: String(e.stdout ?? ''), stderr: String(e.stderr ?? '') }
  }
}
export function withTempDir<T>(fn: (dir: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), 'phase-0-'))
  try { return fn(dir) } finally { rmSync(dir, { recursive: true, force: true }) }
}
export function writeFile(path: string, contents: string): void {
  writeFileSync(path, contents, 'utf8')
}
```

### Test Files to Create

```
packages/core/__tests__/phase-0/
├── _helpers.ts                        # shared run() + withTempDir()
├── phase-0-harness.test.ts            # typecheck:types baseline + mutated-fixture
├── phase-0-decisions.test.ts          # regex over phase-0-decisions.md
├── phase-0-types.test-d.ts            # type-only consumer of DiagnosticGate/GateReason/DiagnosticContext
├── phase-0-no-upward-imports.test.ts  # grep upward imports in packages/core/src
├── phase-0-corpus.test.ts             # enumerate + parse fixture corpus
└── phase-0-spike.test.ts              # run spike transform; assert '@tour-kit/react' + reparseable
```

### Vitest Config Changes

```ts
// packages/core/vitest.config.ts — add inside defineConfig({ test: { ... } })
environmentMatchGlobs: [
  ['__tests__/phase-0/**', 'node'],
],
include: [
  'src/**/*.{test,spec}.{ts,tsx}',
  '__tests__/phase-0/**/*.test.ts',
],
```

### Type-test Config Changes

Extend `tsconfig.type-tests.json#include` to cover `__tests__/phase-0/**/*.test-d.ts` so the `phase-0-types.test-d.ts` file is picked up by the harness.

### Per-File Coverage Guidance

#### `phase-0-harness.test.ts`
Two cases:
1. **Baseline:** `run('pnpm --filter @tour-kit/core typecheck:types')` — assert `code === 0`.
2. **Mutated:** read the committed selftest; replace the `// @ts-expect-error` line with empty string; write to a temp file; write a temp tsconfig that extends `packages/core/tsconfig.type-tests.json` but `include`-s only the temp file; run `tsc --noEmit --project <temp tsconfig>` — assert `code !== 0` AND stderr/stdout mentions "Type 'string' is not assignable to type 'number'" (whatever the selftest line actually exercises — read the committed file first to confirm the error message).

#### `phase-0-decisions.test.ts`
Read `tasks/sprint-1-ts-first-dx/plan/phase-0-decisions.md` with `readFileSync`. Three assertions:
- `/Chart[^:]*:\s*native CSS/i` matches.
- `/Codemod tool[^:]*:\s*(jscodeshift|ts-morph)/i` matches (either is acceptable — Phase 0 makes the call).
- `/Diagnostic extension[^:]*:\s*DiagnosticGate/i` matches.
- No `[TBD]` substring anywhere in the file.

#### `phase-0-types.test-d.ts`
Type-only file. Imports `DiagnosticGate`, `DiagnosticContext`, `GateReason` from `@tour-kit/core/types/diagnostic` (the Phase 0 stub path; if the public re-export isn't wired yet, import via the file path). Three assignability checks:
```ts
const okReason: GateReason = { ok: true, gate: 'license' }
const errReason: GateReason = { ok: false, gate: 'license', code: 'LICENSE_INVALID', message: 'x' }
const gate: DiagnosticGate = { id: 'license', evaluate: (ctx: DiagnosticContext) => ({ ok: true, gate: 'license' }) }
void okReason; void errReason; void gate
```
No `@ts-expect-error` lines in this file — the assignability IS the test.

#### `phase-0-no-upward-imports.test.ts`
One case: `run("grep -rln \"from '@tour-kit/license'\\|from '@tour-kit/scheduling'\" packages/core/src || true")` — assert `stdout.trim() === ''`. The `|| true` is critical because `grep` exits 1 on zero matches.

#### `phase-0-corpus.test.ts`
Read `packages/codemods/__tests__/fixtures/joyride/`. `readdirSync` filtered to `.input.tsx`. Three sub-suites:
- count ≥ 4
- `it.each` over inputs: each has a matching `<name>.expected.tsx`
- `it.each` over inputs: parses via `jscodeshift.withParser('tsx')(source)` without throwing

#### `phase-0-spike.test.ts`
Use `fs.existsSync` to gate the suite — if `packages/codemods/__spike__/transform.ts` does not exist (gitignored away on a fresh clone), `it.skip` the whole file. If present:
- Import the transform via `await import('../../../packages/codemods/__spike__/transform.ts')` (or use a dynamic require if ESM is awkward).
- Read `packages/codemods/__tests__/fixtures/joyride/joyride-jsx-basic.input.tsx`.
- Build a minimal `api` object: `{ jscodeshift: jscodeshift.withParser('tsx'), j: jscodeshift.withParser('tsx'), stats: () => {}, report: () => {} }`.
- Call `transform.default({ source, path: 'fixture.tsx' }, api, {})`.
- Assert returned string contains `from '@tour-kit/react'`.
- Reparse the output with `jscodeshift.withParser('tsx')` — must not throw.

### Data Model Notes
- `DiagnosticGate` is a TS `interface` — the test-d file just constructs assignable values. Don't import from `@tour-kit/license` or other upper packages; the whole point is that core doesn't know about them.
- `phase-0-decisions.md` is human-authored Markdown — read it raw; don't add a Markdown parser.
- jscodeshift's `api` shape for programmatic use (no `--transform` CLI): `{ jscodeshift, j, stats, report }`. The spike transform expects this shape.

### Success Criteria
- `pnpm --filter @tour-kit/core test -- __tests__/phase-0/` exits 0 in <15s.
- `pnpm --filter @tour-kit/core typecheck:types` exits 0 (covers `phase-0-types.test-d.ts`).
- `grep -rln "from '@tour-kit/license'\|from '@tour-kit/scheduling'" packages/core/src/` returns nothing.
- All Phase 0 deliverables from `plan/phase-0.md` have at least one test in `__tests__/phase-0/`.

### Expected File Structure at End
```
packages/core/
├── vitest.config.ts                       (modified — environmentMatchGlobs + include glob)
├── tsconfig.type-tests.json               (modified — include __tests__/phase-0/**/*.test-d.ts)
└── __tests__/phase-0/
    ├── _helpers.ts
    ├── phase-0-harness.test.ts
    ├── phase-0-decisions.test.ts
    ├── phase-0-types.test-d.ts
    ├── phase-0-no-upward-imports.test.ts
    ├── phase-0-corpus.test.ts
    └── phase-0-spike.test.ts
```
---

---

## Run Commands

```bash
# All Phase 0 tests (fast — node env, no jsdom)
pnpm --filter @tour-kit/core test -- __tests__/phase-0/

# Type-only fixture (covers phase-0-types.test-d.ts)
pnpm --filter @tour-kit/core typecheck:types

# Single test file
pnpm --filter @tour-kit/core test -- __tests__/phase-0/phase-0-harness.test.ts

# With coverage (Phase 0 contributes to root coverage but its targets are config files; v8 may report low cov here — that's expected)
pnpm --filter @tour-kit/core test -- __tests__/phase-0/ --coverage

# Manual smoke (mirrors what CI runs)
pnpm --filter @tour-kit/core typecheck:types && \
  pnpm --filter @tour-kit/core test -- __tests__/phase-0/
```

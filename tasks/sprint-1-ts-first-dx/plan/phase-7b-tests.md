# Phase 7b — Testing: Codemods — Shepherd + Driver.js (Stretch) (#84)

**Scope:** Additive `from-shepherd.ts` + `from-driver.ts` transforms reusing Phase 7a infra; wired into `cli.ts` `TRANSFORMS` map; `EXPERIMENTAL_TRANSFORMS` set with CLI warning for transforms below 80%; per-source `from-shepherd.md` / `from-driver.md` coverage matrices; `migration/shepherd.mdx` + `migration/driver.mdx` with anchored TODO destinations; Joyride no-regression gate.
**Key Pattern:** Same as Phase 7a — integration round-trip against real fixture corpora (Shepherd, Driver). Phase 7a's fixture-runner is parametrized over all three sources; new per-source coverage gates run independently. Experimental fallback path is testable (CLI prints warning when a source is in `EXPERIMENTAL_TRANSFORMS`).
**Dependencies:** Same as Phase 7a — `vitest@^4.1.0`, `jscodeshift@^17.3.0`, `typescript@^5.9.3`. Phase 0.6 Shepherd + Driver fixture corpora (may not exist if 0.6 was skipped — see note below).

---

## User Stories

| # | User Story | Validation Check | Pass Condition |
|---|------------|------------------|----------------|
| US-1 | As a Shepherd.js consumer, I want `--from shepherd` to migrate my class-chained tour code | `fixture-runner.test.ts` shepherd subset | Shepherd fixtures ≥80% match OR ships as experimental with warning |
| US-2 | As a Driver.js consumer, I want `--from driver` to migrate my function-call tour code | `fixture-runner.test.ts` driver subset | Driver fixtures ≥80% match OR ships as experimental with warning |
| US-3 | As a Joyride user, I want Phase 7b changes to NOT regress Phase 7a's coverage so my migration still works | `fixture-runner.test.ts` Joyride subset (re-run) | Joyride coverage still ≥80% |
| US-4 | As an `experimental` user, I want the CLI to print a warning naming the coverage % so I know what I'm getting | `cli.test.ts` TestExperimentalWarning | When `--from <experimental-source>` is used, stderr contains `experimental` + a percentage |
| US-5 | As a docs reader, I want every TODO anchor from Shepherd/Driver to resolve to a heading in the respective MDX | `docs-anchors.test.ts` extended | Zero orphan anchors per source |
| US-6 | As a future-maintainer, I want each transform's TODO-emission contract proven via unit tests | `from-shepherd.test.ts` + `from-driver.test.ts` | ≥4 unit cases per transform covering supported + unsupported patterns |
| US-7 | As a release engineer, I want the corpus existence checked so missing fixtures don't silently pass | `fixture-runner.test.ts` TestCorpusPresence | If Phase 0.6 was skipped: tests skip cleanly; phase ships deferred (per README note) |

---

## Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|-----------|---------------|----------------|------------|
| `from-shepherd.ts` transform | No mock — real jscodeshift round-trip via Phase 7a's `runTransform` helper | Output equals expected (normalized); tsc-clean; contains `'@tour-kit/react'` | US-1 |
| `from-driver.ts` transform | No mock — same | Output equals expected (normalized); tsc-clean | US-2 |
| Shared `mapStepObject` (extended from 7a) | No mock — call via real AST nodes | NEW patterns (Shepherd `attachTo`, Driver `popover.side`) map correctly; existing Joyride patterns unchanged | US-3, US-6 |
| `cli.ts` `TRANSFORMS` map | No mock — `runMigrate(['--from', 'shepherd', ...])` calls real transform | Exit codes per spec; `EXPERIMENTAL_TRANSFORMS` set causes warning to stderr | US-4 |
| `EXPERIMENTAL_TRANSFORMS` warning | Capture stderr from `runMigrate`; assert message | stderr contains `'experimental'` + numeric percentage; non-experimental sources don't trigger | US-4 |
| Fixture corpus (Shepherd + Driver) | Files on disk from Phase 0.6 | ≥3 input/expected pairs per source; corpus existence guarded with `it.skip` if missing | US-7 |
| Joyride no-regression | Re-run Phase 7a's fixture-runner Joyride subset | ratio ≥ 0.8 still | US-3 |
| TODO anchor coverage (Shepherd, Driver) | Extend Phase 7a's `docs-anchors.test.ts` to also scan shepherd.mdx + driver.mdx | Every emitted anchor per source resolves to a heading | US-5 |

---

## Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|--------------|-------|-------------|
| Unit (per-transform + extended step-mapper + CLI experimental flag) | `vitest`, `jscodeshift` | <3s | Every push |
| Integration (parametrized fixture runner) | `vitest`, `jscodeshift`, `tsc` | <30s (3 sources × N fixtures × tsc) | Every push |
| Coverage gates × 3 | counts within runner | <1s | Every push — independent pass/fail per source |
| Docs anchor parity × 3 | MDX files + emitted TODOs | <3s | Every push |
| Phase 7a no-regression | re-run Joyride subset of fixture-runner | within integration tier | Every push |

No new tier vs Phase 7a — just parametrization.

---

## Fake / Mock Implementations

**No fakes.** Same as 7a — codemods test the round-trip; mocking the AST library or `tsc` defeats the purpose.

**Re-use Phase 7a's `_helpers.ts`** — `runTransform`, `normalize`, `tscNoEmit`, `reparses` all work identically for Shepherd and Driver.

For the experimental-warning test, capture `console.error` (or stderr) via `vi.spyOn(console, 'error')`:

```ts
// inside cli.test.ts
import { vi } from 'vitest'
const captureStderr = () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  return {
    get text() { return spy.mock.calls.map((args) => args.map(String).join(' ')).join('\n') },
    restore: () => spy.mockRestore(),
  }
}
```

---

## Test File List

```
packages/codemods/src/__tests__/
├── _helpers.ts                                          # FROM 7a — unchanged
├── step-mapper.test.ts                                  # FROM 7a — extended with Shepherd/Driver-specific patterns IF mapping grows
├── cli.test.ts                                          # FROM 7a — extended with --from shepherd|driver cases + experimental warning
├── from-shepherd.test.ts                                # NEW: ≥4 unit cases — attachTo, addStep chain, buttons mapping, beforeShowPromise
├── from-driver.test.ts                                  # NEW: ≥4 unit cases — element selector, popover mapping, side→placement, onHighlightStarted
├── fixture-runner.test.ts                               # FROM 7a — parametrized over { joyride, shepherd, driver }
├── docs-anchors.test.ts                                 # FROM 7a — extended to scan shepherd.mdx + driver.mdx
└── bin-smoke.test.ts                                    # FROM 7a — unchanged

packages/codemods/__tests__/fixtures/
├── joyride/                                             # FROM Phase 0.5/7a
├── shepherd/                                            # FROM Phase 0.6 (REQUIRED; if missing, tests skip and phase defers)
└── driver/                                              # FROM Phase 0.6
```

`from-shepherd.test.ts` and `from-driver.test.ts` are NEW. Everything else is EXTENDED, not replaced.

---

## `setup` / Fixtures Structure

**Existing `packages/codemods/vitest.config.ts` from Phase 7a — no changes.** The `node` env + `forks` pool + 30s timeout already cover Shepherd/Driver tests.

No new test infrastructure. The new transforms reuse all Phase 7a helpers; the parametrized fixture-runner just iterates over an additional two `sources`.

---

## Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Parametrize the fixture-runner; do NOT duplicate it per source | One `for (const src of SOURCES)` loop | Three near-identical files would drift |
| Independent ≥80% gate per source | One `it('shepherd ≥80%', ...)` and one `it('driver ≥80%', ...)` | A failure in one shouldn't mask another's pass — and the experimental fallback path needs per-source decision |
| `EXPERIMENTAL_TRANSFORMS` is a const Set in `cli.ts`, asserted in tests | `expect(EXPERIMENTAL_TRANSFORMS).toContain('shepherd')` (or not) | Pinning the set in a test makes the experimental status part of the code review — not a CHANGELOG-only signal |
| Joyride re-run lives in this phase's test file too | Same parametrized loop covers all 3 sources | Phase 7b explicitly forbids regressing Phase 7a — assertion enforces it |
| Corpus-existence skip uses `existsSync` + `describe.skipIf` | Per-source guard | If Phase 0.6 was skipped, Shepherd/Driver tests `skip` cleanly — Joyride still runs |
| Don't add NEW test infrastructure | Reuse `_helpers.ts` verbatim | Phase 7b's success criterion is "additive only" — no shared-module changes that break Joyride |
| Experimental CLI test captures stderr, not stdout | `vi.spyOn(console, 'error')` | Warnings belong on stderr; the cli design uses `console.error` for non-fatal messages |
| Extend `docs-anchors.test.ts` to scan THREE MDX files, not duplicate it | Multi-source loop | Same parametrization pattern as fixture-runner |
| Don't write a "shared mapper additivity" unit test | Trust `step-mapper.test.ts` from 7a — re-run it; if a Joyride mapping case regresses, it fails | Specific test would just re-derive 7a's coverage |

---

## Example Test Case

```ts
// packages/codemods/src/__tests__/fixture-runner.test.ts  (Phase 7b extension)
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import fromJoyride from '../transforms/from-joyride'
import fromShepherd from '../transforms/from-shepherd'
import fromDriver from '../transforms/from-driver'
import { runTransform, normalize, tscNoEmit } from './_helpers'

const SOURCES = [
  { name: 'joyride', transform: fromJoyride },
  { name: 'shepherd', transform: fromShepherd },
  { name: 'driver', transform: fromDriver },
] as const

type FixtureResult = { name: string; diffOk: boolean; tscOk: boolean; tscOutput: string }

for (const src of SOURCES) {
  const dir = join(__dirname, '..', '..', '__tests__', 'fixtures', src.name)
  if (!existsSync(dir)) {
    describe(`${src.name} fixtures`, () => {
      it.skip(`corpus not present at ${dir}; Phase 0.6 may have been skipped`, () => {})
    })
    continue
  }

  const inputs = readdirSync(dir).filter((f) => f.endsWith('.input.tsx') || f.endsWith('.input.ts'))
  const results: FixtureResult[] = inputs.map((file) => {
    const name = file.replace(/\.input\.tsx?$/, '')
    const expectedTsx = join(dir, `${name}.expected.tsx`)
    const expectedTs = join(dir, `${name}.expected.ts`)
    const expectedPath = existsSync(expectedTsx) ? expectedTsx : expectedTs
    if (!existsSync(expectedPath)) return { name, diffOk: false, tscOk: false, tscOutput: 'expected missing' }
    const input = readFileSync(join(dir, file), 'utf8')
    const actual = runTransform(src.transform, input, file)
    const diffOk = normalize(actual) === normalize(readFileSync(expectedPath, 'utf8'))
    const tsc = tscNoEmit(actual)
    return { name, diffOk, tscOk: tsc.ok, tscOutput: tsc.output }
  })

  describe(`${src.name} — per-fixture diff`, () => {
    for (const r of results) {
      it(`${r.name} matches expected (normalized)`, () => expect(r.diffOk).toBe(true))
    }
  })

  describe(`${src.name} — per-fixture tsc clean`, () => {
    for (const r of results) {
      if (!r.diffOk) continue
      it(`${r.name} output passes tsc --noEmit`, () => expect(r.tscOk, r.tscOutput).toBe(true))
    }
  })

  describe(`${src.name} — coverage gate`, () => {
    it(`hits ≥80% (or ships as experimental)`, () => {
      const passed = results.filter((r) => r.diffOk && r.tscOk).length
      const ratio = passed / results.length
      // If below 80%, the transform must be in EXPERIMENTAL_TRANSFORMS — assert that elsewhere.
      // Here: assert the ratio meets the gate OR the source is flagged experimental.
      const isExperimental = isFlaggedExperimental(src.name)
      expect(
        ratio >= 0.8 || isExperimental,
        `${src.name} coverage ${(ratio * 100).toFixed(0)}% < 80% AND not flagged experimental — failing: ${results.filter((r) => !(r.diffOk && r.tscOk)).map((r) => r.name).join(', ')}`,
      ).toBe(true)
    })
  })
}

function isFlaggedExperimental(name: string): boolean {
  const { EXPERIMENTAL_TRANSFORMS } = require('../cli')
  return (EXPERIMENTAL_TRANSFORMS as Set<string>).has(name)
}
```

```ts
// packages/codemods/src/__tests__/cli.test.ts  (Phase 7b extension — appended cases)
import { describe, it, expect, vi } from 'vitest'
import { runMigrate, EXPERIMENTAL_TRANSFORMS } from '../cli'

describe('CLI — experimental warnings', () => {
  function captureStderr() {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    return {
      get text() { return spy.mock.calls.map((c) => c.map(String).join(' ')).join('\n') },
      restore: () => spy.mockRestore(),
    }
  }

  it('prints an experimental warning when --from is flagged experimental', async () => {
    if (EXPERIMENTAL_TRANSFORMS.size === 0) {
      // Nothing flagged — phase shipped both at ≥80%; no warning to assert
      return
    }
    const source = [...EXPERIMENTAL_TRANSFORMS][0]!
    const stderr = captureStderr()
    await runMigrate(['--from', source, '--dry-run', `packages/codemods/__tests__/fixtures/${source}/`])
    expect(stderr.text).toMatch(/experimental/i)
    expect(stderr.text).toMatch(/\d+%/)
    stderr.restore()
  })

  it('does NOT print experimental warning for non-flagged sources', async () => {
    const stable = ['joyride', 'shepherd', 'driver'].filter((s) => !EXPERIMENTAL_TRANSFORMS.has(s))
    if (stable.length === 0) return
    const source = stable[0]!
    const stderr = captureStderr()
    await runMigrate(['--from', source, '--dry-run', `packages/codemods/__tests__/fixtures/${source}/`])
    expect(stderr.text).not.toMatch(/experimental/i)
    stderr.restore()
  })
})

describe('CLI — TRANSFORMS map includes all three sources', () => {
  it('accepts --from shepherd', async () => {
    const code = await runMigrate(['--from', 'shepherd'])
    // 3 = no paths, NOT 2 = bad --from — proves the source is recognized
    expect(code).toBe(3)
  })
  it('accepts --from driver', async () => {
    const code = await runMigrate(['--from', 'driver'])
    expect(code).toBe(3)
  })
})
```

```ts
// packages/codemods/src/__tests__/from-shepherd.test.ts
import { describe, it, expect } from 'vitest'
import jscodeshift from 'jscodeshift'
import transform from '../transforms/from-shepherd'
import { runTransform } from './_helpers'

const j = jscodeshift.withParser('tsx')

describe('from-shepherd — basic shapes', () => {
  it('rewrites import "shepherd.js" to "@tour-kit/react"', () => {
    const out = runTransform(transform, `import Shepherd from 'shepherd.js'\nnew Shepherd.Tour({}).start()`)
    expect(out).toContain(`from '@tour-kit/react'`)
    expect(out).not.toContain(`'shepherd.js'`)
  })

  it('reconstitutes addStep chain into a steps array', () => {
    const src = `
import Shepherd from 'shepherd.js'
const tour = new Shepherd.Tour({})
tour.addStep({ id: 'a', attachTo: { element: '#hero', on: 'top' }, text: 'A' })
tour.addStep({ id: 'b', attachTo: { element: '#cta', on: 'bottom' }, text: 'B' })
tour.start()
`
    const out = runTransform(transform, src)
    expect(out).toMatch(/steps\s*:\s*\[/)
    expect(out).toMatch(/id:\s*['"]a['"]/)
    expect(out).toMatch(/id:\s*['"]b['"]/)
  })

  it('maps attachTo.element string + on to target + placement', () => {
    const out = runTransform(transform, `
import Shepherd from 'shepherd.js'
const t = new Shepherd.Tour({})
t.addStep({ attachTo: { element: '#hero', on: 'top' }, text: 'X' })
t.start()
`)
    expect(out).toMatch(/target:\s*['"]#hero['"]/)
    expect(out).toMatch(/placement:\s*['"]top['"]/)
  })

  it('emits TODO for attachTo.element as function', () => {
    const out = runTransform(transform, `
import Shepherd from 'shepherd.js'
const t = new Shepherd.Tour({})
t.addStep({ attachTo: { element: () => document.body, on: 'top' }, text: 'X' })
t.start()
`)
    expect(out).toMatch(/\/\/ TODO:.*attachTo.*element.*function/i)
    expect(out).toMatch(/https:\/\/tourkit\.dev\/migration\/shepherd#/)
  })
})
```

```ts
// packages/codemods/src/__tests__/from-driver.test.ts
import { describe, it, expect } from 'vitest'
import transform from '../transforms/from-driver'
import { runTransform } from './_helpers'

describe('from-driver — basic shapes', () => {
  it('rewrites import "driver.js" to "@tour-kit/react"', () => {
    const out = runTransform(transform, `import { driver } from 'driver.js'\ndriver({ steps: [] }).drive()`)
    expect(out).toContain(`from '@tour-kit/react'`)
    expect(out).not.toContain(`'driver.js'`)
  })

  it('maps popover.title/description/side to title/content/placement', () => {
    const out = runTransform(transform, `
import { driver } from 'driver.js'
const d = driver({ steps: [{ element: '#hero', popover: { title: 'Hi', description: 'There', side: 'top' } }] })
d.drive()
`)
    expect(out).toMatch(/title:\s*['"]Hi['"]/)
    expect(out).toMatch(/content:\s*['"]There['"]/)
    expect(out).toMatch(/placement:\s*['"]top['"]/)
  })

  it('maps Step.element selector to target', () => {
    const out = runTransform(transform, `
import { driver } from 'driver.js'
driver({ steps: [{ element: '#hero', popover: { description: 'X' } }] }).drive()
`)
    expect(out).toMatch(/target:\s*['"]#hero['"]/)
  })

  it('emits TODO when element is a DOM Element instance (not a selector)', () => {
    const out = runTransform(transform, `
import { driver } from 'driver.js'
const el = document.getElementById('hero')!
driver({ steps: [{ element: el, popover: { description: 'X' } }] }).drive()
`)
    expect(out).toMatch(/\/\/ TODO:.*element.*Element/i)
  })
})
```

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to write this test suite:

---
You are writing the complete test suite for Phase 7b of Tour Kit's Sprint 1 — the Shepherd + Driver.js codemods (issue #84 stretch).

### What This Project Is
Tour Kit's marketing claim: "migrate from any major React tour library in one command." Phase 7a shipped the Joyride transform. Phase 7b adds Shepherd.js and Driver.js so the claim holds for the three top competitors. Phase 7a already built ALL the test infrastructure — Phase 7b reuses everything and adds per-source test cases plus a parametrized fixture runner.

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|------------|------------------|----------------|
| US-1 | Shepherd transform works | fixture-runner shepherd subset | ≥80% match OR experimental |
| US-2 | Driver transform works | fixture-runner driver subset | ≥80% match OR experimental |
| US-3 | Joyride no-regression | fixture-runner joyride subset (re-run) | ratio ≥ 0.8 |
| US-4 | CLI prints experimental warning | cli.test stderr capture | stderr matches /experimental/i + /\d+%/ |
| US-5 | TODO anchors resolve for all three sources | docs-anchors extended | zero orphan anchors per source |
| US-6 | Per-transform unit cases ≥4 | from-shepherd.test + from-driver.test | ≥4 cases each |
| US-7 | Missing-corpus tests skip cleanly | describe.skipIf on existsSync | If Phase 0.6 skipped → suite skips |

### Why Fakes Are Required
**None.** Same as Phase 7a — codemod tests are round-trip integration tests; mocking jscodeshift or tsc invalidates them. Reuse Phase 7a's `_helpers.ts` verbatim.

### What NOT to Test
- Don't duplicate Phase 7a's fixture-runner — parametrize the existing one.
- Don't write a test asserting Shepherd's class-chain semantics — assert on the OUTPUT structure (steps array, target/placement fields).
- Don't test the experimental warning message text exactly — assert the keyword `experimental` + a percentage.
- Don't add Shepherd or Driver as runtime deps just to read their source — fixture inputs are static `.tsx` strings.
- Don't write a separate test for "additive only" — if Phase 7a's Joyride coverage gate stays green, the rule is enforced.
- Don't add per-source coverage matrices to test code — those live in `docs/from-<source>.md`; the test just enforces the ≥80% gate.

### Critical: Fake Implementations

No new fakes. Reuse Phase 7a's `_helpers.ts`:

```ts
// packages/codemods/src/__tests__/_helpers.ts (from Phase 7a — unchanged)
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
export function normalize(s: string): string { return s.replace(/\s+/g, ' ').trim() }
export function tscNoEmit(tsx: string): { ok: boolean; output: string } {
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
packages/codemods/src/__tests__/
├── _helpers.ts                                          # FROM 7a — UNCHANGED
├── from-shepherd.test.ts                                # NEW — ≥4 unit cases
├── from-driver.test.ts                                  # NEW — ≥4 unit cases
├── fixture-runner.test.ts                               # FROM 7a — REWRITE to parametrize over 3 sources
├── cli.test.ts                                          # FROM 7a — APPEND experimental + new --from cases
└── docs-anchors.test.ts                                 # FROM 7a — EXTEND to scan 3 MDX files
```

### Per-File Coverage Guidance

#### `from-shepherd.test.ts` (new)
≥4 cases:
- Import rewrite: `'shepherd.js'` → `'@tour-kit/react'`
- `addStep` chain reconstituted into a `steps: [...]` array (assert two steps with correct ids)
- `attachTo.element` string + `attachTo.on` → `target` + `placement`
- `attachTo.element` as function → TODO with `shepherd#` anchor
- (Optional 5th) `buttons` array → tour-level handlers OR TODO for custom

#### `from-driver.test.ts` (new)
≥4 cases:
- Import rewrite: `'driver.js'` → `'@tour-kit/react'`
- `popover.{title, description, side}` → `{title, content, placement}`
- `Step.element` selector string → `target`
- `Step.element` as DOM Element instance → TODO with `driver#` anchor

#### `fixture-runner.test.ts` (rewrite)
Parametrize over three sources: `[{ name: 'joyride', transform: fromJoyride }, { name: 'shepherd', transform: fromShepherd }, { name: 'driver', transform: fromDriver }]`. For each:
- `if (!existsSync(dir)) describe.skip(...)` — corpus may be absent if Phase 0.6 was skipped
- Per-fixture diff describe
- Per-fixture tsc-clean describe (only for fixtures in diff-pass-set)
- Coverage-gate describe: `ratio ≥ 0.8 OR EXPERIMENTAL_TRANSFORMS.has(src.name)` — combined assertion

`isFlaggedExperimental(name)` reads the `EXPERIMENTAL_TRANSFORMS` set from `../cli` via dynamic require.

#### `cli.test.ts` (append cases)
- Recognize `--from shepherd` → exit 3 with no paths (proves the source is wired)
- Recognize `--from driver` → exit 3 with no paths
- Experimental warning: if `EXPERIMENTAL_TRANSFORMS` is non-empty, calling `runMigrate(['--from', <flagged>, ...])` prints to stderr matching `/experimental/i` + `/\d+%/`
- Non-experimental sources do NOT print the warning

Use `vi.spyOn(console, 'error')` to capture stderr.

#### `docs-anchors.test.ts` (extend)
Phase 7a's test scans one MDX file; extend to a loop over three: `[ { source: 'joyride', mdx: '.../migration/joyride.mdx' }, { source: 'shepherd', mdx: '.../shepherd.mdx' }, { source: 'driver', mdx: '.../driver.mdx' } ]`. For each, collect emitted anchors via running the corresponding transform over its fixture corpus; cross-check against MDX `## ...` headings. `if (!existsSync(mdx)) skip(...)`.

### Data Model Notes
- Phase 7a's `_helpers.ts` is REUSED — do not duplicate or "improve" it.
- `EXPERIMENTAL_TRANSFORMS` is exported from `../cli`. Tests must use the LIVE export, not a hardcoded list — keeps test in sync with code.
- `fixture-runner.test.ts` rewrite: parametrize the existing single-source structure; don't fork into three files.
- Shepherd/Driver fixture corpora MAY be absent if Phase 0.6 was skipped — tests must `it.skip` cleanly in that case; phase ships deferred per README.

### Success Criteria
- `pnpm --filter @tour-kit/codemods build && pnpm --filter @tour-kit/codemods test` exit 0.
- Joyride coverage stays ≥80% (Phase 7a no-regression).
- Shepherd AND Driver coverage gates either pass at ≥80% OR the source is flagged in `EXPERIMENTAL_TRANSFORMS`.
- `from-shepherd.test.ts` and `from-driver.test.ts` each have ≥4 green cases.
- `cli.test.ts` confirms `--from shepherd` and `--from driver` are recognized.
- `docs-anchors.test.ts` reports zero orphan anchors for ALL three sources (or skips a missing-MDX source cleanly).
- If Phase 0.6 corpora are missing: tests SKIP (not fail), and the README + changeset document the deferred status.

### Expected File Structure at End
```
packages/codemods/src/__tests__/
├── _helpers.ts                       (from 7a — unchanged)
├── step-mapper.test.ts               (from 7a — unchanged or minor extension if mapper grew)
├── cli.test.ts                       (extended with experimental + new --from cases)
├── fixture-runner.test.ts            (rewritten to parametrize over 3 sources)
├── docs-anchors.test.ts              (extended to 3 MDX files)
├── bin-smoke.test.ts                 (from 7a — unchanged)
├── from-shepherd.test.ts             (new)
└── from-driver.test.ts               (new)
```
---

---

## Run Commands

```bash
# All Phase 7b tests (incl. all three sources via parametrized runner)
pnpm --filter @tour-kit/codemods test

# Single transform's unit tests
pnpm --filter @tour-kit/codemods test -- from-shepherd
pnpm --filter @tour-kit/codemods test -- from-driver

# Per-source coverage gates only
pnpm --filter @tour-kit/codemods test -- fixture-runner -t "shepherd"
pnpm --filter @tour-kit/codemods test -- fixture-runner -t "driver"
pnpm --filter @tour-kit/codemods test -- fixture-runner -t "joyride"     # no-regression

# Experimental warning behavior
pnpm --filter @tour-kit/codemods test -- cli -t "experimental"

# Docs anchor parity for all three sources
pnpm --filter @tour-kit/codemods test -- docs-anchors

# Manual sanity — run each source against its corpus
npx tour-kit-migrate --from shepherd --dry-run packages/codemods/__tests__/fixtures/shepherd/
npx tour-kit-migrate --from driver --dry-run packages/codemods/__tests__/fixtures/driver/

# Full Phase 7b gate (also re-runs Phase 7a's gates)
pnpm --filter @tour-kit/codemods typecheck && \
  pnpm --filter @tour-kit/codemods build && \
  pnpm --filter @tour-kit/codemods test
```

# Phase 2 — Testing: Zod Schemas for Tour Definitions (#91)

**Scope:** `@tour-kit/core/schemas` subpath: `tourDefinitionSchema`, `tourStepDefinitionSchema`, `audienceSchema`, `audienceConditionSchema`, `flowSourceSchema`; `parseTourDefinition`, `safeParseTourDefinition`, `createTourDefinitionSchema`; `TourDefinition` / `TourStepDefinition` / `AudienceDefinition` types; subpath export wiring; `peerDependenciesMeta.zod.optional = true`; size-limit budgets.
**Key Pattern:** Service-style (boundary parser) phase — Zod IS the boundary, so DON'T mock it. Tests parse real JSON inputs against the real schema; bundle hygiene is asserted via a string-grep against the built `dist/index.mjs`; key-coverage parity is enforced through `.test-d.ts` conditional types — not via `z.infer ≡ Tour` equality (impossible per spec).
**Dependencies:** `zod@^3.25.0 || ^4.0.0` (optional peer in published package; required devDep here), `vitest@^4.1.0`, Phase 0 type-test harness, Phase 1 `Tour<TStep>` (used as a type reference only).

---

## User Stories

| # | User Story | Validation Check | Pass Condition |
|---|------------|------------------|----------------|
| US-1 | As a CMS-integrating consumer, I want `parseTourDefinition(json)` to validate a JSON-safe subset of `Tour` so bad payloads fail loudly at the boundary | `parse.test.ts` TestParseSuccess + TestParseFailure (≥8 cases incl. empty steps, empty id, ref-style target rejected, invalid placement) | All ≥8 cases pass; `parse` throws `ZodError`; `safeParse` returns the tagged union with `success: false` |
| US-2 | As a consumer who never validates, I want `import '@tour-kit/core'` to NOT ship Zod so my bundle stays small | `no-zod-in-main.test.ts` reads `dist/index.mjs` and asserts no `from "zod"` import remains | `grep -c '\\bzod\\b' dist/index.mjs` returns 0 |
| US-3 | As a maintainer, I want compile-time parity between `TourDefinition`, the schema, and the JSON-safe key set of `Tour` so the schema can't silently drift | `parity.test-d.ts` `AssertExact<keyof TourDefinition, TourJsonSafeKeys>` for both Tour and Step levels | `typecheck:types` exits 0; removing a key from `TourJsonSafeKeys` breaks compile |
| US-4 | As a TypeScript consumer, I want `import { parseTourDefinition } from '@tour-kit/core/schemas'` to resolve in BOTH ESM and CJS so I can use it in any project setup | `subpath-resolution.test.ts` dynamic-imports the ESM artifact AND requires the CJS artifact | Both calls return an object with `parseTourDefinition` function |
| US-5 | As a Phase 7a docs writer, I want `parseTourDefinition` to be fast enough that CMS hot reloads don't lag | `parse.bench.ts` runs a 5-step tour through the parser 100× | Median <5ms per parse |
| US-6 | As a release engineer, I want a CI-enforced size budget so accidental imports of Zod into the main bundle fail the build | `.size-limit.json` entry checked by `pnpm size` | Main entry <8KB; schemas subpath <12KB |

---

## Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|-----------|---------------|----------------|------------|
| `tourDefinitionSchema` (Zod object) | No mock — Zod IS the artifact | `parse({...})` for valid + invalid inputs; failure mode is `ZodError` | US-1 |
| `parseTourDefinition` / `safeParseTourDefinition` | No mock — exercise the real function | `parse` throws on bad input; `safeParse` returns `{ success: false, error: ZodError }` | US-1 |
| `createTourDefinitionSchema({ contentSchema })` factory | No mock; pass a real `z.object({})` content shape | Returned schema enforces the typed content; round-trips a valid input | US-1 |
| Main bundle hygiene (`dist/index.mjs`) | No mock — read file post-build | Zero matches for `from "zod"` or path starting with `zod/` | US-2 |
| Schemas subpath (`dist/schemas/index.{mjs,cjs}`) | No mock — dynamic import + require | Both return `{ parseTourDefinition }` | US-4 |
| `TourDefinition` / `TourStepDefinition` types | No mock — `.test-d.ts` `AssertExact<...>` | Key sets match the hand-authored `TourJsonSafeKeys` union | US-3 |
| `z.infer<typeof schema>` vs `TourDefinition` | No mock — assignability check in `.test-d.ts` | KEY SET match only (NOT full type equality — `target` is `string` here, `string \| RefObject` in `TourStep`) | US-3 |
| `peerDependenciesMeta.zod.optional` | No mock — parse `package.json` | `optional: true` literal present | US-2 |
| `parseTourDefinition` performance | No mock — `vitest bench` | Median <5ms for 5-step input over 100 iterations | US-5 |
| Size budgets | No mock — `pnpm size` (size-limit CLI) | Main <8KB, schemas <12KB | US-6 |

---

## Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|--------------|-------|-------------|
| Unit (runtime parse) | `vitest`, `zod` | <2s | Every push |
| Unit (type parity) | `typescript` via Phase 0 harness | <3s | Every push |
| Build hygiene | `tsup` build output (`dist/index.mjs`, `dist/schemas/index.{mjs,cjs}`) | <8s (build) + <1s (grep) | Every push — gates merges that accidentally leak Zod |
| Bench | `vitest bench` | <5s | Every push (vitest bench runs are fast; no real model load) |
| Size budget | `size-limit` CLI | <10s | Every push — fails the build on budget exceed |

No integration / E2E tier — Zod runs in the same process.

---

## Fake / Mock Implementations

**No fakes needed (Service / Boundary Phase).** Zod IS what we're testing. Mocking it would invalidate the parse tests. The bundle-hygiene test reads the actual `dist/index.mjs` after `tsup build` — no mock makes sense there either.

The one piece of test infrastructure is a **sample inputs object** centralized in `src/lib/schemas/__tests__/_inputs.ts`:

```ts
// packages/core/src/lib/schemas/__tests__/_inputs.ts
export const validMinimal = {
  id: 'demo',
  steps: [{ id: 's1', target: '#a', content: 'hi' }],
}

export const validFull = {
  id: 'demo',
  steps: [
    { id: 's1', target: '#a', content: 'hi', placement: 'top', kind: 'visible' as const },
    { id: 's2', target: '#b', content: 'there', title: 'Step 2' },
  ],
  audience: { segment: 'admins' },
  autoStart: true,
  startAt: 0,
}

export const validWithConditionAudience = {
  id: 'demo',
  steps: [{ id: 's1', target: '#a', content: '' }],
  audience: [{ key: 'plan', operator: 'equals' as const, value: 'pro' }],
}

export const invalidEmptyId = { id: '', steps: [] }
export const invalidEmptySteps = { id: 't', steps: [] }
export const invalidRefTarget = {
  id: 't',
  steps: [{ id: 's', target: { current: null }, content: '' }],   // ref-like; schema expects string
}
export const invalidPlacement = {
  id: 't',
  steps: [{ id: 's', target: '#a', content: '', placement: 'invalid-direction' }],
}
export const invalidConditionOperator = {
  id: 't',
  steps: [{ id: 's', target: '#a', content: '' }],
  audience: [{ key: 'plan', operator: 'bogus', value: 'x' }],
}
```

Re-used across `parse.test.ts`, `parse.bench.ts`, and (later) Phase 7a's migration-doc examples.

---

## Test File List

```
packages/core/src/
├── lib/schemas/__tests__/
│   ├── _inputs.ts                       # shared valid + invalid fixtures
│   ├── parse.test.ts                    # ≥8 runtime cases: parse/safeParse success+failure; createTourDefinitionSchema factory
│   ├── parse.bench.ts                   # parseTourDefinition median <5ms for 5-step over 100 iter
│   └── parity.test-d.ts                 # AssertExact key-coverage: TourDefinition / TourStepDefinition / schema-inferred
└── __tests__/
    ├── no-zod-in-main.test.ts           # grep dist/index.mjs after build — zero `zod` matches
    ├── subpath-resolution.test.ts       # dynamic import + require of @tour-kit/core/schemas
    └── peer-dep-optional.test.ts        # package.json#peerDependenciesMeta.zod.optional === true
```

The `parity.test-d.ts` lives next to the schemas (consumes types) and is picked up by `tsconfig.type-tests.json#include`'s `src/**/*.test-d.ts` glob.

The bundle-hygiene + subpath-resolution tests REQUIRE a fresh build. Either:
1. Add `pretest` script: `"test": "pnpm build && vitest run"` for this package — slower but deterministic.
2. Gate the build-dependent tests with `existsSync('./dist/index.mjs')` and `.skip()` when missing; CI runs `pnpm build` before `pnpm test`. Pick option 2 to keep local dev fast.

---

## `setup` / Fixtures Structure

**Additions to existing setup at `packages/core/src/__tests__/setup.ts`** — no changes needed for schemas tests (they're pure-function tests; no DOM).

Re-use `_inputs.ts` (shown above). For build-dependent tests, add a shared `_dist.ts` helper:

```ts
// packages/core/src/__tests__/_dist.ts
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const PKG_ROOT = join(__dirname, '..', '..')   // packages/core
export const MAIN_MJS  = join(PKG_ROOT, 'dist', 'index.mjs')
export const MAIN_CJS  = join(PKG_ROOT, 'dist', 'index.cjs')
export const SCHEMAS_MJS = join(PKG_ROOT, 'dist', 'schemas', 'index.mjs')
export const SCHEMAS_CJS = join(PKG_ROOT, 'dist', 'schemas', 'index.cjs')

export function readMainBundle(): string {
  if (!existsSync(MAIN_MJS)) throw new Error(`Run \`pnpm --filter @tour-kit/core build\` first — ${MAIN_MJS} missing.`)
  return readFileSync(MAIN_MJS, 'utf8')
}

export function distExists(): boolean {
  return existsSync(MAIN_MJS) && existsSync(SCHEMAS_MJS)
}
```

No new CLI flags — every test runs on the default `pnpm test`.

---

## Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Don't mock Zod | Real schema, real inputs | Zod IS what's being tested; mocking it tests nothing |
| Parity test asserts KEY SETS only, not full equality | `AssertExact<keyof TourDefinition, TourJsonSafeKeys>` | Spec §3.2 says `Tour ≡ z.infer<...>` is impossible — `target` is `string` in the schema, `string \| RefObject` in `Tour` |
| Hand-author `TourJsonSafeKeys` as a contract literal | A union type with all JSON-safe key names | When `Tour` gains a JSON-safe field, the dev MUST update three places; the parity test catches drift on any two of three |
| Bundle hygiene = grep on built artifact, not source | `readFileSync('dist/index.mjs')` + regex | Tree-shaking decides what actually ships; source imports could be stripped or kept depending on bundler |
| Subpath resolution test does BOTH ESM and CJS | `await import(...)` + `require(...)` | The npm ecosystem still has CJS-only test runners; we promised both in `exports` |
| Bench is a separate file with `.bench.ts` extension | `vitest bench` discovers it | Keeps bench out of the standard test run unless `pnpm bench` is called |
| `_inputs.ts` is shared infrastructure | Used by parse.test + bench + (later) docs examples | One source of truth for "what a tour definition looks like" |
| Skip build-dependent tests when `dist/` is absent | `it.skip` gated on `distExists()` | Local dev doesn't always rebuild; CI does — tests don't lie when unrun |
| Reject ref-style target via `z.string().min(1)` | Schema; assertion in `parse.test.ts` | A ref is an object with `.current`; `z.string()` rejects it cleanly. No custom validator needed |

---

## Example Test Case

```ts
// packages/core/src/lib/schemas/__tests__/parse.test.ts
import { describe, it, expect } from 'vitest'
import { parseTourDefinition, safeParseTourDefinition, createTourDefinitionSchema } from '../parse'
import { z, ZodError } from 'zod'
import * as fx from './_inputs'

describe('parseTourDefinition — happy path', () => {
  it('parses minimal valid input', () => {
    const t = parseTourDefinition(fx.validMinimal)
    expect(t.id).toBe('demo')
    expect(t.steps).toHaveLength(1)
    expect(t.steps[0]?.target).toBe('#a')
  })

  it('parses full input with audience + autoStart + startAt', () => {
    const t = parseTourDefinition(fx.validFull)
    expect(t.audience).toEqual({ segment: 'admins' })
    expect(t.autoStart).toBe(true)
    expect(t.steps[0]?.placement).toBe('top')
  })

  it('parses condition-array audience', () => {
    const t = parseTourDefinition(fx.validWithConditionAudience)
    expect(Array.isArray(t.audience)).toBe(true)
    expect((t.audience as any[])[0].operator).toBe('equals')
  })
})

describe('parseTourDefinition — failure modes (throws ZodError)', () => {
  it('rejects empty steps array', () => {
    expect(() => parseTourDefinition(fx.invalidEmptySteps)).toThrow(ZodError)
  })
  it('rejects empty step id', () => {
    expect(() => parseTourDefinition({ id: 't', steps: [{ id: '', target: '#a', content: '' }] })).toThrow(ZodError)
  })
  it('rejects ref-style target (object with .current)', () => {
    expect(() => parseTourDefinition(fx.invalidRefTarget)).toThrow(ZodError)
  })
  it('rejects invalid placement value', () => {
    expect(() => parseTourDefinition(fx.invalidPlacement)).toThrow(ZodError)
  })
  it('rejects invalid condition operator', () => {
    expect(() => parseTourDefinition(fx.invalidConditionOperator)).toThrow(ZodError)
  })
})

describe('safeParseTourDefinition — tagged union shape', () => {
  it('returns { success: true, data } on valid input', () => {
    const r = safeParseTourDefinition(fx.validMinimal)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.id).toBe('demo')
  })
  it('returns { success: false, error: ZodError } on invalid input', () => {
    const r = safeParseTourDefinition(fx.invalidEmptyId)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error).toBeInstanceOf(ZodError)
  })
})

describe('createTourDefinitionSchema factory', () => {
  it('enforces a stricter content schema', () => {
    const customBlock = z.object({ kind: z.literal('text'), value: z.string() })
    const stepSchema = createTourDefinitionSchema({ contentSchema: customBlock })
    expect(() =>
      stepSchema.parse({ id: 's', target: '#a', content: { kind: 'text', value: 'ok' } })
    ).not.toThrow()
    expect(() =>
      stepSchema.parse({ id: 's', target: '#a', content: 'plain-string-not-allowed-here' })
    ).toThrow(ZodError)
  })
})
```

```ts
// packages/core/src/__tests__/no-zod-in-main.test.ts
import { describe, it, expect } from 'vitest'
import { distExists, readMainBundle } from './_dist'

describe('main bundle hygiene', () => {
  if (!distExists()) {
    it.skip('dist/ not built; run `pnpm --filter @tour-kit/core build` first', () => {})
    return
  }

  it('does not import zod', () => {
    const main = readMainBundle()
    // Match `from "zod"`, `from 'zod'`, or any `zod/...` subpath import in built ESM
    expect(main).not.toMatch(/from\s+["']zod(\/[^"']*)?["']/)
  })

  it('does not require zod (CJS path)', () => {
    // Note: index.cjs would use `require('zod')`; we only assert on .mjs here.
    // CJS hygiene falls out of the same source — but assert it explicitly if cjs exists.
    const main = readMainBundle()
    expect(main).not.toMatch(/require\(["']zod["']\)/)
  })
})
```

```ts
// packages/core/src/lib/schemas/__tests__/parity.test-d.ts
import type { z } from 'zod'
import type { TourDefinition, TourStepDefinition } from '../../../types/tour-definition'
import type { tourDefinitionSchema, tourStepDefinitionSchema } from '../tour.schema'

// Hand-authored JSON-safe key set. Update when Tour gains a JSON-safe field.
type TourJsonSafeKeys = 'id' | 'steps' | 'audience' | 'autoStart' | 'startAt'
type TourStepJsonSafeKeys =
  | 'id' | 'kind' | 'target' | 'title' | 'description'
  | 'content' | 'audience' | 'placement'

type AssertExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false

const _tdKeys: AssertExact<keyof TourDefinition, TourJsonSafeKeys> = true
const _stKeys: AssertExact<keyof TourStepDefinition, TourStepJsonSafeKeys> = true

type SchemaTour = z.infer<typeof tourDefinitionSchema>
type SchemaStep = z.infer<typeof tourStepDefinitionSchema>
const _schTourKeys: AssertExact<keyof SchemaTour, TourJsonSafeKeys> = true
const _schStepKeys: AssertExact<keyof SchemaStep, TourStepJsonSafeKeys> = true

// Drift detector — removing a key from TourJsonSafeKeys breaks _tdKeys above
// @ts-expect-error proves the drift detector catches missing keys
const _drift: AssertExact<keyof TourDefinition, 'id' | 'steps'> = true
void _tdKeys; void _stKeys; void _schTourKeys; void _schStepKeys; void _drift
```

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to write this test suite:

---
You are writing the complete test suite for Phase 2 of Tour Kit's Sprint 1 — Zod Schemas for Tour Definitions (issue #91).

### What This Project Is
Tour Kit is a headless React onboarding/product-tour monorepo. `@tour-kit/core` is framework-agnostic and sits at the bottom of the dep graph. The README sells "core <8KB gzipped" — Zod cannot leak into the main bundle. Phase 2 adds boundary validation for JSON-authorable tour definitions (CMS payloads, JSON files, MDX frontmatter) via a `@tour-kit/core/schemas` subpath. Zod is an OPTIONAL peer dep — consumers who never validate don't pay for it.

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|------------|------------------|----------------|
| US-1 | `parseTourDefinition` validates the JSON subset and fails loudly | parse.test.ts ≥8 cases | All pass; parse throws ZodError; safeParse returns tagged union |
| US-2 | Main bundle stays Zod-free | no-zod-in-main.test.ts | `grep -c '\\bzod\\b' dist/index.mjs` returns 0 |
| US-3 | Schema can't drift from TourDefinition | parity.test-d.ts | typecheck:types passes; removing a key from TourJsonSafeKeys breaks it |
| US-4 | Subpath resolves in ESM AND CJS | subpath-resolution.test.ts | both imports return `{ parseTourDefinition }` |
| US-5 | parseTourDefinition is fast enough for CMS hot reload | parse.bench.ts | Median <5ms over 100 iter (5-step input) |
| US-6 | Bundle size budgets enforced in CI | .size-limit.json | Main <8KB; schemas subpath <12KB |

### Why Fakes Are Required
**None.** Zod IS the boundary; mocking it would defeat the purpose. The bundle-hygiene test reads the built `dist/index.mjs` after `tsup build` — no mock makes sense.

### What NOT to Test
- Don't test Zod's behavior (`.parse` throws, `.safeParse` returns tagged union) — those are Zod's contracts.
- Don't test that `target` accepts a `React.RefObject` — the SCHEMA explicitly rejects refs (`z.string()`). Refs are runtime-only and attached AFTER `parseTourDefinition` returns.
- Don't assert `Tour ≡ z.infer<typeof tourDefinitionSchema>` — impossible per spec §3.2 (`content` is `ReactNode` at runtime, `unknown` at the boundary).
- Don't test `parseTourDefinition` against a giant JSON file — `vitest bench` over a 5-step tour is what the spec demands.
- Don't add a Markdown parser to test docs; the docs build (`pnpm --filter docs build`) is the docs test.

### Critical: Fake Implementations

No fakes. Add two shared helpers used by ≥3 tests:

```ts
// packages/core/src/lib/schemas/__tests__/_inputs.ts
export const validMinimal = { id: 'demo', steps: [{ id: 's1', target: '#a', content: 'hi' }] }
export const validFull = {
  id: 'demo',
  steps: [
    { id: 's1', target: '#a', content: 'hi', placement: 'top', kind: 'visible' as const },
    { id: 's2', target: '#b', content: 'there', title: 'Step 2' },
  ],
  audience: { segment: 'admins' },
  autoStart: true,
  startAt: 0,
}
export const validWithConditionAudience = {
  id: 'demo',
  steps: [{ id: 's1', target: '#a', content: '' }],
  audience: [{ key: 'plan', operator: 'equals' as const, value: 'pro' }],
}
export const invalidEmptyId = { id: '', steps: [] }
export const invalidEmptySteps = { id: 't', steps: [] }
export const invalidRefTarget = { id: 't', steps: [{ id: 's', target: { current: null }, content: '' }] }
export const invalidPlacement = { id: 't', steps: [{ id: 's', target: '#a', content: '', placement: 'invalid-direction' }] }
export const invalidConditionOperator = { id: 't', steps: [{ id: 's', target: '#a', content: '' }], audience: [{ key: 'plan', operator: 'bogus', value: 'x' }] }
```

```ts
// packages/core/src/__tests__/_dist.ts
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const PKG_ROOT = join(__dirname, '..', '..')
export const MAIN_MJS = join(PKG_ROOT, 'dist', 'index.mjs')
export const SCHEMAS_MJS = join(PKG_ROOT, 'dist', 'schemas', 'index.mjs')
export const SCHEMAS_CJS = join(PKG_ROOT, 'dist', 'schemas', 'index.cjs')

export function readMainBundle(): string {
  if (!existsSync(MAIN_MJS)) throw new Error(`Run \`pnpm --filter @tour-kit/core build\` first — ${MAIN_MJS} missing.`)
  return readFileSync(MAIN_MJS, 'utf8')
}
export function distExists(): boolean { return existsSync(MAIN_MJS) && existsSync(SCHEMAS_MJS) }
```

### Test Files to Create

```
packages/core/src/
├── lib/schemas/__tests__/
│   ├── _inputs.ts
│   ├── parse.test.ts                    # ≥8 cases: valid + invalid; safeParse tagged union; factory
│   ├── parse.bench.ts                   # 5-step median <5ms
│   └── parity.test-d.ts                 # AssertExact key-set match — Tour/Step Definition + schema-inferred
└── __tests__/
    ├── _dist.ts                         # shared dist/ path helpers
    ├── no-zod-in-main.test.ts           # main bundle has no zod imports
    ├── subpath-resolution.test.ts       # ESM import + CJS require both work
    └── peer-dep-optional.test.ts        # package.json has zod optional peer
```

### Per-File Coverage Guidance

#### `lib/schemas/__tests__/parse.test.ts`
≥8 vitest cases organized into three describes:
- **happy path:** minimal valid, full valid (autoStart, startAt, segment audience), condition-array audience → ≥3 cases
- **failure modes:** empty steps, empty step id, ref-style target, invalid placement, invalid operator → ≥5 cases; each must throw `ZodError`
- **safeParse:** `success: true, data` shape; `success: false, error: ZodError` shape → 2 cases
- **factory:** `createTourDefinitionSchema({ contentSchema })` with `z.object({...})` accepts shaped content and rejects unshaped → 2 cases

#### `lib/schemas/__tests__/parse.bench.ts`
`bench()` calls `parseTourDefinition` on a 5-step input. `iterations: 100`. Assert median <5ms via `vitest bench --reporter=verbose` (the bench output prints percentiles; the CI script greps for the median line). Alternative: wrap in a regular `it()` that times 100 runs with `performance.now()` and asserts on the median directly — pick whichever produces fewer false positives on slow CI runners.

#### `lib/schemas/__tests__/parity.test-d.ts`
Hand-author `TourJsonSafeKeys = 'id' | 'steps' | 'audience' | 'autoStart' | 'startAt'` and `TourStepJsonSafeKeys = 'id' | 'kind' | 'target' | 'title' | 'description' | 'content' | 'audience' | 'placement'`. Four `AssertExact` constants:
- `keyof TourDefinition` vs `TourJsonSafeKeys`
- `keyof TourStepDefinition` vs `TourStepJsonSafeKeys`
- `keyof z.infer<typeof tourDefinitionSchema>` vs `TourJsonSafeKeys`
- `keyof z.infer<typeof tourStepDefinitionSchema>` vs `TourStepJsonSafeKeys`

Add ONE drift-detector with `@ts-expect-error` proving the helper catches drift: `const _drift: AssertExact<keyof TourDefinition, 'id' | 'steps'> = true` — should fail compile (it's incomplete), and the `@ts-expect-error` line on top suppresses it for the test.

#### `__tests__/no-zod-in-main.test.ts`
`if (!distExists()) it.skip(...)` at the top. Then: read `MAIN_MJS`; assert no match for `/from\s+["']zod(\/[^"']*)?["']/`; assert no match for `/require\(["']zod["']\)/`. Two cases.

#### `__tests__/subpath-resolution.test.ts`
Same skip guard. Two cases:
- `const mod = await import('@tour-kit/core/schemas'); expect(typeof mod.parseTourDefinition).toBe('function')`
- Spawn a node child process that runs `node -e "const m = require('@tour-kit/core/schemas'); console.log(typeof m.parseTourDefinition)"` and assert stdout contains `function`. This is more reliable than `createRequire` for proving the CJS entry resolves.

#### `__tests__/peer-dep-optional.test.ts`
Read `packages/core/package.json`. Assert:
- `peerDependencies.zod === '^3.25.0 || ^4.0.0'`
- `peerDependenciesMeta.zod.optional === true`

### Data Model Notes
- **`@dataclass` results** → N/A (TypeScript). Assert on object fields directly.
- **Zod schemas** — `parse(x)` throws on failure; `safeParse(x)` returns `{ success: true, data } | { success: false, error }`.
- **`ZodError`** has `.format()`, `.flatten()`, `.issues`. Don't assert on the format unless documented in the API; assert on `instanceof ZodError` and on `error.issues[0].path`.
- `TourDefinition.target` is `string` (not `string | RefObject<HTMLElement>`) — Phase 2's whole point.
- `TourDefinition.content` is `unknown` — the schema guarantees PRESENCE, not React-element shape.

### Success Criteria
- `pnpm --filter @tour-kit/core build` exits 0 and emits `dist/schemas/index.{mjs,cjs,d.ts}`.
- `pnpm --filter @tour-kit/core test -- schemas` exits 0 with ≥8 runtime cases plus the parity type tests.
- `pnpm --filter @tour-kit/core test -- no-zod-in-main` exits 0 (after build).
- `pnpm --filter @tour-kit/core typecheck:types` exits 0; removing one key from `TourJsonSafeKeys` breaks compile.
- `pnpm size` reports main entry <8KB and schemas subpath <12KB.
- `pnpm --filter @tour-kit/core test -- subpath-resolution` exits 0 (after build).

### Expected File Structure at End
```
packages/core/src/
├── lib/schemas/__tests__/
│   ├── _inputs.ts
│   ├── parse.test.ts
│   ├── parse.bench.ts
│   └── parity.test-d.ts
└── __tests__/
    ├── _dist.ts
    ├── no-zod-in-main.test.ts
    ├── subpath-resolution.test.ts
    └── peer-dep-optional.test.ts
```
---

---

## Run Commands

```bash
# Build is REQUIRED before bundle-hygiene + subpath-resolution tests
pnpm --filter @tour-kit/core build

# Runtime + parity tests
pnpm --filter @tour-kit/core test -- schemas

# Bundle hygiene + subpath
pnpm --filter @tour-kit/core test -- no-zod-in-main
pnpm --filter @tour-kit/core test -- subpath-resolution
pnpm --filter @tour-kit/core test -- peer-dep-optional

# Type parity (Phase 0 harness)
pnpm --filter @tour-kit/core typecheck:types

# Benchmark
pnpm --filter @tour-kit/core test -- parse.bench --reporter=verbose

# Size budgets (CI gate)
pnpm size

# All Phase 2 tests in one go (after a fresh build)
pnpm --filter @tour-kit/core build && \
  pnpm --filter @tour-kit/core test -- "(schemas|no-zod-in-main|subpath-resolution|peer-dep-optional)" && \
  pnpm --filter @tour-kit/core typecheck:types && \
  pnpm size
```

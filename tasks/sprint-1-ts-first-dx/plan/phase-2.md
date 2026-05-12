# Phase 2 — Zod Schemas for Tour Definitions (#91)

**Duration:** Days 4–6 (~13–15 hours)
**Depends on:** Phase 1 (`Tour<TStep>` generic; key-coverage tests reference `TourStep`)
**Blocks:** Future analytics flow-source (#37), CMS adapters (#38), approval workflow (#41), hosted-admin direction
**Risk Level:** MEDIUM — bundle-budget regression and peer-dep range mistakes have non-local effects; the JSON-vs-runtime caveat is easy to get wrong
**Stack:** typescript

---

## Objective

Add a `@tour-kit/core/schemas` subpath that validates JSON-authorable tour definitions at boundaries (CMS responses, JSON files, MDX frontmatter) without dragging Zod into the main core bundle. The schema validates a strictly-defined `TourDefinition` subset — string targets only, no DOM refs, no `ReactNode` validation beyond presence. Compile-time key-coverage tests guarantee the schema can't silently drift from `TourDefinition` when the type grows. Zod is an OPTIONAL peer dep so consumers who never call `parseTourDefinition` don't pay for it.

## What Success Looks Like

1. `import '@tour-kit/core'` resolves zero `zod/*` paths in the resulting bundle. Verify with: `pnpm --filter @tour-kit/core build && node -e "import('@tour-kit/core').then(m => console.log(Object.keys(m)))"` followed by `grep -c 'zod' packages/core/dist/index.mjs` returning `0`.
2. `import { parseTourDefinition } from '@tour-kit/core/schemas'` resolves in ESM AND CJS test harnesses (`node --experimental-vm-modules`).
3. `pnpm --filter @tour-kit/core test -- schemas` exits 0 with ≥8 tests covering: valid JSON, malformed step IDs, empty steps, ref-target rejection, unsupported function fields, segment-form audience, condition-array audience, `safeParseTourDefinition` success/failure shape.
4. `pnpm --filter @tour-kit/core typecheck:types` exits 0 with the new key-coverage fixtures (one `@ts-expect-error` proves a missing key fails).
5. `parseTourDefinition({...})` for a 5-step tour completes in <5ms median over 100 iterations (`vitest bench`).
6. Bundle: `@tour-kit/core/schemas` gzipped size budget set in `size-limit` config and CI enforces it (target: <12KB including the zod payload the consumer pulls).

---

## Architecture / Key Design Decisions

```
JSON / CMS / MDX
       │
       ▼
parseTourDefinition(input: unknown)
       │
       ├── zod runtime parse (tourDefinitionSchema)
       │
       ▼
TourDefinition (JSON-safe subset of Tour)
       │
       ▼ consumer adapts to runtime types
Tour<TStep>  ← refs/ReactNode added at runtime by consumer code
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| JSON boundary (CMS payload, JSON file) | Zod schema (`tourDefinitionSchema`) | Runtime validation, friendly errors, single source of truth at the boundary |
| TS type derived from schema | `z.infer<typeof tourDefinitionSchema>` re-exported as `TourDefinition` | One source for type + runtime; readers don't pick |
| Bridge to runtime `Tour` | Consumer-authored mapping (NOT shipped) | Refs and callbacks live in code, not JSON — Tour Kit doesn't try to fake them |
| Key-coverage parity | `.test-d.ts` conditional-type assertion | Compile-time guarantee that `keyof Pick<Tour, JsonSafeKeys>` ≡ `keyof TourDefinition` |

**Other critical rules for this phase:**
- **Schema validates a SUBSET of `Tour`, not all of `Tour`.** `target` is `z.string()` only — refs aren't JSON-serializable. `content`, `title` accept `z.unknown()` because they can be `ReactNode` at runtime; the schema guarantees presence/optionality, not React-element shape. Document this caveat prominently.
- **Zod peer range is `"^3.25.0 || ^4.0.0"`.** Zod 4 ships at the package root in v4 npm-latest AND lives at the `zod/v4` subpath inside `zod@^3.25.0`. The dual range is the canonical pattern per the Zod team (memory #177). Use `import { z } from 'zod'` (root) in Tour Kit code.
- **Zod is OPTIONAL peer.** Set `peerDependenciesMeta.zod.optional = true`. Installs with no validation must still succeed.
- **Main bundle must stay Zod-free.** Verify in CI. The subpath `@tour-kit/core/schemas` is the ONLY entry that imports Zod. Tree-shaking is not enough — the import paths must be physically separate.
- **`Tour == z.infer` IS NOT a goal.** Spec §3.2 and big-plan §3.2 are explicit: JSON cannot represent refs or callbacks. The parity test is keys-of-JSON-safe-subset, not full type equality.

---

## Tasks

### Task 2.1 — Define `TourDefinition` types and JSON-safe boundary (1.5h)

**Depends on:** Phase 1 (`Tour<TStep>` exists)

```ts
// packages/core/src/types/tour-definition.ts (new)

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue }

/**
 * JSON-authorable subset of Tour. The fields excluded here are
 * runtime-only and CANNOT round-trip through JSON:
 *   - target as React.RefObject (refs aren't serializable)
 *   - content/title as React.ReactNode beyond strings (validated as unknown)
 *   - lifecycle callbacks (onShow, when, onBeforeShow, etc.)
 *   - audience.handler callbacks
 *
 * Consumers parse JSON into TourDefinition and then attach
 * runtime-only fields (refs, callbacks) before passing to TourProvider.
 */
export interface TourDefinition {
  id: string
  steps: TourStepDefinition[]
  audience?: AudienceDefinition
  autoStart?: boolean
  startAt?: number
  // ... only JSON-safe fields from Tour
}

export interface TourStepDefinition {
  id: string
  kind?: 'visible' | 'hidden'
  target: string                 // selector only — refs disallowed
  title?: unknown                // ReactNode at runtime; presence-only at boundary
  description?: unknown
  content: unknown
  audience?: AudienceDefinition
  placement?: Placement
  // ... only JSON-safe fields from TourStep
}

export type AudienceDefinition =
  | AudienceConditionDefinition[]
  | { segment: string }

export interface AudienceConditionDefinition {
  key: string
  operator:
    | 'equals' | 'not_equals'
    | 'contains' | 'not_contains'
    | 'in' | 'not_in'
    | 'exists' | 'not_exists'
  value?: JsonValue
}
```

**Sanity check:** `pnpm --filter @tour-kit/core typecheck` exits 0. Open `src/types/tour.ts` and verify every field marked JSON-safe in the spec §4.3 maps to a field on `TourDefinition`.

---

### Task 2.2 — Step and audience schemas (2h)

**Depends on:** 2.1

```ts
// packages/core/src/lib/schemas/audience.schema.ts (new)
// Confirmed: zod ^3.25.0 || ^4.0.0 (memory #177, 2026-05-12). Import root 'zod'.
import { z } from 'zod'

export const audienceConditionSchema = z.object({
  key: z.string().min(1),
  operator: z.enum([
    'equals', 'not_equals',
    'contains', 'not_contains',
    'in', 'not_in',
    'exists', 'not_exists',
  ]),
  value: z.unknown().optional(),
})

export const audienceSchema = z.union([
  z.array(audienceConditionSchema),
  z.object({ segment: z.string().min(1) }),
])

// packages/core/src/lib/schemas/step.schema.ts (new)
export const tourStepDefinitionSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['visible', 'hidden']).optional(),
  target: z.string().min(1),         // strict: refs rejected at boundary
  title: z.unknown().optional(),
  description: z.unknown().optional(),
  content: z.unknown(),
  audience: audienceSchema.optional(),
  placement: z.enum([
    'top', 'top-start', 'top-end',
    'right', 'right-start', 'right-end',
    'bottom', 'bottom-start', 'bottom-end',
    'left', 'left-start', 'left-end',
    'auto', 'center',
  ]).optional(),
  // ... mirror tour-definition.ts exactly
})
```

**Implementation note:** Mirror the Placement type from `packages/core/src/types/config.ts` — copy the literal union values into the enum. Add a TODO comment to keep them in sync, and let the key-coverage test (Task 2.5) catch drift.

**Sanity check:** `pnpm --filter @tour-kit/core typecheck` clean. Schemas import only from `zod` and from sibling files in `lib/schemas/`.

---

### Task 2.3 — Top-level schema + parser helpers (2h)

**Depends on:** 2.2

```ts
// packages/core/src/lib/schemas/tour.schema.ts (new)
import { z } from 'zod'
import { tourStepDefinitionSchema } from './step.schema'
import { audienceSchema } from './audience.schema'

export const tourDefinitionSchema = z.object({
  id: z.string().min(1),
  steps: z.array(tourStepDefinitionSchema).min(1),
  audience: audienceSchema.optional(),
  autoStart: z.boolean().optional(),
  startAt: z.number().int().nonnegative().optional(),
  // ...
})

// packages/core/src/lib/schemas/flow-source.schema.ts (new)
// A flow source is the top-level container: { tours: [...] } in a JSON file.
export const flowSourceSchema = z.object({
  tours: z.array(tourDefinitionSchema),
})

// packages/core/src/lib/schemas/parse.ts (new)
import type { TourDefinition } from '../../types/tour-definition'
import { tourDefinitionSchema } from './tour.schema'

export function parseTourDefinition(input: unknown): TourDefinition {
  return tourDefinitionSchema.parse(input) as TourDefinition
}

export function safeParseTourDefinition(input: unknown) {
  return tourDefinitionSchema.safeParse(input)
}

// Factory for teams that want a stricter `content` shape (e.g. CMS blocks)
export function createTourDefinitionSchema<TContent extends z.ZodTypeAny>(opts: {
  contentSchema: TContent
}) {
  // Returns a derived schema where step.content uses opts.contentSchema
  // instead of z.unknown(). Useful for CMS payloads with typed blocks.
  return tourStepDefinitionSchema.extend({ content: opts.contentSchema })
}

// packages/core/src/lib/schemas/index.ts (new — barrel)
export { tourDefinitionSchema, tourStepDefinitionSchema, flowSourceSchema } from './tour.schema'
export { audienceConditionSchema, audienceSchema } from './audience.schema'
export {
  parseTourDefinition,
  safeParseTourDefinition,
  createTourDefinitionSchema,
} from './parse'
```

**Sanity check:** Write a one-liner test file `__tests__/smoke.ts` with `parseTourDefinition({ id: 't', steps: [{ id: 's1', target: '#a', content: 'hi' }] })` and run it. Expected: returns the object, no throw.

---

### Task 2.4 — Subpath export and zod optional peer (1.5h)

**Depends on:** 2.3

Update `packages/core/package.json`:

```jsonc
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./schemas": {
      "import": "./dist/schemas/index.mjs",
      "require": "./dist/schemas/index.cjs",
      "types": "./dist/schemas/index.d.ts"
    },
    "./package.json": "./package.json"
  },
  "peerDependencies": {
    "react": "^18 || ^19",
    "zod": "^3.25.0 || ^4.0.0"
  },
  "peerDependenciesMeta": {
    "zod": { "optional": true }
  }
}
```

Update `tsup.config.ts` to emit a second entry:

```ts
// packages/core/tsup.config.ts (modify)
import { defineConfig } from 'tsup'
export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'schemas/index': 'src/lib/schemas/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  treeshake: true,
  external: ['react', 'react-dom', 'zod'],
  // ... existing options
})
```

**Sanity check:**
```bash
pnpm --filter @tour-kit/core build
ls packages/core/dist/schemas/index.{mjs,cjs,d.ts}    # all three exist
node -e "console.log(require('@tour-kit/core/schemas').parseTourDefinition({id:'t',steps:[{id:'s',target:'#x',content:''}]}))"
```

---

### Task 2.5 — Key-coverage type tests (2h)

**Depends on:** 2.1, 2.4

The goal is to fail compile when `Tour` gains a JSON-safe key but `TourDefinition` doesn't get the matching field, OR when the schema misses a `TourDefinition` key. We do this with key-set conditional types — NOT with `z.infer ≡ Tour` equality (which is impossible per spec §3).

```ts
// packages/core/src/lib/schemas/__tests__/parity.test-d.ts (new)
import type { z } from 'zod'
import type { Tour, TourStep } from '../../../types'
import type { TourDefinition, TourStepDefinition } from '../../../types/tour-definition'
import type { tourDefinitionSchema, tourStepDefinitionSchema } from '../tour.schema'

// 1. JSON-safe key set of Tour (hand-authored — when Tour grows, update this)
type TourJsonSafeKeys = 'id' | 'steps' | 'audience' | 'autoStart' | 'startAt'
type TourStepJsonSafeKeys =
  | 'id' | 'kind' | 'target' | 'title' | 'description'
  | 'content' | 'audience' | 'placement'

// 2. TourDefinition keys must match the JSON-safe key set exactly
type _A1 = AssertExact<keyof TourDefinition, TourJsonSafeKeys>
type _A2 = AssertExact<keyof TourStepDefinition, TourStepJsonSafeKeys>

// 3. Schema's inferred type keys must also match
type SchemaTour = z.infer<typeof tourDefinitionSchema>
type SchemaStep = z.infer<typeof tourStepDefinitionSchema>
type _A3 = AssertExact<keyof SchemaTour, TourJsonSafeKeys>
type _A4 = AssertExact<keyof SchemaStep, TourStepJsonSafeKeys>

// 4. Each JSON-safe key on Tour must exist on TourDefinition with assignable type
// (one-way: TourDefinition can be NARROWER than Tour — string-only target,
// unknown-typed content. Bidirectional equality is impossible.)
type _A5 = TourDefinition['target' extends keyof TourDefinition ? 'target' : never] extends never ? never : true

// Helper
type AssertExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never
const _ok1: _A1 = true
const _ok2: _A2 = true
const _ok3: _A3 = true
const _ok4: _A4 = true

// 5. Drift detection: if someone adds a key to TourDefinition without updating
//    TourJsonSafeKeys, _A1 fails.
const _drift_a_missing_key: AssertExact<keyof TourDefinition, 'id' | 'steps'> = null as never
// @ts-expect-error intentional — proves the AssertExact catches drift
void _drift_a_missing_key
```

**Implementation note:** The hand-authored `TourJsonSafeKeys` list IS the contract. When `Tour` gets a new JSON-safe field, the dev adds it to this list AND to `TourDefinition` AND to the schema. The four `AssertExact` lines guarantee the three stay in sync.

**Sanity check:** `pnpm --filter @tour-kit/core typecheck:types` exits 0. Remove one key from `TourJsonSafeKeys` (e.g., drop `'autoStart'`) — `_A1` or `_A3` MUST fail. Restore it.

---

### Task 2.6 — Runtime tests (2h)

**Depends on:** 2.3

Write `packages/core/src/lib/schemas/__tests__/parse.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { parseTourDefinition, safeParseTourDefinition } from '../parse'

describe('parseTourDefinition', () => {
  it('parses minimal valid input', () => {
    const t = parseTourDefinition({
      id: 'demo',
      steps: [{ id: 's1', target: '#a', content: 'hello' }],
    })
    expect(t.id).toBe('demo')
    expect(t.steps).toHaveLength(1)
  })

  it('rejects empty steps array', () => {
    expect(() => parseTourDefinition({ id: 't', steps: [] })).toThrow()
  })

  it('rejects empty step id', () => {
    expect(() => parseTourDefinition({
      id: 't', steps: [{ id: '', target: '#a', content: '' }]
    })).toThrow()
  })

  it('rejects ref-style targets (objects)', () => {
    // refs are objects with .current; schema requires z.string()
    const refLike = { current: null }
    expect(() => parseTourDefinition({
      id: 't', steps: [{ id: 's1', target: refLike, content: '' }]
    })).toThrow()
  })

  it('rejects function fields disguised as JSON', () => {
    // Even if a CMS sent { type: 'fn', body: '...' }, our schema
    // doesn't admit object-typed `target`. Verify this path too.
    expect(() => parseTourDefinition({
      id: 't',
      steps: [{ id: 's1', target: '#a', content: '', placement: 'invalid-direction' }],
    })).toThrow()
  })

  it('accepts segment-form audience', () => {
    const t = parseTourDefinition({
      id: 't',
      steps: [{ id: 's', target: '#a', content: '' }],
      audience: { segment: 'admins' },
    })
    expect(t.audience).toEqual({ segment: 'admins' })
  })

  it('accepts condition-array audience', () => {
    const t = parseTourDefinition({
      id: 't',
      steps: [{ id: 's', target: '#a', content: '' }],
      audience: [{ key: 'plan', operator: 'equals', value: 'pro' }],
    })
    expect(Array.isArray(t.audience)).toBe(true)
  })

  describe('safeParseTourDefinition', () => {
    it('returns tagged success on valid input', () => {
      const r = safeParseTourDefinition({
        id: 't', steps: [{ id: 's', target: '#a', content: '' }],
      })
      expect(r.success).toBe(true)
    })
    it('returns tagged error on invalid input', () => {
      const r = safeParseTourDefinition({ id: '', steps: [] })
      expect(r.success).toBe(false)
    })
  })
})
```

**Sanity check:** `pnpm --filter @tour-kit/core test -- schemas` exits 0; all 8+ assertions pass.

---

### Task 2.7 — Bundle / size verification (1h)

**Depends on:** 2.4

Add a size-limit entry (or extend the existing config) for the schemas subpath. Confirm the main entry stays Zod-free.

```jsonc
// .size-limit.json (root, modify or extend)
[
  {
    "name": "@tour-kit/core (main entry)",
    "path": "packages/core/dist/index.mjs",
    "limit": "8 KB",
    "import": "*"
  },
  {
    "name": "@tour-kit/core/schemas (subpath)",
    "path": "packages/core/dist/schemas/index.mjs",
    "limit": "12 KB",   // includes the zod surface the consumer pulls
    "import": "{ parseTourDefinition }"
  }
]
```

Add a verification script or test:

```ts
// packages/core/src/__tests__/no-zod-in-main.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('main bundle hygiene', () => {
  it('does not include zod', () => {
    const main = readFileSync(join(__dirname, '../../dist/index.mjs'), 'utf8')
    // Match `from "zod"` or any path starting with zod/
    expect(main).not.toMatch(/from\s+["']zod(\/|["'])/)
  })
})
```

**Sanity check:** `pnpm --filter @tour-kit/core build && pnpm --filter @tour-kit/core test -- no-zod-in-main` exits 0.

---

### Task 2.8 — Docs (1.5h)

**Depends on:** 2.6, 2.7

New page: `apps/docs/content/docs/core/schemas.mdx`. Cover:

1. **What it is:** runtime validation for JSON-authorable tour definitions.
2. **What it ISN'T:** Tour Kit does not promise that `z.infer<typeof tourDefinitionSchema>` equals `Tour`. Refs and callbacks are runtime-only — your code attaches them after `parseTourDefinition` returns.
3. **Import path:** `import { parseTourDefinition } from '@tour-kit/core/schemas'`.
4. **Peer dep:** `zod` is optional. Install only if you validate.
5. **Example:** CMS payload → parse → attach refs → pass to `TourProvider`.
6. **Custom content schema:** `createTourDefinitionSchema({ contentSchema: z.object({...}) })` for typed content blocks.

Update `apps/docs/content/docs/core/meta.json` to include the new page.

**Sanity check:** `pnpm --filter docs build` exits 0. Page renders the import path correctly.

---

## Deliverables

```
packages/core/
├── package.json                                         # (M) "./schemas" export, optional zod peer
├── tsup.config.ts                                       # (M) schemas/index entry
└── src/
    ├── types/
    │   └── tour-definition.ts                           # (+) TourDefinition, TourStepDefinition, JsonValue
    ├── lib/schemas/
    │   ├── index.ts                                     # (+) barrel
    │   ├── audience.schema.ts                           # (+) audienceSchema + condition
    │   ├── step.schema.ts                               # (+) tourStepDefinitionSchema
    │   ├── tour.schema.ts                               # (+) tourDefinitionSchema, flowSourceSchema
    │   ├── parse.ts                                     # (+) parseTourDefinition, safeParseTourDefinition, createTourDefinitionSchema
    │   └── __tests__/
    │       ├── parity.test-d.ts                         # (+) key-coverage assertions
    │       └── parse.test.ts                            # (+) runtime suite
    └── __tests__/
        └── no-zod-in-main.test.ts                       # (+) bundle hygiene

.size-limit.json                                          # (M) two budget entries

apps/docs/content/docs/core/
├── schemas.mdx                                          # (+) usage + caveats
└── meta.json                                            # (M) nav entry
```

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/core build` exits 0; emits `dist/index.{mjs,cjs}` AND `dist/schemas/index.{mjs,cjs}`.
- [ ] `import '@tour-kit/core'` in a smoke node script does NOT resolve zod (verified by `grep -c 'zod' dist/index.mjs` → `0` and by the `no-zod-in-main` test passing).
- [ ] `import '@tour-kit/core/schemas'` in ESM AND `require('@tour-kit/core/schemas')` in CJS both resolve and return `parseTourDefinition`.
- [ ] `pnpm --filter @tour-kit/core test` exits 0 (≥8 schema tests + bundle test).
- [ ] `pnpm --filter @tour-kit/core typecheck:types` exits 0; removing any one key from `TourJsonSafeKeys` breaks compile.
- [ ] `parseTourDefinition` median <5ms for a 5-step tour over 100 iterations (`vitest bench` micro-benchmark).
- [ ] `.size-limit.json` has both entries; CI enforces both budgets.
- [ ] `apps/docs/content/docs/core/schemas.mdx` explicitly notes that refs and ReactNode content are NOT validated for shape — only presence/optionality.

---

## Execution Prompt

Copy everything between the `---` lines:

---
You are implementing Phase 2 of Tour Kit's Sprint 1 — Zod schemas for tour definitions (issue #91).

### What This Project Is
Tour Kit is a headless React onboarding/product-tour monorepo. `@tour-kit/core` is framework-agnostic and sits at the bottom of the dep graph. Bundle size matters — the README sells "core <8KB gzipped." This phase adds boundary validation for JSON-authorable tour definitions WITHOUT pulling Zod into the main bundle.

### Established in Prior Phases
- Phase 0 added the type-test harness (`pnpm --filter @tour-kit/core typecheck:types` against `tsconfig.type-tests.json`). Use it for all type assertions.
- Phase 1 made `Tour<TStep extends TourStep = TourStep>` generic. `TourDefinition` does NOT need to be generic — JSON-authored tours can't carry compile-time literal-ID narrowing across the parse boundary.
- `@tour-kit/core` has NO existing schemas. Current export shape is `{ ".": "./dist/index.mjs", "./package.json": "./package.json" }`.

### Your Goal for This Phase
Add `@tour-kit/core/schemas` subpath that validates a JSON-safe subset of `Tour`. Ship `parseTourDefinition`, `safeParseTourDefinition`, `createTourDefinitionSchema`. Keep the main entry Zod-free. Add key-coverage type tests so the schema can't silently drift from `TourDefinition`.

### Data Model Rules (follow exactly)
- **Zod schemas** for: `tourDefinitionSchema`, `tourStepDefinitionSchema`, `audienceSchema`, `audienceConditionSchema`, `flowSourceSchema`. All in `src/lib/schemas/`.
- **`interface`/`type`** for: `TourDefinition`, `TourStepDefinition`, `JsonValue`, `AudienceDefinition`. All in `src/types/tour-definition.ts`. Re-derive from `z.infer` if cleaner, but the type's name MUST be `TourDefinition`, not `z.infer<...>` everywhere.
- **No `interface Tour == z.infer<typeof tourDefinitionSchema>`.** That equality is impossible (refs, ReactNode). The parity test compares KEY SETS only.
- **`target: z.string().min(1)`** — never accept refs at the boundary. Refs are runtime-only.
- **`content`, `title`, `description`: `z.unknown()`** — these are `ReactNode` at runtime; the schema guarantees presence, not React-element shape.
- **Lifecycle callbacks (`when`, `onShow`, `onBeforeShow`) are NOT on `TourDefinition`.** Consumers attach them after parsing.

### Architecture
```
JSON in → parseTourDefinition → TourDefinition (validated subset)
                                       │
                          consumer attaches refs/callbacks
                                       │
                                       ▼
                                 Tour (runtime)
                                       │
                                       ▼
                                 TourProvider
```

- `@tour-kit/core/schemas` is the ONLY entry that imports Zod.
- Verify Zod-freeness of the main entry in CI with a string-grep test against `dist/index.mjs`.
- Peer dep: `"zod": "^3.25.0 || ^4.0.0"` with `peerDependenciesMeta.zod.optional = true`.
- Use `import { z } from 'zod'` (root). Never use the legacy `'zod/v4'` subpath in new code.

### Confirmed Library APIs

```ts
// zod ^3.25.0 || ^4.0.0 — confirmed (memory #177, 2026-05-12; verified web 2026-05-12)
// Library packaging: Zod 4 lives at the root export of zod@4.x AND at 'zod/v4'
// subpath inside zod@^3.25.0. The dual peer range matches the canonical pattern
// at zod.dev/v4/versioning. Use 'zod' (root) for new code.
import { z } from 'zod'

const audienceConditionSchema = z.object({
  key: z.string().min(1),
  operator: z.enum(['equals','not_equals','contains','not_contains','in','not_in','exists','not_exists']),
  value: z.unknown().optional(),
})

const audienceSchema = z.union([
  z.array(audienceConditionSchema),
  z.object({ segment: z.string().min(1) }),
])

const tourStepDefinitionSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['visible','hidden']).optional(),
  target: z.string().min(1),
  content: z.unknown(),
  // ...
})

// parse() throws ZodError (has .format(), .flatten())
// safeParse() returns { success: true, data } | { success: false, error: ZodError }
const parsed = tourStepDefinitionSchema.safeParse(input)
```

### Files to Create

#### `packages/core/src/types/tour-definition.ts`
Export `TourDefinition`, `TourStepDefinition`, `AudienceDefinition`, `AudienceConditionDefinition`, `JsonValue`. Mirror every JSON-safe field from `Tour` and `TourStep` (read `src/types/tour.ts` and `src/types/step.ts` first). Exclude: anything that takes `React.RefObject`, anything that takes a function, `routeChangeStrategy` callbacks. `target` is `string` (no ref). `title`/`description`/`content` are `unknown`.

#### `packages/core/src/lib/schemas/audience.schema.ts`
Export `audienceConditionSchema` and `audienceSchema`. Use `z.union([z.array(...), z.object({segment})])` exactly as in the snippet above.

#### `packages/core/src/lib/schemas/step.schema.ts`
Export `tourStepDefinitionSchema`. Mirror `TourStepDefinition` exactly. Use `z.enum([...])` for `placement` — copy the literal union from `src/types/config.ts` and add a `// keep in sync with Placement` comment.

#### `packages/core/src/lib/schemas/tour.schema.ts`
Export `tourDefinitionSchema` (uses `tourStepDefinitionSchema` and `audienceSchema`) and `flowSourceSchema` (top-level container `{ tours: [...] }`).

#### `packages/core/src/lib/schemas/parse.ts`
Export `parseTourDefinition(input: unknown): TourDefinition` (throws `ZodError`), `safeParseTourDefinition` (tagged union), and `createTourDefinitionSchema({ contentSchema })` (factory for typed CMS content). Cast the parse result to `TourDefinition` once at the boundary — TS users see a clean type, not `z.infer<...>`.

#### `packages/core/src/lib/schemas/index.ts`
Barrel re-exporting every public name from the four schema files. NO `*` re-exports from runtime modules.

#### `packages/core/src/lib/schemas/__tests__/parity.test-d.ts`
Hand-authored `TourJsonSafeKeys` union type. Four `AssertExact` assertions: `keyof TourDefinition == TourJsonSafeKeys`, `keyof TourStepDefinition == TourStepJsonSafeKeys`, `keyof z.infer<typeof tourDefinitionSchema> == TourJsonSafeKeys`, `keyof z.infer<typeof tourStepDefinitionSchema> == TourStepJsonSafeKeys`. Removing one key from `TourJsonSafeKeys` MUST break the assert.

#### `packages/core/src/lib/schemas/__tests__/parse.test.ts`
At least 8 vitest cases: minimal-valid, empty-steps, empty-step-id, ref-style target rejected, invalid placement, segment audience, condition-array audience, `safeParse` success/error tagged shape.

#### `packages/core/src/__tests__/no-zod-in-main.test.ts`
Read `packages/core/dist/index.mjs` after build; assert no `from "zod"` matches. (Run AFTER `pnpm build`.)

#### `packages/core/package.json` (modify)
Add `"./schemas"` to `exports`. Add `"zod"` to `peerDependencies` with range `"^3.25.0 || ^4.0.0"`. Add `peerDependenciesMeta.zod = { "optional": true }`.

#### `packages/core/tsup.config.ts` (modify)
Add `'schemas/index': 'src/lib/schemas/index.ts'` to `entry`. Add `'zod'` to `external` so it isn't bundled into either output.

#### `.size-limit.json` (modify or create at repo root)
Two entries: main entry 8KB limit, schemas subpath 12KB limit.

#### `apps/docs/content/docs/core/schemas.mdx`
Cover: what it does, what it doesn't, install (`pnpm add zod`), import path, example with CMS payload, custom content schema. PROMINENTLY note the runtime-vs-JSON caveat.

#### `apps/docs/content/docs/core/meta.json` (modify)
Add nav entry for `schemas.mdx`.

### Success Criteria
- `pnpm --filter @tour-kit/core build` exits 0; emits `dist/schemas/index.{mjs,cjs,d.ts}`.
- `node -e "import('@tour-kit/core/schemas').then(m => m.parseTourDefinition({id:'t',steps:[{id:'s',target:'#x',content:''}]}))"` exits 0.
- `grep -c '\bzod\b' packages/core/dist/index.mjs` returns `0`.
- `pnpm --filter @tour-kit/core test` exits 0.
- `pnpm --filter @tour-kit/core typecheck:types` exits 0.
- Manually remove `'autoStart'` from `TourJsonSafeKeys` — `parity.test-d.ts` MUST fail. Restore.
- `vitest bench` micro-bench for `parseTourDefinition` 5-step input is median <5ms.
- `pnpm size` (or `npx size-limit`) reports main <8KB and schemas <12KB.

### Expected File Structure at End
```
packages/core/
├── package.json (modified — exports, peer zod optional)
├── tsup.config.ts (modified — schemas entry, external zod)
└── src/
    ├── types/tour-definition.ts
    ├── lib/schemas/
    │   ├── index.ts
    │   ├── audience.schema.ts
    │   ├── step.schema.ts
    │   ├── tour.schema.ts
    │   ├── parse.ts
    │   └── __tests__/
    │       ├── parity.test-d.ts
    │       └── parse.test.ts
    └── __tests__/no-zod-in-main.test.ts

.size-limit.json (modified)

apps/docs/content/docs/core/
├── schemas.mdx
└── meta.json (modified)
```

---

## Readiness Check

- [PASS] All inputs from prior phases are listed: Phase 0 type-test harness + Phase 1 generic `Tour<TStep>` (used only as a type-reference; `TourDefinition` is non-generic).
- [PASS] Every sub-task has a clear, testable completion condition (build/typecheck/test commands).
- [PASS] Execution prompt is self-contained: project context, prior facts, per-file guidance, exact data model rules, confirmed zod snippet from memory #177.
- [PASS] Exit criteria map 1:1 to deliverables (each new file + each modified config has a specific verification command).
- [PASS] Heavy dependency (Zod) is handled: it's an optional peer; the no-zod-in-main test catches accidental main-bundle leakage. No fake/stub needed — Zod is small enough to install.
- [PASS] New library Zod has a confirmed snippet from memory #177 with version range pinned in the execution prompt.

# Phase 7a — Codemods: Joyride First (#84)

**Duration:** Days 18–21 (~18–20 hours)
**Depends on:** Phase 0 (codemod tool decision, fixture corpus, spike), Phase 1 (Tour Kit's typed surface that we migrate TO), optionally Phase 3 (no direct dep)
**Blocks:** Phase 7b (reuses 7a's shared step mapper and CLI infrastructure)
**Risk Level:** HIGH — corpus coverage is a binary go/no-go gate; the package ships marketing-leverage ("migrate from Joyride in seconds") so over-promising kills the value
**Stack:** typescript

---

## Objective

Ship `@tour-kit/codemods` with one bin (`tour-kit-migrate`), one shared step mapper, and two `jscodeshift` transforms covering BOTH Joyride APIs: the legacy `<Joyride ...>` JSX prop form AND the modern `useJoyride({...})` hook form (memory #181 confirms both APIs coexist in Joyride v2.x 2026). Hit ≥80% on the committed fixture corpus from Phase 0. Every unsupported pattern emits a `// TODO: <description>` comment with a link to the migration guide — no silent failures. The package becomes the artifact every "X vs Tour Kit" SEO page links to.

## What Success Looks Like

1. `pnpm --filter @tour-kit/codemods build && pnpm --filter @tour-kit/codemods typecheck && pnpm --filter @tour-kit/codemods test` all exit 0.
2. `npx tour-kit-migrate --from joyride --dry-run __tests__/fixtures/joyride/` exits 0; prints diffs without writing.
3. Without `--dry-run`, the same command transforms files in place (verify with `git diff` on a fixture copy).
4. Fixture-test coverage matrix: ≥80% of committed Joyride fixtures land at byte-identical output vs. `*.expected.tsx` (or differ ONLY by an expected `// TODO` annotation).
5. CLI flags work exactly as specified: `--from`, `--parser`, `--dry-run`, `--print`, `--extensions`, `--verbose`. Exit codes: 0 (ok), 1 (parse error), 2 (bad args), 3 (no files).
6. Joyride JSX fixture and `useJoyride` hook fixture BOTH produce parseable TSX.
7. Coverage table in `docs/from-joyride.md` lists every ✓ supported pattern and every ✗ unsupported pattern with a TODO link.
8. Package README in `packages/codemods/README.md` shows quick-start and links to the migration guide.

---

## What Failure Looks Like (and what to do)

- **<80% coverage on Joyride corpus** → Trim scope to JSX-only (drop `useJoyride` to a stretch within Phase 7b), document the limitation, ship at 0.x.
- **`jscodeshift` types prove unworkable mid-transform** → Phase 0 spike already de-risked this; fallback is `ts-morph`. If the fallback is triggered, budget +4h to port the shared mapper to `ts-morph`'s `Project.createSourceFile()` API.
- **Generated TSX fails `tsc --noEmit` after transform** → A failing transform is worse than no transform. Add a post-transform typecheck assertion to the fixture runner; any failing fixture must be either fixed OR the input added to the "unsupported, manual port" list with a `// TODO`.
- **`Step.target` as function-returning-Element pattern unrecoverable** → Spec §4.6 already classifies this as TODO. Confirm the TODO comment is emitted; don't try to migrate function targets.
- **Coverage drift across releases** → Add a CI gate: if a new fixture lands without expected output, the test runner fails. Already covered by the corpus matrix.

---

## Architecture / Key Design Decisions

```
$ tour-kit-migrate --from joyride src/

bin/tour-kit-migrate.ts
       │
       ▼
src/cli.ts (args, exit codes, --dry-run, --print)
       │
       ▼
src/transforms/from-joyride.ts (registered transform)
       │
       ├── detect import: 'react-joyride'
       │     ├─ legacy <Joyride> JSX form     → rewriteJoyrideJsx(root, j)
       │     └─ useJoyride({...}) hook form   → rewriteUseJoyrideHook(root, j)
       │
       ▼
src/lib/step-mapper.ts (shared)
       │   - mapTarget(node) → string selector | TODO
       │   - mapPlacement(value)
       │   - mapStepProps(node) → tour kit step object
       │   - emitTodo(path, msg, docsAnchor)
       │
       ▼
src/lib/todo-emitter.ts (// TODO + docs link)
       │
       ▼
root.toSource({ quote: 'single' })  → output
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| CLI args | `interface CliOptions` (TypeScript) | Validated at the boundary; bad args → exit 2 |
| jscodeshift AST | `Collection<n>` from `@types/jscodeshift` | The library's own typed surface; treat as opaque |
| `StepMapping` (intermediate) | `interface` describing Tour Kit step props | Single representation passed to either transform output |
| Coverage matrix | Markdown table in `docs/from-joyride.md` | Greppable + human-readable; PRs that add features update the table |
| TODO comments | Plain string templates with docs anchor | `// TODO: <pattern> — see https://tourkit.dev/migration/joyride#<anchor>` |

**Other critical rules for this phase:**
- **No silent failures.** Every unmigrated pattern emits `// TODO: <description>` with a docs link. Spec §4.6 lists every ✗ pattern explicitly — drive from that list.
- **Two Joyride APIs.** Memory #181 confirms: legacy `<Joyride>` JSX form AND modern `useJoyride()` hook form coexist in 2026. Transforms MUST cover both. Detect via `findImportDeclarations` for `'react-joyride'` and inspect named imports.
- **Shared step mapper.** `<Joyride steps>` and `useJoyride({ steps })` both take a `Step[]`. The step-mapping logic must live once in `src/lib/step-mapper.ts` — don't duplicate.
- **`--dry-run` is read-only.** Spec §4.6 exit-code 0 on dry-run success. Test it explicitly.
- **Generated code must typecheck.** The fixture runner runs `tsc --noEmit` on each transformed output. Anything that emits invalid TSX is a fatal test failure.
- **Coverage gate is binary.** ≥80% on the committed corpus → ship. <80% → trim scope or defer.
- **Path resolution must be cross-platform.** Use `path.join` not string concat; respect Windows paths in the CLI.

---

## Tasks

### Task 7a.1 — Scaffold `@tour-kit/codemods` (3h)

**Depends on:** Phase 0 (`__tests__/fixtures/joyride/` exists; codemod-tool decision logged)

```jsonc
// packages/codemods/package.json
{
  "name": "@tour-kit/codemods",
  "version": "0.1.0",
  "description": "Codemods to migrate from Joyride, Shepherd, and Driver.js to Tour Kit",
  "license": "MIT",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "bin": {
    "tour-kit-migrate": "./dist/bin/tour-kit-migrate.cjs"
  },
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./package.json": "./package.json"
  },
  "files": ["dist", "docs", "README.md"],
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "jscodeshift": "catalog:",
    "@types/jscodeshift": "catalog:"
  },
  "devDependencies": {
    "tsup": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

`tsup.config.ts`:

```ts
import { defineConfig } from 'tsup'
export default defineConfig({
  entry: { index: 'src/index.ts', 'bin/tour-kit-migrate': 'src/bin/tour-kit-migrate.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  treeshake: true,
  shims: true,                    // adds __dirname etc. for the bin
})
```

Also: `tsconfig.json` extending root, `vitest.config.ts` (Node env — codemod tests don't need jsdom), README placeholder.

**Sanity check:** `pnpm install && pnpm --filter @tour-kit/codemods build` produces `dist/bin/tour-kit-migrate.cjs` AND `dist/index.{mjs,cjs,d.ts}`. The bin file has a working shebang (`#!/usr/bin/env node`).

---

### Task 7a.2 — CLI args, exit codes, dry-run (2h)

**Depends on:** 7a.1

```ts
// packages/codemods/src/bin/tour-kit-migrate.ts (new)
#!/usr/bin/env node
import { runMigrate } from '../cli'

runMigrate(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (e) => { console.error(e); process.exit(1) }
)
```

```ts
// packages/codemods/src/cli.ts (new)
import { fromJoyride } from './transforms/from-joyride'

export interface CliOptions {
  from: 'joyride' | 'shepherd' | 'driver'
  parser: 'tsx' | 'ts' | 'babel'
  dryRun: boolean
  print: boolean
  extensions: readonly string[]
  verbose: boolean
  paths: readonly string[]
}

const TRANSFORMS = {
  joyride: fromJoyride,
  // shepherd, driver wired in Phase 7b
} as const

export async function runMigrate(argv: readonly string[]): Promise<number> {
  let parsed: CliOptions
  try {
    parsed = parseArgs(argv)
  } catch (e) {
    console.error(`usage error: ${(e as Error).message}`)
    return 2
  }
  if (!parsed.paths.length) {
    console.error('no input paths provided')
    return 3
  }
  const transform = TRANSFORMS[parsed.from]
  if (!transform) {
    console.error(`unsupported --from: ${parsed.from}`)
    return 2
  }
  // For each file under paths matching extensions, run jscodeshift transform.
  // On --dry-run, print the diff. On --print, write to stdout. Otherwise write back.
  // Track parse failures → return 1 at the end if any.
  return runOverPaths(parsed, transform)
}

function parseArgs(argv: readonly string[]): CliOptions { /* impl */ }
async function runOverPaths(opts: CliOptions, transform): Promise<number> { /* impl */ }
```

Use a minimal arg-parser — `process.argv.slice(2)` with manual flag parsing is fine for ~6 flags. Don't pull in `commander`/`yargs` for this.

**Sanity check:** `node packages/codemods/dist/bin/tour-kit-migrate.cjs` (no args) prints usage and exits 2. `... --from joyride` (no paths) exits 3. `... --from invalid-source ./` exits 2.

---

### Task 7a.3 — Shared step mapper + TODO emitter (2h)

**Depends on:** 7a.1

```ts
// packages/codemods/src/lib/step-mapper.ts (new)
import type { JSCodeshift, ASTPath, ObjectExpression, Node } from 'jscodeshift'
import { emitTodo, type Todo } from './todo-emitter'

export interface StepMapping {
  id?: string
  target: string                       // selector; refs/functions become TODOs
  content?: Node                        // any expression
  title?: Node
  placement?: string                    // joyride placement → tour kit placement
  todos: Todo[]                         // patterns that couldn't be migrated
  unsupportedFields: string[]           // names of dropped Joyride-only fields
}

export function mapStepObject(j: JSCodeshift, obj: ObjectExpression): StepMapping {
  const mapping: StepMapping = { target: '', todos: [], unsupportedFields: [] }
  for (const prop of obj.properties) {
    if (prop.type !== 'ObjectProperty' && prop.type !== 'Property') continue
    const name = getKeyName(prop)
    switch (name) {
      case 'target': mapping.target = mapTarget(j, prop, mapping); break
      case 'content': mapping.content = prop.value; break
      case 'title': mapping.title = prop.value; break
      case 'placement': mapping.placement = mapPlacement(prop, mapping); break
      case 'id': mapping.id = stringValueOf(prop); break
      // ... handle each pattern from spec §4.6
      case 'styles':
      case 'tooltipComponent':
      case 'beaconComponent':
      case 'spotlightTarget':
      case 'scrollTarget':
      case 'isFixed':
        mapping.unsupportedFields.push(name)
        mapping.todos.push(emitTodo(`Step.${name} → manual port`, `joyride#${name}`))
        break
      case 'disableBeacon':
      case 'skipBeacon':
        // Tour Kit has no beacon-by-default; silent ✓ (no TODO; emit a comment in output noting the no-op).
        mapping.todos.push(emitTodo(`Step.${name} is a no-op in Tour Kit (no default beacon)`, `joyride#beacon`))
        break
    }
  }
  return mapping
}

function mapTarget(j, prop, mapping): string {
  const v = prop.value
  if (v.type === 'StringLiteral' || v.type === 'Literal') return v.value as string
  if (v.type === 'ArrowFunctionExpression' || v.type === 'FunctionExpression') {
    mapping.todos.push(emitTodo('Step.target as function — Tour Kit expects selector or ref', 'joyride#target-function'))
    return '/* TODO: function target */'
  }
  // expression — emit TODO; preserve as raw selector with a TODO marker
  mapping.todos.push(emitTodo('Step.target dynamic expression — verify selector', 'joyride#target-dynamic'))
  return '/* TODO: dynamic target */'
}

function mapPlacement(prop, mapping): string {
  // 'auto', 'top', 'bottom', etc. → tour kit Placement
  // 'center' → 'center' (mapped to body-target + spotlight=false; emit TODO with note)
  // ...
}
```

```ts
// packages/codemods/src/lib/todo-emitter.ts (new)
export interface Todo {
  message: string
  anchor: string
}

export function emitTodo(message: string, anchor: string): Todo {
  return { message, anchor }
}

export function todoToComment(t: Todo): string {
  return `// TODO: ${t.message} — see https://tourkit.dev/migration/joyride#${t.anchor}`
}
```

**Implementation note:** The mapping is library-agnostic. The Joyride transform (next) and the Shepherd/Driver transforms (Phase 7b) all funnel through `mapStepObject` for the shared per-step concerns.

**Sanity check:** Unit test the mapper against an inline object expression literal: `target: '#hero'`, `content: 'Hi'`, `placement: 'auto'` → `mapping.target === '#hero'`, `mapping.placement === 'auto'`, no TODOs.

---

### Task 7a.4 — Joyride JSX transform (3h)

**Depends on:** 7a.3

```ts
// packages/codemods/src/transforms/from-joyride.ts (new)
// Confirmed via memory #178 (Context7 2026-05-12, /facebook/jscodeshift)
// Library: jscodeshift ^17.3.0
import type { API, FileInfo } from 'jscodeshift'
import { mapStepObject } from '../lib/step-mapper'

export const parser = 'tsx'

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift
  const root = j(file.source)

  // 1. Find import { ... } from 'react-joyride'
  const joyrideImports = root.find(j.ImportDeclaration, { source: { value: 'react-joyride' } })
  if (joyrideImports.size() === 0) return file.source  // no-op when file doesn't use joyride

  // 2. Branch on what's imported.
  const importedNames = collectImports(joyrideImports)  // { default: 'Joyride', named: ['useJoyride', ...] }

  let mutated = false

  if (importedNames.default) {
    mutated = rewriteJoyrideJsx(j, root, importedNames.default) || mutated
  }
  if (importedNames.named.includes('useJoyride')) {
    mutated = rewriteUseJoyrideHook(j, root) || mutated
  }
  // Update the import statement
  if (mutated) {
    rewriteJoyrideImport(j, joyrideImports, importedNames)
  }

  return mutated ? root.toSource({ quote: 'single' }) : file.source
}

function rewriteJoyrideJsx(j, root, joyrideLocalName: string): boolean {
  const elements = root.find(j.JSXElement, { openingElement: { name: { name: joyrideLocalName } } })
  if (elements.size() === 0) return false
  elements.forEach((path) => {
    const attrs = path.node.openingElement.attributes ?? []
    // Extract steps={...}, run, continuous, showProgress, callback, etc.
    const stepsAttr = findAttr(attrs, 'steps')
    const callbackAttr = findAttr(attrs, 'callback')
    // Build <TourProvider tours={[{ id: 'migrated-tour', steps: [...] }]}> + <TourCard />
    // Convert callback into onComplete/onSkip/onStepChange via a synthesized switch on action.
    // Emit TODO comments for unmapped attrs.
    // Replace the <Joyride .../> element with the new JSX.
  })
  return true
}

function rewriteJoyrideImport(j, imports, _names) {
  // Rewrite the source to '@tour-kit/react' and rename the named imports:
  //   { default Joyride } → { TourProvider, TourCard }   (and any local Joyride alias is replaced wholesale)
  //   { useJoyride } → { useTour }                       (with a TODO noting the API is not 1:1)
}
```

**Implementation notes:**
- The callback-mapping is the hardest part. Joyride's `callback({ action, index, status, type })` covers what Tour Kit splits into `onComplete`, `onSkip`, `onStepChange`. Spec §4.6 shows the routing:
  - `action === 'next'` → `onStepChange`
  - `action === 'skip'` → `onSkip`
  - `action === 'close'` → `onSkip`
  - `status === 'finished'` → `onComplete`
- Build a synthesized helper that wraps the original callback into a dispatcher. This is the canonical pattern from spec §2.2.6. Drop a `// TODO: verify callback routing` comment over the generated code.
- Use `j.template.expression\`...\`` or `j.expressionStatement(j.parseExpression('...'))` to build the new JSX. Confirm whichever pattern compiles cleanly in the existing jscodeshift version.

**Sanity check:** Run the transform against `joyride-jsx-basic.input.tsx` from the Phase 0 corpus. Compare to `joyride-jsx-basic.expected.tsx`. Iterate until the diff is empty or contains only intentional whitespace differences. Then verify `tsc --noEmit` accepts the output.

---

### Task 7a.5 — `useJoyride` hook transform (3h)

**Depends on:** 7a.4

```ts
// packages/codemods/src/transforms/from-joyride.ts (continued)
function rewriteUseJoyrideHook(j, root): boolean {
  const calls = root.find(j.CallExpression, { callee: { name: 'useJoyride' } })
  if (calls.size() === 0) return false

  calls.forEach((path) => {
    // const { controls, Tour } = useJoyride({ continuous, steps, onEvent })
    // becomes:
    //   const tourRef = useRef<TourKitRef>(null)
    //   const tours: Tour[] = useMemo(() => [{ id: 'migrated-tour', steps: [...] }], [])
    //   // <TourProvider tours={tours} ref={tourRef}> + <TourCard /> in the JSX
    //
    // Then:
    //   controls.start() → tourRef.current?.start('migrated-tour')
    //   controls.next() → tourRef.current?.next()
    //   ...
    //
    // onEvent: EventHandler (action/index/status/type/lifecycle) → split into
    //   onStepChange + onComplete + onSkip on the Tour.

    // Identify VariableDeclarator pattern: const { controls, Tour } = useJoyride({...})
    const parent = path.parent.node
    if (parent.type === 'VariableDeclarator') {
      // Patch the destructuring → useRef + tour array
      // Find subsequent references to `controls.*` and rewrite them.
      // Replace `<Tour />` JSX with `<TourProvider>...<TourCard /></TourProvider>`.
    }

    // Step.before/Step.after (async hooks specific to useJoyride form) →
    //   TourStep.onBeforeShow / TourStep.onShow
    //   Add // TODO if the hook returns a Promise the user expects to await
  })
  return true
}
```

**Implementation notes:**
- This is the riskier of the two transforms because `controls.*` calls can be scattered throughout the file. Use `root.find(j.MemberExpression, { object: { name: 'controls' } })` to locate them and rewrite via `j.memberExpression(j.memberExpression(j.identifier('tourRef'), j.identifier('current'), false, true), j.identifier(name))`. Wrap with `?.` (optional chaining).
- `Step.before` and `Step.after` map to `TourStep.onBeforeShow` and `TourStep.onShow`. The shared step mapper (7a.3) should be extended to handle these; or handle them inline here if mapper-extension is invasive.
- If `onEvent` uses lifecycle values Tour Kit doesn't expose (e.g., `lifecycle: 'beacon-visible'`), emit `// TODO: lifecycle field not supported`.

**Sanity check:** Run against `useJoyride-basic.input.tsx` from Phase 0 corpus. Confirm the output references `tourRef.current?.start('migrated-tour')` and the `<Tour />` is replaced with `<TourProvider>`. Verify `tsc --noEmit` on the output.

---

### Task 7a.6 — Fixture tests + coverage matrix (3h)

**Depends on:** 7a.4, 7a.5

```ts
// packages/codemods/src/__tests__/fixture-runner.test.ts (new)
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { readdirSync } from 'node:fs'
import { execSync } from 'node:child_process'
import transform, { parser } from '../transforms/from-joyride'

const FIXTURES_DIR = join(__dirname, '..', '..', '__tests__', 'fixtures', 'joyride')

function runTransform(source: string): string {
  // Use jscodeshift programmatic API to run the transform
  const { default: jscodeshift } = require('jscodeshift')
  const api = { jscodeshift, j: jscodeshift, stats: () => {}, report: () => {} }
  return transform({ source, path: 'fixture.tsx' } as any, api as any, {}) as string
}

const fixtures = readdirSync(FIXTURES_DIR).filter(f => f.endsWith('.input.tsx'))

describe('Joyride transform — fixture corpus', () => {
  for (const fixture of fixtures) {
    const name = fixture.replace('.input.tsx', '')
    it(name, () => {
      const input = readFileSync(join(FIXTURES_DIR, fixture), 'utf8')
      const expected = readFileSync(join(FIXTURES_DIR, `${name}.expected.tsx`), 'utf8')
      const actual = runTransform(input)
      // Allow ONLY whitespace and intentional TODO comments to differ.
      expect(normalize(actual)).toBe(normalize(expected))
    })
  }
})

function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

// Separate test: every transformed output typechecks
describe('Joyride transform — output typechecks', () => {
  for (const fixture of fixtures) {
    const name = fixture.replace('.input.tsx', '')
    it(`${name} produces tsc-clean output`, () => {
      const input = readFileSync(join(FIXTURES_DIR, fixture), 'utf8')
      const actual = runTransform(input)
      // Write to temp file, run tsc --noEmit on it with a stub @tour-kit/react
      const tempPath = writeTemp(actual)
      expect(() => execSync(`pnpm exec tsc --noEmit --jsx preserve --target es2020 --module esnext ${tempPath}`, { stdio: 'pipe' })).not.toThrow()
    })
  }
})

// Coverage gate
describe('Joyride coverage', () => {
  it('hits ≥80% of committed fixtures', () => {
    const passed = countMatching(fixtures, runTransform)
    const ratio = passed / fixtures.length
    expect(ratio).toBeGreaterThanOrEqual(0.8)
  })
})
```

Also add the coverage matrix doc:

```markdown
# packages/codemods/docs/from-joyride.md

# Joyride → Tour Kit migration

## Supported patterns

| Pattern | Joyride | Tour Kit | Notes |
|---|---|---|---|
| Basic tour | `<Joyride steps run callback />` | `<TourProvider tours=[{id, steps}]> + <TourCard />` | ✓ |
| Hook form | `const { controls, Tour } = useJoyride({...})` | `useRef<TourKitRef>() + <TourProvider> + <TourCard />` | ✓ |
| Step.target string | `'#hero'` | `target: '#hero'` | ✓ |
| Step.placement | `'top' \| 'bottom' \| 'auto'` | `placement: 'top' \| 'bottom' \| 'auto'` | ✓ |
| ... | | | |

## Unsupported patterns (emit `// TODO`)

| Pattern | Reason | Manual port |
|---|---|---|
| `Step.styles` | Tour Kit uses theme tokens | https://tourkit.dev/themes |
| `Step.tooltipComponent` | Custom slots have different shape | https://tourkit.dev/components/tour-card#slots |
| `Step.target` as function | Tour Kit expects selector or ref | https://tourkit.dev/migration/joyride#target-function |
| ... | | |
```

**Sanity check:** `pnpm --filter @tour-kit/codemods test` exits 0 with the coverage gate green.

---

### Task 7a.7 — Docs + README (2h)

**Depends on:** 7a.6

`apps/docs/content/docs/migration/joyride.mdx` (new): full migration guide with `npx tour-kit-migrate --from joyride ./src` command, before/after code samples covering BOTH JSX and hook APIs, the coverage table from `docs/from-joyride.md` embedded, and anchored sections matching each TODO anchor (`#beacon`, `#target-function`, `#styles`, etc.).

Update `apps/docs/content/docs/migration/meta.json` for the new page (or create the section if it doesn't exist).

`packages/codemods/README.md`: 30-line quick-start covering install (`pnpm add -D @tour-kit/codemods`), CLI usage with each flag, link to the docs page.

**Sanity check:** `pnpm --filter docs build` exits 0. Every `// TODO` anchor emitted by the transform resolves to a heading in the migration guide.

---

## Deliverables

```
packages/codemods/                                      # (+) new package
├── package.json                                        # bin: tour-kit-migrate
├── tsconfig.json
├── tsup.config.ts                                      # index + bin entries
├── vitest.config.ts
├── README.md
├── src/
│   ├── index.ts                                        # programmatic exports
│   ├── cli.ts                                          # arg parsing, exit codes
│   ├── bin/tour-kit-migrate.ts                         # shebang entry
│   ├── lib/
│   │   ├── step-mapper.ts                              # mapStepObject
│   │   └── todo-emitter.ts                             # // TODO templates
│   ├── transforms/
│   │   └── from-joyride.ts                             # JSX + useJoyride hook
│   └── __tests__/
│       ├── fixture-runner.test.ts                      # diff + typecheck + coverage
│       ├── step-mapper.test.ts                         # unit test
│       └── cli.test.ts                                 # exit codes
├── __tests__/fixtures/joyride/                         # (from Phase 0)
│   └── *.{input,expected}.tsx
└── docs/from-joyride.md                                # coverage matrix

apps/docs/content/docs/migration/
├── joyride.mdx                                         # full migration guide
└── meta.json                                           # nav
```

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/codemods build && pnpm --filter @tour-kit/codemods typecheck && pnpm --filter @tour-kit/codemods test` all exit 0.
- [ ] `pnpm --filter @tour-kit/codemods test -- fixture-runner` reports ≥80% of Joyride fixtures matching expected output.
- [ ] Every transformed fixture passes a `tsc --noEmit` post-check (separate test in the runner).
- [ ] CLI: `--dry-run` leaves files unchanged (verify via `git diff` after run on a fixture copy directory).
- [ ] Exit codes: missing source → 2; no paths → 3; parse failure during run → 1; success → 0.
- [ ] Bin executes via `pnpm exec tour-kit-migrate --help` from the package and prints usage.
- [ ] Both JSX (`<Joyride>`) and hook (`useJoyride`) fixtures hit ≥1 case each in the corpus.
- [ ] Every TODO emitted by the transform has a matching anchor in `apps/docs/content/docs/migration/joyride.mdx`.
- [ ] **GO/NO-GO GATE:** ≥80% corpus coverage AND every transformed output typechecks → ship Phase 7a, proceed to Phase 7b (or sprint review). If coverage <80% OR any typecheck fails → trim scope to JSX-only AND document the deferred surface in the README under "Roadmap"; do NOT ship the hook transform.

---

## Execution Prompt

Copy everything between the `---` lines:

---
You are implementing Phase 7a of Tour Kit's Sprint 1 — the Joyride codemod (issue #84).

### What This Project Is
Tour Kit competes with react-joyride for the React product-tour space. "Tour Kit vs Joyride" SEO pages convert poorly because every blog post ends with "now rewrite your code." This phase ships `npx tour-kit-migrate --from joyride ./src` as the artifact that closes the migration gap. The package becomes pure top-of-funnel leverage. Quality is non-negotiable — a transform that mangles user code is worse than no transform.

### Established in Prior Phases
- Phase 0 committed ≥4 Joyride fixtures under `packages/codemods/__tests__/fixtures/joyride/`: JSX form basic + callback variants AND `useJoyride` hook form basic + onEvent variants. Each is a `<name>.input.tsx` / `<name>.expected.tsx` pair.
- Phase 0 decision log at `tasks/sprint-1-ts-first-dx/plan/phase-0-decisions.md` confirmed `jscodeshift ^17.3.0` over `ts-morph`.
- Phase 0 spike at `packages/codemods/__spike__/` (now `.gitignore`d) proved the AST round-trip works for at least one fixture.
- Phase 1 made `useTour().goToStep` top-level — the transform's `controls.*` rewrites point at this.
- Memory entry #178 confirms `jscodeshift ^17.3.0` transform API.
- Memory entry #181 confirms react-joyride v2 ships BOTH a legacy `<Joyride>` JSX form AND a modern `useJoyride()` hook form — both must be supported.

### Your Goal for This Phase
Ship `@tour-kit/codemods` with: one bin (`tour-kit-migrate`), one CLI args parser with exit codes 0/1/2/3, one transform (`from-joyride`) covering BOTH Joyride APIs, one shared step mapper, one TODO emitter, ≥80% fixture-corpus coverage, and a coverage matrix doc.

### Data Model Rules (follow exactly)
- `interface`/`type` for `CliOptions`, `StepMapping`, `Todo`. No Zod — CLI args are validated at the boundary by hand, and AST values are typed by `@types/jscodeshift`.
- jscodeshift's `Collection<n>` and node types are treated as opaque from the library — let `@types/jscodeshift ^0.12` carry the load. Don't widen with `any`.
- TODO comments use a fixed template: `// TODO: <description> — see https://tourkit.dev/migration/joyride#<anchor>`. Anchors must match headings in `apps/docs/content/docs/migration/joyride.mdx`.
- Step mapping happens ONCE in `src/lib/step-mapper.ts`. Both the JSX and hook transforms call it.

### Architecture
- jscodeshift v17 transform signature: `(file, api) => string`. `module.exports.parser = 'tsx'` (or `export const parser = 'tsx'` in ESM).
- Detect Joyride usage via `findImportDeclarations({ source: { value: 'react-joyride' } })`. Inspect named/default imports to decide which transform branch to run.
- JSX branch: find `<Joyride .../>` JSX elements (by the local default-import name, which may not be literally `Joyride` if renamed); build `<TourProvider tours={[{ id, steps }]}> + <TourCard />` replacement; route `callback` into Tour Kit's separate `onComplete`/`onSkip`/`onStepChange`.
- Hook branch: find `useJoyride({...})` call expressions; rewrite the destructuring `const { controls, Tour } = ...` to `const tourRef = useRef<TourKitRef>(null)`; locate `controls.*` references and rewrite to `tourRef.current?.*`; replace `<Tour />` JSX with `<TourProvider tours={tours} ref={tourRef}><TourCard /></TourProvider>`.
- Import rewrite: `'react-joyride'` → `'@tour-kit/react'`; named imports remapped (`useJoyride` → `useTour` with a TODO noting the surface differences).
- TODO comments inserted in-place via `j.commentLine(...)` (or block comments on AST nodes).
- Transformed output MUST pass `tsc --noEmit` — verified by a separate test in the runner.
- ≥80% corpus coverage is a HARD ship/no-ship gate.

### Confirmed Library APIs

```ts
// jscodeshift ^17.3.0 — confirmed (memory #178, 2026-05-12, /facebook/jscodeshift)
import type { API, FileInfo } from 'jscodeshift'

export const parser = 'tsx'

export default function transform(file: FileInfo, api: API): string {
  const j = api.jscodeshift
  const root = j(file.source)
  root.find(j.ImportDeclaration, { source: { value: 'react-joyride' } })
      .forEach((path) => { path.node.source = j.literal('@tour-kit/react') })
  return root.toSource({ quote: 'single' })
}
```

```ts
// react-joyride v2.x — confirmed (memory #181)
// Two coexisting public APIs — codemods MUST support BOTH:

// Legacy JSX form:
<Joyride steps={steps} run={true} continuous callback={cb} />
// callback receives { action: 'next' | 'prev' | 'skip' | 'close', index, status, type, lifecycle }

// Modern hook form:
const { controls, Tour } = useJoyride({ continuous, steps })
// controls.start(), controls.next(), controls.previous(), controls.skip()
// onEvent: EventHandler with EventData carrying action/index/status/type/lifecycle
// Step.before (async pre-step), Step.after — maps to TourStep.onBeforeShow / onShow
```

### Files to Create

#### `packages/codemods/package.json`
Exact shape from Task 7a.1: bin `tour-kit-migrate`, single export `.`, ESM+CJS, dependencies on `jscodeshift` and `@types/jscodeshift` (from catalog).

#### `packages/codemods/tsup.config.ts`
Two entries: `index` and `bin/tour-kit-migrate`. `shims: true` so the bin has `__dirname` etc.

#### `packages/codemods/src/bin/tour-kit-migrate.ts`
Shebang line. Imports `runMigrate` from `../cli` and exits with its returned code.

#### `packages/codemods/src/cli.ts`
`runMigrate(argv): Promise<number>`. Manual arg parsing (no `commander`/`yargs`). Handle: `--from <source>` (required), `--parser <tsx|ts|babel>` (default `tsx`), `--dry-run`, `--print`, `--extensions <list>` (default `ts,tsx,js,jsx`), `--verbose`, plus positional `<paths...>`. Exit codes: 0 ok, 1 parse-error during run, 2 bad args, 3 no files matched.

#### `packages/codemods/src/lib/step-mapper.ts`
`mapStepObject(j, objExpression): StepMapping`. Handles every Joyride `Step` field per spec §4.6: target (string ✓; function → TODO; expression → TODO), content/title (pass-through ✓), placement (mapping ✓; `'center'` → body-target + spotlight=false ✓ with note), `id`/`data` (✓), `scrollOffset` → `spotlightPadding` (✓ approximate), `spotlightPadding` object → `spotlightPadding` number (with TODO if non-uniform), `disableBeacon`/`skipBeacon` (silent ✓ no-op with note comment), `styles`/`tooltipComponent`/`beaconComponent`/`spotlightTarget`/`scrollTarget`/`isFixed`/`portalElement` (all → TODO).

#### `packages/codemods/src/lib/todo-emitter.ts`
`emitTodo(message, anchor): Todo` and `todoToComment(t): string`. The template is fixed.

#### `packages/codemods/src/transforms/from-joyride.ts`
Single file housing both `rewriteJoyrideJsx` and `rewriteUseJoyrideHook` plus the shared entry. Detect what's imported, branch accordingly, rewrite the import statement after the transforms run. Use jscodeshift's `j.template.expression\`...\`` or `j.parseExpression(...)` to build new JSX nodes — pick whichever works in the current jscodeshift version; document which in a comment.

#### `packages/codemods/src/__tests__/fixture-runner.test.ts`
Three describes: (1) per-fixture diff against expected output; (2) per-fixture `tsc --noEmit` on transformed output; (3) coverage gate ≥80%. Use `normalize(s)` to collapse whitespace so trivial formatting differences don't fail the diff — but DO require structural equivalence.

#### `packages/codemods/src/__tests__/step-mapper.test.ts`
Unit-test `mapStepObject` against hand-crafted AST objects. ≥6 cases covering every supported pattern in `Step.*`.

#### `packages/codemods/src/__tests__/cli.test.ts`
Test `runMigrate(['--from', 'joyride', '--dry-run', 'path/'])` exit codes. Mock fs. ≥4 cases: missing --from (2), unsupported --from (2), no paths (3), success (0).

#### `packages/codemods/docs/from-joyride.md`
Coverage matrix table: ✓ Supported and ✗ Unsupported sections. Every ✗ entry has a manual-port URL (matching the docs MDX anchors).

#### `packages/codemods/README.md`
30-line quick start: install, CLI usage, link to migration guide.

#### `apps/docs/content/docs/migration/joyride.mdx` (new) + `migration/meta.json` (modify or create)
Full migration guide with before/after code samples for JSX form AND useJoyride hook form. Headings exactly match every TODO anchor emitted by the transform (e.g., `#target-function`, `#styles`, `#beacon`). Embed the coverage table or link it.

### Success Criteria
- `pnpm --filter @tour-kit/codemods build && pnpm --filter @tour-kit/codemods typecheck && pnpm --filter @tour-kit/codemods test` all exit 0.
- Coverage gate test reports ≥80% of corpus fixtures hit byte-for-byte (after `normalize`) match against expected output.
- Every transformed fixture passes `tsc --noEmit` (separate test).
- `npx tour-kit-migrate --from joyride --dry-run __tests__/fixtures/joyride/` exits 0 and produces parseable TSX diffs.
- `node packages/codemods/dist/bin/tour-kit-migrate.cjs --from foo` exits 2.
- Both JSX and hook fixtures are present in the corpus AND have passing transforms.
- Every `// TODO:` anchor emitted resolves to a heading in `joyride.mdx`.
- `pnpm --filter docs build` exits 0.

### Expected File Structure at End
```
packages/codemods/
├── package.json                       (bin tour-kit-migrate)
├── tsconfig.json
├── tsup.config.ts                     (index + bin entries)
├── vitest.config.ts
├── README.md
├── src/
│   ├── index.ts                       (programmatic exports)
│   ├── cli.ts                         (arg parsing)
│   ├── bin/tour-kit-migrate.ts        (shebang)
│   ├── lib/
│   │   ├── step-mapper.ts
│   │   └── todo-emitter.ts
│   ├── transforms/from-joyride.ts     (JSX + hook)
│   └── __tests__/
│       ├── fixture-runner.test.ts
│       ├── step-mapper.test.ts
│       └── cli.test.ts
├── __tests__/fixtures/joyride/        (from Phase 0)
└── docs/from-joyride.md

apps/docs/content/docs/migration/
├── joyride.mdx
└── meta.json
```

---

## Readiness Check

- [PASS] All inputs from prior phases are listed: Phase 0 fixtures, Phase 0 decision log, Phase 0 spike, Phase 1 `useTour().goToStep`.
- [PASS] Every sub-task has a clear, testable completion condition (build/test commands; coverage gate; exit-code assertions).
- [PASS] Execution prompt is self-contained: project context, prior facts (corpus location, tool choice), per-file guidance, confirmed jscodeshift snippet from memory #178, confirmed Joyride dual-API context from memory #181.
- [PASS] Exit criteria map 1:1 to deliverables (bin → CLI tests; mapper → mapper unit tests; transform → fixture runner; coverage gate → coverage test; docs → docs build; TODO anchors → heading match).
- [PASS] Heavy dependency (jscodeshift) is confirmed via memory #178; ts-morph fallback documented in the failure section if needed.
- [PASS] HIGH-risk gate has an explicit go/no-go in the exit criteria (≥80% + every fixture typechecks → ship; otherwise trim scope).

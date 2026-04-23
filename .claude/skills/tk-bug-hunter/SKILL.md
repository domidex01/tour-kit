---
name: tk-bug-hunter
description: Crawl one, several, or all tour-kit packages and surface real bugs with ≥95% precision. Stacks deterministic checks (typecheck, lint, knip, depcruise, publint) with context-verified pattern scans (SSR hazards, hook violations, missing cleanup, unsafe casts) and optional LLM-driven semantic review. Every finding is tagged with confidence and evidence so you never waste time on false positives. Use when you want a single comprehensive bug audit of the source tree — not just what CI catches.
when_to_use: Before a release. After a large refactor. When onboarding to a package ("what's broken here?"). When a user report feels like it might be one symptom of a deeper bug. When you want to ask "what have I missed?" and get an answer that won't cry wolf.
disable-model-invocation: true
argument-hint: "[packages] [--deep] [--fix-suggestions]"
allowed-tools: Bash(pnpm:*), Bash(node:*), Bash(grep:*), Bash(rg:*), Bash(find:*), Bash(ls:*), Bash(cat:*), Bash(awk:*), Bash(sed:*), Bash(wc:*), Bash(git:*)
---

# tk-bug-hunter

**Output contract:** A single structured report with every finding categorized by **confidence** (HIGH / MED / LOW) and **severity** (BLOCKER / MAJOR / MINOR / NIT). Only HIGH-confidence findings count toward the 95% precision claim. MED/LOW findings are hypotheses — they're worth reading but not auto-fixing.

## Scope

- **No argument** → audit every package in `packages/*` (except `__tests__`).
- **Package names** → audit only those: `/tk-bug-hunter core react hints`.
- `--deep` → add the optional LLM-driven semantic review layer. Slower (~2 min/package) and lower-confidence; skip unless you want hypotheses.
- `--fix-suggestions` → for each HIGH finding, propose a concrete edit. Never apply without asking.

## How 95% precision is achieved

Precision comes from **refusing to lie**, not from being thorough. The layered design forces corroboration before anything is tagged HIGH:

| Layer | Tool | Precision | Tag |
|---|---|---|---|
| 1. Type system | `tsc --noEmit` | 100% | HIGH |
| 2. Linter | biome / eslint (if configured) | ~99% | HIGH |
| 3. Dead code | `knip` | ~95% | HIGH if exported + not imported anywhere |
| 4. Dep graph | `depcruise` / simple grep for cycles | ~99% | HIGH |
| 5. Publish hygiene | `publint` | ~99% | HIGH |
| 6a. AST rules-of-hooks | `scripts/ast-rules-of-hooks.mjs` | ~100% | HIGH (all rules it emits) |
| 6b. Exports diff | `scripts/dist-vs-src-exports.mjs` | 100% | HIGH (100% on diffs) |
| 7. Known anti-patterns (ripgrep) | `rg` + read surrounding 5 lines | ~90% | MED by default, HIGH only with a second layer |
| 8. Semantic review (`--deep`) | LLM reads files, reasons | ~60-70% | LOW by default, MED only if corroborated |

**Rule:** a finding is only HIGH if a deterministic layer (1–6) produced it directly, OR two or more layers flag the same location. A ripgrep-only match in layer 7 is never HIGH by itself.

## Workflow

### Step 0 — Freshness

Confirm `dist/` is current for the packages in scope. If older than the source files, build first:
```bash
pnpm build --filter='./packages/<name>'
```
Knip and publint need built `dist/` to be meaningful.

### Step 1 — Deterministic layer (always runs)

Run each tool once across the whole scope. Capture stdout/stderr. Errors → HIGH findings; warnings → MED.

```bash
pnpm typecheck
pnpm lint 2>/dev/null || true          # skip if no lint script
pnpm dlx knip --workspace packages/<name>
pnpm dlx publint packages/<name>
pnpm dlx dependency-cruiser --validate packages/<name>/src 2>/dev/null || true
```

If any tool isn't installed, note it and move on — don't block.

### Step 2 — AST layer (always runs, HIGH confidence)

Run the bundled AST verifier. It uses the TypeScript compiler to disambiguate control flow that regex can't — this is what lets the findings it emits be HIGH by default.

```bash
node .claude/skills/tk-bug-hunter/scripts/ast-rules-of-hooks.mjs packages/<name> [packages/<other> ...]
```

Rules emitted (all HIGH, all with `file:line:col` + quoted evidence):

| Rule | Trigger | Why AST beats regex |
|---|---|---|
| `rules-of-hooks/conditional-call` | hook call inside `if`/`switch`/`for`/`while`/`catch`, **RHS** of `&&`/`\|\|`/`??`, or `whenTrue`/`whenFalse` of `? :` | Regex can't tell `usePathname() ?? '/'` (LHS, fine) from `flag && useState()` (RHS, broken) |
| `rules-of-hooks/after-early-return` | hook call preceded by an `if`/`switch`/`try` whose body contains a `return` | Regex can't distinguish `if (!x) throw` (fine) from `if (!x) return` (broken), and can't see that the tail `return useMemo(...)` isn't an early return of itself |
| `react/async-effect` | `async` function literal passed directly to `useEffect`/`useLayoutEffect`/`useInsertionEffect` | Regex would miss parenthesized / multi-line forms; AST catches them regardless of formatting |
| `ssr/module-scope-dom` | `window`/`document`/`navigator`/`localStorage`/`sessionStorage` property access at module depth 0, not guarded by an enclosing `typeof X !== 'undefined'` check | Regex can't measure function-nesting depth or see enclosing `typeof` guards |

Output is JSON; pipe into the report. Runtime: ~50 ms per package.

### Step 2b — Ripgrep supplement (fills gaps the AST doesn't cover)

For patterns outside the AST script's scope, `rg` + context is the fallback. These findings are **MED by default** and can only be promoted to HIGH if a second layer (typecheck, lint, knip, etc.) flags the same location.

| Pattern | Trigger regex | Confidence rule |
|---|---|---|
| `addEventListener` with no matching `removeEventListener` | `rg -n 'addEventListener\(' packages/<name>/src` | HIGH only if: call is inside `useEffect`'s body AND the effect's cleanup return (if any) has no matching `removeEventListener` call. Otherwise MED. |
| `setTimeout`/`setInterval` with no `clear*` | `rg -n '(setTimeout\|setInterval)\(' packages/<name>/src` | Same rule as above. |
| `as any` / `as unknown as X` | `rg -n '\bas (any\|unknown as )' packages/<name>/src` | MED always. Never auto-promote — may be a necessary escape hatch. Comment asking whether the cast is intentional. |
| `dangerouslySetInnerHTML` | `rg -n 'dangerouslySetInnerHTML' packages/<name>/src` | MED. HIGH only if the value flows from a prop or state that traces to user input. |
| `Math.random()` / `new Date()` / `Date.now()` outside effects | `rg -n '(Math\.random\(\)\|new Date\(\)\|Date\.now\(\))' packages/<name>/src` | MED. HIGH only if inside a function that returns JSX AND the call is not wrapped in `useEffect`/`useMemo`/`useCallback`/`useRef`. |
| `console.log` / `debugger` | `rg -n '(console\.log\|^\s*debugger)' packages/<name>/src` | MINOR. |

Do not pattern-scan for rules-of-hooks, async effects, or SSR module-scope access — the AST script handles those with higher precision.

### Step 3 — Test gap scan (always runs)

For each exported symbol in `dist/index.d.ts`, check if it's referenced in any `*.test.ts` or `*.test.tsx` under the package. Flag public APIs with zero test references using this promotion rule:

- **MINOR** — zero test refs, but symbol is covered by a doc page under `apps/docs/content/` OR used in `examples/dashboard-next`. Likely tested implicitly by the integration surface.
- **MED / test-gap** — zero test refs AND (no doc page) AND (no integration usage in `examples/dashboard-next` or `apps/smoke`). A missing test alone isn't a bug, but an untested + undocumented + unintegrated public API is a strong smell and almost always ships with regressions.
- Never tag a test-gap finding HIGH — missing tests are never bugs by themselves.

### Step 4 — Cross-package contract check (always runs)

- **Stale imports** — For every `import { X } from '@tour-kit/<pkg>'` found in sibling packages, `examples/dashboard-next`, `apps/docs`, or `apps/smoke`, verify `X` is actually exported from the target package's `dist/index.d.ts`. Mechanism:
  1. `rg -n "from ['\"]@tour-kit/<pkg>['\"]" --type ts --type tsx` to collect every call site + imported symbol list.
  2. Parse the target package's `dist/index.d.ts` (same loader as `dist-vs-src-exports.mjs`) for the set of named exports.
  3. Any imported symbol not in that set → HIGH, MAJOR. Cross-check with a `pnpm typecheck --filter <consumer>` run to confirm it actually fails — if typecheck passes, downgrade to MED and note the contradiction (usually means an ambient `.d.ts` or path alias is masking it).
- **Provider context guards** — For every `*Provider` in scope, grep for the paired `createContext(` call and verify the initial value is either `null` with a `throw new Error` in the consumer hook OR a non-null default object. Missing guards (silent `undefined` return when no provider is mounted) → MED.

### Step 4b — Dist/src export diff (always runs, HIGH confidence)

Run the bundled exports-diff script per package. It follows `export * from './...'` chains in `src/index.ts` and enumerates named exports in `dist/index.d.ts`, then diffs the two sets. Every mismatch is a 100%-precision finding (stale build, tsup misconfig, drifted re-export, or unintentional public-API drop).

```bash
node .claude/skills/tk-bug-hunter/scripts/dist-vs-src-exports.mjs packages/<name>
```

Output shape: `{ missing_in_dist: [...], extra_in_dist: [...], findings: [...] }`.

- `missing_in_dist` → HIGH, MAJOR. Downstream `import { X } from '@tour-kit/<name>'` will fail at type-check or run-time. Common cause: stale `dist/` — rebuild and re-run.
- `extra_in_dist` → HIGH, MINOR. Indicates a stale `dist/` from a prior build; easy to miss during release and lets removed APIs linger in `.d.ts`.

### Step 5 — Optional deep semantic review (`--deep`)

For each package in scope, read `src/index.ts` + the main hook / provider file. Prompt yourself to look specifically for:
- Off-by-one in index math
- Race conditions in async state updates
- Event handler reference inequality causing re-renders
- Forgotten cleanup when props change mid-lifecycle
- Missing boundary behavior (first / last / empty list)

**Promotion path for semantic findings:**
- **LOW (default)** — semantic review alone, no corroboration from any other layer.
- **MED** — semantic finding + at least one of: (a) a layer 7 ripgrep pattern flagged the same file:line ±3 lines, OR (b) a test-gap for the same symbol, OR (c) a TODO/FIXME comment in the surrounding function.
- **HIGH** — only if a deterministic layer (1–6b) independently flags the same file:line. Never promote to HIGH on semantic confidence alone, even if the semantic layer runs twice and agrees with itself. Two semantic passes count as one layer for promotion purposes.

### Step 6 — Report

Output exactly this shape:

```
# tk-bug-hunter — <shortsha> · <ISO timestamp>
Scope: <packages audited>  ·  Layers: deterministic + patterns + tests + contracts [+ semantic if --deep]
Runtime: <elapsed>

## Summary
- HIGH   (≥95% precision target): 12 findings
- MED    (70-95%):                  8 findings
- LOW    (< 70%, hypotheses):      15 findings

## HIGH findings — action required

### 1. packages/media/src/lottie-player.tsx:28 · SSR hazard · BLOCKER
Evidence:
  const cachedCanvas = document.createElement('canvas')   // module scope
Layers: pattern (SSR window/document at module scope) + typecheck crash on Next.js build
Suggested fix: move into `useEffect` or wrap in `typeof document !== 'undefined'`.

### 2. packages/core/src/tour-provider.tsx:142 · Stale closure · MAJOR
Evidence:
  useEffect(() => { onStepChange(step) }, [])   // onStepChange not in deps
Layers: pattern + lint (react-hooks/exhaustive-deps)
Suggested fix: include `onStepChange` or wrap in ref.

...

## MED findings — review

### 1. packages/adoption/src/nudge.tsx:54 · `as unknown as` cast · MINOR
Evidence: one unsafe cast on user-supplied trigger config.
Layers: pattern only (unverified)
Ask: is the type gap intentional? If so, add a comment explaining why.

...

## LOW findings — hypotheses only (do not auto-fix)

- packages/surveys/src/engine.ts:188 — potential off-by-one in `calculateNPS` when `responses.length === 0`. Semantic review only; layer 1-6 clean.

## Layer coverage
| Layer              | Status | Findings |
|--------------------|--------|----------|
| typecheck          | ✓       | 0        |
| lint               | —       | skipped (no lint script) |
| knip               | ✓       | 3 HIGH   |
| publint            | ✓       | 1 HIGH   |
| depcruise          | ✓       | 0        |
| ast (hooks + ssr)  | ✓       | 4 HIGH   |
| exports diff       | ✓       | 2 HIGH   |
| ripgrep supplement | ✓       | 2 HIGH (corroborated), 5 MED |
| test gap           | ✓       | 3 MED    |
| contract check     | ✓       | 2 HIGH   |
| semantic (deep)    | skipped | —        |

## Verdict
Found 12 HIGH-confidence bugs. Fix them before release.
```

## Hard rules

- **Never report a finding without `file:line` + a quoted evidence line.** A finding without evidence is a guess, and guesses are what keep precision below 95%.
- **Never tag a finding HIGH on a single ripgrep pattern match.** Layer 7 alone is not enough. A deterministic layer (1–6b) must either produce the finding directly or corroborate the same location.
- **Never auto-apply fixes.** Suggest edits under `--fix-suggestions` but wait for approval. A 95% precision skill still has 5% wrong; 5% of auto-applied fixes corrupts the codebase.
- **Pass-through errors.** If `pnpm dlx knip` fails to install, or the bundled node scripts fail to resolve `typescript`, note it in layer coverage but continue — don't fail the whole run.
- **Run from the repo root.** The bundled node scripts resolve `typescript` from `./node_modules`; invoke them with absolute paths but with `cwd = /path/to/tour-kit`.

## Caveats

- First-run `pnpm dlx` downloads (knip, publint, dependency-cruiser, attw) add ~3 min. Subsequent runs are ~15 s.
- Coverage of semantic bugs is inherently incomplete. The 95% number is **precision** (the bugs we flag are real) not **recall** (we find every bug). No tool achieves both.
- `--deep` sends source files through an LLM for review. Expect noise in the LOW tier — it's for hypothesis generation, not conclusions.
- If `examples/dashboard-next` or `apps/smoke` fail to build, include a note — those failures are almost always real bugs upstream.

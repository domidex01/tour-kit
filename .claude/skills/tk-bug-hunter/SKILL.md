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
| 6. Known anti-patterns | grep + read surrounding 5 lines | ~90% | MED by default, HIGH only after context confirms |
| 7. Semantic review (`--deep`) | LLM reads files, reasons | ~60-70% | LOW by default, MED only if corroborated |

**Rule:** a finding is only HIGH if **two or more layers flag the same location** OR layer 1/2/3/4/5 produced it directly.

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

### Step 2 — Anti-pattern scan (always runs)

For each package in scope, grep the source tree. For every match, **read 5 lines of context** before deciding whether it's real. Anti-patterns to scan:

| Pattern | Why it's a bug candidate | Confidence after context |
|---|---|---|
| `window.` or `document.` at module scope | SSR hazard — crashes Next.js build | HIGH if outside function body |
| `useEffect(.*, \[\])` where body references a var | stale closure | HIGH if unmemoed ref |
| `addEventListener` with no matching `removeEventListener` | memory leak | HIGH if inside useEffect with no cleanup return |
| `setTimeout` / `setInterval` with no `clear*` | leak | same |
| `as any` or `as unknown as X` | type hole | MED always (may be necessary) |
| `dangerouslySetInnerHTML` | XSS vector | MED unless source is user-controlled (then HIGH) |
| `useMemo\(\(\)` or `useCallback\(\(\)` with `, \[\]` | always-stable but referencing props | HIGH on stale capture |
| `Math.random()` inside render (not effect) | hydration mismatch | HIGH |
| `new Date()` / `Date.now()` inside render | same | HIGH |
| hooks inside `if`, `for`, early-return | rules-of-hooks violation | HIGH |
| `async` function passed to `useEffect` directly | silent promise leak | HIGH |
| `console.log` / `debugger` | should not ship | MINOR / MED |

Run with ripgrep for speed:
```bash
rg --type ts --type tsx -n 'pattern' packages/<name>/src
```

### Step 3 — Test gap scan (always runs)

For each exported symbol in `dist/index.d.ts`, check if it's referenced in any `*.test.ts` or `*.test.tsx` under the package. Flag **public APIs with zero test references** as MED / test-gap. A missing test isn't a bug — but a missing test on a component that has no types, no docs, and no integration in `examples/dashboard-next` is a strong smell.

### Step 4 — Cross-package contract check (always runs)

- For every `import { X } from '@tour-kit/<pkg>'` in sibling packages or the example app, verify `X` is actually exported from `dist/index.d.ts`. Stale imports → HIGH.
- For every provider (`*Provider`), verify the corresponding context uses a default-value contract (throws when used without provider) — missing guards are MED.

### Step 5 — Optional deep semantic review (`--deep`)

For each package in scope, read `src/index.ts` + the main hook / provider file. Prompt yourself to look specifically for:
- Off-by-one in index math
- Race conditions in async state updates
- Event handler reference inequality causing re-renders
- Forgotten cleanup when props change mid-lifecycle
- Missing boundary behavior (first / last / empty list)

Each semantic finding is **LOW confidence unless layer 1-6 also flagged the same location**. Never promote LOW → HIGH on LLM confidence alone.

### Step 6 — Report

Output exactly this shape:

```
# tk-bug-hunter — <shortsha> · <ISO timestamp>
Scope: <packages audited>  ·  Layers: deterministic + patterns + tests + contracts<  + semantic if --deep>
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
| Layer            | Status | Findings |
|------------------|--------|----------|
| typecheck        | ✓       | 0        |
| lint             | —       | skipped (no lint script) |
| knip             | ✓       | 3 HIGH   |
| publint          | ✓       | 1 HIGH   |
| depcruise        | ✓       | 0        |
| pattern scan     | ✓       | 6 HIGH, 5 MED |
| test gap         | ✓       | 3 MED    |
| contract check   | ✓       | 2 HIGH   |
| semantic (deep)  | skipped | —        |

## Verdict
Found 12 HIGH-confidence bugs. Fix them before release.
```

## Hard rules

- **Never report a finding without `file:line` + a quoted evidence line.** A finding without evidence is a guess, and guesses are what keep precision below 95%.
- **Never tag a finding HIGH on a single pattern match.** Require a second signal (another tool, or context verification that rules out the common false-positive case).
- **Never auto-apply fixes.** Suggest edits under `--fix-suggestions` but wait for approval. A 95% precision skill still has 5% wrong; 5% of auto-applied fixes corrupts the codebase.
- **Pass-through errors.** If `pnpm dlx knip` fails to install or errors, note it in layer coverage but continue — don't fail the whole run.

## Caveats

- First-run `pnpm dlx` downloads (knip, publint, dependency-cruiser, attw) add ~3 min. Subsequent runs are ~15 s.
- Coverage of semantic bugs is inherently incomplete. The 95% number is **precision** (the bugs we flag are real) not **recall** (we find every bug). No tool achieves both.
- `--deep` sends source files through an LLM for review. Expect noise in the LOW tier — it's for hypothesis generation, not conclusions.
- If `examples/dashboard-next` or `apps/smoke` fail to build, include a note — those failures are almost always real bugs upstream.

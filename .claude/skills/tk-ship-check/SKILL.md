---
name: tk-ship-check
description: Composite pre-release gate for tour-kit. Runs typecheck, tests with coverage, tk-publish-audit (attw + publint + smoke), tk-bundle-audit (sizes vs CLAUDE.md budgets), and tk-docs-audit (public exports vs docs). Aggregates every finding into a single SHIP / HOLD verdict with an ordered action list. Use before cutting a release PR, before merging a large feature branch, or before `pnpm changeset publish`.
when_to_use: Before opening a release PR. Before merging a branch that spans multiple packages. Before any `pnpm release`. When a changeset has been created and you want one final gate. When a user asks "is this safe to ship?".
disable-model-invocation: true
allowed-tools: Bash(pnpm:*), Bash(bash:*), Bash(node:*), Bash(ls:*), Bash(cat:*), Bash(grep:*), Bash(find:*), Bash(gzip:*), Bash(wc:*), Bash(stat:*), Bash(du:*)
---

# tk-ship-check

One-command pre-release audit. Runs every tour-kit quality gate and produces a single structured verdict.

## Gates (in order, all executed even on failure)

| # | Gate | Tool | Blocking? |
|---|------|------|-----------|
| 1 | Typecheck | `pnpm typecheck` | **Yes** — any TS error holds |
| 2 | Unit tests + coverage | `pnpm test --coverage` | **Yes** on failure, warn if coverage < 80% |
| 3 | Publish audit | `tk-publish-audit` logic (attw + publint + smoke) | **Yes** on any attw/publint error or smoke != 0 |
| 4 | Bundle audit | `tk-bundle-audit` logic | **Yes** if core/react/hints over CLAUDE.md budget |
| 5 | Docs audit | `tk-docs-audit` logic | **No** — warn on undocumented public exports |

Gate 3, 4, 5 can either invoke the sibling skills directly (preferred once they're loaded) or re-run the same commands inline. When re-running inline, follow the same command shapes documented in the sibling SKILL.md files so findings stay comparable.

## Workflow

1. Print the header: current commit SHA, timestamp, branch.
2. Run each gate serially (some depend on `pnpm build`).
3. Collect structured findings per gate: `{ gate, status, errors: [], warnings: [] }`.
4. Aggregate into one verdict.

## Output format

Produce exactly this shape so it can be pasted into a PR description:

```
# Ship check — <shortsha> · <branch> · <ISO timestamp>

## Gate results
| Gate          | Status | Notes                                 |
|---------------|--------|---------------------------------------|
| Typecheck     | ✓      | 0 errors                              |
| Tests         | ✓      | 138 passed · 84% lines covered        |
| Publish audit | ✗      | 1 blocker (publint: media/files)      |
| Bundle audit  | ⚠️     | react 11.8 KB (budget 12 KB) — 98%    |
| Docs audit    | ⚠️     | 3 undocumented exports                |

## Blockers (HOLD)
1. @tour-kit/media — publint: `files` field missing `dist/media-styles.css`
   → Fix: edit packages/media/package.json:14

## Warnings
- @tour-kit/react bundle at 98% of budget — one more import will regress
- 3 undocumented public exports (see tk-docs-audit output above)

## Verdict: HOLD — 1 blocker must be fixed before release
```

### Verdict rules
- **SHIP** if all blocking gates are ✓ and every `--strict`-style check is green.
- **HOLD** if any blocking gate fails.
- **SHIP (with warnings)** if only non-blocking warnings remain.

## Flags

Optional behavior if the user passes arguments:

- `--quick` — skip gate 2 (tests). Useful for iterating on publish/bundle concerns. Output must note the gate was skipped.
- `--fix` — after running, offer to apply obvious fixes (package.json field tweaks, docs scaffolding). Never apply without asking.
- `--only publish|bundle|docs` — run only one of the audit gates. Typecheck + tests still required.

## Caveats

- A full run (cold caches) takes ~4-6 minutes: build (~90s), test+coverage (~60s), attw ~2 min (downloads once), publint ~10s, smoke ~60s, sizes ~5s, docs diff ~15s.
- After the first run, `pnpm dlx` caches tools in the pnpm store — subsequent runs are ~2 min total.
- Must be run from the repo root.

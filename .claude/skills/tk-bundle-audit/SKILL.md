---
name: tk-bundle-audit
description: Measure every @tour-kit/* package's built dist bundle (ESM, gzipped) and compare against the budgets declared in CLAUDE.md (core < 8 KB, react < 12 KB, hints < 5 KB). Flags regressions and suggests causes. Use before merging perf-sensitive changes or before a release.
when_to_use: Before merging a PR that touches imports, adds dependencies, or refactors exports. Before publishing a release. When a user reports a bundle-size regression. As part of the tk-ship-check composite gate.
disable-model-invocation: true
allowed-tools: Bash(pnpm:*), Bash(gzip:*), Bash(stat:*), Bash(du:*), Bash(find:*), Bash(ls:*), Bash(wc:*), Bash(node:*)
---

# tk-bundle-audit

Measure built bundle sizes and enforce the budgets from `CLAUDE.md`.

## Budgets (from CLAUDE.md "Quality Gates")

| Package | Gzipped budget |
|---|---|
| `@tour-kit/core` | < 8 KB |
| `@tour-kit/react` | < 12 KB |
| `@tour-kit/hints` | < 5 KB |
| everything else | no explicit budget — report baseline |

## Workflow

1. **Build.** Skip if `dist/` is already fresh; else:
   ```bash
   pnpm build --filter='./packages/*'
   ```
2. **Enumerate packages.** `ls packages/` minus `__tests__`.
3. **Measure each package's ESM entry.** Use `packages/<name>/dist/index.js` (or the file the package.json `exports.default` points to):
   ```bash
   raw=$(stat -c%s packages/<name>/dist/index.js)
   gz=$(gzip -c packages/<name>/dist/index.js | wc -c)
   ```
4. **Convert to KB** (divide by 1024, one decimal).
5. **Compare** each against its budget.

## Reporting

Output a single table:

```
| Package              | Raw (KB) | Gzip (KB) | Budget | Status |
|----------------------|----------|-----------|--------|--------|
| @tour-kit/core       |    22.4  |     6.8   |   8    |   ✓    |
| @tour-kit/react      |    41.1  |    11.9   |  12    |   ⚠️   |
| @tour-kit/hints      |    18.2  |     4.6   |   5    |   ✓    |
| @tour-kit/adoption   |    33.0  |     9.1   |   —    |   —    |
...
```

Then:

- **If any package is over budget:** print it first. Suggest investigation:
  - `pnpm dlx source-map-explorer packages/<name>/dist/index.js`
  - Check for accidental barrel imports pulling siblings.
  - Check for a newly added transitive dep (`pnpm why <suspect> --filter=@tour-kit/<name>`).
- **If a package is within 10% of budget:** warn as `⚠️` (regression risk).
- **If everything is clean:** one-line summary.

## Tracking over time

If `.claude/skills/tk-bundle-audit/history.json` exists, append the current measurement with `{ commit, timestamp, packages: { name: { raw, gz } } }`. Compare to the previous entry and flag deltas > 500 bytes gzipped. Create the file if missing.

## Caveats

- Budgets apply to the ESM `dist/index.js`. Subpath exports (e.g. `/headless`, `/server`) are measured separately and reported without a budget.
- We don't use `size-limit` here because it adds a devDep and config surface. This skill does the same measurement with 10 lines of bash.

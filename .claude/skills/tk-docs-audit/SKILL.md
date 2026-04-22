---
name: tk-docs-audit
description: Diff every @tour-kit/* package's public API (named exports from dist/index.d.ts) against what is documented in apps/docs/content/docs/, and report every exported symbol that has no page, no heading, and no code example referencing it. Catches undocumented additions and stale references. Use before a release or after any PR that adds, renames, or removes public exports.
when_to_use: After a PR that touches any `packages/*/src/index.ts`. Before a release. When writing release notes. When a user reports "the docs don't mention this function".
disable-model-invocation: true
allowed-tools: Bash(pnpm:*), Bash(grep:*), Bash(find:*), Bash(ls:*), Bash(cat:*), Bash(node:*), Bash(sed:*), Bash(awk:*)
---

# tk-docs-audit

Verifies every public export in every package is surfaced somewhere in the docs site.

## What counts as "documented"

An export is documented if its name appears in at least one of:

1. An MDX file under `apps/docs/content/docs/` (including subdirectories).
2. A code block (```tsx ... ```) inside an MDX file.
3. A frontmatter `title` matching the export name.

Missing from all three → flagged.

## Workflow

1. **List all packages** under `packages/` except `__tests__`.
2. **Extract public exports per package.** Prefer `packages/<name>/dist/index.d.ts` (stable, post-build). Use two patterns:
   - `export (declare )?(type|interface|class|function|const|enum) (\w+)` — captures direct declarations.
   - `export \{ ([^}]+) \}` — captures re-exports; split on `,` and strip `as X` aliases.
   - Skip names starting with `_` (conventionally internal).
3. **Search docs** for each name across `apps/docs/content/docs/**/*.mdx`:
   ```bash
   grep -rl -w "<name>" apps/docs/content/docs/
   ```
4. **Build per-package report:**

   ```
   @tour-kit/core — 42 exports, 38 documented, 4 missing:
     • useTourAnalytics (hook) — suggest apps/docs/content/docs/core/hooks.mdx
     • PositionEngineConfig (type) — suggest apps/docs/content/docs/core/types.mdx
     • focusTrapOptions (value) — suggest apps/docs/content/docs/core/utilities.mdx
     • BranchResolver (type) — may be internal; confirm before documenting
   ```

5. **Suggest the target MDX file** for each missing export using existing structure. Heuristics:
   - Hooks (name starts with `use`) → `<package>/hooks.mdx`
   - Providers (name ends with `Provider`) → `<package>/providers.mdx` or `<package>/getting-started.mdx`
   - Types / interfaces → `<package>/types.mdx` or `api-reference/<package>.mdx`
   - Components (PascalCase, not a type) → `<package>/components.mdx`
   - Utilities (camelCase functions) → `<package>/utilities.mdx`

6. **Classify severity:**
   - **Blocking**: a new public *component*, *provider*, or *hook* with no docs page or mention.
   - **Warn**: types / context values missing — users may rely on type inference.
   - **Info**: internal-sounding exports that probably should be moved out of the public surface.

## Reporting

Always end with totals:

```
Total: 312 public exports across 12 packages.
  Documented: 281 (90%)
  Missing:     31 (10%)
     Blocking:  4
     Warn:     15
     Info:     12
```

If a package has 100% coverage, give it a ✓.

## Caveats

- An export whose name happens to match an unrelated word in docs (e.g. `State` matching "state machine") will false-positive as "documented". Prefer word-boundary matching (`grep -w`) and accept some noise.
- Type-only exports rarely need their own page but should at least appear in one API reference table.
- If `dist/` is missing, run `pnpm build --filter='./packages/*'` first.

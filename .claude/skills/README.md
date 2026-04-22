# tour-kit project skills

Project-scoped Claude Code skills that encode the bug-hunting workflows documented in CLAUDE.md. All are manual-trigger (`disable-model-invocation: true`) — Claude never auto-fires them.

| Slash command | What it does |
|---|---|
| `/tk-publish-audit` | `@arethetypeswrong/cli` + `publint` + `apps/smoke` across every package. Catches tarball-level bugs. |
| `/tk-bundle-audit` | Gzipped dist sizes vs the CLAUDE.md budgets (core < 8 KB, react < 12 KB, hints < 5 KB). |
| `/tk-docs-audit` | Diffs every package's public exports (from `dist/index.d.ts`) against `apps/docs/content/docs/`. Flags undocumented symbols. |
| `/tk-ship-check` | Composite: typecheck + tests + publish + bundle + docs. Produces a single SHIP / HOLD verdict. |

## When to use each

- Run `/tk-publish-audit` before any `pnpm release`. Catches the class of bug the smoke harness catches, plus a second net for types/exports.
- Run `/tk-bundle-audit` after any PR that adds imports, deps, or refactors `src/index.ts`.
- Run `/tk-docs-audit` after any PR that changes `src/index.ts` exports.
- Run `/tk-ship-check` before opening a release PR — it invokes the three above plus typecheck and tests.

## Notes

- New skills require restarting Claude Code before the `/tk-*` slash commands become available.
- The audits use `pnpm dlx` for attw/publint — zero new devDependencies.
- Keep `apps/smoke/` up to date: it's the runtime gate that `/tk-publish-audit` leans on.

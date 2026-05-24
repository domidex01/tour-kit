# Sprint 1 — "Stop the Bleeding"

> Source of truth: `reports/package-audit-2026-05-23.md` + `reports/sprint-1-roadmap.md`.
> Generated: 2026-05-23. Owner: domidex01. Status: PLANNED.

This directory is the operational play-by-play for the seven items selected in
`sprint-1-roadmap.md`. Each phase below is a self-contained, mergeable PR with
a hard acceptance gate and a rollback recipe. Phases are ordered by **risk and
unblocking value**, not strictly by audit-ID, so a stalled phase never blocks
the next.

---

## At a glance

| # | Phase | Audit ID | Effort | Risk | Bump | File |
|---|-------|----------|:------:|:----:|------|------|
| 0 | Pre-flight checks | — | XS | LOW | none | [phase-0-preflight.md](phase-0-preflight.md) |
| 1 | Fix analytics SDK packaging (62 KB → 6 KB) | B-2 | S | LOW | patch | [phase-1-analytics-tsup-fix.md](phase-1-analytics-tsup-fix.md) |
| 2 | Remove analytics plugin re-exports | B-3 | S | MEDIUM | **major** | [phase-2-analytics-plugin-treeshake.md](phase-2-analytics-plugin-treeshake.md) |
| 3 | Add `"sideEffects": false` to `@tour-kit/adoption` | B-5 | XS | LOW | patch | [phase-3-adoption-sideeffects.md](phase-3-adoption-sideeffects.md) |
| 4 | pnpm catalog hygiene (7 runtime libs) | R-3 | M | LOW | patch×9 | [phase-4-catalog-hygiene.md](phase-4-catalog-hygiene.md) |
| 5 | `@tour-kit/codemods` docs (0 → 4 pages) | G-1 | M | LOW | docs | [phase-5-codemods-docs.md](phase-5-codemods-docs.md) |
| 6 | `@tour-kit/testing-library` docs (0 → 2 pages) | G-2 | M | LOW | docs | [phase-6-testing-library-docs.md](phase-6-testing-library-docs.md) |
| 7 | Tighten existing bundle-size CI gate | F-2 | M | LOW | infra | [phase-7-bundle-size-ci.md](phase-7-bundle-size-ci.md) |
| 8 | Release, changelog, announcement | — | S | MEDIUM | — | [phase-8-release.md](phase-8-release.md) |

Total estimated effort: **3 XS/S + 4 M + 1 release ≈ 8–10 dev-days.**

---

## Branching strategy

```
main
 └── sprint-1/phase-1-analytics-tsup-fix          (B-2)
 └── sprint-1/phase-2-analytics-plugin-treeshake  (B-3, depends on phase 1)
 └── sprint-1/phase-3-adoption-sideeffects        (B-5, independent)
 └── sprint-1/phase-4-catalog-hygiene             (R-3, independent)
 └── sprint-1/phase-5-codemods-docs               (G-1, independent)
 └── sprint-1/phase-6-testing-library-docs        (G-2, independent)
 └── sprint-1/phase-7-bundle-size-ci              (F-2, depends on phases 1+2+3)
 └── sprint-1/phase-8-release                     (depends on all)
```

- Phases 1, 3, 4, 5, 6 can be opened in parallel (independent files).
- Phase 2 must merge **after** phase 1 (same `tsup.config.ts` + same dist).
- Phase 7 must merge **after** 1+2+3 because the budget table embeds post-fix
  numbers — gating against pre-fix sizes would lock in the bug.
- Phase 8 is a release train, merged last.

---

## Cross-cutting conventions

### Repo validation corrections

The phase plans below were validated against the workspace on 2026-05-23.
These corrections supersede any older audit wording in individual sections:

- `packages/analytics` has no `clean` script; rely on `tsup`'s `clean: true`
  and run `pnpm --filter @tour-kit/analytics build`.
- The analytics SDK packages are currently in `peerDependenciesMeta` but not
  `peerDependencies`. Phase 1 must add actual optional peers for
  `posthog-js`, `mixpanel-browser`, and `@amplitude/analytics-browser`.
- `packages/adoption` should use plain `"sideEffects": false` to match every
  sibling package, including packages that ship CSS exports.
- `@tour-kit/codemods` already has a real `tour-kit-migrate` CLI entry and
  `src/bin/tour-kit-migrate.ts`; Phase 5 should document that CLI, using
  `jscodeshift` only as the advanced fallback.
- `@tour-kit/testing-library` examples must include a real `<TourCard />` and
  start tours through `useTour().start(...)`; `TourProvider` has no
  `defaultActiveTour` prop.
- `/.size-limit.json` already exists. Phase 7 is a tightening/replacement of
  that config, not creation of a first config.
- CI workflows pin pnpm `9`, while `package.json` declares
  `pnpm@10.26.1`. Phase 7 should align workflows before relying on catalog or
  size-limit behavior in CI.

### Commit messages

Use Conventional Commits. The audit ID belongs in the body, not the subject.

```
fix(analytics): externalize @amplitude/analytics-browser

@amplitude/analytics-browser is declared as an optional peer in
package.json by this PR and added to tsup external, because it was previously
missing from both the real peerDependencies block and the external list. That
omission inlined the full SDK into dist/index.js (224 KB raw / 64 KB gz).
The fix drops dist/index.js to ~6 KB gz.

Refs: audit B-2.
```

### Changesets

Every phase that touches a `packages/*/package.json` or `packages/*/src/**`
needs a changeset. Use the existing linked-package config (`core`/`react`/`hints`
move together; everything else bumps independently).

```bash
pnpm changeset
# select packages → describe → patch/minor/major
```

The major bump in phase 2 is the only non-patch in this sprint. **Linked-package
policy:** analytics is not in the linked set, so its major bump does **not**
drag core/react/hints along. Confirmed in `.changeset/config.json` line 5.

### Validation per phase

Every phase has three layers of gate:

1. **Local fast gate** (≤ 30 s): `pnpm --filter <pkg> typecheck && pnpm --filter <pkg> build && pnpm --filter <pkg> test`.
2. **Local full gate** (≤ 5 min): `pnpm lint && pnpm typecheck && pnpm build && pnpm test`.
3. **CI gate** (≤ 20 min): green `.github/workflows/ci.yml` + `size-limit.yml`.

Do not open a PR until layer 2 is green.

### Rollback rule

Every phase's final section is a literal sequence of commands to undo the
change without rewriting history. If you have to `git push --force` to undo,
the rollback section is wrong — fix it before merging.

---

## What's explicitly NOT in Sprint 1

Carried verbatim from `sprint-1-roadmap.md` — these belong to Sprint 2 or
later, do not let scope creep them in:

- **B-1**: `core` 19 KB → < 8 KB (subpath extraction, architectural).
- **R-1/R-2/R-5**: provider monolith extractions (`tour-provider.tsx`,
  `announcements-provider.tsx`, `surveys-provider.tsx`, `checklist-provider.tsx`).
- **R-4**: type-suppression sweep on `core` + `analytics`.
- **G-3/G-7**: `license` + `playwright` doc expansion.
- **F-3**: `npx @tour-kit/codemods` CLI binary (codemods already has a
  `bin` entry — see Phase 5 §3 — but documenting it is what's deferred).

If the CI gate in Phase 7 catches `core` at 19 KB gz, **that is expected** —
add a temporary `core: 20 KB` ceiling in the size-limit config with a `TODO:
shrink in Sprint 2 (B-1)` comment. Don't shrink core to fit the gate.

---

## Definition of Done (sprint-level)

- [ ] All 7 phase PRs merged into `main`.
- [ ] `pnpm install` produces zero lockfile diff after phase 4 lands.
- [ ] CI shows a green Size Limit job on every PR.
- [ ] GitHub workflows use the same pnpm major as `packageManager`.
- [ ] `gzip -c packages/analytics/dist/index.js | wc -c` < 8000.
- [ ] `gzip -c packages/analytics/dist/plugins/amplitude.js | wc -c` < 1000.
- [ ] `packages/analytics/package.json` declares optional peers for all
      externalized SDK packages (`posthog-js`, `mixpanel-browser`,
      `@amplitude/analytics-browser`).
- [ ] `apps/docs` nav shows `codemods/` and `testing-library/` entries.
- [ ] `packages/adoption/package.json` includes `"sideEffects": false`.
- [ ] `git grep -E '"(@floating-ui/react|class-variance-authority|@radix-ui/react-slot|@radix-ui/react-dialog|@mui/base|clsx|tailwind-merge)": "\^'` returns **0** matches inside `packages/`.
- [ ] Release notes posted on GitHub for analytics major.

---

## Reading order for first-time owners

1. Read `reports/package-audit-2026-05-23.md` end-to-end. (~10 min)
2. Read `reports/sprint-1-roadmap.md`. (~3 min)
3. Skim this README. (~3 min)
4. Open phase-0 + start.

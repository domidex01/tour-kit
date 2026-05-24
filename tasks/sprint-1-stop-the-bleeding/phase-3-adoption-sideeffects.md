# Phase 3 — Add `"sideEffects": false` to `@tour-kit/adoption` (B-5)

> **Goal:** Restore tree-shaking for `@tour-kit/adoption`. Every other package
> in the monorepo declares `"sideEffects": false`; adoption was missed.
>
> **Audit ID:** B-5 (HIGH).
> **Effort:** XS (one line + changeset).
> **Branch:** `sprint-1/phase-3-adoption-sideeffects`.
> **Bump:** patch (`@tour-kit/adoption` 2.1.3 → 2.1.4).
> **Independent** — no phase dependency.

## 1. Pre-conditions

- Working tree clean.
- `packages/adoption/package.json` currently lacks the `"sideEffects": false`
  line (verified at audit time on 2026-05-23; re-verify with grep below).

```bash
grep -n '"sideEffects"' packages/adoption/package.json || echo "MISSING — proceed"
```

If grep finds the line, B-5 has already been fixed elsewhere — close this
phase and move on.

## 2. The fix

### 2.1 Edit `packages/adoption/package.json`

Add `"sideEffects": false` immediately after the `"files"` line so it
matches the position used by every sibling package (search any other
`packages/*/package.json` to confirm — `analytics/package.json:98`,
`announcements/package.json`, etc.).

**Diff:**

```diff
   "files": ["dist"],
   "publishConfig": {
     "access": "public",
     "registry": "https://registry.npmjs.org/"
   },
+  "sideEffects": false,
   "scripts": {
     "build": "tsup",
```

> Why this position, not next to `"type": "module"` (per the audit
> recommendation)? Because every other package uses the post-`publishConfig`
> position. Consistency > audit specifics — the audit just said "near".

### 2.2 Use the repo convention: plain `false`

Adoption ships three CSS files (`./styles/variables.css`, `./styles/theme.css`,
`./styles/funnel.css`). In isolation, array form (`["**/*.css"]`) can be
reasonable. In this repo, every sibling package uses plain
`"sideEffects": false`, including packages with CSS exports (`media`, `react`,
`surveys`, `announcements`, `checklists`). Sprint 1 should follow that
existing convention.

Cross-check before editing:

```bash
grep -rn '"sideEffects"' packages/*/package.json
```

Expected result: all sibling packages use `false`; adoption is the only
missing package. If that has changed by the time you run the phase, copy the
new convention and update the changeset text.

## 3. Validation

### 3.1 Build

```bash
pnpm --filter @tour-kit/adoption clean
pnpm --filter @tour-kit/adoption build
```

Should be identical output to before — `"sideEffects"` is a metadata
field, not a build input.

### 3.2 Compare dist before/after

The dist itself should be byte-identical because tsup doesn't read this
field. The only effect is at consumer build time.

```bash
# This should return 0 (identical dist):
diff -r packages/adoption/dist/ <(git show main:packages/adoption/dist/) 2>/dev/null | wc -l
```

(The `git show` may fail because `dist/` is gitignored — that's fine,
just spot-check that the build completed.)

### 3.3 Tests

```bash
pnpm --filter @tour-kit/adoption test
```

Should be unaffected — this is purely a publish-metadata change.

### 3.4 Lint

```bash
pnpm lint
```

Biome's JSON formatter may want a trailing-comma or key-order tweak —
fix whatever it asks for.

## 4. Changeset

```bash
pnpm changeset
```

Select **`@tour-kit/adoption`** only. Pick **patch**. Description:

```
Add "sideEffects": false so bundlers can tree-shake unused exports.

Matches the convention used by sibling packages in the repo. No runtime code
or dist output changes.

Refs: audit B-5.
```

## 5. Commit + PR

```bash
git checkout -b sprint-1/phase-3-adoption-sideeffects
git add packages/adoption/package.json .changeset/
git commit -m "$(cat <<'EOF'
fix(adoption): add "sideEffects" field for tree-shaking

Every other package in the monorepo declares "sideEffects" so bundlers
can eliminate unused exports. Adoption was missed.

Refs: audit B-5.
EOF
)"
git push -u origin sprint-1/phase-3-adoption-sideeffects
gh pr create --title "fix(adoption): add sideEffects field (B-5)" --body "$(cat <<'EOF'
## Summary
- Add `"sideEffects": false` to `packages/adoption/package.json`.
- Matches the convention used by every other tour-kit package.
- Restores tree-shaking for consumers who import a subset of `@tour-kit/adoption` exports.

## Why
Without this field, bundlers must conservatively assume every import has
a side effect, defeating tree-shaking. The package's 19 named exports
all get pulled into the consumer bundle even if only `useAdoption` is used.

## Test plan
- [ ] CI green.
- [ ] Package builds.
- [ ] Existing tests pass.

Refs: audit B-5.
EOF
)"
```

## 6. Acceptance gates

- [ ] `grep -n '"sideEffects"' packages/adoption/package.json` returns a hit.
- [ ] `pnpm --filter @tour-kit/adoption build` green.
- [ ] `pnpm --filter @tour-kit/adoption test` green.
- [ ] CSS imports in adoption docs/examples still render (visual smoke check
      via `pnpm dev` in `apps/docs`).
- [ ] Changeset present.

## 7. Rollback

```bash
git revert <merge-commit-sha>
git push origin main
```

The risk surface is "consumer bundles incorrectly tree-shake an export
that had a hidden side effect we didn't know about." If that surfaces,
revert and then reintroduce a narrower `sideEffects` allow-list that covers
the offending file.

---

**Next (independent):** [phase-4-catalog-hygiene.md](phase-4-catalog-hygiene.md)

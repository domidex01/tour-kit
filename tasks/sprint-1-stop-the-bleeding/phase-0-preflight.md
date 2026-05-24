# Phase 0 — Pre-flight

> **Goal:** Establish a known-good baseline so every subsequent phase has a
> trustable comparison point. ~30 minutes, no PRs.

## 0.0 Validate the plan against the current repo

Before collecting baselines, confirm the plan still matches the workspace.
These checks catch the known stale assumptions from the original audit:

```bash
pnpm --version
node -p "require('./package.json').packageManager"
grep -n '"@amplitude/analytics-browser"' packages/analytics/package.json
grep -n '"sideEffects"' packages/adoption/package.json || true
[ -f .size-limit.json ] && echo "root size-limit config exists"
grep -R "version: 9" .github/workflows || true
```

Expected on the validated 2026-05-23 workspace:

- `packageManager` is `pnpm@10.26.1`.
- GitHub workflows still pin pnpm `9`; Phase 7 must align them.
- `.size-limit.json` already exists; Phase 7 tightens/replaces it.
- `packages/analytics` lists SDKs in `peerDependenciesMeta`, but the SDKs
  are missing from `peerDependencies`; Phase 1 fixes that.
- `packages/adoption/package.json` lacks `sideEffects`; Phase 3 adds plain
  `false` to match sibling packages.

### Local pnpm must match `packageManager`

If `pnpm --version` does not report `10.26.x`, enable corepack so the shell
shim resolves the version declared in `package.json`. Otherwise Phase 4's
lockfile-diff acceptance gate will produce a noisy diff that's just a pnpm
9 vs 10 resolution difference, not a real drift.

```bash
corepack enable
corepack prepare pnpm@10.26.1 --activate
pnpm --version   # expect 10.26.1
```

If corepack is not available (older Node), install pnpm 10 globally:
`npm i -g pnpm@10.26.1`. Do NOT continue with pnpm 9 — the Phase 4 gates
assume pnpm 10 behavior.

## 0.1 Confirm tree is clean

```bash
cd /home/domidex/projects/tour-kit
git status
git branch --show-current
```

Expected: working tree clean (or only intentional WIP), branch == `main` (or
an explicit sprint-1 base branch).

If dirty, **do not** stash + forget. Either commit on a side branch or note
the WIP in `tasks/sprint-1-stop-the-bleeding/wip.md` so a future you knows
why baseline numbers don't match.

## 0.2 Snapshot pre-fix bundle sizes

This is the comparison baseline used by every other phase. Save the output.

```bash
pnpm install --frozen-lockfile
pnpm build --filter='./packages/*'

mkdir -p tasks/sprint-1-stop-the-bleeding/baselines
{
  echo "# Bundle baseline — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo
  echo "| Package | dist/index.js (gz, B) | dist/index.js (raw, B) |"
  echo "|---------|----------------------:|-----------------------:|"
  for pkg in packages/*/; do
    name=$(basename "$pkg")
    f="$pkg/dist/index.js"
    if [ -f "$f" ]; then
      gz=$(gzip -c "$f" | wc -c)
      raw=$(wc -c < "$f")
      printf "| %s | %s | %s |\n" "$name" "$gz" "$raw"
    fi
  done
} > tasks/sprint-1-stop-the-bleeding/baselines/bundle-sizes.md
```

Cross-check the audit's "Bundle sizes" table:

- `core` ≈ 19 078 gz
- `analytics` ≈ 64 357 gz **(this is the offender)**
- `analytics/dist/plugins/amplitude.js` ≈ 62 000 gz (217 KB raw)
- `hints` ≈ 5 005 gz

If your numbers diverge by more than ±5 %, **stop and investigate** before
proceeding — either your tree is dirty, the catalog has drifted, or someone
merged a fix since 2026-05-23 (in which case re-read the audit for which
items are now stale).

## 0.3 Snapshot test coverage and pass rate

```bash
pnpm test --filter='./packages/*' 2>&1 | tee tasks/sprint-1-stop-the-bleeding/baselines/test-run.log
echo "Exit: $?"
```

Confirm every package passes today. Any pre-existing red test is **not**
your problem to fix in Sprint 1 — note it in the WIP file and skip it.

## 0.4 Verify the analytics SDK is actually inlined

This is the smoking gun for B-2. Confirm before fixing.

```bash
# Should find 10+ matches of @amplitude/plugin-* strings in the bundle:
grep -c '@amplitude/plugin-' packages/analytics/dist/plugins/amplitude.js

# Should find direct SDK function bodies (not just imports):
grep -c 'function.*amplitude' packages/analytics/dist/plugins/amplitude.js
```

If grep returns 0, B-2 has already been fixed by someone else — re-read the
audit, skip Phase 1, and start at Phase 2.

## 0.5 Verify the workflow files exist

```bash
ls .github/workflows/
# expect: ci.yml, link-check.yml, release.yml, size-limit.yml, smoke-npm.yml, test-npm-auth.yml
```

`size-limit.yml` is already present and already runs `pnpm exec size-limit`.
The root `.size-limit.json` also already exists, but the current budgets are
too permissive for Sprint 1. Phase 7 replaces/tightens that config and aligns
the workflow pnpm version with `packageManager`.

## 0.6 Decide on the analytics major-version number

`analytics` is currently `0.11.3`. **Linked-package config does NOT include
analytics** (verified at `.changeset/config.json:5` — only `core`, `react`,
`hints` are linked), so a major bump is local.

Per the pre-flight checklist in `sprint-1-roadmap.md`, decide:

- [ ] **Option A:** `0.11.3` → `0.12.0` (minor, treat the export removal as
      a "you shouldn't have been using these" cleanup). Risk: semver-strict
      consumers won't get pinned, but their builds break.
- [ ] **Option B:** `0.11.3` → `1.0.0` (proper major). Risk: signals stability
      we may not want for a 0.x lib.
- [ ] **Option C:** `0.11.3` → `0.12.0` and explicitly call it breaking in
      release notes. Same risk as A, but documented.

**Recommendation:** Option C. 0.x semver convention allows breaking changes
at minor bumps, and the audit calls analytics post-fix a 6 KB package — not
the kind of surface that should claim 1.0 stability yet. Document the
break loudly.

## 0.7 Snapshot installed lockfile state

```bash
cp pnpm-lock.yaml tasks/sprint-1-stop-the-bleeding/baselines/pnpm-lock.baseline.yaml
```

Phase 4 (catalog hygiene) asserts that `pnpm install` after the catalog move
produces **zero lockfile diff** against this baseline. If the diff is
non-empty, version resolution drifted — investigate before merging.

## 0.8 Snapshot the existing size-limit config

Phase 7 edits an existing root config. Preserve the pre-sprint config for
review and rollback context:

```bash
cp .size-limit.json tasks/sprint-1-stop-the-bleeding/baselines/size-limit.baseline.json
pnpm exec size-limit > tasks/sprint-1-stop-the-bleeding/baselines/size-limit.baseline.log
```

If `pnpm exec size-limit` fails before Sprint 1 changes, note the failure in
`wip.md` and continue; Phase 7 owns making the gate reliable.

---

## Acceptance gates

- [ ] `tasks/sprint-1-stop-the-bleeding/baselines/bundle-sizes.md` exists.
- [ ] `tasks/sprint-1-stop-the-bleeding/baselines/test-run.log` shows all
      packages passing.
- [ ] `tasks/sprint-1-stop-the-bleeding/baselines/pnpm-lock.baseline.yaml`
      exists.
- [ ] Existing `.size-limit.json` copied to
      `tasks/sprint-1-stop-the-bleeding/baselines/size-limit.baseline.json`.
- [ ] Decision recorded for analytics version bump (A/B/C in 0.6 above).
- [ ] No surprise discoveries — if the smoking-gun grep in 0.4 returns 0,
      pause and re-plan.

## Rollback

Nothing to roll back. Pre-flight does not modify the repo (only writes into
`tasks/sprint-1-stop-the-bleeding/baselines/`, which is ignored by every
phase from here on).

---

**Next:** [phase-1-analytics-tsup-fix.md](phase-1-analytics-tsup-fix.md)

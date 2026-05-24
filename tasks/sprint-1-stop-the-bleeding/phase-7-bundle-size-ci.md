# Phase 7 — Bundle-size CI gate (F-2)

> **Goal:** Wire `size-limit` into CI on every PR so a future B-2-class
> regression (someone adds a heavy import and forgets the tsup external)
> fails CI loudly within 5 minutes, not "in production six months later."
>
> **Audit ID:** F-2 (MEDIUM).
> **Effort:** M (tighten root size-limit config + align workflows).
> **Branch:** `sprint-1/phase-7-bundle-size-ci`.
> **Bump:** infra, no package version change.
> **Depends on:** Phases 1, 2, 3 merged (the budgets reflect post-fix numbers).

## 1. Pre-conditions

- Phases 1, 2, 3 are merged. **Critical:** if you set budgets while
  analytics is still 64 KB, you bake the bug in.
- `pnpm install` clean.
- `size-limit` 11.x is already in root devDependencies (verified in
  `package.json:70`).
- `@size-limit/preset-small-lib` is in root devDependencies
  (`package.json:60`).
- `.github/workflows/size-limit.yml` already exists and runs on PRs to
  main. It already runs `pnpm exec size-limit`.
- `/.size-limit.json` already exists, but the current budgets are too loose
  for Sprint 1 (for example analytics is currently allowed at hundreds of KB).
  This phase replaces/tightens the root config rather than creating the first
  config.
- GitHub workflows pin pnpm `9`, while `package.json` declares
  `pnpm@10.26.1`. Align workflows in this phase so CI uses the same package
  manager major as local validation.

## 2. Approach decision: size-limit vs custom script

The audit suggested either `size-limit` or a custom `tooling/check-bundle-sizes.mjs`.

**Go with size-limit.** Reasons:

- Already in devDependencies; the preset (`@size-limit/preset-small-lib`)
  is set up for libraries that ship dist/.
- `size-limit` is already in use through the existing root `.size-limit.json`
  and the `ai` package's local `.size-limit.json`.
- Outputs human-readable diffs and works with the existing
  `size-limit.yml` workflow.
- A custom script adds new code to maintain; size-limit's bug surface is
  already battle-tested.

Trade-off: size-limit doesn't compute a PR diff comment without
`andresz1/size-limit-action` (which the existing workflow comment notes
is broken). We accept "no diff comment" — the CI failure on budget
breach is the load-bearing behavior, and it works fine with the plain
CLI per the workflow's comment.

### 2.1 Metric correction from repo validation

Running the current root config with `pnpm exec size-limit` reports sizes as:

> `with all dependencies, minified and brotlied`

The audit table and Sprint-level acceptance gates use a different metric:

```bash
gzip -c packages/<pkg>/dist/index.js | wc -c
```

These differ by ~2× — do **not** paste the audit's 4 KB / 8 KB / 12 KB
raw-dist gzip budgets into `size-limit` without calibration.

### Load-bearing gate decision (binding)

**Sprint 1 picks one load-bearing gate:** the raw dist-gzip checker in §5.4.
It is the gate whose red status blocks a PR merge. `size-limit` is kept as a
**secondary smoke signal** that reports bundled-with-deps + brotli size, but
its budgets are calibrated independently and a `size-limit` red does NOT
block merge unless an owner explicitly opts the budget into the merge gate.

Reasons for picking the dist-gzip checker:

- The audit + Sprint-1 acceptance gates speak in raw dist-gzip bytes (`gzip
  -c packages/<pkg>/dist/index.js | wc -c`). The checker matches that unit
  1:1, so an audit number == a gate number, no calibration needed.
- It is one file (`tooling/bundle-check/check-dist-gzip.mjs`) with one budget
  table — easy to read, easy to bump, easy to grep.
- size-limit's bundled-size metric is more representative of what a consumer
  ships, but its numbers shift with every dependency bump in the catalog —
  too noisy for "did this PR regress?" without a baseline diff comment, which
  the existing workflow does not produce (see §2 trade-off note).

If you later decide to flip the priority (size-limit as merge gate,
dist-gzip as smoke), do it in a follow-up PR with a single calibration
exercise — do not run two binding gates in parallel.

## 3. Budget table

Budgets are derived from the audit's raw `dist/index.js` gzip measurements +
a 20 % headroom, with the two exceptions noted (core, hints) where we use the
audit's declared budget as a ceiling not yet enforced. Numbers in **bytes,
gzipped** and are intended for the custom dist-gzip gate from §2.1.

| Package          | Budget (gz B) | Current (gz B) | Headroom |
|------------------|--------------:|---------------:|---------:|
| core             | **20 000**    | 19 078         | ~5 % (TODO Sprint 2: shrink to <8 KB per B-1) |
| react            | 12 000        | 3 295          | 264 % |
| hints            | 5 120         | 5 005          | 2.3 % |
| analytics        | 4 000         | (post phase 2: ~3 KB) | ~30 % |
| adoption         | 10 000        | 8 456          | 18 % |
| checklists       | 10 000        | 8 521          | 17 % |
| announcements    | 8 000         | 6 489          | 23 % |
| surveys          | 8 000         | 6 484          | 23 % |
| media            | 6 000         | 4 570          | 31 % |
| ai               | 5 000         | 4 270          | 17 % |
| scheduling       | 4 000         | 3 509          | 14 % |
| license          | 8 000         | 7 016          | 14 % |

`codemods`, `playwright`, `testing-library` excluded — codemods is a
CLI-only package, playwright is e2e helpers, testing-library is test
helpers. None are perf-critical for end-user bundles. (If you want, add
them with generous budgets later — Sprint 2 nice-to-have.)

### 3.1 The core exception

`core` is currently 19 078 gz vs the documented `<8 KB` CLAUDE.md budget.
The right thing is to fix `core` (B-1). The wrong thing is to either:

- Set the size-limit budget to 8 KB → CI red on every PR until B-1 lands.
- Quietly delete the 8 KB number from CLAUDE.md → loses the historical
  intent.

**Compromise:** set the enforced root size-limit budget to **20 000** for
core, and make the temporary status visible in the entry name:

```json
[
  {
    "name": "core (temporary 20 KB ceiling; target <8 KB in B-1)",
    "path": "packages/core/dist/index.js",
    "limit": "20 KB",
    "gzip": true
  }
]
```

Keep the longer rationale in `CLAUDE.md` and the Sprint-2 issue. Do not rely
on comments inside `.size-limit.json`.

## 4. Do not add per-package `.size-limit.json` files

Earlier drafts proposed creating one `.size-limit.json` per package. Do not do
that in Sprint 1. The repo already has a root `.size-limit.json`, and CI runs
`pnpm exec size-limit` from the root. Adding per-package configs would create
two sources of truth unless we also added custom aggregation logic.

Keep `packages/ai/.size-limit.json` as package-local documentation for now, but
make the root config the enforced CI source of truth.

If the team chooses the recommended dist-gzip gate, the enforced budget table
belongs in the custom checker, not only in `/.size-limit.json`.

### 4.1 Historical template, do not apply

```json
[
  {
    "name": "main",
    "path": "dist/index.js",
    "limit": "<budget> B",
    "gzip": true
  }
]
```

For example, do **not** create `packages/analytics/.size-limit.json`; put the
analytics entries in the root config instead:

```json
[
  {
    "name": "main",
    "path": "dist/index.js",
    "limit": "4000 B",
    "gzip": true
  }
]
```

### 4.2 Multi-entry template (analytics + adoption)

`analytics` should also gate each plugin subpath so a regression in
`./posthog` doesn't slip through:

```json
[
  { "name": "main",       "path": "dist/index.js",                       "limit": "4000 B", "gzip": true },
  { "name": "console",    "path": "dist/plugins/console.js",             "limit": "1000 B", "gzip": true },
  { "name": "posthog",    "path": "dist/plugins/posthog.js",             "limit": "1500 B", "gzip": true },
  { "name": "mixpanel",   "path": "dist/plugins/mixpanel.js",            "limit": "1500 B", "gzip": true },
  { "name": "amplitude",  "path": "dist/plugins/amplitude.js",           "limit": "1000 B", "gzip": true },
  { "name": "ga",         "path": "dist/plugins/google-analytics.js",    "limit": "1000 B", "gzip": true }
]
```

> **Update the plugin numbers** after Phase 2 lands — pick the actual
> measured size + 30 % headroom. Do not guess.

`adoption` has tailwind + style subpaths but those are CSS, not JS — no
size-limit entry needed.

### 4.3 `ai` already has a config

`packages/ai/.size-limit.json` exists. Reconcile against the audit:

- Current: `client` 15 KB, `server` 8 KB.
- Audit measurement: `dist/index.js` 4 270 gz.

The existing 15 KB is too loose. Either tighten it for local package owners or
leave it as documentation, but make sure the root `/.size-limit.json` enforces
the 5 KB client budget:

```json
[
  { "name": "client", "path": "dist/index.js",        "limit": "5000 B", "gzip": true },
  { "name": "server", "path": "dist/server/index.js", "limit": "8000 B", "gzip": true }
]
```

### 4.4 Files not to create

```
packages/core/.size-limit.json
packages/react/.size-limit.json
packages/hints/.size-limit.json
packages/analytics/.size-limit.json
packages/adoption/.size-limit.json
packages/checklists/.size-limit.json
packages/announcements/.size-limit.json
packages/surveys/.size-limit.json
packages/media/.size-limit.json
packages/scheduling/.size-limit.json
packages/license/.size-limit.json

# Already exists, needs tightening:
packages/ai/.size-limit.json
```

Do not add the new files above unless the team explicitly chooses a JS
aggregator in §5.2.

## 5. Glue: root size-limit must discover all packages

`size-limit` runs from the repo root in CI. Keep one enforced root config.
Two options were considered:

### 5.1 Option A — single root `.size-limit.json` (recommended)

A flat list of every package's entry. Simpler operationally. Replace the
existing `/.size-limit.json` at the monorepo root with:

> Use this only for the size-limit side of the gate. Its numbers must be
> recalibrated from `pnpm exec size-limit` output if you keep size-limit as an
> enforced check. Do not use the raw dist-gzip table blindly here.

```json
[
  { "name": "core (temporary 20 KB ceiling; target <8 KB in B-1)", "path": "packages/core/dist/index.js", "limit": "20000 B", "gzip": true },
  { "name": "core (useTour-only consumer)", "path": "packages/core/dist/index.js", "import": "{ useTour }", "limit": "8000 B", "gzip": true },
  { "name": "core/schemas",               "path": "packages/core/dist/schemas/index.js",                  "limit": "12000 B", "gzip": true, "ignore": ["zod"] },
  { "name": "react",                      "path": "packages/react/dist/index.js",                           "limit": "12000 B", "gzip": true },
  { "name": "hints",                      "path": "packages/hints/dist/index.js",                           "limit": "5120 B",  "gzip": true },
  { "name": "analytics:main",             "path": "packages/analytics/dist/index.js",                       "limit": "4000 B",  "gzip": true },
  { "name": "analytics:console",          "path": "packages/analytics/dist/plugins/console.js",             "limit": "1000 B",  "gzip": true },
  { "name": "analytics:posthog",          "path": "packages/analytics/dist/plugins/posthog.js",             "limit": "1500 B",  "gzip": true },
  { "name": "analytics:mixpanel",         "path": "packages/analytics/dist/plugins/mixpanel.js",            "limit": "1500 B",  "gzip": true },
  { "name": "analytics:amplitude",        "path": "packages/analytics/dist/plugins/amplitude.js",           "limit": "1000 B",  "gzip": true },
  { "name": "analytics:ga",               "path": "packages/analytics/dist/plugins/google-analytics.js",    "limit": "1000 B",  "gzip": true },
  { "name": "adoption",                   "path": "packages/adoption/dist/index.js",                        "limit": "10000 B", "gzip": true },
  { "name": "checklists",                 "path": "packages/checklists/dist/index.js",                      "limit": "10000 B", "gzip": true },
  { "name": "announcements",              "path": "packages/announcements/dist/index.js",                   "limit": "8000 B",  "gzip": true },
  { "name": "surveys",                    "path": "packages/surveys/dist/index.js",                         "limit": "8000 B",  "gzip": true },
  { "name": "media",                      "path": "packages/media/dist/index.js",                           "limit": "6000 B",  "gzip": true },
  { "name": "ai:client",                  "path": "packages/ai/dist/index.js",                              "limit": "5000 B",  "gzip": true },
  { "name": "ai:server",                  "path": "packages/ai/dist/server/index.js",                       "limit": "8000 B",  "gzip": true },
  { "name": "scheduling",                 "path": "packages/scheduling/dist/index.js",                      "limit": "4000 B",  "gzip": true },
  { "name": "license",                    "path": "packages/license/dist/index.js",                         "limit": "8000 B",  "gzip": true }
]
```

**Preserved entries from the pre-sprint config (do not drop):**

- `core (useTour-only consumer)` with `import: "{ useTour }"` — measures
  what a consumer who only imports `useTour` actually ships. This is the
  one entry that catches "someone added a top-level side effect that broke
  consumer tree-shaking" regressions; tightened from `8 KB` to `8000 B` to
  match the dist-gzip unit table.
- `core/schemas` with `ignore: ["zod"]` — measures the schemas subpath
  without the zod payload. Useful because zod versions shift independently.

If either of these entries was renamed or repurposed between 2026-05-23 and
your branch, reconcile before replacing the config — do not silently drop
them.

Pros: one file, one source of truth, no glob discovery flakiness, matches the
workflow that already runs from the repo root.
Cons: per-package owners can't edit their budget without touching the
root file.

### 5.2 Option B — per-package configs + size-limit globbing

Trickier. size-limit doesn't natively glob workspace configs; you'd
need to copy/import them in JS:

```js
// .size-limit.js (at root)
import core from './packages/core/.size-limit.json' with { type: 'json' }
import react from './packages/react/.size-limit.json' with { type: 'json' }
// ...
export default [
  ...core.map(c => ({ ...c, path: `packages/core/${c.path}`, name: `core:${c.name}` })),
  // ...
]
```

Pros: per-package ownership.
Cons: 12 imports + path-rewrite logic to maintain.

**Go with Option A.** The root file is the one CI actually checks.

> If you DO go with Option B, delete the per-package files in §4 to
> avoid two-sources-of-truth drift. Pick one.

### 5.3 Recommendation: Option A as the single source of truth

Skip §4 entirely. Only create the root `.size-limit.json`. Document the
per-package budgets in CLAUDE.md (per audit G-8) so package owners can
look up their target without grepping the root config.

**Adopting recommendation §5.3 changes §4 to:** do not create per-package
configs. The 11 new files listed in §4.4 are unnecessary.

### 5.4 Add the raw dist-gzip checker

Create `tooling/bundle-check/check-dist-gzip.mjs`. It should:

1. Define the Sprint-1 raw dist gzip budget table from §3.
2. Read each built `dist/*.js` file.
3. `gzipSync` the file contents with Node's `zlib`.
4. Print actual vs budget for every entry.
5. Exit non-zero if any actual size exceeds its budget.

Minimum entries:

```js
const budgets = [
  ['core', 'packages/core/dist/index.js', 20000],
  ['react', 'packages/react/dist/index.js', 12000],
  ['hints', 'packages/hints/dist/index.js', 5120],
  ['analytics:main', 'packages/analytics/dist/index.js', 4000],
  ['analytics:console', 'packages/analytics/dist/plugins/console.js', 1000],
  ['analytics:posthog', 'packages/analytics/dist/plugins/posthog.js', 1500],
  ['analytics:mixpanel', 'packages/analytics/dist/plugins/mixpanel.js', 1500],
  ['analytics:amplitude', 'packages/analytics/dist/plugins/amplitude.js', 1000],
  ['analytics:ga', 'packages/analytics/dist/plugins/google-analytics.js', 1000],
  ['adoption', 'packages/adoption/dist/index.js', 10000],
  ['checklists', 'packages/checklists/dist/index.js', 10000],
  ['announcements', 'packages/announcements/dist/index.js', 8000],
  ['surveys', 'packages/surveys/dist/index.js', 8000],
  ['media', 'packages/media/dist/index.js', 6000],
  ['ai:client', 'packages/ai/dist/index.js', 5000],
  ['ai:server', 'packages/ai/dist/server/index.js', 8000],
  ['scheduling', 'packages/scheduling/dist/index.js', 4000],
  ['license', 'packages/license/dist/index.js', 8000],
]
```

Use this checker for the audit/Sprint acceptance budgets. Use `size-limit` for
its separate bundled-size signal.

## 6. Update `CLAUDE.md` budget section

Per audit G-8, the budget table currently lives only in CLAUDE.md for
`core`/`react`/`hints`. Extend it. Edit the **Quality Gates** section:

```diff
 ### Quality Gates
 
 - TypeScript strict mode enabled
 - Test coverage > 80%
-- Bundle sizes: core < 8KB, react < 12KB, hints < 5KB (gzipped)
+- Bundle sizes (gzipped): see [`/.size-limit.json`](/.size-limit.json) for
+  the enforced budgets. Targets at the time of writing:
+  - core <20 KB (target <8 KB; tracked as audit B-1)
+  - react <12 KB
+  - hints <5 KB
+  - analytics <4 KB (root; per-plugin <1.5 KB each)
+  - adoption, checklists <10 KB
+  - announcements, surveys, license <8 KB
+  - media <6 KB
+  - ai <5 KB (client), <8 KB (server)
+  - scheduling <4 KB
 - Lighthouse Accessibility: 100
 - WCAG 2.1 AA compliant
```

## 7. CI workflow integration

### 7.1 `.github/workflows/size-limit.yml` — already correct

The existing workflow runs on every PR to main. After §5.1 lands, the
plain `pnpm exec size-limit` call (line 42 of the workflow) will pick up
the root `.size-limit.json` and check all 18 entries. **No workflow
command edits required.**

But update the pnpm setup version to match `package.json`:

```diff
       - name: Setup pnpm
         uses: pnpm/action-setup@v3
         with:
-          version: 9
+          version: 10.26.1
```

Apply the same pnpm version alignment in `ci.yml`, `release.yml`, and
`smoke-npm.yml`.

Verify by inspecting the file once more:

```bash
cat .github/workflows/size-limit.yml
```

Update the "Check size" step to run both metrics:

```yaml
      - name: Check size
        run: |
          pnpm exec size-limit
          pnpm dist:size
```

### 7.2 `.github/workflows/ci.yml` — re-enable the disabled job (optional)

Lines 58–60 of `ci.yml` have a commented-out `size` job with a
`TODO: Re-enable when tooling/bundle-check package exists`. The
`tooling/bundle-check` package exists (verified at `tooling/bundle-check/`)
and the dedicated `size-limit.yml` workflow handles the gate.

**Recommendation:** delete the commented block in `ci.yml` rather than
re-enable it. Don't duplicate work. Update the line to a one-line
comment pointing at `size-limit.yml`:

```diff
-  # TODO: Re-enable when tooling/bundle-check package exists
-  # size:
-  #   name: Bundle Size Check
-  #   ...
+  # Bundle size gate runs in .github/workflows/size-limit.yml on every PR.
```

### 7.3 Add a turbo task (optional, dev ergonomics)

So devs can run the same check locally:

```diff
 // turbo.json
   "tasks": {
     // ...
     "size": {
       "dependsOn": ["build"],
       "outputs": []
-    }
+    },
+    "bundlesize": {
+      "dependsOn": ["^build", "build"],
+      "cache": false,
+      "outputs": []
+    }
```

Then add a root script:

```diff
 // package.json
     "bench:core": "turbo run bench --filter=@tour-kit/core",
+    "bundlesize": "pnpm build --filter='./packages/*' && pnpm exec size-limit",
+    "dist:size": "pnpm build --filter='./packages/*' && node tooling/bundle-check/check-dist-gzip.mjs",
     "e2e": "playwright test",
```

Devs can now run `pnpm bundlesize` and `pnpm dist:size` locally to validate
both metrics before pushing.

## 8. Validation

### 8.1 Run locally

```bash
pnpm install
pnpm build --filter='./packages/*'
pnpm exec size-limit
node tooling/bundle-check/check-dist-gzip.mjs
```

Every line should be green. If any package is over budget:

- If it's `core` and you set budget at 20 KB, OK.
- If it's `analytics` and you're seeing ≥ 8 KB, Phase 1 didn't merge.
  Stop and check.
- Otherwise: investigate why the package grew; either fix the regression
  or document why the budget is wrong.

### 8.2 Verify the gate fails when expected

Temporarily make a package exceed its budget to prove the gate works:

```bash
# Add 5 KB of garbage to media:
echo 'export const __test = "AAAAA...(repeat 5000 times)"' >> packages/media/src/index.ts
pnpm --filter @tour-kit/media build
pnpm exec size-limit
echo "Exit: $?"
# Expect: non-zero exit, "media" line shows OVER budget.

# Revert:
git checkout packages/media/src/index.ts
pnpm --filter @tour-kit/media build
```

If the gate didn't fail, the config is wrong — fix before merging.

### 8.3 CI run

Push the branch; the `size-limit.yml` workflow should run on the PR.
Click into the workflow logs and verify every entry is reported.

## 9. Commit + PR

```bash
git checkout -b sprint-1/phase-7-bundle-size-ci

git add .size-limit.json CLAUDE.md .github/workflows/ci.yml \
        .github/workflows/size-limit.yml .github/workflows/release.yml \
        .github/workflows/smoke-npm.yml turbo.json package.json \
        tooling/bundle-check/check-dist-gzip.mjs

# (Do NOT add new packages/*/.size-limit.json files — we chose option A.)

git commit -m "$(cat <<'EOF'
chore(ci): enforce bundle-size budgets across all published packages

Adds a raw dist-gzip checker for the Sprint-1 audit budgets and tightens
the existing root size-limit gate for the bundled-size metric. The existing
size-limit.yml workflow already runs on every PR — this commit makes the
bundle-size checks meaningful and documented.

Budgets are based on the 2026-05-23 audit measurements plus 20%
headroom, with the explicit exception of core: it currently exceeds
its CLAUDE.md target (8 KB) at 19 KB gz, so the CI gate is set to
20 KB to avoid blocking every PR. Tightening core to <8 KB is tracked
as audit B-1 / Sprint 2.

Refs: audit F-2.
EOF
)"

git push -u origin sprint-1/phase-7-bundle-size-ci

gh pr create --title "chore(ci): bundle-size gate for all published packages (F-2)" --body "$(cat <<'EOF'
## Summary
- Root `.size-limit.json` with budgets for 12 packages / 18 dist entries.
- `tooling/bundle-check/check-dist-gzip.mjs` for audit-style raw dist gzip
  budgets.
- Updated CLAUDE.md "Quality Gates" section with the budget table.
- Removed stale `TODO: Re-enable...` block from `ci.yml` (the size gate now lives in `size-limit.yml`).
- Aligned GitHub workflow pnpm setup with `packageManager`.
- Added `pnpm bundlesize` / `pnpm dist:size` root scripts for local validation.

## Why
B-2 (analytics +58 KB raw dist gzip) would have failed CI on the PR that
introduced it. This commit ensures the next B-2-class regression does.

## Budget rationale
- Dist-gzip budgets = audit measurement × 1.2.
- Size-limit budgets are calibrated separately because size-limit reports
  bundled, minified, brotlied output with dependencies.
- `core` budget is **20 KB**, NOT the CLAUDE.md target of 8 KB. We're
  preserving the 8 KB target as the goal but not blocking all PRs until
  audit B-1 (subpath extraction) lands. Documented inline.
- `analytics` budget reflects the post-Phase-1+2 size, not the pre-fix
  64 KB.

## Test plan
- [ ] `pnpm exec size-limit` passes locally on all 18 entries.
- [ ] `pnpm dist:size` passes locally against raw dist gzip budgets.
- [ ] Temporary 5 KB padding in any package fails the gate (verified locally, reverted).
- [ ] CI `Size Limit` job green on this PR.
- [ ] No false positives — every reported size is consistent with the audit's table.

Refs: audit F-2. Depends on phases 1, 2, 3.
EOF
)"
```

## 10. Acceptance gates (hard)

- [ ] `/.size-limit.json` exists at the monorepo root.
- [ ] `pnpm exec size-limit` exits 0 against current `main` + this branch's
      builds.
- [ ] The raw dist-gzip checker exits 0 and uses the Sprint-1 budget table.
- [ ] The PR clearly documents whether `size-limit` budgets are calibrated
      bundled-size budgets or whether `size-limit` is only a secondary smoke
      gate.
- [ ] CLAUDE.md "Quality Gates" section updated with the full budget table.
- [ ] `.github/workflows/ci.yml` stale TODO comment removed (or replaced
      with a pointer to size-limit.yml).
- [ ] `.github/workflows/{ci,size-limit,release,smoke-npm}.yml` use the same
      pnpm version as `package.json`.
- [ ] `pnpm bundlesize` script works locally (smoke test).
- [ ] CI `Size Limit` job green on the PR.
- [ ] Temporarily exceeding any budget makes the gate red (validated locally).

## 11. Rollback

```bash
git revert <merge-commit-sha>
git push origin main
```

If the gate is too strict (a legitimate change is blocked), don't revert
— bump the relevant budget in `.size-limit.json` in a follow-up PR with
justification in the commit message.

If the gate is broken (false negatives — fails when it shouldn't), the
revert is safe; the existing `size-limit.yml` workflow without a config
file is the pre-state, which was a no-op.

## 12. Follow-up tracking (for Sprint 2)

After merge, file an issue: "Tighten core size budget from 20 KB to 8 KB
once B-1 subpath extraction lands." Tag it with `sprint-2`, `audit-B-1`.

Don't let the 20 KB ceiling become permanent.

---

**Next:** [phase-8-release.md](phase-8-release.md)

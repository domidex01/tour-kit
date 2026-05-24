# Phase 7 — Testing: Bundle-Size CI Gate (F-2)

**Scope:** `/.size-limit.json` (replace with calibrated entries for all 12
packages / 18 dist files), `tooling/bundle-check/check-dist-gzip.mjs` (new
raw dist-gzip checker = the binding merge gate), `CLAUDE.md` Quality Gates
section (extended budget table), `.github/workflows/{ci,size-limit,release,smoke-npm}.yml`
(align pnpm version to 10.26.1), `turbo.json` (`bundlesize` task),
root `package.json` (`bundlesize` + `dist:size` scripts).
**Phase type:** **Infra / CI.** Two gates running in parallel: (a) the
custom dist-gzip checker is the **load-bearing merge gate**, and (b)
`size-limit` is the secondary smoke signal. The test plan exercises BOTH:
green path + a deliberate failure injection (US-6) that proves the gate
actually trips on a regression.
**Key Pattern:** Positive gate (green on current builds) + negative gate
(synthetic 5 KB padding makes the gate red, then reverts cleanly). No
vitest changes. The "test" is "does CI fail when I break the budget."
**Dependencies:** `pnpm`, `node`, `gzip`, the post-Phase-1+2+3 dist files,
`size-limit` 11.x (already installed), the new `tooling/bundle-check`
checker.

---

## User Stories

| #    | User Story                                                                                                                          | Validation Check                                                                                                                | Pass Condition                                                                              |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| US-1 | As a CI engineer, I want a future B-2-class regression (someone adds a heavy import, forgets the external) to fail CI loudly within 5 minutes. | `tooling/bundle-check/check-dist-gzip.mjs` exits non-zero when any package's `dist/index.js` exceeds its budget                | Exit non-zero on synthetic overrun (US-6); exit 0 on current main                          |
| US-2 | As a release engineer, I want every published package gated — not just `core/react/hints`.                                          | `.size-limit.json` has entries for all 12 published packages (excluding codemods/playwright/testing-library)                    | ≥ 18 entries; covers core, react, hints, analytics, adoption, checklists, announcements, surveys, media, ai, scheduling, license |
| US-3 | As a maintainer, I want the dist-gzip checker to be the binding merge gate; size-limit is informational only.                       | `size-limit.yml` workflow runs `pnpm dist:size` (the binding gate) and `pnpm exec size-limit` (informational)                   | Workflow runs both; only `dist:size` non-zero exit fails the job                            |
| US-4 | As a devops engineer, I want every GitHub workflow to use the same pnpm major as `package.json` so local and CI behavior match.     | `grep "version: 10" .github/workflows/*.yml` for every workflow that does `pnpm/action-setup`                                   | All 4 workflows pin pnpm `10.26.1` (was `9`)                                                |
| US-5 | As a docs reader, I want `CLAUDE.md` to list the current budget per package — not just core/react/hints.                            | `grep -E "Bundle sizes \(gzipped\)" CLAUDE.md` shows the extended table                                                          | Table mentions analytics, adoption, checklists, announcements, surveys, media, ai, scheduling, license |
| US-6 | As a CI engineer, I want proof the gate fires: I can deliberately exceed a budget and the gate goes red.                            | Inject 5 KB padding into `packages/media/src/index.ts`, rebuild, run gate                                                       | Gate exits non-zero with `media OVER` line; revert restores green                            |
| US-7 | As a dev, I want `pnpm bundlesize` and `pnpm dist:size` to work locally so I can pre-check before pushing.                          | `pnpm bundlesize` and `pnpm dist:size` script entries exist in root `package.json`                                              | Both run end-to-end and exit 0 on current state                                              |
| US-8 | As a maintainer reading `.github/workflows/ci.yml`, I don't want stale TODOs about disabled jobs.                                    | `grep "TODO: Re-enable when tooling/bundle-check" ci.yml` or its replacement comment                                            | Either deleted or replaced with a pointer to `size-limit.yml`                                |

---

## Component Mock Strategy

| Component                              | Mock Strategy                                              | What to Assert                                                                            | User Story  |
| -------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------- |
| `check-dist-gzip.mjs` (new)            | None — real `gzipSync` + real dist                         | Exits 0 on green; exits non-zero with a labeled OVER line on overrun                       | US-1, US-2, US-6 |
| `/.size-limit.json`                    | None — JSON read                                           | ≥ 18 entries covering 12 packages; size-limit can run them                                 | US-2        |
| `size-limit.yml` workflow              | None — YAML read                                           | Runs both `pnpm exec size-limit` and `pnpm dist:size` (or equivalent)                      | US-3        |
| Workflow pnpm version                  | None — grep                                                | All 4 workflows pin `10.26.1`                                                              | US-4        |
| `CLAUDE.md` budget table               | None — grep                                                | Table includes all production packages                                                     | US-5        |
| Negative regression test (US-6)        | Synthetic 5 KB string appended to `packages/media/src/index.ts` | Gate exits non-zero; `media OVER` line in output; revert restores                       | US-6        |
| Root `package.json` scripts            | None — JSON read                                           | `bundlesize` + `dist:size` scripts present                                                 | US-7        |

---

## Test Tier Table

| Tier             | Dependencies                                              | Speed     | When to Run                              |
| ---------------- | --------------------------------------------------------- | --------- | ---------------------------------------- |
| Shape gate       | `node`, `grep`, `test`                                    | < 2 s     | Pre-PR, in `verify-phase-7.sh`           |
| Positive gate    | All packages built; checker run                            | ~3 min    | Pre-PR + on CI                            |
| Negative gate    | Synthetic 5 KB inject → rebuild → checker → revert         | ~1 min    | Pre-PR (US-6, one-shot)                  |
| Workflow alignment| `grep` over `.github/workflows/*.yml`                     | < 1 s     | Pre-PR                                    |
| CI smoke         | Push branch, watch `size-limit` workflow                  | ~5 min    | After Phase 7 PR pushed                  |

No vitest. The "test" infrastructure itself is bash + node.

---

## No Fake Implementations (Infra Phase)

The checker exercises real `gzipSync` against real dist files. Mocking
either would erase the contract we want to gate. The "negative test"
(US-6) is a real change-then-revert: we *want* the checker to fail
against a real regression in real dist bytes, not against a stub.

The only "test code" we write is the asserter (`verify-phase-7.sh`) and
the `check-dist-gzip.mjs` checker itself.

---

## Test File List

```
/.size-limit.json                            # MODIFIED — calibrated 18-entry table

tooling/bundle-check/
└── check-dist-gzip.mjs                      # NEW — the binding gate

CLAUDE.md                                    # MODIFIED — extended Quality Gates budget table

.github/workflows/
├── ci.yml                                   # MODIFIED — pnpm 10.26.1, stale TODO removed
├── size-limit.yml                           # MODIFIED — pnpm 10.26.1, runs both gates
├── release.yml                              # MODIFIED — pnpm 10.26.1
└── smoke-npm.yml                            # MODIFIED — pnpm 10.26.1

turbo.json                                   # MODIFIED — +bundlesize task
package.json                                 # MODIFIED — +bundlesize + dist:size scripts

tasks/sprint-1-stop-the-bleeding/
└── verify-phase-7.sh                        # NEW — full gate runner

# Out of scope (verify NOT created — Option A per §5.3 of phase plan):
packages/core/.size-limit.json               # MUST NOT EXIST
packages/react/.size-limit.json              # MUST NOT EXIST
# ... (every per-package .size-limit.json except the existing packages/ai/.size-limit.json)
```

---

## The Asserter Skeleton

```bash
#!/usr/bin/env bash
# tasks/sprint-1-stop-the-bleeding/verify-phase-7.sh
# Run after Phases 1–3 are merged + Phase 7 edits applied + build green.
set -u
fails=0
gate() { if eval "$1"; then echo "✓ $2"; else echo "✗ $2 — $(eval "$3")"; fails=$((fails+1)); fi; }

# US-2: root .size-limit.json exists, has ≥ 18 entries
gate '[ -f .size-limit.json ]' 'US-2: /.size-limit.json exists' "echo missing"
n=$(node -e "const a=require('./.size-limit.json'); console.log(Array.isArray(a) ? a.length : 0)")
gate "[ $n -ge 18 ]" "US-2: .size-limit.json has ≥ 18 entries (got $n)" "echo $n"

# US-2: critical packages covered
for pkg in core react hints analytics adoption checklists announcements surveys media ai scheduling license; do
  gate "node -e \"const a=require('./.size-limit.json'); process.exit(a.some(e=>(e.name||'').includes('$pkg') || (e.path||'').includes('packages/$pkg/')) ? 0 : 1)\"" \
       "US-2: budget entry for $pkg" "echo missing"
done

# US-1, US-2: checker exists + runs green on current build
gate '[ -f tooling/bundle-check/check-dist-gzip.mjs ]' \
     'US-1: check-dist-gzip.mjs exists' "echo missing"
gate 'node tooling/bundle-check/check-dist-gzip.mjs >/tmp/phase-7-dist-size.log 2>&1' \
     'US-1: dist-gzip checker green on current build' "tail -n20 /tmp/phase-7-dist-size.log"

# Side gate: size-limit also green (informational, but should pass)
gate 'pnpm exec size-limit >/tmp/phase-7-size-limit.log 2>&1' \
     'US-3: pnpm exec size-limit green' "tail -n20 /tmp/phase-7-size-limit.log"

# US-3: workflow runs both metrics
gate 'grep -q "pnpm dist:size\|node tooling/bundle-check" .github/workflows/size-limit.yml' \
     'US-3: size-limit.yml runs dist-gzip checker' "grep -n run .github/workflows/size-limit.yml"
gate 'grep -q "pnpm exec size-limit" .github/workflows/size-limit.yml' \
     'US-3: size-limit.yml runs size-limit' "grep -n run .github/workflows/size-limit.yml"

# US-4: all workflows pin pnpm 10.x
for wf in ci size-limit release smoke-npm; do
  gate "grep -E 'version: *10\\.' .github/workflows/$wf.yml >/dev/null 2>&1 || ! grep 'pnpm/action-setup' .github/workflows/$wf.yml >/dev/null 2>&1" \
       "US-4: $wf.yml uses pnpm 10.x (or no pnpm setup)" "grep -B 1 -A 1 'pnpm/action-setup' .github/workflows/$wf.yml"
done

# US-5: CLAUDE.md budget table extended
gate 'grep -qE "Bundle sizes \\(gzipped\\)" CLAUDE.md' \
     'US-5: CLAUDE.md mentions extended budget table' "echo missing"
gate 'grep -q "analytics <" CLAUDE.md && grep -q "adoption" CLAUDE.md' \
     'US-5: CLAUDE.md table lists more than core/react/hints' "grep -A 15 'Bundle sizes' CLAUDE.md"

# US-7: scripts present
gate 'node -e "const p=require(\"./package.json\"); process.exit(p.scripts?.bundlesize && p.scripts?.[\"dist:size\"] ? 0 : 1)"' \
     'US-7: package.json has bundlesize + dist:size scripts' "echo missing"

# US-8: stale TODO replaced
gate '! grep -q "TODO: Re-enable when tooling/bundle-check" .github/workflows/ci.yml' \
     'US-8: ci.yml has no stale "Re-enable" TODO' "grep -n 'Re-enable' .github/workflows/ci.yml"

# Sanity: option A (single root config) — no per-package .size-limit.json except ai
extra=$(ls packages/*/.size-limit.json 2>/dev/null | grep -v 'packages/ai/' | wc -l | tr -d ' ')
gate "[ $extra -eq 0 ]" "Single source of truth: no extra per-package .size-limit.json (got $extra)" \
     "ls packages/*/.size-limit.json | grep -v 'packages/ai/'"

[ "$fails" -eq 0 ] || { echo "Phase 7 FAILED gates: $fails"; exit 1; }
echo "Phase 7 all gates green."
```

---

## US-6: Negative-Test Procedure

The most important Phase 7 validation: prove the gate fires when budgets
are exceeded. Run this **once**, manually, immediately before opening the PR.

```bash
# 1. Confirm gate is green right now
node tooling/bundle-check/check-dist-gzip.mjs
echo "Pre-injection exit: $?"   # Must be 0

# 2. Inject 5 KB of padding into media
python3 -c "print('export const __padding = \"' + ('A' * 5000) + '\";')" >> packages/media/src/index.ts

# 3. Rebuild media
pnpm --filter @tour-kit/media build

# 4. Run the gate — MUST fail with `media` line
node tooling/bundle-check/check-dist-gzip.mjs
echo "Post-injection exit: $?"  # Must be non-zero

# 5. Revert and rebuild
git checkout packages/media/src/index.ts
pnpm --filter @tour-kit/media build

# 6. Confirm green again
node tooling/bundle-check/check-dist-gzip.mjs
echo "Post-revert exit: $?"      # Must be 0
```

In the PR description, paste the three exit codes (0, non-zero, 0) as
proof.

---

## Key Testing Decisions

| Decision                                                          | Approach                                                      | Rationale                                                                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Two gates running, one binding                                    | dist-gzip = merge gate; size-limit = smoke                    | The audit + Sprint-1 acceptance speak in raw dist-gzip bytes. size-limit's bundled-size metric is useful but ~2× the unit; running both with one binding avoids unit-conversion ceremony. (Phase plan §2.1 + §2's "Load-bearing gate decision".) |
| Negative test is a real inject-revert, not a stub                  | Append 5 KB string, rebuild, run, revert, rebuild              | A stubbed "what if dist was 25 KB" test mocks the very thing the gate cares about. Inject-revert exercises the full real path. Cost: ~1 minute. |
| US-6 is a one-shot, not part of CI                                | Run manually before PR; paste exit codes                      | Running the inject-revert on every CI run would slow CI and confuse the test report. The PR description IS the evidence. |
| Core budget set to 20 KB, not 8 KB                                 | Document in the entry name + CLAUDE.md                         | core is currently 19 KB gz. Setting the gate to 8 KB blocks every PR until B-1 (Sprint 2) lands. The 20 KB ceiling preserves the audit number AND the historical 8 KB target. |
| Don't create per-package `.size-limit.json` files                  | Single root config (Option A per phase plan §5.3)              | Two sources of truth invite drift. The root file is what CI actually reads.                                              |
| Allow `packages/ai/.size-limit.json` to stay                       | Local package documentation only                              | It exists already, doesn't drive the gate (root config does). Removing it from this PR is out of scope.                  |
| Test the workflow change by grep, not by triggering CI            | `grep -E 'version: *10\\.' .github/workflows/*.yml`            | Triggering CI from the test plan is impossible (test plan runs locally). Grep is the cheap proxy; the PR's CI run is the authoritative test. |
| Don't test size-limit's *internal* metrics                         | `pnpm exec size-limit` exit code only                          | We don't control size-limit's calculation logic; we control whether OUR config makes it exit cleanly.                     |

---

## Example Test Case — Reading the asserter output

```bash
$ bash tasks/sprint-1-stop-the-bleeding/verify-phase-7.sh
✓ US-2: /.size-limit.json exists
✓ US-2: .size-limit.json has ≥ 18 entries (got 19)
✓ US-2: budget entry for core
✓ US-2: budget entry for react
✓ US-2: budget entry for hints
✓ US-2: budget entry for analytics
✓ US-2: budget entry for adoption
✓ US-2: budget entry for checklists
✓ US-2: budget entry for announcements
✓ US-2: budget entry for surveys
✓ US-2: budget entry for media
✓ US-2: budget entry for ai
✓ US-2: budget entry for scheduling
✓ US-2: budget entry for license
✓ US-1: check-dist-gzip.mjs exists
✓ US-1: dist-gzip checker green on current build
✓ US-3: pnpm exec size-limit green
✓ US-3: size-limit.yml runs dist-gzip checker
✓ US-3: size-limit.yml runs size-limit
✓ US-4: ci.yml uses pnpm 10.x (or no pnpm setup)
✓ US-4: size-limit.yml uses pnpm 10.x (or no pnpm setup)
✓ US-4: release.yml uses pnpm 10.x (or no pnpm setup)
✓ US-4: smoke-npm.yml uses pnpm 10.x (or no pnpm setup)
✓ US-5: CLAUDE.md mentions extended budget table
✓ US-5: CLAUDE.md table lists more than core/react/hints
✓ US-7: package.json has bundlesize + dist:size scripts
✓ US-8: ci.yml has no stale "Re-enable" TODO
✓ Single source of truth: no extra per-package .size-limit.json (got 0)
Phase 7 all gates green.
```

Then your PR description includes:

> **US-6 negative test results:**
> - Pre-injection: `node tooling/bundle-check/check-dist-gzip.mjs` exit 0
> - Post 5 KB inject into `packages/media/src/index.ts`: exit 1, output included `media OVER budget`
> - Post-revert: exit 0
> Gate confirmed to trip on regression.

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to write
the Phase 7 gates:

---
You are completing Phase 7 of Sprint 1 in the tour-kit monorepo — wiring
`size-limit` and a custom raw-dist-gzip checker into CI on every PR so a
future B-2-class regression (heavy import + forgot external) fails CI
within 5 minutes.

### What This Project Is
A pnpm 10 monorepo with 12 published runtime packages. Phase 1 fixed a
64 KB analytics bundle regression that would have been caught by a CI
size gate. Phase 7 makes sure the next one is.

Two gates run in parallel:
1. **`tooling/bundle-check/check-dist-gzip.mjs`** — raw `dist/index.js`
   gzip bytes, hard budgets from the audit (1.2× current size). This is
   the **binding merge gate**.
2. **`size-limit`** with root `/.size-limit.json` — bundled-with-deps +
   brotli, secondary smoke signal. Calibrated separately.

### Acceptance Criteria (from User Stories)
| #    | User Story                                                    | Validation Check                                              | Pass Condition                          |
| ---- | ------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------- |
| US-1 | Gate fires on regression                                       | Synthetic 5 KB pad in media → re-build → checker              | Exit non-zero with `media OVER`         |
| US-2 | All 12 packages covered                                        | `.size-limit.json` + checker have entries                     | ≥ 18 entries                            |
| US-3 | Workflow runs both gates                                       | `grep` in `size-limit.yml`                                    | Both `dist:size` and `pnpm exec size-limit` |
| US-4 | Workflows on pnpm 10.x                                         | `grep "version: 10" .github/workflows/*.yml`                  | All 4 workflows                         |
| US-5 | CLAUDE.md budget table extended                                | `grep` for `Bundle sizes (gzipped)`                           | Lists analytics/adoption/etc.           |
| US-6 | Negative test passes                                           | Manual inject/revert procedure                                | Pre 0, mid non-zero, post 0             |
| US-7 | Local scripts work                                             | `pnpm bundlesize`, `pnpm dist:size`                            | Both present in package.json            |
| US-8 | Stale TODO removed from `ci.yml`                              | `grep -v "TODO: Re-enable when tooling/bundle-check"`         | Gone or replaced                        |

### Why Fakes Are Required
None. The checker exercises real `gzipSync` on real dist files. Mocking
would erase the contract. The negative test (US-6) is a real inject-revert
into `packages/media/src/index.ts`.

### What NOT to Test
- Don't write vitest cases for the checker. The checker is bash-and-node
  glue; testing it via `verify-phase-7.sh` is enough.
- Don't create per-package `.size-limit.json` files. Phase plan §5.3
  picks Option A (single root). The existing
  `packages/ai/.size-limit.json` stays as documentation only.
- Don't set core's budget to 8 KB. core is 19 KB gz today; an 8 KB gate
  blocks every PR. 20 KB ceiling + a `target <8 KB in B-1` note is the
  compromise.
- Don't trigger CI from this test plan. Push the branch, watch the
  workflow there.
- Don't run the negative test on every CI run. One-shot before PR; paste
  exit codes into the PR description.
- Don't add `andresz1/size-limit-action`. The existing workflow's comment
  notes it's broken; plain `pnpm exec size-limit` is sufficient.

### Critical: The Checker

Create `tooling/bundle-check/check-dist-gzip.mjs`:

```js
#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

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

let fails = 0
for (const [name, path, budget] of budgets) {
  try {
    const raw = readFileSync(path)
    const gz = gzipSync(raw).length
    const status = gz <= budget ? '✓' : '✗ OVER'
    if (gz > budget) fails++
    console.log(`${status.padEnd(8)} ${name.padEnd(24)} gz=${gz}  budget=${budget}`)
  } catch (e) {
    console.log(`?        ${name.padEnd(24)} MISSING (${e.code ?? e.message})`)
    fails++
  }
}
process.exit(fails === 0 ? 0 : 1)
```

### Files to Create / Modify

```
/.size-limit.json                            # REPLACE (calibrated 18 entries)
tooling/bundle-check/check-dist-gzip.mjs     # NEW
CLAUDE.md                                    # MODIFIED — Quality Gates section
.github/workflows/ci.yml                     # MODIFIED — pnpm 10, stale TODO out
.github/workflows/size-limit.yml             # MODIFIED — pnpm 10, runs both gates
.github/workflows/release.yml                # MODIFIED — pnpm 10
.github/workflows/smoke-npm.yml              # MODIFIED — pnpm 10
turbo.json                                   # MODIFIED — +bundlesize task
package.json                                 # MODIFIED — +bundlesize + dist:size
tasks/sprint-1-stop-the-bleeding/verify-phase-7.sh   # NEW
```

### Per-File Coverage Guidance

#### `tooling/bundle-check/check-dist-gzip.mjs`
- Body shown above. Hardcode the budgets; this is the merge gate.

#### `/.size-limit.json`
- Phase plan §5.1 has the full 19-entry table. Copy verbatim.
- Includes preserved entries: `core (useTour-only consumer)`,
  `core/schemas` with `ignore: ["zod"]`.

#### `.github/workflows/size-limit.yml`
- Bump `pnpm/action-setup` version field from `9` to `10.26.1`.
- Change "Check size" step to:
  ```yaml
        - name: Check size
          run: |
            pnpm exec size-limit
            pnpm dist:size
  ```

#### `.github/workflows/{ci,release,smoke-npm}.yml`
- Bump `pnpm/action-setup` version from `9` to `10.26.1`.
- `ci.yml`: delete the commented-out `# TODO: Re-enable when tooling/bundle-check…` block.

#### `package.json`
- Add scripts:
  ```json
  "bundlesize": "pnpm build --filter='./packages/*' && pnpm exec size-limit",
  "dist:size":  "pnpm build --filter='./packages/*' && node tooling/bundle-check/check-dist-gzip.mjs"
  ```

#### `turbo.json`
- Add a `bundlesize` task with `dependsOn: ["^build", "build"]`, `cache: false`, `outputs: []`.

#### `CLAUDE.md` Quality Gates
- Replace the single `Bundle sizes: core < 8KB, react < 12KB, hints < 5KB (gzipped)` bullet with the table from phase plan §6.

#### `verify-phase-7.sh`
- The body shown above (Asserter Skeleton).

### US-6 Negative Test (Manual)
- Run BEFORE opening the PR.
- Sequence shown in §US-6: Negative-Test Procedure.
- Paste the three exit codes into the PR description.

### Success Criteria
- `bash tasks/sprint-1-stop-the-bleeding/verify-phase-7.sh` prints all ✓.
- US-6 negative test cycle: 0, non-zero, 0.
- All 4 workflows pin pnpm 10.26.1.
- `pnpm bundlesize` and `pnpm dist:size` run end-to-end and exit 0 on
  current main + this branch.
- After push, the `size-limit` workflow on the PR shows both gates ran
  and both are green.

### Expected End State

```
/.size-limit.json                            # CALIBRATED for 12 packages
tooling/bundle-check/check-dist-gzip.mjs     # NEW
CLAUDE.md                                    # extended budget table
.github/workflows/*.yml                      # pnpm 10.26.1, stale TODO out
turbo.json                                   # +bundlesize task
package.json                                 # +bundlesize +dist:size scripts
tasks/sprint-1-stop-the-bleeding/verify-phase-7.sh   # NEW
```
---

---

## Run Commands

```bash
# Build first
pnpm build --filter='./packages/*'

# Run the binding gate
node tooling/bundle-check/check-dist-gzip.mjs

# Run the secondary smoke gate
pnpm exec size-limit

# Run both via root scripts
pnpm dist:size
pnpm bundlesize

# Full asserter
chmod +x tasks/sprint-1-stop-the-bleeding/verify-phase-7.sh
bash tasks/sprint-1-stop-the-bleeding/verify-phase-7.sh

# US-6 negative test (one-shot, manual)
node tooling/bundle-check/check-dist-gzip.mjs              # Pre: exit 0
python3 -c "print('export const __pad = \"' + 'A'*5000 + '\";')" >> packages/media/src/index.ts
pnpm --filter @tour-kit/media build
node tooling/bundle-check/check-dist-gzip.mjs              # Mid: non-zero
git checkout packages/media/src/index.ts
pnpm --filter @tour-kit/media build
node tooling/bundle-check/check-dist-gzip.mjs              # Post: exit 0
```

---

**Next:** [phase-8-tests.md](phase-8-tests.md)

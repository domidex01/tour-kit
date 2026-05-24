# Phase 0 — Testing: Pre-flight Baseline

**Scope:** Baseline-collection shell pipeline that captures bundle sizes, test-run
log, lockfile snapshot, and existing size-limit config under
`tasks/sprint-1-stop-the-bleeding/baselines/`.
**Phase type:** **Research / validation.** Phase 0 IS the test — there is no
production code being added. Tests verify the *baseline pipeline itself*
(shell snippets in `phase-0-preflight.md` §0.0–§0.8) produces a known-shaped
set of artifacts the later phases depend on.
**Key Pattern:** No fakes. Run the real commands once on the real workspace,
then assert artifact shape and known invariants (file exists, table has 12
rows, smoking-gun grep returns ≥ 1). The hostile case is "baseline silently
captures an unexpected state" — every gate must trip a human, not pass blindly.
**Dependencies:** `bash`, `pnpm@10.26.1` (corepack), `gzip`, `wc`, `grep`,
`diff`, `node`, working `pnpm-lock.yaml`.

---

## User Stories

| #    | User Story                                                                                                  | Validation Check                                                                                                  | Pass Condition                                                                                  |
| ---- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| US-1 | As a sprint owner, I want a known-good bundle-size table so every later phase can prove a delta vs. it.     | `bundle-sizes.md` exists; contains one row per `packages/*` with a built `dist/index.js`; rows match audit ±5 %.  | File present, ≥ 12 rows, `analytics` gz between 60 000 and 68 000.                              |
| US-2 | As a sprint owner, I want to confirm B-2 is real before fixing it (no wasted work if already patched).      | `grep -c '@amplitude/plugin-' packages/analytics/dist/plugins/amplitude.js`.                                      | ≥ 10 matches (smoking gun). If 0 → stop and re-plan.                                            |
| US-3 | As Phase 4, I want a lockfile baseline so the catalog move can prove zero resolution drift.                 | `baselines/pnpm-lock.baseline.yaml` exists and equals `pnpm-lock.yaml` at capture time.                           | `diff baselines/pnpm-lock.baseline.yaml pnpm-lock.yaml \| wc -l` == 0 immediately after copy.   |
| US-4 | As a release owner, I want a recorded decision on the analytics version bump before any breaking PR opens.  | `phase-0-preflight.md` §0.6 has the chosen option (A/B/C) ticked in the WIP file or `baselines/decision.md`.      | Exactly one of A/B/C ticked; matches the changeset later opened in Phase 2.                     |
| US-5 | As a CI engineer, I want corepack/pnpm aligned with `packageManager` before catalog work begins.            | `pnpm --version` matches the `packageManager` field in root `package.json`.                                       | Both report `10.26.x`. Mismatch blocks Phase 4.                                                 |

---

## Component Mock Strategy

| Component                           | Mock Strategy                                | What to Assert                                                                  | User Story |
| ----------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------- | ---------- |
| Bundle size capture (`§0.2`)        | None — run real `pnpm build` once            | Markdown file shape: 12+ rows, header present, analytics row sane               | US-1       |
| Smoking-gun B-2 grep (`§0.4`)       | None — run real `grep` on real dist          | Match count ≥ 10 (proves bug is present), and `function.*amplitude` ≥ 1         | US-2       |
| Lockfile snapshot (`§0.7`)          | None — `cp pnpm-lock.yaml ...`               | File copied, identical at capture, both files are valid YAML                    | US-3       |
| Workflow audit (`§0.5`)             | None — `ls .github/workflows/`               | All 6 expected workflow files present                                           | US-5       |
| size-limit baseline (`§0.8`)        | None — `cp .size-limit.json ...` + capture log| `.size-limit.baseline.json` byte-identical to repo `.size-limit.json`           | US-1       |
| Version-bump decision (`§0.6`)      | Human + WIP file                             | Decision recorded in writing, not just in chat                                  | US-4       |

---

## Test Tier Table

| Tier        | Dependencies                                              | Speed     | When to Run                            |
| ----------- | --------------------------------------------------------- | --------- | -------------------------------------- |
| Smoke       | Real `pnpm install --frozen-lockfile`, `pnpm build`       | 5–10 min  | Once, at sprint kickoff                |
| Verification| Just the captured artifacts + a small shell asserter      | < 5 s     | Before every later phase as a re-check |
| Drift       | Re-run baseline after any sibling main merge during sprint| 5–10 min  | Only if `main` has moved during sprint |

Phase 0 deliberately has no unit tier — there is no code yet.

---

## No Fake Implementations (Research Phase)

Phase 0 captures snapshots of the real workspace. Mocking the workspace would
defeat the purpose: the baseline is the ground truth every later phase compares
against. Skip this section.

If `pnpm install` cannot run (network or auth issue), the right answer is to
fix the install — not fake the baseline.

---

## Test File List

```
tasks/sprint-1-stop-the-bleeding/baselines/
├── bundle-sizes.md                  # 12-row table of gz/raw sizes — proves US-1
├── test-run.log                     # `pnpm test --filter='./packages/*'` output — known-green baseline
├── pnpm-lock.baseline.yaml          # Frozen lockfile — Phase 4 diffs against this
├── size-limit.baseline.json         # Pre-Sprint root size-limit config
├── size-limit.baseline.log          # Pre-Sprint `pnpm exec size-limit` output (may be red — fine)
├── decision.md                      # Recorded A/B/C choice for analytics version bump
└── wip.md                           # Optional: any pre-existing red test or dirty-tree note

tasks/sprint-1-stop-the-bleeding/
└── verify-baselines.sh              # NEW: idempotent asserter, called by §0 verification tier
```

Every deliverable from `phase-0-preflight.md` §0.0–§0.8 appears above.

---

## Asserter Skeleton (replaces `conftest.py` for this JS sprint)

```bash
#!/usr/bin/env bash
# tasks/sprint-1-stop-the-bleeding/verify-baselines.sh
# Run after Phase 0 to confirm the baseline pipeline produced what later phases assume.
# Exits non-zero on the first failure; prints one ✓/✗ per gate.
set -u
BASE="tasks/sprint-1-stop-the-bleeding/baselines"
fails=0
check() { if eval "$1"; then echo "✓ $2"; else echo "✗ $2"; fails=$((fails+1)); fi; }

# US-5: pnpm aligned
check '[ "$(pnpm --version | head -c 4)" = "10.2" ]' "pnpm major aligns with packageManager"

# US-1: bundle-sizes.md shape
check '[ -f "$BASE/bundle-sizes.md" ]' "bundle-sizes.md exists"
check '[ "$(grep -c "^| " "$BASE/bundle-sizes.md")" -ge 12 ]' "bundle-sizes.md has ≥ 12 data rows"
check 'awk -F"|" "/analytics/ {gsub(/ /,\"\",\$3); if (\$3+0 > 60000 && \$3+0 < 68000) ok=1} END{exit !ok}" "$BASE/bundle-sizes.md"' "analytics gz in [60k,68k]"

# US-2: B-2 smoking gun (still in tree at baseline time)
check '[ "$(grep -c "@amplitude/plugin-" packages/analytics/dist/plugins/amplitude.js 2>/dev/null)" -ge 10 ]' "amplitude SDK inlined (B-2 reproducible)"

# US-3: lockfile baseline
check '[ -f "$BASE/pnpm-lock.baseline.yaml" ]' "pnpm-lock.baseline.yaml captured"
check 'diff -q "$BASE/pnpm-lock.baseline.yaml" pnpm-lock.yaml >/dev/null' "baseline lockfile == current at capture"

# US-1 + Phase 7: size-limit baseline
check '[ -f "$BASE/size-limit.baseline.json" ]' "size-limit.baseline.json captured"
check 'diff -q "$BASE/size-limit.baseline.json" .size-limit.json >/dev/null' "size-limit baseline == current at capture"

# US-4: decision recorded
check 'grep -E "^- \[x\] \*\*Option [ABC]" "$BASE/decision.md" >/dev/null' "version-bump decision recorded"

# Workflows present
for f in ci.yml link-check.yml release.yml size-limit.yml smoke-npm.yml test-npm-auth.yml; do
  check "[ -f .github/workflows/$f ]" "workflow $f present"
done

# Test baseline green
check 'grep -E "(failed|FAIL)" "$BASE/test-run.log" \| grep -v "0 failed" \| wc -l \| grep -q "^0$"' "baseline test-run had no failures"

[ "$fails" -eq 0 ] || { echo "FAILED gates: $fails"; exit 1; }
echo "All Phase 0 baselines OK."
```

Drop into `tasks/sprint-1-stop-the-bleeding/verify-baselines.sh`, `chmod +x`.

---

## Key Testing Decisions

| Decision                                               | Approach                                                              | Rationale                                                                                                            |
| ------------------------------------------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| No vitest tests for Phase 0                            | Shell asserter only                                                   | The artifacts are markdown + yaml + log files. A pytest/vitest layer would be pure ceremony.                         |
| Lockfile assertion is "diff == 0 at capture"           | `diff -q` exit-code check                                             | We can't assert specific content (it's huge), but we CAN prove the copy was faithful at capture time.                 |
| Smoking-gun grep is a HARD gate                        | Asserter exits non-zero if `@amplitude/plugin-` count < 10            | Phase 1 is wasted work if B-2 has already been fixed. Catch that *before* Phase 1 opens a branch.                    |
| Decision §0.6 must be in a file, not chat              | Require `decision.md` with checkbox                                   | Memory drifts. Phase 2 changeset will reference this; ChatGPT-style "I think we said B" is not load-bearing.         |
| Test run baseline asserted on "0 failed", not exit 0   | `grep -v '0 failed' \| wc -l \| grep -q '^0$'`                        | pnpm test exits 0 even if 0 tests ran. We explicitly want "ran and zero failed."                                     |
| Re-run drift tier *only* if main moved                 | Manual trigger                                                        | Re-running the full build needlessly invalidates everyone else's WIP comparison.                                     |

---

## Example "Test Case" — Reading the captured baseline

```bash
# Confirm Phase 0 captured the analytics smoking gun.
$ grep '^| analytics ' tasks/sprint-1-stop-the-bleeding/baselines/bundle-sizes.md
| analytics | 64357 | 219145 |

$ grep -c '@amplitude/plugin-' packages/analytics/dist/plugins/amplitude.js
13

$ tasks/sprint-1-stop-the-bleeding/verify-baselines.sh
✓ pnpm major aligns with packageManager
✓ bundle-sizes.md exists
✓ bundle-sizes.md has ≥ 12 data rows
✓ analytics gz in [60k,68k]
✓ amplitude SDK inlined (B-2 reproducible)
✓ pnpm-lock.baseline.yaml captured
✓ baseline lockfile == current at capture
✓ size-limit.baseline.json captured
✓ size-limit baseline == current at capture
✓ version-bump decision recorded
✓ workflow ci.yml present
... (all 6 workflows)
✓ baseline test-run had no failures
All Phase 0 baselines OK.
```

If `analytics gz in [60k,68k]` is red, B-2 has shifted shape — re-read the
audit before proceeding to Phase 1.

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to write the
Phase 0 asserter and pipeline:

---
You are completing Phase 0 (pre-flight baseline) of Sprint 1 in the tour-kit
monorepo. The repo is a pnpm 10 workspace with `packages/*` for runtime libs.
Phase 0 does NOT modify any package — it only captures baseline artifacts the
later phases depend on, under `tasks/sprint-1-stop-the-bleeding/baselines/`.

### What This Project Is
tour-kit is a headless onboarding/product-tour React library shipped as a
multi-package pnpm workspace. Sprint 1 fixes a bundling regression in
`@tour-kit/analytics` (B-2: SDK inlined → 64 KB gz) and a handful of
hygiene items. Phase 0 establishes the *pre-fix* ground truth so every
later phase can prove a measurable delta.

### Acceptance Criteria (from User Stories)
| #    | User Story                                                            | Validation Check                                                            | Pass Condition                          |
| ---- | --------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------- |
| US-1 | Sprint owner wants a known-good bundle-size table                     | `bundle-sizes.md` exists, ≥ 12 rows                                         | analytics gz in [60 000, 68 000]        |
| US-2 | Confirm B-2 is real before fixing                                     | `grep -c '@amplitude/plugin-' ...amplitude.js`                              | ≥ 10                                    |
| US-3 | Lockfile baseline for Phase 4 zero-diff gate                          | `baselines/pnpm-lock.baseline.yaml` == `pnpm-lock.yaml`                     | `diff -q` exits 0                       |
| US-4 | Recorded analytics version-bump decision                              | `baselines/decision.md` has one ticked option                               | exactly one `[x]`                       |
| US-5 | Local pnpm aligned with `packageManager`                              | `pnpm --version` major                                                      | matches `10.26.x`                       |

### Why Fakes Are Required
None. Phase 0 IS the test. Mocking the workspace would erase the very baseline
the rest of the sprint depends on. If a command fails (network, install), fix
the command — do not stub it out.

### What NOT to Test
- Don't write vitest tests for Phase 0 — there is no production code yet.
- Don't try to assert specific lockfile content. The lockfile is large and
  noisy; assert only the byte-identical-at-capture property.
- Don't fail on a pre-existing red package test. Record it in `wip.md` and
  skip it — that is someone else's bug, not Sprint 1's.
- Don't gate on size-limit's pre-Sprint exit code. The pre-Sprint config is
  too loose AND too strict in different places; Phase 7 owns making it sane.

### Critical: Asserter Skeleton

Drop this in `tasks/sprint-1-stop-the-bleeding/verify-baselines.sh` and run
it after the §0 commands finish:

```bash
#!/usr/bin/env bash
set -u
BASE="tasks/sprint-1-stop-the-bleeding/baselines"
fails=0
check() { if eval "$1"; then echo "✓ $2"; else echo "✗ $2"; fails=$((fails+1)); fi; }

check '[ "$(pnpm --version | head -c 4)" = "10.2" ]' "pnpm major aligns with packageManager"
check '[ -f "$BASE/bundle-sizes.md" ]' "bundle-sizes.md exists"
check '[ "$(grep -c "^| " "$BASE/bundle-sizes.md")" -ge 12 ]' "bundle-sizes.md has ≥ 12 data rows"
check 'awk -F"|" "/analytics/ {gsub(/ /,\"\",\$3); if (\$3+0 > 60000 && \$3+0 < 68000) ok=1} END{exit !ok}" "$BASE/bundle-sizes.md"' "analytics gz in [60k,68k]"
check '[ "$(grep -c "@amplitude/plugin-" packages/analytics/dist/plugins/amplitude.js 2>/dev/null)" -ge 10 ]' "amplitude SDK inlined (B-2 reproducible)"
check '[ -f "$BASE/pnpm-lock.baseline.yaml" ]' "pnpm-lock.baseline.yaml captured"
check 'diff -q "$BASE/pnpm-lock.baseline.yaml" pnpm-lock.yaml >/dev/null' "baseline lockfile == current at capture"
check '[ -f "$BASE/size-limit.baseline.json" ]' "size-limit.baseline.json captured"
check 'diff -q "$BASE/size-limit.baseline.json" .size-limit.json >/dev/null' "size-limit baseline == current at capture"
check 'grep -E "^- \[x\] \*\*Option [ABC]" "$BASE/decision.md" >/dev/null' "version-bump decision recorded"
for f in ci.yml link-check.yml release.yml size-limit.yml smoke-npm.yml test-npm-auth.yml; do
  check "[ -f .github/workflows/$f ]" "workflow $f present"
done

[ "$fails" -eq 0 ] || { echo "FAILED gates: $fails"; exit 1; }
echo "All Phase 0 baselines OK."
```

### Files to Create / Capture
```
tasks/sprint-1-stop-the-bleeding/baselines/bundle-sizes.md
tasks/sprint-1-stop-the-bleeding/baselines/test-run.log
tasks/sprint-1-stop-the-bleeding/baselines/pnpm-lock.baseline.yaml
tasks/sprint-1-stop-the-bleeding/baselines/size-limit.baseline.json
tasks/sprint-1-stop-the-bleeding/baselines/size-limit.baseline.log
tasks/sprint-1-stop-the-bleeding/baselines/decision.md
tasks/sprint-1-stop-the-bleeding/verify-baselines.sh
```

### Success Criteria
- `bash tasks/sprint-1-stop-the-bleeding/verify-baselines.sh` exits 0.
- `decision.md` has exactly one `- [x] **Option …` line.
- No package version was bumped, no `package.json` was edited (`git status`
  shows changes only under `baselines/` and the new asserter script).

### Expected End State
```
tasks/sprint-1-stop-the-bleeding/
├── README.md
├── phase-0-preflight.md
├── phase-0-tests.md
├── ... (other phase plans)
├── verify-baselines.sh                  # NEW
└── baselines/
    ├── bundle-sizes.md
    ├── test-run.log
    ├── pnpm-lock.baseline.yaml
    ├── size-limit.baseline.json
    ├── size-limit.baseline.log
    └── decision.md
```
---

---

## Run Commands

```bash
# Run the baseline pipeline (Phase 0 §0.0 – §0.8 in order)
bash -x tasks/sprint-1-stop-the-bleeding/phase-0-preflight.md   # not a real script, run the snippets

# Once captured, verify shape
bash tasks/sprint-1-stop-the-bleeding/verify-baselines.sh

# Quick re-check after a `main` merge (no rebuild)
bash tasks/sprint-1-stop-the-bleeding/verify-baselines.sh

# Drift tier (only if main moved): re-capture, then diff old vs new
mv tasks/sprint-1-stop-the-bleeding/baselines{,.prev}
# re-run §0.2 + §0.7 + §0.8
diff -r tasks/sprint-1-stop-the-bleeding/baselines{.prev,}/ | less
```

---

**Next:** [phase-1-tests.md](phase-1-tests.md)

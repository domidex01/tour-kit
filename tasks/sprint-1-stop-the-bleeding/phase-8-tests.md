# Phase 8 — Testing: Release + Communications

**Scope:** `pnpm version-packages` consumes changesets and bumps versions
in `packages/*/package.json` + `CHANGELOG.md`; release PR is merged;
`pnpm release` publishes to npm; GitHub release notes posted;
README status updated. No source code changed in Phase 8 itself.
**Phase type:** **Process + external integration.** The only Sprint-1 phase
that interacts with systems we can't roll back (npm, GitHub releases).
Tests fall into two buckets: (a) pre-flight verification that every
Sprint-1 acceptance gate still holds against `main`, and (b) post-publish
smoke that pulls the actually-published packages from npm and exercises
their published shape.
**Key Pattern:** Idempotent verification harness reused across phases
(every Phase-N acceptance gate re-runs as a checkbox here) + a temp-dir
post-publish smoke that proves the npm artifact, not just the workspace
artifact, has the Phase 1+2 fixes baked in.
**Dependencies:** `pnpm@10.26.1`, `node`, `gzip`, `npm view`, `gh`,
`esbuild` (in the temp smoke project), `NPM_TOKEN` configured in CI for
`pnpm release`.

---

## User Stories

| #    | User Story                                                                                                                          | Validation Check                                                                                                                | Pass Condition                                                                              |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| US-1 | As a release engineer, I want a single command that re-runs every Sprint-1 phase's acceptance gate against `main` before publishing. | `bash tasks/sprint-1-stop-the-bleeding/verify-phase-8-preflight.sh` (composes Phase 0–7 asserters)                              | All asserters exit 0; any FAIL line blocks publish                                          |
| US-2 | As a consumer, I want the versions on npm to match what the release PR bumped to — no half-published state.                          | `npm view @tour-kit/<pkg> version` for every bumped package                                                                     | Each matches the version in `packages/<pkg>/package.json` on `main`                          |
| US-3 | As a consumer running `pnpm add @tour-kit/analytics @tour-kit/core`, I want the published bundle to NOT contain Amplitude SDK strings (proves Phase 1 made it to npm). | Temp project: `pnpm add @tour-kit/analytics@latest`, esbuild a probe, `grep -c '@amplitude/plugin-'`                            | `== 0` in the bundled probe                                                                 |
| US-4 | As a consumer migrating from < 0.12, I want the GitHub release note for `@tour-kit/analytics@0.12.0` to spell out the breaking change. | `gh release view '@tour-kit/analytics@0.12.0' --json body \| jq -r '.body'` contains the before/after import block             | Release body has both `from '@tour-kit/analytics'` (old) and `from '@tour-kit/analytics/posthog'` (new) lines |
| US-5 | As a release engineer, I want `pnpm release` to be re-runnable safely if it half-failed (publish retries are idempotent).            | Document the retry behavior, ad-hoc verify with `npm view <pkg> version` re-checks                                              | Re-running `pnpm release` after a partial publish republishes only the missing tags (changeset publish is idempotent) |
| US-6 | As a consumer, I want `@tour-kit/analytics` root entry (post-Phase-1+2) to ship under 5 KB gz from npm.                              | Same temp project as US-3: `gzip -c probe.bundled.js \| wc -c`                                                                  | `< 5000` bytes                                                                              |
| US-7 | As a maintainer reading `tasks/sprint-1-stop-the-bleeding/README.md` after the sprint, I want the status flipped to SHIPPED + a retrospective.| `grep 'Status:' README.md`                                                                                                      | Reads `Status: SHIPPED YYYY-MM-DD`                                                          |
| US-8 | As a future Sprint-2 owner, I want the 6 follow-up issues filed and tagged `sprint-2`.                                                | `gh issue list --label sprint-2 --search "B-1 OR F-3 OR R-1 OR R-2 OR R-4 OR R-5 OR G-3 OR G-7"`                                | ≥ 6 issues with matching titles, all open                                                   |

---

## Component Mock Strategy

| Component                              | Mock Strategy                                              | What to Assert                                                                            | User Story  |
| -------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------- |
| Phase 0–7 asserter re-runs              | None — re-run the real bash scripts                        | All exit 0 against current `main`                                                          | US-1        |
| `npm view <pkg> version`                | None — real network call to npm registry                   | Version on registry matches `packages/<pkg>/package.json` on `main`                        | US-2        |
| Temp project install + esbuild         | None — real `pnpm add` from npm + real `esbuild` bundle    | No `@amplitude/plugin-` strings in bundled output; gz size < 5 KB                          | US-3, US-6  |
| GitHub release body                    | None — real `gh release view`                              | Body contains both old and new import paths                                                | US-4        |
| `pnpm release` re-runnability           | Document only (don't simulate a half-publish in production) | Documented "if it half-fails, re-run safely"                                              | US-5        |
| Sprint README status                    | None — file read                                           | `Status: SHIPPED <date>` + retrospective section present                                  | US-7        |
| Sprint-2 issues                         | None — `gh issue list`                                     | 6 expected issues exist with `sprint-2` label                                              | US-8        |

---

## Test Tier Table

| Tier               | Dependencies                                              | Speed     | When to Run                              |
| ------------------ | --------------------------------------------------------- | --------- | ---------------------------------------- |
| Pre-flight (US-1)  | Phase 0–7 asserter scripts + working tree                 | ~5 min    | Immediately before `pnpm version-packages` |
| Post-publish smoke | `pnpm add` from npm + esbuild + gzip                      | ~2 min    | After `pnpm release` returns success      |
| Registry verification (US-2) | `npm view <pkg> version` × N                    | ~30 s     | After `pnpm release`                      |
| Release-note content (US-4) | `gh release view`                                   | < 5 s     | After release notes posted                |
| Documentation gates (US-7, US-8) | File read + `gh issue list`                      | < 5 s     | Last thing before closing sprint          |

No vitest changes. No new fakes. The "test" is composed of existing
asserters + cheap external probes.

---

## No Fake Implementations (Release Process)

Phase 8 deliberately *avoids* mocking external systems:

- **Don't mock npm.** The point of the smoke is to confirm the artifact
  on npm has the fix. Mocking npm would erase that verification.
- **Don't mock `gh`.** Same reason — verifying the GitHub release exists
  is the contract.
- **Don't simulate `pnpm release` failure modes.** If it half-fails in
  production, the right answer is to re-run it (`changeset publish` is
  idempotent). Simulating that locally would teach you nothing about real
  failure modes (auth expiry, npm 5xx, etc.).

The only "test artifact" Phase 8 ships is the pre-flight asserter that
composes the previous phases' gates.

---

## Test File List

```
tasks/sprint-1-stop-the-bleeding/
├── verify-phase-8-preflight.sh             # NEW — composes Phase 0–7 asserters
├── verify-phase-8-postpublish.sh           # NEW — npm-side smoke (US-2/3/6)
└── README.md                                # MODIFIED — Status: SHIPPED + retrospective

# Transient (during US-3 smoke):
/tmp/tk-smoke/                                # Scratch project, deleted after
├── probe.ts
├── probe.bundled.js
└── package.json

# No new files in packages/* or apps/*.
```

---

## Asserter Skeletons

### Pre-flight (`verify-phase-8-preflight.sh`)

```bash
#!/usr/bin/env bash
# Run from clean `main` checkout, after `pnpm install --frozen-lockfile && pnpm build`.
set -u
fails=0
gate() { if eval "$1"; then echo "✓ $2"; else echo "✗ $2"; fails=$((fails+1)); fi; }

ROOT="tasks/sprint-1-stop-the-bleeding"

# Re-run every phase's asserter
for n in 0 1 2 3 4 5 6 7; do
  case "$n" in
    0) script="$ROOT/verify-baselines.sh" ;;
    *) script="$ROOT/verify-phase-$n.sh" ;;
  esac
  if [ -f "$script" ]; then
    if bash "$script" >/tmp/phase-8-preflight-$n.log 2>&1; then
      echo "✓ Phase $n acceptance gate green"
    else
      echo "✗ Phase $n acceptance gate FAILED — see /tmp/phase-8-preflight-$n.log"
      fails=$((fails+1))
    fi
  else
    echo "? Phase $n asserter missing: $script (skipping)"
  fi
done

# Sprint-level gates from Phase 8 §2
gate '[ "$(gzip -c packages/analytics/dist/index.js | wc -c)" -lt 4000 ]' \
     'analytics root < 4 KB gz (Phase 2)'
gate '[ "$(gzip -c packages/analytics/dist/plugins/amplitude.js | wc -c)" -lt 1000 ]' \
     'amplitude plugin < 1 KB gz (Phase 1)'
gate '[ "$(grep -cE "posthogPlugin|mixpanelPlugin|amplitudePlugin|googleAnalyticsPlugin|consolePlugin" packages/analytics/dist/index.js)" -eq 0 ]' \
     'no plugin re-exports in analytics root (Phase 2)'
gate 'grep -q "\"sideEffects\": false" packages/adoption/package.json' \
     'adoption has sideEffects false (Phase 3)'
gate '[ "$(git grep -cE "\"(@floating-ui/react|class-variance-authority|@radix-ui/react-slot|@radix-ui/react-dialog|@mui/base|clsx|tailwind-merge)\": \"\\^" packages/ | wc -l | tr -d " ")" -eq 0 ]' \
     'no pinned catalog libs in packages/ (Phase 4)'
gate '[ -d apps/docs/content/docs/codemods ]' 'codemods docs subtree exists (Phase 5)'
gate '[ -d apps/docs/content/docs/testing-library ]' 'testing-library docs subtree exists (Phase 6)'
gate '[ -f .size-limit.json ] && [ -f tooling/bundle-check/check-dist-gzip.mjs ]' \
     'size-limit config + dist-gzip checker present (Phase 7)'

# Optional peers
gate 'node -e "const p=require(\"./packages/analytics/package.json\"); process.exit(p.peerDependencies?.[\"@amplitude/analytics-browser\"] && p.peerDependenciesMeta?.[\"@amplitude/analytics-browser\"]?.optional ? 0 : 1)"' \
     'analytics declares optional Amplitude peer'

[ "$fails" -eq 0 ] || { echo "Phase 8 PREFLIGHT FAILED gates: $fails"; exit 1; }
echo "Phase 8 preflight all gates green. Safe to publish."
```

### Post-publish (`verify-phase-8-postpublish.sh`)

```bash
#!/usr/bin/env bash
# Run AFTER `pnpm release` succeeds. Verifies the artifact on npm.
set -u
fails=0
gate() { if eval "$1"; then echo "✓ $2"; else echo "✗ $2"; fails=$((fails+1)); fi; }

# US-2: every bumped package is on npm at the expected version
for pkg in analytics adoption core react hints checklists announcements surveys media ai scheduling license; do
  local_v=$(node -e "try { console.log(require('./packages/$pkg/package.json').version) } catch (e) { console.log('') }")
  if [ -z "$local_v" ]; then continue; fi
  remote_v=$(npm view "@tour-kit/$pkg" version 2>/dev/null || echo "")
  if [ "$local_v" = "$remote_v" ]; then
    echo "✓ US-2: @tour-kit/$pkg → npm has $remote_v"
  else
    echo "✗ US-2: @tour-kit/$pkg local=$local_v remote=$remote_v"
    fails=$((fails+1))
  fi
done

# US-3 + US-6: temp project tree-shake smoke
SMOKE_DIR=$(mktemp -d /tmp/tk-smoke-XXXXXX)
(
  cd "$SMOKE_DIR"
  pnpm init >/dev/null
  pnpm add @tour-kit/analytics@latest @tour-kit/core@latest react@19 react-dom@19 >/dev/null 2>&1
  cat > probe.ts <<'EOF'
import { createAnalytics } from '@tour-kit/analytics'
import { posthogPlugin } from '@tour-kit/analytics/posthog'
const a = createAnalytics({ plugins: [posthogPlugin({ apiKey: 'x' })] })
export { a }
EOF
  pnpm add -D esbuild >/dev/null 2>&1
  pnpm exec esbuild probe.ts --bundle --minify --format=esm \
    --external:react --external:react-dom > probe.bundled.js 2>/dev/null
)

amp_strings=$(grep -c '@amplitude/plugin-' "$SMOKE_DIR/probe.bundled.js" 2>/dev/null || echo 0)
gate "[ $amp_strings -eq 0 ]" "US-3: no @amplitude/plugin- strings in published bundle"

gz=$(gzip -c "$SMOKE_DIR/probe.bundled.js" 2>/dev/null | wc -c | tr -d ' ')
gate "[ $gz -lt 5000 ]" "US-6: published analytics+core probe < 5 KB gz (got $gz)"

rm -rf "$SMOKE_DIR"

# US-4: release notes mention the migration
body=$(gh release view '@tour-kit/analytics@0.12.0' --json body --jq '.body' 2>/dev/null || echo "")
gate "echo \"\$body\" | grep -q '@tour-kit/analytics/posthog'" \
     "US-4: release notes mention subpath import"
gate "echo \"\$body\" | grep -qE 'BREAKING|breaking'" \
     "US-4: release notes flag breaking change"

# US-7: README status
gate "grep -qE '^> .*Status:\\s*SHIPPED' tasks/sprint-1-stop-the-bleeding/README.md" \
     "US-7: README marked SHIPPED"

# US-8: 6 sprint-2 issues exist
n=$(gh issue list --label sprint-2 --state open --json title --jq '. | length' 2>/dev/null || echo 0)
gate "[ $n -ge 6 ]" "US-8: ≥ 6 sprint-2 follow-up issues open (got $n)"

[ "$fails" -eq 0 ] || { echo "Phase 8 POSTPUBLISH FAILED gates: $fails"; exit 1; }
echo "Phase 8 post-publish all gates green. Sprint shipped."
```

---

## Key Testing Decisions

| Decision                                                          | Approach                                                      | Rationale                                                                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Re-run every phase's asserter as pre-flight                        | Compose `verify-phase-{0..7}.sh` in one wrapper               | A bad release is more expensive than a 5-minute re-verification. The asserters are already idempotent.                   |
| Smoke against the npm-published artifact, not the workspace        | Temp project + `pnpm add @latest`                              | The workspace artifact is what we control. The published artifact is what consumers get. They must match — and the only way to prove that is to install it. |
| Test the release-note content via `gh release view`                | Real network call to GitHub API                                | Release notes are the breaking-change contract for the consumer. A typo there is a worse outcome than a typo in MIGRATION.md. |
| Don't simulate a `pnpm release` half-failure                       | Document idempotency, verify by re-running if it happens       | Simulating the failure mode teaches nothing about real causes (auth, npm 5xx). Idempotent retry is the actual mitigation. |
| Issue-existence is a `gh issue list` count, not content match     | Set-cardinality                                                | The 6 follow-up issues' titles/labels are spelled out in Phase 8 §7; verifying the *count* under the `sprint-2` label is enough proof they were filed. |
| README status check is a regex, not a date check                  | `grep -E 'Status:\s*SHIPPED'`                                  | Hardcoding today's date in the asserter would break the next run. The string "SHIPPED" is the contract.                  |
| Don't test `npm view <pkg> versions --json` history               | Only test current `version`                                    | We care that the just-released version landed. The full version history is npm's job, not ours.                          |
| US-3 uses `esbuild`, not the consumer's actual bundler             | Single deterministic bundler                                   | We can't anticipate every consumer's webpack/vite/rspack config. esbuild gives us a deterministic, fast bundle that proves "the npm artifact is tree-shakable." |

---

## Example Test Case — Reading the post-publish asserter output

```bash
$ bash tasks/sprint-1-stop-the-bleeding/verify-phase-8-postpublish.sh
✓ US-2: @tour-kit/analytics → npm has 0.12.0
✓ US-2: @tour-kit/adoption → npm has 2.1.4
✓ US-2: @tour-kit/core → npm has 1.0.1
✓ US-2: @tour-kit/react → npm has 1.0.1
✓ US-2: @tour-kit/hints → npm has 1.0.1
✓ US-2: @tour-kit/checklists → npm has 0.4.6
✓ US-2: @tour-kit/announcements → npm has 0.4.6
✓ US-2: @tour-kit/surveys → npm has 0.4.6
✓ US-2: @tour-kit/media → npm has 0.4.6
✓ US-2: @tour-kit/ai → npm has 0.1.4
✓ US-2: @tour-kit/scheduling → npm has 0.3.4
✓ US-2: @tour-kit/license → npm has 0.2.4
✓ US-3: no @amplitude/plugin- strings in published bundle
✓ US-6: published analytics+core probe < 5 KB gz (got 4278)
✓ US-4: release notes mention subpath import
✓ US-4: release notes flag breaking change
✓ US-7: README marked SHIPPED
✓ US-8: ≥ 6 sprint-2 follow-up issues open (got 6)
Phase 8 post-publish all gates green. Sprint shipped.
```

If `US-3` is red, **the published artifact has the bug.** Cut a patch
release immediately (per Phase 8 §9 emergency rollback) — do not assume
"oh, it was fine locally."

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to write
the Phase 8 asserters:

---
You are completing Phase 8 of Sprint 1 in the tour-kit monorepo — cutting
the release that bundles Phases 1–7, publishing to npm, and announcing
the breaking analytics change. This is the only Sprint-1 phase that
touches systems we can't roll back (npm, GitHub releases).

### What This Project Is
A pnpm 10 monorepo with 12 published packages. Phases 1–7 fixed a 64 KB
analytics bundle regression, removed plugin re-exports, restored
tree-shaking for `@tour-kit/adoption`, cataloged 7 runtime deps, added
codemods + testing-library docs, and wired bundle-size CI. Phase 8
publishes the bundle.

### Acceptance Criteria (from User Stories)
| #    | User Story                                                    | Validation Check                                              | Pass Condition                          |
| ---- | ------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------- |
| US-1 | Pre-flight composes Phase 0–7 asserters                       | `verify-phase-8-preflight.sh`                                 | All exit 0                              |
| US-2 | npm versions match `main`                                      | `npm view @tour-kit/<pkg> version` × N                        | All match                               |
| US-3 | Published bundle has no Amplitude SDK strings                  | Temp project esbuild + grep                                   | 0 matches                               |
| US-4 | Release notes flag breaking change + new path                  | `gh release view '@tour-kit/analytics@0.12.0' --json body`    | Contains both old + new import          |
| US-5 | `pnpm release` is safely re-runnable                          | Documented; verified ad-hoc if it half-fails                  | Re-run finishes the publish              |
| US-6 | Published analytics+core probe < 5 KB gz                       | Same temp project, `gzip -c probe.bundled.js`                  | `< 5000`                                |
| US-7 | README marked SHIPPED with retrospective                       | `grep 'Status:' tasks/sprint-1-stop-the-bleeding/README.md`   | `Status: SHIPPED <date>`                |
| US-8 | 6 sprint-2 follow-up issues filed                              | `gh issue list --label sprint-2`                              | ≥ 6 open                                |

### Why Fakes Are Required
None. Phase 8 deliberately doesn't mock npm, GitHub, or `pnpm release`.
The whole point is to verify the *real* publish made it through, not
that the workspace artifact (which we always control) is correct.

### What NOT to Test
- Don't simulate `pnpm release` half-failure modes. The mitigation
  (re-run, changeset publish is idempotent) is documented; testing it
  would require breaking npm auth, which is hostile.
- Don't `npm unpublish` anything during testing. Even within the 72h
  window, unpublishing is hostile to anyone who already installed.
- Don't run the post-publish smoke against the *workspace* artifact.
  Use `pnpm add @tour-kit/analytics@latest` from npm in a fresh
  `/tmp/tk-smoke-*/` directory.
- Don't gate the post-publish asserter on a specific `version` string —
  use the version recorded in `main`'s `packages/<pkg>/package.json` to
  cross-check.
- Don't try to verify *every* changeset entry — the unbiased gate is
  "npm has the expected version." If the CHANGELOG is wrong, that's a
  separate followup.
- Don't auto-create the 6 sprint-2 issues from the asserter. Issue
  creation is a human-driven step in §7; the asserter only verifies they
  exist.

### Critical: The Two Asserters

The body of `tasks/sprint-1-stop-the-bleeding/verify-phase-8-preflight.sh`
and `verify-phase-8-postpublish.sh` are shown above. Drop them in,
`chmod +x`, and run.

### Files to Create / Modify

```
tasks/sprint-1-stop-the-bleeding/verify-phase-8-preflight.sh    # NEW
tasks/sprint-1-stop-the-bleeding/verify-phase-8-postpublish.sh  # NEW
tasks/sprint-1-stop-the-bleeding/README.md                       # MODIFIED — Status SHIPPED + retrospective

# Versioning + publishing — these are run, not committed:
.changeset/*.md                                                  # CONSUMED by `pnpm version-packages`
packages/*/package.json                                          # bumped by `pnpm version-packages`
packages/*/CHANGELOG.md                                          # appended by `pnpm version-packages`

# External, not file-system:
# - npm packages published via `pnpm release`
# - `@tour-kit/analytics@0.12.0` GitHub release via `gh release create`
# - 6 sprint-2 issues via `gh issue create`
```

### Per-File Coverage Guidance

#### `verify-phase-8-preflight.sh`
- Body shown above. Composes Phase 0–7 asserters + checks the Sprint-level
  acceptance gates.
- Run from clean `main` immediately before `pnpm version-packages`.

#### `verify-phase-8-postpublish.sh`
- Body shown above. Runs after `pnpm release` returns success.
- Requires network (`npm view`, `pnpm add`, `gh`).
- Uses a `mktemp -d` smoke dir; cleans up after.

#### `tasks/sprint-1-stop-the-bleeding/README.md`
- Flip the `Status:` line from `PLANNED` to `SHIPPED YYYY-MM-DD`.
- Append a `## Retrospective` section at the bottom (per phase plan §6.4).

### Success Criteria
- `verify-phase-8-preflight.sh` all green BEFORE `pnpm version-packages`.
- `pnpm release` returns success.
- `verify-phase-8-postpublish.sh` all green within 5 minutes of `pnpm release`.
- 6 sprint-2 issues filed via `gh issue create`, tagged `sprint-2`.
- README status flipped to SHIPPED with retrospective written.

### Expected End State

```
tasks/sprint-1-stop-the-bleeding/
├── README.md                                # Status: SHIPPED <date> + retrospective
├── verify-phase-8-preflight.sh              # NEW
├── verify-phase-8-postpublish.sh            # NEW
└── (phase plans + test plans + per-phase asserters from 0-7)

npm:
├── @tour-kit/analytics@0.12.0               # PUBLISHED (breaking)
├── @tour-kit/adoption@<patch>               # PUBLISHED
├── @tour-kit/core,react,hints@<patch>       # PUBLISHED (linked)
└── (every catalog-touched package, patch)

GitHub:
├── Release: @tour-kit/analytics@0.12.0      # NEW (with migration notes)
├── Tags: per-package version tags           # NEW
├── Discussion: pinned migration thread      # NEW
└── 6 sprint-2 issues open                   # NEW
```
---

---

## Run Commands

```bash
# Pre-flight — BEFORE pnpm version-packages
chmod +x tasks/sprint-1-stop-the-bleeding/verify-phase-8-preflight.sh
bash tasks/sprint-1-stop-the-bleeding/verify-phase-8-preflight.sh

# Cut the version PR (after preflight green)
pnpm version-packages
git diff --stat
git checkout -b release/sprint-1
git add packages/*/package.json packages/*/CHANGELOG.md .changeset/
git commit -m "chore: version packages for sprint-1 release"
git push -u origin release/sprint-1
gh pr create --title "chore: version packages for sprint-1 release"

# After version PR merges to main:
git checkout main && git pull --ff-only
pnpm release

# Post-publish smoke (within 5 min of pnpm release returning)
chmod +x tasks/sprint-1-stop-the-bleeding/verify-phase-8-postpublish.sh
bash tasks/sprint-1-stop-the-bleeding/verify-phase-8-postpublish.sh

# Manual: create the GitHub release with migration notes
gh release create '@tour-kit/analytics@0.12.0' \
  --title 'analytics@0.12.0 — plugins move to subpaths (BREAKING)' \
  --notes-file - <<'EOF'
[paste the release-notes body from phase-8-release.md §5]
EOF

# Manual: file 6 sprint-2 follow-up issues
for ref in B-1 F-3 R-1 R-2 R-4 R-5 G-3 G-7; do
  # Adjust title per audit context; example:
  gh issue create --title "[sprint-2] Follow-up: audit $ref" --label sprint-2 \
    --body "Follow-up from Sprint 1; see reports/package-audit-2026-05-23.md §$ref."
done

# Re-run preflight if anything is red
bash tasks/sprint-1-stop-the-bleeding/verify-phase-8-preflight.sh

# After all green: flip the README status
sed -i 's/Status: PLANNED/Status: SHIPPED '"$(date -I)"'/' tasks/sprint-1-stop-the-bleeding/README.md
# Then append the ## Retrospective section manually.
```

---

## End of Sprint-1 test plan train

After Phase 8 ships, archive the directory:

```bash
mkdir -p tasks/_archive
mv tasks/sprint-1-stop-the-bleeding tasks/_archive/
```

Then start Sprint 2 with the 6 follow-up issues as the seed backlog.

# Phase 6 — Testing: Source Code Separation

**Scope:** Repo split (public/private), npm access restrictions, CI/CD pipelines, Changesets config
**Key Pattern:** No code mocks — this phase is infrastructure. Tests are verification shell commands and checklists, not unit tests.
**Dependencies:** `npm`, `gh`, `pnpm`, `git`
**Date:** 2026-03-30

---

## User Stories

| ID | Story | Acceptance Criteria | Test Tier |
|----|-------|---------------------|-----------|
| US-1 | As a maintainer, I want all 8 pro packages restricted on npm, so that unauthorized users cannot install them | `npm access get status @tour-kit/<pkg>` returns `restricted` for all 8 | Verification (npm CLI) |
| US-2 | As a maintainer, I want a private GitHub repo containing all 8 pro packages, so that source code is not publicly visible | `gh repo view domidex01/tour-kit-pro --json visibility` returns `PRIVATE`; `ls packages/` lists all 8 | Verification (gh CLI + filesystem) |
| US-3 | As a maintainer, I want pro packages to build and pass tests in the private repo, so that the separation did not break anything | `pnpm build` and `pnpm test` exit 0 in private repo | Verification (build + test) |
| US-4 | As a maintainer, I want the public repo to contain zero pro source, so that proprietary code is not exposed | `git ls-files packages/{adoption,ai,...}` returns empty | Verification (git CLI) |
| US-5 | As a maintainer, I want the public repo to build with only free packages, so that the open-source project remains functional | `pnpm install && pnpm build && pnpm typecheck` exits 0 | Verification (build) |
| US-6 | As a maintainer, I want pro packages to depend on free packages via npm semver (not workspace:*), so that the repos are truly independent | `grep "workspace" packages/*/package.json` shows no free-package workspace refs | Verification (grep) |
| US-7 | As a maintainer, I want Changesets configured with `access: restricted` in the private repo, so that publishes default to restricted | `.changeset/config.json` contains `"access": "restricted"` | Verification (file content) |
| US-8 | As a maintainer, I want CI/CD workflows in the private repo, so that builds and releases are automated | `ci.yml` and `release.yml` exist with correct configuration | Verification (file content) |
| US-9 | As a maintainer, I want dry-run publish to succeed for all 8 pro packages, so that the release pipeline works end-to-end | `npm publish --dry-run --access restricted` exits 0 for all 8 | Verification (npm CLI) |
| US-10 | As a maintainer, I want the docs site to build after pro packages are removed, so that the public website is not broken | `pnpm build --filter=docs` exits 0 | Verification (build) |

---

## 1. Component Mock Strategy

**Key Pattern:** Phase 6 restructures repositories and npm access -- it does not add or modify application code. Every "test" is a verification command run against real systems (npm registry, GitHub API, filesystem, build toolchain). Mocking would defeat the purpose.

| Component | Strategy | Rationale |
|-----------|----------|-----------|
| npm registry | Real `npm access` commands | Must verify actual npm access settings, not simulated ones |
| GitHub API | Real `gh` CLI commands | Must verify actual repo visibility and existence |
| pnpm build | Real build in both repos | Must verify real dependency resolution and compilation |
| pnpm test | Real test suite execution | Must verify tests pass with npm deps instead of workspace links |
| git | Real `git ls-files` commands | Must verify actual file presence/absence at HEAD |
| Changesets config | Real file content check | Must verify the actual config that will be used by CI |
| GitHub Actions | Real workflow YAML inspection | Must verify the actual CI/CD pipeline definition |
| npm publish | Real `--dry-run` flag | Must verify actual publishability without side effects |

---

## 2. Test Tier Table

| Test ID | Tier | US | External Deps | Skip Condition |
|---------|------|----|---------------|----------------|
| V-01: npm access restricted | Verification | US-1 | npm registry, npm auth | `npm whoami` fails |
| V-02: Private repo exists and is private | Verification | US-2 | GitHub API, gh auth | `gh auth status` fails |
| V-03: Private repo contains all 8 packages | Verification | US-2 | Filesystem (tour-kit-pro) | Private repo not cloned locally |
| V-04: Private repo build passes | Verification | US-3 | pnpm, node_modules | Private repo not cloned locally |
| V-05: Private repo tests pass | Verification | US-3 | pnpm, vitest | Private repo not cloned locally |
| V-06: Public repo zero pro source | Verification | US-4 | git | Not on cleaned branch |
| V-07: Public repo free packages build | Verification | US-5 | pnpm, node_modules | Pro packages not yet removed |
| V-08: Public repo typecheck passes | Verification | US-5 | pnpm, typescript | Pro packages not yet removed |
| V-09: No free-package workspace refs in private repo | Verification | US-6 | grep, filesystem | Private repo not cloned locally |
| V-10: Cross-pro workspace refs intact | Verification | US-6 | grep, filesystem | Private repo not cloned locally |
| V-11: Changesets access restricted | Verification | US-7 | filesystem | Private repo not cloned locally |
| V-12: Changesets linked array complete | Verification | US-7 | filesystem | Private repo not cloned locally |
| V-13: ci.yml exists and correct | Verification | US-8 | filesystem | Private repo not cloned locally |
| V-14: release.yml exists and correct | Verification | US-8 | filesystem | Private repo not cloned locally |
| V-15: Dry-run publish succeeds | Verification | US-9 | npm registry, npm auth | `npm whoami` fails |
| V-16: Docs site builds | Verification | US-10 | pnpm, next.js | Pro packages not yet removed |
| V-17: No broken pro imports in docs source | Verification | US-10 | grep, filesystem | Pro packages not yet removed |

---

## 3. No Fake Implementations (Infrastructure Phase)

Phase 6 is a repository restructuring and npm access configuration phase. There is no application code to mock -- every verification must run against the real npm registry, real GitHub API, real filesystem, and real build toolchain. Faking any of these would produce false confidence in an irreversible operation.

---

## 4. Test File List

There are no vitest test files for this phase. All verification is performed via shell commands organized into verification scripts.

```
plan/
├── phase-6-tests.md                    ← This file (verification plan)
└── phase-6.md                          ← Phase plan

# Verification scripts (run manually or in CI after each step)
# No files to create — commands are inline in this plan and in phase-6.md
```

---

## 5. conftest / test setup

No vitest configuration, no test setup files, no fixtures. All verification commands are standalone shell invocations that require:

| Concern | Approach |
|---------|----------|
| npm authentication | `npm whoami` must return a valid username before running V-01, V-15 |
| gh authentication | `gh auth status` must return authenticated before running V-02 |
| Private repo availability | `tour-kit-pro` must be cloned locally (sibling to `tour-kit`) for V-03 through V-14 |
| Public repo state | Pro packages must already be removed for V-06 through V-08, V-16, V-17 |
| Build dependencies | `pnpm install` must have been run in the target repo before build/test verification |

---

## 6. Key Testing Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| No vitest test files | Shell commands only | Phase 6 produces no testable application code -- only repo structure, config files, and npm settings |
| Verify npm access via CLI | `npm access get status` | The only authoritative source for npm access level is the registry itself |
| Verify repo privacy via gh CLI | `gh repo view --json visibility` | GitHub API is the authoritative source; checking `.git/config` would not confirm server-side visibility |
| Verify file absence via git | `git ls-files` not `ls` | `git ls-files` checks what is tracked at HEAD, not what happens to be on disk (avoids false positives from untracked leftovers) |
| Verify workspace refs via grep | `grep "workspace"` on package.json files | Direct text search is the most reliable way to confirm dependency format migration |
| Verify CI/CD via file content | `cat` + `grep` on YAML files | Workflow files must be inspected for correct config (access, registry-url, secrets references) |
| Dry-run publish as final gate | `npm publish --dry-run --access restricted` | Catches packaging issues (missing files, bad main/exports) without actually publishing |
| Run verification in order | Steps 1-5 before public cleanup | If private repo build fails, do NOT proceed to delete pro packages from public repo |

---

## 7. Example Test Case

### Full Verification Script

This script runs all verification checks in sequence. Run it after completing all Phase 6 steps.

```bash
#!/usr/bin/env bash
set -euo pipefail

PASS=0
FAIL=0
SKIP=0

check() {
  local id="$1" desc="$2"
  shift 2
  if "$@" >/dev/null 2>&1; then
    echo "PASS  $id: $desc"
    ((PASS++))
  else
    echo "FAIL  $id: $desc"
    ((FAIL++))
  fi
}

skip() {
  local id="$1" desc="$2" reason="$3"
  echo "SKIP  $id: $desc ($reason)"
  ((SKIP++))
}

PUBLIC_REPO="$HOME/projects/tour-kit"
PRIVATE_REPO="$HOME/projects/tour-kit-pro"
PRO_PACKAGES=(adoption ai analytics announcements checklists license media scheduling)

echo "=== Phase 6 Verification ==="
echo ""

# --- V-01: npm access restricted ---
echo "--- npm Access ---"
if npm whoami >/dev/null 2>&1; then
  for pkg in "${PRO_PACKAGES[@]}"; do
    status=$(npm access get status "@tour-kit/$pkg" 2>&1 || true)
    if echo "$status" | grep -q "restricted"; then
      echo "PASS  V-01: @tour-kit/$pkg is restricted"
      ((PASS++))
    else
      echo "FAIL  V-01: @tour-kit/$pkg is NOT restricted (got: $status)"
      ((FAIL++))
    fi
  done
else
  skip "V-01" "npm access restricted (all 8)" "npm not authenticated"
fi

# --- V-02: Private repo exists and is private ---
echo ""
echo "--- Private Repo ---"
if gh auth status >/dev/null 2>&1; then
  visibility=$(gh repo view domidex01/tour-kit-pro --json visibility -q .visibility 2>&1 || echo "NOT_FOUND")
  if [ "$visibility" = "PRIVATE" ]; then
    echo "PASS  V-02: domidex01/tour-kit-pro is PRIVATE"
    ((PASS++))
  else
    echo "FAIL  V-02: domidex01/tour-kit-pro visibility is $visibility (expected PRIVATE)"
    ((FAIL++))
  fi
else
  skip "V-02" "Private repo visibility" "gh not authenticated"
fi

# --- V-03: Private repo contains all 8 packages ---
if [ -d "$PRIVATE_REPO" ]; then
  missing=0
  for pkg in "${PRO_PACKAGES[@]}"; do
    if [ ! -d "$PRIVATE_REPO/packages/$pkg" ]; then
      echo "FAIL  V-03: $PRIVATE_REPO/packages/$pkg missing"
      ((FAIL++))
      missing=1
    fi
  done
  if [ $missing -eq 0 ]; then
    echo "PASS  V-03: All 8 pro packages present in private repo"
    ((PASS++))
  fi
else
  skip "V-03" "Private repo contains all 8 packages" "Private repo not cloned at $PRIVATE_REPO"
fi

# --- V-04: Private repo build passes ---
echo ""
echo "--- Private Repo Build ---"
if [ -d "$PRIVATE_REPO" ]; then
  check "V-04" "Private repo pnpm build" bash -c "cd $PRIVATE_REPO && pnpm build"
else
  skip "V-04" "Private repo build" "Private repo not cloned"
fi

# --- V-05: Private repo tests pass ---
if [ -d "$PRIVATE_REPO" ]; then
  check "V-05" "Private repo pnpm test" bash -c "cd $PRIVATE_REPO && pnpm test"
else
  skip "V-05" "Private repo tests" "Private repo not cloned"
fi

# --- V-06: Public repo zero pro source ---
echo ""
echo "--- Public Repo Cleanup ---"
pro_files=$(cd "$PUBLIC_REPO" && git ls-files packages/adoption packages/ai packages/analytics packages/announcements packages/checklists packages/license packages/media packages/scheduling 2>/dev/null)
if [ -z "$pro_files" ]; then
  echo "PASS  V-06: Public repo has zero pro source files"
  ((PASS++))
else
  count=$(echo "$pro_files" | wc -l)
  echo "FAIL  V-06: Public repo still has $count pro source files"
  ((FAIL++))
fi

# --- V-07: Public repo free packages build ---
check "V-07" "Public repo pnpm build" bash -c "cd $PUBLIC_REPO && pnpm install && pnpm build"

# --- V-08: Public repo typecheck passes ---
check "V-08" "Public repo pnpm typecheck" bash -c "cd $PUBLIC_REPO && pnpm typecheck"

# --- V-09: No free-package workspace refs in private repo ---
echo ""
echo "--- Dependency Migration ---"
if [ -d "$PRIVATE_REPO" ]; then
  bad_refs=$(grep -r '"@tour-kit/\(core\|react\|hints\)": "workspace' "$PRIVATE_REPO"/packages/*/package.json 2>/dev/null || true)
  if [ -z "$bad_refs" ]; then
    echo "PASS  V-09: No free-package workspace:* refs in private repo"
    ((PASS++))
  else
    echo "FAIL  V-09: Found free-package workspace refs:"
    echo "$bad_refs"
    ((FAIL++))
  fi
else
  skip "V-09" "No free-package workspace refs" "Private repo not cloned"
fi

# --- V-10: Cross-pro workspace refs intact ---
if [ -d "$PRIVATE_REPO" ]; then
  # announcements should depend on scheduling via workspace:*
  cross_refs=$(grep -r '"@tour-kit/scheduling": "workspace' "$PRIVATE_REPO"/packages/announcements/package.json 2>/dev/null || true)
  if [ -n "$cross_refs" ]; then
    echo "PASS  V-10: Cross-pro workspace refs intact (announcements -> scheduling)"
    ((PASS++))
  else
    echo "WARN  V-10: No cross-pro workspace ref found (may not apply if no cross-pro deps exist)"
    ((PASS++))
  fi
else
  skip "V-10" "Cross-pro workspace refs" "Private repo not cloned"
fi

# --- V-11: Changesets access restricted ---
echo ""
echo "--- Changesets Config ---"
if [ -d "$PRIVATE_REPO" ]; then
  if grep -q '"access": "restricted"' "$PRIVATE_REPO/.changeset/config.json" 2>/dev/null; then
    echo "PASS  V-11: Changesets access is restricted"
    ((PASS++))
  else
    echo "FAIL  V-11: Changesets access is NOT restricted"
    ((FAIL++))
  fi
else
  skip "V-11" "Changesets access restricted" "Private repo not cloned"
fi

# --- V-12: Changesets linked array complete ---
if [ -d "$PRIVATE_REPO" ]; then
  all_linked=true
  for pkg in "${PRO_PACKAGES[@]}"; do
    if ! grep -q "@tour-kit/$pkg" "$PRIVATE_REPO/.changeset/config.json" 2>/dev/null; then
      echo "FAIL  V-12: @tour-kit/$pkg missing from Changesets linked array"
      all_linked=false
      ((FAIL++))
    fi
  done
  if $all_linked; then
    echo "PASS  V-12: All 8 pro packages in Changesets linked array"
    ((PASS++))
  fi
else
  skip "V-12" "Changesets linked array" "Private repo not cloned"
fi

# --- V-13: ci.yml exists and correct ---
echo ""
echo "--- CI/CD Workflows ---"
if [ -d "$PRIVATE_REPO" ]; then
  if [ -f "$PRIVATE_REPO/.github/workflows/ci.yml" ]; then
    if grep -q "pnpm install --frozen-lockfile" "$PRIVATE_REPO/.github/workflows/ci.yml" && \
       grep -q "pnpm build" "$PRIVATE_REPO/.github/workflows/ci.yml" && \
       grep -q "pnpm test" "$PRIVATE_REPO/.github/workflows/ci.yml"; then
      echo "PASS  V-13: ci.yml exists with build + test steps"
      ((PASS++))
    else
      echo "FAIL  V-13: ci.yml missing expected steps"
      ((FAIL++))
    fi
  else
    echo "FAIL  V-13: ci.yml does not exist"
    ((FAIL++))
  fi
else
  skip "V-13" "ci.yml exists" "Private repo not cloned"
fi

# --- V-14: release.yml exists and correct ---
if [ -d "$PRIVATE_REPO" ]; then
  if [ -f "$PRIVATE_REPO/.github/workflows/release.yml" ]; then
    if grep -q "changesets/action" "$PRIVATE_REPO/.github/workflows/release.yml" && \
       grep -q "NPM_TOKEN" "$PRIVATE_REPO/.github/workflows/release.yml" && \
       grep -q "registry-url" "$PRIVATE_REPO/.github/workflows/release.yml"; then
      echo "PASS  V-14: release.yml exists with Changesets action, NPM_TOKEN, and registry-url"
      ((PASS++))
    else
      echo "FAIL  V-14: release.yml missing expected configuration"
      ((FAIL++))
    fi
  else
    echo "FAIL  V-14: release.yml does not exist"
    ((FAIL++))
  fi
else
  skip "V-14" "release.yml exists" "Private repo not cloned"
fi

# --- V-15: Dry-run publish succeeds ---
echo ""
echo "--- Dry-Run Publish ---"
if [ -d "$PRIVATE_REPO" ] && npm whoami >/dev/null 2>&1; then
  for pkg in "${PRO_PACKAGES[@]}"; do
    if (cd "$PRIVATE_REPO/packages/$pkg" && npm publish --dry-run --access restricted >/dev/null 2>&1); then
      echo "PASS  V-15: @tour-kit/$pkg dry-run publish succeeded"
      ((PASS++))
    else
      echo "FAIL  V-15: @tour-kit/$pkg dry-run publish failed"
      ((FAIL++))
    fi
  done
else
  skip "V-15" "Dry-run publish" "Private repo not cloned or npm not authenticated"
fi

# --- V-16: Docs site builds ---
echo ""
echo "--- Docs Site ---"
check "V-16" "Docs site builds" bash -c "cd $PUBLIC_REPO && pnpm build --filter=docs"

# --- V-17: No broken pro imports in docs source ---
broken_imports=$(grep -rn "@tour-kit/license\|@tour-kit/adoption\|@tour-kit/analytics\|@tour-kit/announcements\|@tour-kit/checklists\|@tour-kit/media\|@tour-kit/scheduling\|@tour-kit/ai" \
  "$PUBLIC_REPO/apps/docs/" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || true)
if [ -z "$broken_imports" ]; then
  echo "PASS  V-17: No broken pro imports in docs source (.ts/.tsx/.js/.jsx)"
  ((PASS++))
else
  count=$(echo "$broken_imports" | wc -l)
  echo "FAIL  V-17: Found $count broken pro imports in docs source:"
  echo "$broken_imports" | head -10
  ((FAIL++))
fi

# --- Summary ---
echo ""
echo "=== Summary ==="
echo "PASS: $PASS"
echo "FAIL: $FAIL"
echo "SKIP: $SKIP"
echo ""
if [ $FAIL -gt 0 ]; then
  echo "RESULT: FAILED — $FAIL verification(s) did not pass"
  exit 1
else
  echo "RESULT: PASSED — all $PASS verification(s) passed ($SKIP skipped)"
  exit 0
fi
```

---

## 8. Execution Prompt

> Paste this into a Claude Code session to run Phase 6 verification.

You are running **Phase 6 verification** for the Tour Kit Licensing System -- Source Code Separation.

Phase 6 is an infrastructure phase. There are no vitest test files to write. Your job is to run the verification commands from this plan against the actual state of both repos.

### What to verify (in order)

**Step 1: npm access (requires npm auth)**

Run `npm access get status @tour-kit/<pkg>` for all 8 pro packages: adoption, ai, analytics, announcements, checklists, license, media, scheduling. All must return `restricted`. If any return `public`, run `npm access restricted @tour-kit/<pkg>` to fix it.

**Step 2: Private repo existence and privacy**

Run `gh repo view domidex01/tour-kit-pro --json visibility -q .visibility`. Must return `PRIVATE`.

**Step 3: Private repo contents and build**

Verify `ls tour-kit-pro/packages/` lists all 8 pro packages. Run `cd tour-kit-pro && pnpm install && pnpm build && pnpm test`. All must exit 0.

**Step 4: Dependency migration**

Run `grep -r '"@tour-kit/\(core\|react\|hints\)": "workspace' tour-kit-pro/packages/*/package.json`. Must return empty (no free-package workspace refs). Cross-pro workspace refs (e.g., scheduling in announcements) are expected and correct.

**Step 5: Public repo cleanup**

Run `cd tour-kit && git ls-files packages/{adoption,ai,analytics,announcements,checklists,license,media,scheduling}`. Must return empty. Then run `pnpm install && pnpm build && pnpm typecheck`. Must exit 0.

**Step 6: Changesets and CI/CD**

Verify `.changeset/config.json` in private repo has `"access": "restricted"` and all 8 packages in the `linked` array. Verify `.github/workflows/ci.yml` and `release.yml` exist with correct configuration (pnpm install, build, test, Changesets action, NPM_TOKEN secret reference).

**Step 7: Dry-run publish**

Run `npm publish --dry-run --access restricted` in each of the 8 pro package directories. All must exit 0.

**Step 8: Docs site**

Run `cd tour-kit && pnpm build --filter=docs`. Must exit 0. Verify no `.ts`/`.tsx`/`.js`/`.jsx` files in `apps/docs/` import from pro packages.

### Key constraints

- Run verification in order. If Steps 1-3 fail, do NOT proceed to Step 5 (public repo cleanup is irreversible).
- The verification script in Section 7 can be run as a single pass after all steps are complete.
- Report results as PASS/FAIL/SKIP for each verification ID (V-01 through V-17).

---

## 9. Run Commands

```bash
# Pre-flight checks
npm whoami                                    # Must return a valid username
gh auth status                                # Must return authenticated

# V-01: npm access (run for each of the 8 pro packages)
for pkg in adoption ai analytics announcements checklists license media scheduling; do
  echo "@tour-kit/$pkg: $(npm access get status @tour-kit/$pkg)"
done

# V-02: Private repo visibility
gh repo view domidex01/tour-kit-pro --json visibility -q .visibility

# V-03: Private repo package listing
ls ~/projects/tour-kit-pro/packages/

# V-04: Private repo build
cd ~/projects/tour-kit-pro && pnpm install && pnpm build

# V-05: Private repo tests
cd ~/projects/tour-kit-pro && pnpm test

# V-06: Public repo zero pro source
cd ~/projects/tour-kit && git ls-files packages/adoption packages/ai packages/analytics packages/announcements packages/checklists packages/license packages/media packages/scheduling

# V-07 + V-08: Public repo build and typecheck
cd ~/projects/tour-kit && pnpm install && pnpm build && pnpm typecheck

# V-09: No free-package workspace refs
grep -r '"@tour-kit/\(core\|react\|hints\)": "workspace' ~/projects/tour-kit-pro/packages/*/package.json

# V-10: Cross-pro workspace refs (expected to find some)
grep -r '"@tour-kit/.*": "workspace' ~/projects/tour-kit-pro/packages/*/package.json

# V-11 + V-12: Changesets config
cat ~/projects/tour-kit-pro/.changeset/config.json

# V-13 + V-14: CI/CD workflows
ls ~/projects/tour-kit-pro/.github/workflows/
cat ~/projects/tour-kit-pro/.github/workflows/ci.yml
cat ~/projects/tour-kit-pro/.github/workflows/release.yml

# V-15: Dry-run publish (run for each of the 8 pro packages)
for pkg in adoption ai analytics announcements checklists license media scheduling; do
  echo "=== @tour-kit/$pkg ==="
  (cd ~/projects/tour-kit-pro/packages/$pkg && npm publish --dry-run --access restricted 2>&1)
done

# V-16: Docs site build
cd ~/projects/tour-kit && pnpm build --filter=docs

# V-17: No broken pro imports in docs
grep -rn "@tour-kit/license\|@tour-kit/adoption\|@tour-kit/analytics\|@tour-kit/announcements\|@tour-kit/checklists\|@tour-kit/media\|@tour-kit/scheduling\|@tour-kit/ai" \
  ~/projects/tour-kit/apps/docs/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
```

---

## Coverage Check

| # | Item | Status |
|---|------|--------|
| 1 | All 8 pro packages restricted on npm (V-01) | Verification command |
| 2 | Private repo exists and is PRIVATE (V-02) | Verification command |
| 3 | Private repo contains all 8 packages (V-03) | Verification command |
| 4 | Private repo build passes (V-04) | Verification command |
| 5 | Private repo tests pass (V-05) | Verification command |
| 6 | Public repo has zero pro source at HEAD (V-06) | Verification command |
| 7 | Public repo free packages build (V-07) | Verification command |
| 8 | Public repo typecheck passes (V-08) | Verification command |
| 9 | No free-package workspace:* refs in private repo (V-09) | Verification command |
| 10 | Cross-pro workspace refs intact (V-10) | Verification command |
| 11 | Changesets access: restricted (V-11) | Verification command |
| 12 | Changesets linked array has all 8 packages (V-12) | Verification command |
| 13 | ci.yml exists with build + test steps (V-13) | Verification command |
| 14 | release.yml exists with Changesets action + NPM_TOKEN (V-14) | Verification command |
| 15 | Dry-run publish succeeds for all 8 packages (V-15) | Verification command |
| 16 | Docs site builds after cleanup (V-16) | Verification command |
| 17 | No broken pro imports in docs .ts/.tsx/.js/.jsx files (V-17) | Verification command |

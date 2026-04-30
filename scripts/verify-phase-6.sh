#!/usr/bin/env bash
# Phase 6 — CI Gate, Wiki Sync, Ship verification.
# Wraps all static (non-CI) user-story checks from plan/improvement-phase-6-tests.md.
# The deliberate-breach experiment (US-1, dynamic) lives in the PR body, not here.
# Exits non-zero on the first failure.
set -euo pipefail

# US-1 / US-8 — workflow file structure + pinned action versions
test -f .github/workflows/size-limit.yml
grep -q 'pull_request' .github/workflows/size-limit.yml
grep -qE 'andresz1/size-limit-action@v1\b' .github/workflows/size-limit.yml
grep -qE 'pnpm/action-setup@v3\b' .github/workflows/size-limit.yml
grep -qE 'actions/setup-node@v4\b' .github/workflows/size-limit.yml
grep -qE 'actions/checkout@v4\b' .github/workflows/size-limit.yml
! grep -qE '@main\b' .github/workflows/size-limit.yml

# US-2 — wiki has 12 package rows
[[ "$(grep -c '^| @tour-kit/' wiki/product/packages.md)" -eq 12 ]]

# US-2 (deeper) — Free/Pro split matches packages/*/package.json license fields
free_count=0
pro_count=0
for pkg in packages/*/package.json; do
  license="$(jq -r '.license // ""' "$pkg")"
  if [[ "$license" == "MIT" ]]; then
    free_count=$((free_count + 1))
  elif [[ "$license" == SEE\ LICENSE* ]]; then
    pro_count=$((pro_count + 1))
  fi
done
[[ "$free_count" -eq 3 ]] || { echo "Expected 3 Free (MIT) packages, got $free_count"; exit 1; }
[[ "$pro_count" -eq 9 ]] || { echo "Expected 9 Pro packages, got $pro_count"; exit 1; }

# Wiki tier column matches actual license fields
wiki_free="$(grep -cE '^\| @tour-kit/[a-z]+ +\| Free ' wiki/product/packages.md)"
wiki_pro="$(grep -cE '^\| @tour-kit/[a-z]+ +\| Pro ' wiki/product/packages.md)"
[[ "$wiki_free" -eq 3 ]] || { echo "Wiki Free count = $wiki_free, expected 3"; exit 1; }
[[ "$wiki_pro" -eq 9 ]] || { echo "Wiki Pro count = $wiki_pro, expected 9"; exit 1; }

# US-3 — stale "each package has its own copy" line removed from wiki
[[ "$(grep -c 'Each package has its own copy' wiki/product/packages.md)" -eq 0 ]]

# US-4 — root CLAUDE.md updated
[[ "$(grep -c 'Each package has its own copy' CLAUDE.md)" -eq 0 ]]
grep -q '@tour-kit/core/lib' CLAUDE.md

# US-5 — wiki/log.md has the 2026-05-13 entry
grep -qE '2026-05-13.*code-health pass' wiki/log.md

# Optional: lint the workflow if actionlint is available
if command -v actionlint >/dev/null 2>&1; then
  actionlint .github/workflows/size-limit.yml
fi

echo "Phase 6 static verification: PASS"

#!/usr/bin/env bash
# Phase 0 — Baseline & Size-Limit Scaffolding verification.
# Wraps all 5 user-story checks from plan/improvement-phase-0-tests.md.
# Exits non-zero on the first failure.
set -euo pipefail

# US-1 — baseline file shape
test -f plan/code-health-baseline.md
[[ "$(grep -c '^## ' plan/code-health-baseline.md)" -ge 4 ]]

# US-2 — size-limit entry count
[[ "$(jq 'length' .size-limit.json)" -eq 12 ]]

# US-3 — root devDeps
[[ "$(jq -r '.devDependencies["size-limit"] // empty' package.json)" != "" ]]
[[ "$(jq -r '.devDependencies["@size-limit/preset-small-lib"] // empty' package.json)" != "" ]]

# US-4 — branch on origin
git ls-remote --exit-code origin chore/code-health >/dev/null

# US-5 — determinism (two runs of size-limit, expect identical JSON output).
# size-limit --json exits non-zero when any budget is exceeded — that is fine for
# Phase 0 (the CI gate is enforced in Phase 6). What we are asserting here is that
# the *measurements* are stable, not that all budgets pass.
pnpm build >/dev/null
A="$(pnpm exec size-limit --json 2>/dev/null || true)"
B="$(pnpm exec size-limit --json 2>/dev/null || true)"
[[ -n "$A" && -n "$B" ]] || { echo "size-limit --json produced empty output"; exit 1; }
[[ "$A" = "$B" ]] || { echo "Determinism drift detected"; exit 1; }

# Bonus: Phase 0 must not have touched source under packages/
if ! git diff --quiet main..chore/code-health -- packages/; then
  echo "Phase 0 leaked source edits under packages/"
  exit 1
fi

echo "Phase 0 verification: PASS"

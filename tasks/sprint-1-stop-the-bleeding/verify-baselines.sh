#!/usr/bin/env bash
# tasks/sprint-1-stop-the-bleeding/verify-baselines.sh
#
# Runs after Phase 0 to confirm the baseline pipeline produced what later
# phases assume. Exits non-zero on the first failure; prints one ✓/✗ per gate.
#
# Semantic fixes vs. the spec skeleton in phase-0-tests.md:
#   - B-2 smoking-gun: `grep -c` counts matching LINES, not occurrences. The
#     analytics bundle is minified to a single line, so grep -c returns 2 even
#     though the bundle contains 13 occurrences of `@amplitude/plugin-`.
#     Switched to `grep -o ... | wc -l` which matches the documented example
#     output (`13`) in phase-0-tests.md.
#   - test-baseline gate: the spec's naive "no FAIL strings in log" check
#     conflicts with the spec's own instruction to whitelist pre-existing red
#     tests in wip.md. The gate now asserts the failing-package set equals
#     EXACTLY the whitelist (`@tour-kit/license#test`). Any new red package
#     trips the gate.

set -u
BASE="tasks/sprint-1-stop-the-bleeding/baselines"
fails=0
check() { if eval "$1"; then echo "✓ $2"; else echo "✗ $2"; fails=$((fails+1)); fi; }

# US-5: pnpm major aligned with packageManager
check '[ "$(pnpm --version | head -c 4)" = "10.2" ]' "pnpm major aligns with packageManager"

# US-1: bundle-sizes.md shape
check '[ -f "$BASE/bundle-sizes.md" ]' "bundle-sizes.md exists"
check '[ "$(grep -c "^| " "$BASE/bundle-sizes.md")" -ge 12 ]' "bundle-sizes.md has ≥ 12 data rows"
check 'awk -F"|" "/analytics/ {gsub(/ /,\"\",\$3); if (\$3+0 > 60000 && \$3+0 < 68000) ok=1} END{exit !ok}" "$BASE/bundle-sizes.md"' "analytics gz in [60k,68k]"

# US-2: B-2 smoking gun (still in tree at baseline time)
# NOTE: grep -o ... | wc -l (not grep -c) because the bundle is single-line minified.
check '[ "$(grep -o "@amplitude/plugin-" packages/analytics/dist/plugins/amplitude.js 2>/dev/null | wc -l)" -ge 10 ]' "amplitude SDK inlined (B-2 reproducible)"

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

# Test baseline: the failing-package set must exactly equal the WIP whitelist.
# WIP whitelist (from baselines/wip.md): @tour-kit/license#test
# Turbo emits a canonical `Failed:    <pkg>#task` summary line — grep it.
expected_failed="@tour-kit/license#test"
actual_failed="$(grep -E '^Failed: ' "$BASE/test-run.log" | grep -oE '@tour-kit/[a-z-]+#test' | sort -u | tr '\n' ' ' | sed 's/ $//')"
check '[ "$actual_failed" = "$expected_failed" ]' "baseline failures == WIP whitelist ($expected_failed)"

[ "$fails" -eq 0 ] || { echo "FAILED gates: $fails"; exit 1; }
echo "All Phase 0 baselines OK."

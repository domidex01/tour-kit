#!/usr/bin/env bash
# verify-phase-1.sh — Phase 1 acceptance gate.
# Run from the repo root after `pnpm --filter @tour-kit/analytics build`.
# Idempotent: every gate is read-only.
set -u
fails=0

gate() {
  if eval "$1" >/dev/null 2>&1; then
    echo "ok  $2"
  else
    echo "FAIL  $2 — $(eval "$3" 2>&1)"
    fails=$((fails + 1))
  fi
}

DIST=packages/analytics/dist
gz_idx=$(gzip -c "$DIST/index.js" | wc -c | tr -d ' ')
gz_amp=$(gzip -c "$DIST/plugins/amplitude.js" | wc -c | tr -d ' ')
amp_strings=$(grep -c '@amplitude/plugin-' "$DIST/plugins/amplitude.js" || true)

# Bundle-size gates
gate "[ $gz_idx -lt 8000 ]"   "US-1: dist/index.js gz < 8000 B"               "echo got $gz_idx"
gate "[ $gz_amp -lt 1000 ]"   "US-1: dist/plugins/amplitude.js gz < 1000 B"   "echo got $gz_amp"
gate "[ $amp_strings -eq 0 ]" "US-2: no @amplitude/plugin- strings in dist"   "echo got $amp_strings"

# Package metadata gates
gate 'node -e "const p=require(\"./packages/analytics/package.json\"); process.exit(p.peerDependencies?.[\"@amplitude/analytics-browser\"] ? 0 : 1)"' \
     'US-4: @amplitude/analytics-browser in peerDependencies' \
     'echo "missing peerDependencies entry"'
gate 'node -e "const p=require(\"./packages/analytics/package.json\"); process.exit(p.peerDependenciesMeta?.[\"@amplitude/analytics-browser\"]?.optional ? 0 : 1)"' \
     'US-4: peerDependenciesMeta.@amplitude/analytics-browser.optional == true' \
     'echo "missing optional flag"'
gate 'node -e "const p=require(\"./packages/analytics/package.json\"); process.exit(p.peerDependencies?.[\"posthog-js\"] && p.peerDependencies?.[\"mixpanel-browser\"] ? 0 : 1)"' \
     'US-4: posthog-js + mixpanel-browser also declared as peers' \
     'echo "missing posthog/mixpanel peers"'

# Test gate
gate 'pnpm --filter @tour-kit/analytics test --run >/tmp/phase-1-test.log 2>&1' \
     'US-6: analytics vitest suite green' \
     'tail -n10 /tmp/phase-1-test.log'

# Downstream build gate (the slowest — leave for last)
gate "pnpm build --filter='./packages/*' >/tmp/phase-1-build.log 2>&1" \
     'US-3: monorepo build green' \
     'tail -n10 /tmp/phase-1-build.log'

if [ "$fails" -eq 0 ]; then
  echo
  echo "Phase 1 all gates green."
  exit 0
fi
echo
echo "Phase 1 FAILED gates: $fails"
exit 1

#!/usr/bin/env bash
# tasks/sprint-1-stop-the-bleeding/verify-phase-7.sh
# Phase 7 (audit F-2) gate runner.
# Run after Phases 1-3 are merged + Phase 7 edits applied + build green:
#   pnpm build --filter='./packages/*' && bash tasks/sprint-1-stop-the-bleeding/verify-phase-7.sh
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

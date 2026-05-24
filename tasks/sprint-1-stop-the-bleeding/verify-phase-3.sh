#!/usr/bin/env bash
# tasks/sprint-1-stop-the-bleeding/verify-phase-3.sh
# Run before opening the Phase 3 PR.
set -u
fails=0
gate() { if eval "$1"; then echo "✓ $2"; else echo "✗ $2 — $(eval "$3")"; fails=$((fails+1)); fi; }

# US-1: field exists, value is the boolean false
gate 'node -e "const p=require(\"./packages/adoption/package.json\"); process.exit(p.sideEffects === false ? 0 : 1)"' \
     'US-1: adoption package.json has sideEffects === false' "echo missing or wrong type"

# US-2: matches sibling convention
unique=$(grep -h '"sideEffects"' packages/*/package.json | sort -u | wc -l | tr -d ' ')
gate "[ $unique -eq 1 ]" "US-2: every package uses the same sideEffects line" "grep -l '\"sideEffects\"' packages/*/package.json"

# US-2 (corollary): adoption is no longer the missing one
gate 'grep -q "\"sideEffects\": false" packages/adoption/package.json' \
     'US-2: adoption line matches sibling form (false, not array)' "head -30 packages/adoption/package.json"

# US-4: build + test green
gate 'pnpm --filter @tour-kit/adoption build >/tmp/phase-3-build.log 2>&1' \
     'US-4: adoption build green' "tail -n5 /tmp/phase-3-build.log"
gate 'pnpm --filter @tour-kit/adoption test --run >/tmp/phase-3-test.log 2>&1' \
     'US-4: adoption vitest green' "tail -n5 /tmp/phase-3-test.log"

# Sanity: dist exists and has at least the expected entry points
gate '[ -f packages/adoption/dist/index.js ]' 'US-4: dist/index.js exists' "echo missing"
gate '[ -f packages/adoption/dist/index.d.ts ]' 'US-4: dist/index.d.ts exists' "echo missing"
gate '[ -d packages/adoption/dist/styles ] || [ -f packages/adoption/dist/styles/funnel.css ]' \
     'US-4: dist styles still emitted' "ls packages/adoption/dist/styles 2>/dev/null"

[ "$fails" -eq 0 ] || { echo "Phase 3 FAILED gates: $fails"; exit 1; }
echo "Phase 3 all gates green."

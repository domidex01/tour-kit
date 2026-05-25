#!/usr/bin/env bash
# tasks/sprint-1-stop-the-bleeding/verify-phase-6.sh
# Run before opening the Phase 6 PR.
set -u
fails=0
gate() { if eval "$1"; then echo "✓ $2"; else echo "✗ $2 — $(eval "$3")"; fails=$((fails+1)); fi; }

DOCS="apps/docs/content/docs"

# US-2: index.mdx exists with key concepts
gate "[ -f $DOCS/testing-library/index.mdx ]" 'US-2: testing-library/index.mdx exists' "echo missing"
gate "grep -q 'setupTourKitTesting' $DOCS/testing-library/index.mdx" 'US-2: index mentions setupTourKitTesting' "echo missing"
gate "grep -q 'HookProbe' $DOCS/testing-library/index.mdx" 'US-2: index mentions HookProbe' "echo missing"
gate "grep -q 'TourCard' $DOCS/testing-library/index.mdx" 'US-2: index uses TourCard in example' "echo missing"

# US-3: recipes.mdx with 8 numbered sections
gate "[ -f $DOCS/testing-library/recipes.mdx ]" 'US-3: recipes.mdx exists' "echo missing"
for n in 1 2 3 4 5 6 7 8; do
  gate "grep -qE '^## $n\\. ' $DOCS/testing-library/recipes.mdx" "US-3: recipes.mdx has section $n" "echo missing"
done

# US-1: meta.json wiring
gate "[ -f $DOCS/testing-library/meta.json ]" 'US-1: testing-library/meta.json exists' "echo missing"
gate 'node -e "const m=require(\"./apps/docs/content/docs/testing-library/meta.json\"); process.exit(m.pages?.includes(\"index\") && m.pages?.includes(\"recipes\") ? 0 : 1)"' \
     'US-1: meta.json lists index + recipes' "cat $DOCS/testing-library/meta.json"
gate 'node -e "const m=require(\"./apps/docs/content/docs/meta.json\"); const idx=m.pages.indexOf(\"---Resources---\"); const end=m.pages.findIndex((p,i)=>i>idx && p.startsWith(\"---\")); const slice=m.pages.slice(idx, end>=0?end:undefined); process.exit(slice.includes(\"testing-library\") ? 0 : 1)"' \
     'US-1: root meta.json lists testing-library under Resources' "cat $DOCS/meta.json | grep -A 12 Resources"

# US-5: every documented helper exists in source.
# NOTE: matches the identifier anywhere in the barrel rather than anchoring on
# `export` — `expectStepVisible` is re-exported across multiple lines, and US-7
# forbids reformatting the package to make a line-anchored grep happy.
for helper in setupTourKitTesting virtualTarget expectStepVisible advanceTour previousTour skipTour completeTour goToStep HookProbe getActiveTourHandle TourKitTestingError; do
  gate "grep -qE '\\b$helper\\b' packages/testing-library/src/index.ts" \
       "US-5: $helper exported by package" "grep -n $helper packages/testing-library/src/index.ts"
done

# US-7: no package code touched
n=$(git diff --name-only -- packages/ | wc -l | tr -d ' ')
gate "[ $n -eq 0 ]" "US-7: zero files under packages/ changed" "git diff --name-only -- packages/"

# US-8: internal link integrity (only /docs/... refs).
# NOTE: a `/docs/X` URL maps to the filesystem path apps/docs/content/docs/X —
# the docs live under apps/docs/content/, not directly under apps/.
missing_links=0
while read -r link; do
  target=$(echo "$link" | sed 's|#.*||' | sed 's|^/||')
  if [ -f "apps/docs/content/$target.mdx" ] || [ -f "apps/docs/content/$target/index.mdx" ]; then
    :
  else
    echo "  ✗ broken link: $link"
    missing_links=$((missing_links+1))
  fi
done < <(grep -hoE '\(/docs/[a-z0-9-]+(/[a-z0-9-]+)*\)' $DOCS/testing-library/*.mdx 2>/dev/null | tr -d '()' | sort -u)

gate "[ $missing_links -eq 0 ]" "US-8: all internal /docs/ links resolve" "echo $missing_links broken"

# US-6: docs build
gate 'pnpm --filter @tour-kit/docs build >/tmp/phase-6-build.log 2>&1' \
     'US-6: apps/docs builds' "tail -n10 /tmp/phase-6-build.log"

[ "$fails" -eq 0 ] || { echo "Phase 6 FAILED gates: $fails"; exit 1; }
echo "Phase 6 all gates green."

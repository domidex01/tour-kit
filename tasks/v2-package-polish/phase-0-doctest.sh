#!/usr/bin/env bash
# Phase 0 doc gate — six US-N assertions against tasks/v2-package-polish/phase-0-validation.md.
# Run from the repo root: `bash tasks/v2-package-polish/phase-0-doctest.sh`
set -euo pipefail

DOC="tasks/v2-package-polish/phase-0-validation.md"
test -f "$DOC" || { echo "FAIL: $DOC missing"; exit 1; }

# US-1..US-6 sanity — at least six top-level ## sections, one per task
sections=$(grep -c "^## " "$DOC")
[ "$sections" -ge 6 ] || { echo "FAIL: expected >=6 ## sections, got $sections"; exit 1; }

# US-1 — §2 useTourActions snippet must compile and declare both names
awk '/^## 2\./,/^## 3\./' "$DOC" | awk '/^```ts/{flag=1;next}/^```/{flag=0}flag' > /tmp/scratch-use-tour-actions.ts
test -s /tmp/scratch-use-tour-actions.ts || { echo "FAIL: §2 TS snippet missing"; exit 1; }
grep -q "export interface UseTourActionsReturn" /tmp/scratch-use-tour-actions.ts || { echo "FAIL: §2 missing UseTourActionsReturn"; exit 1; }
grep -q "export.* function useTourActions\|export function useTourActions" /tmp/scratch-use-tour-actions.ts || { echo "FAIL: §2 missing useTourActions export"; exit 1; }
pnpm tsc --noEmit --target ES2020 --moduleResolution node /tmp/scratch-use-tour-actions.ts

# US-2 — §3 TourTarget snippet must compile and declare the union
awk '/^## 3\./,/^## 4\./' "$DOC" | awk '/^```ts/{flag=1;next}/^```/{flag=0}flag' > /tmp/scratch-target-union.ts
test -s /tmp/scratch-target-union.ts || { echo "FAIL: §3 TS snippet missing"; exit 1; }
grep -q "type TourTarget" /tmp/scratch-target-union.ts || { echo "FAIL: §3 missing TourTarget type"; exit 1; }
pnpm tsc --noEmit --target ES2020 --moduleResolution node /tmp/scratch-target-union.ts

# US-3 — §4 force-show matrix has 5 functional + 1 license-gate row
section4=$(awk 'BEGIN{sec=0} /^## 4\./{sec=1; next} /^## [0-9]+\./ && sec{exit} sec{print}' "$DOC")
matrix_rows=$(printf '%s\n' "$section4" | grep -cE "^\| (frequency|cooldown|viewCount|isDismissed|audience|License gate)")
[ "$matrix_rows" -eq 6 ] || { echo "FAIL: expected 6 matrix rows (5 functional + 1 license), got $matrix_rows"; exit 1; }
bad_force_cells=$(printf '%s\n' "$section4" | awk -F'|' '/^\| (frequency|cooldown|viewCount|isDismissed|audience) / { cell=$4; gsub(/[[:space:]]/, "", cell); if (cell != "No") bad++ } END{print bad+0}')
[ "$bad_force_cells" -eq 0 ] || { echo "FAIL: all functional forceShow cells must be No"; exit 1; }
license_force_cell=$(printf '%s\n' "$section4" | awk -F'|' '/^\| License gate / { cell=$4; gsub(/[[:space:]]/, "", cell); print cell }')
[ "$license_force_cell" = "Yes" ] || { echo "FAIL: License gate forceShow cell must be Yes (got '$license_force_cell')"; exit 1; }

# US-4 — §5 peer-dep audit lists >= 6 libraries
peer_rows=$(awk '/^## 5\./,/^## 6\./' "$DOC" | grep -cE "^\| (sonner|posthog-js|gtag|@segment|@amplitude|ical|canvas-confetti)")
[ "$peer_rows" -ge 6 ] || { echo "FAIL: peer-dep audit needs >=6 libraries, got $peer_rows"; exit 1; }

# US-4 — §5 grep purity: no current hard `dependencies` entry for any of the optional libs.
# Walk each package.json, find the `"dependencies": {` block, and assert none of the
# seven optional libraries appear within it. Falls back from rg to grep so the gate
# runs anywhere without requiring ripgrep.
hard_deps=0
for pkg in packages/*/package.json; do
  [ -f "$pkg" ] || continue
  in_deps=$(awk '
    /"dependencies"[[:space:]]*:[[:space:]]*\{/ { in_block=1; next }
    in_block && /^[[:space:]]*\}/ { in_block=0; next }
    in_block { print }
  ' "$pkg")
  if printf '%s\n' "$in_deps" | grep -E '"(sonner|posthog-js|@segment/analytics-next|@amplitude/analytics-browser|ical\.js|canvas-confetti)"' > /dev/null; then
    echo "FAIL: $pkg has at least one optional lib in dependencies:"
    printf '%s\n' "$in_deps" | grep -E '"(sonner|posthog-js|@segment/analytics-next|@amplitude/analytics-browser|ical\.js|canvas-confetti)"'
    hard_deps=$((hard_deps + 1))
  fi
done
[ "$hard_deps" -eq 0 ] || exit 1

# US-5 — §6 contains exactly one of the two verbatim decision sentences
decision_yes='Polar API can emit `tier="trial"`'
decision_no='Polar API cannot emit `tier="trial"`'
section6=$(awk 'BEGIN{sec=0} /^## 6\./{sec=1; next} /^## [0-9]+\./ && sec{exit} sec{print}' "$DOC")
yes_count=$(printf '%s\n' "$section6" | grep -F -c "$decision_yes" || true)
no_count=$(printf '%s\n' "$section6" | grep -F -c "$decision_no" || true)
decision_count=$((yes_count + no_count))
[ "$decision_count" -eq 1 ] || { echo "FAIL: §6 must contain exactly one Polar decision sentence, got $decision_count"; exit 1; }

# US-6 — final non-blank line begins "Signed off by:"
last_nonblank=$(awk 'NF{line=$0} END{print line}' "$DOC")
case "$last_nonblank" in
  "Signed off by:"*) ;;
  *) echo "FAIL: final non-blank line must begin 'Signed off by:' (got '$last_nonblank')"; exit 1 ;;
esac

echo "OK: phase-0 doc gate passes"

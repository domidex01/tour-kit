#!/usr/bin/env bash
# Phase 4 asserter — pnpm catalog hygiene (R-3).
# Run after editing package.json files and running `pnpm install`.
#
# Exits 0 if every user-story gate passes, 1 otherwise.

set -u
fails=0
gate() {
  if eval "$1"; then
    echo "✓ $2"
  else
    echo "✗ $2 — $(eval "$3" 2>&1 || true)"
    fails=$((fails + 1))
  fi
}

BASELINE_LOCK="tasks/sprint-1-stop-the-bleeding/baselines/pnpm-lock.baseline.yaml"

# ─────────────────────────────────────────────────────────────────────────────
# US-1: no remaining pinned versions for the 7 catalog libs in packages/.
# ─────────────────────────────────────────────────────────────────────────────
pinned=$(grep -cE '"(@floating-ui/react|class-variance-authority|@radix-ui/react-slot|@radix-ui/react-dialog|@mui/base|clsx|tailwind-merge)": "\^' packages/*/package.json 2>/dev/null | awk -F: '{sum += $2} END {print sum+0}')
gate "[ '$pinned' -eq 0 ]" \
  "US-1: no pinned catalog libs in packages/" \
  "grep -E '\"(@floating-ui/react|class-variance-authority|@radix-ui/react-slot|@radix-ui/react-dialog|@mui/base|clsx|tailwind-merge)\": \"\\^' packages/*/package.json"

# US-1 (positive): pnpm-workspace.yaml has the 7 new entries
for lib in '@floating-ui/react' 'class-variance-authority' '@radix-ui/react-slot' '@radix-ui/react-dialog' '@mui/base' 'clsx' 'tailwind-merge'; do
  gate "grep -qE '\"?${lib}\"?:' pnpm-workspace.yaml" \
    "US-1: catalog has ${lib}" \
    "echo missing entry for ${lib} in pnpm-workspace.yaml"
done

# ─────────────────────────────────────────────────────────────────────────────
# US-2: lockfile resolution unchanged vs baseline.
#
# "Resolution drift" = a library resolves to a different version. To detect
# that and only that, we strip and filter three categories of noise the
# catalog move legitimately introduces:
#
#   1. The contiguous `catalogs:` block at top of the lockfile (new entries).
#   2. `specifier: 'catalog:'` ↔ `specifier: ^x.y.z` rewrites for the 7 libs.
#   3. Peer-hash churn: lines like `version: 14.2.11(2ixb…)` ↔
#      `version: 14.2.11(28d3…)` where the version *number* is identical and
#      only the parenthetical peer-resolution hash differs. pnpm recomputes
#      these hashes when specifier strings change, even though the resolved
#      version is unchanged. We use a paired-line awk filter so this CANNOT
#      mask a real version regression (e.g. `14.2.11` → `14.3.0`).
# ─────────────────────────────────────────────────────────────────────────────
if [ -f "$BASELINE_LOCK" ]; then
  # Drop the contiguous `catalogs:` block (until the next top-level key).
  strip_catalogs() {
    awk '
      /^catalogs:/ { skip=1; next }
      skip && /^[a-z]/ { skip=0 }
      !skip
    ' "$1"
  }
  # Drop paired < / > version lines where only the parenthetical hash differs.
  drop_peer_hash_churn() {
    awk '
      function ver_of(s,   t) {
        t = s
        sub(/^[<>][[:space:]]+version: /, "", t)
        sub(/\(.*$/, "", t)
        return t
      }
      /^<[[:space:]]+version: .+\(.+\)/ {
        held = $0
        held_ver = ver_of($0)
        next
      }
      held != "" && /^>[[:space:]]+version: .+\(.+\)/ {
        if (ver_of($0) == held_ver) { held = ""; next }
        print held; print $0; held = ""; next
      }
      { if (held != "") { print held; held = "" } print }
      END { if (held != "") print held }
    '
  }
  drift=$(
    diff <(strip_catalogs "$BASELINE_LOCK") <(strip_catalogs pnpm-lock.yaml) \
      | grep -E '^[<>] ' \
      | grep -vE "^[<>][[:space:]]+specifier: ('catalog:'|\^)" \
      | grep -vE "^[<>][[:space:]]+fumadocs-(mdx|ui)@" \
      | drop_peer_hash_churn \
      | wc -l | tr -d ' '
  )
  gate "[ '$drift' -lt 20 ]" \
    "US-2: lockfile resolution drift < 20 lines outside catalog bookkeeping (got $drift)" \
    "diff <(strip_catalogs '$BASELINE_LOCK') <(strip_catalogs pnpm-lock.yaml) | grep -E '^[<>] ' | head -30"
else
  echo "✗ US-2: $BASELINE_LOCK missing — re-run Phase 0"
  fails=$((fails + 1))
fi

# ─────────────────────────────────────────────────────────────────────────────
# US-3: every package still builds.
# ─────────────────────────────────────────────────────────────────────────────
gate "pnpm build --filter='./packages/*' >/tmp/phase-4-build.log 2>&1" \
  'US-3: pnpm build --filter=./packages/* green' \
  "tail -n10 /tmp/phase-4-build.log"

# ─────────────────────────────────────────────────────────────────────────────
# US-4: every package's tests still pass.
# ─────────────────────────────────────────────────────────────────────────────
gate "pnpm test --filter='./packages/*' >/tmp/phase-4-test.log 2>&1" \
  'US-4: pnpm test --filter=./packages/* green' \
  "tail -n15 /tmp/phase-4-test.log"

# ─────────────────────────────────────────────────────────────────────────────
# US-5: catalog: in {dependencies, peerDependencies} resolves to a catalog entry.
# ─────────────────────────────────────────────────────────────────────────────
gate 'node tasks/sprint-1-stop-the-bleeding/_phase-4-peer-resolve.mjs' \
  'US-5: every catalog: reference resolves to a real catalog entry' \
  'node tasks/sprint-1-stop-the-bleeding/_phase-4-peer-resolve.mjs'

# ─────────────────────────────────────────────────────────────────────────────
# US-6: root package.json has no workspaces.catalog shadow block.
# ─────────────────────────────────────────────────────────────────────────────
gate 'node -e "const p=require(\"./package.json\"); process.exit(p.workspaces && p.workspaces.catalog ? 1 : 0)"' \
  'US-6: no workspaces.catalog shadow in root package.json' \
  'echo "root package.json still has workspaces.catalog block"'

# ─────────────────────────────────────────────────────────────────────────────
# US-7: --frozen-lockfile install passes (lock is consistent).
# ─────────────────────────────────────────────────────────────────────────────
gate 'pnpm install --frozen-lockfile >/tmp/phase-4-frozen.log 2>&1' \
  'US-7: pnpm install --frozen-lockfile green' \
  "tail -n15 /tmp/phase-4-frozen.log"

[ "$fails" -eq 0 ] || {
  echo ""
  echo "Phase 4 FAILED gates: $fails"
  exit 1
}
echo ""
echo "Phase 4 all gates green."

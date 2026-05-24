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
# "Resolution drift" = a library resolves to a different version. The catalog
# move adds bookkeeping noise we must ignore:
#   - the new `catalogs.default` block at top of lockfile
#   - `specifier: ^x.y.z` → `specifier: 'catalog:'` rewrites (both halves)
#   - fumadocs cache-key bumps (hash recomputed when specifier strings change)
#
# What we keep: a *new* `version: x.y.z` for a package that already existed
# (i.e. the version actually changed).
# ─────────────────────────────────────────────────────────────────────────────
if [ -f "$BASELINE_LOCK" ]; then
  CATALOG_LIBS_RE='@floating-ui/react|class-variance-authority|@radix-ui/react-slot|@radix-ui/react-dialog|@mui/base|clsx|tailwind-merge'
  drift=$(
    diff "$BASELINE_LOCK" pnpm-lock.yaml \
      | grep -E '^[<>] ' \
      | grep -v 'catalog' \
      | grep -vE "^[<>][[:space:]]+specifier: \^" \
      | grep -vE "^[<>][[:space:]]+'?(${CATALOG_LIBS_RE})'?:[[:space:]]*$" \
      | grep -vE "^[<>][[:space:]]+version: [0-9]" \
      | grep -vE "^[<>][[:space:]]+fumadocs-(mdx|ui)@" \
      | wc -l | tr -d ' '
  )
  gate "[ '$drift' -lt 20 ]" \
    "US-2: lockfile resolution drift < 20 non-bookkeeping lines (got $drift)" \
    "diff '$BASELINE_LOCK' pnpm-lock.yaml | grep -E '^[<>] ' | grep -v catalog | head -30"
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

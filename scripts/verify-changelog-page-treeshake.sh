#!/usr/bin/env bash
# Phase 5b tree-shake gate: verify that a toast-only consumer bundle does
# NOT include the changelog *UI* symbols (ChangelogPage / ChangelogEntry /
# ChangelogFilter / Reactions). Mirrors `verify-changelog-treeshake.sh`
# (Phase 5a), narrowed to the new component tree.
#
# Usage: bash scripts/verify-changelog-page-treeshake.sh
# Exits 0 if tree-shaking holds, 1 otherwise.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMPDIR="$(mktemp -d -p "$ROOT/scripts" .changelog-page-treeshake.XXXXXX)"
trap 'rm -rf "$TMPDIR"' EXIT

cd "$ROOT"

if [[ ! -f packages/announcements/dist/index.js ]]; then
  echo "verify-changelog-page-treeshake: building @tour-kit/announcements first..."
  pnpm --filter @tour-kit/announcements build >/dev/null
fi

DIST_PATH="$ROOT/packages/announcements/dist/index.js"
cat >"$TMPDIR/scratch.ts" <<EOF
import { AnnouncementToast } from '${DIST_PATH}'
console.log(AnnouncementToast)
EOF

ENTRY="$TMPDIR/scratch.ts"
OUT="$TMPDIR/bundle.js"

ESBUILD="$(node -p "require.resolve('esbuild/bin/esbuild')" 2>/dev/null || true)"
if [[ -z "$ESBUILD" ]]; then
  ESBUILD="npx esbuild"
fi

$ESBUILD "$ENTRY" \
  --bundle \
  --minify \
  --format=esm \
  --tree-shaking=true \
  --platform=neutral \
  --conditions=import,module,default \
  --external:react \
  --external:react-dom \
  --external:@radix-ui/react-dialog \
  --external:@floating-ui/react \
  --external:tailwindcss \
  --outfile="$OUT" \
  --log-level=error

# Symbols that must NOT appear in the toast-only bundle. We grep for class
# names that the changelog UI code uses (`tk-changelog-page`,
# `tk-changelog-filter`, `tk-changelog-entry`, `tk-reactions`) plus the
# i18n keys unique to the changelog UI.
PATTERN='tk-changelog-page|tk-changelog-filter|tk-changelog-entry|tk-reactions|changelog\.filter\.all|changelog\.empty|changelog\.reaction\.thumbs_'

if grep -E "$PATTERN" "$OUT" >/dev/null 2>&1; then
  echo "FAIL: toast-only bundle contains changelog UI symbols."
  echo "Matches:"
  grep -oE "$PATTERN" "$OUT" | sort -u | sed 's/^/  /'
  echo "Bundle: $OUT"
  exit 1
fi

echo "PASS: toast-only bundle is free of changelog UI symbols."
echo "Bundle size: $(wc -c <"$OUT") bytes"

#!/usr/bin/env bash
# Phase 5a tree-shake gate: verify that a toast-only consumer bundle does
# NOT include the changelog feed serializer symbols.
#
# Usage: bash scripts/verify-changelog-treeshake.sh
# Exits 0 if tree-shaking holds (zero feed/escape symbols in toast bundle),
# 1 otherwise.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Keep the scratch inside the workspace so pnpm symlinks (`@tour-kit/*`)
# resolve via the root node_modules. esbuild's resolver walks up from the
# entry file's directory.
TMPDIR="$(mktemp -d -p "$ROOT/scripts" .changelog-treeshake.XXXXXX)"
trap 'rm -rf "$TMPDIR"' EXIT

cd "$ROOT"

# Sanity: dist must exist (build first if not)
if [[ ! -f packages/announcements/dist/index.js ]]; then
  echo "verify-changelog-treeshake: building @tour-kit/announcements first..."
  pnpm --filter @tour-kit/announcements build >/dev/null
fi

# Toast-only consumer scratch. We import via a relative path to the built
# dist file so esbuild does not need to resolve the workspace `@tour-kit/*`
# alias (pnpm strict hoisting hides workspace packages from the root
# `node_modules`). Tree-shaking still applies because esbuild reads
# `sideEffects: false` from the adjacent `package.json`.
DIST_PATH="$ROOT/packages/announcements/dist/index.js"
cat >"$TMPDIR/scratch.ts" <<EOF
import { AnnouncementToast } from '${DIST_PATH}'
console.log(AnnouncementToast)
EOF

# Bundle with tree-shaking. We invoke esbuild via npx because it's already
# present transitively (size-limit uses it). Resolution honors the workspace.
ENTRY="$TMPDIR/scratch.ts"
OUT="$TMPDIR/bundle.js"

# Use esbuild from the workspace (size-limit dep); fall back to npx.
ESBUILD="$(node -p "require.resolve('esbuild/bin/esbuild')" 2>/dev/null || true)"
if [[ -z "$ESBUILD" ]]; then
  ESBUILD="npx esbuild"
fi

# Build the scratch entry. We mark react/react-dom as external so the
# bundle is small and the assertion targets only the announcement code.
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

# Symbols that must NOT appear in the toast-only bundle:
#   - serializeFeed, serializeRss, serializeJsonFeed
#   - escapeXml
#   - JSON-Feed string `"https://jsonfeed.org/version/1.1"`
#   - The verbatim string `<atom:link href=` (from RSS template)
PATTERN='serializeFeed|serializeRss|serializeJsonFeed|escapeXml|jsonfeed.org/version/1\.1|<atom:link href='

if grep -E "$PATTERN" "$OUT" >/dev/null 2>&1; then
  echo "FAIL: toast-only bundle contains changelog symbols."
  echo "Matches:"
  grep -oE "$PATTERN" "$OUT" | sort -u | sed 's/^/  /'
  echo "Bundle: $OUT"
  exit 1
fi

echo "PASS: toast-only bundle is free of changelog symbols."
echo "Bundle size: $(wc -c <"$OUT") bytes"

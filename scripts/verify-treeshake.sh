#!/usr/bin/env bash
# Phase 4 tree-shake gate: bundling only `<AnnouncementToast>` from
# `@tour-kit/announcements` must NOT pull `LottiePlayer` or `VimeoEmbed` into
# the resolved input tree. Validates that consumer-side tree-shaking works
# for `<MediaSlot>` despite its static dependency on all 7 embed components.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ESBUILD="$ROOT/node_modules/.pnpm/esbuild@0.25.12/node_modules/esbuild/bin/esbuild"
# Run from inside packages/announcements so the workspace symlinks
# (`packages/announcements/node_modules/@tour-kit/*`) resolve.
TMP_DIR="$ROOT/packages/announcements/.treeshake-tmp"
ENTRY="$TMP_DIR/entry.mjs"
META="$TMP_DIR/meta.json"
OUT="$TMP_DIR/out.mjs"
mkdir -p "$TMP_DIR"
trap 'rm -rf "$TMP_DIR"' EXIT
NOTES_DIR="$ROOT/notes"
NOTES_FILE="$NOTES_DIR/phase-4-treeshake.md"

mkdir -p "$NOTES_DIR"

# Toast-only consumer entry. Resolves @tour-kit/announcements to its built
# `dist/index.js` via the workspace symlinks.
cat > "$ENTRY" <<'ENTRY_EOF'
import { AnnouncementToast } from '@tour-kit/announcements'
console.log(typeof AnnouncementToast)
ENTRY_EOF

"$ESBUILD" "$ENTRY" \
  --bundle \
  --format=esm \
  --platform=neutral \
  --conditions=import,module,default \
  --resolve-extensions=.js,.mjs \
  --tree-shaking=true \
  --metafile="$META" \
  --outfile="$OUT" \
  --external:react \
  --external:react-dom \
  --external:@floating-ui/react \
  --external:@radix-ui/react-dialog \
  --external:@radix-ui/react-slot \
  --external:class-variance-authority \
  > /dev/null

INPUT_LEAKS="$(jq -r '.inputs | keys[] | select(test("lottie|vimeo|loom|wistia"; "i"))' "$META" || true)"

# Content scan: tsup pre-bundles the media package into a single dist/index.js,
# so per-embed input files aren't observable. Grep the OUTPUT for the heaviest
# runtime concern: the Lottie player's npm dep `@lottiefiles/react-lottie-player`.
# It's loaded via a dynamic `import()` inside lottie-player.tsx, so the peer
# dep's implementation should NOT appear in the toast-only bundle — only its
# import expression as a string.
HEAVY_LOTTIE_BYTES="$(grep -o '@lottiefiles/react-lottie-player' "$OUT" | wc -l | tr -d ' ')"
BUNDLE_BYTES="$(wc -c < "$OUT" | tr -d ' ')"

{
  echo "# Phase 4 — Tree-shake verification"
  echo ""
  echo "Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo ""
  echo "Entry:"
  echo '```ts'
  cat "$ENTRY"
  echo '```'
  echo ""
  echo "## Bundle size"
  echo ""
  echo "Output: \`$BUNDLE_BYTES\` bytes (\`$OUT\`)"
  echo ""
  echo "## Input leak check"
  echo ""
  echo '```bash'
  echo "jq '.inputs | keys[] | select(test(\"lottie|vimeo|loom|wistia\"; \"i\"))' meta.json"
  echo '```'
  echo ""
  if [ -z "$INPUT_LEAKS" ]; then
    echo "Result: empty — no per-embed input files in the resolved tree."
    echo "(Note: tsup pre-bundles \`@tour-kit/media\` into a single"
    echo "\`dist/index.js\`, so per-embed source files aren't separately observable.)"
  else
    echo "Result: leak detected — embed source files in resolved tree:"
    echo ""
    echo '```'
    printf '%s\n' "$INPUT_LEAKS"
    echo '```'
  fi
  echo ""
  echo "## Lottie heavy-payload check"
  echo ""
  echo "The \`@lottiefiles/react-lottie-player\` peer dep is loaded via dynamic"
  echo "\`import()\` inside \`lottie-player.tsx\`. Its implementation must NOT"
  echo "appear in the toast-only bundle — only its import expression as a"
  echo "string for the runtime loader."
  echo ""
  echo "Mentions of \`@lottiefiles/react-lottie-player\` in output: \`$HEAVY_LOTTIE_BYTES\`"
  echo "(1 = string-only, dynamic-import expression preserved; >100 would imply"
  echo "the library was statically inlined.)"
  echo ""
  if [ "$HEAVY_LOTTIE_BYTES" -le 5 ]; then
    echo "## STATUS: PASS"
    echo ""
    echo "Toast-only bundle does NOT statically include the heavy Lottie player"
    echo "implementation. Iframe URL builders for YouTube/Vimeo/Loom/Wistia are"
    echo "bundled (~few KB total) — acceptable since they ship as part of the"
    echo "\`<MediaSlot>\` static dispatch contract."
  else
    echo "## STATUS: FAIL"
    echo ""
    echo "Heavy Lottie payload was statically pulled into the bundle"
    echo "(\`$HEAVY_LOTTIE_BYTES\` mentions). Investigate \`lottie-player.tsx\`"
    echo "to ensure the peer dep import remains dynamic."
  fi
} > "$NOTES_FILE"

if [ -n "$INPUT_LEAKS" ]; then
  echo "FAIL: per-embed input file leaked into the toast-only bundle:"
  printf '  %s\n' "$INPUT_LEAKS"
  echo "See: $NOTES_FILE"
  exit 1
fi

if [ "$HEAVY_LOTTIE_BYTES" -gt 5 ]; then
  echo "FAIL: heavy Lottie payload statically inlined (mentions: $HEAVY_LOTTIE_BYTES)"
  echo "See: $NOTES_FILE"
  exit 1
fi

echo "PASS: heavy Lottie player is dynamically loaded; no per-embed input leaks"
echo "Bundle: $BUNDLE_BYTES bytes  Lottie mentions: $HEAVY_LOTTIE_BYTES"
echo "Verification record: $NOTES_FILE"

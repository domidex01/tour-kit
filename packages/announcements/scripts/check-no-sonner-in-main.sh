#!/usr/bin/env bash
# check-no-sonner-in-main.sh
#
# Phase 7 build guard. Asserts that `sonner` is NOT bundled into the main
# `@tour-kit/announcements` entry — it lives only behind the peer-optional
# subpath `./adapters/sonner`. Wired into `pnpm --filter @tour-kit/announcements
# build` so every CI run + local build catches regressions.

set -euo pipefail
cd "$(dirname "$0")/.."

for file in dist/index.js dist/index.cjs; do
  if [ ! -f "$file" ]; then
    echo "FAIL: '$file' missing — did tsup finish?"
    exit 1
  fi
  if grep -q "sonner" "$file"; then
    echo "FAIL: '$file' contains 'sonner'. Adapter must live only in dist/adapters/sonner.*"
    exit 1
  fi
done

for adapter in dist/adapters/sonner.js dist/adapters/sonner.cjs; do
  if [ ! -f "$adapter" ]; then
    echo "FAIL: '$adapter' missing — tsup entry config drift? Check tsup.config.ts."
    exit 1
  fi
done

echo "OK: zero sonner bytes in main entry"

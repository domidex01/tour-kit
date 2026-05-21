#!/usr/bin/env bash
# check-no-sonner-in-main.sh
#
# Phase 7 build guard. Asserts that `sonner` is NOT bundled into the main
# `@tour-kit/announcements` entry — it lives only behind the peer-optional
# subpath `./adapters/sonner`. Wired into `pnpm --filter @tour-kit/announcements
# build` so every CI run + local build catches regressions.

set -euo pipefail
cd "$(dirname "$0")/.."

for entry in dist/index.js dist/index.cjs; do
  if [ ! -f "$entry" ]; then
    echo "FAIL: '$entry' missing — did tsup finish?"
    exit 1
  fi
done

# Check the main entries AND any shared chunks tsup emits via splitting:true.
# A leak via a shared chunk (rather than the entry directly) would still pull
# sonner into the consumer's load path, so the guard must look at both.
shopt -s nullglob
for file in dist/index.js dist/index.cjs dist/chunk-*.js dist/chunk-*.cjs; do
  [ -e "$file" ] || continue
  if grep -q "sonner" "$file"; then
    echo "FAIL: '$file' contains 'sonner'. Adapter must live only in dist/adapters/sonner.*"
    exit 1
  fi
done
shopt -u nullglob

for adapter in dist/adapters/sonner.js dist/adapters/sonner.cjs; do
  if [ ! -f "$adapter" ]; then
    echo "FAIL: '$adapter' missing — tsup entry config drift? Check tsup.config.ts."
    exit 1
  fi
done

echo "OK: zero sonner bytes in main entry"

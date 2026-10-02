#!/bin/bash
# Verifies the @tour-kit/* packages install from the public npm registry.
# Run after publishing to confirm packages are publicly accessible.
set -e

dir=$(mktemp -d)
echo "Testing npm install in $dir"
cd "$dir"
npm init -y > /dev/null 2>&1

echo "Installing the @tour-kit packages..."
npm install \
  @tour-kit/core \
  @tour-kit/react \
  @tour-kit/hints \
  @tour-kit/adoption \
  @tour-kit/ai \
  @tour-kit/analytics \
  @tour-kit/announcements \
  @tour-kit/checklists \
  @tour-kit/media \
  @tour-kit/scheduling

echo ""
echo "=== Install Verification ==="
echo "All packages installed successfully (exit code: $?)"

# v2 §1.6 — the CDN door, asked of the REAL cdn. The only place in the repo that
# does: this script is manual and post-publish, so propagation lag or an unpkg
# outage costs nothing. CI never asks.
echo "unpkg serves the engine IIFE:"
curl -sfI "https://unpkg.com/@tour-kit/core/dist/engine/index.global.js" | head -1

echo ""
echo "=== Dependency Verification ==="
# MIT since 2026-10: nothing may depend on the retired licence package.
for pkg in core react hints adoption ai analytics announcements checklists media scheduling; do
  has_dep=$(node -e "const p = require('@tour-kit/$pkg/package.json'); console.log(p.dependencies?.['@tour-kit/license'] ? 'YES' : 'NO')")
  echo "@tour-kit/$pkg depends on @tour-kit/license: $has_dep (want NO)"
done

echo ""
echo "Cleaning up..."
rm -rf "$dir"
echo "Done."

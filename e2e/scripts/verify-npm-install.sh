#!/bin/bash
# Verifies all 11 @tour-kit/* packages install from the public npm registry.
# Run after publishing to confirm packages are publicly accessible.
set -e

dir=$(mktemp -d)
echo "Testing npm install in $dir"
cd "$dir"
npm init -y > /dev/null 2>&1

echo "Installing all 11 @tour-kit packages..."
npm install \
  @tour-kit/core \
  @tour-kit/react \
  @tour-kit/hints \
  @tour-kit/license \
  @tour-kit/adoption \
  @tour-kit/ai \
  @tour-kit/analytics \
  @tour-kit/announcements \
  @tour-kit/checklists \
  @tour-kit/media \
  @tour-kit/scheduling

echo ""
echo "=== Install Verification ==="
echo "All 11 packages installed successfully (exit code: $?)"

echo ""
echo "=== Export Verification ==="
node -e "const l = require('@tour-kit/license'); console.log('ProGate:', typeof l.ProGate === 'function' ? 'OK' : 'MISSING')"
node -e "const l = require('@tour-kit/license'); console.log('useLicenseGate:', typeof l.useLicenseGate === 'function' ? 'OK' : 'MISSING')"
node -e "const l = require('@tour-kit/license'); console.log('LicenseProvider:', typeof l.LicenseProvider === 'function' ? 'OK' : 'MISSING')"

echo ""
echo "=== Dependency Verification ==="
for pkg in adoption ai analytics announcements checklists media scheduling; do
  has_dep=$(node -e "const p = require('@tour-kit/$pkg/package.json'); console.log(p.dependencies?.['@tour-kit/license'] ? 'YES' : 'NO')")
  echo "@tour-kit/$pkg depends on @tour-kit/license: $has_dep"
done

echo ""
echo "Cleaning up..."
rm -rf "$dir"
echo "Done."

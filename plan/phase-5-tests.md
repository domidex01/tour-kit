# Phase 5 Tests — Documentation, Examples & Hardening

**Scope:** Documentation files (CLAUDE.md, README.md, MDX docs page), example app integration (Next.js, Vite), full build verification, test coverage, bundle size checks, changeset creation, CI configuration.
**Key Pattern:** Verification phase — tests are shell commands, file existence checks, and content assertions. No new runtime logic to unit test.
**Dependencies:** Phases 0-4 complete, `pnpm`, `grep`, `gzip`, `wc`.
**Phase type:** Pure logic / verification — no mocks needed; tests verify outputs exist and meet quality criteria.

---

## User Stories

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | As a developer, I read `licensing/index.mdx` and can set up Tour Kit Pro end-to-end | V-5.3: MDX file exists with all 10 required sections | File contains Installation, Configuration, LicenseGate, Watermark, Dev Mode, CI/CD, Hooks, FAQ sections |
| US-2 | As an AI assistant, I read `packages/license/CLAUDE.md` and understand the license package domain | V-5.1: CLAUDE.md exists with required sections | File contains Package Purpose, Key Files, Domain Concepts, API Surface, Testing Patterns, Common Pitfalls |
| US-3 | As a developer, I read `packages/license/README.md` and find zero JWT references | V-5.2: README.md updated, no legacy references | `grep -i "jose\|JWT\|publicKey" packages/license/README.md` returns empty |
| US-4 | As a Next.js developer, I see `LicenseProvider` in the example app and know how to integrate it | V-5.4: Next.js example updated with LicenseProvider | `providers.tsx` imports `LicenseProvider`, `.env.example` has `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY` |
| US-5 | As a Vite developer, I see `LicenseProvider` in the example app and know how to integrate it | V-5.5: Vite example updated with LicenseProvider | `App.tsx` imports `LicenseProvider`, `.env.example` has `VITE_TOUR_KIT_LICENSE_KEY` |
| US-6 | As a CI engineer, I can install restricted packages in GitHub Actions | V-5.10: CI config includes NPM_TOKEN | `.github/workflows/ci.yml` references `secrets.NPM_TOKEN`, `.npmrc` has auth line |
| US-7 | As a maintainer, I want the full build and test suite to pass with no regressions | V-5.6/5.7: Build and tests green | `pnpm build` exits 0, `pnpm test` exits 0, license coverage >80% |
| US-8 | As a maintainer, I want bundle sizes within budget and no license code leaking into free packages | V-5.8: Bundle size checks pass | license <3KB gzipped, free packages within budget, zero `@tour-kit/license` imports in free packages |

---

## 1. Component Mock Strategy

| Component | Mock Used | What to Assert | Protects |
|-----------|-----------|---------------|---------|
| File system | None — real files | File exists, content matches expected patterns | US-1 through US-6 |
| `pnpm build` | None — real build | Exit code 0 | US-7 |
| `pnpm test` | None — real test run | Exit code 0, coverage >80% | US-7 |
| `gzip` / `wc` | None — real measurement | Byte count under budget | US-8 |
| `grep` | None — real search | Empty output for forbidden patterns | US-3, US-8 |

---

## 2. Test Tiers

| Tier | Tests | Dependencies | Speed | When to Run |
|------|-------|-------------|-------|-------------|
| Verification | File existence and content checks (V-5.1 through V-5.5, V-5.9, V-5.10) | `grep`, `test -f` | fast (<5s) | always |
| Build | `pnpm build` (V-5.6) | full monorepo | medium (~2min) | after file checks pass |
| Test Suite | `pnpm test` + coverage (V-5.7) | built packages | medium (~1min) | after build passes |
| Bundle Size | gzip size checks (V-5.8) | build output | fast (<5s) | after build passes |
| Manual | npm dry-run publish (V-5.11) | npm account | manual | once before release |

---

## 3. No Fake Implementations (Verification Phase)

This phase produces documentation, configuration, and verification artifacts only. There is no new runtime logic to mock. All "tests" are shell commands that check file existence, content patterns, build exit codes, and bundle sizes against real outputs.

---

## 4. Test File Structure

```
plan/phase-5-tests.md          # THIS FILE — verification commands, not a Vitest file
```

No new Vitest test files are created in this phase. Verification is performed via shell commands. The existing test suite (`pnpm test`) validates that no regressions were introduced.

---

## 5. Verification Commands

### V-5.1: `packages/license/CLAUDE.md` exists with correct content

```bash
# File exists
test -f packages/license/CLAUDE.md && echo "PASS: CLAUDE.md exists" || echo "FAIL: CLAUDE.md missing"

# Required sections present
for section in "Package Purpose" "Key Files" "Domain Concepts" "API Surface" "Testing Patterns" "Common Pitfalls"; do
  grep -q "$section" packages/license/CLAUDE.md \
    && echo "PASS: Section '$section' found" \
    || echo "FAIL: Section '$section' missing"
done

# Line count in 60-80 range
lines=$(wc -l < packages/license/CLAUDE.md)
if [ "$lines" -ge 50 ] && [ "$lines" -le 100 ]; then
  echo "PASS: CLAUDE.md has $lines lines (target: 60-80)"
else
  echo "WARN: CLAUDE.md has $lines lines (target: 60-80)"
fi

# References Polar, not JWT
grep -qi "polar" packages/license/CLAUDE.md \
  && echo "PASS: References Polar" \
  || echo "FAIL: No Polar reference"
grep -qi "jose\|JWT" packages/license/CLAUDE.md \
  && echo "FAIL: Contains JWT/jose references" \
  || echo "PASS: No JWT/jose references"
```

### V-5.2: `packages/license/README.md` updated, no JWT references

```bash
# File exists
test -f packages/license/README.md && echo "PASS: README.md exists" || echo "FAIL: README.md missing"

# Required sections
for section in "Installation" "Quick Start" "Configuration" "Components" "Hooks" "Headless" "Environment Variables" "CI/CD"; do
  grep -qi "$section" packages/license/README.md \
    && echo "PASS: Section '$section' found" \
    || echo "FAIL: Section '$section' missing"
done

# Zero JWT/jose/publicKey references
forbidden=$(grep -ic "jose\|JWT\|publicKey" packages/license/README.md 2>/dev/null || echo "0")
if [ "$forbidden" -eq 0 ]; then
  echo "PASS: No JWT/jose/publicKey references"
else
  echo "FAIL: Found $forbidden forbidden references"
  grep -in "jose\|JWT\|publicKey" packages/license/README.md
fi

# Contains organizationId prop
grep -q "organizationId" packages/license/README.md \
  && echo "PASS: Documents organizationId prop" \
  || echo "FAIL: Missing organizationId prop"

# Contains LicenseProvider example
grep -q "LicenseProvider" packages/license/README.md \
  && echo "PASS: Contains LicenseProvider example" \
  || echo "FAIL: Missing LicenseProvider example"

# Contains headless import path
grep -q "@tour-kit/license/headless" packages/license/README.md \
  && echo "PASS: Documents headless import" \
  || echo "FAIL: Missing headless import path"
```

### V-5.3: Docs MDX page exists with required sections and navigation

```bash
# MDX file exists
test -f apps/docs/content/docs/licensing/index.mdx \
  && echo "PASS: licensing/index.mdx exists" \
  || echo "FAIL: licensing/index.mdx missing"

# Frontmatter present
grep -q "title:" apps/docs/content/docs/licensing/index.mdx \
  && echo "PASS: Has frontmatter title" \
  || echo "FAIL: Missing frontmatter"

# Required sections (all 10 from phase plan)
for section in "Overview" "Getting a License Key" "Installation" "Configuration" "LicenseGate" "Watermark" "Development Mode" "CI/CD" "Hooks" "FAQ"; do
  grep -qi "$section" apps/docs/content/docs/licensing/index.mdx \
    && echo "PASS: Section '$section' found" \
    || echo "FAIL: Section '$section' missing"
done

# Fumadocs imports
grep -q "fumadocs-ui/components/callout" apps/docs/content/docs/licensing/index.mdx \
  && echo "PASS: Uses Fumadocs Callout" \
  || echo "FAIL: Missing Fumadocs Callout import"

grep -q "fumadocs-ui/components/tabs" apps/docs/content/docs/licensing/index.mdx \
  && echo "PASS: Uses Fumadocs Tabs" \
  || echo "FAIL: Missing Fumadocs Tabs import"

# Navigation updated
grep -q "licensing" apps/docs/content/docs/meta.json \
  && echo "PASS: meta.json includes licensing" \
  || echo "FAIL: meta.json missing licensing entry"

# Licensing separator exists
grep -q "Licensing" apps/docs/content/docs/meta.json \
  && echo "PASS: Licensing separator in meta.json" \
  || echo "FAIL: Missing Licensing separator"
```

### V-5.4: Next.js example app updated

```bash
# LicenseProvider in providers.tsx
test -f examples/next-app/src/app/providers.tsx \
  && echo "PASS: providers.tsx exists" \
  || echo "FAIL: providers.tsx missing"

grep -q "LicenseProvider" examples/next-app/src/app/providers.tsx \
  && echo "PASS: LicenseProvider imported" \
  || echo "FAIL: LicenseProvider not found in providers.tsx"

grep -q "organizationId" examples/next-app/src/app/providers.tsx \
  && echo "PASS: organizationId prop present" \
  || echo "FAIL: organizationId prop missing"

grep -q "@tour-kit/license" examples/next-app/src/app/providers.tsx \
  && echo "PASS: Imports from @tour-kit/license" \
  || echo "FAIL: Missing @tour-kit/license import"

# .env.example
test -f examples/next-app/.env.example \
  && echo "PASS: .env.example exists" \
  || echo "FAIL: .env.example missing"

grep -q "NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY" examples/next-app/.env.example \
  && echo "PASS: NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY in .env.example" \
  || echo "FAIL: Missing NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY"

# package.json dependency
grep -q "@tour-kit/license" examples/next-app/package.json \
  && echo "PASS: @tour-kit/license in package.json" \
  || echo "FAIL: @tour-kit/license missing from package.json"
```

### V-5.5: Vite example app updated

```bash
# LicenseProvider in App.tsx
test -f examples/vite-app/src/App.tsx \
  && echo "PASS: App.tsx exists" \
  || echo "FAIL: App.tsx missing"

grep -q "LicenseProvider" examples/vite-app/src/App.tsx \
  && echo "PASS: LicenseProvider imported" \
  || echo "FAIL: LicenseProvider not found in App.tsx"

grep -q "import.meta.env.VITE_TOUR_KIT_LICENSE_KEY" examples/vite-app/src/App.tsx \
  && echo "PASS: Uses Vite env var access" \
  || echo "FAIL: Missing Vite env var access"

# .env.example
test -f examples/vite-app/.env.example \
  && echo "PASS: .env.example exists" \
  || echo "FAIL: .env.example missing"

grep -q "VITE_TOUR_KIT_LICENSE_KEY" examples/vite-app/.env.example \
  && echo "PASS: VITE_TOUR_KIT_LICENSE_KEY in .env.example" \
  || echo "FAIL: Missing VITE_TOUR_KIT_LICENSE_KEY"

# package.json dependency
grep -q "@tour-kit/license" examples/vite-app/package.json \
  && echo "PASS: @tour-kit/license in package.json" \
  || echo "FAIL: @tour-kit/license missing from package.json"
```

### V-5.6: Full monorepo build

```bash
# Full build — must exit 0
pnpm build
echo "Build exit code: $?"

# Docs site build
pnpm --filter docs build
echo "Docs build exit code: $?"
```

### V-5.7: Full test suite with coverage

```bash
# All package tests pass
pnpm test --filter='./packages/*'
echo "Test exit code: $?"

# License package coverage >80%
pnpm --filter=@tour-kit/license test:coverage 2>&1 | tee /tmp/license-coverage.txt

# Extract coverage percentage (line coverage)
coverage=$(grep "All files" /tmp/license-coverage.txt | awk '{print $4}' | tr -d '%')
if [ -n "$coverage" ]; then
  result=$(echo "$coverage > 80" | bc -l)
  if [ "$result" -eq 1 ]; then
    echo "PASS: License coverage is ${coverage}% (>80%)"
  else
    echo "FAIL: License coverage is ${coverage}% (need >80%)"
  fi
else
  echo "WARN: Could not parse coverage output"
fi
```

### V-5.8: Bundle size checks

```bash
# Build license package
pnpm build --filter=@tour-kit/license

# License package < 3KB gzipped
license_size=$(gzip -c packages/license/dist/index.js 2>/dev/null | wc -c)
if [ "$license_size" -lt 3072 ]; then
  echo "PASS: @tour-kit/license is ${license_size} bytes gzipped (<3KB)"
else
  echo "FAIL: @tour-kit/license is ${license_size} bytes gzipped (budget: <3KB)"
fi

# Core < 8KB gzipped
core_size=$(gzip -c packages/core/dist/index.js 2>/dev/null | wc -c)
if [ "$core_size" -lt 8192 ]; then
  echo "PASS: @tour-kit/core is ${core_size} bytes gzipped (<8KB)"
else
  echo "FAIL: @tour-kit/core is ${core_size} bytes gzipped (budget: <8KB)"
fi

# React < 12KB gzipped
react_size=$(gzip -c packages/react/dist/index.js 2>/dev/null | wc -c)
if [ "$react_size" -lt 12288 ]; then
  echo "PASS: @tour-kit/react is ${react_size} bytes gzipped (<12KB)"
else
  echo "FAIL: @tour-kit/react is ${react_size} bytes gzipped (budget: <12KB)"
fi

# Hints < 5KB gzipped
hints_size=$(gzip -c packages/hints/dist/index.js 2>/dev/null | wc -c)
if [ "$hints_size" -lt 5120 ]; then
  echo "PASS: @tour-kit/hints is ${hints_size} bytes gzipped (<5KB)"
else
  echo "FAIL: @tour-kit/hints is ${hints_size} bytes gzipped (budget: <5KB)"
fi

# Free packages must NOT import @tour-kit/license
forbidden=$(grep -r "@tour-kit/license" packages/core packages/react packages/hints 2>/dev/null | wc -l)
if [ "$forbidden" -eq 0 ]; then
  echo "PASS: Free packages have zero @tour-kit/license imports"
else
  echo "FAIL: Found $forbidden @tour-kit/license references in free packages"
  grep -r "@tour-kit/license" packages/core packages/react packages/hints
fi
```

### V-5.9: Changeset exists

```bash
# At least one changeset file exists with license major bump
changeset_files=$(ls .changeset/*.md 2>/dev/null | grep -v README | head -5)
if [ -z "$changeset_files" ]; then
  echo "FAIL: No changeset files found"
else
  echo "PASS: Changeset files found"
  for f in $changeset_files; do
    echo "  - $f"
  done
fi

# Changeset contains @tour-kit/license: major
found_major=0
for f in .changeset/*.md; do
  [ "$f" = ".changeset/README.md" ] && continue
  if grep -q "'@tour-kit/license': major" "$f" 2>/dev/null; then
    found_major=1
    echo "PASS: Found major bump for @tour-kit/license in $f"
  fi
done
if [ "$found_major" -eq 0 ]; then
  echo "FAIL: No changeset with '@tour-kit/license': major"
fi

# Changeset does NOT include free packages
for f in .changeset/*.md; do
  [ "$f" = ".changeset/README.md" ] && continue
  if grep -q "'@tour-kit/core'" "$f" 2>/dev/null || \
     grep -q "'@tour-kit/react'" "$f" 2>/dev/null || \
     grep -q "'@tour-kit/hints'" "$f" 2>/dev/null; then
    echo "FAIL: Changeset $f includes free packages (should not)"
  else
    echo "PASS: Changeset $f does not include free packages"
  fi
done

# Changeset includes patch bumps for pro packages
for pkg in adoption ai analytics announcements checklists media scheduling; do
  for f in .changeset/*.md; do
    [ "$f" = ".changeset/README.md" ] && continue
    if grep -q "'@tour-kit/$pkg': patch" "$f" 2>/dev/null; then
      echo "PASS: $pkg has patch bump"
      break
    fi
  done
done
```

### V-5.10: CI config and .npmrc

```bash
# CI workflow references NPM_TOKEN
test -f .github/workflows/ci.yml \
  && echo "PASS: ci.yml exists" \
  || echo "FAIL: ci.yml missing"

grep -q "NPM_TOKEN" .github/workflows/ci.yml \
  && echo "PASS: ci.yml references NPM_TOKEN" \
  || echo "FAIL: ci.yml missing NPM_TOKEN"

grep -q "secrets.NPM_TOKEN" .github/workflows/ci.yml \
  && echo "PASS: ci.yml uses secrets.NPM_TOKEN" \
  || echo "FAIL: ci.yml missing secrets.NPM_TOKEN"

# .npmrc has auth token interpolation
test -f .npmrc \
  && echo "PASS: .npmrc exists" \
  || echo "FAIL: .npmrc missing"

grep -q '//registry.npmjs.org/:_authToken=${NPM_TOKEN}' .npmrc \
  && echo "PASS: .npmrc has auth token interpolation" \
  || echo "FAIL: .npmrc missing auth token line"

# Release workflow also has NPM_TOKEN
if [ -f .github/workflows/release.yml ]; then
  grep -q "NPM_TOKEN" .github/workflows/release.yml \
    && echo "PASS: release.yml references NPM_TOKEN" \
    || echo "WARN: release.yml missing NPM_TOKEN"
fi
```

### V-5.11: npm dry-run publish (manual)

```bash
# Manual verification — requires npm account access
# Run these interactively, not in CI

npm whoami
npm access get status @tour-kit/license  # should return "restricted"

cd packages/license
npm publish --dry-run --access restricted 2>&1 | tee /tmp/npm-dry-run.txt

# Verify tarball contents
grep -q "dist/" /tmp/npm-dry-run.txt \
  && echo "PASS: dist/ included in tarball" \
  || echo "FAIL: dist/ missing from tarball"

grep -q "README.md" /tmp/npm-dry-run.txt \
  && echo "PASS: README.md included in tarball" \
  || echo "FAIL: README.md missing from tarball"

# Verify no source code leaks
grep -q "src/" /tmp/npm-dry-run.txt \
  && echo "FAIL: src/ leaking into published package" \
  || echo "PASS: src/ not in published package"
```

---

## 6. Integration Tests

```bash
# Full test suite (all packages) — must remain green after Phase 5 changes
pnpm test --filter='./packages/*'

# Docs site builds successfully (proves MDX is valid)
pnpm --filter docs build
```

No new Vitest integration test files are created. The existing test suite validates that documentation and configuration changes introduce no regressions. The docs build serves as the integration test for the MDX page.

---

## 7. Edge Cases

| Scenario | Expected Behaviour |
|----------|-------------------|
| `.env.example` committed to git | Safe — contains only variable names, no values |
| `.npmrc` committed to git | Safe — uses `${NPM_TOKEN}` interpolation, no raw tokens |
| `NPM_TOKEN` unset during local dev | pnpm silently ignores empty auth token for public packages |
| Docs MDX has invalid frontmatter | `pnpm --filter docs build` fails (caught by V-5.6) |
| Changeset includes free packages | V-5.9 check fails — free packages must not be bumped |
| `packages/license/src/` modified | Violates phase constraint — no runtime code changes allowed |
| README contains leftover `publicKey` reference | V-5.2 grep check catches it |
| Example app missing `organizationId` prop | TypeScript build error caught by V-5.6 |
| `meta.json` missing `licensing` entry | Docs page not navigable; caught by V-5.3 navigation check |

---

## 8. Fixtures and Helpers

No test fixtures or helper files are needed. All verification commands are self-contained shell scripts that run against the real monorepo file system and build output. The only prerequisite is that Phases 0-4 are complete and `pnpm install` has been run.

---

## 9. Exit Criteria

- `packages/license/CLAUDE.md` exists with Package Purpose, Key Files, Domain Concepts, API Surface, Testing Patterns, Common Pitfalls sections
- `packages/license/README.md` documents Polar-based API; `grep -ic "jose\|JWT\|publicKey" packages/license/README.md` returns `0`
- `apps/docs/content/docs/licensing/index.mdx` exists with all 10 sections, uses Fumadocs `Callout` and `Tabs` imports
- `apps/docs/content/docs/meta.json` includes `"licensing"` in the pages array
- `examples/next-app/src/app/providers.tsx` imports and renders `LicenseProvider` with `organizationId` prop
- `examples/next-app/.env.example` contains `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY=`
- `examples/vite-app/src/App.tsx` imports and renders `LicenseProvider` with `import.meta.env.VITE_TOUR_KIT_LICENSE_KEY`
- `examples/vite-app/.env.example` contains `VITE_TOUR_KIT_LICENSE_KEY=`
- `pnpm build` exits 0 with zero TypeScript errors across all packages
- `pnpm --filter docs build` exits 0 (proves MDX is valid)
- `pnpm test --filter='./packages/*'` exits 0
- `@tour-kit/license` test coverage > 80%
- `@tour-kit/license` < 3KB gzipped; `core` < 8KB; `react` < 12KB; `hints` < 5KB
- `grep -r "@tour-kit/license" packages/core packages/react packages/hints` returns nothing
- `.changeset/*.md` contains `'@tour-kit/license': major` and patch bumps for 7 pro packages, excludes free packages
- `.github/workflows/ci.yml` references `secrets.NPM_TOKEN`
- `.npmrc` contains `//registry.npmjs.org/:_authToken=${NPM_TOKEN}`
- `npm publish --dry-run --access restricted` succeeds for `@tour-kit/license` (manual)

# Phase 5 — Testing: Documentation, Examples & Hardening

**Scope:** No new runtime code — verification of docs, examples, build, tests, and bundle sizes
**Key Pattern:** No fakes — this phase runs existing tests and verification commands. New "tests" are shell commands, not vitest files.
**Dependencies:** pnpm, turbo, vitest (existing), gzip

---

## User Stories

1. **As a developer reading the npm page,** I can understand how to install, configure, and use `@tour-kit/license` from the README alone.
2. **As a developer using the example apps,** I can see `LicenseProvider` integrated into both the Next.js and Vite examples so I have a working reference.
3. **As a CI pipeline,** the full monorepo build passes with zero type errors and all existing tests stay green with >80% coverage on the license package.
4. **As a maintainer,** I can verify that free packages (`core`, `react`, `hints`) have zero license imports and their bundle sizes are unchanged, confirming the licensing boundary is clean.

---

## 1. Component Mock Strategy

No new components to test. Phase 5 produces documentation files (Markdown, MDX, JSON) and minor provider wiring in examples. All runtime code was delivered in Phases 1-4. Verification relies on build tools and grep, not component mocks.

---

## 2. Test Tier Table

| # | Verification | Tool | Pass Criteria |
|---|-------------|------|---------------|
| 1 | Full monorepo build | `pnpm build` | Exit code 0, zero type errors |
| 2 | License package tests + coverage | `pnpm test --filter=@tour-kit/license -- --coverage` | All pass, >80% coverage |
| 3 | License main bundle size | `gzip -c packages/license/dist/index.mjs \| wc -c` | < 3072 bytes |
| 4 | License headless bundle size | `gzip -c packages/license/dist/headless.mjs \| wc -c` | < 1024 bytes |
| 5 | No license imports in free packages (source) | `grep -r "@tour-kit/license" packages/core/src/ packages/react/src/ packages/hints/src/` | 0 results |
| 6 | No license globals in free package dist | `grep -r "__tourkit_license__" packages/core/dist/ packages/react/dist/ packages/hints/dist/` | 0 results |
| 7 | Changeset pending | `pnpm changeset status` | Shows `polar-licensing` changeset |
| 8 | Docs site starts with licensing page | `pnpm --filter docs dev` | Licensing page appears in sidebar |
| 9 | Next.js example builds | `pnpm build --filter=next-app` | Exit code 0 |
| 10 | Vite example builds | `pnpm build --filter=vite-app` | Exit code 0 |

---

## 3. No Fake Implementations (Verification Phase)

Phase 5 introduces no new runtime code, so no new mocks, stubs, or fake implementations are needed — every check runs against real build output and existing test suites.

---

## 4. Test File List

No new test files are created. The following existing test files must continue to pass:

| Existing File | What It Covers |
|---------------|----------------|
| `packages/license/src/__tests__/validate-license.test.ts` | License key validation logic |
| `packages/license/src/__tests__/license-provider.test.tsx` | React provider and context |
| `packages/license/src/__tests__/license-guard.test.tsx` | Feature gating component |
| `packages/license/src/__tests__/use-license.test.tsx` | Hook behavior |
| `packages/license/src/__tests__/build/entry-exports.test.ts` | Public API surface |

Additionally, the verification commands listed in the Tier Table above serve as the "test cases" for this phase.

---

## 5. Test Setup

No new test setup required. The existing vitest configuration in `packages/license/vitest.config.ts` handles all unit and component tests. Verification commands run directly in the shell.

---

## 6. Key Testing Decisions

| Decision | Rationale |
|----------|-----------|
| No new vitest files | Phase 5 adds no runtime code; all logic was tested in Phases 1-4 |
| `grep` for isolation checks | A simple grep against source and dist is deterministic, fast, and catches any accidental import leak without needing a custom test harness |
| Bundle size as a gate | Gzipped byte count is the most reliable proxy for "we didn't accidentally pull in a dependency"; it also protects free-tier users from paying for code they don't use |
| Example builds as verification | If the examples compile after adding `LicenseProvider`, the integration is sound — no need for E2E tests at this stage |
| Changeset status check | Ensures the release pipeline will pick up the breaking change; forgetting the changeset is a common oversight |

---

## 7. Example Test Case

This phase's "test" is not a vitest file — it is the verification script itself. Here is the key isolation check expressed as a shell block:

```bash
# Isolation gate: free packages must never import from @tour-kit/license
HITS=$(grep -r "@tour-kit/license" packages/core/src/ packages/react/src/ packages/hints/src/ 2>/dev/null | wc -l)
if [ "$HITS" -ne 0 ]; then
  echo "FAIL: Found $HITS license import(s) in free packages"
  grep -rn "@tour-kit/license" packages/core/src/ packages/react/src/ packages/hints/src/
  exit 1
else
  echo "PASS: Free packages have zero license imports"
fi

# Dist isolation: no license globals leaked into free package bundles
DIST_HITS=$(grep -r "__tourkit_license__" packages/core/dist/ packages/react/dist/ packages/hints/dist/ 2>/dev/null | wc -l)
if [ "$DIST_HITS" -ne 0 ]; then
  echo "FAIL: Found $DIST_HITS license global(s) in free package dist"
  grep -rn "__tourkit_license__" packages/core/dist/ packages/react/dist/ packages/hints/dist/
  exit 1
else
  echo "PASS: Free package bundles have zero license globals"
fi
```

---

## 8. Execution Prompt

> **You are implementing Phase 5 of the Tour Kit Licensing System.**
>
> Phase 5 is documentation, examples, and hardening. There is NO new runtime code.
>
> **Deliverables:**
> - `packages/license/CLAUDE.md` — AI-context file for the license package
> - `packages/license/README.md` — npm consumer documentation
> - `apps/docs/content/docs/licensing/index.mdx` — Fumadocs documentation page
> - `apps/docs/content/docs/licensing/meta.json` — sidebar configuration
> - Updated `apps/docs/content/docs/meta.json` — add licensing to navigation
> - `examples/next-app/src/app/providers.tsx` — add LicenseProvider wrapping
> - `examples/vite-app/src/App.tsx` — add LicenseProvider wrapping
> - `.changeset/polar-licensing.md` — changeset for breaking changes
>
> **After writing all deliverables, run the full verification sequence below. Every step must pass.**
>
> ```bash
> # 1. Full monorepo build — zero type errors
> pnpm build
>
> # 2. License package tests with coverage — >80%
> pnpm test --filter=@tour-kit/license -- --coverage
>
> # 3. Main bundle size — must be < 3072 bytes
> gzip -c packages/license/dist/index.mjs | wc -c
>
> # 4. Headless bundle size — must be < 1024 bytes
> gzip -c packages/license/dist/headless.mjs | wc -c
>
> # 5. No license imports in free package source
> grep -r "@tour-kit/license" packages/core/src/ packages/react/src/ packages/hints/src/
> # Expected: no output, exit code 1
>
> # 6. No license globals in free package dist
> grep -r "__tourkit_license__" packages/core/dist/ packages/react/dist/ packages/hints/dist/
> # Expected: no output, exit code 1
>
> # 7. Changeset is pending
> pnpm changeset status
>
> # 8. Docs site starts (manual check — licensing page in sidebar)
> pnpm --filter docs dev
>
> # 9. Next.js example builds
> pnpm build --filter=next-app
>
> # 10. Vite example builds
> pnpm build --filter=vite-app
> ```
>
> If any step fails, fix the issue and re-run from step 1. Do not move on until all 10 checks pass.

---

## 9. Run Commands

```bash
# Full verification sequence — run in order, stop on first failure

# Step 1: Build
pnpm build

# Step 2: Tests + coverage
pnpm test --filter=@tour-kit/license -- --coverage

# Step 3: Main bundle gzipped size (< 3072 bytes)
SIZE=$(gzip -c packages/license/dist/index.mjs | wc -c)
echo "index.mjs gzipped: ${SIZE} bytes"
[ "$SIZE" -lt 3072 ] && echo "PASS" || echo "FAIL: exceeds 3KB budget"

# Step 4: Headless bundle gzipped size (< 1024 bytes)
SIZE=$(gzip -c packages/license/dist/headless.mjs | wc -c)
echo "headless.mjs gzipped: ${SIZE} bytes"
[ "$SIZE" -lt 1024 ] && echo "PASS" || echo "FAIL: exceeds 1KB budget"

# Step 5: Source isolation — free packages
HITS=$(grep -rc "@tour-kit/license" packages/core/src/ packages/react/src/ packages/hints/src/ 2>/dev/null | grep -v ':0$' | wc -l)
[ "$HITS" -eq 0 ] && echo "PASS: source isolation" || echo "FAIL: $HITS file(s) import @tour-kit/license"

# Step 6: Dist isolation — free packages
HITS=$(grep -rc "__tourkit_license__" packages/core/dist/ packages/react/dist/ packages/hints/dist/ 2>/dev/null | grep -v ':0$' | wc -l)
[ "$HITS" -eq 0 ] && echo "PASS: dist isolation" || echo "FAIL: $HITS file(s) contain license globals"

# Step 7: Changeset pending
pnpm changeset status

# Step 8: Docs dev (manual — verify licensing page in sidebar, then Ctrl+C)
# pnpm --filter docs dev

# Step 9: Next.js example
pnpm build --filter=next-app

# Step 10: Vite example
pnpm build --filter=vite-app
```

---

## Coverage Check

No new coverage targets — Phase 5 relies on the >80% coverage already achieved in Phases 1-4 for `@tour-kit/license`. The `pnpm test --filter=@tour-kit/license -- --coverage` command in Step 2 confirms this gate holds after any incidental changes.

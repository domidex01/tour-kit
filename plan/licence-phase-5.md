# Phase 5 — Documentation, Examples & Hardening

**Duration:** Days 17-19 (~7 hours)
**Depends on:** Phase 3 (pro package integration), Phase 4 (webhook + pricing)
**Blocks:** Nothing (final phase)
**Risk Level:** LOW — no new logic, documentation and verification only
**Stack:** react, typescript, nextjs

---

## 1. Objective + What Success Looks Like

1. `packages/license/CLAUDE.md` exists and gives Claude Code (or any AI assistant) enough context to work on the license package without re-reading every source file — covering Polar API integration details, key architectural decisions, file layout, and common gotchas.
2. `packages/license/README.md` documents the full Polar-based API for human developers: installation, environment variables, `LicenseProvider` setup, `LicenseGate` usage, `useLicense()` / `useIsPro()` hooks, headless (non-React) usage, and dev-mode behavior.
3. A Fumadocs MDX page at `apps/docs/content/docs/licensing/index.mdx` provides the canonical user-facing guide: installation, env config, provider setup, gating pro features, FAQ (activation limits, dev mode, caching, key rotation, revocation).
4. The Next.js example app (`examples/next-app/`) wraps its provider tree with `LicenseProvider` and uses `LicenseGate` around at least one pro feature (e.g., analytics or checklists), demonstrating the integration pattern with `NEXT_PUBLIC_TOURKIT_LICENSE_KEY` and `NEXT_PUBLIC_TOURKIT_ORG_ID`.
5. The Vite example app (`examples/vite-app/`) does the same with `VITE_TOURKIT_LICENSE_KEY` and `VITE_TOURKIT_ORG_ID`, showing the Vite env variable pattern.
6. `pnpm build` passes with zero type errors across all packages.
7. `pnpm test` passes with >80% coverage on `packages/license/`.
8. `@tour-kit/license` bundle is < 3KB gzipped. Free packages (`core`, `react`, `hints`) have unchanged bundle sizes — zero license imports.
9. A changeset exists documenting the breaking changes: removed `publicKey` prop, new `organizationId` prop, new Polar-backed key format replacing JWT.

---

## 2. Architecture / Key Design Decisions

This phase produces no new runtime code. The decisions here are about documentation structure and example integration patterns.

### 2.1 Documentation Hierarchy

Three layers of documentation, each for a different audience:

| File | Audience | Purpose |
|------|----------|---------|
| `packages/license/CLAUDE.md` | AI assistants / contributors | Machine-context: file layout, API surface, Polar endpoints, testing patterns |
| `packages/license/README.md` | npm consumers | Quick-start: install, configure, use — copy-paste ready |
| `apps/docs/content/docs/licensing/index.mdx` | tourkit.dev visitors | Full guide with env setup, provider config, gating patterns, FAQ, troubleshooting |

### 2.2 Docs Site Integration

The licensing page goes under a new `licensing/` directory in the docs content tree. The `meta.json` at `apps/docs/content/docs/meta.json` must be updated to include `"licensing"` in the pages array — placed after the Extended Packages section and before Resources, since licensing applies to all pro packages. A `licensing/meta.json` file is also needed for sidebar navigation within the section.

### 2.3 Example App Integration Pattern

Both example apps already use pro packages (analytics, checklists, hints, ai). The `LicenseProvider` wraps the outermost provider layer (outside `AnalyticsProvider`, inside the root component) so all pro packages inherit the license context. The pattern:

```tsx
// Next.js
<LicenseProvider
  licenseKey={process.env.NEXT_PUBLIC_TOURKIT_LICENSE_KEY}
  organizationId={process.env.NEXT_PUBLIC_TOURKIT_ORG_ID}
>
  <AnalyticsProvider ...>
    {/* rest of app */}
  </AnalyticsProvider>
</LicenseProvider>

// Vite
<LicenseProvider
  licenseKey={import.meta.env.VITE_TOURKIT_LICENSE_KEY}
  organizationId={import.meta.env.VITE_TOURKIT_ORG_ID}
>
  <AnalyticsProvider ...>
    {/* rest of app */}
  </AnalyticsProvider>
</LicenseProvider>
```

A `LicenseGate` is added around one visible pro feature in each app to demonstrate the gating pattern. When no key is configured (the default for example apps), pro features still render in dev mode — the gate auto-bypasses on localhost.

### 2.4 Changeset Scope

This is a major breaking change for `@tour-kit/license` only. The changeset uses `major` for the license package and `patch` for the 7 pro packages (which now have an optional peer dependency on the license package). Free packages (`core`, `react`, `hints`) are excluded from the changeset entirely — they have no changes.

---

## 3. Tasks

### Task 5.1 — Write `packages/license/CLAUDE.md` (0.5h)

**What:** Create the AI-context file that Claude Code reads when working on the license package.

**File:** `packages/license/CLAUDE.md`

**Content structure:**
1. Package overview — one paragraph: Polar.sh-backed license key validation, activation, caching for Tour Kit Pro
2. File layout — the directory tree from the big plan (`src/lib/`, `src/context/`, `src/components/`, `src/hooks/`, `src/__tests__/`)
3. Key design decisions:
   - Raw `fetch()` to Polar public endpoints, no `@polar-sh/sdk` bundled
   - 24h localStorage cache with domain-scoped keys
   - Dev mode bypass: `isDevEnvironment()` skips activation on localhost/127.0.0.1/*.local/*.test
   - Zod schemas validate all Polar API responses at runtime
4. Public API surface (two entry points):
   - `index.ts` (React): `LicenseProvider`, `LicenseGate`, `LicenseWarning`, `useLicense()`, `useIsPro()`, plus all types
   - `headless.ts` (no React): `validateLicenseKey()`, `activateLicense()`, `deactivateLicense()`, `clearLicenseCache()`, types
5. Polar API endpoints used:
   - `POST /v1/customer-portal/license-keys/validate` — public, no auth
   - `POST /v1/customer-portal/license-keys/activate` — public, no auth
   - `POST /v1/customer-portal/license-keys/deactivate` — public, no auth
6. Testing patterns — mock `fetch()` globally, mock `localStorage`, use `@testing-library/react` for component tests
7. Common gotchas — cache TTL is 24h (change in `cache.ts`), activation limit is 5 domains (enforced by Polar, not client), dev bypass only checks domain not NODE_ENV

**Verification:** File exists, matches the structure of other package CLAUDE.md files (e.g., `packages/core/CLAUDE.md`).

---

### Task 5.2 — Update `packages/license/README.md` (1h)

**What:** Rewrite the README to document the Polar-based API, replacing any old JWT-based content.

**File:** `packages/license/README.md`

**Sections:**
1. **Header** — package name, one-line description, badges (npm version, bundle size, license)
2. **Installation** — `pnpm add @tour-kit/license` (peer deps: `react >= 18`, `zod >= 3`)
3. **Environment Setup** — table of env vars:
   - `NEXT_PUBLIC_TOURKIT_LICENSE_KEY` / `VITE_TOURKIT_LICENSE_KEY` — the Polar license key
   - `NEXT_PUBLIC_TOURKIT_ORG_ID` / `VITE_TOURKIT_ORG_ID` — Polar organization ID
4. **Quick Start** — minimal code showing `LicenseProvider` + `LicenseGate`
5. **Components** — `LicenseProvider` (props table: `licenseKey`, `organizationId`, `children`), `LicenseGate` (props: `require`, `fallback`, `children`), `LicenseWarning`
6. **Hooks** — `useLicense()` (returns `LicenseState`), `useIsPro()` (returns `boolean`)
7. **Headless Usage** — import from `@tour-kit/license/headless`, call `validateLicenseKey({ key, organizationId })`
8. **Dev Mode** — automatic bypass on localhost, no activation consumed
9. **Caching** — 24h localStorage cache, `clearLicenseCache()` to force re-validation
10. **API Reference** — link to docs site

**Verification:** No references to JWT, `publicKey`, or `jose` remain. All code examples use `organizationId` and Polar key format.

---

### Task 5.3 — Write Docs Page: `apps/docs/content/docs/licensing/index.mdx` (1.5h)

**What:** Create the canonical licensing documentation page on tourkit.dev.

**Files:**
- `apps/docs/content/docs/licensing/index.mdx` — the main page
- `apps/docs/content/docs/licensing/meta.json` — sidebar config: `{ "title": "Licensing", "pages": ["index"] }`
- Update `apps/docs/content/docs/meta.json` — add `"licensing"` to the pages array after `"scheduling"` and before `"---Resources---"`

**MDX frontmatter:**
```yaml
---
title: Licensing
description: >-
  Set up Tour Kit Pro licensing with Polar.sh — license key validation,
  activation, and gating for extended packages
---
```

**Page sections:**
1. **Overview** — what licensing does, which packages are pro (analytics, announcements, checklists, adoption, media, scheduling, ai), what stays free (core, react, hints)
2. **Installation** — `pnpm add @tour-kit/license`
3. **Environment Configuration** — Next.js `.env.local` vs Vite `.env` patterns, table of variables
4. **Provider Setup** — `LicenseProvider` wrapping the app, code example for Next.js and Vite
5. **Gating Pro Features** — `LicenseGate` component usage, `require="pro"` prop, custom fallback
6. **Using Hooks** — `useLicense()` for full state, `useIsPro()` for boolean check, conditional rendering patterns
7. **Headless Usage** — server-side or non-React validation with `@tour-kit/license/headless`
8. **Dev Mode** — automatic bypass on localhost, no activation slot consumed, `LicenseWarning` component
9. **Caching** — 24h localStorage cache, how to clear, how to force re-validation
10. **FAQ** — at least these questions:
    - How many domains can I activate? (5, managed by Polar)
    - What happens when my license is revoked? (graceful degradation, dev warning, pro features stop rendering)
    - Does the license check block rendering? (no, async validation, renders children immediately on cache hit)
    - How do I deactivate a domain? (Polar customer portal, or `deactivateLicense()` programmatically)
    - What if Polar is down? (24h cache protects existing activations, new activations fail gracefully)
    - Do free packages check the license? (no, zero license imports in core/react/hints)

**Verification:** Page renders in Fumadocs dev server, appears in sidebar navigation, all code examples are syntactically correct.

---

### Task 5.4 — Update Next.js Example App (1h)

**What:** Add `LicenseProvider` to the Next.js example and wrap one pro feature with `LicenseGate`.

**Files to modify:**
- `examples/next-app/src/app/providers.tsx` — add `LicenseProvider` import, wrap the outermost layer
- `examples/next-app/.env.example` — add `NEXT_PUBLIC_TOURKIT_LICENSE_KEY=` and `NEXT_PUBLIC_TOURKIT_ORG_ID=` (empty values, commented with instructions)
- `examples/next-app/package.json` — add `@tour-kit/license` to dependencies

**Changes to `providers.tsx`:**
1. Import `LicenseProvider` and `LicenseGate` from `@tour-kit/license`
2. In the `Providers` component, wrap `AnalyticsProvider` with `LicenseProvider`:
   ```tsx
   <LicenseProvider
     licenseKey={process.env.NEXT_PUBLIC_TOURKIT_LICENSE_KEY}
     organizationId={process.env.NEXT_PUBLIC_TOURKIT_ORG_ID}
   >
     <AnalyticsProvider config={analyticsConfig}>
       <ProvidersInner>{children}</ProvidersInner>
     </AnalyticsProvider>
   </LicenseProvider>
   ```
3. Wrap `ChecklistWrapper` (a pro feature) with `LicenseGate`:
   ```tsx
   <LicenseGate require="pro" fallback={<HintsProvider>{children}</HintsProvider>}>
     <ChecklistWrapper>
       <HintsProvider>{children}</HintsProvider>
     </ChecklistWrapper>
   </LicenseGate>
   ```
4. Add a comment explaining that dev mode auto-bypasses the gate on localhost

**Verification:** App compiles with `pnpm build --filter=next-app`. On localhost, all features render (dev bypass). Without a key in production, the `ChecklistWrapper` is replaced by the fallback.

---

### Task 5.5 — Update Vite Example App (1h)

**What:** Same pattern as Task 5.4 but for the Vite + React Router example.

**Files to modify:**
- `examples/vite-app/src/App.tsx` — add `LicenseProvider` wrapping `AnalyticsProvider`, `LicenseGate` around `ChecklistWrapper`
- `examples/vite-app/.env.example` — add `VITE_TOURKIT_LICENSE_KEY=` and `VITE_TOURKIT_ORG_ID=`
- `examples/vite-app/package.json` — add `@tour-kit/license` to dependencies

**Changes to `App.tsx`:**
1. Import `LicenseProvider` and `LicenseGate` from `@tour-kit/license`
2. In the `App` component, wrap `AnalyticsProvider` with `LicenseProvider`:
   ```tsx
   <LicenseProvider
     licenseKey={import.meta.env.VITE_TOURKIT_LICENSE_KEY}
     organizationId={import.meta.env.VITE_TOURKIT_ORG_ID}
   >
     <AnalyticsProvider config={analyticsConfig}>
       <AppContent />
     </AnalyticsProvider>
   </LicenseProvider>
   ```
3. In `AppContent`, wrap `ChecklistWrapper` with `LicenseGate`:
   ```tsx
   <LicenseGate require="pro" fallback={
     <HintsProvider>
       <Layout>
         <Routes>...</Routes>
       </Layout>
     </HintsProvider>
   }>
     <ChecklistWrapper>
       <HintsProvider>
         <Layout>
           <Routes>...</Routes>
         </Layout>
       </HintsProvider>
     </ChecklistWrapper>
   </LicenseGate>
   ```
4. Add a comment explaining dev mode bypass

**Verification:** App compiles with `pnpm build --filter=vite-app`. Same dev-bypass behavior as the Next.js app.

---

### Task 5.6 — Full Monorepo Build (0.5h)

**What:** Run `pnpm build` and verify all packages compile with zero type errors.

**Command:** `pnpm build`

**Check for:**
- Zero TypeScript errors in any package
- All 11+ packages produce output (core, react, hints, adoption, analytics, announcements, checklists, media, scheduling, license, ai)
- No warnings about missing peer dependencies related to `@tour-kit/license`
- Both example apps build successfully

**If build fails:** Fix the issue in the relevant package. Common problems: missing type exports in `index.ts`, circular dependency between license and a pro package, incorrect `tsup.config.ts` entry points.

---

### Task 5.7 — Full Test Suite (0.5h)

**What:** Run `pnpm test` and verify >80% coverage on the license package.

**Command:** `pnpm test` (or `pnpm test --filter=@tour-kit/license -- --coverage` for focused run)

**Check for:**
- All license package tests pass (polar-client, cache, domain, license-provider, license-gate, hooks)
- Coverage > 80% on `packages/license/src/` (statements, branches, functions, lines)
- No regressions in other package tests

**If coverage is below 80%:** Identify uncovered branches (likely error handling paths in `polar-client.ts` or edge cases in `cache.ts`). Add targeted tests to bring coverage above threshold.

---

### Task 5.8 — Bundle Size Verification (0.5h)

**What:** Confirm `@tour-kit/license` is < 3KB gzipped and free packages are unchanged.

**Steps:**
1. Run `pnpm build --filter=@tour-kit/license` and check tsup output for gzipped sizes
2. Record: `index.js` (ESM) size, `headless.js` (ESM) size
3. Run `pnpm build --filter=@tour-kit/core --filter=@tour-kit/react --filter=@tour-kit/hints` and compare sizes to baseline (core < 8KB, react < 12KB, hints < 5KB)
4. Verify free packages have zero imports from `@tour-kit/license` by grepping their built output: `grep -r "license" packages/core/dist/ packages/react/dist/ packages/hints/dist/` should return nothing

**If license bundle > 3KB:** Check if Zod is being bundled (it should be a peer dep / external). Check for accidental inclusion of test utilities or dev-only code.

---

### Task 5.9 — Create Changeset (0.5h)

**What:** Document breaking changes using Changesets so the next release has proper changelog entries.

**Command:** Create a changeset file manually at `.changeset/<descriptive-name>.md`

**Changeset content:**
```markdown
---
"@tour-kit/license": major
"@tour-kit/analytics": patch
"@tour-kit/announcements": patch
"@tour-kit/checklists": patch
"@tour-kit/adoption": patch
"@tour-kit/media": patch
"@tour-kit/scheduling": patch
"@tour-kit/ai": patch
---

Replace JWT-based licensing with Polar.sh license key validation.

**Breaking changes in `@tour-kit/license`:**
- Removed `publicKey` prop from `LicenseProvider` — replaced with `organizationId`
- License key format changed from JWT to Polar key format (`TOURKIT_<uuid>`)
- Removed `jose` dependency — validation now uses Polar's public API
- `validateLicenseKey()` signature changed: accepts `{ key, organizationId }` instead of `{ token, publicKey }`

**New features:**
- Per-domain activation (up to 5 sites) via Polar API
- 24h localStorage cache with automatic re-validation
- Dev mode auto-bypass on localhost — no activation slot consumed
- `LicenseGate` component for declarative pro feature gating
- `useIsPro()` convenience hook
- Headless entry point (`@tour-kit/license/headless`) for non-React usage

**Pro packages (patch):**
- Added optional `@tour-kit/license` peer dependency
- Graceful degradation without license — dev warning, no crash
```

**Verification:** `pnpm changeset status` shows the pending changeset. Package versions are correct (major for license, patch for pro packages, nothing for free packages).

---

## 4. Deliverables

| # | Deliverable | Path |
|---|-------------|------|
| 5.1 | License package CLAUDE.md | `packages/license/CLAUDE.md` |
| 5.2 | License package README.md | `packages/license/README.md` |
| 5.3a | Licensing docs page | `apps/docs/content/docs/licensing/index.mdx` |
| 5.3b | Licensing sidebar config | `apps/docs/content/docs/licensing/meta.json` |
| 5.3c | Updated docs navigation | `apps/docs/content/docs/meta.json` |
| 5.4a | Next.js example providers | `examples/next-app/src/app/providers.tsx` |
| 5.4b | Next.js env example | `examples/next-app/.env.example` |
| 5.4c | Next.js package.json | `examples/next-app/package.json` |
| 5.5a | Vite example App.tsx | `examples/vite-app/src/App.tsx` |
| 5.5b | Vite env example | `examples/vite-app/.env.example` |
| 5.5c | Vite package.json | `examples/vite-app/package.json` |
| 5.6 | Clean build log | Terminal output (no file) |
| 5.7 | Test + coverage report | Terminal output (no file) |
| 5.8 | Bundle size report | Terminal output (no file) |
| 5.9 | Changeset | `.changeset/<name>.md` |

---

## 5. Exit Criteria

- [ ] `packages/license/CLAUDE.md` exists with Polar integration guidance, file layout, API surface, and testing patterns
- [ ] `packages/license/README.md` documents installation, env setup, provider config, hooks, headless usage — zero references to JWT or `publicKey`
- [ ] `apps/docs/content/docs/licensing/index.mdx` covers: installation, env config, provider setup, LicenseGate usage, hooks, dev mode, caching, FAQ (6+ questions)
- [ ] Licensing page appears in docs site sidebar navigation
- [ ] Next.js example app has `LicenseProvider` wrapping providers and `LicenseGate` around a pro feature
- [ ] Vite example app has `LicenseProvider` wrapping providers and `LicenseGate` around a pro feature
- [ ] Both example apps have `.env.example` files with license key variables
- [ ] `pnpm build` passes with zero type errors across all packages
- [ ] `pnpm test` passes with >80% coverage on `packages/license/src/`
- [ ] `@tour-kit/license` bundle size < 3KB gzipped (both entry points)
- [ ] Free packages (`core`, `react`, `hints`) have zero imports from `@tour-kit/license` in built output
- [ ] Free package bundle sizes unchanged from pre-licensing baseline
- [ ] Changeset created: major for `@tour-kit/license`, patch for 7 pro packages, nothing for free packages
- [ ] `pnpm changeset status` shows pending changeset with correct package versions

---

## 6. Execution Prompt

You are working on **Tour Kit**, a headless onboarding and product tour library for React. It is a pnpm monorepo using Turborepo and tsup, with a Fumadocs documentation site at `apps/docs/`.

**What prior phases established:**

- **Phase 0:** Validated Polar.sh license key API in sandbox — validate, activate, deactivate endpoints all work with raw `fetch()`, no auth required, p95 latency < 500ms.
- **Phase 1:** Built the core SDK in `packages/license/src/lib/`:
  - `polar-client.ts` — `validateLicenseKey({ key, organizationId })`, `activateLicense()`, `deactivateLicense()` using raw `fetch()` against Polar's public API (`POST /v1/customer-portal/license-keys/validate`, `/activate`, `/deactivate`)
  - `cache.ts` — `readCache()`, `writeCache()`, `clearLicenseCache()` with 24h TTL, domain-scoped localStorage keys
  - `domain.ts` — `getCurrentDomain()`, `isDevEnvironment()` (detects localhost, 127.0.0.1, *.local, *.test)
  - `schemas.ts` — Zod schemas for `PolarValidateResponse`, `PolarActivateResponse`
  - `types/index.ts` — `LicenseState`, `LicenseCache`, `LicenseError`, `LicenseTier`, `PolarValidateResponse`, `PolarActivateResponse`
  - `headless.ts` — re-exports all lib functions and types (no React dependency)
- **Phase 2:** Built the React integration in `packages/license/src/`:
  - `context/license-context.ts` — `LicenseContext`, `LicenseProvider` (props: `licenseKey`, `organizationId`, `children`; validates on mount, caches, dev-mode bypass on localhost)
  - `components/license-gate.tsx` — `LicenseGate` (props: `require: 'pro'`, `fallback?: ReactNode`, `children`; renders children if licensed, fallback otherwise)
  - `components/license-warning.tsx` — `LicenseWarning` (dev-mode console warning banner)
  - `hooks/use-license.ts` — `useLicense()` returns `LicenseState` from context (throws outside provider)
  - `hooks/use-is-pro.ts` — `useIsPro()` returns `boolean`
  - `index.ts` — re-exports all React components, hooks, and types
  - `tsup.config.ts` — dual entry points: `index.ts` (React) and `headless.ts` (no React)
  - Bundle size confirmed < 3KB gzipped
- **Phase 3:** All 7 pro packages (`analytics`, `announcements`, `checklists`, `adoption`, `media`, `scheduling`, `ai`) have `@tour-kit/license` as an optional peer dependency. Each package's provider calls `useLicense()` in a try-catch — if license package is not installed or no provider is present, features pass through (graceful degradation with dev warning). Free packages (`core`, `react`, `hints`) have zero license imports.
- **Phase 4:** Webhook handler at `apps/docs/app/api/webhooks/polar/route.ts` verifies Standard Webhooks HMAC-SHA256 signatures and handles `benefit_grant.created`/`benefit_grant.revoked` events. Pricing page at `apps/docs/app/pricing/page.tsx` shows Free vs Pro comparison.

**Your task — Phase 5: Documentation, Examples & Hardening.** Complete these 9 tasks in order:

**Task 5.1:** Create `packages/license/CLAUDE.md`. Follow the format of existing package CLAUDE.md files (see `packages/core/CLAUDE.md` for reference). Include: package overview, file layout, key design decisions (raw fetch, 24h cache, dev bypass, Zod schemas), public API surface (index.ts React exports + headless.ts non-React exports), Polar API endpoints used, testing patterns, common gotchas.

**Task 5.2:** Rewrite `packages/license/README.md` for the Polar-based API. Include: installation, environment setup (Next.js and Vite env var patterns), quick start code, components table (LicenseProvider props, LicenseGate props, LicenseWarning), hooks (useLicense returns LicenseState, useIsPro returns boolean), headless usage (import from `@tour-kit/license/headless`), dev mode behavior, caching (24h TTL, clearLicenseCache). Remove all references to JWT, `publicKey`, or `jose`.

**Task 5.3:** Create `apps/docs/content/docs/licensing/index.mdx` with Fumadocs MDX frontmatter (`title: Licensing`, `description: ...`). Create `apps/docs/content/docs/licensing/meta.json` with `{ "title": "Licensing", "pages": ["index"] }`. Update `apps/docs/content/docs/meta.json` to add `"licensing"` after `"scheduling"` and before `"---Resources---"`. The MDX page must cover: overview (free vs pro packages), installation, environment configuration (Next.js `.env.local` and Vite `.env`), provider setup, LicenseGate usage, hooks (useLicense, useIsPro), headless usage, dev mode, caching, and FAQ with at least 6 questions (activation limits, revocation behavior, render blocking, domain deactivation, Polar downtime, free package impact).

**Task 5.4:** Update `examples/next-app/src/app/providers.tsx`:
- Import `LicenseProvider` and `LicenseGate` from `@tour-kit/license`
- Wrap `AnalyticsProvider` in the `Providers` component with `LicenseProvider` using `process.env.NEXT_PUBLIC_TOURKIT_LICENSE_KEY` and `process.env.NEXT_PUBLIC_TOURKIT_ORG_ID`
- Wrap `ChecklistWrapper` in `ProvidersInner` with `LicenseGate require="pro"` with a fallback that renders children without the checklist
- Add `@tour-kit/license` to `examples/next-app/package.json` dependencies
- Create or update `examples/next-app/.env.example` with `NEXT_PUBLIC_TOURKIT_LICENSE_KEY=` and `NEXT_PUBLIC_TOURKIT_ORG_ID=`

**Task 5.5:** Update `examples/vite-app/src/App.tsx`:
- Import `LicenseProvider` and `LicenseGate` from `@tour-kit/license`
- Wrap `AnalyticsProvider` in the `App` component with `LicenseProvider` using `import.meta.env.VITE_TOURKIT_LICENSE_KEY` and `import.meta.env.VITE_TOURKIT_ORG_ID`
- Wrap `ChecklistWrapper` in `AppContent` with `LicenseGate require="pro"` with a fallback that renders children without the checklist
- Add `@tour-kit/license` to `examples/vite-app/package.json` dependencies
- Create or update `examples/vite-app/.env.example` with `VITE_TOURKIT_LICENSE_KEY=` and `VITE_TOURKIT_ORG_ID=`

**Task 5.6:** Run `pnpm build`. Verify zero type errors. If build fails, fix the issue and re-run.

**Task 5.7:** Run `pnpm test` (or `pnpm test --filter=@tour-kit/license -- --coverage`). Verify >80% coverage on `packages/license/src/`. If below, add tests for uncovered branches.

**Task 5.8:** Check bundle sizes:
- `@tour-kit/license` must be < 3KB gzipped (both index.js and headless.js)
- Run `grep -r "license" packages/core/dist/ packages/react/dist/ packages/hints/dist/` — must return nothing
- Compare free package sizes to baseline: core < 8KB, react < 12KB, hints < 5KB

**Task 5.9:** Create `.changeset/polar-licensing.md` with:
- `"@tour-kit/license": major`
- All 7 pro packages: `patch`
- Description listing breaking changes (removed publicKey, new organizationId, new key format, removed jose) and new features (per-domain activation, 24h cache, dev bypass, LicenseGate, useIsPro, headless entry point)
- Run `pnpm changeset status` to verify

**Success criteria:** All 14 exit criteria from Section 5 pass. The licensing system is fully documented, both examples demonstrate integration, the build is clean, tests pass with coverage, bundle sizes are within budget, and the changeset is ready for release.

---

## Readiness Check

Before starting Phase 5, verify:

- [ ] **Phase 3 complete:** All 7 pro packages have `@tour-kit/license` as optional peer dep with graceful degradation — run `pnpm build` to confirm
- [ ] **Phase 4 complete:** Webhook handler exists at `apps/docs/app/api/webhooks/polar/route.ts`, pricing page exists at `apps/docs/app/pricing/page.tsx`
- [ ] **License package builds:** `pnpm build --filter=@tour-kit/license` produces both `dist/index.js` and `dist/headless.js` without errors
- [ ] **License package tests pass:** `pnpm test --filter=@tour-kit/license` — all green
- [ ] **Docs site runs:** `pnpm --filter docs dev` starts the Fumadocs dev server without errors
- [ ] **Example apps build:** `pnpm build --filter=next-app` and `pnpm build --filter=vite-app` both succeed
- [ ] **Existing package CLAUDE.md files exist** for reference: `packages/core/CLAUDE.md` (format template)

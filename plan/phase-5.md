# Licence Phase 5 — Documentation, Examples & Hardening

**Duration:** Days 17–19 (~7–8 hours)
**Depends on:** Phase 0 (Polar validation), Phase 1 (Core SDK), Phase 2 (React layer), Phase 3 (Pro package integration), Phase 4 (Webhook + pricing)
**Blocks:** Phase 6 (Source Code Separation)
**Risk Level:** LOW — documentation, verification, and configuration; no new runtime logic
**Stack:** typescript

---

## 1. Objective + What Success Looks Like

Write all user-facing documentation for the Polar-based licensing system, update both example apps with license integration, run full quality verification (build, tests, bundle size), create a changeset for breaking changes, and configure CI for restricted npm package access.

**Success looks like:**

- A developer reads `apps/docs/content/docs/licensing/index.mdx` and can set up Tour Kit Pro end-to-end: install restricted packages with `NPM_TOKEN`, add `TOUR_KIT_LICENSE_KEY` to their env, wrap their app with `<LicenseProvider>`, and understand watermark behavior
- Both example apps (`examples/next-app/`, `examples/vite-app/`) demonstrate `<LicenseProvider>` wrapping pro features with `.env.example` files showing the required env vars
- `packages/license/CLAUDE.md` gives AI assistants accurate domain guidance for the license package
- `packages/license/README.md` documents the full Polar-based API (no leftover JWT references)
- `pnpm build` compiles all packages with zero type errors
- `pnpm test` passes with >80% coverage on `@tour-kit/license`
- `@tour-kit/license` is < 3KB gzipped; free packages (`core`, `react`, `hints`) show no size regression
- A changeset documents the breaking changes (removed `publicKey` prop, new `organizationId` prop, new key format)
- CI workflow can install restricted `@tour-kit/*` packages via `NPM_TOKEN`
- `npm publish --dry-run` succeeds for at least one restricted package

---

## 2. Key Design Decisions

**D1: MDX follows Fumadocs conventions established in existing docs.**
The licensing page uses the same frontmatter format (`title`, `description`), Fumadocs imports (`Callout`, `Tab`, `Tabs`), and kebab-case file naming as all other package docs. It lives at `apps/docs/content/docs/licensing/index.mdx` and gets added to `apps/docs/content/docs/meta.json` under a new `---Licensing---` separator section (after Extended Packages, before Resources).

**D2: Docs page structure mirrors a setup guide, not an API reference.**
The licensing page is task-oriented: install, configure, verify, deploy. Sections: Installation (npm auth + package install), Configuration (`<LicenseProvider>` setup), Gating (`<LicenseGate>` usage), Watermark Behavior, CI/CD Setup (`NPM_TOKEN` + `.npmrc`), Environment Variables, FAQ. API details (hooks, components, types) are secondary to the "how do I get this working" flow.

**D3: `.env.example` files use framework-appropriate prefixes.**
Next.js example uses `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY` (because `<LicenseProvider>` runs client-side, the key must be exposed to the browser via the `NEXT_PUBLIC_` prefix). Vite example uses `VITE_TOUR_KIT_LICENSE_KEY`. The docs page explains both conventions and why the prefix matters.

**D4: Changeset uses `@changesets/cli` format with `major` bump for license package.**
The changeset documents three breaking changes: (1) removed `publicKey` prop from `<LicenseProvider>`, (2) new required `organizationId` prop, (3) license key format changed from JWT to Polar `TOURKIT-*` format. All 7 pro packages get a `patch` bump (internal dependency update). Free packages are unaffected. The changeset config at `.changeset/config.json` currently has `"access": "public"` and linked free packages — the changeset for pro packages uses the existing config, and Phase 6 will handle the private repo changeset config with `"access": "restricted"`.

**D5: `.npmrc` template never contains raw tokens.**
The `.npmrc` file uses environment variable interpolation (`${NPM_TOKEN}`) and is safe to commit. The actual token lives in CI secrets (`NPM_TOKEN` in GitHub Actions) and developer local environments (which are gitignored). The docs page explains this distinction clearly.

**D6: CLAUDE.md follows the established pattern from other package CLAUDE.md files.**
It covers: package purpose, key files, domain concepts (Polar validation, caching, domain activation), testing patterns, and common pitfalls. It references the architecture from the big plan and Phase 1/2 deliverables. Aim for 60-80 lines.

---

## 3. Tasks

### 5.1: Write `packages/license/CLAUDE.md` (0.5h)

**File:** `packages/license/CLAUDE.md`

Domain-specific guidance for AI assistants working on the license package. Structure:

- **Package Purpose** — Polar.sh license key validation, activation (up to 5 domains), 24h cache, React gating components
- **Key Files** — `src/lib/polar-client.ts` (API calls), `src/lib/cache.ts` (localStorage TTL), `src/lib/domain.ts` (dev detection), `src/lib/schemas.ts` (Zod validation), `src/context/license-context.ts` (React provider), `src/components/` (Gate, Watermark, Warning)
- **Domain Concepts** — License states (`loading` | `valid` | `invalid` | `expired` | `revoked`), activation slots (5 per key), dev bypass (localhost/127.0.0.1/*.local skips activation), cache integrity (Zod parse on read, clear on corruption), render-time domain verification
- **API Surface** — `validateLicenseKey()`, `activateLicense()`, `deactivateLicense()` (headless); `<LicenseProvider>`, `<LicenseGate>`, `<LicenseWatermark>`, `<LicenseWarning>`, `useLicense()`, `useIsPro()` (React)
- **Testing Patterns** — Mock `fetch` for Polar API, mock `localStorage` for cache, mock `window.location` for domain detection, use `@testing-library/react` for component tests
- **Common Pitfalls** — Never import `@tour-kit/license` from free packages (`core`, `react`, `hints`); watermark code lives in pro packages not in license package; dev bypass only applies to `localhost`/`127.0.0.1`/`*.local`; `headless.ts` entry point must not import React

### 5.2: Update `packages/license/README.md` (1h)

**File:** `packages/license/README.md`

Replace any JWT-era content with the Polar-based API. Sections:

- **Overview** — What the package does, why it exists
- **Installation** — `pnpm add @tour-kit/license` (requires npm auth for restricted package), `.npmrc` setup
- **Quick Start** — Minimal `<LicenseProvider>` + `<LicenseGate>` example (copy-pasteable)
- **Configuration** — `organizationId` prop (required), `licenseKey` prop (from env var), `onValidated` callback
- **Components** — `<LicenseGate>`, `<LicenseWatermark>`, `<LicenseWarning>` with prop tables
- **Hooks** — `useLicense()` return shape (`LicenseState`), `useIsPro()` boolean shortcut
- **Headless API** — `validateLicenseKey()`, `activateLicense()`, `deactivateLicense()` for non-React usage via `@tour-kit/license/headless` import
- **Environment Variables** — `TOUR_KIT_LICENSE_KEY` convention, framework-specific prefixes (`NEXT_PUBLIC_`, `VITE_`)
- **CI/CD** — `.npmrc` setup for restricted package installs, `NPM_TOKEN` in GitHub Actions
- **License** — Link to `LICENSE.md` (proprietary)

Ensure zero references to `publicKey`, JWT, or `jose` remain.

### 5.3: Write docs page `apps/docs/content/docs/licensing/index.mdx` (1.5h)

**Files:**
- `apps/docs/content/docs/licensing/index.mdx`
- `apps/docs/content/docs/licensing/meta.json` (navigation ordering if sub-pages are added later)
- Update `apps/docs/content/docs/meta.json` — insert `"---Licensing---"` and `"licensing"` into the `pages` array after the Extended Packages section

MDX page frontmatter:

```
---
title: Licensing
description: Set up Tour Kit Pro licensing with Polar.sh — installation, configuration, and CI/CD
---
```

Sections:
1. **Overview** — Free vs Pro split, what requires a license (7 extended packages + license package itself), what is always free (`core`, `react`, `hints`)
2. **Getting a License Key** — Link to tourkit.dev/pricing, Polar checkout flow, key arrives via email with `TOURKIT-` prefix
3. **Installation** — Setting up `.npmrc` for restricted packages (`//registry.npmjs.org/:_authToken=${NPM_TOKEN}`), `pnpm add @tour-kit/license`, framework-specific env var setup
4. **Configuration** — `<LicenseProvider organizationId="..." licenseKey={process.env.NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY}>` wrapping app, use Fumadocs `<Tabs>` for Next.js vs Vite code samples
5. **Using LicenseGate** — Wrapping pro components, fallback behavior, code example showing `<LicenseGate require="pro">`
6. **Watermark Behavior** — What happens without a valid license: components still render but show "UNLICENSED" overlay, dev console warning, never a crash or blank screen
7. **Development Mode** — Automatic bypass on localhost/127.0.0.1/*.local, no activation slot consumed, `{ valid: true, tier: 'pro' }` returned
8. **CI/CD Setup** — `NPM_TOKEN` in GitHub Actions secrets, `.npmrc` template, Vercel env var configuration, Netlify env var configuration
9. **Hooks Reference** — `useLicense()` and `useIsPro()` quick reference with return type tables
10. **FAQ** — Common questions:
    - "Do free packages need a license?" (no)
    - "What happens if my key expires?" (watermark appears, components still work)
    - "How many domains can I activate?" (5)
    - "Does localhost count as an activation?" (no)
    - "Can I use one key for staging + production?" (yes, separate activations)

Use Fumadocs `<Callout type="info">` for important notes (e.g., "Free packages never require a license key").

### 5.4: Update Next.js example app with LicenseProvider (1h)

**Files:**
- `examples/next-app/src/app/providers.tsx` — Add `LicenseProvider` wrapping pro features
- `examples/next-app/.env.example` — Add `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY=`
- `examples/next-app/package.json` — Add `@tour-kit/license` to dependencies

Implementation notes:
- Import `LicenseProvider` from `@tour-kit/license`
- Wrap the outermost level in the `Providers` component (around `<AiChatProvider>`) so all pro packages are covered
- Pass `organizationId` as a string constant with a `// TODO: replace with your Polar organization ID` comment
- Pass `licenseKey={process.env.NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY ?? ''}`
- Ensure existing tours, checklists, analytics, and AI chat still function without a license key (watermark appears but no crash)

### 5.5: Update Vite example app with LicenseProvider (1h)

**Files:**
- `examples/vite-app/src/App.tsx` — Add `LicenseProvider` wrapping pro features
- `examples/vite-app/.env.example` — Add `VITE_TOUR_KIT_LICENSE_KEY=`
- `examples/vite-app/package.json` — Add `@tour-kit/license` to dependencies

Implementation notes:
- Same pattern as Next.js but with Vite env var access: `import.meta.env.VITE_TOUR_KIT_LICENSE_KEY`
- Add `@tour-kit/license` to `examples/vite-app/package.json` dependencies
- Wrap `<LicenseProvider>` around the outermost provider in `App.tsx`

### 5.6: Run full monorepo build (0.5h)

**Command:** `pnpm build`

Verify:
- All packages compile (including `@tour-kit/license` with dual entry points `index.ts` + `headless.ts`)
- Zero TypeScript errors across all packages
- Both example apps build successfully
- Docs site builds successfully (`pnpm --filter docs build`)
- Fix any errors discovered before proceeding

### 5.7: Run full test suite (0.5h)

**Command:** `pnpm test --filter='./packages/*'`

Verify:
- All package tests pass
- `@tour-kit/license` test coverage > 80% (`pnpm --filter=@tour-kit/license test:coverage`)
- No regressions in free packages (`core`, `react`, `hints`)

### 5.8: Final bundle size check (0.5h)

**Command:** `pnpm build --filter=@tour-kit/license` then inspect `dist/` output

Verify:
- `@tour-kit/license` < 3KB gzipped (ESM entry)
- Free packages unchanged from pre-licensing baseline:
  - `@tour-kit/core` < 8KB gzipped
  - `@tour-kit/react` < 12KB gzipped
  - `@tour-kit/hints` < 5KB gzipped
- Free packages have zero imports from `@tour-kit/license`: `grep -r "@tour-kit/license" packages/core packages/react packages/hints` returns nothing

### 5.9: Create changeset for breaking changes (0.5h)

**File:** `.changeset/<generated-name>.md`

Use `pnpm changeset` interactively or create the file manually. Required format:

```md
---
'@tour-kit/license': major
'@tour-kit/adoption': patch
'@tour-kit/ai': patch
'@tour-kit/analytics': patch
'@tour-kit/announcements': patch
'@tour-kit/checklists': patch
'@tour-kit/media': patch
'@tour-kit/scheduling': patch
---

Replace JWT-based licensing with Polar.sh license key validation

BREAKING CHANGES:
- Removed `publicKey` prop from `<LicenseProvider>` (JWT verification removed)
- Added required `organizationId` prop to `<LicenseProvider>`
- License key format changed from JWT to Polar format (`TOURKIT-*` prefix)
- Removed `jose` dependency

New features:
- Polar.sh license key validation and activation (up to 5 domains)
- 24-hour localStorage cache with Zod integrity checks
- Automatic dev-mode bypass (localhost, 127.0.0.1, *.local)
- `<LicenseWatermark>` component for soft enforcement
- `<LicenseGate>` with interleaved validation
- Render-time domain verification
```

### 5.10: Update GitHub Actions workflow + `.npmrc` template (0.5h)

**Files:**
- `.github/workflows/ci.yml` — Add `NPM_TOKEN` for installing restricted packages
- `.npmrc` (repo root) — Add auth token interpolation for registry

CI workflow changes in `.github/workflows/ci.yml`:
- Add `NPM_TOKEN` environment variable to the job level (so it is available for `pnpm install --frozen-lockfile`):
  ```yaml
  jobs:
    build:
      name: Build & Test
      runs-on: ubuntu-latest
      timeout-minutes: 20
      env:
        NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
  ```
- Add a comment above the env block explaining: `# Required for installing restricted @tour-kit/* pro packages`

Root `.npmrc` update — add or ensure this line is present:
```
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```
This file is safe to commit because the token value comes from the environment variable at runtime, not from the file itself.

Also verify `.github/workflows/release.yml` has `NPM_TOKEN` available for both install and publish steps.

### 5.11: Verify npm access and dry-run publish (0.5h)

**Manual verification steps (not automated):**
1. Confirm npm Pro or Org plan is active: `npm whoami` + `npm profile get`
2. Verify restricted access on pro packages: `npm access get status @tour-kit/license` returns `restricted`
3. Dry-run publish from `packages/license/`: `npm publish --dry-run --access restricted`
4. Confirm the tarball contains expected files (`dist/`, `README.md`, `CHANGELOG.md`, `LICENSE.md`)
5. Verify no source files (`src/`) leak into the published package (check `files` field in `package.json`)

---

## 4. Deliverables

```
packages/license/
├── CLAUDE.md                                    # 5.1 — AI assistant guidance
└── README.md                                    # 5.2 — Updated Polar-based API docs

apps/docs/content/docs/
├── licensing/
│   └── index.mdx                                # 5.3 — Setup guide + FAQ
└── meta.json                                    # 5.3 — Updated nav (add licensing)

examples/next-app/
├── src/app/providers.tsx                         # 5.4 — LicenseProvider added
├── .env.example                                 # 5.4 — NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY
└── package.json                                 # 5.4 — @tour-kit/license dep

examples/vite-app/
├── src/App.tsx                                  # 5.5 — LicenseProvider added
├── .env.example                                 # 5.5 — VITE_TOUR_KIT_LICENSE_KEY
└── package.json                                 # 5.5 — @tour-kit/license dep

.changeset/<generated>.md                        # 5.9 — Breaking change changeset

.github/workflows/ci.yml                         # 5.10 — NPM_TOKEN for restricted installs
.npmrc                                           # 5.10 — Auth token interpolation
```

---

## 5. Exit Criteria

| # | Criterion | Verified By |
|---|-----------|-------------|
| EC-1 | `packages/license/CLAUDE.md` exists with Polar integration guidance, key files, domain concepts, testing patterns | File exists and covers all sections from 5.1 |
| EC-2 | `packages/license/README.md` documents Polar-based API with zero JWT/jose references | `grep -r "jose\|JWT\|publicKey" packages/license/README.md` returns nothing |
| EC-3 | `apps/docs/content/docs/licensing/index.mdx` covers installation, `TOUR_KIT_LICENSE_KEY` env var, `<LicenseProvider>` config, `<LicenseGate>` + watermark behavior, CI/CD `NPM_TOKEN` setup, FAQ | File exists with all 10 sections from 5.3 |
| EC-4 | Licensing page appears in docs site navigation | `meta.json` includes `licensing`, `pnpm --filter docs build` succeeds |
| EC-5 | Next.js example has `LicenseProvider` in providers, `.env.example` with `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY` | Files updated, `pnpm --filter next-app build` succeeds |
| EC-6 | Vite example has `LicenseProvider` in App, `.env.example` with `VITE_TOUR_KIT_LICENSE_KEY` | Files updated, `pnpm --filter vite-app build` succeeds |
| EC-7 | `pnpm build` passes with zero type errors across all packages | Build log shows success for every package |
| EC-8 | `@tour-kit/license` test coverage > 80% | `pnpm --filter=@tour-kit/license test:coverage` output shows >80% |
| EC-9 | `@tour-kit/license` < 3KB gzipped | Build output size check on `dist/index.js` |
| EC-10 | Free packages (`core`, `react`, `hints`) bundle sizes unchanged | Build output compared to pre-licensing baseline |
| EC-11 | Free packages have zero imports from `@tour-kit/license` | `grep -r "@tour-kit/license" packages/core packages/react packages/hints` returns nothing |
| EC-12 | Changeset exists documenting `major` bump for license, `patch` for 7 pro packages | `.changeset/*.md` file with correct frontmatter |
| EC-13 | CI workflow includes `NPM_TOKEN` for restricted package installs | `.github/workflows/ci.yml` references `secrets.NPM_TOKEN` |
| EC-14 | `.npmrc` contains `//registry.npmjs.org/:_authToken=${NPM_TOKEN}` | File exists with correct line |
| EC-15 | `npm publish --dry-run` succeeds for `@tour-kit/license` | Manual verification log |

---

## 6. Execution Prompt

You are implementing **Licence Phase 5 — Documentation, Examples & Hardening** for the Tour Kit licensing system. This phase writes user-facing docs, updates example apps, and runs final quality checks. There is no new runtime logic — this is documentation, configuration, and verification only.

### Prior Phase Context

**Phase 0** validated Polar.sh sandbox: `POST /v1/customer-portal/license-keys/validate` returns `status: 'granted'` for valid keys. Activation consumes exactly 1 slot (5 max per key). Deactivation frees a slot. p95 validation latency < 500ms. Decision: proceed.

**Phase 1** built the core SDK in `packages/license/src/lib/`:
- `polar-client.ts` — `validateKey()`, `activateKey()`, `deactivateKey()` using raw `fetch()` against Polar customer portal API (`/v1/customer-portal/license-keys/validate` and `/activate`). No SDK dependency, no auth required.
- `cache.ts` — `readCache()`, `writeCache()`, `clearCache()` with 24h TTL. Domain-scoped localStorage keys (`tourkit-license-{domain}`). Zod integrity validation on every read — corrupted/tampered entries are cleared and force re-validation.
- `domain.ts` — `getCurrentDomain()` reads `window.location.hostname`. `isDevEnvironment()` detects localhost, 127.0.0.1, `*.local`. `validateDomainAtRender()` compares runtime hostname against stored activation label and logs mismatches (soft enforcement).
- `schemas.ts` — Zod schemas for Polar API responses (`PolarValidateResponseSchema`, `PolarActivateResponseSchema`) and cache shape (`LicenseCacheSchema`).
- `types/index.ts` — `LicenseState` (`'loading' | 'valid' | 'invalid' | 'expired' | 'revoked'`), `LicenseCache`, `LicenseError`, `PolarValidateResponse`, `PolarActivateResponse`.
- `headless.ts` — Re-exports all types + lib functions without any React dependency.
- `jose` dependency removed from `package.json`. All JWT code deleted.

**Phase 2** built the React layer in `packages/license/src/`:
- `context/license-context.ts` — `LicenseProvider` component. Props: `organizationId` (string, required), `licenseKey` (string), `children`. Validates on mount, caches result, provides `LicenseState` via React context. Dev-mode bypass: on localhost/127.0.0.1/*.local, skips activation and returns `{ valid: true, tier: 'pro' }`.
- `components/license-gate.tsx` — `<LicenseGate require="pro">` with interleaved validation. License state provides a render key consumed inside the component tree — removing the license check breaks rendering (not a simple boolean wrapper).
- `components/license-watermark.tsx` — `<LicenseWatermark>` renders semi-transparent "UNLICENSED" overlay with inline styles, high z-index, `pointer-events: none`. Resists basic CSS overrides (follows AG Grid/MUI X pattern).
- `components/license-warning.tsx` — `<LicenseWarning>` logs dev-mode console warning when license is invalid.
- `hooks/use-license.ts` — `useLicense()` context consumer. Throws if used outside `<LicenseProvider>`.
- `hooks/use-is-pro.ts` — `useIsPro()` returns `true` when license tier is `'pro'`, `false` otherwise.
- `tsup.config.ts` — Dual entry points: `index.ts` (React + headless) and `headless.ts` (types + functions, no React).
- Bundle verified < 3KB gzipped.

**Phase 3** integrated license checks into all 7 pro packages:
- Each pro package (`adoption`, `ai`, `analytics`, `announcements`, `checklists`, `media`, `scheduling`) has `@tour-kit/license` as `optionalPeerDependency` in its `package.json`.
- Shared `useLicenseCheck()` pattern: try-catch dynamic import, returns `{ valid: true }` if license package is not installed (zero impact on free-tier users who never install `@tour-kit/license`).
- Without a license: components render normally but show inline `<LicenseWatermark>` overlay + console warning. No crash, no blank screen, full functionality preserved.
- With a valid license: normal rendering, no watermark, no warning.
- Free packages (`core`, `react`, `hints`) confirmed to have zero imports from `@tour-kit/license`.

**Phase 4** built:
- Webhook handler at `apps/docs/app/api/webhooks/polar/route.ts` using `@polar-sh/nextjs` `Webhooks()` wrapper (or `@polar-sh/sdk/webhooks` `validateEvent()`). Handles `benefit_grant.created`, `benefit_grant.updated`, `benefit_grant.revoked`. Returns HTTP 202. Idempotency via in-memory `webhook-id` dedup Map (10-min TTL). Timestamp tolerance: rejects webhooks > 5 min old with 403.
- `POLAR_WEBHOOK_SECRET` added to `.env.example`.
- Pricing page at `apps/docs/app/pricing/page.tsx` with Free vs Pro comparison and Polar checkout link.

### Per-File Guidance

**`packages/license/CLAUDE.md`:**
Follow the format established by `packages/core/CLAUDE.md`. Include these sections: Package Purpose, Key Files (with one-line descriptions), Domain Concepts, API Surface (headless + React), Testing Patterns, Common Pitfalls. Target 60-80 lines. Do not duplicate the README — focus on implementation-level guidance for AI assistants modifying the code.

**`packages/license/README.md`:**
Standard npm README format. Start with `# @tour-kit/license` and a one-line description. Code examples must be copy-pasteable TypeScript/TSX. Include both React usage (`<LicenseProvider>` + `<LicenseGate>`) and headless usage (`import { validateLicenseKey } from '@tour-kit/license/headless'`). Link to full docs at `https://tourkit.dev/docs/licensing`. Prop tables use markdown table format. No JWT/jose references anywhere.

**`apps/docs/content/docs/licensing/index.mdx`:**
Fumadocs MDX conventions:
- Frontmatter: `title: 'Licensing'`, `description: 'Set up Tour Kit Pro licensing...'`
- Use `import { Callout } from 'fumadocs-ui/components/callout'` for important notes
- Use `import { Tab, Tabs } from 'fumadocs-ui/components/tabs'` for framework-specific code samples (Next.js tab vs Vite tab)
- Code blocks use ` ```tsx ` fencing
- Internal links use relative paths (Fumadocs handles routing)
- Add `"---Licensing---"` separator and `"licensing"` to `apps/docs/content/docs/meta.json` `pages` array — insert after `"scheduling"` and before `"---Resources---"`

**`examples/next-app/src/app/providers.tsx`:**
- Import `LicenseProvider` from `@tour-kit/license`
- Wrap it around the existing `<AiChatProvider>` in the `Providers` component so all pro packages below it are covered:
  ```tsx
  export function Providers({ children }: { children: React.ReactNode }) {
    return (
      <LicenseProvider
        organizationId="your-polar-org-id" // TODO: replace with your Polar organization ID
        licenseKey={process.env.NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY ?? ''}
      >
        <AiChatProvider config={...}>
          <AnalyticsProvider config={analyticsConfig}>
            <ProvidersInner>{children}</ProvidersInner>
          </AnalyticsProvider>
        </AiChatProvider>
      </LicenseProvider>
    )
  }
  ```
- Add `"@tour-kit/license": "workspace:*"` to `examples/next-app/package.json` dependencies

**`examples/next-app/.env.example`:**
```
# Tour Kit Pro license key (get yours at https://tourkit.dev/pricing)
NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY=
```

**`examples/vite-app/src/App.tsx`:**
- Same `<LicenseProvider>` wrapping pattern
- Use `import.meta.env.VITE_TOUR_KIT_LICENSE_KEY` for the license key value
- Add `"@tour-kit/license": "workspace:*"` to `examples/vite-app/package.json` dependencies

**`examples/vite-app/.env.example`:**
```
# Tour Kit Pro license key (get yours at https://tourkit.dev/pricing)
VITE_TOUR_KIT_LICENSE_KEY=
```

**Changeset (`.changeset/<name>.md`):**
Create the file manually with the exact frontmatter format Changesets expects. Package names must be quoted strings. The `major` bump is for `@tour-kit/license` only. All 7 other pro packages get `patch` (they added license check integration in Phase 3). Free packages (`core`, `react`, `hints`) are NOT included — they have no changes.

**`.github/workflows/ci.yml`:**
Current workflow at `.github/workflows/ci.yml` runs `pnpm install --frozen-lockfile`. After Phase 3, the lockfile includes `@tour-kit/license` as a peer dep of pro packages. In CI, `pnpm install` needs npm auth to resolve restricted packages. Add at the job level:
```yaml
jobs:
  build:
    name: Build & Test
    runs-on: ubuntu-latest
    timeout-minutes: 20
    env:
      # Required for installing restricted @tour-kit/* pro packages
      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**`.npmrc` (repo root):**
The current `.npmrc` may not exist or may only have pnpm config. Add or ensure this line exists:
```
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```
When `NPM_TOKEN` is unset (local dev without pro packages), this resolves to an empty string and npm/pnpm silently ignores it for public packages. When set in CI or by a pro user, it authenticates for restricted package installs.

### Execution Order

1. **Parallel batch 1:** Write CLAUDE.md (5.1), README.md (5.2), docs MDX + meta.json (5.3), changeset (5.9), CI config + .npmrc (5.10)
2. **Parallel batch 2:** Update Next.js example (5.4), update Vite example (5.5)
3. **Sequential:** Full build (5.6) then test suite (5.7) then bundle size check (5.8)
4. **Manual:** npm verification (5.11) — requires npm account access

Tasks in batch 1 have no interdependencies. Tasks in batch 2 depend on knowing the `<LicenseProvider>` API (established in Phase 2, documented in batch 1). Tasks 5.6-5.8 must run sequentially because tests depend on a successful build, and bundle size check depends on build output.

### Constraints

- Do NOT write any new runtime code — this phase is documentation, configuration, and verification only
- Do NOT modify any files in `packages/license/src/` — Phase 1-2 deliverables are complete
- Do NOT modify any pro package provider files — Phase 3 integration is complete
- All Fumadocs imports must use the exact module paths (`fumadocs-ui/components/callout`, `fumadocs-ui/components/tabs`)
- The `.npmrc` auth line must use `${NPM_TOKEN}` (curly braces required for pnpm interpolation)
- The changeset must NOT include free packages (`core`, `react`, `hints`) — they are unchanged
- Example app `package.json` deps use `"workspace:*"` while in the monorepo (Phase 6 will change these to published versions when moving to the private repo)

---

## Readiness Check

Before starting Phase 5, verify these prerequisites:

| # | Check | How to Verify | Status |
|---|-------|---------------|--------|
| R-1 | Phase 0 status is `proceed` | `cat plan/phase-0-status.json` shows `"decision": "proceed"` | [ ] |
| R-2 | Phase 1 core SDK exists | `ls packages/license/src/lib/polar-client.ts packages/license/src/lib/cache.ts packages/license/src/lib/domain.ts packages/license/src/lib/schemas.ts` — all present | [ ] |
| R-3 | Phase 2 React layer exists | `ls packages/license/src/context/license-context.ts packages/license/src/components/license-gate.tsx packages/license/src/components/license-watermark.tsx` — all present | [ ] |
| R-4 | Phase 3 integration complete | `grep -r "useLicenseCheck" packages/adoption packages/analytics packages/announcements packages/checklists packages/media packages/scheduling packages/ai` — returns matches in all 7 | [ ] |
| R-5 | Phase 4 webhook handler exists | `ls apps/docs/app/api/webhooks/polar/route.ts` — present | [ ] |
| R-6 | `jose` dependency removed | `grep "jose" packages/license/package.json` — returns nothing | [ ] |
| R-7 | Free packages have no license imports | `grep -r "@tour-kit/license" packages/core packages/react packages/hints` — returns nothing | [ ] |
| R-8 | npm account has Pro or Org plan | `npm whoami` succeeds, account has paid plan for restricted publishing | [ ] |
| R-9 | Monorepo builds | `pnpm build` succeeds before starting docs work | [ ] |

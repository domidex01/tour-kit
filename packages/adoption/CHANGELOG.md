# @tour-kit/adoption

## 0.0.8

### Patch Changes

- 04520d7: Phase 1 of the code-health pass: hoist `cn()` into `@tour-kit/core` and minify `@tour-kit/adoption`'s build.

  **`@tour-kit/core`** — new public export `cn(...inputs: ClassValue[]): string` (re-exported from the package root). Composes `clsx` + `tailwind-merge`, byte-compatible with the eight prior duplicates. `clsx` and `tailwind-merge` are now declared `dependencies` of `@tour-kit/core` and listed as tsup externals so they remain peer-resolved.

  **`@tour-kit/ai`** — `@tour-kit/core` is no longer an optional peer; it is now a required workspace dependency. Apps that installed `@tour-kit/ai` without `@tour-kit/core` will need to add it (or rely on the auto-install from this dependency).

  **`@tour-kit/media`** — adds `@tour-kit/core` as a workspace dependency (was previously absent; cn was sourced from a local copy).

  **All consumer packages** — switched to `import { cn } from '@tour-kit/core'`. No public API changes for consumers. The 8 duplicate `cn()` implementations (7 × `lib/utils.ts` + `checklists/components/cn.ts`) have been removed.

  **`@tour-kit/adoption`** — `tsup.config.ts` flips `minify: true` (matching the other 11 configs). The bundled `dist/index.js` shrinks from 50,131 → 25,758 raw bytes (-49%) and 10,334 → 7,831 gzipped bytes (-24%). The `'use client'` directive is now prepended in `onSuccess` so it survives minification.

- Updated dependencies [04520d7]
  - @tour-kit/core@0.6.0
  - @tour-kit/analytics@0.1.7

## 0.0.7

### Patch Changes

- Updated dependencies [c03e87d]
- Updated dependencies [78dc120]
  - @tour-kit/core@0.5.1
  - @tour-kit/analytics@0.1.6

## 0.0.6

### Patch Changes

- Updated dependencies [65ee7f9]
  - @tour-kit/core@0.5.0
  - @tour-kit/analytics@0.1.5

## 0.0.5

### Patch Changes

- a7a0840: chore: publish Pro packages as public on npm

  Flip `publishConfig.access` from `restricted` to `public`. Pro-tier gating stays at runtime via `@tour-kit/license` + Polar.sh keys (watermark + console warning on unlicensed use), matching the documented "no hard block" licensing model. No code or API changes.

- Updated dependencies [a7a0840]
  - @tour-kit/analytics@0.1.4
  - @tour-kit/license@1.0.2

## 0.0.4

### Patch Changes

- 940847a: chore: update GitHub owner from `DomiDex` to `domidex01` in package metadata

  Updates `repository.url`, `homepage`, `bugs.url`, and LICENSE copyright to reflect the new GitHub account. No runtime or API changes — existing installs and imports are unaffected.

- Updated dependencies [940847a]
  - @tour-kit/analytics@0.1.3
  - @tour-kit/core@0.4.2
  - @tour-kit/license@1.0.1

## 0.0.3

### Patch Changes

- 3fce450: Replace JWT-based licensing with Polar.sh license key validation

  BREAKING CHANGES:

  - Removed `publicKey` prop from `<LicenseProvider>` (JWT verification removed)
  - Added required `organizationId` prop to `<LicenseProvider>`
  - License key format changed from JWT to Polar format (`TOURKIT-*` prefix)
  - Removed `jose` dependency

  New features:

  - Polar.sh license key validation and activation (up to 5 domains)
  - 24-hour localStorage cache with Zod integrity checks
  - Automatic dev-mode bypass (localhost, 127.0.0.1, \*.local)
  - `<LicenseWatermark>` component for soft enforcement
  - `<LicenseGate>` with interleaved validation
  - Render-time domain verification

- Updated dependencies [3fce450]
  - @tour-kit/license@1.0.0
  - @tour-kit/analytics@0.1.2

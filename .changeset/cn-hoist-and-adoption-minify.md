---
'@tour-kit/core': minor
'@tour-kit/react': minor
'@tour-kit/hints': minor
'@tour-kit/adoption': patch
'@tour-kit/ai': patch
'@tour-kit/media': patch
'@tour-kit/checklists': patch
'@tour-kit/announcements': patch
'@tour-kit/surveys': patch
---

Phase 1 of the code-health pass: hoist `cn()` into `@tour-kit/core` and minify `@tour-kit/adoption`'s build.

**`@tour-kit/core`** — new public export `cn(...inputs: ClassValue[]): string` (re-exported from the package root). Composes `clsx` + `tailwind-merge`, byte-compatible with the eight prior duplicates. `clsx` and `tailwind-merge` are now declared `dependencies` of `@tour-kit/core` and listed as tsup externals so they remain peer-resolved.

**`@tour-kit/ai`** — `@tour-kit/core` is no longer an optional peer; it is now a required workspace dependency. Apps that installed `@tour-kit/ai` without `@tour-kit/core` will need to add it (or rely on the auto-install from this dependency).

**`@tour-kit/media`** — adds `@tour-kit/core` as a workspace dependency (was previously absent; cn was sourced from a local copy).

**All consumer packages** — switched to `import { cn } from '@tour-kit/core'`. No public API changes for consumers. The 8 duplicate `cn()` implementations (7 × `lib/utils.ts` + `checklists/components/cn.ts`) have been removed.

**`@tour-kit/adoption`** — `tsup.config.ts` flips `minify: true` (matching the other 11 configs). The bundled `dist/index.js` shrinks from 50,131 → 25,758 raw bytes (-49%) and 10,334 → 7,831 gzipped bytes (-24%). The `'use client'` directive is now prepended in `onSuccess` so it survives minification.

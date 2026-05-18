# Phase 7 — Announcements Sonner Pipe + Spotlight Design

**Duration:** Days 35–40 (~10–12 hours)
**Depends on:** Phase 0 task 0.5 — Sonner peer-optional decision signed off in `tasks/v2-package-polish/phase-0-validation.md` (`sonner` listed as `peer-optional + runtime feature-detect`; no hard dep added to `@tour-kit/announcements`)
**Blocks:** Nothing direct (no later phase reads from Sonner adapter or the redesigned Spotlight; Phase 11 inline-survey-in-Spotlight is independent because it consumes Spotlight's existing children API which is unchanged)
**Risk Level:** HIGH — adding a `sonner` peer-optional adapter must not break consumers without it installed (bundle, runtime, or types); the Spotlight visual redesign is a breaking visual change to a component already shipped in v3.0 of `@tour-kit/announcements` and may regress consumer themes that rely on the radial-gradient cutout.
**Stack:** react

---

## Objective

Two improvements to `@tour-kit/announcements` that close concrete demo-wiring pain in `examples/dashboard-next/`:

1. **`variant="toast"` routes through `sonner.toast()`** when `sonner` is available in the consumer's node_modules, via a new peer-optional subpath entry `@tour-kit/announcements/adapters/sonner`. When `sonner` is **not** installed, the existing `<AnnouncementToast>` portal renders unchanged — no hard dep is added, no bytes of `sonner` ship in the main `@tour-kit/announcements` bundle. This lets consumers that already adopted Sonner stop maintaining two parallel notification stacks (their app's Sonner toasts + tour-kit's portal toasts).
2. **`<AnnouncementSpotlight>` cutout redesign** — replace today's soft radial-gradient cutout (low-contrast on light backgrounds) with an **inset stroke** + a **directional arrow** that points from the cutout toward the floating content. The new design passes WCAG 2.1 AA contrast on white, off-white, and light-gray backgrounds. A `strokeColor='auto' | string` prop lets consumers override; `'auto'` picks white on dark and primary on light via `prefers-color-scheme`. A `variant="legacy-spotlight"` opt-out keeps the old radial-gradient available for one minor cycle so theme regressions can be staged. Reduced-motion follows the existing three-tier defense.

Both changes ship as one PR; types stay backwards-compatible (the toast adapter is opt-in via subpath import, the spotlight prop additions are optional).

## What Success Looks Like

1. **Sonner-installed routing works:** With `sonner` listed in a test fixture's `package.json` and a `<Toaster />` rendered, calling `useAnnouncements().show("toast-id")` (where the config is `{ variant: "toast" }`) and the consumer has wired `sonnerAdapter` via the provider's `toastAdapter` prop, results in a single Sonner-rendered toast (no second portal element). Verified by `pnpm --filter @tour-kit/announcements test -- --run sonner-adapter` exiting 0 with a test that mounts both `<AnnouncementsProvider toastAdapter={sonnerAdapter}>` + `<Toaster />`, dispatches `show()`, and asserts exactly one element with `[data-sonner-toast]` and zero with `[data-tk-toast-portal]`.
2. **No-Sonner fallback works:** With `sonner` absent from node_modules (simulated via a Vitest `vi.mock('sonner', () => { throw new Error('Module not found') })`), `useAnnouncements().show("toast-id")` renders the existing `<AnnouncementToast>` portal. Verified by a separate test file that mocks the missing module and asserts `[data-tk-toast-portal]` is in the DOM.
3. **Zero Sonner bytes in main bundle:** `pnpm --filter @tour-kit/announcements build` emits `dist/index.js` (the main entry); `grep -c "sonner" dist/index.js` returns `0`. The adapter's bytes live only in `dist/adapters/sonner.js`, which is loaded only when a consumer imports `@tour-kit/announcements/adapters/sonner`. Verified by a CI script `scripts/check-no-sonner-in-main.sh` that runs after build.
4. **Spotlight WCAG AA contrast passes on white:** A new `axe-core`-based contrast test asserts the inset stroke + content panel border combination yields ≥4.5:1 contrast ratio on `#ffffff`, `#f5f5f5`, and `#e5e7eb` backgrounds (text contrast already covered by `<AnnouncementContent>` tests; this test specifically targets the *cutout boundary visibility*).
5. **Spotlight visual regression:** Playwright snapshot of the redesigned spotlight (cutout with 2px inset stroke + directional arrow rotated per placement) matches the approved baseline; the legacy variant snapshot still matches the v3.0 baseline (regression catch).
6. **Migration note in CHANGELOG:** `packages/announcements/CHANGELOG.md` gains an entry describing the new subpath, the `toastAdapter` provider prop, the `variant="legacy-spotlight"` opt-out, and how to migrate.
7. **All existing announcement tests still pass:** `pnpm --filter @tour-kit/announcements test -- --run` exits 0 with no regressions on the existing 30+ test files (license-integration, audience, frequency, spotlight-overlay, etc.).
8. **Typecheck clean:** `pnpm --filter @tour-kit/announcements typecheck` exits 0; the new `ToastAdapter` interface and `SpotlightProps` additions compile.

---

## What Failure Looks Like (and what to do)

- **Sonner adapter import fails at build time because the consumer doesn't have `sonner` installed** → the adapter is exported under a **subpath** (`@tour-kit/announcements/adapters/sonner`) that the main `@tour-kit/announcements` package **never imports**. Consumers explicitly opt in. The subpath entry is built via `tsup` with `external: ['sonner']` so the bundler treats `sonner` as an external import resolved at the consumer site; if the consumer hasn't installed it, the error is a clear `Cannot find module 'sonner'` at *their* build, not ours. Fallback: document the opt-in pattern in CHANGELOG and the new docs page.
- **Runtime feature-detect of Sonner fails on partial install (e.g., `sonner` is in node_modules but `toast` export is undefined because of a major-version mismatch)** → wrap the `await import('sonner')` in a try/catch. On failure, the adapter returns `null`; the provider then falls back to the existing portal toast and emits a one-time `console.warn` in dev (`process.env.NODE_ENV !== 'production'`): `[tour-kit] sonnerAdapter could not load sonner — falling back to portal toast.`
- **New spotlight inset stroke fails WCAG AA on off-white backgrounds (e.g., `#fafafa` page bg + `#e5e7eb` stroke = 1.4:1 contrast)** → ship `strokeColor` prop override (`'auto' | string`). `'auto'` resolves via `window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : 'hsl(var(--primary))'` (CSS var driven by the consumer's theme). Document the regression scenario in the docs page and CHANGELOG. If a known-bad bg shows up in user tests, ship a follow-up patch that snaps `strokeColor` to a high-contrast neutral (`#1f2937` on light bg) and exposes that as the new `'auto'` resolver.
- **Existing consumer's spotlight theme breaks because the radial-gradient is gone** → keep the previous radial-gradient available behind `variant="legacy-spotlight"` for one minor cycle. CHANGELOG flags this as "visual breaking change in v4.0; opt-out via `<AnnouncementSpotlight variant='legacy-spotlight'>` until v4.1." The legacy branch is a 1-line conditional in the same component, not a parallel file, so the legacy path stays maintained.
- **The subpath `./adapters/sonner` doesn't tree-shake — bundlers pull it into the main entry anyway** → confirm by `grep "from 'sonner'" dist/index.js` exits with non-zero return (no match). The main barrel (`packages/announcements/src/index.ts`) must contain **zero** references to `'./adapters/sonner'`. Verify with a unit test of the index file content: `expect(readFileSync('src/index.ts', 'utf8')).not.toMatch(/adapters\/sonner/)`.
- **The peer-optional Sonner version drifts and we pin too tightly** → use `peerDependencies: { "sonner": ">=1.0.0 <3" }` with `peerDependenciesMeta.sonner.optional = true`. Feature-detect against `'toast' in mod` and `'Toaster' in mod` rather than version-checking. Document the supported range in CHANGELOG.
- **Playwright snapshot diffs flake on font rendering across CI runners** → run snapshots with `fonts: { disable: true }` and an explicit `viewport: { width: 1024, height: 768 }`. Use `toMatchSnapshot({ maxDiffPixelRatio: 0.01 })` rather than zero-pixel-perfect to absorb sub-pixel anti-aliasing noise across Chromium versions.
- **Toast adapter routes Sonner toasts but loses our analytics events (`announcement_shown`)** → the adapter is a *transport*, not a replacement for the provider's side-effect tail. The provider's `show()` continues to emit analytics + persist state + call `config.onShow`; only the *render* is swapped via `toastAdapter.render(config, state, handlers)`. Pinned-array test asserts every analytic event still fires when the adapter is active.

---

## Architecture / Key Design Decisions

```
                ┌─────────────────────────────────────────────────────────────┐
                │  @tour-kit/announcements (main entry)                        │
                │                                                              │
                │  AnnouncementsProvider                                       │
                │    new prop: toastAdapter?: ToastAdapter                     │
                │                                                              │
                │    show(id) → dispatch SHOW + side-effects unchanged         │
                │                                                              │
                │    For variant === "toast":                                  │
                │      if (toastAdapter) → toastAdapter.render(...)            │
                │      else → existing <AnnouncementToast> portal              │
                └─────────────────────────────────────────────────────────────┘
                                          ▲                ▲
                                          │                │ (consumer opts in)
                                          │                │
                          ┌───────────────┘                └─────────────┐
                          │                                              │
                ┌─────────────────────┐               ┌─────────────────────────────────────┐
                │ Default portal path │               │ @tour-kit/announcements/adapters/    │
                │ (zero new bytes;    │               │     sonner                           │
                │ existing behavior)  │               │                                      │
                └─────────────────────┘               │ export const sonnerAdapter:          │
                                                      │   ToastAdapter = { id, render, dismiss}│
                                                      │                                      │
                                                      │ Uses dynamic import('sonner') wrapped│
                                                      │ in try/catch. Calls toast.custom()   │
                                                      │ with our existing <AnnouncementContent>│
                                                      │ + <AnnouncementActions> tree.        │
                                                      └─────────────────────────────────────┘
                                                                          │
                                                                          ▼
                                                              ┌──────────────────┐
                                                              │  sonner (peer-   │
                                                              │  optional)       │
                                                              └──────────────────┘

                ┌─────────────────────────────────────────────────────────────┐
                │  <AnnouncementSpotlight> (redesigned)                        │
                │                                                              │
                │  New default:                                                │
                │    cutout = `box-shadow: inset 0 0 0 2px <strokeColor>`     │
                │             on a positioned/sized div over the target,      │
                │             clipped by the radial-gradient overlay below    │
                │    arrow  = small SVG, rotated 0/90/180/270 deg per placement│
                │                                                              │
                │  New props:                                                  │
                │    variant?:    'default' | 'legacy-spotlight'              │
                │    strokeColor?: 'auto' | string                            │
                │                                                              │
                │  'auto' resolver:                                            │
                │    prefers-color-scheme: dark  → '#ffffff'                  │
                │    prefers-color-scheme: light → 'hsl(var(--primary))'      │
                │                                                              │
                │  Reduced-motion: existing `motion-safe:` prefix on the cva  │
                │    variants applies to the new stroke + arrow transitions  │
                │    automatically. No new keyframes added.                   │
                └─────────────────────────────────────────────────────────────┘
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| `ToastAdapter` (public contract for the subpath) | `interface` exported from `@tour-kit/announcements` main | Consumers pass an adapter through `<AnnouncementsProvider toastAdapter={...}>`; needs to be referenceable from the main package's types without forcing sonner |
| `sonnerAdapter` | `const` matching `ToastAdapter`, exported from the subpath only | Lives behind `@tour-kit/announcements/adapters/sonner`; main never imports |
| `SpotlightVariant` (new prop) | union literal `'default' \| 'legacy-spotlight'` | Closed set; default is `'default'`; legacy is the opt-out for one minor |
| `StrokeColor` | union `'auto' \| string` | `'auto'` resolves at runtime via `matchMedia`; user-supplied strings pass through |
| Bypass policy (Phase 1) | n/a | This phase doesn't touch `show()` gates. `forceShow` (Phase 1) routes through the same adapter swap because adapter-or-portal is decided in the render path, not the gate path. |

**Critical rules for this phase:**

- **Main package must never import the Sonner adapter.** `packages/announcements/src/index.ts` and `packages/announcements/src/context/announcements-provider.tsx` may reference the `ToastAdapter` *interface* but must not import any value from `./adapters/sonner`. A grep test enforces this.
- **`peerDependenciesMeta.sonner.optional = true`** added to `packages/announcements/package.json`. Range: `"sonner": ">=1.0.0 <3"` (sonner 2.x is current; sonner 1.x is also supported because the imperative API is stable across that range).
- **Dynamic import in the adapter, not at module top.** The adapter file imports `sonner` via `await import('sonner').catch(() => null)` inside `render`. This keeps the adapter file itself loadable even if sonner is missing (the consumer would see a runtime warn + fallback rather than a hard import error at bundler resolution time).
- **Subpath exports configured via `package.json` exports map + tsup `entry` config.** Both must be updated atomically — main entry, headless, tailwind, changelog, and the **new** `./adapters/sonner` entry. `tsup.config.ts` gets a new entry pointing at `src/adapters/sonner.ts`.
- **Spotlight legacy variant is a 1-line branch, not a parallel file.** Inside `announcement-spotlight.tsx`, branch on `variant === 'legacy-spotlight'` to choose between the new inset-stroke render and the existing radial-gradient render. Keeps maintenance cost minimal.
- **`strokeColor='auto'` resolves at render via `useSyncExternalStore(subscribePrefersColorScheme, getPrefersColorScheme, () => 'light')`** — SSR-safe (`getServerSnapshot` returns `'light'` so the SSR HTML is deterministic).
- **No new animations.** The redesigned spotlight reuses the existing `motion-safe:` cva variants. The arrow is a static SVG positioned via Floating UI's `arrow` middleware (already a dep via `@floating-ui/react`); no keyframe additions needed. Three-tier reduced-motion defense from CLAUDE.md already covered.
- **No `<Toaster />` is rendered by tour-kit.** The consumer is responsible for mounting `<Toaster />` in their app shell (already a Sonner convention). The adapter detects its absence in dev (`document.querySelector('[data-sonner-toaster]')`) and warns once: `[tour-kit] sonnerAdapter requires <Toaster /> to be rendered in your app. See https://sonner.emilkowal.ski/getting-started.`

---

## Tasks

### Task 7.1 — Sonner adapter at peer-optional subpath (4–5 h)

**Depends on:** Phase 0 task 0.5 (Sonner peer-optional decision signed off)

Build `packages/announcements/src/adapters/sonner.ts` — a peer-optional adapter that, when imported by a consumer, exposes a `ToastAdapter` value the provider can call instead of rendering the portal toast.

```ts
// Confirmed via Context7 (2026-05-15) — Library: sonner 2.0.7
// Key API: toast(node, options), toast.custom((id) => ReactNode), toast.dismiss(id?), <Toaster /> required in tree
// ESM: ships dual ESM/CJS (no "type": "module"), but main exports are tree-shakeable
// Peer deps: react ^18 || ^19 (already a peer of @tour-kit/announcements; nothing new to declare)

// packages/announcements/src/adapters/sonner.ts
'use client'

import * as React from 'react'
import type { ToastAdapter, ToastAdapterRenderArgs } from '../types/toast-adapter'

let warned = false
function warnOnce(msg: string) {
  if (warned || process.env.NODE_ENV === 'production') return
  warned = true
  console.warn(`[tour-kit] ${msg}`)
}

/**
 * Peer-optional Sonner adapter. Consumer must:
 *   1. `pnpm add sonner` (>=1.0.0 <3)
 *   2. Render <Toaster /> from 'sonner' once in the app shell
 *   3. Pass this adapter to <AnnouncementsProvider toastAdapter={sonnerAdapter}>
 *
 * If sonner is not installed, `render` silently returns null and the provider
 * falls back to the existing portal toast. A one-time dev warning is emitted.
 */
export const sonnerAdapter: ToastAdapter = {
  id: 'sonner',

  async render({ id, content, options, onDismiss }: ToastAdapterRenderArgs) {
    let sonner: typeof import('sonner') | null = null
    try {
      sonner = await import('sonner')
    } catch {
      warnOnce('sonnerAdapter could not load sonner — falling back to portal toast.')
      return null
    }
    if (!sonner || typeof sonner.toast !== 'function') {
      warnOnce('sonnerAdapter loaded sonner but toast() is undefined — falling back to portal toast.')
      return null
    }

    if (typeof document !== 'undefined' && !document.querySelector('[data-sonner-toaster]')) {
      warnOnce('sonnerAdapter requires <Toaster /> to be rendered in your app. See https://sonner.emilkowal.ski/getting-started.')
    }

    // toast.custom — pattern confirmed from Context7
    const toastId = sonner.toast.custom(() => content, {
      duration: options?.duration ?? 5000,
      position: options?.position ?? 'bottom-right',
      onDismiss,
    })

    return {
      id: String(toastId),
      dismiss: () => sonner?.toast.dismiss(toastId),
    }
  },

  dismiss(toastHandle) {
    toastHandle?.dismiss()
  },
}
```

Add the `ToastAdapter` interface to `packages/announcements/src/types/toast-adapter.ts` (new file):

```ts
import type * as React from 'react'

export interface ToastAdapterRenderArgs {
  id: string                              // announcement id (not the toast handle id)
  content: React.ReactNode                // pre-rendered <AnnouncementContent /> + actions
  options?: {
    duration?: number
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  }
  onDismiss?: () => void
}

export interface ToastAdapterHandle {
  id: string
  dismiss: () => void
}

export interface ToastAdapter {
  /** Stable id for the adapter ('sonner', 'react-hot-toast', etc.) */
  id: string
  /** Render the toast via the adapter. Return null to indicate fallback should be used. */
  render: (args: ToastAdapterRenderArgs) => Promise<ToastAdapterHandle | null>
  /** Optional explicit dismissal hook */
  dismiss?: (handle: ToastAdapterHandle) => void
}
```

Update `AnnouncementsProvider` to accept `toastAdapter?: ToastAdapter` and route `variant === 'toast'` renders through it when present (see Task 7.4 file guidance). The adapter integration lives in a new tiny render-routing module `packages/announcements/src/lib/toast-router.tsx` that wraps the existing `<AnnouncementToast>` portal as the default and conditionally invokes the adapter.

Update `packages/announcements/package.json` — exports map + peer deps:

```json
"exports": {
  ".": { /* unchanged */ },
  "./headless": { /* unchanged */ },
  "./tailwind": { /* unchanged */ },
  "./changelog": { /* unchanged */ },
  "./adapters/sonner": {
    "import": {
      "types": "./dist/adapters/sonner.d.ts",
      "default": "./dist/adapters/sonner.js"
    },
    "require": {
      "types": "./dist/adapters/sonner.d.cts",
      "default": "./dist/adapters/sonner.cjs"
    }
  },
  "./styles/variables.css": "./src/styles/variables.css",
  "./styles.css": "./dist/styles/variables.css",
  "./package.json": "./package.json"
},

"peerDependencies": {
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0",
  "tailwindcss": "^3.4.0 || ^4.0.0",
  "@mui/base": "^5.0.0-beta.0",
  "@tour-kit/scheduling": "workspace:*",
  "sonner": ">=1.0.0 <3"
},
"peerDependenciesMeta": {
  "tailwindcss": { "optional": true },
  "@mui/base": { "optional": true },
  "@tour-kit/scheduling": { "optional": true },
  "sonner": { "optional": true }
}
```

Update `packages/announcements/tsup.config.ts` to add `src/adapters/sonner.ts` as a new entry and ensure `external: ['sonner', /* existing externals */]` so the consumer-side resolves sonner.

**Sanity check:** `pnpm --filter @tour-kit/announcements build && grep -c "sonner" packages/announcements/dist/index.js` returns `0`; `ls packages/announcements/dist/adapters/sonner.js` shows the new bundled adapter; `pnpm --filter @tour-kit/announcements typecheck` exits 0.

---

### Task 7.2 — Spotlight redesign: inset stroke + directional arrow (3–4 h)

**Depends on:** —

Replace the radial-gradient cutout in `packages/announcements/src/components/announcement-spotlight.tsx` with an inset-stroke cutout + directional arrow. Keep the legacy radial-gradient available via `variant="legacy-spotlight"`.

Inset-stroke + arrow CSS pattern (the cutout is a fixed-positioned div sized to the target rect, with `box-shadow: inset 0 0 0 2px <strokeColor>`; the surrounding overlay still uses a radial-gradient to dim everything but the cutout region):

```tsx
// packages/announcements/src/components/announcement-spotlight.tsx (relevant excerpt)

const strokeColor = resolveStrokeColor(strokeColorProp /* 'auto' | string */)

const cutoutStyle: React.CSSProperties = {
  position: 'fixed',
  top: targetRect.top - padding,
  left: targetRect.left - padding,
  width: targetRect.width + padding * 2,
  height: targetRect.height + padding * 2,
  borderRadius: 8,
  pointerEvents: 'none',
  // The visible boundary — 2px inset stroke that survives any background:
  boxShadow: `inset 0 0 0 2px ${strokeColor}`,
  zIndex: 41,
}

// Arrow points FROM cutout TOWARD content. Rotation matches Floating UI placement.
// Uses @floating-ui/react `arrow` middleware to get the exact x/y offset.
const arrowRotation = {
  top: 180,
  right: 270,
  bottom: 0,
  left: 90,
}[effectivePlacement as 'top' | 'right' | 'bottom' | 'left'] ?? 0

const arrowStyle: React.CSSProperties = {
  position: 'absolute',
  left: arrowX,
  top: arrowY,
  transform: `rotate(${arrowRotation}deg)`,
  color: strokeColor,
  // No animation — pointer is decorative; aria-hidden handles SR semantics.
}
```

`resolveStrokeColor` is a tiny helper in the same file:

```ts
function resolveStrokeColor(value: 'auto' | string | undefined): string {
  if (typeof value === 'string' && value !== 'auto') return value
  if (typeof window === 'undefined') return 'hsl(var(--primary))'  // SSR-safe default
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? '#ffffff' : 'hsl(var(--primary))'
}
```

Wrap the resolver in `useSyncExternalStore` so the component re-renders if the user flips their OS theme mid-session (SSR-safe `getServerSnapshot` returns `'light'`).

Add the arrow SVG inline (no new dep). Use `@floating-ui/react`'s `arrow` middleware (already imported for `useFloating`) to position it; pass `arrowRef` into `middleware: [offset, flip, shift, arrow({ element: arrowRef })]`.

Add `variant` + `strokeColor` props to `AnnouncementSpotlightProps`:

```ts
export interface AnnouncementSpotlightProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof spotlightContentVariants> {
  // ... existing props
  /** Visual variant. Default 'default' uses inset stroke + arrow.
   *  'legacy-spotlight' keeps the v3.0 radial-gradient (deprecated, kept one minor for migration). */
  variant?: 'default' | 'legacy-spotlight'
  /** Cutout stroke color. 'auto' resolves to white on dark / primary on light. */
  strokeColor?: 'auto' | string
}
```

Branch the render: `if (variant === 'legacy-spotlight') { /* existing radial-gradient render */ } else { /* new inset-stroke + arrow render */ }`. Both branches share the same `<AnnouncementContent>` + `<AnnouncementActions>` + `<AnnouncementClose>` content tree — only the cutout/overlay/arrow differs.

`spotlightOverlayVariants` cva: extend with an `arrow` orientation variant (no new keyframes; reuses `motion-safe:` slide variants for the content panel).

The arrow element receives `aria-hidden="true"`.

**Sanity check:** `pnpm --filter @tour-kit/announcements typecheck` exits 0; run the existing `__tests__/components/announcement-spotlight-overlay.test.tsx` and confirm it still passes; manual story in `examples/dashboard-next` shows the new stroke + arrow on a known target.

---

### Task 7.3 — Contrast + visual regression tests (2 h)

**Depends on:** 7.2

Add two new test files:

1. **`packages/announcements/src/__tests__/spotlight.contrast.test.tsx`** — uses `vitest-axe` (already a devDep) to render `<AnnouncementSpotlight strokeColor="auto" />` on three page backgrounds (`#ffffff`, `#f5f5f5`, `#e5e7eb`) and assert zero color-contrast violations from axe. Also assert the inset stroke renders with a computed `box-shadow` that includes `inset` and `2px` (string match against `getComputedStyle(cutout).boxShadow`).

2. **`packages/announcements/__tests__/sonner-adapter.test.ts`** (peer-optional smoke) — two cases:
   - **Sonner present:** mock `sonner` via `vi.mock('sonner', () => ({ toast: { custom: vi.fn(() => 'mock-id'), dismiss: vi.fn() } }))`. Call `sonnerAdapter.render({ id: 'a', content: <div>x</div> })` and assert `sonner.toast.custom` was called with the React node, and the returned handle has `id: 'mock-id'`.
   - **Sonner absent:** mock `sonner` to throw on import (`vi.mock('sonner', () => { throw new Error('not installed') })`). Call `sonnerAdapter.render(...)` and assert the returned handle is `null` and that exactly one `console.warn` was emitted.

Also add a tiny CI guard script `packages/announcements/scripts/check-no-sonner-in-main.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
if grep -q "sonner" dist/index.js dist/index.cjs; then
  echo "FAIL: sonner reference leaked into the main entry. Adapter must live only in dist/adapters/sonner.*"
  exit 1
fi
echo "OK: zero sonner bytes in main entry"
```

Wire the script into the `build` script: `"build": "tsup && bash scripts/check-no-sonner-in-main.sh"`.

Optional (if time) — Playwright visual regression snapshot for both variants at `examples/dashboard-next` (cutout-stroke screenshot + legacy radial-gradient screenshot). If the existing Playwright setup is not in this package, skip — the contrast + computed-style tests cover the headless requirement.

**Sanity check:** `pnpm --filter @tour-kit/announcements test -- --run sonner-adapter` exits 0 with 2 passing cases; `pnpm --filter @tour-kit/announcements test -- --run spotlight.contrast` exits 0 with 3 passing background cases; `pnpm --filter @tour-kit/announcements build` exits 0 (script returns "OK: zero sonner bytes...").

---

### Task 7.4 — CHANGELOG + provider wiring (1 h)

**Depends on:** 7.1, 7.2

Update `packages/announcements/src/context/announcements-provider.tsx`:

- Add `toastAdapter?: ToastAdapter` to `AnnouncementsProviderProps`.
- In the render path for `variant === 'toast'`, if `toastAdapter` is provided, render via the adapter; otherwise render the existing portal toast. The simplest wiring is a small wrapper component `<ToastRouter>` that lives at the bottom of the provider tree and reads `toastAdapter` + the active toast announcements from state, calling `adapter.render(...)` on each.
- Include `toastAdapter` in the `value` memoization so consumers can re-read it via `useAnnouncements()` if they need to introspect.

Update `packages/announcements/src/index.ts`:

- Re-export `ToastAdapter`, `ToastAdapterRenderArgs`, `ToastAdapterHandle` from `./types/toast-adapter`.
- **Do not** re-export anything from `./adapters/sonner`. The subpath is the only entry.

Update `packages/announcements/CHANGELOG.md`:

```md
## 4.0.0

### Changed (visual breaking)

- `<AnnouncementSpotlight>` cutout now uses a 2px inset stroke + directional arrow
  instead of a soft radial gradient. The new design passes WCAG 2.1 AA contrast on
  white, off-white, and light-gray backgrounds. Set `strokeColor="auto"` (default)
  to follow `prefers-color-scheme`, or pass any CSS color string to override.

  **Migration:** if you rely on the legacy radial-gradient look, opt in via
  `<AnnouncementSpotlight variant="legacy-spotlight">`. The legacy variant is
  kept for one minor cycle (until v4.1) and will be removed in v5.

### Added

- `@tour-kit/announcements/adapters/sonner` — peer-optional Sonner adapter for
  `variant="toast"`. Pass it to the provider:

      import { AnnouncementsProvider } from '@tour-kit/announcements'
      import { sonnerAdapter } from '@tour-kit/announcements/adapters/sonner'
      import { Toaster } from 'sonner'

      <AnnouncementsProvider toastAdapter={sonnerAdapter}>
        {children}
        <Toaster />
      </AnnouncementsProvider>

  Requires `sonner` >=1.0.0 <3 installed. Without `sonner` installed, the existing
  portal toast renders unchanged — no bytes of Sonner ship in the main bundle.

- `<AnnouncementSpotlight>` props: `variant`, `strokeColor`. See migration note above.
- `ToastAdapter` interface for building custom toast transports (e.g., react-hot-toast).
```

**Sanity check:** `pnpm --filter @tour-kit/announcements typecheck` exits 0; the CHANGELOG entry is grep-able (`grep -c "adapters/sonner" packages/announcements/CHANGELOG.md` returns ≥1).

---

## Deliverables

```
packages/announcements/
├── src/
│   ├── adapters/
│   │   └── sonner.ts                          # NEW — peer-optional Sonner adapter; dynamic import + warn-once + fallback null
│   ├── types/
│   │   └── toast-adapter.ts                   # NEW — ToastAdapter, ToastAdapterRenderArgs, ToastAdapterHandle interfaces
│   ├── lib/
│   │   └── toast-router.tsx                   # NEW — wraps adapter-vs-portal render decision; small internal component
│   ├── components/
│   │   └── announcement-spotlight.tsx         # UPDATED — inset stroke + arrow default render; legacy-spotlight branch kept for one minor
│   ├── components/ui/
│   │   └── spotlight-variants.ts              # UPDATED — variant prop extended; existing motion-safe: classes preserved
│   ├── context/
│   │   └── announcements-provider.tsx         # UPDATED — accepts toastAdapter?: ToastAdapter; mounts <ToastRouter>
│   ├── types/
│   │   └── context.ts                         # UPDATED — AnnouncementsProviderProps gains toastAdapter
│   ├── index.ts                               # UPDATED — re-exports ToastAdapter types only; NEVER re-exports sonnerAdapter
│   └── __tests__/
│       ├── sonner-adapter.test.ts             # NEW — peer-optional smoke (sonner present + absent)
│       └── spotlight.contrast.test.tsx        # NEW — vitest-axe contrast scan on 3 page bgs + computed-style assertion
├── scripts/
│   └── check-no-sonner-in-main.sh             # NEW — grep guard for build step
├── package.json                               # UPDATED — exports map adds ./adapters/sonner; peerDeps + meta add sonner optional
├── tsup.config.ts                             # UPDATED — adds src/adapters/sonner.ts entry; external: ['sonner']
└── CHANGELOG.md                               # UPDATED — v4.0.0 migration note covering both changes
```

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/announcements typecheck` exits 0
- [ ] `pnpm --filter @tour-kit/announcements build` exits 0 AND `scripts/check-no-sonner-in-main.sh` echoes "OK: zero sonner bytes in main entry"
- [ ] `grep -c "sonner" packages/announcements/dist/index.js packages/announcements/dist/index.cjs` returns `0` for both files (independent verification of the build guard)
- [ ] `ls packages/announcements/dist/adapters/sonner.js packages/announcements/dist/adapters/sonner.cjs` returns both files (subpath entry built)
- [ ] `pnpm --filter @tour-kit/announcements test -- --run sonner-adapter` exits 0 with ≥2 passing cases (sonner-present routes through `toast.custom`; sonner-absent returns null + warns once)
- [ ] `pnpm --filter @tour-kit/announcements test -- --run spotlight.contrast` exits 0 with ≥3 passing background cases (`#ffffff`, `#f5f5f5`, `#e5e7eb`) — zero axe color-contrast violations on each
- [ ] All existing announcement tests still pass: `pnpm --filter @tour-kit/announcements test -- --run` exits 0 with zero regressions
- [ ] `packages/announcements/CHANGELOG.md` contains a v4.0.0 entry mentioning `adapters/sonner`, `variant="legacy-spotlight"`, and `strokeColor` (`grep -E "adapters/sonner|legacy-spotlight|strokeColor" packages/announcements/CHANGELOG.md` returns ≥3 matches)
- [ ] `packages/announcements/package.json` exports map contains `./adapters/sonner` entry; `peerDependencies.sonner` exists with `peerDependenciesMeta.sonner.optional = true`
- [ ] `packages/announcements/src/index.ts` re-exports `ToastAdapter` interface but does NOT import from `./adapters/sonner` — verified by `grep -c "adapters/sonner" packages/announcements/src/index.ts` returning `0`
- [ ] Spotlight legacy variant snapshot still matches v3.0 baseline (regression catch): rendering `<AnnouncementSpotlight variant="legacy-spotlight">` produces a `data-state="open"` element with a radial-gradient `background` style (asserted via `getComputedStyle`)

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to implement this phase:

---
You are building Phase 7 of Tour Kit v2 Package Polish — Announcements Sonner Pipe + Spotlight Design.

### What This Project Is
Tour Kit is a pnpm monorepo of 12 packages providing headless React product-tour primitives (core, react, hints) plus pro packages (announcements, surveys, checklists, adoption, analytics, ai, scheduling, license, media). v2 closes demo-wiring gaps reported while building `examples/dashboard-next/`. Every phase ships as one PR with backwards-compatible types. Stack: TypeScript strict mode, React 18+, tsup, Turborepo, Vitest, vitest-axe, pnpm. The `@tour-kit/announcements` package is currently at v3.0.0; this phase brings it to v4.0.0 with a visual breaking change (Spotlight redesign) and one peer-optional addition (Sonner adapter).

### Established in Prior Phases
- **Phase 0 task 0.5 (peer-dep audit)** signed off in `tasks/v2-package-polish/phase-0-validation.md`: `sonner` is listed as `peer-optional + runtime feature-detect`. Feature-detect snippet: `typeof window !== 'undefined' && 'toast' in (await import('sonner').catch(() => ({})))`. No hard dep is added to `@tour-kit/announcements`.
- **Phase 1** (in progress / merged before Phase 7) added `forceShow(id)` to `AnnouncementsProvider`. Phase 7 does NOT touch `show()` or `forceShow()` gates; the toast adapter swaps the *render* path only. Side-effect tail (analytics, persist, callbacks) is preserved untouched.
- Existing announcements source: `packages/announcements/src/`. Spotlight component at `packages/announcements/src/components/announcement-spotlight.tsx` uses `@floating-ui/react` for placement and currently renders a radial-gradient cutout via inline `style.background` on a `<button>`/`<div>` overlay (see lines 119–144 of that file). Toast at `packages/announcements/src/components/announcement-toast.tsx` uses `createPortal` to `document.body` and renders inline (no Sonner integration today).
- Existing `package.json` exports map covers `.`, `./headless`, `./tailwind`, `./changelog`, `./styles/variables.css`, `./styles.css`, `./package.json`. peerDependencies include `react`, `react-dom`, `tailwindcss`, `@mui/base`, `@tour-kit/scheduling`. peerDependenciesMeta marks tailwindcss, @mui/base, and @tour-kit/scheduling optional.

### Your Goal for This Phase
1. Add a peer-optional Sonner adapter under the new subpath `@tour-kit/announcements/adapters/sonner`. Consumers opt in by importing from that subpath and passing the adapter to `<AnnouncementsProvider toastAdapter={...}>`. The main package never imports the adapter — zero bytes of `sonner` may appear in `dist/index.js`. When the adapter is invoked but `sonner` is not installed, it returns `null` and emits a one-time dev `console.warn`; the provider then falls back to the existing portal toast.
2. Redesign `<AnnouncementSpotlight>` cutout: replace the soft radial-gradient with a 2px inset-stroke border + a small directional SVG arrow. Add `variant?: 'default' | 'legacy-spotlight'` (legacy keeps the radial-gradient available for one minor cycle) and `strokeColor?: 'auto' | string` (`'auto'` resolves to white on dark / `hsl(var(--primary))` on light via `prefers-color-scheme`). Pass WCAG 2.1 AA contrast on `#ffffff`, `#f5f5f5`, and `#e5e7eb` page backgrounds (verified by `vitest-axe`).
3. Update CHANGELOG.md with the v4.0.0 migration note.

### Data Model Rules (follow exactly)
- **`interface` (exported from main):** `ToastAdapter`, `ToastAdapterRenderArgs`, `ToastAdapterHandle` live in `packages/announcements/src/types/toast-adapter.ts`. Re-exported via the barrel `src/index.ts` so consumers can reference them without pulling the sonner adapter.
- **`const` (exported ONLY from subpath):** `sonnerAdapter: ToastAdapter` lives in `packages/announcements/src/adapters/sonner.ts`. Never re-exported from `src/index.ts`. Verify with grep.
- **Union literal:** `variant?: 'default' | 'legacy-spotlight'` on `AnnouncementSpotlightProps`. Default is `'default'`. Closed set; do not widen.
- **`'auto'` resolver:** `strokeColor='auto'` resolves at render via `useSyncExternalStore(subscribePrefersColorScheme, getPrefersColorScheme, () => 'light')`. SSR-safe `getServerSnapshot` returns `'light'`.
- **No new Zod schemas this phase.** No external validation boundary is crossed.
- **No new keyframes.** Reduced motion is already covered by `motion-safe:` prefixes in the existing `spotlight-variants.ts` cva file; the new arrow is static.
- **Dynamic import in adapter.** Inside `sonnerAdapter.render`, use `await import('sonner').catch(() => null)`. Do NOT import sonner at module top — that would force consumers to install it even when fallback is acceptable.

### Architecture

```
@tour-kit/announcements (main entry — zero sonner bytes)
  src/context/announcements-provider.tsx
    new prop: toastAdapter?: ToastAdapter
    mounts <ToastRouter /> at the bottom of the provider tree
  src/lib/toast-router.tsx
    if (toastAdapter) → toastAdapter.render(...)
    else → existing <AnnouncementToast> portal (unchanged)
  src/types/toast-adapter.ts
    ToastAdapter, ToastAdapterRenderArgs, ToastAdapterHandle (interfaces)
  src/index.ts
    re-exports the interfaces; never imports from src/adapters/sonner

@tour-kit/announcements/adapters/sonner (subpath entry — opt-in)
  src/adapters/sonner.ts
    export const sonnerAdapter: ToastAdapter
    dynamic import('sonner') wrapped in try/catch
    one-time dev warn on fallback or missing <Toaster />

@tour-kit/announcements (Spotlight redesign — same file)
  src/components/announcement-spotlight.tsx
    if (variant === 'legacy-spotlight') → existing radial-gradient render (unchanged)
    else → new cutout (box-shadow: inset 0 0 0 2px <strokeColor>) + directional arrow
  src/components/ui/spotlight-variants.ts
    extends variant prop; preserves motion-safe: classes
```

### Confirmed Library APIs

**Sonner 2.0.7 — confirmed via Context7 2026-05-15:**

```tsx
// Library: sonner 2.0.7
// Install: pnpm add sonner   (peer-optional in this package; consumer installs)
// Package: dual ESM/CJS; peerDeps react ^18 || ^19
// Required: <Toaster /> must be mounted somewhere in the consumer's tree
// Imperative API works ANYWHERE — including outside React components — once Toaster is rendered

import { toast, Toaster } from 'sonner'

// 1. Consumer mounts <Toaster /> once (typically in root layout):
//      <Toaster position="bottom-right" />
//
// 2. toast() — basic message:
toast('Event has been created')

// 3. toast() with options (returns id: string | number for later dismiss):
const id = toast('Saved', { duration: 5000, position: 'top-center' })

// 4. toast.custom() — render arbitrary React node (THIS IS WHAT THE ADAPTER USES):
toast.custom((toastId) => (
  <div className="bg-white shadow-lg rounded-lg p-4">
    <p>New notification</p>
    <button onClick={() => toast.dismiss(toastId)}>Close</button>
  </div>
), { duration: 5000 })

// 5. Dismiss by id, or dismiss all:
toast.dismiss(id)   // specific
toast.dismiss()     // all
```

**`package.json` exports map — subpath pattern (existing entries unchanged; new entry inserted):**

```json
"exports": {
  ".": { /* existing */ },
  "./headless": { /* existing */ },
  "./tailwind": { /* existing */ },
  "./changelog": { /* existing */ },
  "./adapters/sonner": {
    "import": {
      "types": "./dist/adapters/sonner.d.ts",
      "default": "./dist/adapters/sonner.js"
    },
    "require": {
      "types": "./dist/adapters/sonner.d.cts",
      "default": "./dist/adapters/sonner.cjs"
    }
  },
  "./styles/variables.css": "./src/styles/variables.css",
  "./styles.css": "./dist/styles/variables.css",
  "./package.json": "./package.json"
},
"peerDependencies": {
  /* existing entries unchanged */
  "sonner": ">=1.0.0 <3"
},
"peerDependenciesMeta": {
  /* existing entries unchanged */
  "sonner": { "optional": true }
}
```

**`tsup.config.ts` — add new entry + mark sonner as external:**

```ts
// existing config + add:
entry: {
  index: 'src/index.ts',
  headless: 'src/headless.ts',
  'tailwind/index': 'src/tailwind/index.ts',
  'changelog/index': 'src/changelog/index.ts',
  'adapters/sonner': 'src/adapters/sonner.ts',  // NEW
},
external: ['sonner', /* existing externals: react, react-dom, @tour-kit/*, @floating-ui/react, etc. */],
```

**Spotlight inset-stroke + arrow CSS pattern (paste verbatim into Task 7.2 implementation):**

```tsx
// Inside packages/announcements/src/components/announcement-spotlight.tsx
// Render branch when variant !== 'legacy-spotlight':

const strokeColor = useResolvedStrokeColor(strokeColorProp)   // 'auto' | string

const cutoutStyle: React.CSSProperties = {
  position: 'fixed',
  top: targetRect.top - padding,
  left: targetRect.left - padding,
  width: targetRect.width + padding * 2,
  height: targetRect.height + padding * 2,
  borderRadius: 8,
  pointerEvents: 'none',
  boxShadow: `inset 0 0 0 2px ${strokeColor}`,
  zIndex: 41,
}

const arrowRotationByPlacement: Record<'top' | 'right' | 'bottom' | 'left', number> = {
  top: 180, right: 270, bottom: 0, left: 90,
}
const arrowRotation = arrowRotationByPlacement[effectivePlacement as 'top' | 'right' | 'bottom' | 'left'] ?? 0
```

**`strokeColor='auto'` resolver — SSR-safe via useSyncExternalStore:**

```ts
function useResolvedStrokeColor(value: 'auto' | string | undefined): string {
  const prefersDark = React.useSyncExternalStore(
    (cb) => {
      if (typeof window === 'undefined') return () => {}
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => (typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false),
    () => false,  // SSR snapshot — always light
  )
  if (typeof value === 'string' && value !== 'auto') return value
  return prefersDark ? '#ffffff' : 'hsl(var(--primary))'
}
```

### Files to Create / Update

#### `packages/announcements/src/types/toast-adapter.ts` (NEW)
Export `ToastAdapter`, `ToastAdapterRenderArgs`, `ToastAdapterHandle` interfaces exactly as shown in Task 7.1. Types-only file (no React import beyond `import type * as React`). Re-export via `src/index.ts` barrel.

#### `packages/announcements/src/adapters/sonner.ts` (NEW)
Module containing the `sonnerAdapter: ToastAdapter` const. Wrap the dynamic `import('sonner')` in try/catch. Implement the `warned` flag at module scope so the warn fires once per page load. Detect a missing `<Toaster />` by querying `[data-sonner-toaster]` (Sonner sets this attribute on its root). Call `sonner.toast.custom((toastId) => content, { duration, position, onDismiss })` — `toast.custom` is the only Sonner API the adapter touches. On any failure (import failure, missing `toast`, etc.), return `null` so the provider falls back to the portal. Do NOT import any value from sonner at module top — only `await import('sonner')` inside `render`.

#### `packages/announcements/src/lib/toast-router.tsx` (NEW)
Tiny internal component that reads active toast-variant announcements from the provider state and routes them. If `toastAdapter` is non-null, call `await toastAdapter.render(...)` for each active toast announcement (memoize handles by announcement id; call `handle.dismiss()` on unmount/dismiss). Otherwise render the existing `<AnnouncementToast id={...} />` for each. Place at the bottom of the provider's children tree.

#### `packages/announcements/src/context/announcements-provider.tsx` (UPDATED)
Add `toastAdapter?: ToastAdapter` to `AnnouncementsProviderProps`. Pass it through context (or as prop drilling to `<ToastRouter />` — context is fine). Mount `<ToastRouter />` once at the bottom of the provider children. Include `toastAdapter` in the context `value` memoization deps. Do NOT alter `show()` or `forceShow()` — the render path swap happens in `<ToastRouter />`.

#### `packages/announcements/src/types/context.ts` (UPDATED)
Add `toastAdapter?: ToastAdapter` to `AnnouncementsProviderProps`. Import `ToastAdapter` type from `./toast-adapter`.

#### `packages/announcements/src/components/announcement-spotlight.tsx` (UPDATED)
Add `variant?: 'default' | 'legacy-spotlight'` and `strokeColor?: 'auto' | string` props. Branch the cutout/overlay/arrow render:
- `variant === 'legacy-spotlight'` → keep the existing radial-gradient render path (lines 119–144 of the current file) unchanged.
- otherwise (default) → render: (a) the dark backdrop overlay (full-screen, dimmed); (b) the inset-stroke cutout div (box-shadow inset, sized to target rect with padding); (c) a small directional arrow SVG positioned via `@floating-ui/react` `arrow` middleware, rotated per placement.

Both branches share the same `<AnnouncementContent>` / `<AnnouncementActions>` / `<AnnouncementClose>` content. The arrow gets `aria-hidden="true"`. Use `useResolvedStrokeColor` (defined in the same file) for the 'auto' resolution. Add `arrow({ element: arrowRef })` to the `middleware` array of `useFloating`.

#### `packages/announcements/src/components/ui/spotlight-variants.ts` (UPDATED)
Add a `variant` cva slot reflecting `'default' | 'legacy-spotlight'`. Preserve all existing `motion-safe:` classes — those are the three-tier reduced-motion contract per CLAUDE.md and must not be modified.

#### `packages/announcements/src/index.ts` (UPDATED)
Re-export `ToastAdapter`, `ToastAdapterRenderArgs`, `ToastAdapterHandle` from `./types/toast-adapter`. **DO NOT** add any import of `./adapters/sonner` here. Existing exports (provider, hooks, components, types) remain unchanged.

#### `packages/announcements/package.json` (UPDATED)
Bump `version` to `4.0.0`. Add `./adapters/sonner` entry to `exports`. Add `"sonner": ">=1.0.0 <3"` to `peerDependencies`. Add `"sonner": { "optional": true }` to `peerDependenciesMeta`. Do not touch `dependencies`.

#### `packages/announcements/tsup.config.ts` (UPDATED)
Add `'adapters/sonner': 'src/adapters/sonner.ts'` to the `entry` object. Ensure `external` includes `'sonner'` (regex or string). Keep dual ESM/CJS output (existing config).

#### `packages/announcements/scripts/check-no-sonner-in-main.sh` (NEW)
Bash script that greps `dist/index.js` and `dist/index.cjs` for the literal string `sonner`. Exits non-zero if found. Make executable (`chmod +x`). Wire into the `build` npm script: `"build": "tsup && bash scripts/check-no-sonner-in-main.sh"`.

#### `packages/announcements/src/__tests__/sonner-adapter.test.ts` (NEW — peer-optional smoke)
Two test cases:
1. **Sonner present:** use `vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { custom: vi.fn(() => 'mock-id'), dismiss: vi.fn() }) }))`. Import `sonnerAdapter` and call `await sonnerAdapter.render({ id: 'a', content: <div>x</div> })`. Assert `sonner.toast.custom` was called with a function (the render callback) and that the returned handle has `id: 'mock-id'`.
2. **Sonner absent:** `vi.mock('sonner', () => { throw new Error('not installed') })`. Spy `console.warn`. Call `sonnerAdapter.render(...)`. Assert returned value is `null` and `console.warn` was called exactly once with a message containing `'sonner'`.

#### `packages/announcements/src/__tests__/spotlight.contrast.test.tsx` (NEW — WCAG AA)
Three cases — one per background color: `#ffffff`, `#f5f5f5`, `#e5e7eb`. For each:
- Render `<AnnouncementsProvider configs={...}><AnnouncementSpotlight id="s" strokeColor="auto" /></AnnouncementsProvider>` inside a wrapper `<div style={{ background, minHeight: 400 }}>`.
- Run `axe(container)` from `vitest-axe`; assert zero violations of `color-contrast` rule.
- Additionally, query the cutout element and assert `getComputedStyle(cutout).boxShadow` matches `/inset/` and `/2px/`.

Plus a legacy-variant test: `<AnnouncementSpotlight variant="legacy-spotlight">` produces an element with a radial-gradient `background` style (regression catch).

#### `packages/announcements/CHANGELOG.md` (UPDATED)
Add the v4.0.0 entry shown in Task 7.4 verbatim. Two subsections: "Changed (visual breaking)" for the Spotlight redesign with the `variant="legacy-spotlight"` opt-out, and "Added" for the Sonner adapter + new props.

### Success Criteria
- `pnpm --filter @tour-kit/announcements typecheck` exits 0
- `pnpm --filter @tour-kit/announcements build` exits 0 AND the post-build guard prints "OK: zero sonner bytes in main entry"
- `grep -c "sonner" packages/announcements/dist/index.js` returns `0` (independent of the guard)
- `pnpm --filter @tour-kit/announcements test -- --run sonner-adapter` exits 0 with both cases passing (sonner-present + sonner-absent)
- `pnpm --filter @tour-kit/announcements test -- --run spotlight.contrast` exits 0 with three background cases passing
- All existing announcement tests still pass: `pnpm --filter @tour-kit/announcements test -- --run` exits 0
- CHANGELOG.md grep returns ≥3 matches for `adapters/sonner|legacy-spotlight|strokeColor`
- `packages/announcements/src/index.ts` does NOT import `./adapters/sonner` (grep returns 0)

### Expected File Structure at End
```
tasks/v2-package-polish/
├── big-plan.md
├── phase-0.md
├── phase-0-validation.md
├── phase-1.md
├── ...
├── phase-7.md
└── (downstream phase files unchanged)

packages/announcements/
├── src/
│   ├── adapters/
│   │   └── sonner.ts                          # NEW
│   ├── types/
│   │   ├── toast-adapter.ts                   # NEW
│   │   └── context.ts                         # UPDATED — toastAdapter on provider props
│   ├── lib/
│   │   └── toast-router.tsx                   # NEW
│   ├── components/
│   │   ├── announcement-spotlight.tsx         # UPDATED — inset stroke + arrow + legacy branch
│   │   └── ui/spotlight-variants.ts           # UPDATED — variant slot
│   ├── context/
│   │   └── announcements-provider.tsx         # UPDATED — accepts toastAdapter, mounts ToastRouter
│   ├── index.ts                               # UPDATED — re-exports ToastAdapter types only
│   └── __tests__/
│       ├── sonner-adapter.test.ts             # NEW
│       └── spotlight.contrast.test.tsx        # NEW
├── scripts/
│   └── check-no-sonner-in-main.sh             # NEW
├── package.json                               # UPDATED — version 4.0.0, exports, peerDeps
├── tsup.config.ts                             # UPDATED — adapters/sonner entry, external sonner
└── CHANGELOG.md                               # UPDATED — v4.0.0 migration note
```

---

## Readiness Check

- [PASS] All inputs from prior phases listed and available — Phase 0 task 0.5 (Sonner peer-optional decision) is cited and the feature-detect snippet is pasted in the architecture section; Phase 1's `forceShow` is explicitly noted as out-of-scope (Phase 7 swaps render path, not gates); existing source-of-truth files (`announcement-spotlight.tsx`, `announcement-toast.tsx`, `announcements-provider.tsx`, `package.json`) are cited with line ranges where relevant.
- [PASS] Every sub-task has a clear, testable completion condition — each of 7.1–7.4 has a `Sanity check` one-liner combining typecheck + build + targeted test, plus a `grep -c` guard for the no-Sonner-bytes contract.
- [PASS] Execution prompt is self-contained — confirmed Sonner snippet pasted verbatim from Context7; package.json exports map shown verbatim; tsup entry diff shown; inset-stroke CSS + 'auto' resolver pasted; per-file guidance has one paragraph per file in the deliverables tree; success criteria are observable shell commands.
- [PASS] Exit criteria map 1:1 to deliverables — every NEW/UPDATED file in the deliverables tree appears in at least one exit checkbox (typecheck, build, test, grep guard, or CHANGELOG grep); the no-bytes-leak check has both a script-based and an independent `grep` check listed; the legacy-variant regression catch is its own checkbox.
- [PASS] Heavy external deps have a fake/stub strategy noted — Sonner is mocked via `vi.mock('sonner', ...)` in both present and absent test variants; the present mock shows the exact `toast.custom` shape; the absent mock throws and asserts fallback + warn behavior. No 100MB+ deps in this phase. `axe-core` runs in-process via `vitest-axe` (existing devDep, no setup needed).
- [PASS] New libraries have a confirmed snippet from Context7 in the execution prompt — `sonner 2.0.7` confirmed via Context7 2026-05-15 (`/emilkowalski/sonner`); `toast`, `toast.custom`, `toast.dismiss`, `<Toaster />` mount requirement, and React 18/19 peer-range all verified. Snippet pasted verbatim under "Confirmed Library APIs."

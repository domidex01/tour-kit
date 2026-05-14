# Phase 8 - License Soft Gate + Try-Before-Buy Watermark

**Duration:** ~8-11 hours (2026-05-13 to 2026-05-15)
**Depends on:** Nothing in Sprint 1. This is additive to the commercial licensing surface.
**Blocks:** Nothing in Phases 0-7a. Unblocks conversion experiments measured by `pricing_buy_clicked` and the new `unlicensed_badge_clicked` event.
**Risk Level:** MEDIUM. Touches the shared license package, 8 Pro package gate call sites, package tests, docs copy, and public licensing guidance.
**Stack:** TypeScript, React, Vitest, Testing Library, jsdom.

> **Sprint fit:** This phase is thematically separate from the TS-first DX sprint. Keep it as an inline commercial insertion and do not let it pull scope from Phases 0-7a.

---

## Repo Analysis Snapshot

The current repo state on 2026-05-14 changes the plan in a few important ways:

| Finding | Impact |
| --- | --- |
| `packages/license/src/components/license-gate.tsx` currently calls `useLicense()`, which throws outside `<LicenseProvider>`. | The no-provider evaluation case will crash unless `LicenseGate` reads `LicenseContext` directly. This is the phase blocker. |
| `LicenseGateProps.require` is currently required in `packages/license/src/types/index.ts`. | Internal swaps must use `<LicenseGate require="pro">` unless this phase also makes the prop optional. Default plan: keep the public type unchanged and pass `require="pro"`. |
| `LicenseProvider` already wraps children in `LicenseRenderContext.Provider` at `packages/license/src/context/license-context.tsx`. | Remove the redundant provider inside `LicenseGate`; do not create a second source of render-key truth. |
| `packages/license/src/components/license-watermark.tsx` is still a full-screen rotated `UNLICENSED` overlay. | Replace the component, and replace the existing watermark tests rather than adding a second suite with conflicting expectations. |
| `packages/license/src/__tests__/setup.ts` assumes `document.body` exists after every test. | The planned node-environment import smoke will fail unless setup guards `typeof document !== 'undefined'`. |
| Pro package tests mock only `ProGate` in more files than the 8 `license-integration.test.tsx` files. | Update incidental mocks too, especially `packages/surveys/src/__tests__/*` and `packages/checklists/src/__tests__/url-visit-completion.test.tsx`. |
| `tourkit.dev` still appears in `LicenseWarning`, `ProGate`, `ProGate` tests, and every Pro `LICENSE.md`. | Align the commercial URL in the same changeset, but keep broad blog/codemod fixture URL migration out of this phase. |
| `LicenseRenderContext` is exported but no Pro package consumes it (verified by repo grep). | Removing the inner `<LicenseRenderContext.Provider>` from `LicenseGate` is safe. The outer wrap in `LicenseProvider` (line 126) continues to expose `state.renderKey` for any future anti-bypass consumer. No Pro package will silently render empty when `renderKey` is `undefined`. |
| `LicenseWarning` console output is gated on `process.env.NODE_ENV !== 'production'`, not on hostname. | "Dev-only warning" throughout this phase means `NODE_ENV`, not `isDevEnvironment()`. Production previews are silent by design. |
| `apps/docs/content/docs/api/license.mdx` documents `<LicenseGate>` and `<ProGate>` semantics. | Update prose to reflect soft-gate-by-default for internal Pro use; keep `<ProGate>` documented as the hard-placeholder export. |

---

## Objective

Replace the hard `<ProGate>` usage inside Tour Kit's Pro packages with the existing soft `<LicenseGate>` contract so Pro packages render fully functional UI on preview, staging, and production domains without a valid license. Unlicensed non-localhost renders show a single small Tour Kit badge linking to checkout.

This removes the current top-of-funnel dead end: a developer can install a Pro package, push a preview deploy, and show the real UI to teammates before buying.

---

## Success Criteria

1. **Behavior matrix is verified in browser and unit tests:**

   | Host | `<LicenseProvider>` mounted? | License key | Rendered |
   | --- | --- | --- | --- |
   | `localhost` / `127.0.0.1` / `*.local` | any | any | Children only, no badge |
   | Any other host | yes | valid Polar key | Children only, no badge |
   | Any other host | yes | invalid / expired / revoked | Children + one badge + dev-only warning |
   | Any other host | yes | error + fresh cache | Children only, no badge |
   | Any other host | no | n/a | Children + one badge + dev-only warning; no throw |

2. `pnpm --filter @tour-kit/license test` passes after replacing the existing watermark assertions and extending `license-gate.test.tsx`.

3. All 8 Pro package tests pass after the gate swap:
   - `@tour-kit/adoption`
   - `@tour-kit/announcements`
   - `@tour-kit/checklists`
   - `@tour-kit/ai`
   - `@tour-kit/surveys`
   - `@tour-kit/scheduling`
   - `@tour-kit/analytics`
   - `@tour-kit/media`

4. `pnpm typecheck` passes across the workspace.

5. A non-localhost preview route with all 8 Pro surfaces mounted shows exactly one badge, no layout shift, no hydration warning, and no blocked app clicks outside the badge link.

6. Pricing FAQ and license package docs match runtime behavior.

7. `packages/license/CLAUDE.md` and `packages/license/README.md` describe the new split:
   - `<LicenseGate>` is the canonical internal soft gate.
   - `<ProGate>` remains exported for downstream hard-gate use, but Pro packages no longer use it internally.

8. Badge clicks emit `unlicensed_badge_clicked` with `placement: 'watermark'` and `hostname`, using `window.gtag` when present and `window.dataLayer.push` as the GTM fallback.

---

## Non-Goals

- Do not refactor `ProGate` to delegate to `LicenseGate`.
- Do not change Polar validation, cache format, or activation limits.
- Do not add anti-tamper MutationObserver logic. A `data-tourkit-watermark` attribute is enough for diagnostics and tests.
- Do not migrate every historical `tourkit.dev` mention in blog content or codemod fixtures.
- Do not add Playwright for the badge. Unit tests plus one manual preview QA pass are enough.
- Do not change pricing.

---

## Architecture

### `LicenseGate`

Rewrite `LicenseGate` to read `LicenseContext` directly. Keep `useLicense()` throwing for consumers that deliberately assert a provider is present.

Default implementation contract:

```tsx
import { useContext } from 'react'
import { LicenseContext } from '../context/license-context'
import { isDevEnvironment } from '../lib/domain'
import type { LicenseGateProps } from '../types'
import { LicenseWarning } from './license-warning'
import { LicenseWatermark } from './license-watermark'

export function LicenseGate({
  require: _require,
  children,
  fallback,
  loading,
}: LicenseGateProps) {
  const context = useContext(LicenseContext)

  // No-provider branch. Provider's internal dev short-circuit cannot help here,
  // so we must check the host directly to keep localhost quiet.
  if (context === null) {
    if (isDevEnvironment()) return <>{children}</>
    return (
      <>
        {children}
        <LicenseWatermark />
        <LicenseWarning />
      </>
    )
  }

  // Provider mounted: dev hosts already resolve to isGated: false inside
  // LicenseProvider.useMemo, so we do not re-check isDevEnvironment() here.
  if (context.isLoading) return <>{loading ?? null}</>
  if (!context.isGated) return <>{children}</>
  if (fallback) return <>{fallback}</>

  return (
    <>
      {children}
      <LicenseWatermark />
      <LicenseWarning />
    </>
  )
}
```

Notes:

- `require` stays in the prop type for API compatibility, even though only `pro` exists today.
- Missing provider intentionally ignores `fallback`; Pro package evaluation installs should never hard-block just because the app has not wired `<LicenseProvider>` yet.
- Licensed render-key context comes from `<LicenseProvider>` (line 126 of `license-context.tsx`), not `LicenseGate`. No Pro package currently consumes `LicenseRenderContext`, so removing the inner wrap has zero runtime impact today.
- On no-provider paths, consumers of `LicenseRenderContext` receive `undefined` (default value), which matches the current gated branch behavior.
- `LicenseWarning` is the same component in both unlicensed branches; it logs once per mount when `NODE_ENV !== 'production'`. With 8 Pro providers gated, 8 mounts ⇒ 8 console warns. **Decision for this phase: accept N warnings** because the message is dev-only and the noise actually helps evaluators wire up `<LicenseProvider>`. Add a once-per-page guard only if the dev-console feedback becomes a complaint.

### `LicenseWatermark`

Replace the full-screen overlay with a client-only portal badge:

| Decision | Choice |
| --- | --- |
| Position | Fixed bottom-right, 16px inset |
| Render target | `document.body` portal created in `useEffect`; import is safe without `window` or `document` |
| Dedup | Module-level singleton store with active instance ownership and ownership transfer on unmount |
| Pointer boundary | Outer wrapper `pointer-events: none`; link `pointer-events: auto` |
| z-index | `2147483647` |
| Copy | `Tour Kit - Unlicensed` plus `Buy license` |
| URL | `https://usertourkit.com/pricing?utm_source=unlicensed_badge&utm_medium=in_app&utm_campaign=watermark` |
| Analytics | `gtag('event', 'unlicensed_badge_clicked', payload)` then `dataLayer.push({ event: ..., ...payload })` fallback |
| Accessibility | Small region with `aria-label="Tour Kit license required"` and an explicit link label |
| Styling | Inline styles only; no Tailwind, CVA, or docs app dependency |

Do not use a simple `mounted` boolean plus ref count. That design loses the badge when the first owner unmounts while later `<LicenseWatermark>` instances remain mounted. Use ownership transfer instead:

```ts
type WatermarkInstance = {
  id: symbol
  setOwner: (isOwner: boolean) => void
}

const instances: WatermarkInstance[] = []
let ownerId: symbol | null = null
let portalRoot: HTMLDivElement | null = null

function electOwner() {
  ownerId = instances[0]?.id ?? null
  for (const instance of instances) {
    instance.setOwner(instance.id === ownerId)
  }
}
```

The mounted owner renders the single portal. If the owner unmounts and other instances remain, the next active instance becomes owner and keeps the badge visible.

**StrictMode safety.** React StrictMode double-invokes effects in dev. Use id-based deduplication so a mount-cleanup-remount cycle does not leak a stale instance entry:

```ts
useEffect(() => {
  const entry: WatermarkInstance = { id: Symbol('watermark'), setOwner }
  instances.push(entry)
  electOwner()
  return () => {
    const i = instances.findIndex((x) => x.id === entry.id)
    if (i !== -1) instances.splice(i, 1)
    electOwner()
  }
}, [])
```

Without `findIndex` on the stable `id`, StrictMode's double-cleanup can remove the wrong instance and leave a zombie owner.

### URL Alignment

Use `usertourkit.com` for Phase 8 commercial links:

- `packages/license/src/components/license-watermark.tsx`
- `packages/license/src/components/license-warning.tsx`
- `packages/license/src/components/pro-gate.tsx`
- `packages/license/src/__tests__/pro-gate.test.tsx`
- `packages/{adoption,announcements,checklists,ai,surveys,scheduling,analytics,media,license}/LICENSE.md`
- `apps/docs/components/landing/pricing.tsx`
- `apps/docs/content/docs/api/license.mdx` (LicenseGate / ProGate / LicenseWatermark sections — replace "anti-bypass mechanism consumed by `<LicenseGate>`" prose and the LicenseWatermark "use as a low-friction notification" hint to match soft-gate-by-default semantics)

Keep `packages/codemods` fixtures and older blog metadata out of this PR unless a separate URL cleanup phase is approved.

---

## Task Breakdown

### 8.1 - Rewrite `LicenseGate` and `LicenseWatermark` (~3h)

Files:

- `packages/license/src/components/license-gate.tsx`
- `packages/license/src/components/license-watermark.tsx`
- `packages/license/src/__tests__/setup.ts`
- Optional local type helper in the watermark file for `window.gtag` and `window.dataLayer`

Work:

- Replace `useLicense()` with `useContext(LicenseContext)`.
- Add `isDevEnvironment()` branch before the no-provider branch.
- Remove the inner `LicenseRenderContext.Provider`.
- Replace the existing overlay watermark with the portal badge.
- Implement singleton ownership transfer and cleanup.
- Add guarded GA/GTM dispatch.
- Guard test setup so node-environment tests do not touch `document`.

### 8.2 - Swap Pro packages from `ProGate` to `LicenseGate` (~1h)

Use `<LicenseGate require="pro">`, not bare `<LicenseGate>`, unless `LicenseGateProps.require` is intentionally made optional in the same patch.

Current call sites:

- `packages/adoption/src/context/adoption-provider.tsx` - provider wrapper at current line ~202
- `packages/announcements/src/context/announcements-provider.tsx` - provider wrapper at current line ~663
- `packages/checklists/src/context/checklist-provider.tsx` - provider wrapper at current line ~586
- `packages/ai/src/context/ai-chat-provider.tsx` - provider wrapper at current line ~200
- `packages/surveys/src/context/surveys-provider.tsx` - provider wrapper at current line ~664
- `packages/scheduling/src/components/schedule-gate.tsx` - wrapper at current line ~9
- `packages/analytics/src/core/context.tsx` - provider wrapper at current line ~45
- `packages/media/src/components/embeds/index.ts` - rename internal HOC `withProGate` to `withLicenseGate` and swap to `LicenseGate require="pro"`

Update imports from `ProGate` to `LicenseGate`.

### 8.3 - Migrate Pro package mocks and tests (~2.5h)

Update the 8 `license-integration.test.tsx` files so the unlicensed case asserts children plus badge, not a hard placeholder.

Also update incidental `@tour-kit/license` mocks that currently expose only `ProGate`:

- `packages/surveys/src/__tests__/survey-popover-focus.test.tsx`
- `packages/surveys/src/__tests__/question-rating.test.tsx`
- `packages/surveys/src/__tests__/question-text.test.tsx`
- `packages/surveys/src/__tests__/display-components.test.tsx`
- `packages/surveys/src/__tests__/storage.test.tsx`
- `packages/surveys/src/__tests__/survey-modal.test.tsx`
- `packages/surveys/src/__tests__/queue-drain.test.tsx`
- `packages/surveys/src/__tests__/question-boolean.test.tsx`
- `packages/surveys/src/__tests__/headless-questions.test.tsx`
- `packages/surveys/src/__tests__/show-guards.test.tsx`
- `packages/surveys/src/__tests__/question-select.test.tsx`
- `packages/checklists/src/__tests__/url-visit-completion.test.tsx`

For simple component tests, mock `LicenseGate` as a passthrough. Keep `ProGate` in the mock only when a test still imports code that uses the hard gate directly.

### 8.4 - Replace and extend license package tests (~1.5-2h)

Replace `packages/license/src/__tests__/license-watermark.test.tsx` expectations that look for full-screen `UNLICENSED` text.

Extend `packages/license/src/__tests__/license-gate.test.tsx`:

- No provider on non-dev host renders children plus badge and does not throw.
- Dev host with no provider renders children only.
- SSR `renderToString(<LicenseGate require="pro">...)` does not touch `document`.
- Valid pro still renders children without badge.
- Invalid/free/expired still render children plus badge when no fallback is provided.
- Fallback still hard-blocks only when a provider is mounted and the state is gated.
- Licensed path still exposes `LicenseRenderContext` from `LicenseProvider`.

Add `packages/license/src/__tests__/license-watermark.import.test.ts` with `@vitest-environment node` after the setup guard is in place.

### 8.5 - Docs and commercial copy (~45m)

Files:

- `apps/docs/components/landing/pricing.tsx`
- `apps/docs/content/docs/api/license.mdx`
- `packages/license/CLAUDE.md`
- `packages/license/README.md`
- Pro package `LICENSE.md` files listed in URL alignment

Copy changes:

- FAQ: no license means Pro packages render fully with a small Tour Kit badge on non-localhost domains.
- FAQ: preview and staging evaluation work before purchase.
- License docs: `LicenseGate` is soft by default for internal Pro package use.
- License docs: `ProGate` remains available for consumers who want a hard placeholder.

### 8.6 - Verification (~1h)

Run:

```sh
pnpm --filter @tour-kit/license test
pnpm --filter @tour-kit/adoption test
pnpm --filter @tour-kit/announcements test
pnpm --filter @tour-kit/checklists test
pnpm --filter @tour-kit/ai test
pnpm --filter @tour-kit/surveys test
pnpm --filter @tour-kit/scheduling test
pnpm --filter @tour-kit/analytics test
pnpm --filter @tour-kit/media test
pnpm typecheck
```

Manual preview QA:

- Deploy or run a non-localhost preview with all 8 Pro surfaces mounted.
- Confirm exactly one `[data-tourkit-watermark]`.
- Confirm the badge link includes UTM params and opens pricing.
- Confirm `gtag` or `dataLayer` receives `unlicensed_badge_clicked`. If the preview has no GA install, stub before clicking:
  ```js
  // In DevTools console, before clicking the badge:
  window.gtag = (...args) => console.log('gtag', args)
  window.dataLayer = []
  ```
  Then click and verify the console log and/or `window.dataLayer[0]`.
- Confirm no hydration warning and no app click blocking outside the badge link.
- Toggle React StrictMode on (if not already) and confirm only one badge node still in the DOM.

### 8.7 - Changeset (~15m)

Create a changeset for:

- `@tour-kit/license`
- `@tour-kit/adoption`
- `@tour-kit/announcements`
- `@tour-kit/checklists`
- `@tour-kit/ai`
- `@tour-kit/surveys`
- `@tour-kit/scheduling`
- `@tour-kit/analytics`
- `@tour-kit/media`

Use minor bumps. Suggested title:

`License gate is now soft by default for Pro packages`

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Missing provider still crashes because `LicenseGate` accidentally calls `useLicense()` | High if unfixed | High | US-10 test renders `LicenseGate` without provider and asserts no throw. |
| Provider swaps fail typecheck because `require` is omitted | Medium | Medium | Use `<LicenseGate require="pro">` unless the prop is deliberately made optional. |
| Badge disappears when the first mounted gate unmounts | Medium | Medium | Use singleton owner transfer, not first-mount-only rendering. Add owner handoff test. |
| Node import smoke fails through test setup, not component code | Medium | Low | Guard `document` in `packages/license/src/__tests__/setup.ts`. |
| Incidental package tests fail because mocks still expose only `ProGate` | High | Low | Search all `vi.mock('@tour-kit/license'...)` and update passthrough mocks. |
| GTM-only sites miss analytics | Medium | Low | `gtag` first, `dataLayer.push` second, no-op third. |
| URL alignment expands into a broad SEO cleanup | Medium | Medium | Limit this phase to commercial runtime/docs URLs. |
| FAQ ships before runtime behavior | Medium | Low | Keep docs and code in the same PR. |
| Watermark singleton state persists across tests in the same file | High | Medium | Always `vi.resetModules()` + dynamic `await import('../components/license-watermark')` in `beforeEach` for watermark tests. Top-level `import` only when each test mounts and fully unmounts. |
| React StrictMode dev double-mount leaks a zombie owner | Medium | Medium | id-based instance entries with `findIndex` cleanup (see Architecture). Add a StrictMode test case. |
| Console warning fires N times when N Pro providers gate unlicensed | Medium | Low | Accepted for this phase — dev-only feedback drives provider adoption. Revisit if engineers complain about console spam. |
| `apps/docs/content/docs/api/license.mdx` keeps stale anti-bypass / hard-placeholder wording | Medium | Low | Update the LicenseGate, ProGate, and LicenseWatermark sections in the same PR. |

---

## Full Test Plan

See [`phase-8-tests.md`](./phase-8-tests.md) for user stories, mock strategy, and concrete test cases.

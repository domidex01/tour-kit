# Phase 8 — License Soft Gate + Try-Before-Buy Watermark

**Duration:** ~7–9 hours (2026-05-13 → 2026-05-15)
**Depends on:** Nothing in Sprint 1 — purely additive to the licensing surface
**Blocks:** Nothing — but unblocks conversion experiments measured by the GA `pricing_buy_clicked` and (new) `unlicensed_badge_clicked` events
**Risk Level:** MEDIUM — touches 8 Pro providers + 8 test files; behavior change visible to every existing Pro install on next release
**Stack:** typescript

> **Note on sprint fit:** This phase is thematically distinct from the rest of Sprint 1 (DX, codemods, AdoptionFunnel). It is added here because it is a high-leverage commercial change blocking real conversion data. Treat as an inline insertion; the Sprint 1 ship date for Phases 0–7a is unaffected.

---

## Objective

Replace the current hard `<ProGate>` block on all Pro packages with the existing soft `<LicenseGate>` so Pro packages render fully functional UI in any environment (localhost, preview, staging, production) without a license — overlaid with a small, non-removable Tour Kit watermark linking to checkout. Mirrors the Clerk dev-keys / Tailwind UI evaluation model.

The goal is to remove the single biggest top-of-funnel friction point in the current commercial flow: today a developer who installs `@tour-kit/announcements`, demos locally, and pushes to a preview URL sees a "Pro license required" placeholder and abandons before reaching the pricing page.

## What Success Looks Like

1. **Behavior matrix verified manually in browser:**

   | Host | License key | Rendered |
   |---|---|---|
   | `localhost` / `127.0.0.1` / `*.local` | any | Children only, no badge |
   | Any other host | valid Polar key | Children only, no badge |
   | Any other host | invalid / missing | Children + corner badge + dev-only console warning |

2. `pnpm --filter @tour-kit/license test` exits 0 — `LicenseWatermark` has a new test covering: portal mount, singleton dedup, link href + UTM, `pointer-events` boundary.

3. `pnpm --filter @tour-kit/<pkg> test` exits 0 for all 8 Pro packages — license-integration tests assert "children render AND watermark renders" (was "placeholder renders") when unlicensed.

4. `pnpm typecheck` exits 0 across the workspace.

5. Visual QA on the docs `/demo` preview deploy (with Pro components on a sandbox route) shows: components fully functional, badge bottom-right, no layout shift.

6. The pricing-page FAQ (`apps/docs/components/landing/pricing.tsx`) for *"What happens if I don't have a license?"* and *"Can I try Pro features before buying?"* now matches code behavior.

7. `packages/license/CLAUDE.md` reflects that `<LicenseGate>` is the canonical internal gate; `<ProGate>` is exported for downstream consumers who want a hard gate but is no longer used by Pro packages.

8. A new GA event `unlicensed_badge_clicked` fires when a user clicks the badge link, with `placement: 'watermark'` and the originating hostname.

## What Failure Looks Like (and what to do)

- **Watermark renders multiple times when several Pro providers mount.** Root cause = singleton dedup broke. Fix the module-level mounted flag; do NOT ship multiple badges. Add a regression test.
- **Watermark renders during SSR and throws on `document` access.** Guard portal with `useEffect` so it only mounts client-side. If SSR-rendered HTML contains the badge node, the rest of the app may shift on hydration — verify with a dev-server reload.
- **`<LicenseRenderContext>` value goes undefined on the unlicensed branch and breaks downstream consumers of `renderKey`.** This is the main contract change vs `<ProGate>`. Audit any in-tree consumer of `LicenseRenderContext`; if found, either provide a sentinel value `"unlicensed"` or treat undefined as "rendered without enforcement".
- **A test mocks `ProGate` and asserts placeholder render.** Migrate the test's expectation. Do NOT keep a mocked `ProGate` for paths that no longer use it.
- **Watermark covers an interactive element via transform-stacking or z-index conflict.** Use a portal to `document.body` and `pointer-events: none` on the wrapper; only the link element gets `pointer-events: auto`.
- **Browser extensions block the badge as an ad.** Acceptable failure mode — extension-blocked users are not commercial decision-makers; do not ship counter-detection.

---

## Architecture / Key Design Decisions

```
packages/license/src/components/
├── license-watermark.tsx     ← redesigned: portal + singleton + corner pill
├── license-warning.tsx       ← unchanged (dev-only console.warn)
└── license-gate.tsx          ← unchanged: already renders children + watermark + warning

packages/{adoption,announcements,checklists,ai,surveys,scheduling,analytics,media}/
└── …/<provider>.tsx          ← swap <ProGate package="…"> → <LicenseGate>
```

### Watermark redesign

| Decision | Choice | Reason |
|---|---|---|
| Position | Fixed bottom-right, 16px from edges | Bottom-right is the Clerk/Vercel convention; least likely to overlap user UI |
| Render target | `createPortal(badge, document.body)` after `useEffect` | Escape transformed/clipping ancestors; SSR-safe |
| Singleton dedup | Module-level `mounted` boolean + render counter ref | Multiple Pro providers each render a `<LicenseGate>` → each tries to render a watermark; only first should win |
| Pointer events | `pointer-events: none` on portal wrapper, `auto` on link | Badge cannot interfere with underlying clicks |
| z-index | `2147483647` (max int) | Match current value; ensures visibility over any modal |
| Visual | Small pill, dark surface, subtle border, system font, ~28px tall | Brand-neutral, won't clash with user theme |
| Copy | `⚡ Tour Kit · Unlicensed` + `Buy →` chip | Names the product, signals state, drives action |
| Link target | `https://usertourkit.com/pricing?utm_source=unlicensed_badge&utm_medium=in_app&utm_campaign=watermark` | GA attribution for badge-driven sales |
| GA event | `sendGAEvent('event', 'unlicensed_badge_clicked', { placement: 'watermark', hostname })` via guarded `window.gtag` lookup | Avoid `@next/third-parties` dep in the library package |
| Accessibility | `role="region"`, `aria-label="Tour Kit license required — buy a license"`, link with explicit text | Screen readers describe it as a banner, not a control |
| Removal hostility | Sets `data-tourkit-watermark="true"` on the badge node; React effect re-mounts if removed via DOM tampering | Casual `document.querySelector('[data-tourkit-watermark]').remove()` is deterred but not impossible — that's fine |

### Data Model Strategy

No new types. Reuse existing `LicenseState` and `LicenseRenderContext`. The unlicensed branch of `<LicenseGate>` will now also render the `LicenseRenderContext.Provider` with `value={undefined}` (matches current behavior; no consumer should rely on a defined render key when status is invalid).

### Singleton dedup mechanics

```ts
// At module scope inside license-watermark.tsx
let watermarkMountedCount = 0
let portalRoot: HTMLDivElement | null = null

export function LicenseWatermark() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    watermarkMountedCount += 1
    if (watermarkMountedCount === 1) {
      portalRoot = document.createElement('div')
      portalRoot.setAttribute('data-tourkit-watermark', 'true')
      document.body.appendChild(portalRoot)
      setMounted(true)
    }
    return () => {
      watermarkMountedCount -= 1
      if (watermarkMountedCount === 0 && portalRoot) {
        portalRoot.remove()
        portalRoot = null
      }
    }
  }, [])
  if (!mounted || !portalRoot) return null
  return createPortal(<Badge />, portalRoot)
}
```

This means: 5 Pro providers each render `<LicenseGate>` → each renders `<LicenseWatermark>` → only the first one's effect creates the DOM node; the rest no-op via the ref-counted counter. On unmount of the last gate, the node is removed.

---

## Task Breakdown

### 8.1 — Redesign `<LicenseWatermark>` (`packages/license/src/components/license-watermark.tsx`) (~2h)
- Replace viewport-spanning rotated text with corner pill component per Architecture spec
- Portal to `document.body` after `useEffect`; SSR-safe
- Module-level ref-counted singleton dedup
- `data-tourkit-watermark` attribute for diagnostic / extension-friendliness
- Inline GA event dispatch on link click via `window.gtag` guarded lookup
- Inline styles only (no Tailwind / cn dependency in license package)

### 8.2 — Flip 8 Pro providers from `<ProGate>` to `<LicenseGate>` (~1h)
One-line swap each:
- `packages/adoption/src/context/adoption-provider.tsx:202` — replace `<ProGate package="@tour-kit/adoption">` with `<LicenseGate>`; drop the `package` prop
- `packages/announcements/src/context/announcements-provider.tsx:663` — same
- `packages/checklists/src/context/checklist-provider.tsx:586` — same
- `packages/ai/src/context/ai-chat-provider.tsx:200` — same
- `packages/surveys/src/context/surveys-provider.tsx:664` — same
- `packages/scheduling/src/components/schedule-gate.tsx:9` — same
- `packages/analytics/src/core/context.tsx:45` — same
- `packages/media/src/components/embeds/index.ts:15` — rename HOC `withProGate` → `withLicenseGate`, swap component reference

Update the corresponding import in each file from `ProGate` to `LicenseGate`.

### 8.3 — Update 8 license-integration tests (~2h)
For each of:
- `packages/adoption/src/__tests__/license-integration.test.tsx`
- `packages/announcements/src/__tests__/license-integration.test.tsx`
- `packages/checklists/src/__tests__/license-integration.test.tsx`
- `packages/ai/src/__tests__/license-integration.test.tsx`
- `packages/surveys/src/__tests__/license-integration.test.tsx`
- `packages/scheduling/src/__tests__/license-integration.test.tsx`
- `packages/analytics/src/__tests__/license-integration.test.tsx`
- `packages/media/src/__tests__/license-integration.test.tsx`

Migrate mock target from `ProGate` to `LicenseGate`. Flip "placeholder renders when unlicensed" assertion to "children render AND watermark renders when unlicensed".

### 8.4 — New watermark unit test (`packages/license/src/__tests__/license-watermark.test.tsx`) (~1h)
- Portal mount: renders into `document.body`, not the test wrapper
- Singleton dedup: mounting twice yields one node in the DOM
- Unmount cleanup: last unmount removes the portal node
- Link target: includes UTM params
- GA event dispatch: `window.gtag` is called with correct args when present, no-op when absent
- `pointer-events` styles: wrapper `none`, link `auto`

### 8.5 — Pricing page FAQ + CLAUDE.md docs (~30min)
- `apps/docs/components/landing/pricing.tsx:447-453` — replace the existing "What happens if I don't have a license?" answer with one that matches the new reality: "Extended packages render fully with a small Tour Kit badge in the corner linking to /pricing. Purchase a license to remove it."
- Same file, "Can I try Pro features before buying?" answer — expand to mention preview/staging environments now work
- `packages/license/CLAUDE.md` — update the "Domain Concepts" section: clarify that `<LicenseGate>` is the canonical internal gate; document `<ProGate>` as exported-for-downstream but no longer used by Pro packages

### 8.6 — Visual QA on a real preview deploy (~1h)
- Build and deploy `apps/docs` to a non-localhost host (e.g., a Dokploy staging slot)
- Confirm: corner badge appears, link navigates with UTM, GA `unlicensed_badge_clicked` fires, no layout shift, no SSR hydration warning
- Test with all 8 Pro providers mounted simultaneously: only one badge renders

### 8.7 — Changeset (~15min)
`pnpm changeset` — minor bump for all 9 Pro packages (incl. `@tour-kit/license`). Title: *"License gate is now soft by default — Pro packages render with a watermark instead of a placeholder when unlicensed"*. Reference Phase 8.

---

## Test Strategy

See [`phase-8-tests.md`](./phase-8-tests.md) for the full test plan and mock strategy.

---

## Out of Scope

- **Hardening against badge removal** beyond the `data-tourkit-watermark` re-mount effect. Anyone determined to bypass can patch the package; this is a commercial gate, not DRM.
- **Polar webhook → GA Measurement Protocol** for full attribution (page → click → purchase). Worth doing next, separate phase.
- **Server-side rendering of the watermark.** Badge is intentionally client-only.
- **A separate "production-only" gate.** Spec stays: localhost bypass, everywhere else show badge. No three-tier (dev/staging/prod) keys yet.
- **Refactoring `<ProGate>` to delegate to `<LicenseGate>`.** Both stay exported; downstream consumers can keep using `<ProGate>` for a hard gate.
- **Pricing changes** ($99 one-time stays the same).

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Pro users on existing release ship with watermark by accident after upgrade | Medium | Low — they already have a key | Changeset clearly labelled as behavior change; minor bump signals semantic shift |
| Singleton dedup race when multiple providers mount in same tick | Low | Medium — duplicate badges | Use ref counter, test concurrent mounts via React 18 Strict Mode double-effect |
| Existing customers misread badge as a downgrade | Low | Medium | Badge only appears when license check fails; valid keys see no change |
| GA event payload PII concern | Low | Low | Hostname only, no path or query — verify in test |
| FAQ change shipped before code change → temporary mismatch in opposite direction | Medium | Low | Ship docs in same PR as code, not separately |

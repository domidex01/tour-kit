---
'@tour-kit/core': patch
'@tour-kit/react': patch
'@tour-kit/hints': patch
'@tour-kit/announcements': patch
'@tour-kit/checklists': patch
'@tour-kit/surveys': patch
'@tour-kit/media': patch
'@tour-kit/adoption': patch
'@tour-kit/ai': patch
'@tour-kit/analytics': patch
'@tour-kit/scheduling': patch
'@tour-kit/license': patch
---

NPM SEO + README accuracy pass. Pure metadata and documentation — no public API changes.

**`package.json` (11 packages, license unchanged)** — descriptions trimmed to ≤150 chars (front-loading the primary keyword phrase before npm search-card truncation) and keyword arrays reordered with high-intent long-tail terms first (`react-onboarding`, `nextjs-onboarding`, `onboarding-wizard`, `onboarding-flow`, `react-product-tour`, `product-demo`, `feature-hint`, `in-app-survey`, etc.). Generic single-word keywords (`react`, `tour`) deprioritized; `*-alternative` keywords retained or expanded.

**READMEs (all 12 packages)** — rewritten on a unified template:

- H1 + keyword-phrase tagline + badge row (npm version, downloads, bundle, types, license)
- "Alternative to" line owning competitor-name SEO surface (`react-joyride-alternative`, `intro-js-alternative`, `shepherd-alternative`, etc.)
- Quick Start that compiles against the actual exports
- Comparison table vs major alternatives
- Complete API reference verified against `src/index.ts` for every package — no fictional or missing exports
- Cross-links to sibling `@tour-kit/*` npm pages
- Docs link migrated from the broken `tour-kit.dev` / `tourkit.dev` to the live `usertourkit.com`
- Correct license disclosure (MIT for free packages / Pro tier for proprietary)

**Accuracy bugs fixed in the rewrite** (none of these compiled before):

- `core` — Quick Start used `createTour({ id, steps })` and `createStep({ id, target, content: { title, description } })`, neither of which match the real signatures (`createTour(steps, options?)`, `createStep(target, content, options?)`). Rewritten using `createNamedTour` / `createNamedStep` for explicit IDs. Hook list was missing 4 public hooks (`useAdvanceOn`, `useBranch`, `useRoutePersistence`, `useUILibrary`) and 11 public utilities; all now documented.
- `checklists` — referenced non-existent `<ChecklistItem>` (real export is `<ChecklistTask>`), `useChecklistItem` (real: `useTask`), `useChecklistProgress` (real: `useChecklistsProgress`), and claimed MIT licensing despite being a Pro package.
- `analytics` — referenced non-existent `createAnalyticsPlugin`, `createSegmentPlugin`, and `useTrack`. Real plugin exports are `consolePlugin`, `posthogPlugin`, `mixpanelPlugin`, `amplitudePlugin`, `googleAnalyticsPlugin`. Real hooks are `useAnalytics` and `useAnalyticsOptional`. License also corrected from MIT to Pro.
- `adoption`, `core`, `analytics`, `checklists`, `license` — broken docs URLs (`tour-kit.dev` / `tourkit.dev`) updated to `usertourkit.com`.
- `media`, `surveys`, `scheduling` — these had no README at all; new ones added.

This is the foundation for the npm-search SEO push: with corrected metadata and accurate, intent-rich READMEs, npm full-text indexing surfaces the packages for `react-onboarding`, `nextjs-onboarding`, `onboarding-wizard`, and competitor-alternative searches that were previously dead air.

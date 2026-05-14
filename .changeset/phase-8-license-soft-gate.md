---
'@tour-kit/license': minor
'@tour-kit/adoption': minor
'@tour-kit/announcements': minor
'@tour-kit/checklists': minor
'@tour-kit/ai': minor
'@tour-kit/surveys': minor
'@tour-kit/scheduling': minor
'@tour-kit/analytics': minor
'@tour-kit/media': minor
---

License gate is now soft by default for Pro packages

`<LicenseGate>` is rewritten as the canonical internal soft gate. It now reads `LicenseContext` directly (no longer throws when used outside `<LicenseProvider>`), always renders `children`, and on non-localhost hosts without a valid license layers a single small `Tour Kit · Unlicensed · Buy license` portal badge plus a dev-only console warning over the top. `fallback` continues to hard-replace children, but only when a provider is mounted and the state is gated.

`<LicenseWatermark>` is replaced. It is no longer a full-screen rotated `UNLICENSED` overlay — it is now a small fixed bottom-right badge rendered into `document.body` via a portal, with `pointer-events: none` on the wrapper and `pointer-events: auto` on the link so it never blocks app clicks. Multiple mounted instances coalesce into a single visible badge via singleton ownership transfer (StrictMode-safe). Badge clicks open pricing with UTM params and emit `unlicensed_badge_clicked` via `window.gtag` or `window.dataLayer`.

All 8 Pro packages (`@tour-kit/adoption`, `@tour-kit/announcements`, `@tour-kit/checklists`, `@tour-kit/ai`, `@tour-kit/surveys`, `@tour-kit/scheduling`, `@tour-kit/analytics`, `@tour-kit/media`) now wrap their provider/components with `<LicenseGate require="pro">` instead of `<ProGate package="...">`. The practical effect: a developer can install a Pro package, push a preview deploy, and demo the real UI to teammates before purchasing — no more hard-placeholder dead end on preview, staging, or production.

`<ProGate>` is **not** removed. It remains exported from `@tour-kit/license` for downstream consumers who want a hard-placeholder gate, but Tour Kit's own Pro packages no longer use it internally.

Commercial URLs aligned to `usertourkit.com` across `LicenseWarning`, `ProGate`, every Pro package `LICENSE.md`, the docs API reference, the pricing FAQ, and the license package README/CLAUDE.md.

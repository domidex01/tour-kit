---
"@tour-kit/license": patch
"@tour-kit/core": patch
---

Dedupe noisy dev-only warnings to once per page/session.

The unlicensed `[TourKit] … without a valid license` warning previously logged
once per mounted Pro package (≈9–10× on a page using several). `<LicenseWarning>`
now prints at most once per session. Likewise, `<TourProvider>`'s dev
`diagnose` tip now fires once per session instead of once per provider instance
(it printed twice on pages with multiple tours).

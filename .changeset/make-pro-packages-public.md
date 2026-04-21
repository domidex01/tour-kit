---
"@tour-kit/adoption": patch
"@tour-kit/ai": patch
"@tour-kit/analytics": patch
"@tour-kit/announcements": patch
"@tour-kit/checklists": patch
"@tour-kit/license": patch
"@tour-kit/media": patch
"@tour-kit/scheduling": patch
"@tour-kit/surveys": patch
---

chore: publish Pro packages as public on npm

Flip `publishConfig.access` from `restricted` to `public`. Pro-tier gating stays at runtime via `@tour-kit/license` + Polar.sh keys (watermark + console warning on unlicensed use), matching the documented "no hard block" licensing model. No code or API changes.

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

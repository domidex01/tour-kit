---
'@tour-kit/license': patch
---

Fix localhost licensing so an empty `licenseKey` is treated as unlicensed.

Local development still skips Polar validation and activation usage when a
non-empty key is configured. When the key is missing or blank, Tour Kit now
shows the same unlicensed watermark on localhost that it shows in production —
surfacing a missing env var before it reaches a deploy.

- `<LicenseProvider licenseKey="">` on localhost now resolves to `invalid`/`free`
  and `useLicenseGate()` / `<LicenseGate>` / `<ProGate>` gate accordingly.
- `validateLicenseKey('')` returns the unlicensed state before any cache read
  or Polar call, on every host.
- Whitespace-only keys are treated as missing (trimmed before presence checks,
  cache hashing, validation, activation, and render-key generation).
- `useLicenseGate()` now reads `<LicenseProvider>` state before the hostname
  bypass, so a provider with an empty key no longer leaks Pro behavior locally.
- `<LicenseGate>` outside a `LicenseProvider` keeps localhost quiet — there is
  no provider-owned key to inspect.

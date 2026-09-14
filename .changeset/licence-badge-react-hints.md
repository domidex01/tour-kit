---
'@tour-kit/react': major
'@tour-kit/hints': major
'@tour-kit/license': minor
---

The production licence badge reaches `@tour-kit/react` and `@tour-kit/hints`.

**This changes behaviour for every existing install.** A consumer who
upgrades and has no licence key configured will see a small
`userTourKit · Unlicensed` badge in the bottom-right of their **production**
deployment. It did not appear before. Nothing renders differently on
localhost, `127.0.0.1`, `*.local`, or on preview/ephemeral deploy URLs, and
nothing fails to render anywhere — `LicenseGate` is a soft gate that layers a
badge over the feature rather than replacing it.

`TourProvider` and `TourKitProvider` are now owned by `@tour-kit/react`
instead of being re-exported from `@tour-kit/core`. Props and behaviour are
identical and a type test asserts it, so imports do not change; the badge
simply reaches the documented single-tour quickstart, which previously
rendered none. `MultiTourKitProvider` and `HintsProvider` are wrapped too.
With all of them plus a Pro package mounted together you still get exactly one
badge — `LicenseWatermark` elects a single owner.

In `@tour-kit/license`:

- A project means a registrable domain. `foo.com` and `app.foo.com` now cost
  one activation slot instead of two, on both the activation and the
  validation side. Existing activations keep working: the stored label is
  normalised at comparison time, not migrated.
- The badge and the dev-only console warning name the current price.
- The badge no longer appears on a development host even when a
  `<LicenseProvider>` is mounted with an empty key. The licence grants
  development, evaluation, testing and CI use without charge, so the old
  behaviour had the runtime contradicting the terms. The console warning
  still fires, so a missing env var is still visible.

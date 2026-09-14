---
'@tour-kit/vue': major
'@tour-kit/svelte': major
'@tour-kit/license': minor
---

feat(vue,svelte): the licence gate, and the first public release under BUSL-1.1

`@tour-kit/vue` and `@tour-kit/svelte` have been `private: true` since §1.5,
waiting on the licence. This lands it and publishes them — at 1.0.0, because a
first release at 0.1.0 says "not ready" about code that has been under test for
three phases.

Both now start the licence gate from their provider's mount hook. Production use
needs a key; development, evaluation, testing and CI do not, exactly as the
BUSL-1.1 Additional Use Grant says. Without a key the binding still works in
full and layers the same corner badge every other package layers:

```ts
provideTourKit({ tours, license: { licenseKey: KEY } })
```

The gate is a **dependency**, not an optional peer. An opt-in gate is no gate:
a consumer who skips the install would simply not be gated.

For that to work without React, `@tour-kit/license` grew a framework-free half.
`startLicenseGate()`, `mountWatermark()` and `warnUnlicensed()` are now exported
from `@tour-kit/license/headless`, and `react`/`react-dom` became **optional**
peers — installing `@tour-kit/vue` no longer warns about a React peer it will
never load.

The badge itself moved out of `<LicenseWatermark>` into `lib/watermark-dom.ts`,
and the two React components are bindings over it now. There is one badge
implementation in the repo rather than one per framework, which is the same call
`createSpotlight` settled for the spotlight — the markup, the UTM parameters,
the accessible label and the click telemetry only exist once. Its one-per-page
rule is a count now instead of an owner election; the election only existed
because a React portal needs some component to own it.

No behaviour changed for React consumers, and `@tour-kit/license`'s 222 tests
plus every Pro package's licence-integration suite pass untouched.

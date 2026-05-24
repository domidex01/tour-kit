---
'@tour-kit/analytics': patch
---

Externalize `@amplitude/analytics-browser` in the tsup config. The SDK was
being inlined into `dist/`, ballooning the package to ~64 KB gz (vs. ~3 KB
expected for the root entry). Also declares the analytics SDKs
(`@amplitude/analytics-browser`, `mixpanel-browser`, `posthog-js`) as real
optional peer dependencies instead of listing them only in
`peerDependenciesMeta`.

Consumer impact: smaller bundles when not using Amplitude
(`dist/index.js` drops from ~64 KB gz to ~3 KB gz; `dist/plugins/amplitude.js`
drops from ~62 KB gz to <1 KB gz). Consumers who were relying on the
bundled SDK (against the documented optional-peer contract) must now
explicitly install `@amplitude/analytics-browser`.

Refs: audit B-2.

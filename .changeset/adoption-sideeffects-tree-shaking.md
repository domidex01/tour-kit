---
"@tour-kit/adoption": patch
---

Add `"sideEffects": false` so bundlers can tree-shake unused exports.

Matches the convention used by sibling packages in the repo. Consumers
importing a subset of `@tour-kit/adoption` exports (e.g. only `useAdoption`)
will now have the other named exports eliminated from their bundle.

Side benefit: tsup/esbuild also reads this hint at build time, which
reduces the package's own ESM dist by ~8% (`dist/index.js` 28066 → 25665
bytes). No runtime behavior changes.

Refs: audit B-5.

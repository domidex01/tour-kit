---
'@tour-kit/core': minor
---

Add the `@tour-kit/core/engine` subpath — the React-free door.

`@tour-kit/core/engine` re-exports the parts of core that never touch React:
the types, the DOM/storage/a11y utilities, the audience and frequency
predicates, `validateTour`, `waitForStepTarget`, `interpolate`, `resolvePlural`,
`parseUserIdsFromCsv` and `explainTour`. Its declarations name no `react`,
`react-dom`, `clsx`, `tailwind-merge` or `zod`, so a Vue, Svelte or plain-Node
consumer can typecheck against it with `skipLibCheck: false` and none of those
installed. Importing types from `@tour-kit/core` in that situation fails today
with eight errors (`Cannot find module 'react'`, `'react/jsx-runtime'`,
`'clsx'`, and four `Cannot find namespace 'React'`); from
`@tour-kit/core/engine` it compiles.

**Additive only.** Nothing moved. Every export of `@tour-kit/core` is still at
the same path with the same signature — including `matchesAudience`,
`validateConditions`, `canShowByFrequency` and the `Tour` / `TourStep` /
`TourState` types, which are pinned by a test because downstream consumers call
them server-side. Upgrading changes nothing for existing code.

`react` and `react-dom` are now **optional** peer dependencies. npm 7+ and bun
will stop auto-installing React into a project that does not use it. The peer
ranges are unchanged, so a React consumer on an unsupported major is still
warned. The one trade: install `@tour-kit/core` directly, use the providers and
forget React, and you now get a runtime error rather than an install-time
warning.

Scope, honestly: this subpath exports types, helpers and predicates — there is
no way to *run* a tour through it yet, because the engine still lives inside
`TourProvider`. It is infrastructure for the upcoming `createTourEngine()`,
landed early because it is cheap and additive. It is not yet framework-agnostic
tour support, and should not be announced as such.

Two build-side notes for anyone tracking bundle numbers. Core now emits a
shared `dist/chunk-*.js` (a second entry turns on code splitting), so
`dist/index.js` alone is smaller while the bytes a main-entry consumer actually
resolves are unchanged in a real bundler — the split re-export lists tree-shake
away. Accordingly the repo's dist-gzip gate now measures an entry's whole
**import closure** instead of the entry file. That correction also revealed five
packages (`hints`, `announcements`, `surveys`, `media`, `ai` client) that ship a
`headless` entry and had been measured as re-export shells for months; their
budgets were re-baselined to the honest figure. No bytes were added to any of
them.

Version note for anyone pinning core: `core`, `react` and `hints` are `linked`
in `.changeset/config.json`, so this minor lands the whole group on the same
number — and that number is **2.1.0**, not 1.1.0. `linked` bumps from the
group's highest current version (react and hints are at 2.0.0) rather than
each package's own, so core jumps 1.0.7 → 2.1.0 on a minor changeset. Nothing
breaking is implied by the major digit; it is the group moving in step.

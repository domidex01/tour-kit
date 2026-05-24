---
'@tour-kit/codemods': minor
---

Narrow the public API surface to CLI-only.

The previous JS-API re-exports (`fromJoyride`, `fromJoyrideParser`, `mapStepObject`,
`emitTodo`, `todoToComment`, `runMigrate`) and their accompanying types
(`StepMapping`, `Todo`, `CliOptions`) were intended as internal helpers but
ended up in `packages/codemods/src/index.ts`. The package ships with a `bin`
(`tour-kit-migrate`) and is consumed exclusively via `npx tour-kit-migrate`,
so the JS API was undocumented and unused outside the package itself.

**Breaking:** `import { ... } from '@tour-kit/codemods'` now returns nothing.
If you were depending on the programmatic API, please open an issue describing
your use case — we'd rather build a small, documented surface than leave the
current accidental exports in place.

The CLI behavior is unchanged.

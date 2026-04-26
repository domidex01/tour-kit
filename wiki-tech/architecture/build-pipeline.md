---
title: Build pipeline
type: architecture
sources:
  - ../CLAUDE.md
  - ../turbo.json
  - ../packages/*/package.json
  - ../packages/*/tsup.config.ts
updated: 2026-04-26
---

*tsup per package, Turborepo for orchestration. ESM + CJS dual output, type declarations co-located. `sideEffects: false` for tree-shaking.*

## Per-package build (tsup)

Each package ships `tsup.config.ts`. Output:

```
dist/
├── index.js          # ESM
├── index.cjs         # CJS
├── index.d.ts        # ESM types
└── index.d.cts       # CJS types
```

Some packages have multiple entry points (e.g. `@tour-kit/license` ships `headless.ts` separately, `@tour-kit/ai` ships `server`, `headless`, `tailwind`).

## `package.json` exports field

Every package declares both `import` and `require` conditions, with types co-located:

```json
"exports": {
  ".": {
    "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
  },
  "./package.json": "./package.json"
}
```

The dual `types` declaration matters for [Are The Types Wrong](https://arethetypeswrong.github.io/) compliance.

## Tree-shaking

- `"sideEffects": false` on every package
- Barrel `index.ts` re-exports keep public API tidy without forcing the bundler to include unused modules
- Hard split at `@tour-kit/license` between React and headless entry points

## Bundle budgets (project quality gates)

| Package | Budget (gzipped) |
|---|---|
| `@tour-kit/core` | < 8 KB |
| `@tour-kit/react` | < 12 KB |
| `@tour-kit/hints` | < 5 KB |

(Other Pro packages don't have explicit budgets in the project CLAUDE.md.)

## Turborepo orchestration

`turbo.json` declares the build graph. `^build` means "build my upstream Tour Kit deps first":

```json
"build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] }
"typecheck": { "dependsOn": ["^build"] }
"test": { "dependsOn": ["build"], "outputs": ["coverage/**"] }
```

Concurrency: 20.

## TypeScript

- Strict mode on
- ES2020 target
- React JSX transform (`jsx: "react-jsx"`)

## Hooks: `safe-ship-gate`

Project-level hook (`safe-ship-gate`) runs after every Write/Edit on package source files, typechecks the affected package, and blocks on type errors. Suggests `/safe-ship` for full review.

## Related

- [architecture/monorepo.md](monorepo.md)
- [architecture/dependency-graph.md](dependency-graph.md)

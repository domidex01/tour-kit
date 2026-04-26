---
title: Monorepo
type: architecture
sources:
  - ../CLAUDE.md
  - ../package.json
  - ../pnpm-workspace.yaml
  - ../turbo.json
updated: 2026-04-26
---

*pnpm workspace + Turborepo. 12 packages under `packages/`, plus apps and shared tooling.*

## Top-level layout

```
tour-kit/
├── packages/         # 12 publishable @tour-kit/* packages
├── apps/             # docs site, demos
├── e2e/              # Playwright suites
├── examples/         # Standalone example apps
├── tooling/          # Shared configs (TS, biome, etc.)
├── tour-kit/rules/   # Authoritative coding rules
├── turbo.json        # Build pipeline
├── pnpm-workspace.yaml
└── package.json
```

## Package managers

Both **pnpm** and **bun** are supported. Use whichever you prefer; `pnpm-lock.yaml` and `bun.lock` both exist.

```bash
pnpm install         # or: bun install
pnpm build           # or: bun run build
pnpm dev             # watch mode
pnpm typecheck
pnpm build --filter=@tour-kit/core
```

## Turborepo pipeline (`turbo.json`)

| Task | Depends on | Outputs |
|---|---|---|
| `build` | `^build` (upstream packages) | `dist/**`, `.next/**` |
| `typecheck` | `^build` | (none) |
| `test` | `build` | `coverage/**` |
| `dev` | none, `persistent: true` | (cache disabled) |
| `clean` | none | (cache disabled) |
| `size` | `build` | (none) |
| `bench` | `build` | `benchmark-results.json` |
| `e2e` | `build` | (cache disabled) |

Concurrency: 20.

## Releasing

[Changesets](https://github.com/changesets/changesets) for versioning. All `@tour-kit/*` packages are linked — they version together.

```bash
pnpm changeset           # document a change
pnpm version-packages    # bump versions per pending changesets
pnpm release             # build + publish to npm
```

## Quality gates (project-wide)

- TypeScript strict mode
- Test coverage > 80%
- Bundle: `core < 8KB`, `react < 12KB`, `hints < 5KB` (gzipped)
- Lighthouse Accessibility: 100
- WCAG 2.1 AA compliant

## Related

- [architecture/dependency-graph.md](dependency-graph.md)
- [architecture/build-pipeline.md](build-pipeline.md)
- [overview.md](../overview.md)

# Contributing to Tour Kit

Thanks for your interest in contributing! This guide covers everything you need to send a good PR against the **open-source packages**: `@tour-kit/core`, `@tour-kit/react`, and `@tour-kit/hints`.

> The other packages in `packages/` (adoption, ai, analytics, announcements, checklists, license, media, scheduling, surveys) are **proprietary** and not open to outside contributions. PRs touching only those packages will be closed.

## Code of Conduct

This project follows the [Contributor Covenant 2.1](./CODE_OF_CONDUCT.md). By participating you agree to its terms.

## Getting started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 10 (recommended) or **bun** ≥ 1.1

### Clone & install

```bash
git clone https://github.com/domidex01/tour-kit.git
cd tour-kit
pnpm install   # or: bun install
```

### Run locally

```bash
# Watch all packages
pnpm dev       # or: bun run dev

# Build all packages
pnpm build

# Type-check
pnpm typecheck

# Run tests
pnpm test

# Lint / format (Biome)
pnpm lint
pnpm format
```

### Try changes against an example app

```bash
pnpm example:vite   # Vite playground
pnpm example:next   # Next.js playground
```

## Project layout

This is a pnpm + Turborepo monorepo.

```
packages/
  core/        ← @tour-kit/core   (MIT, headless logic)
  react/       ← @tour-kit/react  (MIT, styled components)
  hints/       ← @tour-kit/hints  (MIT, beacon/hotspot system)
  …            ← proprietary (do not modify in PRs)
apps/docs/     ← documentation site (Fumadocs)
examples/      ← runnable example apps
```

Read `CLAUDE.md` at the repo root and inside each package for architecture notes.

## Coding rules

All contributions must follow the rules in [`tour-kit/rules/`](./tour-kit/rules/):

| File | Topic |
|------|-------|
| `typescript.md` | Strict TS, generics, type patterns |
| `react.md` | Component patterns, JSX |
| `hooks.md` | Custom hook design |
| `components.md` | Composition & architecture |
| `accessibility.md` | WCAG 2.1 AA |
| `testing.md` | Testing standards |
| `architecture.md` | Package structure & deps |
| `performance.md` | Bundle budgets |

### Core principles

1. **Headless first** — business logic lives in `@tour-kit/core`; UI packages are thin wrappers.
2. **Composition over configuration** — small, focused components.
3. **Type safety** — no `any`, strict mode on, full coverage at public boundaries.
4. **Accessibility** — keyboard nav, focus management, ARIA, `prefers-reduced-motion`.
5. **No surprise side effects** — SSR-safe; respect existing storage adapters.

### Quality gates

- TypeScript strict mode passes (`pnpm typecheck`)
- Tests pass and coverage stays > 80% (`pnpm test`)
- Bundle budgets: core < 8KB, react < 12KB, hints < 5KB (gzipped)
- Lighthouse Accessibility = 100, WCAG 2.1 AA compliant
- Biome lint passes (`pnpm lint`)

## Pull-request workflow

1. **Open or claim an issue** before starting non-trivial work, so we can align on scope.
2. **Fork & branch** from `main` using a short, descriptive name (e.g. `fix/hint-focus-trap`).
3. **Write tests first** when fixing a bug or adding behavior.
4. **Add a changeset** for any user-visible change in a published package:
   ```bash
   pnpm changeset
   ```
   Pick the affected packages and a semver bump (patch / minor / major). Commit the generated file under `.changeset/`.
5. **Run the full local suite** before pushing:
   ```bash
   pnpm typecheck && pnpm test && pnpm build
   ```
6. **Open a PR** against `main`. Fill out the PR template. Link the issue. Keep PRs focused — one logical change per PR.
7. **CI must be green**. Maintainers will review; expect a round or two of feedback.

### Commit style

We don't enforce conventional commits, but a short imperative subject helps reviewers:

```
fix(core): guard SSR access in useFocusTrap
feat(react): forward refs from TourCard
docs: clarify autoStart semantics
```

## Reporting bugs

Open a [bug report](./.github/ISSUE_TEMPLATE/bug_report.yml) with:
- A minimal reproduction (CodeSandbox / StackBlitz / repo)
- Tour Kit version, React version, framework (Vite / Next.js / etc.)
- Expected vs. actual behavior

## Proposing features

Open a [feature request](./.github/ISSUE_TEMPLATE/feature_request.yml). Describe the use case before the implementation; "what" and "why" matter more than "how". Large proposals may be moved to a Discussion first.

## Security issues

**Do not** open a public issue for security vulnerabilities. See [SECURITY.md](./SECURITY.md) for private disclosure.

## License

By contributing to the MIT-licensed packages (`core`, `react`, `hints`), you agree that your contributions are licensed under the [MIT License](./LICENSE).

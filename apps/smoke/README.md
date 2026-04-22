# @tour-kit/smoke

Release verification harness. Installs every `@tour-kit/*` package **from the npm registry** (not workspace-linked), mounts all nine providers, and renders a page that imports every published entry point.

Its job: catch "broken tarball" bugs that `examples/dashboard-next` can't see because that example uses `workspace:*` references.

## What it catches

- Missing files in published tarballs (`dist/` gaps, wrong `files` array)
- Broken `exports` field / wrong subpath exports
- Undeclared or mis-declared peer dependencies
- Named-export drift between TypeScript types and the shipped JS
- Runtime errors on module load (SSR dispatcher misuse, hooks at top level, etc.)

## What it doesn't catch

- Feature-level bugs. For that use `examples/dashboard-next` with workspace linking.
- Anything requiring user interaction — it's a mount-and-render smoke test only.

## Run it locally

```bash
cd apps/smoke
pnpm install:npm   # re-resolves against current npm, ignores workspace
pnpm typecheck
bash ./scripts/run-smoke.sh   # boots next dev, probes, tears down
```

Passes when the probe finds `data-smoke-ok` in the page HTML.

## CI

`.github/workflows/smoke-npm.yml` runs on:
- Completion of the Release workflow
- Weekly cron (Monday 12:00 UTC) — canary against `latest`
- Manual dispatch

## Known caveats

- We use `next dev` + curl instead of `next build` because Next.js 16.2.4 has a
  regression that crashes during prerender of the auto-generated `/_global-error`
  page (`TypeError: Cannot read properties of null (reading 'useContext')` inside
  `OuterLayoutRouter`). Unrelated to tour-kit — reproduces on a vanilla
  `create-next-app`. Revisit when Next ships a fix.
- Optional peers (`@lottiefiles/react-lottie-player`, `@mui/base`, `ai`,
  `@ai-sdk/react`) are declared as regular dependencies here so bundlers can
  resolve the dynamic imports. Consumers who don't use Lottie/AI features
  don't need these — document this in the public install instructions.

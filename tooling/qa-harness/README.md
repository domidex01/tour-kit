# tour-kit QA harness

Drives **consumer-fidelity** visual QA of the `@tour-kit/*` packages through two
throwaway dashboards that install the packages the way a real user does — not via
workspace symlinks.

## Why two install modes

| Pass | Script | Apps consume | Use for |
|------|--------|--------------|---------|
| **FIND** | `install-from-npm.mjs` | published npm tarballs | Reproducing bugs that ship to users *today*. |
| **FIX → VERIFY** | `pack-and-install.mjs` | local `pnpm pack` tarballs | Confirming a source fix in `packages/<x>/src` actually lands in the running app. |

Both avoid `workspace:*` so Tailwind purging, peer-dep resolution, SSR/ESM
boundaries, and `dist`-only behaviour match what a consumer experiences. The two
apps are excluded from the pnpm workspace in `pnpm-workspace.yaml`.

## The apps

- `examples/qa-next` — Next.js (App Router) + Tailwind v3
- `examples/qa-vite` — Vite + React 19 + Tailwind v3

Each has a page per package (tour, hints, announcements, surveys, adoption,
media, ai-chat, license-test, …). Pro packages run **watermarked** unless you set
`NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY` + `NEXT_PUBLIC_POLAR_ORG_ID`.

## Workflow

```bash
# 1. FIND — install published packages, then drive Chrome to find bugs
node tooling/qa-harness/install-from-npm.mjs
cd examples/qa-next && npm run dev     # http://localhost:3000

# 2. FIX — edit the offending packages/<x>/src, then re-verify against local builds
node tooling/qa-harness/pack-and-install.mjs <name> [<name> …]   # e.g. react hints
# refresh the browser; the app now runs your local build

# 3. LOOP until clean (drives Chrome itself):
#    /loop /tk-qa-harness
```

`pack-and-install.mjs` with no args rebuilds + repacks all 12 packages; pass
short names to rebuild only those (faster loop iterations). Tarballs are cached in
`tooling/qa-harness/.tarballs/` (gitignored).

# Deploying Helm (dashboard-next) to Vercel

This example lives inside the Tour Kit pnpm + Turborepo monorepo and imports the
`@tour-kit/*` workspace packages, so the build must compile those packages
first. `vercel.json` already wires that up.

## Option A — Vercel dashboard (recommended for monorepos)

1. **vercel.com → Add New → Project** and import the `tour-kit` Git repo.
2. **Root Directory:** set to `examples/dashboard-next`.
   (Vercel still clones the whole repo — the build runs `cd ../.. && turbo …`.)
3. Framework preset is auto-detected as **Next.js**. Leave Build/Install/Output
   to `vercel.json`:
   - Install: `pnpm install --frozen-lockfile`
   - Build: `cd ../.. && pnpm turbo run build --filter=dashboard-next`
   - Output: `.next`
4. Add the environment variables below.
5. **Deploy.**

## Option B — Vercel CLI

```bash
# from the repo root
npx vercel link            # link/create the project
# set Root Directory to examples/dashboard-next when prompted (or in the dashboard)
npx vercel pull            # pull env vars
npx vercel --prod          # build + deploy
```

If the CLI builds from the app folder, run it from `examples/dashboard-next`;
`vercel.json`'s `cd ../..` build command handles the workspace.

## Environment variables

Set these in **Project → Settings → Environment Variables** (Production +
Preview). `.env.local` is git-ignored and is NOT uploaded.

| Variable | Required? | Why |
|---|---|---|
| `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY` | **Yes, for a clean recording** | The Pro packages soft-gate on any non-`localhost` host. Without a valid key, Pro components render the **unlicensed watermark** on the public Vercel domain. Use a Pro key valid for the deployed domain. |
| `NEXT_PUBLIC_POLAR_ORGANIZATION_ID` | Yes (with the key) | Polar org the license is validated against. |
| `OPENAI_API_KEY` | Optional | Enables live streaming in the AI chat. The Director's "Ask → launches tour" cue works **without** it (it injects the Q&A), and the chat shows a graceful fallback message. |

> ⚠️ **Watermark gotcha:** localhost gets a dev bypass, so you never see the
> watermark locally — but a `*.vercel.app` (or custom) domain is treated as
> production. Set `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY` (+ org id) or every Pro
> surface in the recording will carry the watermark. The amber "Pro" badges in
> the UI are our own styling and are unaffected.

## Notes

- Node: repo requires `node >=18`; Next 16 builds fine on Vercel's default
  Node 22.
- The build was verified locally: `pnpm turbo run build --filter=dashboard-next`
  exits 0 and `pnpm --filter dashboard-next typecheck` passes.
- Director mode is hidden by default (clean on camera). Reveal it with the
  bottom-left 🎬 launcher or the `~` key on the deployed site too.

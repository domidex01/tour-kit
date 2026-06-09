---
"@tour-kit/license": patch
---

Stop the "Unlicensed" watermark from appearing on legitimate, paid deployments.

Two fixes to how domain activation is handled, both aimed at the common
Vercel/Netlify workflow where preview URLs pile up:

- **Activation-limit reached no longer watermarks a valid key.** When Polar
  validates the key as `granted` but the auto-activation call returns `403`
  (activation limit reached), the license is now treated as a valid Pro license
  on that domain instead of falling through to the unlicensed watermark. The key
  is genuinely paid — the customer just has more live domains than slots — so we
  keep Pro unlocked, emit a one-time console warning pointing at the Polar
  dashboard, and cache the result. Previously this mapped to `status: 'invalid'`
  and rendered the watermark on the customer's production site.

- **Ephemeral / preview hosts skip activation entirely.** Vercel preview URLs
  (`*-git-*.vercel.app`, `*-<hash>-*.vercel.app`), Netlify branch/deploy-preview
  hosts (`*--*.netlify.app`), Cloudflare Pages previews (`<hash>.*.pages.dev`),
  dev tunnels (ngrok, `loca.lt`, `trycloudflare.com`), and raw IP hosts now
  resolve to a `preview_bypass` state that unlocks Pro without calling Polar, so
  a busy preview workflow never burns the key's finite activation slots. Stable
  production hosts — including a bare `project.vercel.app` alias — still validate
  and activate normally. New `isEphemeralHost()` helper exported from the package
  root and `@tour-kit/license/headless`.

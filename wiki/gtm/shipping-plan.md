---
title: Shipping Plan (4-Day Tactical)
type: gtm
sources:
  - ../../marketing-strategy/tour-kit-shipping-plan.md
updated: 2026-04-19
---

*4-day ship sequence to take TourKit from "code done" to "published + launched." Feb 11–15, 2026.*

> Target: Feb 15, 2026. Ship as production-ready OSS + add to portfolio.

## Current state

Code done, docs mostly complete, needs final validation + release. 9 packages (core/react/hints + adoption/analytics/announcements/checklists/license/media/scheduling) plus docs site + MCP server.

## Day 1 (Feb 11): Validation

### Task 1 — verify builds/tests
```bash
pnpm build
pnpm test
pnpm typecheck
pnpm lint
```

Expected: all packages build, tests pass, no type errors. Fix any failures before proceeding.

### Task 2 — version bump
```bash
pnpm changeset   # Select all packages, minor (0.0.0 → 0.1.0), write release notes
pnpm version-packages
git diff         # Review generated CHANGELOGs
```

## Day 2 (Feb 12): Release

### Task 3 — commit and push
```bash
git add .
git commit -m "chore: release v0.1.0"
git push origin main
```

### Task 4 — publish to npm
```bash
npm login        # If needed
pnpm release     # turbo run build + changeset publish
```

Verify: `npmjs.com/package/@tour-kit/react` and other packages.

### Task 5 — test fresh install
```bash
npx create-next-app@latest tour-kit-test --typescript --tailwind --app
cd tour-kit-test
npm install @tour-kit/react
```

Smoke test code:
```tsx
import { Tour, TourStep } from '@tour-kit/react';

export default function Home() {
  return (
    <Tour id="test" autoStart>
      <TourStep id="welcome" target="body" title="It works!"
        content="Tour-kit installed successfully from npm"
        placement="center" />
    </Tour>
  );
}
```

```bash
npm run dev   # Visit localhost:3000, verify tour appears, no console errors
```

## Day 3 (Feb 13): Documentation

### Task 6 — finish docs homepage

`apps/docs/content/docs/index.mdx` + `apps/docs/app/page.tsx`:
- Hero: tagline "Modern React onboarding library for Shadcn UI" + Get Started / View Demo CTAs
- Feature highlights: shadcn-native, hints system, headless + styled, TypeScript-first, WCAG 2.1 AA
- Code example (quick start)
- Package comparison table (core/react/hints)
- Installation instructions

### Task 7 — deploy docs site
```bash
vercel --prod   # Or push to main for auto-deploy
```

Verify: all navigation works, examples load, search works. Expected URL: `tour-kit.vercel.app` or `tourkit.domidex.dev`.

## Day 4 (Feb 14): Launch

### Task 8 — update GitHub for launch
Update README with `npm install`, badges (npm version, license, build status), docs link. Commit.

```bash
gh release create v0.1.0 \
  --title "Tour-Kit v0.1.0 - Initial Release" \
  --notes "First public release. Includes core, react, hints, and 6 feature packages. See CHANGELOG.md." \
  --latest
```

GitHub topics: `react`, `typescript`, `onboarding`, `product-tour`, `shadcn-ui`, `headless-ui`.

### Task 9 — portfolio entry (domidex.dev)

**Tour-Kit — React Onboarding Library**

> Production-ready onboarding and product tour library designed for Shadcn UI. Headless architecture with styled components, hints system, and full TypeScript support.

Stack: React 18+ · TypeScript · Shadcn UI · Radix UI · Turbo · Changesets.

Links: docs, npm, GitHub, live demo. Metrics: npm downloads, stars, bundle size.

## Final launch day (Feb 15)

### Morning checklist
- [ ] All packages on npm
- [ ] Docs site live
- [ ] GitHub release created
- [ ] Portfolio updated
- [ ] README has install instructions

### Soft launch (optional, non-Supabase-style)
- Tweet about launch
- Post to r/reactjs
- Share in shadcn Discord
- LinkedIn post

> **Note:** This shipping plan is the *technical* ship sequence. The *marketing* launch follows a Supabase-style multi-launch strategy — see [gtm/launch-strategy.md](launch-strategy.md) and [gtm/launch-checklist.md](launch-checklist.md).

## Rollback plan

Critical bug after publish (within 72 hours):
```bash
npm unpublish @tour-kit/react@0.1.0
# Or deprecate:
npm deprecate @tour-kit/react@0.1.0 "Critical bug, use 0.1.1"

# Fix, bump, republish:
pnpm changeset
pnpm version-packages
pnpm release
```

## Day-one success

Week 1: 10+ npm downloads, no critical bugs, portfolio live with tour-kit.
Month 1: 100+ npm downloads, 10+ stars, 1+ community contribution.

For the launch-week and 90-day targets (500/2K stars, Pro sales, etc.), see [gtm/success-metrics.md](success-metrics.md).

## Related

- [gtm/launch-strategy.md](launch-strategy.md) — Supabase-style multi-launch strategy
- [gtm/launch-checklist.md](launch-checklist.md) — Full pre/during/post launch checklist
- [gtm/success-metrics.md](success-metrics.md)
- [product/architecture.md](../product/architecture.md) — Build/release toolchain

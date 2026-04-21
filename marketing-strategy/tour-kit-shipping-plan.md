# Tour-Kit Shipping Plan
**Target: Feb 15, 2026 (4 days)**

> Ship tour-kit as production-ready open source library + add to portfolio

---

## Overview

Tour-kit is a React onboarding/product tour library with 9 packages:
- Core packages: `@tour-kit/core`, `@tour-kit/react`, `@tour-kit/hints`
- Feature packages: `adoption`, `analytics`, `announcements`, `checklists`, `license`, `media`, `scheduling`
- Apps: docs site + MCP server
- Examples: Next.js + Vite demos

**Current state:** Code done, docs mostly complete, needs final validation + release

---

## Execution Checklist

### Day 1: Validation (Feb 11)

#### Task 1: Verify builds and tests
```bash
cd C:\Users\domi\Desktop\next-playground\tour-kit

# Build all packages
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint
```

**Expected:** All packages build successfully, tests pass, no type errors

**If failures:** Fix broken tests/types before proceeding

---

#### Task 2: Version bump
```bash
# Create changeset (first release = 0.1.0)
pnpm changeset

# Follow prompts:
# - Select all packages that changed
# - Choose "minor" (0.0.0 → 0.1.0)
# - Write release notes summarizing features

# Apply version bumps
pnpm version-packages

# Review generated CHANGELOGs
git diff
```

**Expected:** All package.json files bumped to 0.1.0, CHANGELOGs generated

---

### Day 2: Release (Feb 12)

#### Task 3: Commit and push
```bash
git add .
git commit -m "chore: release v0.1.0"
git push origin main
```

---

#### Task 4: Publish to npm
```bash
# Login to npm (if needed)
npm login

# Build and publish all packages
pnpm release

# This runs:
# - turbo run build
# - changeset publish (publishes to npm)
```

**Expected:** All 9 packages published to npm as @tour-kit/*@0.1.0

**Verify:** Visit npmjs.com/package/@tour-kit/react (and other packages)

---

#### Task 5: Test fresh install
```bash
# Create new Next.js app
cd C:\Users\domi\Desktop\
npx create-next-app@latest tour-kit-test --typescript --tailwind --app

cd tour-kit-test

# Install tour-kit from npm
npm install @tour-kit/react

# Create test page (app/page.tsx)
```

**Test code:**
```tsx
import { Tour, TourStep } from '@tour-kit/react';

export default function Home() {
  return (
    <Tour id="test" autoStart>
      <TourStep
        id="welcome"
        target="body"
        title="It works!"
        content="Tour-kit installed successfully from npm"
        placement="center"
      />
    </Tour>
  );
}
```

```bash
npm run dev
# Visit localhost:3000 and verify tour appears
```

**Expected:** Tour renders correctly, no console errors

---

### Day 3: Documentation (Feb 13)

#### Task 6: Finish docs homepage
```bash
cd C:\Users\domi\Desktop\next-playground\tour-kit\apps\docs
```

**Homepage sections to complete:**
1. **Hero section**
   - Tagline: "Modern React onboarding library for Shadcn UI"
   - Primary CTA: "Get Started" → /docs/getting-started
   - Secondary CTA: "View Demo" → /examples

2. **Feature highlights**
   - Shadcn-native (copy-paste philosophy)
   - Hints system (unique in ecosystem)
   - Headless + Styled options
   - TypeScript-first
   - Accessible (WCAG 2.1 AA)

3. **Code example** (quick start snippet)

4. **Package comparison table**
   | Package | Description | Size |
   |---------|-------------|------|
   | @tour-kit/core | Headless hooks | <8KB |
   | @tour-kit/react | Styled components | <12KB |
   | @tour-kit/hints | Persistent beacons | <5KB |

5. **Installation instructions**

**Files to check:**
- `apps/docs/content/docs/index.mdx` (homepage content)
- `apps/docs/app/page.tsx` (landing page if separate)

---

#### Task 7: Deploy docs site
```bash
# From tour-kit root
cd C:\Users\domi\Desktop\next-playground\tour-kit

# If using Vercel CLI
vercel --prod

# Or push to main and let Vercel auto-deploy
```

**Expected:** Docs site live at tour-kit.vercel.app or tourkit.domidex.dev

**Verify:** All navigation works, examples load, search works

---

### Day 4: Launch (Feb 14)

#### Task 8: Update GitHub for launch
```bash
cd C:\Users\domi\Desktop\next-playground\tour-kit

# Update README with npm install
# Add badges (npm version, license, build status)
# Add link to docs site
git add README.md
git commit -m "docs: update README for v0.1.0 launch"
git push origin main

# Create GitHub release
gh release create v0.1.0 \
  --title "Tour-Kit v0.1.0 - Initial Release" \
  --notes "First public release. Includes core, react, hints, and 6 feature packages. See CHANGELOG.md for details." \
  --latest
```

**Add GitHub topics:**
- react
- typescript
- onboarding
- product-tour
- shadcn-ui
- headless-ui

---

#### Task 9: Add to domidex.dev portfolio

**Project card content:**

**Title:** Tour-Kit - React Onboarding Library

**Description:**
Production-ready onboarding and product tour library designed for Shadcn UI. Headless architecture with styled components, hints system, and full TypeScript support.

**Tech stack:**
- React 18+
- TypeScript
- Shadcn UI primitives
- Radix UI (accessibility)
- Turbo (monorepo)
- Changesets (versioning)

**Links:**
- 🌐 [Documentation](https://tourkit.domidex.dev)
- 📦 [npm](https://npmjs.com/package/@tour-kit/react)
- 💻 [GitHub](https://github.com/domidex01/tour-kit)
- 🎨 [Live Demo](https://tourkit.domidex.dev/examples)

**Key features:**
- 9 packages covering tours, hints, analytics, adoption tracking
- <25KB total bundle size
- WCAG 2.1 AA compliant
- Headless + styled options
- TypeScript-first

**Metrics (if available):**
- npm downloads
- GitHub stars
- Bundle size

---

## Final Launch Day (Feb 15)

### Morning checklist:
- [ ] All packages on npm ✓
- [ ] Docs site live ✓
- [ ] GitHub release created ✓
- [ ] Portfolio updated ✓
- [ ] README has install instructions ✓

### Soft launch:
- Tweet about launch (optional)
- Post to r/reactjs (optional)
- Share in Shadcn Discord (optional)
- LinkedIn post (optional)

---

## Rollback Plan

If critical bug found after publish:

```bash
# Unpublish version (only works within 72 hours)
npm unpublish @tour-kit/react@0.1.0

# Or deprecate
npm deprecate @tour-kit/react@0.1.0 "Critical bug, use 0.1.1"

# Fix bug, bump to 0.1.1, republish
pnpm changeset
pnpm version-packages
pnpm release
```

---

## Success Metrics

**Week 1:**
- [ ] 10+ npm downloads
- [ ] No critical bugs reported
- [ ] Portfolio live with tour-kit

**Month 1:**
- [ ] 100+ npm downloads
- [ ] 10+ GitHub stars
- [ ] 1+ community contribution (issue/PR)

---

## Notes

- Keep monorepo structure (already set up)
- Changesets handles versioning automatically
- Turbo handles parallel builds
- Don't forget npm 2FA when publishing
- Test in fresh Next.js app before announcing publicly

---

*Plan created: 2026-02-11*
*Target ship date: 2026-02-15*

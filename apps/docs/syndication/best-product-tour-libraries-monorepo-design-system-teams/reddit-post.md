# Reddit Post

**Subreddit:** r/reactjs
**Title:** We tested 7 product tour libraries inside a Turborepo monorepo with a shared design system — here's how they scored

**Body:**

Our team maintains a monorepo with a shared Radix-based design system consumed by 3 apps. We needed product tours and couldn't find a roundup that tested for monorepo-specific problems:

- **Style isolation**: Does the library inject CSS that overrides your design tokens?
- **Tree-shaking**: Does unused code get eliminated across package boundaries?
- **Peer dep hygiene**: Does it add transitive deps that conflict with hoisted packages?
- **TypeScript**: Do types resolve when re-exported from a shared workspace package?

So we installed all 7 and scored them.

**TL;DR results** (0-10, weighted for design system use):
- userTourKit: 9.4 — headless, zero CSS, per-package tree-shaking
- Driver.js: 7.2 — tiny and zero-dep, but requires CSS file
- OnboardJS: 7.0 — state machine only, you build all UI
- Onborda: 6.8 — Tailwind-native, but Next.js only + Framer Motion dep
- Shepherd.js: 5.1 — most configurable, but global CSS with !important
- Reactour: 4.5 — styled-components runtime dependency
- React Joyride: 3.8 — inline styles, 30KB, any-typed Step

Full writeup with code examples and monorepo patterns: https://usertourkit.com/blog/best-product-tour-libraries-monorepo-design-system-teams

**Disclosure:** We built userTourKit. It's listed first and scored highest in our rubric. Take that with appropriate skepticism. Every claim is verifiable.

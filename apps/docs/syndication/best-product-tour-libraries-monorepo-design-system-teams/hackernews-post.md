# Hacker News

**Title:** 7 product tour libraries tested inside a Turborepo monorepo with a shared design system

**URL:** https://usertourkit.com/blog/best-product-tour-libraries-monorepo-design-system-teams

**Comment (if Show HN):**

We maintain a React monorepo with a shared design system and needed product tours. Every roundup we found tested in a single-app starter, missing monorepo-specific issues: style isolation, tree-shaking across workspaces, peer dep hoisting, TypeScript at package boundaries.

We installed 7 libraries and scored them on those criteria. The main finding: libraries that inject global CSS create permanent maintenance debt in design system codebases. Headless libraries that ship zero CSS integrate cleanly.

Bias: we built one of the libraries (userTourKit). Every claim is verifiable against npm/GitHub/bundlephobia.

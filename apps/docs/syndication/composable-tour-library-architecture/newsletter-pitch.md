## Subject: Building a 10-package composable React library — architecture deep-dive

## Recipients:
- Cooperpress (React Status, JavaScript Weekly): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a building-in-public walkthrough of how Tour Kit (a headless React product tour library) splits into 10 tree-shakeable packages using Turborepo + tsup + pnpm workspaces. The article covers the dependency graph design, bundle size budgets enforced as CI checks (core < 8KB gzipped), centralized accessibility architecture, and the common mistakes I made along the way.

Link: https://usertourkit.com/blog/composable-tour-library-architecture

Thanks,
Domi

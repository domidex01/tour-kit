# 7 product tour libraries ranked for monorepo and design system teams

*Originally published at [usertourkit.com](https://usertourkit.com/blog/best-product-tour-libraries-monorepo-design-system-teams)*

Most product tour roundups test libraries in a single-app Vite starter. That tells you nothing about what happens when you drop one into a Turborepo workspace with a shared design system.

We installed seven tour libraries into a Turborepo + pnpm monorepo with a shared Radix-based design system and ranked them on: style isolation, tree-shaking, peer dependency hygiene, and TypeScript across workspace boundaries.

**The results:** Headless libraries (userTourKit, OnboardJS) score highest because they ship zero CSS and let your design system render everything. Styled libraries (Shepherd.js, React Joyride) inject global CSS that fights your tokens.

Read the full comparison with code examples, scoring rubric, and monorepo-specific gotchas: https://usertourkit.com/blog/best-product-tour-libraries-monorepo-design-system-teams

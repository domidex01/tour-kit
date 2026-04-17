# Discord Message (Reactiflux)

**Channel:** #libraries-and-frameworks or #react-help

Hey all — we just published a comparison of 7 product tour libraries tested specifically for monorepo + design system setups (Turborepo + pnpm + shared Radix components).

Covers style isolation, tree-shaking across workspaces, peer dep conflicts, and TypeScript at package boundaries.

Quick results: headless libraries (zero CSS) scored highest because they don't fight your design tokens. Libraries with global CSS or inline styles create permanent override debt.

Full writeup: <https://usertourkit.com/blog/best-product-tour-libraries-monorepo-design-system-teams>

(Disclosure: we built one of the listed libraries)

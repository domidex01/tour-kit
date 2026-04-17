## Subreddit: r/reactjs

**Title:** I wrote a migration guide for moving from React Joyride to a headless tour library

**Body:**

I've been working on Tour Kit, a headless product tour library for React. One question that keeps coming up is "how do I migrate my existing React Joyride setup?"

So I wrote a step-by-step guide covering the full migration. The key differences:

- Joyride is configuration-driven (pass a steps array, get pre-built tooltips). Tour Kit is composition-driven (you write the tooltip JSX using your own design system components).
- The guide includes a full API mapping table — every Joyride prop/concept mapped to its Tour Kit equivalent.
- You can run both libraries side-by-side during migration, swapping one tour at a time.

The honest tradeoff: Tour Kit requires more JSX upfront because it's headless. You don't get pre-built tooltips. But if your team already has a component library (shadcn/ui, Radix, custom), the migration is mostly just plugging your existing components into Tour Kit's providers and hooks.

Data points: Tour Kit core is under 8KB gzipped vs Joyride's ~30KB. Both use @floating-ui/react for positioning. Tour Kit adds router adapters for Next.js App Router and React Router that Joyride doesn't have.

Full article with code examples: https://usertourkit.com/blog/migrate-react-joyride-tour-kit

Happy to answer questions about the migration process or the architectural differences.

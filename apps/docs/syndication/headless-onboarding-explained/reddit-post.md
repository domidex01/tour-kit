## Subreddit: r/reactjs

**Title:** I wrote a guide on headless onboarding — the pattern where your tour library handles logic but you render everything with your own components

**Body:**

If your team uses Tailwind + shadcn/ui (or any component library), you've probably hit this: you install a product tour library and suddenly there's a tooltip on screen that doesn't match anything else in your app. Different border radius, different shadows, different font. CSS override hell follows.

Headless onboarding fixes this by separating the tour logic (step sequencing, element targeting, scroll management, persistence, keyboard navigation) from the rendering. You get hooks like `useTour()` and `useStep()`. You render the tooltip as your own `<Card>` component. Your Tailwind classes, your design tokens.

I put together a comprehensive guide covering:

- What headless onboarding actually means (beyond just product tours — checklists, announcements, hints, surveys too)
- The three-layer architecture (core engine → framework adapter → your components)
- When to choose headless vs styled vs no-code (with a comparison table)
- Step-by-step implementation with TypeScript + React code
- Bundle size comparison: headless core at <8KB vs React Joyride at 37KB vs Shepherd.js at 25KB
- Honest tradeoffs — headless isn't for every team

One data point that surprised me: we measured integration time and styled tours required roughly 2 hours of CSS override work per project, while headless took about 15 minutes for teams with an existing component library.

Full article with code examples and 10 FAQs: https://usertourkit.com/blog/headless-onboarding-explained

Disclosure: I built Tour Kit (the headless onboarding library used in the examples), so take the perspective with appropriate skepticism. The architectural pattern applies to any headless approach.

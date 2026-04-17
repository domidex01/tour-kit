## Subreddit: r/reactjs

**Title:** I wrote a guide on why headless UI matters specifically for product tours — not just dropdowns and modals

**Body:**

Every article about headless UI focuses on comboboxes, dialogs, and popovers. But the pattern is arguably more valuable for product tours and onboarding flows, and nobody seems to talk about it.

Here's the problem: your app has a design system with carefully chosen spacing, color tokens, and typography. Then your product tour library injects its own tooltips that look completely different. You spend 2 hours overriding CSS selectors to make the tour match your brand. A headless tour library gives you the behavior (step sequencing, focus trapping, keyboard navigation, ARIA attributes) and lets you render steps with your own components. Integration takes about 15 minutes instead.

I traced the evolution from HOCs to render props to hooks and showed how it applies specifically to onboarding. Also included a comparison table of headless vs styled approaches (bundle sizes, TypeScript coverage, React 19 support, accessibility).

One heuristic I keep coming back to: if your app has a design system, you need a headless tour library. The styled-library CSS override dance just doesn't scale when you have design tokens to maintain.

Interested in hearing how others handle this. Are your product tours matching your design system, or do they look like they belong to a different app?

Full guide with code examples and library comparison: https://usertourkit.com/blog/what-is-headless-ui-guide-onboarding

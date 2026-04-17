## Subreddit: r/reactjs

**Title:** I compiled 14 React-specific product tour best practices after reviewing data from 550M interactions

**Body:**

I've been building product tours in React for a while now, and I noticed that most "best practices" articles are written for product managers picking SaaS tools, not for developers writing JSX. So I wrote up the patterns I've learned, grounded in data from Chameleon's 550M interaction dataset.

Some of the key findings that surprised me:

- Three-step tours hit 72% completion. Seven steps? Only 16%. But the React angle is more interesting: structure each step around a user *action*, not a UI element.
- Self-serve tours (user clicks "Take the tour") see 123% higher completion than auto-triggered ones. In React terms: don't start tours in useEffect. Expose a trigger component.
- Lazy-loading tour components with React.lazy() saved us 11KB gzipped from initial bundles. Tour UI should never be in your main chunk since most users only see it once.
- The Server Component boundary is tricky. Tour providers need 'use client' but target elements might render server-side. MutationObserver is how you bridge the gap.
- Sentry's engineering team shared a smart pattern: they used useRef instead of useState for the step registry to prevent cascading re-renders when steps register themselves.

I also compared the current state of React tour libraries. React Joyride's React 19 support is unstable, Shepherd's React wrapper is broken entirely for React 19, and Intro.js has multiple WCAG accessibility violations.

The accessibility stuff was eye-opening too. 71.5% of screen reader users have issues with overlays and popups (WebAIM survey). Focus trapping, ARIA attributes, and keyboard navigation aren't nice-to-haves.

Full article with code examples for all 14 practices, a library comparison table, and FAQ: https://usertourkit.com/blog/product-tour-best-practices-react

Disclosure: I built User Tour Kit, so take the library recommendations with appropriate skepticism. The best practices and data apply regardless of which library you use.

Happy to answer questions about any of these patterns.

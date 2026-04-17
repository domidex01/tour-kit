## Subreddit: r/reactjs

**Title:** Click-triggered product tours complete at 67% vs 31% for timers — here are 6 behavioral trigger patterns in React

**Body:**

I've been digging into how trigger timing affects product tour completion rates, and the data gap is bigger than I expected.

Chameleon published an analysis of 15M+ tour interactions. The headline number: click-triggered (event-based) tours complete at 67%. Time-delay tours? 31%. On-page contextual triggers hit 69.56%. Checklist-triggered tours add a 21% completion bonus on top of whatever trigger you use.

Tour length matters too. Three-step tours hit 72% completion. Five-step tours drop to 34% median. So even a perfectly timed behavioral trigger can't save a long walkthrough.

I wrote up the six trigger patterns I've found most useful in React apps:

1. **Click triggers** — `onClick` starts the tour. Simplest, highest conversion.
2. **Route-change triggers** — `useEffect` + `useLocation` to fire on first page visit.
3. **Inactivity triggers (Smart Delay)** — Reset a `setTimeout` on mousemove/keydown/scroll. Outperforms fixed delay by 21%.
4. **Element-visibility triggers** — `IntersectionObserver` starts tour when a target element scrolls into view.
5. **Feature-milestone triggers** — Fire based on cumulative state (export count, feature usage threshold).
6. **Compound triggers** — AND/OR rule evaluation for multi-condition logic.

Each one has a working TypeScript hook example. I also covered the accessibility side (aria-live for dynamically injected tour content, keyboard handlers for custom triggers, focus management on auto-fired triggers) because basically nobody writes about that intersection.

Full guide with all code examples and the comparison table: https://usertourkit.com/blog/behavioral-triggers-product-tours-event-based-onboarding

Disclosure: I built Tour Kit, the library used in the examples. But the trigger patterns work with any tour library — they're just hooks and DOM events.

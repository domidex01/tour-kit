## Thread (6 tweets)

**1/** Product tours get messy fast. "Show step 3 only if steps 1 and 2 are done" = useEffect chains, manual selectors, state sync bugs. What if each step was just... an atom?

**2/** Modeled each tour step as a Jotai atom. Conditional visibility? Derived atoms. Progress bar? Derived atom. Persistence? atomWithStorage. No useEffect anywhere.

When step 2 completes, only step 2's component re-renders. Context would re-render all 10 step components.

**3/** The numbers:
- Jotai: ~2.9KB gzipped
- Tour Kit (headless positioning): <8KB gzipped
- Total: under 11KB
- React Joyride alone: 35KB+
- Atom update with 1,000 subscribers: 14ms

**4/** The comparison that convinced me:

Context: re-renders everything
Zustand: needs manual selectors
Jotai: granular subscriptions by default
Redux: works but 14KB of boilerplate for step-level state

**5/** When NOT to use this: simple 3-step linear tours. useState handles that fine. The atom model pays off at 5+ steps with dependencies between them, feature flag conditions, or multi-page flows.

**6/** Full tutorial with TypeScript code, async atoms for backend sync, and Next.js SSR hydration:

https://usertourkit.com/blog/tour-kit-jotai-atomic-state-complex-tour-flows

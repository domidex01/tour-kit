## Title: Using Jotai's Atomic State Model for Product Tour Flows in React

## URL: https://usertourkit.com/blog/tour-kit-jotai-atomic-state-complex-tour-flows

## Comment to post immediately after:

I've been building product tours in React and hit a wall with conditional step logic. The typical approach is a flat step array managed by the tour library, but real onboarding flows have dependencies: "show this step only after those two are done."

Tried modeling each tour step as a Jotai atom. Derived atoms handle conditional visibility declaratively. No useEffect chains, no manual Zustand selectors. The dependency graph does the work.

Some numbers: Jotai adds ~2.9KB gzipped, updates complete in 14ms with 1,000 subscribed components, and atomWithStorage gives you localStorage persistence for free. Combined with a headless tour library for positioning/highlighting, the total bundle stays under 11KB.

The tradeoff: Jotai's atom model requires a mental shift from centralized stores. If you only need a simple 3-step tour, useState is the right tool. The atoms pay off once you have 5+ interdependent steps.

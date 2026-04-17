## Subreddit: r/reactjs

**Title:** I modeled product tour state as Jotai atoms and it solved my conditional step problem

**Body:**

Been building complex onboarding flows where steps depend on each other ("show step 3 only after steps 1 and 2 are done"). Tried Context first, then Zustand. Both worked but got messy once I needed conditional visibility and persistence.

Switched to Jotai atoms where each tour step is its own atom. Derived atoms handle the "is this step visible?" logic declaratively. No useEffect chains, no manual selectors. When step 2 completes, only step 2's component re-renders. With Context, all 10 step components would re-render.

The key data point that convinced me: with 1,000 subscribed components, Jotai atom updates complete in 14ms. For a dashboard app with 15+ tour steps, that matters.

Quick comparison of approaches:

- **Context**: 0KB, but re-renders every consumer on any change. Fine for 3 steps, painful for 10+.
- **Zustand** (~1.1KB): needs manual selectors to avoid over-rendering. Gets verbose with interdependent conditions.
- **Jotai** (~2.9KB): granular subscriptions by default. Derived atoms for conditional logic. `atomWithStorage` for free persistence.
- **Redux Toolkit** (~14KB): works but the boilerplate-to-value ratio is rough for what's essentially step-level state.

I used Tour Kit (headless tour library, <8KB) for the actual positioning/highlighting and Jotai for all the state management. The headless approach means the state layer is completely swappable.

Worth noting: Jotai is overkill if you just need a simple linear tour. `useState` handles that fine. The atom model pays off when you have 5+ steps with dependencies between them.

Full write-up with all the TypeScript code examples, including async atoms for backend sync and SSR hydration for Next.js: https://usertourkit.com/blog/tour-kit-jotai-atomic-state-complex-tour-flows

Curious if anyone else has used atomic state for UI flows like tours/wizards/onboarding? What patterns worked for you?

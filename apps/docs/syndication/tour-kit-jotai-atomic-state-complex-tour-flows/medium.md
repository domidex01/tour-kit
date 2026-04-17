# Atomic State for Product Tours: How Jotai Solves What Context and Zustand Can't

## When your tour state gets too complex for a single store, break it into atoms

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-jotai-atomic-state-complex-tour-flows)*

Product tours break down the moment you need conditional steps. "Show step 3 only if the user completed steps 1 and 2" sounds simple until you're threading that logic through React Context or a Zustand store with manual selectors.

Most tour libraries manage state internally. You get no way to compose it with the rest of your app. What if each tour step was its own independent unit of state?

That's exactly what Jotai's atom model gives you. Each step becomes an atom. Progress is a derived computation. Conditional visibility happens without a single `useEffect`.

I built this pattern using Tour Kit (a headless React tour library at <8KB gzipped) and Jotai (~2.9KB gzipped). Together they handle a 7-step onboarding flow with branching paths, localStorage persistence, and zero unnecessary re-renders.

## The core insight: one step = one atom

Instead of a monolithic tour state object, you model each step independently:

```
step1Atom -> 'pending' | 'active' | 'completed' | 'skipped'
step2Atom -> 'pending' | 'active' | 'completed' | 'skipped'
tourProgressAtom -> derived from step atoms (computed %)
step3VisibleAtom -> derived: step1 completed AND step2 completed
```

When step 2 completes, only step 2's component re-renders. Plus any derived atoms that depend on it. Step 1 doesn't re-render. Compare that to Context, where every consumer re-renders on any change.

## The comparison

| Approach | Bundle cost | Re-render behavior | Conditional steps |
|---|---|---|---|
| React Context | 0KB | All consumers re-render | Manual useEffect chains |
| Zustand | ~1.1KB | All subscribers unless manual selectors | Computed selectors |
| Jotai | ~2.9KB | Only affected atom subscribers | Derived atoms |
| Redux Toolkit | ~14KB | Selector-dependent | createSelector chains |

With 1,000 subscribed components, Jotai's atom updates complete in 14ms. For complex tours with interdependent steps, this architecture keeps things fast without manual selector work.

## What you need to know

Tour Kit is a headless library, which means no visual builder. You write steps in code. If your product team needs to create tours without engineering, a no-code tool is a better fit. Tour Kit also requires React 18+ and has a smaller community than React Joyride (603K weekly downloads).

The full tutorial covers: atom setup, connecting atoms to Tour Kit steps, conditional step visibility with derived atoms, building a tour orchestrator, persistence with `atomWithStorage`, and SSR hydration for Next.js.

**Read the complete tutorial with all code examples:** [usertourkit.com/blog/tour-kit-jotai-atomic-state-complex-tour-flows](https://usertourkit.com/blog/tour-kit-jotai-atomic-state-complex-tour-flows)

---

*Suggested Medium publications to submit to: JavaScript in Plain English, Better Programming, Bits and Pieces*

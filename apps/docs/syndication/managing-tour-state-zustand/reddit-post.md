## Subreddit: r/reactjs

**Title:** I wrote up how I manage product tour state with Zustand — typed stores, persistence, and a11y selectors

**Body:**

I've been building product tours in React and kept running into the same problem: React Context re-renders everything when any tour state changes. A tooltip, progress bar, and overlay all subscribing to the same context means advancing one step re-renders components that don't care about the current step.

Switched to Zustand and the pattern clicked. The key things that work well for tour state specifically:

- **No Provider needed** — tour state has to be accessible everywhere (tooltips can render in portals, progress bars live in headers, overlays cover the whole page). Zustand stores just work without wrapping.
- **Atomic selectors** — `useTourStore((s) => s.tours[id]?.currentStep)` means only the tooltip re-renders on step change. The overlay stays still.
- **Persist middleware with `partialize`** — save completion status to localStorage but NOT the active step index. Persisting the step index causes hydration races in Next.js and stale references when you change tour steps between deploys.
- **ARIA selectors** — wrote a `useTourAriaProps` hook that returns `aria-describedby`, `aria-current`, and `aria-label` derived from tour state. Screen readers announce step changes via `aria-live="polite"`.

The whole store is about 70 lines of TypeScript. Actions are intent-based (`advanceStep`, `dismissTour`) not setters (`setCurrentStep`), following TkDodo's Zustand patterns.

One thing I found interesting: nobody seems to write about connecting state management to WCAG for tours. Every ARIA attribute maps to a derived value from the store — it's a natural fit.

Full article with all the code (types, store, selectors, persistence config, a11y hooks, and a comparison table of Context vs Zustand vs Redux for this use case): https://usertourkit.com/blog/managing-tour-state-zustand

Using Tour Kit (a headless tour library I built) for the rendering side, but the Zustand patterns work with any tour library or custom implementation.

Curious if anyone else has strong opinions on state management for UI overlay systems like tours, modals, or notification queues.

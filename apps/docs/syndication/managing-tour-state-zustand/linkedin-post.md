Product tours look simple until you need three of them running in the same app.

Current step tracking, completion persistence, dismissal state, multi-tour coordination, and ARIA announcements for accessibility. React Context re-renders every subscriber on any change — fine for one tour, painful for three.

I wrote a practical guide on using Zustand (~1.2KB, 20M weekly downloads as of April 2026) to manage product tour state in React. The patterns that work best:

- Intent-based actions (advanceStep, not setCurrentStep)
- Atomic selectors so tooltips don't re-render dashboards
- Persist middleware with partialize to save completion status without causing hydration races
- ARIA-aware selector hooks for screen reader support

The whole store is about 70 lines of TypeScript.

Full tutorial with code examples and a Context vs Zustand vs Redux comparison table for tour state:
https://usertourkit.com/blog/managing-tour-state-zustand

#react #javascript #webdevelopment #typescript #opensource

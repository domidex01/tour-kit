# Managing Product Tour State in React with Zustand

## Why React Context isn't enough for multi-tour apps

*Originally published at [usertourkit.com](https://usertourkit.com/blog/managing-tour-state-zustand)*

Product tours have more state than you'd expect. Current step, completion status per tour, dismissed tooltips, user progress that survives page reloads. React Context handles simple cases, but once you're coordinating an onboarding flow, feature discovery hints, and a changelog tour simultaneously, context providers start fighting each other for re-renders.

Zustand ships at roughly 1.2KB gzipped and needs no Provider wrapper. Its selector pattern means your tour tooltip won't re-render your entire dashboard. As of April 2026, Zustand has around 20 million weekly npm downloads, surpassing Redux Toolkit at about 10 million.

This guide covers six steps to build a typed Zustand store for product tours:

1. Define the tour state shape with TypeScript interfaces
2. Create the store with intent-based actions (advanceStep, dismissTour)
3. Write atomic selectors so each component subscribes to only its slice
4. Connect Zustand to a headless tour library (Tour Kit)
5. Add persistence with Zustand's persist middleware
6. Wire up accessibility state for ARIA-aware screen reader announcements

The key insight for persistence: use `partialize` to save only completion status to localStorage, not the active step index. This prevents hydration races when components remount.

For the full tutorial with runnable code examples, comparison table (Zustand vs Context vs Redux for tour state), and troubleshooting guide, read the complete article:

[Managing tour state with Zustand: a practical guide](https://usertourkit.com/blog/managing-tour-state-zustand)

---

**Suggested Medium publications to submit to:**
- JavaScript in Plain English
- Better Programming
- Bits and Pieces

## Thread (6 tweets)

**1/** Product tours have way more state than you'd think. Current step, completion per tour, dismissed tooltips, persistence across sessions, ARIA announcements. React Context falls apart fast when a tooltip, progress bar, and overlay all subscribe to the same state.

**2/** Zustand fixes this at ~1.2KB gzipped. No Provider needed (tour tooltips render in portals, progress bars live in headers — state has to be accessible everywhere). Selector pattern means advancing a step only re-renders the tooltip, not the whole page.

**3/** The persistence pattern matters: use Zustand's `persist` middleware but `partialize` to save ONLY completion status, not the active step index. Persisting the step index causes hydration races in Next.js and stale references when you change steps between deploys.

**4/** Surprising gap in existing content: nobody connects state management to WCAG for tours. But every ARIA attribute (aria-describedby, aria-current, aria-label) maps to a derived Zustand selector. Screen reader announcements via aria-live become trivial.

**5/** Zustand vs Context vs Redux for tour state:
- Context: 0KB, but re-renders everything
- Zustand: ~1.2KB, atomic selectors
- Redux Toolkit: ~11KB, overkill unless you already have it

The whole store is ~70 lines of TypeScript.

**6/** Full tutorial with types, store, selectors, persistence config, a11y hooks, and comparison table:

https://usertourkit.com/blog/managing-tour-state-zustand

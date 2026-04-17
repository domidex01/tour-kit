## Title: Managing product tour state with Zustand – typed stores, persistence, and accessibility selectors

## URL: https://usertourkit.com/blog/managing-tour-state-zustand

## Comment to post immediately after:

Product tours have more state complexity than they appear to — current step, multi-tour coordination, dismissal tracking, persistence across sessions, and ARIA state for accessibility.

React Context re-renders every consumer on any change, which is a real problem when a tooltip, progress bar, and full-page overlay all subscribe to tour state. Zustand's selector pattern solves this at ~1.2KB gzipped.

The interesting part was connecting Zustand selectors to WCAG patterns. Every ARIA attribute (aria-describedby, aria-current, aria-label) maps naturally to a derived value from the tour store. I couldn't find any existing content covering this angle.

Key architectural decisions: actions as intents not setters (advanceStep vs setCurrentStep), persisting only completion status (not active step index) to avoid hydration races, and a registerTour guard that resets state when step counts change between deploys.

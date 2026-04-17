## Subreddit: r/reactjs

**Title:** Patterns for post-activation onboarding in React (behavioral triggers, user segmentation, progressive disclosure)

**Body:**

I've been working on secondary onboarding patterns for a SaaS dashboard and wanted to share what I've found works.

The core insight: the average SaaS feature has a 24.5% adoption rate (median 16.5%), mostly because users never discover features that exist. Primary onboarding gets all the attention, but the real adoption gap happens after activation.

Three patterns that moved the needle for us:

**1. Behavioral triggers over calendar triggers.** Don't show a reporting tour "7 days after signup." Show it when the user creates their third project and hasn't opened reports yet. Gate on what the user has actually done, not how long they've been around.

**2. Hints over full tours.** Post-activation users don't want guided walkthroughs. A small beacon on the target element that expands on click is less disruptive. Five manual data entries before suggesting bulk import. Ten page visits before mentioning keyboard shortcuts.

**3. Segment without a CDP.** Track core action count and advanced action count client-side. Classify users as new/activated/engaged/power and gate different flows on segment. Doesn't need to be more complex than a custom hook reading from localStorage.

The TARS framework from Smashing Magazine (Vitaly Friedman, Dec 2025) gives a useful measurement model: features above 60% adoption don't need nudges, features at 25-35% are the sweet spot for secondary onboarding, features below 20% probably need redesign rather than more tooltips.

I wrote up the full implementation with code examples (React hooks, component patterns, analytics wiring): https://usertourkit.com/blog/secondary-onboarding-feature-adoption

Curious if anyone else has built behavioral-triggered onboarding flows in React and what patterns worked for you.

## Subreddit: r/reactjs

**Title:** I wrote a pattern for managing 20+ product tours with Redux Toolkit slices — here's what worked

**Body:**

Working on an enterprise React app with multiple onboarding flows, feature discovery tours, and role-based walkthroughs. The built-in state from our tour library worked fine for one tour, but once we had 20+ tours across different modules, things got messy. Completion state was scattered, tours would conflict with each other, and debugging "why did step 3 disappear?" was painful.

Ended up building a `tourSlice` with Redux Toolkit that tracks completions, active tours, a queue for chaining flows, and user segments. The `completeTour` reducer auto-dequeues the next tour in line. A bridge hook wires Tour Kit's lifecycle callbacks (`onComplete`, `onClose`) to Redux actions.

The biggest win was Redux DevTools time-travel. On a 12-step flow with conditional branching, DevTools found a bug in under 2 minutes that took 11 minutes with console.log debugging. For context, RTK is at 9.8M weekly downloads as of April 2026 and still dominant in enterprise settings with 5+ devs, even though Zustand leads overall at ~20M.

The break-even point for this pattern: roughly 5+ distinct tours with at least 2 user segments. Below that, React context is fine.

I used Tour Kit (headless tour library, ~8KB core gzipped) but the Redux slice pattern works with any tour library that exposes lifecycle callbacks.

Full writeup with typed slice code, bridge hook, memoized selectors, and troubleshooting: https://usertourkit.com/blog/redux-toolkit-tour-kit-enterprise-state-management

Happy to answer questions about the approach.

## Thread (6 tweets)

**1/** Most product tour libraries manage their own state. Fine for one tour. But 20+ tours, multiple user roles, and 8 developers? That's where it falls apart. Here's the Redux Toolkit pattern I use for enterprise tour state management:

**2/** The core: a typed `tourSlice` with createSlice. It tracks completions, active tour, a queue, user segments, and dismissals. The completeTour reducer auto-dequeues the next tour. One reducer handles tour chaining that used to take 50 lines of callback spaghetti.

**3/** A bridge hook wires Tour Kit's lifecycle callbacks (onComplete, onClose) to Redux actions. Components call start() and the hook coordinates both systems. No tight coupling between the tour library and your store.

**4/** The biggest win: Redux DevTools time-travel debugging. On a 12-step flow with conditional branching, DevTools found the root cause of a blank-step bug in 2 minutes. The console.log approach took 11.

**5/** When NOT to use this: if you have fewer than 5 tours with 1-2 user segments. Tour Kit's built-in TourProvider with usePersistence() handles that fine. Redux adds ceremony without proportional benefit at small scale.

**6/** Full tutorial with typed slice code, bridge hook, memoized selectors, comparison table, and troubleshooting guide:

https://usertourkit.com/blog/redux-toolkit-tour-kit-enterprise-state-management

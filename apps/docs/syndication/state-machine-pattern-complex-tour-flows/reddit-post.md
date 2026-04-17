**Title:** The state machine pattern for complex product tour flows (XState v5 + Tour Kit deep-dive)

**Subreddit:** r/reactjs

**Body:**

I just published a deep-dive on modeling product tours as finite state machines. The TL;DR:

Most tour libraries use an array of steps and a `currentStepIndex` counter. This works for linear tours but breaks down with conditional branching (e.g., developers see different steps than designers), error recovery, or parallel flows.

The article covers:

1. **Why tours are naturally state machines** — states, transitions, guards, and actions map directly to steps, navigation, conditions, and side effects
2. **XState v5 implementation** — full machine definition with `setup()` API, typed context, guarded transitions, and nested states for role-based paths
3. **Tour Kit's built-in alternative** — `onAction` branching, dynamic resolvers, and cross-tour navigation handle most cases without adding XState
4. **Integration pattern** — a bridge component that lets XState own flow logic while Tour Kit handles rendering, positioning, and accessibility
5. **Testing** — unit testing state machines without UI, plus model-based testing with `@xstate/test`
6. **Persistence** — saving/restoring machine snapshots with Tour Kit's storage adapters

The decision framework at the end: use Tour Kit's native branching for 90% of tours, reach for XState when you need parallel states, history, visual debugging, or exhaustive path testing.

Article: https://usertourkit.com/blog/state-machine-pattern-complex-tour-flows

Would be curious if anyone else has used state machines for UI flows like onboarding — what patterns worked or didn't?

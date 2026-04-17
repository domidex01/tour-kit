# The state machine pattern for complex product tour flows

*Originally published at [usertourkit.com](https://usertourkit.com/blog/state-machine-pattern-complex-tour-flows)*

Most product tour implementations use an array of steps and a counter. This works for linear tours but breaks down with conditional branching, parallel flows, or error recovery.

This deep-dive covers modeling product tours as finite state machines using XState v5: guarded transitions for role-based paths, nested states for sub-flows, persistence via snapshots, and model-based testing that auto-generates every reachable path.

It also compares the full XState approach against Tour Kit's built-in branching system, which handles most real-world cases without the extra dependency.

**[Read the full article with code examples](https://usertourkit.com/blog/state-machine-pattern-complex-tour-flows)**

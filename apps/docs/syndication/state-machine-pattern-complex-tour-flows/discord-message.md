**Channel:** #showcase or #react

Hey all — just published a deep-dive on using state machines for product tour navigation.

Most tour implementations use a step array + counter, which gets messy with conditional branching. The article covers modeling tours as XState v5 machines, including guarded transitions, nested states for role-based paths, and model-based testing.

Also shows how Tour Kit's built-in branching handles simpler cases without adding XState.

https://usertourkit.com/blog/state-machine-pattern-complex-tour-flows

Curious if anyone's used XState for similar UI flow problems.

---
title: "The state machine pattern for complex product tour flows"
subtitle: "Model product tours as finite state machines using XState v5 and Tour Kit"
slug: "state-machine-pattern-complex-tour-flows"
canonical: https://usertourkit.com/blog/state-machine-pattern-complex-tour-flows
cover: https://usertourkit.com/og-images/state-machine-pattern-complex-tour-flows.png
tags: react, typescript, xstate, state-machines, web-development
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/state-machine-pattern-complex-tour-flows)*

# The state machine pattern for complex tour flows

Most product tour implementations start the same way: an array of steps, a `currentStepIndex` counter, and next/previous functions. This works for linear tours. It falls apart with conditional branching, parallel flows, or error recovery.

This article explores what happens when you formalize product tours as finite state machines using XState v5, integrate them with Tour Kit's rendering, and eliminate entire categories of bugs from complex flows.

Read the full article with complete code examples, testing patterns, and a decision framework:

**[Read on Tour Kit blog](https://usertourkit.com/blog/state-machine-pattern-complex-tour-flows)**

# Newsletter Pitches

## This Week in React / Sebastien Lorber

**Subject:** State machines for product tours (XState v5 deep-dive)

Hi Sebastien,

I wrote a deep-dive on applying the finite state machine pattern to product tour navigation using XState v5. It covers guarded transitions for role-based onboarding paths, nested states, the bridge pattern for integrating XState with a UI library, and model-based testing.

Might fit the "Libraries" or "React" section:
https://usertourkit.com/blog/state-machine-pattern-complex-tour-flows

---

## Bytes / Tyler McGinnis

**Subject:** Your product tour is already a state machine

Fun angle: most tour libraries manage a `currentStepIndex` counter, which is an implicit state machine without safety guarantees. This article explores what happens when you make it explicit with XState v5 — impossible state prevention, visual debugging for PMs, and auto-generated test paths.

https://usertourkit.com/blog/state-machine-pattern-complex-tour-flows

---

## React Status / Peter Cooper

**Subject:** Modeling React product tours as state machines

Deep-dive on using XState v5 to manage complex onboarding flows: role-based branching via guarded transitions, persistence through state machine snapshots, and a bridge pattern that separates flow logic from UI rendering.

https://usertourkit.com/blog/state-machine-pattern-complex-tour-flows

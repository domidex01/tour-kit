## Thread (7 tweets)

**1/** Your product tour is a state machine. You just haven't formalized it yet.

That `currentStepIndex` counter? It's an implicit state machine without any of the safety guarantees. Here's what happens when you make it explicit:

**2/** Array-based tour navigation has 4 structural problems:

- Impossible states are possible (index = -1)
- Branching requires escape hatches (nested ifs)
- History is implicit (which step did they ACTUALLY see last?)
- Testing is exponential (every path = separate test)

**3/** XState v5 maps perfectly to product tours:

- States = tour steps
- Events = NEXT, PREV, SKIP, SELECT_ROLE
- Guards = "is element visible?", "has permission?"
- Actions = fire analytics, save progress
- Context = accumulated tour data

**4/** But you don't always need XState. Tour Kit has built-in branching:

```tsx
onAction: {
  'select-developer': 'code-editor-step',
  'select-designer': 'canvas-step',
  'skip-onboarding': 'complete'
}
```

Named actions, conditional resolvers, cross-tour nav. Zero extra dependencies.

**5/** When TO reach for XState:

- Parallel tour tracks (main flow + sidebar hints)
- History states (return to "wherever they were")
- Model-based testing (auto-generate every path)
- Visual debugging (Stately Editor for PMs)

**6/** The integration is a bridge pattern: XState owns flow logic, Tour Kit owns rendering.

A TourBridge component syncs XState state changes to Tour Kit's goToStep(). Neither library touches the other's internals.

**7/** Deep dive with full XState v5 machine definition, Tour Kit integration code, persistence via snapshots, and Vitest test examples:

https://usertourkit.com/blog/state-machine-pattern-complex-tour-flows

Start with Tour Kit's native branching. Reach for XState when product asks "can I see every path through this flow?"

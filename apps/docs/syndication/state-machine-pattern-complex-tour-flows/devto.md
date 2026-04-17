---
title: "The state machine pattern for complex product tour flows"
published: false
description: "Model product tours as finite state machines using XState v5. Eliminate impossible states, add conditional branching, and test every path automatically."
tags: react, typescript, xstate, webdev
canonical_url: https://usertourkit.com/blog/state-machine-pattern-complex-tour-flows
cover_image: https://usertourkit.com/og-images/state-machine-pattern-complex-tour-flows.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/state-machine-pattern-complex-tour-flows)*

# The state machine pattern for complex tour flows

Most product tour implementations start the same way: an array of steps, a `currentStepIndex` counter, and next/previous functions that increment or decrement it. This works for linear tours. It falls apart the moment you need conditional branching, parallel flows, or error recovery.

Consider a real scenario: an onboarding tour where step 3 asks the user to choose their role. Developers see a code editor walkthrough. Designers see a canvas tour. Both paths rejoin at a "you're all set" step. With an array-based approach, you're managing this with `if` statements scattered across step definitions, manually tracking which path the user took, and hoping your index arithmetic stays correct as steps change.

## Why array-based step management breaks down

The standard approach has four structural problems:

**1. Impossible states are possible.** Nothing prevents `currentIndex` from being `-1` or `99`. In a state machine, the set of reachable states is defined upfront. If there's no transition from state A to state B, the system cannot reach B from A.

**2. Branching requires escape hatches.** To skip step 2 for designers and step 3 for developers, you need conditional logic in your `next()` function. Add a third role and you've got nested conditionals. State machines model graphs natively.

**3. History is implicit.** If a user goes back from step 4, should they return to step 3 or to the last step they actually visited? XState's history states handle this automatically.

**4. Testing is ad-hoc.** To test every path, you write individual test cases for each permutation. State machines support model-based testing, where a test generator walks every reachable path automatically.

## Modeling a tour as an XState v5 machine

Here's how a role-selection onboarding tour looks as an XState v5 machine:

```typescript
import { setup, assign } from 'xstate'

const onboardingMachine = setup({
  types: {
    context: {} as {
      role: 'developer' | 'designer' | null
      visitedSteps: string[]
    },
    events: {} as
      | { type: 'NEXT' }
      | { type: 'PREV' }
      | { type: 'SKIP' }
      | { type: 'SELECT_ROLE'; role: 'developer' | 'designer' }
  },
  guards: {
    isDeveloper: ({ context }) => context.role === 'developer',
    isDesigner: ({ context }) => context.role === 'designer',
  },
}).createMachine({
  id: 'onboarding',
  initial: 'welcome',
  context: { role: null, visitedSteps: [] },
  states: {
    welcome: {
      on: { NEXT: 'roleSelection', SKIP: 'skipped' },
    },
    roleSelection: {
      on: {
        SELECT_ROLE: [
          { guard: 'isDeveloper', target: 'developerPath' },
          { guard: 'isDesigner', target: 'designerPath' },
        ],
        PREV: 'welcome',
      },
    },
    developerPath: {
      initial: 'codeEditor',
      states: {
        codeEditor: {
          on: { NEXT: 'terminal', PREV: '#onboarding.roleSelection' },
        },
        terminal: {
          on: { NEXT: '#onboarding.completion', PREV: 'codeEditor' },
        },
      },
    },
    designerPath: {
      initial: 'canvas',
      states: {
        canvas: {
          on: { NEXT: 'components', PREV: '#onboarding.roleSelection' },
        },
        components: {
          on: { NEXT: '#onboarding.completion', PREV: 'canvas' },
        },
      },
    },
    completion: { type: 'final' },
    skipped: { type: 'final' },
  },
})
```

The `SELECT_ROLE` event uses guarded transitions: XState evaluates guards in order and takes the first match. Developer and designer paths are nested states with their own internal navigation. Every reachable state is explicitly defined.

## The lighter alternative: built-in branching

Tour Kit already implements key state machine concepts through its branching system:

```tsx
const steps = [
  {
    id: 'role-select',
    target: '#role-picker',
    content: <RoleSelector />,
    onAction: {
      'select-developer': 'code-editor',
      'select-designer': 'design-canvas',
      'skip-onboarding': 'complete',
    },
  },
  // ... steps with onPrev/onNext overrides
]
```

For many tours, this is sufficient. Named actions, conditional resolvers, and cross-tour navigation without adding XState to your bundle.

## When to use which

| Scenario | Approach |
|----------|----------|
| Linear 3-5 step tour | Tour Kit `useTour()` |
| Single branch point | Tour Kit `onAction` |
| Parallel tour tracks | XState parallel states |
| Visual flow review needed | XState + Stately Editor |
| Exhaustive test coverage | XState + `@xstate/test` |

The full article covers the integration pattern, persistence via snapshots, and complete test examples:

https://usertourkit.com/blog/state-machine-pattern-complex-tour-flows

# Branching Logic Specification

## Overview

**Package:** `@tour-kit/core` (extension to existing types/hooks)
**Status:** RFC
**Author:** Claude
**Date:** 2026-01-23

### Problem Statement

Current tour-kit tours are **linear**: Step 1 → Step 2 → Step 3 → Complete. The `when` property allows **filtering** (skip steps that don't match), but not **routing** (go to different steps based on user actions).

**What users need:**
- "User selected 'Developer' → show technical tour path"
- "User clicked 'Skip intro' → jump to step 5"
- "User completed task → go to celebration, else show help"
- "At decision point, show different paths based on data"

### Solution

Add **branching properties** to `TourStep` that resolve the next step dynamically:
- `onNext` - Override default "go to next index" behavior
- `onPrev` - Override default "go to previous index" behavior
- `onAction` - Branch based on named actions triggered from step content

---

## Core Concepts

### 1. Branch Target

A `BranchTarget` is where the tour should go. It can be:

```typescript
type BranchTarget =
  | string                        // Step ID: "step-welcome"
  | number                        // Step index: 3
  | 'next'                        // Default next (index + 1)
  | 'prev'                        // Default prev (index - 1)
  | 'complete'                    // Complete the tour
  | 'skip'                        // Skip/abort the tour
  | 'restart'                     // Restart from beginning
  | { tour: string }              // Start a different tour
  | { tour: string; step: string | number }  // Start different tour at step
  | { skip: number }              // Skip N steps forward
  | { wait: number }              // Wait N ms, then proceed to next
  | null                          // Stay on current step (no-op)
```

### 2. Branch Resolver

A `BranchResolver` is a function that returns a `BranchTarget`:

```typescript
type BranchResolver = (context: BranchContext) => BranchTarget | Promise<BranchTarget>
```

### 3. Branch Context

Extended context passed to branch resolvers:

```typescript
interface BranchContext extends TourCallbackContext {
  // Existing from TourCallbackContext:
  // tourId, isActive, currentStepIndex, currentStep, totalSteps, etc.
  // tour, data

  // New for branching:
  action?: string              // The action ID that triggered this (for onAction)
  actionPayload?: unknown      // Optional payload from the action
  previousStepId?: string      // Where we came from
  visitedSteps: string[]       // Steps visited in this session
  stepVisitCount: Map<string, number>  // How many times each step was visited
}
```

---

## API Design

### Step Properties

```typescript
interface TourStep {
  // ... existing properties ...

  /**
   * Override next step resolution.
   * Called when user clicks "Next" or tour auto-advances.
   *
   * @example Static target
   * onNext: 'step-final'
   *
   * @example Conditional
   * onNext: (ctx) => ctx.data.role === 'dev' ? 'step-technical' : 'step-basic'
   */
  onNext?: BranchTarget | BranchResolver

  /**
   * Override previous step resolution.
   * Called when user clicks "Back".
   *
   * @example Prevent going back
   * onPrev: null
   *
   * @example Custom back behavior
   * onPrev: (ctx) => ctx.previousStepId ?? 'prev'
   */
  onPrev?: BranchTarget | BranchResolver

  /**
   * Branch based on named actions triggered from step content.
   * Actions are triggered via `triggerAction(actionId, payload?)`.
   *
   * @example
   * onAction: {
   *   'select-developer': 'step-dev-intro',
   *   'select-designer': 'step-design-intro',
   *   'skip-personalization': { skip: 3 }
   * }
   */
  onAction?: Record<string, BranchTarget | BranchResolver>
}
```

### New Hook: `useBranch`

```typescript
interface UseBranchReturn {
  /**
   * Trigger a named action on the current step.
   * Resolves the action's branch target and navigates.
   *
   * @example
   * <button onClick={() => triggerAction('select-developer')}>
   *   I'm a Developer
   * </button>
   */
  triggerAction: (actionId: string, payload?: unknown) => Promise<void>

  /**
   * Get available actions for the current step.
   * Useful for rendering dynamic action buttons.
   */
  availableActions: string[]

  /**
   * Check if an action exists on the current step.
   */
  hasAction: (actionId: string) => boolean

  /**
   * Preview where an action would go (for tooltips, etc.)
   * Returns the resolved target without navigating.
   */
  previewAction: (actionId: string, payload?: unknown) => Promise<BranchTarget>
}

function useBranch(): UseBranchReturn
```

### Updated Context Actions

```typescript
interface TourActions {
  // ... existing ...

  /**
   * Navigate to a specific step by ID.
   * More intuitive than goTo(index) for branching.
   */
  goToStep: (stepId: string) => Promise<void>

  /**
   * Start a different tour (for cross-tour branching).
   */
  startTour: (tourId: string, stepId?: string) => Promise<void>
}
```

---

## Usage Examples

### Example 1: Role-Based Branching

```tsx
const tour: Tour = {
  id: 'onboarding',
  steps: [
    {
      id: 'welcome',
      target: '#app',
      content: <WelcomeContent />,
      // After welcome, branch based on user selection
      onAction: {
        'role-developer': 'dev-intro',
        'role-designer': 'design-intro',
        'role-manager': 'manager-intro',
      }
    },
    {
      id: 'dev-intro',
      target: '#code-editor',
      content: 'Let me show you the code editor...',
      onNext: 'dev-advanced',
    },
    {
      id: 'design-intro',
      target: '#canvas',
      content: 'Here\'s where you create designs...',
      onNext: 'design-advanced',
    },
    {
      id: 'manager-intro',
      target: '#dashboard',
      content: 'Your team dashboard shows...',
      onNext: 'final',
    },
    // ... more steps ...
    {
      id: 'final',
      target: '#app',
      content: 'You\'re all set!',
      onNext: 'complete',
    }
  ]
}

// In step content component:
function WelcomeContent() {
  const { triggerAction } = useBranch()

  return (
    <div>
      <h2>What's your role?</h2>
      <button onClick={() => triggerAction('role-developer')}>
        Developer
      </button>
      <button onClick={() => triggerAction('role-designer')}>
        Designer
      </button>
      <button onClick={() => triggerAction('role-manager')}>
        Manager
      </button>
    </div>
  )
}
```

### Example 2: Conditional Branching Based on Data

```tsx
{
  id: 'feature-check',
  target: '#feature-panel',
  content: 'Did you find what you need?',
  onAction: {
    'yes': (ctx) => {
      // Record success, go to completion
      ctx.setData('foundFeature', true)
      return 'success-step'
    },
    'no': (ctx) => {
      // Track for help, show assistance
      ctx.setData('needsHelp', true)
      return 'help-step'
    }
  }
}
```

### Example 3: Dynamic Next Based on Context

```tsx
{
  id: 'task-step',
  target: '#task-area',
  content: 'Complete this task to continue',
  advanceOn: { event: 'custom' },
  onNext: async (ctx) => {
    // Check if user actually completed the task
    const completed = await checkTaskCompletion(ctx.data.taskId)

    if (completed) {
      return 'celebration'
    } else {
      // Stay on step, show encouragement
      return null
    }
  }
}
```

### Example 4: Cross-Tour Branching

```tsx
{
  id: 'advanced-features',
  target: '#advanced-panel',
  content: 'Want to learn about advanced features?',
  onAction: {
    'yes-advanced': { tour: 'advanced-tour' },
    'no-thanks': 'complete'
  }
}
```

### Example 5: Loop Prevention with Visit Tracking

```tsx
{
  id: 'retry-step',
  target: '#form',
  content: 'Try submitting the form',
  onNext: (ctx) => {
    const visits = ctx.stepVisitCount.get('retry-step') ?? 0

    if (visits >= 3) {
      // After 3 attempts, offer to skip
      return 'skip-offer'
    }

    // Check if form was submitted successfully
    if (ctx.data.formSubmitted) {
      return 'success'
    }

    // Stay on this step (will increment visit count)
    return 'retry-step'
  }
}
```

---

## Resolution Algorithm

When `next()` is called:

```
1. Get current step
2. Check if step has `onNext` property
   - If not: use default behavior (currentIndex + 1)
   - If yes: resolve the branch target

3. Resolve branch target:
   a. If target is a function, call it with BranchContext
   b. Await if Promise
   c. Get final BranchTarget value

4. Execute branch target:
   - string (step ID): Find step by ID, navigate to it
   - number (index): Navigate to that index
   - 'next': Default next behavior
   - 'prev': Default prev behavior
   - 'complete': Call complete()
   - 'skip': Call skip()
   - 'restart': Call start(currentTourId, 0)
   - { tour: id }: Call startTour(id)
   - { tour: id, step: s }: Call startTour(id, s)
   - { skip: n }: Navigate to currentIndex + n
   - { wait: ms }: setTimeout then navigate to next
   - null: No-op, stay on current step

5. Apply `when` filter to target step
   - If target step's `when` returns false, find next visible step
   - This preserves existing filtering behavior
```

---

## Type Definitions

```typescript
// === Branch Types ===

/**
 * Target destination for a branch
 */
export type BranchTarget =
  | string                                    // Step ID
  | number                                    // Step index
  | 'next'                                    // Default next
  | 'prev'                                    // Default prev
  | 'complete'                                // Complete tour
  | 'skip'                                    // Skip/abort tour
  | 'restart'                                 // Restart tour
  | BranchToTour                              // Start different tour
  | BranchSkip                                // Skip N steps
  | BranchWait                                // Wait then proceed
  | null                                      // Stay on current step

/**
 * Branch to a different tour
 */
export interface BranchToTour {
  tour: string
  step?: string | number
}

/**
 * Skip forward N steps
 */
export interface BranchSkip {
  skip: number
}

/**
 * Wait before proceeding
 */
export interface BranchWait {
  wait: number  // milliseconds
  then?: BranchTarget  // where to go after (default: 'next')
}

/**
 * Context passed to branch resolvers
 */
export interface BranchContext extends TourCallbackContext {
  /** The action ID that triggered this branch (for onAction) */
  action?: string
  /** Optional payload passed with the action */
  actionPayload?: unknown
  /** ID of the step we came from */
  previousStepId?: string
  /** List of step IDs visited in this tour session */
  visitedSteps: string[]
  /** Count of how many times each step was visited */
  stepVisitCount: Map<string, number>
  /** Helper to set data (same as context.setData) */
  setData: (key: string, value: unknown) => void
}

/**
 * Function that resolves to a branch target
 */
export type BranchResolver = (
  context: BranchContext
) => BranchTarget | Promise<BranchTarget>

/**
 * Branch target or resolver
 */
export type Branch = BranchTarget | BranchResolver

// === Updated TourStep ===

export interface TourStep {
  // ... existing properties ...

  /** Override where "Next" goes */
  onNext?: Branch

  /** Override where "Back" goes */
  onPrev?: Branch

  /** Branch based on named actions */
  onAction?: Record<string, Branch>
}

// === Hook Return Types ===

export interface UseBranchReturn {
  triggerAction: (actionId: string, payload?: unknown) => Promise<void>
  availableActions: string[]
  hasAction: (actionId: string) => boolean
  previewAction: (actionId: string, payload?: unknown) => Promise<BranchTarget>
}
```

---

## Implementation Notes

### 1. Step ID Index Map

For efficient step lookup by ID:

```typescript
// In TourProvider, create a map on tour change
const stepIdMap = useMemo(() => {
  const map = new Map<string, number>()
  currentTour?.steps.forEach((step, index) => {
    map.set(step.id, index)
  })
  return map
}, [currentTour])
```

### 2. Visit Tracking

Track visited steps for loop detection:

```typescript
// Add to TourState
interface TourState {
  // ... existing ...
  visitedSteps: string[]
  stepVisitCount: Map<string, number>
}

// Update on step change
case 'GO_TO_STEP': {
  const stepId = state.tours.get(state.tourId)?.steps[action.stepIndex]?.id
  const newVisited = stepId ? [...state.visitedSteps, stepId] : state.visitedSteps
  const newCount = new Map(state.stepVisitCount)
  if (stepId) {
    newCount.set(stepId, (newCount.get(stepId) ?? 0) + 1)
  }
  return {
    ...state,
    visitedSteps: newVisited,
    stepVisitCount: newCount,
    // ... rest of step update
  }
}
```

### 3. Branching + When Interaction

Branching should work **with** the existing `when` system:

```typescript
async function resolveAndNavigate(target: BranchTarget, context: BranchContext) {
  const stepIndex = resolveTargetToIndex(target, stepIdMap)

  if (stepIndex === null) {
    // Special target (complete, skip, etc.)
    return handleSpecialTarget(target)
  }

  // Check `when` condition on target step
  const targetStep = currentTour.steps[stepIndex]
  const shouldShow = await evaluateStepWhen(targetStep, context)

  if (!shouldShow) {
    // Target step filtered out, find next visible from there
    const visibleIndex = await findNextVisibleStepIndex(
      stepIndex + 1, 1, currentTour.steps, context
    )

    if (visibleIndex === -1) {
      // No visible steps after target, complete
      return complete()
    }

    return navigateToStep(visibleIndex)
  }

  return navigateToStep(stepIndex)
}
```

### 4. Circular Reference Detection

Prevent infinite loops:

```typescript
const MAX_BRANCH_DEPTH = 50

async function resolveBranch(
  branch: Branch,
  context: BranchContext,
  depth = 0
): Promise<BranchTarget> {
  if (depth > MAX_BRANCH_DEPTH) {
    logger.error('Branch resolution exceeded max depth - possible circular reference')
    return 'complete' // Bail out safely
  }

  if (typeof branch === 'function') {
    return branch(context)
  }

  return branch
}
```

### 5. Analytics Events

New events for branching:

```typescript
interface TourKitCallbacks {
  // ... existing ...

  /** Called when a branch action is triggered */
  onBranchAction?: (
    tourId: string,
    stepId: string,
    actionId: string,
    target: BranchTarget
  ) => void

  /** Called when branching to a different tour */
  onTourBranch?: (
    fromTourId: string,
    toTourId: string,
    fromStepId: string
  ) => void
}
```

---

## Migration / Backward Compatibility

This is **fully backward compatible**:

- Steps without `onNext`/`onPrev`/`onAction` work exactly as before
- Linear tours continue to work with no changes
- `when` filtering continues to work, applied after branch resolution

---

## Testing Checklist

- [ ] Basic onNext with step ID
- [ ] Basic onNext with step index
- [ ] onNext with 'complete'
- [ ] onNext with 'skip'
- [ ] onNext with 'restart'
- [ ] onNext with { tour: id }
- [ ] onNext with { skip: n }
- [ ] onNext with { wait: ms }
- [ ] onNext with null (stay)
- [ ] onNext with async resolver
- [ ] onPrev override
- [ ] onPrev: null (disable back)
- [ ] onAction with multiple actions
- [ ] onAction with payload
- [ ] triggerAction hook
- [ ] hasAction / availableActions
- [ ] previewAction
- [ ] Branch + when interaction
- [ ] Visit tracking
- [ ] Circular reference detection
- [ ] Cross-tour branching
- [ ] Analytics events

---

## Open Questions

1. **Should `onAction` auto-advance or require explicit navigation?**
   - Current design: Auto-navigates to resolved target
   - Alternative: Just set data, user must click Next

2. **Should we support OR conditions in onAction?**
   ```typescript
   onAction: {
     ['yes', 'definitely']: 'positive-path',  // Multiple actions → same target
   }
   ```

3. **Should wait support cancellation?**
   ```typescript
   { wait: 5000, cancelOnInteraction: true }
   ```

4. **Should we add a `branch()` helper for complex conditions?**
   ```typescript
   import { branch } from '@tour-kit/core'

   onNext: branch()
     .when(ctx => ctx.data.premium, 'premium-features')
     .when(ctx => ctx.data.trial, 'trial-upsell')
     .else('standard-path')
   ```

---

## Timeline Estimate

| Phase | Tasks | Complexity |
|-------|-------|------------|
| 1. Types | BranchTarget, BranchContext, updated TourStep | Low |
| 2. Resolution | resolveBranch, resolveTargetToIndex | Medium |
| 3. Navigation | Update next/prev/goTo to use branching | Medium |
| 4. useBranch Hook | triggerAction, availableActions, etc. | Medium |
| 5. Visit Tracking | State updates, context extension | Low |
| 6. Analytics | New events | Low |
| 7. Tests | Comprehensive test suite | Medium |
| 8. Docs | API docs, examples, migration guide | Medium |

---

## Summary

Branching transforms tour-kit from a **linear tour library** into a **personalized onboarding engine**. The design:

- **Integrates seamlessly** with existing `when` filtering
- **Backward compatible** - no breaking changes
- **Flexible** - supports static targets, functions, async resolution
- **Safe** - includes circular reference detection, visit tracking
- **Extensible** - cross-tour branching, action payloads, analytics hooks

This is the **core differentiator** that positions tour-kit above competitors.

# Phase 8 — Tour-Kit Integration

**Duration:** Days 28–29 (~8h)
**Depends on:** Phase 1 (types, provider, `useAiChat`), Phase 2 (system prompt builder)
**Blocks:** Phase 9 (documentation, examples, final quality)
**Risk Level:** MEDIUM — optional peer dependency pattern requires careful runtime detection; must not break when `@tour-kit/core` is absent
**Stack:** react, typescript

---

## 1. Objective + What Success Looks Like

Build an optional integration layer between `@tour-kit/ai` and `@tour-kit/core` via a `useTourAssistant` hook. When `@tour-kit/core` is installed and wrapped in a `TourProvider`, the AI chat gains awareness of the active tour, current step, completed tours, and checklist progress. When `@tour-kit/core` is **not** installed, the hook degrades gracefully — no import errors, no crashes, no conditional `require()` hacks.

**Success looks like:**

- `useTourAssistant()` returns the same API as `useAiChat()` plus `tourContext`, `suggestions`, `askAboutStep()`, and `askForHelp()`
- The active tour's name, current step index, step title, and step content appear in the system prompt sent to the LLM
- Calling `askAboutStep()` while on step 3 of "Onboarding Tour" sends a user message like: *"Can you help me with the current step? I'm on step 3 of the Onboarding Tour: 'Connect your data source'"*
- When `@tour-kit/core` is not installed, `tourContext` returns all-null values and the hook works identically to `useAiChat()`

---

## 2. Key Design Decisions

### 2.1 Optional peer dependency detection

`@tour-kit/core` is listed as an **optional** `peerDependency` in `packages/ai/package.json`. At runtime, the hook attempts to read from the tour context using React's `useContext` with a fallback:

```typescript
// DO NOT dynamically import @tour-kit/core.
// Instead, accept the TourContext object via a React context bridge
// or use useContext with a null fallback.
```

The chosen pattern: **context bridge via `AiChatProvider`**. The provider optionally accepts a `tourContext` prop (or reads from `TourContext` if available). The hook never imports `@tour-kit/core` directly — it reads from a local context that the provider populates.

**Why this pattern:**
- No dynamic `import()` or `require()` — works with all bundlers
- No try/catch around module resolution — no side effects
- Tree-shaking safe — `@tour-kit/core` code only included if the app already uses it
- SSR safe — no `window` checks needed

### 2.2 Tour context assembly

The `TourAssistantContext` is assembled from `@tour-kit/core`'s `TourContextValue` (specifically `TourState`):

| `TourState` field | Maps to `TourAssistantContext` |
|---|---|
| `tourId`, `tour.name` | `activeTour.id`, `activeTour.name` |
| `currentStepIndex`, `totalSteps` | `activeTour.currentStep`, `activeTour.totalSteps` |
| `currentStep.id`, `currentStep.title`, `currentStep.content` | `activeStep.id`, `activeStep.title`, `activeStep.content` |
| `completedTours` | `completedTours` |
| *(external — `@tour-kit/checklists`)* | `checklistProgress` (null when checklists not present) |

### 2.3 System prompt injection

When `tourContext: true` is set in `AiChatConfig`, the provider sends the serialized `TourAssistantContext` as an additional field in the chat request body. The server-side `createChatRouteHandler` reads this field and appends a tour context section to the system prompt:

```
## Current User Context
The user is currently viewing step 3 of 5 in the "Onboarding Tour".
Step title: "Connect your data source"
Step content: "Click the 'Add Connection' button to connect your first data source."
Previously completed tours: getting-started, workspace-setup
```

This keeps the server stateless — the client sends the context snapshot with each request.

### 2.4 Convenience methods

`askAboutStep()` and `askForHelp()` are thin wrappers around `sendMessage()` that compose a natural-language question from the current tour context. They are no-ops (with a console.warn) when no active step exists.

---

## 3. Tasks

### 3.1 Tour context bridge in `AiChatProvider` (1h)

**File:** `packages/ai/src/context/ai-chat-provider.tsx` (modify existing)

Add an optional `tourContextValue` to the provider's internal state. The provider attempts to read from `@tour-kit/core`'s context **only** if the consumer has set `tourContext: true` in config. Use a safe context reader that returns `null` instead of throwing:

```typescript
// In ai-chat-provider.tsx — add this internal helper
function useTourContextSafe(): TourContextValue | null {
  // TourContext from @tour-kit/core is a React context.
  // We import the context OBJECT (not the hook) to avoid the throw.
  // If @tour-kit/core is not installed, this import will be undefined.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { TourContext } = require('@tour-kit/core')
    // useContext returns null if no provider is above — no throw
    return useContext(TourContext) ?? null
  } catch {
    return null
  }
}
```

**Alternative (preferred if bundler issues arise):** Accept `tourContextValue` as an explicit prop on `AiChatProvider` that the user passes manually. This avoids any direct import of `@tour-kit/core` inside the AI package.

**Deliverable:** Provider can hold tour context state, null when unavailable.

### 3.2 `TourAssistantContext` assembly (1–2h)

**File:** `packages/ai/src/hooks/use-tour-assistant.ts` (new)

Create the `assembleTourContext` function that maps `TourContextValue` (from core) to `TourAssistantContext`:

```typescript
// ── Types ──

export interface TourAssistantContext {
  activeTour: {
    id: string
    name: string
    currentStep: number
    totalSteps: number
  } | null
  activeStep: {
    id: string
    title: string
    content: string
  } | null
  completedTours: string[]
  checklistProgress: { completed: number; total: number } | null
}

// ── Assembly function ──

function assembleTourContext(
  tourState: TourContextValue | null
): TourAssistantContext {
  if (!tourState || !tourState.isActive) {
    return {
      activeTour: null,
      activeStep: null,
      completedTours: tourState?.completedTours ?? [],
      checklistProgress: null,
    }
  }

  return {
    activeTour: {
      id: tourState.tourId!,
      name: tourState.tour?.name ?? tourState.tourId!,
      currentStep: tourState.currentStepIndex,
      totalSteps: tourState.totalSteps,
    },
    activeStep: tourState.currentStep
      ? {
          id: tourState.currentStep.id,
          title: tourState.currentStep.title ?? '',
          content:
            typeof tourState.currentStep.content === 'string'
              ? tourState.currentStep.content
              : '',
        }
      : null,
    completedTours: tourState.completedTours,
    checklistProgress: null, // populated by checklists integration if available
  }
}
```

**Deliverable:** Pure function, fully typed, zero side effects. Memoize with `useMemo` inside the hook.

### 3.3 Tour context injection into system prompt (1–2h)

**Files:**
- `packages/ai/src/server/system-prompt.ts` (modify existing)
- `packages/ai/src/server/route-handler.ts` (modify existing)

**Step 1:** Add a `tourContext` field to the request body schema in the route handler:

```typescript
// In route-handler.ts — extend the request body parsing
interface ChatRequestBody {
  messages: UIMessage[]
  tourContext?: TourAssistantContext // optional, sent by client when tourContext: true
}
```

**Step 2:** In `createSystemPrompt()`, add a new optional section:

```typescript
export function createSystemPrompt(
  options: SystemPromptOptions & {
    tourContext?: TourAssistantContext
  }
): string {
  // ... existing 3-layer assembly ...

  // Layer 4 (optional): Tour context
  if (options.tourContext?.activeTour) {
    const { activeTour, activeStep, completedTours } = options.tourContext
    sections.push(
      `## Current User Context`,
      `The user is currently on step ${activeTour.currentStep + 1} of ${activeTour.totalSteps} in the "${activeTour.name}" tour.`,
      activeStep
        ? `Step title: "${activeStep.title}"\nStep content: "${activeStep.content}"`
        : '',
      completedTours.length > 0
        ? `Previously completed tours: ${completedTours.join(', ')}`
        : 'No tours completed yet.',
    )
  }

  return sections.filter(Boolean).join('\n\n')
}
```

**Step 3:** In the provider, include `tourContext` in the request body sent to the API endpoint when `config.tourContext` is `true`:

```typescript
// In AiChatProvider — pass tourContext in the body option of useChat
const { messages, status, ... } = useChat({
  api: config.endpoint,
  body: config.tourContext ? { tourContext: assembledTourContext } : undefined,
  // ...
})
```

**Deliverable:** Tour context flows from client provider to server system prompt. Absent when `tourContext: false` or core not installed.

### 3.4 `useTourAssistant` hook with convenience methods (2–3h)

**File:** `packages/ai/src/hooks/use-tour-assistant.ts` (continue from 3.2)

```typescript
export interface UseTourAssistantReturn extends UseAiChatReturn {
  /** Contextual suggestions based on current tour/step */
  suggestions: string[]
  /** Ask the AI about the current step — no-op if no active step */
  askAboutStep(): void
  /** Ask the AI for help on a topic — uses tour context if available */
  askForHelp(topic?: string): void
  /** Current tour context snapshot */
  tourContext: TourAssistantContext
}

export function useTourAssistant(): UseTourAssistantReturn {
  const chat = useAiChat()
  const tourState = useAiChatContext().tourContextValue // from provider

  const tourContext = useMemo(
    () => assembleTourContext(tourState),
    [tourState]
  )

  const suggestions = useMemo(() => {
    if (!tourContext.activeStep) return []
    return [
      `What does "${tourContext.activeStep.title}" do?`,
      'Can you explain this step?',
      'What should I do next?',
    ]
  }, [tourContext.activeStep])

  const askAboutStep = useCallback(() => {
    if (!tourContext.activeTour || !tourContext.activeStep) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[tour-kit/ai] askAboutStep() called with no active step. Message not sent.'
        )
      }
      return
    }
    const { activeTour, activeStep } = tourContext
    chat.sendMessage({
      text: `Can you help me with the current step? I'm on step ${activeTour.currentStep + 1} of ${activeTour.totalSteps} in the "${activeTour.name}" tour: "${activeStep.title}"`,
    })
  }, [tourContext, chat])

  const askForHelp = useCallback(
    (topic?: string) => {
      const base = tourContext.activeTour
        ? `I'm currently in the "${tourContext.activeTour.name}" tour (step ${tourContext.activeTour.currentStep + 1}/${tourContext.activeTour.totalSteps}).`
        : ''
      const question = topic
        ? `${base} Can you help me with: ${topic}`
        : `${base} I need help with this step.`
      chat.sendMessage({ text: question.trim() })
    },
    [tourContext, chat]
  )

  return {
    ...chat,
    suggestions,
    askAboutStep,
    askForHelp,
    tourContext,
  }
}
```

**Deliverable:** Fully typed hook. When `@tour-kit/core` is absent, `tourContext` is all-null and convenience methods warn + no-op.

### 3.5 Tests with mock `@tour-kit/core` provider (1–2h)

**File:** `packages/ai/src/__tests__/hooks/use-tour-assistant.test.tsx` (new)

Test cases:

1. **Tour context assembly — active tour:** Render hook inside a mock `TourContext.Provider` with active tour state. Assert `tourContext.activeTour` matches expected values.
2. **Tour context assembly — no tour:** Render hook with `TourContext` providing inactive state. Assert `activeTour` is null, `completedTours` is populated.
3. **Tour context assembly — no provider:** Render hook without any `TourContext`. Assert all fields are null/empty (graceful fallback).
4. **`askAboutStep()` — active step:** Assert `sendMessage` is called with a message containing the step title and tour name.
5. **`askAboutStep()` — no active step:** Assert `sendMessage` is NOT called. Assert console.warn is called in dev mode.
6. **`askForHelp()` — with topic:** Assert message contains the topic string and tour context prefix.
7. **`askForHelp()` — without topic:** Assert message contains generic help request with tour context.
8. **Suggestions generation:** Assert suggestions array contains step-relevant strings when a step is active. Assert empty array when no step.
9. **System prompt injection:** Mock the route handler, send a request with `tourContext` in body. Assert the system prompt string contains "Current User Context" and the step title.
10. **No tour context in request:** Send a request without `tourContext` in body. Assert system prompt does NOT contain "Current User Context" section.

**Mock strategy:**

```typescript
// Mock TourContext provider
import { TourContext } from '@tour-kit/core'

const mockTourState: TourContextValue = {
  tourId: 'onboarding',
  isActive: true,
  currentStepIndex: 2,
  totalSteps: 5,
  currentStep: {
    id: 'step-connect',
    title: 'Connect your data source',
    content: 'Click the Add Connection button to connect your first data source.',
    // ... other required TourStep fields with defaults
  },
  tour: { id: 'onboarding', name: 'Onboarding Tour', steps: [] },
  completedTours: ['getting-started'],
  skippedTours: [],
  visitedSteps: ['step-welcome', 'step-profile', 'step-connect'],
  stepVisitCount: new Map(),
  previousStepId: 'step-profile',
  isLoading: false,
  isTransitioning: false,
  data: {},
  // ... mock TourActions (start, next, prev, goTo, complete, skip, etc.)
}

// Wrap in provider for test
render(
  <TourContext.Provider value={mockTourState}>
    <AiChatProvider config={{ endpoint: '/api/chat', tourContext: true }}>
      <TestComponent />
    </AiChatProvider>
  </TourContext.Provider>
)
```

Use `vi.mock` to mock `useAiChat` return value so tests focus on the tour integration logic, not the chat mechanics.

**Deliverable:** 10 test cases, all passing. Coverage > 80% for `use-tour-assistant.ts`.

---

## 4. Deliverables

| File | Type | Description |
|------|------|-------------|
| `packages/ai/src/hooks/use-tour-assistant.ts` | New | `useTourAssistant` hook + `assembleTourContext` + types |
| `packages/ai/src/context/ai-chat-provider.tsx` | Modified | Add `useTourContextSafe()` bridge, pass `tourContext` in request body |
| `packages/ai/src/server/system-prompt.ts` | Modified | Add optional tour context section to prompt assembly |
| `packages/ai/src/server/route-handler.ts` | Modified | Parse `tourContext` from request body, pass to `createSystemPrompt` |
| `packages/ai/src/types/config.ts` | Modified | Add `tourContext?: boolean` to `AiChatConfig` (if not already present) |
| `packages/ai/src/__tests__/hooks/use-tour-assistant.test.tsx` | New | 10 test cases covering all hook behaviors |
| `packages/ai/package.json` | Modified | Add `@tour-kit/core` as optional `peerDependency` |

---

## 5. Exit Criteria

- [ ] `useTourAssistant().tourContext.activeTour` reflects current tour state from `@tour-kit/core`
- [ ] `askAboutStep()` sends a message containing the current step title and tour name
- [ ] `askForHelp('billing')` sends a message with the topic and tour context prefix
- [ ] Tour context appears in the system prompt sent to the LLM (verified by inspecting request body and prompt output)
- [ ] Package installs and works normally when `@tour-kit/core` is **not** installed — no import errors, `tourContext` returns all-null values
- [ ] `suggestions` returns step-relevant strings when a tour step is active, empty array otherwise
- [ ] `@tour-kit/core` is listed as an optional `peerDependency` in `package.json`
- [ ] All 10 test cases pass: `pnpm --filter @tour-kit/ai test`
- [ ] `pnpm --filter @tour-kit/ai typecheck` passes with zero errors
- [ ] `pnpm --filter @tour-kit/ai build` succeeds

---

## 6. Execution Prompt

You are implementing Phase 8 of the `@tour-kit/ai` package: **Tour-Kit Integration**. This phase adds an optional integration with `@tour-kit/core` that enriches the AI chat with tour context.

### Context

- **Monorepo:** pnpm + Turborepo at `/tour-kit/`
- **Package:** `packages/ai/` — a drop-in RAG Q&A chat widget for React
- **Core package:** `packages/core/` — headless tour engine with `TourContext`, `TourProvider`, `useTourContext`
- **Existing from Phase 1:** `AiChatProvider`, `useAiChat` hook, `AiChatConfig` type
- **Existing from Phase 2:** `createSystemPrompt()`, `createChatRouteHandler()`
- **Testing:** Vitest + React Testing Library

### Critical constraint

`@tour-kit/core` is an **optional** peer dependency. The AI package must NEVER hard-import from `@tour-kit/core` at the module level. Use one of:
1. A safe `useContext` with null fallback (preferred)
2. Dynamic `require()` wrapped in try/catch
3. Accept tour context as an explicit prop on `AiChatProvider`

The package must pass `pnpm build` and all tests when `@tour-kit/core` is NOT in `node_modules`.

### Types to implement

```typescript
// ── packages/ai/src/hooks/use-tour-assistant.ts ──

export interface UseTourAssistantReturn extends UseAiChatReturn {
  suggestions: string[]
  askAboutStep(): void
  askForHelp(topic?: string): void
  tourContext: TourAssistantContext
}

export interface TourAssistantContext {
  activeTour: {
    id: string
    name: string
    currentStep: number
    totalSteps: number
  } | null
  activeStep: {
    id: string
    title: string
    content: string
  } | null
  completedTours: string[]
  checklistProgress: { completed: number; total: number } | null
}
```

### File-by-file implementation guide

**1. `packages/ai/package.json`** — Add to `peerDependencies`:
```json
"@tour-kit/core": ">=0.1.0"
```
Add to `peerDependenciesMeta`:
```json
"@tour-kit/core": { "optional": true }
```

**2. `packages/ai/src/context/ai-chat-provider.tsx`** — Modify:
- Add an internal `useTourContextSafe()` helper that uses `useContext` with try/catch around the `require('@tour-kit/core')` to get the `TourContext` object. Returns `TourContextValue | null`.
- If `config.tourContext` is `true`, call `useTourContextSafe()` and store the result.
- Pass the assembled `TourAssistantContext` in the `body` option of `useChat()` so it reaches the server.
- Export the tour context value via the internal context so `useTourAssistant` can read it.

**3. `packages/ai/src/hooks/use-tour-assistant.ts`** — New file:
- Export `TourAssistantContext` and `UseTourAssistantReturn` interfaces.
- Implement `assembleTourContext(tourState: unknown): TourAssistantContext` — maps `@tour-kit/core`'s `TourContextValue` fields. Use defensive access (`?.`) since the type is `unknown` from the consumer's perspective.
- Implement `useTourAssistant(): UseTourAssistantReturn` — calls `useAiChat()`, reads tour context from provider's internal context, assembles context, provides `askAboutStep()`, `askForHelp()`, and `suggestions`.
- `askAboutStep()` — calls `sendMessage()` with: `"Can you help me with the current step? I'm on step {n} of {total} in the \"{tourName}\" tour: \"{stepTitle}\""`. No-op with console.warn if no active step.
- `askForHelp(topic?)` — calls `sendMessage()` with tour context prefix + topic. Works even without active tour (just sends topic).
- `suggestions` — memoized array: when active step exists, return `["What does \"{stepTitle}\" do?", "Can you explain this step?", "What should I do next?"]`. Empty array otherwise.

**4. `packages/ai/src/server/system-prompt.ts`** — Modify:
- Add optional `tourContext?: TourAssistantContext` parameter to `createSystemPrompt()`.
- When present and `activeTour` is not null, append a `## Current User Context` section to the prompt with: tour name, step number, step title, step content, and completed tours list.

**5. `packages/ai/src/server/route-handler.ts`** — Modify:
- Parse `tourContext` from the request body (JSON).
- Pass it to `createSystemPrompt()` when assembling the prompt.

**6. `packages/ai/src/__tests__/hooks/use-tour-assistant.test.tsx`** — New file:
- 10 test cases (see Tasks 3.5 for full list).
- Mock `useAiChat` via `vi.mock('../use-ai-chat')`.
- Mock `@tour-kit/core` module with a real `TourContext` React context for provider wrapping.
- Use `renderHook` from `@testing-library/react`.
- Test the graceful fallback by rendering WITHOUT the mock TourContext provider.

### Commands to verify

```bash
# Build the package
pnpm --filter @tour-kit/ai build

# Type check
pnpm --filter @tour-kit/ai typecheck

# Run tests
pnpm --filter @tour-kit/ai test

# Run only phase 8 tests
pnpm --filter @tour-kit/ai test use-tour-assistant
```

### Acceptance checks

After implementation, verify:
1. `pnpm --filter @tour-kit/ai build` — zero errors
2. `pnpm --filter @tour-kit/ai typecheck` — zero errors
3. All 10 tests pass
4. Temporarily remove `@tour-kit/core` from `node_modules` and confirm `pnpm --filter @tour-kit/ai build` still succeeds (optional peer dep)

---

## Readiness Check

Before starting Phase 8, confirm:

- [ ] Phase 1 is complete: `AiChatProvider`, `useAiChat`, `AiChatConfig` type, and `AiChatContext` all exist and work
- [ ] Phase 2 is complete: `createSystemPrompt()` and `createChatRouteHandler()` exist and accept configuration
- [ ] `packages/ai/` builds successfully: `pnpm --filter @tour-kit/ai build`
- [ ] `packages/core/` exports `TourContext` (the React context object) — verify with: `grep "export.*TourContext" packages/core/src/context/tour-context.ts`
- [ ] Vitest is configured in `packages/ai/` and at least one test runs: `pnpm --filter @tour-kit/ai test`
- [ ] You have read `packages/core/src/types/state.ts` to understand the `TourState` and `TourContextValue` interfaces

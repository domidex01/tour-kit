# Phase 6 — Persistence

**Duration:** Days 22–23 (~6h)
**Depends on:** Phase 1 (provider, types, `AiChatProvider`, `AiChatConfig`, `UIMessage`)
**Blocks:** Phase 9 (docs, examples, final quality)
**Risk Level:** LOW — well-scoped feature with a clear interface boundary; localStorage is synchronous and deterministic; the async adapter path adds minimal complexity
**Stack:** react, typescript

---

## 1. Objective + What Success Looks Like

**Objective:** Chat messages persist across page reloads. Users can close their browser, return later, and see the same conversation. The system supports two modes: a zero-config `'local'` mode (localStorage) and a pluggable `PersistenceAdapter` for server-side or custom storage backends.

**What success looks like:**

- `persistence: 'local'` — user sends messages, refreshes page, messages are restored automatically
- `persistence: { adapter: myServerAdapter }` — adapter's `save` is called on every message change; `load` is called on mount; `clear` is called when the user resets the chat
- No persistence configured — no localStorage writes, no adapter calls, zero overhead
- Clearing chat via `useAiChat().setMessages([])` triggers `clear()` on the adapter and removes stored data
- The chat ID is stable per provider instance (configurable via `chatId` prop on `AiChatProvider`)

---

## 2. Key Design Decisions

### 2.1 Persistence lives in the provider, not the hook consumer

`usePersistence` is an internal hook consumed by `AiChatProvider`. External consumers never call it directly — they interact with persistence through `useAiChat().messages` (auto-loaded) and `useAiChat().setMessages([])` (triggers clear). This keeps the API surface minimal.

### 2.2 Chat ID strategy

Each `AiChatProvider` instance gets a `chatId` (default: `'default'`). The localStorage key is `tourkit-ai-chat:{chatId}`. Custom adapters receive this `chatId` in all calls. This supports multiple independent chat widgets on the same page.

### 2.3 Debounced saves

Messages change on every streaming token. Saving on every change would thrash localStorage. The hook debounces saves with a 500ms trailing delay. The final save always fires (including on unmount via `useEffect` cleanup).

### 2.4 Serialization format

localStorage stores `JSON.stringify(messages)` where `messages` is `UIMessage[]` from AI SDK 6. On load, the hook parses and validates the array — if parsing fails, it returns `null` (no restore, no crash).

### 2.5 Adapter errors are non-fatal

If `adapter.save()` or `adapter.load()` throws, the error is caught and logged via `console.warn`. Chat continues working without persistence. This prevents a broken adapter from crashing the entire chat experience.

---

## 3. Tasks

### Task 6.1 — `usePersistence` hook with localStorage adapter (2h)

**File:** `packages/ai/src/hooks/use-persistence.ts`

Create the internal persistence hook that manages save/load/clear lifecycle.

**Data Model Rules:**
- All types must be defined in `packages/ai/src/types/` and imported — never inline type definitions in hook files
- `UIMessage` comes from `@ai-sdk/react` — import it as a type-only import
- The hook is internal (not exported from package `index.ts`)

**Type definitions (from `packages/ai/src/types/config.ts`):**

```typescript
type PersistenceConfig =
  | 'local'
  | { adapter: PersistenceAdapter }

interface PersistenceAdapter {
  save(chatId: string, messages: UIMessage[]): Promise<void>
  load(chatId: string): Promise<UIMessage[] | null>
  clear(chatId: string): Promise<void>
}
```

**Hook signature:**

```typescript
interface UsePersistenceOptions {
  chatId: string
  persistence?: PersistenceConfig
  onError?: (error: Error) => void
}

interface UsePersistenceReturn {
  /** Load messages from storage. Returns null if none found or persistence disabled. */
  loadMessages(): Promise<UIMessage[] | null>
  /** Save messages to storage. Debounced internally for 'local' mode. */
  saveMessages(messages: UIMessage[]): void
  /** Clear all stored messages for this chatId. */
  clearMessages(): Promise<void>
  /** Whether persistence is enabled. */
  isEnabled: boolean
}

function usePersistence(options: UsePersistenceOptions): UsePersistenceReturn
```

**Implementation guidance:**

1. If `persistence` is `undefined`, return no-op implementations with `isEnabled: false`
2. If `persistence` is `'local'`:
   - `loadMessages`: read from `localStorage.getItem('tourkit-ai-chat:{chatId}')`, parse JSON, validate it's an array, return it or `null`
   - `saveMessages`: debounce 500ms, then `localStorage.setItem('tourkit-ai-chat:{chatId}', JSON.stringify(messages))`
   - `clearMessages`: `localStorage.removeItem('tourkit-ai-chat:{chatId}')`
3. If `persistence` is `{ adapter }`:
   - `loadMessages`: call `adapter.load(chatId)`, catch errors
   - `saveMessages`: call `adapter.save(chatId, messages)`, catch errors
   - `clearMessages`: call `adapter.clear(chatId)`, catch errors
4. Wrap all localStorage and adapter calls in try/catch — on error, call `onError` if provided, otherwise `console.warn`
5. Use `useCallback` for all returned functions, `useRef` for the debounce timer
6. SSR safety: guard localStorage access with `typeof window !== 'undefined'`
7. Flush pending debounced save on unmount via `useEffect` cleanup

**localStorage helper (inline in hook file):**

```typescript
const STORAGE_PREFIX = 'tourkit-ai-chat'

function getStorageKey(chatId: string): string {
  return `${STORAGE_PREFIX}:${chatId}`
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}
```

---

### Task 6.2 — Wire persistence into `AiChatProvider` (1–2h)

**File:** `packages/ai/src/context/ai-chat-provider.tsx`

Integrate `usePersistence` into the existing provider. The provider already manages `useChat` from `@ai-sdk/react`.

**Changes required:**

1. Add `chatId?: string` to `AiChatConfig` (default: `'default'`):

```typescript
// In packages/ai/src/types/config.ts
interface AiChatConfig {
  // ... existing fields ...
  /** Unique chat ID for persistence (default: 'default') */
  chatId?: string
  /** Chat persistence */
  persistence?: PersistenceConfig
}
```

2. In `AiChatProvider`, call `usePersistence({ chatId, persistence })` and wire it:
   - Pass `loadMessages` result as `initialMessages` to `useChat` (requires `useState` + `useEffect` for async load)
   - Call `saveMessages` whenever `messages` changes (via `useEffect` with `messages` dependency)
   - Override `setMessages` to also call `clearMessages` when messages is set to empty array

3. Loading state management:
   - Add `isPersistenceLoading: boolean` state — `true` until `loadMessages` resolves
   - While loading, do not render children (or render with empty messages) to avoid flash of empty state
   - Expose `isPersistenceLoading` in context if needed

**Provider integration pattern:**

```typescript
function AiChatProvider({ config, children }: AiChatProviderProps) {
  const chatId = config.chatId ?? 'default'
  const { loadMessages, saveMessages, clearMessages, isEnabled } = usePersistence({
    chatId,
    persistence: config.persistence,
  })

  const [initialMessages, setInitialMessages] = useState<UIMessage[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(isEnabled)

  // Load on mount
  useEffect(() => {
    if (!isEnabled) return
    loadMessages().then((messages) => {
      if (messages) setInitialMessages(messages)
      setIsLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // AI SDK useChat with initial messages
  const chat = useChat({
    api: config.endpoint,
    initialMessages,
    // ... other options
  })

  // Auto-save on message change
  useEffect(() => {
    if (!isEnabled || isLoading) return
    saveMessages(chat.messages)
  }, [chat.messages]) // eslint-disable-line react-hooks/exhaustive-deps

  // Wrap setMessages to handle clear
  const setMessages = useCallback((messages: UIMessage[]) => {
    chat.setMessages(messages)
    if (messages.length === 0) {
      clearMessages()
    }
  }, [chat.setMessages, clearMessages])

  // ... rest of provider
}
```

---

### Task 6.3 — Auto-save on message change, auto-load on mount (1h)

This task is integrated into Task 6.2 above. The specific behaviors to verify:

1. **Auto-load on mount:** When `AiChatProvider` mounts with `persistence: 'local'`, it reads localStorage and passes loaded messages to `useChat` as `initialMessages`
2. **Auto-save on change:** When `chat.messages` changes (new user message, streaming AI response completes), `saveMessages` is called. For `'local'` mode this is debounced 500ms.
3. **Clear on reset:** When `setMessages([])` is called (user clicks "Clear chat"), `clearMessages()` runs — removing the localStorage key or calling `adapter.clear(chatId)`
4. **No double-save on mount:** The `useEffect` that auto-saves should skip the initial render when messages are loaded from persistence (use a ref flag `hasHydrated`)

---

### Task 6.4 — Unit tests (1–2h)

**File:** `packages/ai/src/__tests__/hooks/use-persistence.test.ts`

**Test structure:**

```typescript
describe('usePersistence', () => {
  describe('disabled (no persistence config)', () => {
    it('returns isEnabled: false')
    it('loadMessages returns null')
    it('saveMessages is a no-op')
    it('clearMessages is a no-op')
  })

  describe('local mode', () => {
    it('saves messages to localStorage with correct key')
    it('loads messages from localStorage')
    it('returns null when no stored messages exist')
    it('returns null when stored data is invalid JSON')
    it('returns null when stored data is not an array')
    it('clears messages from localStorage')
    it('debounces save calls (only last write within 500ms persists)')
    it('flushes pending save on unmount')
    it('handles localStorage quota exceeded gracefully')
    it('handles SSR environment (no window) gracefully')
  })

  describe('adapter mode', () => {
    it('calls adapter.load(chatId) on loadMessages')
    it('calls adapter.save(chatId, messages) on saveMessages')
    it('calls adapter.clear(chatId) on clearMessages')
    it('catches and warns on adapter.load error')
    it('catches and warns on adapter.save error')
    it('catches and warns on adapter.clear error')
    it('calls onError callback when adapter throws')
  })

  describe('chatId isolation', () => {
    it('different chatIds use different storage keys')
    it('clearing one chatId does not affect another')
  })
})
```

**Test utilities:**

- Use `@testing-library/react` with `renderHook`
- Mock `localStorage` using a simple in-memory object with `getItem`/`setItem`/`removeItem`
- For adapter tests, create a mock adapter with `vi.fn()` for each method
- Use `vi.useFakeTimers()` for debounce tests
- For SSR tests, temporarily delete `window.localStorage` and restore after

---

## 4. Deliverables

| File | Description |
|------|-------------|
| `packages/ai/src/hooks/use-persistence.ts` | Internal persistence hook with localStorage and adapter support |
| `packages/ai/src/types/config.ts` | Updated with `chatId` field on `AiChatConfig`, `PersistenceConfig` type, `PersistenceAdapter` interface |
| `packages/ai/src/context/ai-chat-provider.tsx` | Updated to consume `usePersistence`, auto-load on mount, auto-save on change |
| `packages/ai/src/__tests__/hooks/use-persistence.test.ts` | Unit tests covering local, adapter, disabled, and edge cases |

---

## 5. Exit Criteria

- [ ] `persistence: 'local'` saves messages to `localStorage` key `tourkit-ai-chat:{chatId}` on every message change (debounced 500ms)
- [ ] Page reload restores previous chat messages — provider reads from localStorage on mount and passes to `useChat` as `initialMessages`
- [ ] `persistence: { adapter }` calls adapter's `save`/`load`/`clear` methods with the correct `chatId`
- [ ] Clearing chat (`setMessages([])`) calls `adapter.clear()` and removes the localStorage entry
- [ ] Adapter errors are caught and logged — chat continues working
- [ ] Invalid stored data (corrupt JSON, wrong shape) returns `null` without crashing
- [ ] No persistence config = zero localStorage reads/writes
- [ ] All unit tests pass with > 80% coverage on `use-persistence.ts`
- [ ] `pnpm --filter @tour-kit/ai typecheck` passes with no errors

---

## 6. Execution Prompt

You are implementing Phase 6 (Persistence) of the `@tour-kit/ai` package in a pnpm monorepo at `packages/ai/`. This phase adds chat history persistence via localStorage or a custom adapter.

**Monorepo context:**
- Build: `pnpm --filter @tour-kit/ai build` (tsup, ESM + CJS)
- Typecheck: `pnpm --filter @tour-kit/ai typecheck`
- Test: `pnpm --filter @tour-kit/ai test`
- The package uses `@ai-sdk/react` (AI SDK 6.x) — `UIMessage` type comes from there
- Existing pattern reference: `packages/core/src/hooks/use-persistence.ts` (tour persistence, different domain but similar localStorage patterns)

**Data Model Rules:**
- All types live in `packages/ai/src/types/` — never define interfaces in hook files
- Import `UIMessage` from `@ai-sdk/react` as type-only: `import type { UIMessage } from '@ai-sdk/react'`
- Use `interface` for object shapes, `type` for unions and mapped types
- All public interfaces must have JSDoc comments on every field

**Type definitions to use (already defined in `packages/ai/src/types/config.ts`):**

```typescript
type PersistenceConfig =
  | 'local'
  | { adapter: PersistenceAdapter }

interface PersistenceAdapter {
  /** Save messages for a chat session */
  save(chatId: string, messages: UIMessage[]): Promise<void>
  /** Load messages for a chat session, returns null if none found */
  load(chatId: string): Promise<UIMessage[] | null>
  /** Clear all messages for a chat session */
  clear(chatId: string): Promise<void>
}
```

**Add to `AiChatConfig` in `packages/ai/src/types/config.ts`:**

```typescript
interface AiChatConfig {
  // ... existing fields ...
  /** Unique identifier for this chat session (default: 'default') */
  chatId?: string
  /** Chat persistence configuration */
  persistence?: PersistenceConfig
}
```

**File 1 — `packages/ai/src/hooks/use-persistence.ts`:**

- Internal hook, NOT exported from package `index.ts`
- Signature: `usePersistence(options: UsePersistenceOptions): UsePersistenceReturn`
- `UsePersistenceOptions`: `{ chatId: string; persistence?: PersistenceConfig; onError?: (error: Error) => void }`
- `UsePersistenceReturn`: `{ loadMessages(): Promise<UIMessage[] | null>; saveMessages(messages: UIMessage[]): void; clearMessages(): Promise<void>; isEnabled: boolean }`
- localStorage key format: `tourkit-ai-chat:{chatId}`
- `saveMessages` for `'local'` mode: debounce 500ms (use `useRef` for timer, `useCallback` for stable reference)
- Flush pending save on unmount (`useEffect` cleanup)
- SSR guard: `typeof window !== 'undefined'` before any `localStorage` access
- All errors caught with try/catch — call `onError` if provided, else `console.warn`
- JSON parse validation: check `Array.isArray()` after parse, return `null` if not an array

**File 2 — Update `packages/ai/src/context/ai-chat-provider.tsx`:**

- Import and call `usePersistence` in provider
- Add `isPersistenceLoading` state — true while initial `loadMessages()` is pending
- Pass loaded messages as `initialMessages` to `useChat()`
- Auto-save: `useEffect` watching `chat.messages` calls `saveMessages(chat.messages)` — skip during initial hydration (use `hasHydrated` ref)
- Wrap `setMessages`: when called with `[]`, also call `clearMessages()`
- Do NOT change the public `useAiChat()` return type — persistence is transparent

**File 3 — `packages/ai/src/__tests__/hooks/use-persistence.test.ts`:**

- Use `@testing-library/react` `renderHook` + `vitest`
- Mock localStorage: `Object.defineProperty(window, 'localStorage', { value: mockStorage })`
- Test groups: disabled mode (4 tests), local mode (10 tests), adapter mode (7 tests), chatId isolation (2 tests)
- Use `vi.useFakeTimers()` for debounce tests, `vi.advanceTimersByTime(500)` to flush
- Mock adapter: `{ save: vi.fn().mockResolvedValue(undefined), load: vi.fn().mockResolvedValue(null), clear: vi.fn().mockResolvedValue(undefined) }`
- For error tests: make adapter methods reject with `new Error('adapter error')`, verify `console.warn` was called

**Quality gates:**
- `pnpm --filter @tour-kit/ai typecheck` must pass
- All tests must pass
- No `any` types — use `unknown` for generic error catches
- No direct `window` access without SSR guard

---

## Readiness Check

Before starting implementation, confirm:

- [ ] Phase 1 is complete — `AiChatProvider`, `AiChatConfig`, `useAiChat` exist and work
- [ ] `packages/ai/src/types/config.ts` exists with `AiChatConfig` interface
- [ ] `packages/ai/src/context/ai-chat-provider.tsx` exists and wraps `useChat` from `@ai-sdk/react`
- [ ] `@ai-sdk/react` is listed as a dependency in `packages/ai/package.json`
- [ ] `vitest` and `@testing-library/react` are available for testing
- [ ] `pnpm --filter @tour-kit/ai build` succeeds before starting

# Phase 6 — Persistence: Test Plan

**Package:** `@tour-kit/ai`
**Phase Type:** Service — mock localStorage, mock custom adapter
**Test Framework:** Vitest + `@testing-library/react`
**Test File:** `packages/ai/src/__tests__/hooks/use-persistence.test.ts`

---

## 1. Scope

Unit tests for the `usePersistence` hook covering three modes: disabled (no config), local (localStorage), and adapter (custom `PersistenceAdapter`). Tests verify save/load/clear lifecycle, debounce behavior, SSR safety, error handling, and chatId isolation.

**Files under test:**
- `packages/ai/src/hooks/use-persistence.ts`

**Integration touchpoint (not directly tested here):**
- `packages/ai/src/context/ai-chat-provider.tsx` — consumes `usePersistence` internally

---

## 2. Mock Strategy

### 2.1 localStorage mock

Create an in-memory localStorage replacement. Attach it via `Object.defineProperty` in `beforeEach` and restore in `afterEach`.

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePersistence } from '../../hooks/use-persistence'
import type { PersistenceAdapter } from '../../types/config'
import type { UIMessage } from '@ai-sdk/react'

function createMockLocalStorage() {
  const store = new Map<string, string>()
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { store.set(key, value) }),
    removeItem: vi.fn((key: string) => { store.delete(key) }),
    clear: vi.fn(() => { store.clear() }),
    get length() { return store.size },
    key: vi.fn((_index: number) => null),
    _store: store,
  }
}

let mockStorage: ReturnType<typeof createMockLocalStorage>
let originalLocalStorage: Storage

beforeEach(() => {
  mockStorage = createMockLocalStorage()
  originalLocalStorage = window.localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: originalLocalStorage,
    writable: true,
    configurable: true,
  })
})
```

### 2.2 Custom adapter mock

```typescript
function createMockAdapter(): PersistenceAdapter {
  return {
    save: vi.fn<PersistenceAdapter['save']>().mockResolvedValue(undefined),
    load: vi.fn<PersistenceAdapter['load']>().mockResolvedValue(null),
    clear: vi.fn<PersistenceAdapter['clear']>().mockResolvedValue(undefined),
  }
}
```

### 2.3 Fake timers for debounce

```typescript
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})
```

### 2.4 Test message fixtures

```typescript
const createTestMessages = (count: number): UIMessage[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `msg-${i}`,
    role: i % 2 === 0 ? 'user' : 'assistant',
    parts: [{ type: 'text', text: `Message ${i}` }],
    createdAt: new Date(),
  })) as UIMessage[]
```

---

## 3. Test Structure

### 3.1 `describe('usePersistence')` — Disabled mode (no persistence config)

| # | Test name | What it verifies | Key assertions |
|---|-----------|------------------|----------------|
| 1 | `it('returns isEnabled: false when no persistence config')` | Hook returns disabled state when `persistence` is `undefined` | `expect(result.current.isEnabled).toBe(false)` |
| 2 | `it('loadMessages returns null when disabled')` | No storage access occurs | `await expect(result.current.loadMessages()).resolves.toBeNull()` |
| 3 | `it('saveMessages is a no-op when disabled')` | Calling save does not touch localStorage | Call `result.current.saveMessages(messages)`, advance timers, assert `mockStorage.setItem` not called |
| 4 | `it('clearMessages is a no-op when disabled')` | Calling clear does not touch localStorage | `await result.current.clearMessages()`, assert `mockStorage.removeItem` not called |

**Example — Test 1:**

```typescript
describe('disabled (no persistence config)', () => {
  it('returns isEnabled: false when no persistence config', () => {
    const { result } = renderHook(() =>
      usePersistence({ chatId: 'test' })
    )

    expect(result.current.isEnabled).toBe(false)
  })

  it('loadMessages returns null when disabled', async () => {
    const { result } = renderHook(() =>
      usePersistence({ chatId: 'test' })
    )

    const messages = await result.current.loadMessages()
    expect(messages).toBeNull()
    expect(mockStorage.getItem).not.toHaveBeenCalled()
  })

  it('saveMessages is a no-op when disabled', () => {
    const { result } = renderHook(() =>
      usePersistence({ chatId: 'test' })
    )

    act(() => {
      result.current.saveMessages(createTestMessages(2))
    })
    vi.advanceTimersByTime(1000)

    expect(mockStorage.setItem).not.toHaveBeenCalled()
  })

  it('clearMessages is a no-op when disabled', async () => {
    const { result } = renderHook(() =>
      usePersistence({ chatId: 'test' })
    )

    await act(async () => {
      await result.current.clearMessages()
    })

    expect(mockStorage.removeItem).not.toHaveBeenCalled()
  })
})
```

---

### 3.2 `describe('usePersistence')` — Local mode

| # | Test name | What it verifies | Key assertions |
|---|-----------|------------------|----------------|
| 1 | `it('returns isEnabled: true when persistence is "local"')` | Enabled state | `expect(result.current.isEnabled).toBe(true)` |
| 2 | `it('saves messages to localStorage with correct key')` | Key format `tourkit-ai-chat:{chatId}` | Call `saveMessages`, advance 500ms, assert `mockStorage.setItem` called with `'tourkit-ai-chat:my-chat'` and stringified messages |
| 3 | `it('loads messages from localStorage')` | Read and parse stored messages | Pre-set `mockStorage._store`, call `loadMessages`, assert returned array matches |
| 4 | `it('returns null when no stored messages exist')` | Empty storage | `loadMessages` returns `null` |
| 5 | `it('returns null when stored data is invalid JSON')` | Corrupt data handling | Set garbled string in store, assert `loadMessages` returns `null` |
| 6 | `it('returns null when stored data is not an array')` | Wrong shape handling | Set `JSON.stringify({ foo: 'bar' })`, assert `loadMessages` returns `null` |
| 7 | `it('clears messages from localStorage')` | Remove key | Call `clearMessages`, assert `mockStorage.removeItem` called with correct key |
| 8 | `it('debounces save calls — only last write within 500ms persists')` | Debounce behavior | Call `saveMessages` 3x rapidly, advance 500ms, assert `setItem` called once with last messages |
| 9 | `it('flushes pending save on unmount')` | Cleanup flush | Call `saveMessages`, unmount hook, assert `setItem` called |
| 10 | `it('handles localStorage quota exceeded gracefully')` | Error resilience | Make `mockStorage.setItem` throw `DOMException`, assert no throw, `console.warn` called |
| 11 | `it('handles SSR environment (no window) gracefully')` | SSR guard | Temporarily mock `typeof window` check; verify no crash and `loadMessages` returns `null` |

**Example — Tests 2, 8, 9:**

```typescript
describe('local mode', () => {
  const chatId = 'my-chat'
  const storageKey = `tourkit-ai-chat:${chatId}`

  it('saves messages to localStorage with correct key', () => {
    const { result } = renderHook(() =>
      usePersistence({ chatId, persistence: 'local' })
    )
    const messages = createTestMessages(2)

    act(() => {
      result.current.saveMessages(messages)
    })

    // Before debounce fires — nothing written yet
    expect(mockStorage.setItem).not.toHaveBeenCalled()

    // Advance past the 500ms debounce
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(mockStorage.setItem).toHaveBeenCalledTimes(1)
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      storageKey,
      JSON.stringify(messages)
    )
  })

  it('debounces save calls — only last write within 500ms persists', () => {
    const { result } = renderHook(() =>
      usePersistence({ chatId, persistence: 'local' })
    )
    const messages1 = createTestMessages(1)
    const messages2 = createTestMessages(2)
    const messages3 = createTestMessages(3)

    act(() => {
      result.current.saveMessages(messages1)
    })
    act(() => {
      vi.advanceTimersByTime(100)
    })
    act(() => {
      result.current.saveMessages(messages2)
    })
    act(() => {
      vi.advanceTimersByTime(100)
    })
    act(() => {
      result.current.saveMessages(messages3)
    })
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(mockStorage.setItem).toHaveBeenCalledTimes(1)
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      storageKey,
      JSON.stringify(messages3)
    )
  })

  it('flushes pending save on unmount', () => {
    const { result, unmount } = renderHook(() =>
      usePersistence({ chatId, persistence: 'local' })
    )
    const messages = createTestMessages(2)

    act(() => {
      result.current.saveMessages(messages)
    })

    // Unmount before debounce fires
    unmount()

    expect(mockStorage.setItem).toHaveBeenCalledTimes(1)
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      storageKey,
      JSON.stringify(messages)
    )
  })

  it('loads messages from localStorage', async () => {
    const messages = createTestMessages(3)
    mockStorage._store.set(storageKey, JSON.stringify(messages))

    const { result } = renderHook(() =>
      usePersistence({ chatId, persistence: 'local' })
    )

    let loaded: UIMessage[] | null = null
    await act(async () => {
      loaded = await result.current.loadMessages()
    })

    expect(loaded).toEqual(messages)
    expect(mockStorage.getItem).toHaveBeenCalledWith(storageKey)
  })

  it('returns null when no stored messages exist', async () => {
    const { result } = renderHook(() =>
      usePersistence({ chatId, persistence: 'local' })
    )

    let loaded: UIMessage[] | null = null
    await act(async () => {
      loaded = await result.current.loadMessages()
    })

    expect(loaded).toBeNull()
  })

  it('returns null when stored data is invalid JSON', async () => {
    mockStorage._store.set(storageKey, '{not valid json}}}')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { result } = renderHook(() =>
      usePersistence({ chatId, persistence: 'local' })
    )

    let loaded: UIMessage[] | null = null
    await act(async () => {
      loaded = await result.current.loadMessages()
    })

    expect(loaded).toBeNull()
    warnSpy.mockRestore()
  })

  it('returns null when stored data is not an array', async () => {
    mockStorage._store.set(storageKey, JSON.stringify({ foo: 'bar' }))

    const { result } = renderHook(() =>
      usePersistence({ chatId, persistence: 'local' })
    )

    let loaded: UIMessage[] | null = null
    await act(async () => {
      loaded = await result.current.loadMessages()
    })

    expect(loaded).toBeNull()
  })

  it('clears messages from localStorage', async () => {
    mockStorage._store.set(storageKey, JSON.stringify(createTestMessages(2)))

    const { result } = renderHook(() =>
      usePersistence({ chatId, persistence: 'local' })
    )

    await act(async () => {
      await result.current.clearMessages()
    })

    expect(mockStorage.removeItem).toHaveBeenCalledWith(storageKey)
  })

  it('handles localStorage quota exceeded gracefully', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockStorage.setItem.mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })

    const { result } = renderHook(() =>
      usePersistence({ chatId, persistence: 'local' })
    )

    act(() => {
      result.current.saveMessages(createTestMessages(2))
    })
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Should not throw — error is caught and logged
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('handles SSR environment (no window.localStorage) gracefully', async () => {
    // Simulate SSR by removing localStorage
    Object.defineProperty(window, 'localStorage', {
      value: undefined,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() =>
      usePersistence({ chatId, persistence: 'local' })
    )

    let loaded: UIMessage[] | null = null
    await act(async () => {
      loaded = await result.current.loadMessages()
    })

    expect(loaded).toBeNull()

    // saveMessages should not throw
    act(() => {
      result.current.saveMessages(createTestMessages(1))
    })
    act(() => {
      vi.advanceTimersByTime(500)
    })
    // No assertion needed — test passes if no error is thrown
  })
})
```

---

### 3.3 `describe('usePersistence')` — Adapter mode

| # | Test name | What it verifies | Key assertions |
|---|-----------|------------------|----------------|
| 1 | `it('calls adapter.load(chatId) on loadMessages')` | Adapter load delegation | Assert `adapter.load` called with `chatId` |
| 2 | `it('calls adapter.save(chatId, messages) on saveMessages')` | Adapter save delegation | Assert `adapter.save` called with `chatId` and messages array |
| 3 | `it('calls adapter.clear(chatId) on clearMessages')` | Adapter clear delegation | Assert `adapter.clear` called with `chatId` |
| 4 | `it('catches and warns on adapter.load error')` | Non-fatal load error | Mock `adapter.load` to reject, assert `console.warn` called, returns `null` |
| 5 | `it('catches and warns on adapter.save error')` | Non-fatal save error | Mock `adapter.save` to reject, assert `console.warn` called |
| 6 | `it('catches and warns on adapter.clear error')` | Non-fatal clear error | Mock `adapter.clear` to reject, assert `console.warn` called |
| 7 | `it('calls onError callback when adapter throws')` | Custom error handler | Pass `onError: vi.fn()`, make adapter throw, assert `onError` called with the `Error` |

**Example — Tests 1, 4, 7:**

```typescript
describe('adapter mode', () => {
  const chatId = 'adapter-chat'

  it('calls adapter.load(chatId) on loadMessages', async () => {
    const adapter = createMockAdapter()
    const storedMessages = createTestMessages(3)
    adapter.load.mockResolvedValue(storedMessages)

    const { result } = renderHook(() =>
      usePersistence({
        chatId,
        persistence: { adapter },
      })
    )

    let loaded: UIMessage[] | null = null
    await act(async () => {
      loaded = await result.current.loadMessages()
    })

    expect(adapter.load).toHaveBeenCalledWith(chatId)
    expect(loaded).toEqual(storedMessages)
  })

  it('calls adapter.save(chatId, messages) on saveMessages', async () => {
    const adapter = createMockAdapter()
    const messages = createTestMessages(2)

    const { result } = renderHook(() =>
      usePersistence({
        chatId,
        persistence: { adapter },
      })
    )

    await act(async () => {
      result.current.saveMessages(messages)
    })

    expect(adapter.save).toHaveBeenCalledWith(chatId, messages)
  })

  it('calls adapter.clear(chatId) on clearMessages', async () => {
    const adapter = createMockAdapter()

    const { result } = renderHook(() =>
      usePersistence({
        chatId,
        persistence: { adapter },
      })
    )

    await act(async () => {
      await result.current.clearMessages()
    })

    expect(adapter.clear).toHaveBeenCalledWith(chatId)
  })

  it('catches and warns on adapter.load error', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const adapter = createMockAdapter()
    adapter.load.mockRejectedValue(new Error('load failed'))

    const { result } = renderHook(() =>
      usePersistence({
        chatId,
        persistence: { adapter },
      })
    )

    let loaded: UIMessage[] | null = null
    await act(async () => {
      loaded = await result.current.loadMessages()
    })

    expect(loaded).toBeNull()
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('catches and warns on adapter.save error', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const adapter = createMockAdapter()
    adapter.save.mockRejectedValue(new Error('save failed'))

    const { result } = renderHook(() =>
      usePersistence({
        chatId,
        persistence: { adapter },
      })
    )

    await act(async () => {
      result.current.saveMessages(createTestMessages(1))
    })

    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('catches and warns on adapter.clear error', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const adapter = createMockAdapter()
    adapter.clear.mockRejectedValue(new Error('clear failed'))

    const { result } = renderHook(() =>
      usePersistence({
        chatId,
        persistence: { adapter },
      })
    )

    await act(async () => {
      await result.current.clearMessages()
    })

    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('calls onError callback when adapter throws', async () => {
    const onError = vi.fn()
    const adapter = createMockAdapter()
    const error = new Error('adapter error')
    adapter.load.mockRejectedValue(error)

    const { result } = renderHook(() =>
      usePersistence({
        chatId,
        persistence: { adapter },
        onError,
      })
    )

    await act(async () => {
      await result.current.loadMessages()
    })

    expect(onError).toHaveBeenCalledWith(error)
  })
})
```

---

### 3.4 `describe('usePersistence')` — ChatId isolation

| # | Test name | What it verifies | Key assertions |
|---|-----------|------------------|----------------|
| 1 | `it('different chatIds use different storage keys')` | Key isolation | Save with chatId `'a'` and `'b'`, assert two different keys written |
| 2 | `it('clearing one chatId does not affect another')` | Independent clear | Save to both, clear `'a'`, assert `'b'` still readable |

**Example — Tests 1, 2:**

```typescript
describe('chatId isolation', () => {
  it('different chatIds use different storage keys', () => {
    const messagesA = createTestMessages(1)
    const messagesB = createTestMessages(2)

    const { result: hookA } = renderHook(() =>
      usePersistence({ chatId: 'chat-a', persistence: 'local' })
    )
    const { result: hookB } = renderHook(() =>
      usePersistence({ chatId: 'chat-b', persistence: 'local' })
    )

    act(() => {
      hookA.current.saveMessages(messagesA)
      hookB.current.saveMessages(messagesB)
    })
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'tourkit-ai-chat:chat-a',
      JSON.stringify(messagesA)
    )
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'tourkit-ai-chat:chat-b',
      JSON.stringify(messagesB)
    )
  })

  it('clearing one chatId does not affect another', async () => {
    const messagesA = createTestMessages(1)
    const messagesB = createTestMessages(2)

    mockStorage._store.set(
      'tourkit-ai-chat:chat-a',
      JSON.stringify(messagesA)
    )
    mockStorage._store.set(
      'tourkit-ai-chat:chat-b',
      JSON.stringify(messagesB)
    )

    const { result: hookA } = renderHook(() =>
      usePersistence({ chatId: 'chat-a', persistence: 'local' })
    )

    await act(async () => {
      await hookA.current.clearMessages()
    })

    expect(mockStorage._store.has('tourkit-ai-chat:chat-a')).toBe(false)
    expect(mockStorage._store.has('tourkit-ai-chat:chat-b')).toBe(true)
  })
})
```

---

## 4. User Story Coverage Matrix

| User Story | Tests covering it |
|------------|-------------------|
| US-1: Messages persist across page reloads | Local mode: saves to localStorage, loads from localStorage |
| US-2: Pluggable adapter interface for server-side storage | Adapter mode: all 3 delegation tests (load, save, clear) |
| US-3: Adapter errors are non-fatal | Adapter mode: 3 error tests + onError callback test |
| US-4: No localStorage access when persistence disabled | Disabled mode: all 4 no-op tests |

---

## 5. Edge Cases & Error Scenarios

| Scenario | Test location | Expected behavior |
|----------|---------------|-------------------|
| Invalid JSON in localStorage | Local mode test 5 | Returns `null`, no crash |
| Non-array JSON in localStorage | Local mode test 6 | Returns `null`, no crash |
| localStorage quota exceeded | Local mode test 10 | Error caught, `console.warn` called |
| SSR (no `window.localStorage`) | Local mode test 11 | Returns `null`, save is no-op |
| Adapter `.load()` rejects | Adapter mode test 4 | Returns `null`, `console.warn` called |
| Adapter `.save()` rejects | Adapter mode test 5 | Error caught, `console.warn` called |
| Adapter `.clear()` rejects | Adapter mode test 6 | Error caught, `console.warn` called |
| Rapid saves within 500ms | Local mode test 8 | Only last write persists (debounced) |
| Unmount with pending save | Local mode test 9 | Pending save is flushed |

---

## 6. Test Count Summary

| Group | Count |
|-------|-------|
| Disabled mode | 4 |
| Local mode | 11 |
| Adapter mode | 7 |
| ChatId isolation | 2 |
| **Total** | **24** |

---

## 7. Run Command

```bash
pnpm --filter @tour-kit/ai test -- --run src/__tests__/hooks/use-persistence.test.ts
```

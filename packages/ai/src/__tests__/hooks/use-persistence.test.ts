// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePersistence } from '../../hooks/use-persistence'
import type { PersistenceAdapter } from '../../types/config'
import type { UIMessage } from 'ai'

// ── Helpers ──

function createMockLocalStorage() {
  const store = new Map<string, string>()
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key)
    }),
    clear: vi.fn(() => {
      store.clear()
    }),
    get length() {
      return store.size
    },
    key: vi.fn((_index: number) => null),
    _store: store,
  }
}

function createMockAdapter(): PersistenceAdapter {
  return {
    save: vi.fn<PersistenceAdapter['save']>().mockResolvedValue(undefined),
    load: vi.fn<PersistenceAdapter['load']>().mockResolvedValue(null),
    clear: vi.fn<PersistenceAdapter['clear']>().mockResolvedValue(undefined),
  }
}

const createTestMessages = (count: number): UIMessage[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `msg-${i}`,
    role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
    parts: [{ type: 'text' as const, text: `Message ${i}` }],
    createdAt: new Date('2024-01-01'),
  })) as UIMessage[]

// ── Setup ──

let mockStorage: ReturnType<typeof createMockLocalStorage>
let originalLocalStorage: Storage

beforeEach(() => {
  vi.useFakeTimers()
  mockStorage = createMockLocalStorage()
  originalLocalStorage = window.localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  vi.useRealTimers()
  Object.defineProperty(window, 'localStorage', {
    value: originalLocalStorage,
    writable: true,
    configurable: true,
  })
})

// ── Tests ──

describe('usePersistence', () => {
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

  describe('local mode', () => {
    const chatId = 'my-chat'
    const storageKey = `tourkit-ai-chat:${chatId}`

    it('returns isEnabled: true when persistence is "local"', () => {
      const { result } = renderHook(() =>
        usePersistence({ chatId, persistence: 'local' })
      )
      expect(result.current.isEnabled).toBe(true)
    })

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

      // JSON roundtrip converts Date to string — compare serialized form
      expect(loaded).toEqual(JSON.parse(JSON.stringify(messages)))
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

  describe('adapter mode', () => {
    const chatId = 'adapter-chat'

    it('calls adapter.load(chatId) on loadMessages', async () => {
      const adapter = createMockAdapter()
      const storedMessages = createTestMessages(3)
      ;(adapter.load as ReturnType<typeof vi.fn>).mockResolvedValue(storedMessages)

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
      ;(adapter.load as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('load failed'))

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
      ;(adapter.save as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('save failed'))

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
      ;(adapter.clear as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('clear failed'))

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
      ;(adapter.load as ReturnType<typeof vi.fn>).mockRejectedValue(error)

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
})

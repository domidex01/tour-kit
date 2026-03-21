'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { UIMessage } from 'ai'
import type { PersistenceAdapter, PersistenceConfig } from '../types/config'

// ── Types ──

export interface UsePersistenceOptions {
  chatId: string
  persistence?: PersistenceConfig
  onError?: (error: Error) => void
}

export interface UsePersistenceReturn {
  /** Load messages from storage. Returns null if none found or persistence disabled. */
  loadMessages(): Promise<UIMessage[] | null>
  /** Save messages to storage. Debounced internally for 'local' mode. */
  saveMessages(messages: UIMessage[]): void
  /** Clear all stored messages for this chatId. */
  clearMessages(): Promise<void>
  /** Whether persistence is enabled. */
  isEnabled: boolean
}

// ── Helpers ──

const STORAGE_PREFIX = 'tourkit-ai-chat'

function getStorageKey(chatId: string): string {
  return `${STORAGE_PREFIX}:${chatId}`
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? (parsed as T) : null
  } catch {
    return null
  }
}

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

const DEBOUNCE_MS = 500

// ── Hook ──

export function usePersistence(options: UsePersistenceOptions): UsePersistenceReturn {
  const { chatId, persistence, onError } = options
  const isEnabled = persistence !== undefined

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<UIMessage[] | null>(null)

  const handleError = useCallback(
    (error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error))
      if (onError) {
        onError(err)
      } else {
        console.warn('[tour-kit/ai] Persistence error:', err)
      }
    },
    [onError]
  )

  // Flush pending debounced save (used on unmount and in debounce)
  const flushSave = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const messages = pendingRef.current
    if (messages === null) return
    pendingRef.current = null

    const storage = getLocalStorage()
    if (!storage) return

    try {
      storage.setItem(getStorageKey(chatId), JSON.stringify(messages))
    } catch (error: unknown) {
      handleError(error)
    }
  }, [chatId, handleError])

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (persistence === 'local' && pendingRef.current !== null) {
        flushSave()
      }
    }
  }, [persistence, flushSave])

  const loadMessages = useCallback(async (): Promise<UIMessage[] | null> => {
    if (!isEnabled) return null

    if (persistence === 'local') {
      const storage = getLocalStorage()
      if (!storage) return null
      try {
        const raw = storage.getItem(getStorageKey(chatId))
        return safeJsonParse<UIMessage[]>(raw)
      } catch (error: unknown) {
        handleError(error)
        return null
      }
    }

    // Adapter mode
    const adapter = (persistence as { adapter: PersistenceAdapter }).adapter
    try {
      return await adapter.load(chatId)
    } catch (error: unknown) {
      handleError(error)
      return null
    }
  }, [chatId, isEnabled, persistence, handleError])

  const saveMessages = useCallback(
    (messages: UIMessage[]): void => {
      if (!isEnabled) return

      if (persistence === 'local') {
        // Debounced localStorage save
        pendingRef.current = messages
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current)
        }
        timerRef.current = setTimeout(() => {
          flushSave()
        }, DEBOUNCE_MS)
        return
      }

      // Adapter mode — call directly (no debounce)
      const adapter = (persistence as { adapter: PersistenceAdapter }).adapter
      adapter.save(chatId, messages).catch((error: unknown) => {
        handleError(error)
      })
    },
    [chatId, isEnabled, persistence, flushSave, handleError]
  )

  const clearMessages = useCallback(async (): Promise<void> => {
    if (!isEnabled) return

    if (persistence === 'local') {
      const storage = getLocalStorage()
      if (!storage) return
      try {
        // Cancel any pending save
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        pendingRef.current = null
        storage.removeItem(getStorageKey(chatId))
      } catch (error: unknown) {
        handleError(error)
      }
      return
    }

    // Adapter mode
    const adapter = (persistence as { adapter: PersistenceAdapter }).adapter
    try {
      await adapter.clear(chatId)
    } catch (error: unknown) {
      handleError(error)
    }
  }, [chatId, isEnabled, persistence, handleError])

  return { loadMessages, saveMessages, clearMessages, isEnabled }
}

import { useCallback, useMemo } from 'react'
import type { PersistenceConfig } from '../types'
import { defaultPersistenceConfig } from '../types/config'
import { createPrefixedStorage, createStorageAdapter, safeJSONParse } from '../utils/storage'

export interface UsePersistenceReturn {
  getCompletedTours: () => string[]
  getSkippedTours: () => string[]
  getDontShowAgain: (tourId: string) => boolean
  getLastStep: (tourId: string) => number | null
  markCompleted: (tourId: string) => void
  markSkipped: (tourId: string) => void
  setDontShowAgain: (tourId: string, value: boolean) => void
  saveStep: (tourId: string, stepIndex: number) => void
  reset: (tourId?: string) => void
}

export function usePersistence(config?: PersistenceConfig): UsePersistenceReturn {
  const mergedConfig = { ...defaultPersistenceConfig, ...config }

  const storage = useMemo(() => {
    const adapter = createStorageAdapter(mergedConfig.storage)
    return createPrefixedStorage(adapter, mergedConfig.keyPrefix ?? 'tourkit')
  }, [mergedConfig.storage, mergedConfig.keyPrefix])

  const getCompletedTours = useCallback(() => {
    const data = storage.getItem('completed')
    return safeJSONParse<string[]>(data as string | null, [])
  }, [storage])

  const getSkippedTours = useCallback(() => {
    const data = storage.getItem('skipped')
    return safeJSONParse<string[]>(data as string | null, [])
  }, [storage])

  const getDontShowAgain = useCallback(
    (tourId: string) => {
      const data = storage.getItem(`dontShow:${tourId}`)
      return data === 'true'
    },
    [storage]
  )

  const getLastStep = useCallback(
    (tourId: string) => {
      const data = storage.getItem(`step:${tourId}`)
      return data ? Number.parseInt(data as string, 10) : null
    },
    [storage]
  )

  const markCompleted = useCallback(
    (tourId: string) => {
      const completed = getCompletedTours()
      if (!completed.includes(tourId)) {
        completed.push(tourId)
        storage.setItem('completed', JSON.stringify(completed))
      }
    },
    [storage, getCompletedTours]
  )

  const markSkipped = useCallback(
    (tourId: string) => {
      const skipped = getSkippedTours()
      if (!skipped.includes(tourId)) {
        skipped.push(tourId)
        storage.setItem('skipped', JSON.stringify(skipped))
      }
    },
    [storage, getSkippedTours]
  )

  const setDontShowAgain = useCallback(
    (tourId: string, value: boolean) => {
      if (value) {
        storage.setItem(`dontShow:${tourId}`, 'true')
      } else {
        storage.removeItem(`dontShow:${tourId}`)
      }
    },
    [storage]
  )

  const saveStep = useCallback(
    (tourId: string, stepIndex: number) => {
      storage.setItem(`step:${tourId}`, String(stepIndex))
    },
    [storage]
  )

  const reset = useCallback(
    (tourId?: string) => {
      if (tourId) {
        storage.removeItem(`step:${tourId}`)
        storage.removeItem(`dontShow:${tourId}`)

        const completed = getCompletedTours().filter((id) => id !== tourId)
        storage.setItem('completed', JSON.stringify(completed))

        const skipped = getSkippedTours().filter((id) => id !== tourId)
        storage.setItem('skipped', JSON.stringify(skipped))
      } else {
        storage.removeItem('completed')
        storage.removeItem('skipped')
      }
    },
    [storage, getCompletedTours, getSkippedTours]
  )

  return {
    getCompletedTours,
    getSkippedTours,
    getDontShowAgain,
    getLastStep,
    markCompleted,
    markSkipped,
    setDontShowAgain,
    saveStep,
    reset,
  }
}

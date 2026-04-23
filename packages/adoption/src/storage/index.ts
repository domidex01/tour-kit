import type { StorageAdapter, StorageConfig } from '../types'
import { createLocalStorageAdapter, createSessionStorageAdapter } from './local-storage'
import { createMemoryStorageAdapter } from './memory-storage'

const DEFAULT_KEY = 'tourkit-adoption'

export function createStorageAdapter(config: StorageConfig): StorageAdapter {
  const key = config.key ?? DEFAULT_KEY

  switch (config.type) {
    case 'sessionStorage':
      return createSessionStorageAdapter(key)
    case 'memory':
      return createMemoryStorageAdapter()
    default:
      return createLocalStorageAdapter(key)
  }
}

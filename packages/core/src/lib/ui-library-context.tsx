'use client'

import { createContext, useContext } from 'react'

export type UILibrary = 'radix-ui' | 'base-ui'

const UILibraryContext = createContext<UILibrary>('radix-ui')

export interface UILibraryProviderProps {
  library?: UILibrary
  children: React.ReactNode
}

/**
 * Provider component that allows users to choose their preferred UI library.
 * Defaults to 'radix-ui' for backward compatibility.
 *
 * @example
 * ```tsx
 * <UILibraryProvider library="base-ui">
 *   <App />
 * </UILibraryProvider>
 * ```
 */
export function UILibraryProvider({ library = 'radix-ui', children }: UILibraryProviderProps) {
  return <UILibraryContext.Provider value={library}>{children}</UILibraryContext.Provider>
}

/**
 * Hook to get the current UI library setting
 *
 * @returns The current UI library ('radix-ui' or 'base-ui')
 */
export function useUILibrary(): UILibrary {
  return useContext(UILibraryContext)
}

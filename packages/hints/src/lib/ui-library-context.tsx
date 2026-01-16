'use client'

import { createContext, useContext } from 'react'

export type UILibrary = 'radix-ui' | 'base-ui'

const UILibraryContext = createContext<UILibrary>('radix-ui')

export interface UILibraryProviderProps {
  library?: UILibrary
  children: React.ReactNode
}

export function UILibraryProvider({ library = 'radix-ui', children }: UILibraryProviderProps) {
  return <UILibraryContext.Provider value={library}>{children}</UILibraryContext.Provider>
}

export function useUILibrary(): UILibrary {
  return useContext(UILibraryContext)
}

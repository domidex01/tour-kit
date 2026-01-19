import { createContext, useContext } from 'react'
import type { AnnouncementsContextValue } from '../types/context'

/**
 * Announcements context
 */
export const AnnouncementsContext = createContext<AnnouncementsContextValue | null>(null)

/**
 * Hook to access the announcements context
 * @throws Error if used outside of AnnouncementsProvider
 */
export function useAnnouncementsContext(): AnnouncementsContextValue {
  const context = useContext(AnnouncementsContext)
  if (!context) {
    throw new Error('useAnnouncementsContext must be used within an AnnouncementsProvider')
  }
  return context
}

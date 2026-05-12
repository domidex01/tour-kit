import { useContext } from 'react'
import { TourContext } from '../context/tour-context'
import type { EligibilityReport } from '../types/diagnostic'

/**
 * Read the diagnostic report for a given tour id. Returns `null` when the
 * provider is mounted without `diagnose={true}`, when the tour is unknown,
 * or before the first diagnostic effect tick has resolved.
 *
 * Throws if called outside a `<TourProvider>` — the diagnostic surface is
 * useless without context plumbing, so make the misuse loud.
 */
export function useTourDiagnostic(tourId: string): EligibilityReport | null {
  const ctx = useContext(TourContext)
  if (!ctx) {
    throw new Error('useTourDiagnostic must be used inside <TourProvider>')
  }
  return ctx.diagnostics?.[tourId] ?? null
}

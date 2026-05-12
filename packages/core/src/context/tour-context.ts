import { createContext, useContext } from 'react'
import type { TourContextValue, TourStep } from '../types'

export const TourContext = createContext<TourContextValue | null>(null)

TourContext.displayName = 'TourContext'

export function useTourContext<TStep extends TourStep = TourStep>(): TourContextValue<TStep> {
  const context = useContext(TourContext)

  if (!context) {
    throw new Error('useTourContext must be used within a TourProvider')
  }

  // `as unknown as` is intentional: the runtime context always carries the wide
  // `TourContextValue<TourStep>`; the `<TStep>` generic is an opt-in narrowing
  // the caller asserts. Same trade-off React's typed-context pattern accepts.
  return context as unknown as TourContextValue<TStep>
}

export function useTourContextOptional<
  TStep extends TourStep = TourStep,
>(): TourContextValue<TStep> | null {
  // See `useTourContext` — same opt-in narrowing escape hatch.
  return useContext(TourContext) as unknown as TourContextValue<TStep> | null
}

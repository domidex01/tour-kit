'use client'

import { MultiTourKitProvider, TourCard, TourOverlay } from '@tour-kit/react'
import { OnboardingTour } from './onboarding-tour'
import { InviteTeammateTour, MediaSpotlightTour } from './reel-tours'

/**
 * Single host for every tour in the demo. All three tours register into one
 * shared MultiTourKitProvider so they share ONE <TourOverlay>/<TourCard> and
 * one registry — the supported multi-tour pattern. (Mounting multiple
 * standalone <Tour> components each spins up its own provider, which
 * conflicts: only the first-activated tour works.)
 *
 * The Director panel drives any of these by id via `useTourActions`, which
 * reads the module-level registry these tours populate.
 */
export function ToursHost() {
  return (
    <MultiTourKitProvider>
      <OnboardingTour />
      <MediaSpotlightTour />
      <InviteTeammateTour />
      <TourOverlay />
      <TourCard />
    </MultiTourKitProvider>
  )
}

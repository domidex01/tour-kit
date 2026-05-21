'use client'

import { type Placement, type Tour, TourProvider, useTour } from '@tour-kit/core'
import { TourCard } from '@tour-kit/react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo } from 'react'

/**
 * Playwright fixture route for Phase 4 (TourCard placement matrix).
 *
 * Reads `?placement=` from the URL and renders a single-step tour with that
 * placement, anchored at a fixed-position 100×40 target button centered in
 * the viewport. Not linked from public nav.
 *
 * Mounts its own `<TourProvider>` so the placement-matrix tour is isolated
 * from the root `MultiTourKitProvider` in `providers.tsx`. The local
 * `<TourCard />` rendered here picks up the local context; the root-level
 * `<TourCard />` stays inactive because no tour is started there.
 */
function PlacementFixture() {
  const search = useSearchParams()
  const placement = (search?.get('placement') ?? 'bottom') as Placement

  const tour = useMemo<Tour>(
    () => ({
      id: 'placement-matrix',
      steps: [
        {
          id: `placement-${placement}`,
          target: '#tour-card-anchor',
          title: 'Placement',
          content: `Rendered at ${placement}.`,
          placement,
        },
      ],
    }),
    [placement]
  )

  return (
    <TourProvider tours={[tour]} key={placement}>
      <button
        id="tour-card-anchor"
        type="button"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 100,
          height: 40,
        }}
        className="rounded-md bg-secondary text-secondary-foreground text-sm"
      >
        Target
      </button>
      <AutoStart />
      <TourCard />
    </TourProvider>
  )
}

function AutoStart() {
  const { start } = useTour()
  useEffect(() => {
    start()
  }, [start])
  return null
}

export default function TourCardPlacementPage() {
  return (
    <Suspense fallback={null}>
      <PlacementFixture />
    </Suspense>
  )
}

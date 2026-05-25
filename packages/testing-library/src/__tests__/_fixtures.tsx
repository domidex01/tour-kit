'use client'

import { type Tour, TourProvider, useTour } from '@tour-kit/core'
import { TourCard } from '@tour-kit/react'
import * as React from 'react'
import { HookProbe } from '../helpers/hook-probe'

export const twoStepTour: Tour = {
  id: 'demo',
  steps: [
    { id: 'welcome', target: '[data-test=welcome-target]', title: 'Welcome', content: 'Hi' },
    { id: 'pricing', target: '[data-test=pricing-target]', title: 'Pricing', content: 'Pay' },
  ],
}

export const threeStepTour: Tour = {
  id: 'demo3',
  steps: [
    { id: 'welcome', target: '[data-test=welcome-target]', title: 'Welcome', content: 'Hi' },
    { id: 'pricing', target: '[data-test=pricing-target]', title: 'Pricing', content: 'Pay' },
    { id: 'finale', target: '[data-test=finale-target]', title: 'Finale', content: 'Done' },
  ],
}

function AutoStart({ tourId }: { tourId: string }) {
  const { start } = useTour()
  const startedRef = React.useRef(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-once start
  React.useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    start(tourId)
  }, [])
  return null
}

export function TwoStepFixture() {
  return (
    <>
      <div data-test="welcome-target">welcome target</div>
      <div data-test="pricing-target">pricing target</div>
      <TourProvider tours={[twoStepTour]}>
        <AutoStart tourId="demo" />
        <TourCard />
        <HookProbe />
      </TourProvider>
    </>
  )
}

export function ThreeStepFixture() {
  return (
    <>
      <div data-test="welcome-target">welcome target</div>
      <div data-test="pricing-target">pricing target</div>
      <div data-test="finale-target">finale target</div>
      <TourProvider tours={[threeStepTour]}>
        <AutoStart tourId="demo3" />
        <TourCard />
        <HookProbe />
      </TourProvider>
    </>
  )
}

/**
 * Two-step tour wired with an `onSkip` callback. Backs the recipe §3 guard —
 * skipping mid-tour must invoke the tour's `onSkip`.
 */
export function SkipFixture({ onSkip }: { onSkip: Tour['onSkip'] }) {
  const tour: Tour = { ...twoStepTour, id: 'skip-demo', onSkip }
  return (
    <>
      <div data-test="welcome-target">welcome target</div>
      <div data-test="pricing-target">pricing target</div>
      <TourProvider tours={[tour]}>
        <AutoStart tourId="skip-demo" />
        <TourCard />
        <HookProbe />
      </TourProvider>
    </>
  )
}

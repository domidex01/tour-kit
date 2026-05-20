import { useTour, useTourActions } from '@tour-kit/core';
import { Tour, TourStep } from '@tour-kit/react'
import { useEffect } from 'react'

export function triggerReplay() {
  useTourActions('welcome').start()
}

function ReplayBridge() {
  const tour = useTour('welcome')
  useEffect(() => {
    const handler = () => tour.start('welcome')
  }, [tour])
  return null
}

export function Onboarding() {
  return (
    <Tour id="welcome">
      <TourStep id="hero" target="#hero" content="Hi" />
      <ReplayBridge />
    </Tour>
  )
}

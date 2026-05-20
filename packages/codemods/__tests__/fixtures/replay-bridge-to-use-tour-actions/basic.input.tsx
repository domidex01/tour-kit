import { useTour } from '@tour-kit/core'
import { Tour, TourStep } from '@tour-kit/react'
import { useEffect } from 'react'

export function triggerReplay() {
  window.dispatchEvent(new CustomEvent('tour-replay', { detail: { id: 'welcome' } }))
}

function ReplayBridge() {
  const tour = useTour('welcome')
  useEffect(() => {
    const handler = () => tour.start('welcome')
    window.addEventListener('tour-replay', handler)
    return () => window.removeEventListener('tour-replay', handler)
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

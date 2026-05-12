// Migration target — useJoyride() collapses to Tour Kit's useTour() + a
// rendered <TourProvider> ancestor that owns the tour registry.

import { TourProvider, useTour } from '@tour-kit/react'
import { useEffect } from 'react'

const steps = [
  { target: '[data-tour="sidebar"]', content: 'Navigation lives here.' },
  { target: '[data-tour="search"]', content: 'Use search to jump anywhere.' },
  { target: '[data-tour="profile"]', content: 'Open your profile menu here.' },
]

function TourBootstrap() {
  const { start } = useTour()
  useEffect(() => {
    start()
  }, [start])
  return null
}

export function ProductTour() {
  return (
    <TourProvider tours={[{ id: 'product', steps }]}>
      <TourBootstrap />
    </TourProvider>
  )
}

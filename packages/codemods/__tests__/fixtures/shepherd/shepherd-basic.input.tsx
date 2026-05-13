// Source pattern: shepherd.js default import + chained addStep + start.
// Representative of OSS shepherd.js examples — a simple onboarding tour
// built imperatively in a React component effect.

import { useEffect } from 'react'
import Shepherd from 'shepherd.js'

export function OnboardingTour() {
  useEffect(() => {
    const tour = new Shepherd.Tour({ useModalOverlay: true })
    tour.addStep({
      id: 'welcome',
      attachTo: { element: '#app-header', on: 'bottom' },
      text: 'Welcome to the app.',
    })
    tour.addStep({
      id: 'cta',
      attachTo: { element: '#cta', on: 'top' },
      text: 'Click here to get started.',
    })
    tour.start()
  }, [])
  return null
}

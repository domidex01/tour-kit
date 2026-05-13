// Source pattern: shepherd.js default import + chained addStep + start.
// Representative of OSS shepherd.js examples — a simple onboarding tour
// built imperatively in a React component effect.

import { useEffect } from 'react'
import { TourProvider } from '@tour-kit/react';

export function OnboardingTour() {
  useEffect(() => {
    const tour = // TODO: Shepherd Tour constructed — register via <TourProvider tours={[migratedTour]}> in an ancestor and call useTour().start() to begin — see https://tourkit.dev/migration/shepherd#tour-constructor
    {
      id: 'migrated-tour',

      steps: [{
        id: 'welcome',
        target: '#app-header',
        placement: 'bottom',
        content: 'Welcome to the app.',
      }, {
        id: 'cta',
        target: '#cta',
        placement: 'top',
        content: 'Click here to get started.',
      }],
    }

    // TODO: Shepherd tour.start() → call useTour().start() from a descendant of <TourProvider> — see https://tourkit.dev/migration/shepherd#start

  }, [])
  return null
}

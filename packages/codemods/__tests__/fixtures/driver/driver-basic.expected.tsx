// Source pattern: driver.js v1+ — function-style imperative API. The
// shape that ships in driver.js docs verbatim.

import { useEffect } from 'react'
import { TourProvider } from '@tour-kit/react'

export function ProductTour() {
  useEffect(() => {
    const d = // TODO: driver.js config — register via <TourProvider tours={[migratedTour]}> in an ancestor; call useTour().start() to begin — see https://tourkit.dev/migration/driver#driver-call
    {
      id: 'migrated-tour',

      steps: [{
        target: '#hero',
        title: 'Welcome',
        content: 'Quick tour ahead.',
        placement: 'bottom',
      }, {
        target: '#cta',
        title: 'Get started',
        content: 'Click to begin.',
        placement: 'top',
      }],
    }

    // TODO: driver.js .drive() → call useTour().start() from a descendant of <TourProvider> — see https://tourkit.dev/migration/driver#drive

  }, [])
  return null
}

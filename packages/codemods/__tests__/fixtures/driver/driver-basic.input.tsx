// Source pattern: driver.js v1+ — function-style imperative API. The
// shape that ships in driver.js docs verbatim.

import { useEffect } from 'react'
import { driver } from 'driver.js'

export function ProductTour() {
  useEffect(() => {
    const d = driver({
      steps: [
        {
          element: '#hero',
          popover: { title: 'Welcome', description: 'Quick tour ahead.', side: 'bottom' },
        },
        {
          element: '#cta',
          popover: { title: 'Get started', description: 'Click to begin.', side: 'top' },
        },
      ],
    })
    d.drive()
  }, [])
  return null
}

// Source pattern: react-joyride v2 hook form (modern API).
// `useJoyride()` returns controls + a Tour component the consumer renders
// inline. Common in SaaS dashboards that ship Joyride v2.

import { useEffect } from 'react'
import { useJoyride } from 'react-joyride'

const steps = [
  { target: '[data-tour="sidebar"]', content: 'Navigation lives here.' },
  { target: '[data-tour="search"]', content: 'Use search to jump anywhere.' },
  { target: '[data-tour="profile"]', content: 'Open your profile menu here.' },
]

export function ProductTour() {
  const { Tour, controls } = useJoyride({ steps })

  useEffect(() => {
    controls.start()
  }, [controls])

  return <Tour />
}

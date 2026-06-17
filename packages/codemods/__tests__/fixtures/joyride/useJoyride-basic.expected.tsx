// Source pattern: react-joyride v2 hook form (modern API).
// `useJoyride()` returns controls + a Tour component the consumer renders
// inline. Common in SaaS dashboards that ship Joyride v2.

import { useEffect } from 'react'
import { useTour } from '@tour-kit/react'

const steps = [
  { target: '[data-tour="sidebar"]', content: 'Navigation lives here.' },
  { target: '[data-tour="search"]', content: 'Use search to jump anywhere.' },
  { target: '[data-tour="profile"]', content: 'Open your profile menu here.' },
]

export function ProductTour() {
  // TODO: useJoyride() collapsed to useTour() — register the tour at a parent: <TourProvider tours={[{ id: "migrated-tour", steps }]}> — see https://usertourkit.com/migration/joyride#use-joyride-hook
  // TODO: Joyride controls.start/.next/.previous/.skip map to Tour Kit useTour() returns; verify each call site — see https://usertourkit.com/migration/joyride#controls-api
  const controls = useTour();

  useEffect(() => {
    controls.start()
  }, [controls])

  return (
    // TODO: <Tour /> from useJoyride was rendered inline — Tour Kit renders via <TourProvider> + <TourCard /> in an ancestor — see https://usertourkit.com/migration/joyride#tour-component
    null
  );
}

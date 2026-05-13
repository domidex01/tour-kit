// Source pattern: useJoyride hook where the returned <Tour /> component is
// rendered inside another JSX element (e.g. a portal wrapper or a flex
// container). Covers the JSXExpressionContainer code-path in the transform —
// the comment-on-null branch only exercised here, not in the root-return
// fixtures.

import { useEffect } from 'react'
import { useTour } from '@tour-kit/react'

const steps = [
  { target: '[data-tour="root"]', content: 'Welcome.' },
  { target: '[data-tour="profile"]', content: 'Your profile.' },
]

export function PortaledTour() {
  // TODO: useJoyride() collapsed to useTour() — register the tour at a parent: <TourProvider tours={[{ id: "migrated-tour", steps }]}> — see https://tourkit.dev/migration/joyride#use-joyride-hook
  // TODO: Joyride controls.start/.next/.previous/.skip map to Tour Kit useTour() returns; verify each call site — see https://tourkit.dev/migration/joyride#controls-api
  const controls = useTour();

  useEffect(() => {
    controls.start()
  }, [controls])

  return (
    <div className='tour-host'>
      {// TODO: <Tour /> from useJoyride was rendered inline — Tour Kit renders via <TourProvider> + <TourCard /> in an ancestor — see https://tourkit.dev/migration/joyride#tour-component
      null}
    </div>
  );
}

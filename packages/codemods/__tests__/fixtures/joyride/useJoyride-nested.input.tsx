// Source pattern: useJoyride hook where the returned <Tour /> component is
// rendered inside another JSX element (e.g. a portal wrapper or a flex
// container). Covers the JSXExpressionContainer code-path in the transform —
// the comment-on-null branch only exercised here, not in the root-return
// fixtures.

import { useEffect } from 'react'
import { useJoyride } from 'react-joyride'

const steps = [
  { target: '[data-tour="root"]', content: 'Welcome.' },
  { target: '[data-tour="profile"]', content: 'Your profile.' },
]

export function PortaledTour() {
  const { Tour, controls } = useJoyride({ steps })

  useEffect(() => {
    controls.start()
  }, [controls])

  return (
    <div className='tour-host'>
      <Tour />
    </div>
  )
}

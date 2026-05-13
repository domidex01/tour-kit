// Source pattern: driver.js with a step that uses a captured DOM Element
// instance (not a selector). The codemod can't statically resolve this — it
// emits a TODO and leaves the binding in place for hand-port.

import { driver } from 'driver.js'

export function highlightOnboardingNode(el: HTMLElement) {
  const d = driver({
    steps: [
      {
        element: el,
        popover: { title: 'Hi', description: 'Just here.', side: 'top' },
      },
      {
        element: '#static-anchor',
        popover: { title: 'Static', description: 'Selector-anchored.', side: 'bottom' },
      },
    ],
  })
  d.drive()
}

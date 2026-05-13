// Source pattern: driver.js with a step that uses a captured DOM Element
// instance (not a selector). The codemod can't statically resolve this — it
// emits a TODO and leaves the binding in place for hand-port.

import { TourProvider } from '@tour-kit/react'

export function highlightOnboardingNode(el: HTMLElement) {
  const d = // TODO: driver.js config — register via <TourProvider tours={[migratedTour]}> in an ancestor; call useTour().start() to begin — see https://tourkit.dev/migration/driver#driver-call
  // TODO: driver.js Step.element is a DOM Element instance — Tour Kit expects a selector string or DOM ref — see https://tourkit.dev/migration/driver#element-dom
  {
    id: 'migrated-tour',

    steps: [{
      target: el,
      title: 'Hi',
      content: 'Just here.',
      placement: 'top',
    }, {
      target: '#static-anchor',
      title: 'Static',
      content: 'Selector-anchored.',
      placement: 'bottom',
    }],
  }

  // TODO: driver.js .drive() → call useTour().start() from a descendant of <TourProvider> — see https://tourkit.dev/migration/driver#drive

}

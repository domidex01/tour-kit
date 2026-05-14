// Source pattern: shepherd.js named { Tour } import (common in TypeScript
// codebases that prefer ergonomic named imports over the default re-export).

import { Tour } from 'shepherd.js'

export function startProductTour() {
  const tour = new Tour({ useModalOverlay: false })
  tour.addStep({
    id: 'sidebar',
    attachTo: { element: '[data-tour="sidebar"]', on: 'right' },
    text: 'Navigation lives here.',
  })
  tour.addStep({
    id: 'search',
    attachTo: { element: '[data-tour="search"]', on: 'bottom' },
    text: 'Use search to jump anywhere.',
  })
  tour.addStep({
    id: 'profile',
    attachTo: { element: '[data-tour="profile"]', on: 'left' },
    text: 'Open your profile here.',
  })
  tour.start()
}

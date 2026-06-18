// Source pattern: shepherd.js named { Tour } import (common in TypeScript
// codebases that prefer ergonomic named imports over the default re-export).

import { TourProvider } from '@tour-kit/react'

export function startProductTour() {
  const tour = // TODO: Shepherd Tour constructed — register via <TourProvider tours={[migratedTour]}> in an ancestor and call useTour().start() to begin — see https://usertourkit.com/migration/shepherd#tour-constructor
  {
    id: 'migrated-tour',

    steps: [{
      id: 'sidebar',
      target: '[data-tour="sidebar"]',
      placement: 'right',
      content: 'Navigation lives here.',
    }, {
      id: 'search',
      target: '[data-tour="search"]',
      placement: 'bottom',
      content: 'Use search to jump anywhere.',
    }, {
      id: 'profile',
      target: '[data-tour="profile"]',
      placement: 'left',
      content: 'Open your profile here.',
    }],
  }

  // TODO: Shepherd tour.start() → call useTour().start() from a descendant of <TourProvider> — see https://usertourkit.com/migration/shepherd#start

}

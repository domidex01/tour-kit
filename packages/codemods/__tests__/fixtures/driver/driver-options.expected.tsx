// Source pattern: driver.js with tour-level options (showProgress,
// allowClose, button-label overrides). Each tour-level field maps to a slot
// composition in Tour Kit; the codemod emits TODOs for every one.

import { TourProvider } from '@tour-kit/react'

export function startAdminTour() {
  const d = // TODO: driver.js config — register via <TourProvider tours={[migratedTour]}> in an ancestor; call useTour().start() to begin — see https://tourkit.dev/migration/driver#driver-call
  // TODO: driver.js showProgress → render <TourProgress /> inside <TourCard /> — see https://tourkit.dev/migration/driver#show-progress
  // TODO: driver.js allowClose → omit / include <TourClose /> inside <TourCard /> — see https://tourkit.dev/migration/driver#allow-close
  // TODO: driver.js nextBtnText → pass labels to your <TourNavigation /> slot — see https://tourkit.dev/migration/driver#btn-text
  // TODO: driver.js prevBtnText → pass labels to your <TourNavigation /> slot — see https://tourkit.dev/migration/driver#btn-text
  // TODO: driver.js doneBtnText → pass labels to your <TourNavigation /> slot — see https://tourkit.dev/migration/driver#btn-text
  {
    id: 'migrated-tour',

    steps: [{
      target: '#dashboard',
      title: 'Dashboard',
      content: 'Your KPIs.',
      placement: 'right',
    }, {
      target: '#settings',
      title: 'Settings',
      content: 'Configure here.',
      placement: 'left',
    }, {
      target: '#logout',
      title: 'Sign out',
      content: 'Use this to log out.',
      placement: 'top',
    }],
  }

  // TODO: driver.js .drive() → call useTour().start() from a descendant of <TourProvider> — see https://tourkit.dev/migration/driver#drive

}

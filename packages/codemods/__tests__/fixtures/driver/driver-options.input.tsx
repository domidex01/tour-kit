// Source pattern: driver.js with tour-level options (showProgress,
// allowClose, button-label overrides). Each tour-level field maps to a slot
// composition in Tour Kit; the codemod emits TODOs for every one.

import { driver } from 'driver.js'

export function startAdminTour() {
  const d = driver({
    showProgress: true,
    allowClose: false,
    nextBtnText: 'Continue',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    steps: [
      {
        element: '#dashboard',
        popover: { title: 'Dashboard', description: 'Your KPIs.', side: 'right' },
      },
      {
        element: '#settings',
        popover: { title: 'Settings', description: 'Configure here.', side: 'left' },
      },
      {
        element: '#logout',
        popover: { title: 'Sign out', description: 'Use this to log out.', side: 'top' },
      },
    ],
  })
  d.drive()
}

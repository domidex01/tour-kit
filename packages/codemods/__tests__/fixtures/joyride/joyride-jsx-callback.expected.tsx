// Migration target for the branching-callback flow.
// Tour Kit replaces the action enum with onTourEnd/onTourSkip + per-step
// onAdvance hooks. stepIndex is owned by the TourProvider — consumer doesn't
// drive it from React state anymore.

import { TourProvider, useTour } from '@tour-kit/react'
import { useState } from 'react'

const steps = [
  { target: '#dashboard-header', content: 'Your dashboard summary lives here.' },
  { target: '#new-report-btn', content: 'Create new reports from this button.' },
  { target: '#help-link', content: 'Need help? Open the docs.' },
]

function DashboardController({ open }: { open: boolean }) {
  const { start } = useTour()
  if (open) start()
  return null
}

export function DashboardTour() {
  const [run, setRun] = useState(true)

  return (
    <TourProvider
      tours={[{ id: 'dashboard', steps }]}
      onTourEnd={() => setRun(false)}
      onTourSkip={() => setRun(false)}
    >
      <DashboardController open={run} />
    </TourProvider>
  )
}

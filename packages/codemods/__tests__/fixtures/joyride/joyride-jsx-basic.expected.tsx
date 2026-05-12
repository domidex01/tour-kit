// Migration target — same legacy Joyride flow rewritten to Tour Kit.
// Phase 7a's codemod must produce this shape for the .input.tsx counterpart.

import { TourProvider, useTour } from '@tour-kit/react'
import { useState } from 'react'

const steps = [
  { target: '.app-header', content: 'Welcome to the app!' },
  { target: '.cta-button', content: 'Click here to get started.' },
]

function TourRunner({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { start, end } = useTour()
  if (open) start()
  return (
    <button
      type="button"
      onClick={() => {
        end()
        onClose()
      }}
    >
      Stop tour
    </button>
  )
}

export function OnboardingTour() {
  const [run, setRun] = useState(true)

  return (
    <TourProvider
      tours={[{ id: 'onboarding', steps }]}
      onTourEnd={() => setRun(false)}
      onTourSkip={() => setRun(false)}
    >
      <TourRunner open={run} onClose={() => setRun(false)} />
    </TourProvider>
  )
}

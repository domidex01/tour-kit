// Source pattern: react-joyride legacy JSX form with a branching callback.
// Covers `action: 'next' | 'skip' | 'close'` discrimination — the most common
// shape in OSS Joyride integrations (e.g. dashboards and admin panels).

import { useCallback, useState } from 'react'
import Joyride, { type CallBackProps, ACTIONS, STATUS } from 'react-joyride'

const steps = [
  { target: '#dashboard-header', content: 'Your dashboard summary lives here.' },
  { target: '#new-report-btn', content: 'Create new reports from this button.' },
  { target: '#help-link', content: 'Need help? Open the docs.' },
]

export function DashboardTour() {
  const [run, setRun] = useState(true)
  const [stepIndex, setStepIndex] = useState(0)

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { action, index, status } = data

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false)
      return
    }

    if (action === ACTIONS.NEXT) {
      setStepIndex(index + 1)
    } else if (action === ACTIONS.PREV) {
      setStepIndex(Math.max(0, index - 1))
    } else if (action === ACTIONS.SKIP || action === ACTIONS.CLOSE) {
      setRun(false)
    }
  }, [])

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
    />
  )
}

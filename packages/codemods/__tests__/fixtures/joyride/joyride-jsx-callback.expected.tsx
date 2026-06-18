// Source pattern: react-joyride legacy JSX form with a branching callback.
// Covers `action: 'next' | 'skip' | 'close'` discrimination — the most common
// shape in OSS Joyride integrations (e.g. dashboards and admin panels).

import { useCallback, useState } from 'react'
import { TourProvider } from '@tour-kit/react';

// TODO: Import 'CallBackProps' has no Tour Kit equivalent — remove this import and rework references — see https://usertourkit.com/migration/joyride#callbackprops
// TODO: Import 'ACTIONS' has no Tour Kit equivalent — remove this import and rework references — see https://usertourkit.com/migration/joyride#actions
// TODO: Import 'STATUS' has no Tour Kit equivalent — remove this import and rework references — see https://usertourkit.com/migration/joyride#status
import { type CallBackProps, ACTIONS, STATUS } from 'react-joyride';

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
    // TODO: <Joyride run> — Tour Kit is imperative; call useTour().start() from a descendant — see https://usertourkit.com/migration/joyride#run-prop
    // TODO: <Joyride stepIndex> — Tour Kit owns step index internally; use useTour().goTo() — see https://usertourkit.com/migration/joyride#step-index
    // TODO: <Joyride continuous> is the default in Tour Kit (no opt-in needed) — see https://usertourkit.com/migration/joyride#continuous
    // TODO: <Joyride showProgress> → render <TourProgress /> inside <TourCard /> — see https://usertourkit.com/migration/joyride#show-progress
    // TODO: <Joyride showSkipButton> → render <TourClose /> inside <TourCard /> — see https://usertourkit.com/migration/joyride#show-skip-button
    // TODO: <Joyride callback> splits into onTourEnd / onTourSkip / onStepAdvance — see https://usertourkit.com/migration/joyride#callback
    <TourProvider
      tours={[{
        id: 'migrated-tour',
        steps: steps,
      }]} />
  );
}

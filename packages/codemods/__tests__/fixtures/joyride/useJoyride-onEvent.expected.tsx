// Migration target — onEvent becomes per-callback props on TourProvider
// (onStepAdvance / onTourEnd). The codemod doesn't try to be clever about
// every status string; it scaffolds the prop wiring and leaves the body
// of each handler verbatim.

import { TourProvider, useTour } from '@tour-kit/react'
import { useCallback, useEffect } from 'react'

const steps = [
  { target: '#getting-started', content: 'Start here.' },
  { target: '#workspace', content: 'This is your workspace.' },
  { target: '#integrations', content: 'Wire up integrations from this menu.' },
  { target: '#billing', content: 'Manage billing here.' },
]

function track(event: string, payload: Record<string, unknown>): void {
  void event
  void payload
}

function TourBootstrap() {
  const { start } = useTour()
  useEffect(() => {
    start()
  }, [start])
  return null
}

export function AnalyticsTour() {
  const onStepAdvance = useCallback((args: { index: number; status: string }) => {
    track('tour_step_completed', { index: args.index, status: args.status })
  }, [])

  const onTourEnd = useCallback((args: { status: string }) => {
    track('tour_completed', { status: args.status })
  }, [])

  return (
    <TourProvider
      tours={[{ id: 'analytics', steps }]}
      onStepAdvance={onStepAdvance}
      onTourEnd={onTourEnd}
    >
      <TourBootstrap />
    </TourProvider>
  )
}

// Source pattern: useJoyride hook with an onEvent handler reading
// EventData.action / index / status. Mirrors how v2 codebases consume tour
// events for analytics + cross-step logic.

import { useCallback, useEffect } from 'react'
import { useTour } from '@tour-kit/react';

// TODO: Import 'EventData' has no Tour Kit equivalent — remove this import and rework references — see https://usertourkit.com/migration/joyride#eventdata
import { type EventData } from 'react-joyride';

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

export function AnalyticsTour() {
  const onEvent = useCallback((data: EventData) => {
    const { action, index, status, type } = data
    if (type === 'step:after' && action === 'next') {
      track('tour_step_completed', { index, status })
    }
    if (type === 'tour:end') {
      track('tour_completed', { status })
    }
  }, [])

  // TODO: useJoyride() collapsed to useTour() — register the tour at a parent: <TourProvider tours={[{ id: "migrated-tour", steps }]}> — see https://usertourkit.com/migration/joyride#use-joyride-hook
  // TODO: Joyride controls.start/.next/.previous/.skip map to Tour Kit useTour() returns; verify each call site — see https://usertourkit.com/migration/joyride#controls-api
  const controls = useTour();

  useEffect(() => {
    controls.start()
  }, [controls])

  return (
    // TODO: <Tour /> from useJoyride was rendered inline — Tour Kit renders via <TourProvider> + <TourCard /> in an ancestor — see https://usertourkit.com/migration/joyride#tour-component
    null
  );
}

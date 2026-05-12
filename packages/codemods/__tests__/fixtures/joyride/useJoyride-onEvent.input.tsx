// Source pattern: useJoyride hook with an onEvent handler reading
// EventData.action / index / status. Mirrors how v2 codebases consume tour
// events for analytics + cross-step logic.

import { useCallback, useEffect } from 'react'
import { type EventData, useJoyride } from 'react-joyride'

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

  const { Tour, controls } = useJoyride({ steps, onEvent })

  useEffect(() => {
    controls.start()
  }, [controls])

  return <Tour />
}

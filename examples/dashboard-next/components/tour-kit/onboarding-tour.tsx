'use client'

import { useEffect, useState } from 'react'
import { Tour, TourStep } from '@tour-kit/react'
import { useSurvey } from '@tour-kit/surveys'

export function OnboardingTour() {
  const [mounted, setMounted] = useState(false)
  const csat = useSurvey('onboarding-csat')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  if (!mounted) return null

  return (
    <Tour id="dashboard-onboarding" autoStart onComplete={() => csat.show()}>
      <TourStep
        id="nav"
        target="#sidebar-nav"
        title="Your navigation lives here"
        content="Jump between projects, team, settings, and help."
      />
      <TourStep
        id="new-project"
        target="#new-project-btn"
        title="Start a new project anytime"
        content="Projects group kanban cards, teammates, and discussions."
      />
      <TourStep
        id="search"
        target="#search-input"
        title="⌘K opens global search"
        content="Find any project, person, or setting without clicking through."
      />
      <TourStep
        id="notifications"
        target="#notifications-btn"
        title="Check what changed while you were away"
        content="Mentions, replies, and card moves land here."
      />
      <TourStep
        id="user-menu"
        target="#user-menu"
        title="Settings and billing live under your avatar"
        content="Switch themes, invite teammates, manage your plan."
      />
    </Tour>
  )
}

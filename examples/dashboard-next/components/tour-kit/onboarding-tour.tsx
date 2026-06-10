'use client'

import { Tour, TourStep } from '@tour-kit/react'

/**
 * The headless onboarding tour (Director cue 1). Walks the sidebar:
 * Projects → Analytics → Team. Targets the stable `#nav-*` anchors so it
 * works on any dashboard route without navigation.
 *
 * Rendered inside <ToursHost>'s MultiTourKitProvider, so this acts as a
 * registrar — the shared <TourCard>/<TourOverlay> render the active step.
 */
export function OnboardingTour() {
  return (
    <Tour id="dashboard-onboarding">
      <TourStep
        id="nav"
        target="#sidebar-nav"
        title="Welcome to Helm"
        content="Your whole workspace lives in this rail. Let's take the three-stop tour."
      />
      <TourStep
        id="projects"
        target="#nav-projects"
        title="Projects"
        content="Every initiative you track, with live health scores and owners."
      />
      <TourStep
        id="analytics"
        target="#nav-analytics"
        title="Analytics"
        content="MRR, activation, retention — the numbers that matter, in one place."
      />
      <TourStep
        id="team"
        target="#nav-team"
        title="Team"
        content="Invite teammates and manage roles. That's the tour — you're set."
      />
    </Tour>
  )
}

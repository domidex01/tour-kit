'use client'

import { Tour, TourStep } from '@tour-kit/react'

/**
 * Director cue 6 — a single-step tour whose card embeds a @tour-kit/media
 * asset (an animated SVG) above the copy. Demonstrates "media inside a tour
 * step". Targets the MRR KPI card on the dashboard.
 */
export function MediaSpotlightTour() {
  return (
    <Tour id="media-spotlight">
      <TourStep
        id="media"
        target="#kpi-mrr"
        title="Watch a metric move"
        content="Drop a Loom, Lottie, GIF, or video straight into any tour step with @tour-kit/media."
        media={{
          type: 'image',
          src: '/media/tour-step.svg',
          alt: 'Helm analytics animation',
          aspectRatio: '16/9',
        }}
        placement="bottom"
      />
    </Tour>
  )
}

/**
 * Director cue 7 — the tour the AI assistant "launches" after the user asks
 * how to invite a teammate. Single spotlight on the Team nav item so it
 * works on any dashboard route.
 */
export function InviteTeammateTour() {
  return (
    <Tour id="invite-teammate">
      <TourStep
        id="team-nav"
        target="#nav-team"
        title="Invite a teammate"
        content="Open Team, hit Invite, and share the link — they join with their work email."
        placement="right"
      />
    </Tour>
  )
}

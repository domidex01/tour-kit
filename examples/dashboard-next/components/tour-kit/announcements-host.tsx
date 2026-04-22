'use client'

import { AnnouncementModal, AnnouncementToast } from '@tour-kit/announcements'
import { TourMedia } from '@tour-kit/media'
import { ScheduledBanner } from './scheduled-banner'

export function AnnouncementsHost() {
  return (
    <>
      <AnnouncementModal id="welcome" useConfig>
        <TourMedia
          src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          alt="Stacks 2-minute walkthrough"
          type="video"
        />
      </AnnouncementModal>
      <ScheduledBanner />
      <AnnouncementToast id="ai-live" useConfig />
    </>
  )
}

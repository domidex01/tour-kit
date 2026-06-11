'use client'

import {
  type AnnouncementConfig,
  AnnouncementModal,
  AnnouncementToast,
  AnnouncementsProvider,
  useAnnouncement,
} from '@tour-kit/announcements'
import { Bell, MessageSquare } from 'lucide-react'

import { DemoSurface, MockRow } from './demo-surface'
import { MaybeLicensed } from './maybe-licensed'

/**
 * The real @tour-kit/announcements components, triggered on demand.
 * `storage={null}` + `frequency: 'always'` keep the demo repeatable —
 * the default localStorage frequency tracking would suppress re-shows.
 */
const DEMO_ANNOUNCEMENTS: AnnouncementConfig[] = [
  {
    id: 'capability-demo-modal',
    variant: 'modal',
    priority: 'high',
    title: 'Dark mode is here',
    description:
      'This modal is the live @tour-kit/announcements component — focus-trapped, Esc to close, styled with this site’s own design tokens. Attach media, actions, scheduling, and audience rules in config.',
    frequency: 'always',
    autoShow: false,
    modalOptions: { size: 'md', closeOnEscape: true, showCloseButton: true },
  },
  {
    id: 'capability-demo-toast',
    variant: 'toast',
    priority: 'normal',
    title: 'Changelog published',
    description: 'A corner toast with auto-dismiss and a progress bar.',
    frequency: 'always',
    autoShow: false,
    toastOptions: {
      position: 'bottom-right',
      autoDismiss: true,
      autoDismissDelay: 5000,
      showProgress: true,
      intent: 'info',
    },
  },
]

function DemoTriggers() {
  const modal = useAnnouncement('capability-demo-modal')
  const toast = useAnnouncement('capability-demo-toast')

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
      <p className="text-[14px] text-fd-muted-foreground">
        Press a button — what opens is the real component, not a recording.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => modal.show()}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0197f6] px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-[#0197f6]/20 transition-all hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0197f6]"
        >
          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
          Show modal announcement
        </button>
        <button
          type="button"
          onClick={() => toast.show()}
          className="inline-flex items-center gap-2 rounded-lg border border-fd-border bg-fd-background px-5 py-2.5 text-[13px] font-semibold text-fd-foreground transition-all hover:-translate-y-0.5 hover:bg-fd-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0197f6]"
        >
          <Bell className="h-3.5 w-3.5" aria-hidden="true" />
          Show toast
        </button>
      </div>

      {/* Mock app rows behind the demo */}
      <div className="w-full space-y-2.5 pt-4">
        <MockRow />
        <MockRow width="w-4/5" />
        <MockRow width="w-3/5" />
      </div>
    </div>
  )
}

export function AnnouncementDemo() {
  return (
    <MaybeLicensed>
      <AnnouncementsProvider announcements={DEMO_ANNOUNCEMENTS} storage={null}>
        <DemoSurface url="acme.app/dashboard" contentClassName="py-10">
          <DemoTriggers />
        </DemoSurface>
        <AnnouncementModal id="capability-demo-modal" useConfig />
        <AnnouncementToast id="capability-demo-toast" useConfig />
      </AnnouncementsProvider>
    </MaybeLicensed>
  )
}

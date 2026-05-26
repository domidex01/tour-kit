'use client'

import {
  AnnouncementBanner,
  AnnouncementModal,
  AnnouncementSlideout,
  AnnouncementSpotlight,
  AnnouncementToast,
  useAnnouncement,
  useAnnouncementQueue,
} from '@tour-kit/announcements'
import { type Schedule, useScheduleStatus, useUserTimezone } from '@tour-kit/scheduling'
import { ScheduleGate } from '@tour-kit/scheduling'
import { useEffect, useRef, useState } from 'react'

// ── Variant trigger button ─────────────────────────────────

function VariantTrigger({
  id,
  label,
  priority,
}: {
  id: string
  label: string
  priority: string
}) {
  // forceShow bypasses frequency/cooldown so the demo button always fires.
  const { forceShow, isVisible } = useAnnouncement(id)
  return (
    <button
      type="button"
      onClick={() => forceShow()}
      className="flex items-center justify-between gap-3 rounded-md border bg-popover px-4 py-3 text-left shadow-sm transition-colors hover:bg-accent"
    >
      <span>
        <span className="font-medium">{label}</span>
        <span className="ml-2 text-xs uppercase text-muted-foreground">{priority}</span>
      </span>
      <span className="text-xs text-muted-foreground">{isVisible ? 'showing' : 'trigger'}</span>
    </button>
  )
}

// ── Queue + priority demo ──────────────────────────────────

function QueueDemo() {
  // show() (not forceShow) routes through the priority queue with
  // maxConcurrent:1, so firing several at once shows the highest priority
  // first and queues the rest in priority order.
  const modal = useAnnouncement('demo-modal') // critical
  const slideout = useAnnouncement('demo-slideout') // high
  const banner = useAnnouncement('demo-banner') // normal
  const toast = useAnnouncement('demo-toast') // low
  const { queue, size, isEmpty, clear, showNext } = useAnnouncementQueue()

  function triggerAll() {
    // show() routes through the queue (maxConcurrent: 1). The first call shows
    // immediately; the rest queue and are ordered by priority — dismiss the
    // visible one and the next-highest is promoted automatically.
    modal.show() // critical — shows first
    banner.show() // normal
    toast.show() // low
    slideout.show() // high — but still queued ahead of banner/toast by priority
  }

  return (
    <section className="space-y-3 rounded-lg border bg-muted/40 p-6">
      <h2 className="text-lg font-semibold">Priority queue</h2>
      <p className="text-sm text-muted-foreground">
        Fires four announcements at once. With{' '}
        <code className="rounded bg-muted px-1">maxConcurrent: 1</code>, only one shows at a time
        (the business-hours banner below may already hold the slot) and the rest wait in the queue
        ordered by priority (critical → high → normal → low). Use <em>Show next</em> to promote the
        front of the queue.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={triggerAll}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Trigger all 4 (queue demo)
        </button>
        <button
          type="button"
          onClick={showNext}
          disabled={isEmpty}
          className="rounded-md border px-4 py-2 text-sm transition-colors hover:bg-accent disabled:opacity-50"
        >
          Show next from queue
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={isEmpty}
          className="rounded-md border px-4 py-2 text-sm transition-colors hover:bg-accent disabled:opacity-50"
        >
          Clear queue
        </button>
      </div>
      <div className="rounded-md bg-background p-3 text-sm" data-testid="queue-state">
        <span className="font-medium">Queue ({size}):</span>{' '}
        {isEmpty ? (
          <span className="text-muted-foreground">empty</span>
        ) : (
          <span className="font-mono">{queue.join(' → ')}</span>
        )}
      </div>
    </section>
  )
}

// ── Scheduling demo ────────────────────────────────────────

const businessHours: Schedule = {
  daysOfWeek: [1, 2, 3, 4, 5],
  timeOfDay: { start: '09:00', end: '17:00' },
  useUserTimezone: true,
}

const weekdayRecurring: Schedule = {
  recurring: { type: 'weekly', interval: 1, daysOfWeek: [1, 2, 3, 4, 5] },
  useUserTimezone: true,
}

function ScheduleStatusRow({ label, schedule }: { label: string; schedule: Schedule }) {
  const status = useScheduleStatus(schedule)
  return (
    <div className="flex items-center justify-between rounded-md bg-background px-3 py-2 text-sm">
      <span className="font-medium">{label}</span>
      <span className="flex items-center gap-2">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            status.isActive ? 'bg-green-500' : 'bg-muted-foreground/40'
          }`}
          aria-hidden="true"
        />
        <span className={status.isActive ? 'text-green-600' : 'text-muted-foreground'}>
          {status.isActive ? 'active' : (status.reason ?? 'inactive')}
        </span>
      </span>
    </div>
  )
}

function ScheduledBanner() {
  const status = useScheduleStatus(businessHours)
  const announcement = useAnnouncement('demo-scheduled')
  const shown = useRef(false)

  useEffect(() => {
    if (!status.isActive) {
      shown.current = false
      return
    }
    if (shown.current || !announcement.config || announcement.isVisible) return
    shown.current = true
    announcement.forceShow()
  }, [status.isActive, announcement])

  if (!status.isActive) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="scheduled-banner-status">
        Maintenance banner hidden — {status.reason ?? 'inactive'} (shows during business hours).
      </p>
    )
  }
  return <AnnouncementBanner id="demo-scheduled" useConfig />
}

function SchedulingDemo() {
  const timezone = useUserTimezone()
  // Schedule status depends on the current time, which the server can't match —
  // gate the time-sensitive UI behind a mount flag to avoid hydration mismatch.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <ScheduleGate>
      <section className="space-y-4 rounded-lg border bg-muted/40 p-6">
        <div>
          <h2 className="text-lg font-semibold">Scheduling</h2>
          <p className="text-sm text-muted-foreground">
            Your timezone: <code className="rounded bg-muted px-1">{mounted ? timezone : '…'}</code>.
            Schedules are evaluated reactively and re-check on an interval.
          </p>
        </div>

        {mounted ? (
          <div className="space-y-2">
            <ScheduleStatusRow label="Always on" schedule={{}} />
            <ScheduleStatusRow label="Business hours (Mon–Fri, 9–17)" schedule={businessHours} />
            <ScheduleStatusRow label="Recurring weekly (weekdays)" schedule={weekdayRecurring} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Evaluating schedules…</p>
        )}

        <div className="rounded-md border-l-2 border-yellow-500 bg-background p-3">
          {mounted ? (
            <ScheduledBanner />
          ) : (
            <p className="text-sm text-muted-foreground">Checking schedule…</p>
          )}
        </div>
      </section>
    </ScheduleGate>
  )
}

// ── Frequency demo ─────────────────────────────────────────

function FrequencyDemo() {
  const { show, canShow, viewCount } = useAnnouncement('demo-once')
  return (
    <section className="space-y-3 rounded-lg border bg-muted/40 p-6">
      <h2 className="text-lg font-semibold">Frequency caps</h2>
      <p className="text-sm text-muted-foreground">
        <code className="rounded bg-muted px-1">frequency: "once"</code> — shown a maximum of one
        time, ever (persisted in localStorage). After it shows once,{' '}
        <code className="rounded bg-muted px-1">canShow</code> stays false across reloads.
      </p>
      <button
        type="button"
        onClick={() => show()}
        disabled={!canShow}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {canShow ? 'Show once-only toast' : 'Already shown (canShow: false)'}
      </button>
      <p className="text-xs text-muted-foreground">View count: {viewCount}</p>
    </section>
  )
}

// ── Variant host ───────────────────────────────────────────

function AnnouncementsHost() {
  return (
    <>
      <AnnouncementModal id="demo-modal" useConfig />
      <AnnouncementSlideout id="demo-slideout" useConfig />
      <AnnouncementBanner id="demo-banner" useConfig />
      <AnnouncementBanner id="demo-pro-only" useConfig />
      <AnnouncementToast id="demo-toast" useConfig />
      <AnnouncementToast id="demo-once" useConfig />
      <AnnouncementSpotlight id="demo-spotlight" useConfig />
    </>
  )
}

// ── Page ───────────────────────────────────────────────────

export default function AnnouncementsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header id="announcements-header">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Announcements &amp; Scheduling</h1>
          <p className="text-muted-foreground">
            Five display variants, a priority queue, frequency caps, audience targeting, and
            time-based scheduling. Open the console to see the lifecycle callbacks fire.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Display variants</h2>
          <p className="text-sm text-muted-foreground">
            Each button force-shows one variant immediately (bypassing frequency).
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <VariantTrigger id="demo-modal" label="Modal" priority="critical" />
            <VariantTrigger id="demo-slideout" label="Slideout" priority="high" />
            <VariantTrigger id="demo-banner" label="Banner" priority="normal" />
            <VariantTrigger id="demo-toast" label="Toast" priority="low" />
            <VariantTrigger id="demo-spotlight" label="Spotlight" priority="normal" />
            <VariantTrigger id="demo-pro-only" label="Pro-only banner (audience)" priority="high" />
          </div>
          {/* Spotlight anchor */}
          <div
            id="announce-spotlight-target"
            className="mt-2 inline-block rounded-md border border-dashed px-4 py-2 text-sm text-muted-foreground"
          >
            Spotlight target element
          </div>
        </section>

        <QueueDemo />
        <FrequencyDemo />
        <SchedulingDemo />

        <AnnouncementsHost />
      </div>
    </div>
  )
}

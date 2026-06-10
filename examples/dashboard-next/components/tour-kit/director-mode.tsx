'use client'

import { AdoptionReadout } from '@/components/tour-kit/adoption-readout'
import { resetAllDemoState } from '@/components/tour-kit/demo-panel'
import { useDirector } from '@/components/tour-kit/director-context'
import {
  NPS_CLOSE_EVENT,
  NPS_OPEN_EVENT,
  NpsSlideoutHost,
} from '@/components/tour-kit/nps-slideout-host'
import {
  TURNKEY_CES_EVENT,
  TURNKEY_CLOSE_EVENT,
  TURNKEY_NPS_EVENT,
} from '@/components/tour-kit/turnkey-survey-hosts'
import { AdoptionNudge, useFeature } from '@tour-kit/adoption'
import { useAiChat } from '@tour-kit/ai'
import { useAnnouncement } from '@tour-kit/announcements'
import { useChecklist } from '@tour-kit/checklists'
import { useTourActions } from '@tour-kit/core'
import { useSurvey } from '@tour-kit/surveys'
import {
  CheckSquare,
  Clapperboard,
  Clock,
  Compass,
  Eraser,
  EyeOff,
  Megaphone,
  MessageSquare,
  PlayCircle,
  RotateCcw,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const CUE_GAP = 2200 // ms between auto-play reel cuts (~B4 timing)

// Steps of the onboarding tour, exposed as clickable chips so any single step
// can be shown on demand. Ids must match the <TourStep id>s in onboarding-tour.tsx.
const ONBOARDING_STEPS = [
  { id: 'nav', label: 'Intro' },
  { id: 'projects', label: 'Projects' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'team', label: 'Team' },
]

interface GalleryItem {
  id: string
  label: string
  run: () => void
  steps?: { id: string; label: string }[]
}
interface GalleryGroup {
  title: string
  pkg: string
  icon: React.ComponentType<{ className?: string }>
  items: GalleryItem[]
}

/**
 * 🎬 Director mode — the manual recording / screenshot console.
 *
 * Hidden by default; open with the bottom-left launcher, the `~` key, or by
 * clicking it. It's a component gallery: every User Tour Kit component has a
 * one-click "Show" that first clears the stage, so the video maker can bring
 * up any single component on a clean dashboard and screenshot it. `~`/`Esc`
 * (or the eye button) hides the panel WITHOUT clearing the stage, so the shot
 * is free of dev chrome. "Auto-play reel" runs the storyboard B4 sequence.
 *
 * Mounted once in the dashboard layout (inside every provider). The reel hosts
 * below are always mounted; only the control panel is gated behind the toggle.
 */
export function DirectorMode() {
  const { enabled, toggle } = useDirector()

  // ── feature handles ────────────────────────────────────────────────
  const onboarding = useTourActions('dashboard-onboarding')
  const mediaTour = useTourActions('media-spotlight')
  const inviteTour = useTourActions('invite-teammate')

  const banner = useAnnouncement('product-update')
  const modal = useAnnouncement('welcome')
  const toast = useAnnouncement('ai-live')
  const slideout = useAnnouncement('whats-new')
  const spotlight = useAnnouncement('profile-feature')
  const scheduledBanner = useAnnouncement('business-hours')

  const checklist = useChecklist('get-started')
  const nps = useSurvey('nps-pulse')
  const csat = useSurvey('onboarding-csat')
  const aiChat = useAiChat()
  const exportFeature = useFeature('export-csv')

  // ── stage state ────────────────────────────────────────────────────
  const [nudgeKey, setNudgeKey] = useState(0)
  const [nudgeOn, setNudgeOn] = useState(false)
  const [showReadout, setShowReadout] = useState(false)
  const [reelRunning, setReelRunning] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const msgSeq = useRef(0)

  const schedule = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms))
  }, [])

  const clearTimers = useCallback(() => {
    for (const t of timers.current) clearTimeout(t)
    timers.current = []
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  // Dismiss every component so only one thing is on the stage at a time.
  const clearStage = useCallback(() => {
    onboarding.stop()
    mediaTour.stop()
    inviteTour.stop()
    banner.hide()
    modal.hide()
    toast.hide()
    slideout.hide()
    spotlight.hide()
    scheduledBanner.hide()
    nps.hide()
    window.dispatchEvent(new CustomEvent(NPS_CLOSE_EVENT))
    csat.hide()
    // turnkey NPS/CES modals live in TurnkeySurveyHosts' local state
    window.dispatchEvent(new CustomEvent(TURNKEY_CLOSE_EVENT))
    // collapse the checklist dock if its panel is open
    document.querySelector<HTMLButtonElement>('button[aria-label="Close checklist"]')?.click()
    aiChat.close()
    setNudgeOn(false)
    setShowReadout(false)
    setActiveId(null)
  }, [
    onboarding,
    mediaTour,
    inviteTour,
    banner,
    modal,
    toast,
    slideout,
    spotlight,
    scheduledBanner,
    nps,
    csat,
    aiChat,
  ])

  // Show one component on a freshly cleared stage. Cancels pending timers so
  // back-to-back clicks never cross-contaminate (a stale modal/survey stealing
  // focus from the next component's tour), then settles before showing.
  const present = useCallback(
    (id: string, fn: () => void) => {
      clearTimers()
      clearStage()
      setActiveId(id)
      schedule(fn, 320)
    },
    [clearTimers, clearStage, schedule]
  )

  // ── individual show actions ────────────────────────────────────────
  const showChecklist = useCallback(() => {
    checklist.restore()
    schedule(
      () =>
        document
          .querySelector<HTMLButtonElement>('button[aria-label="Open checklist"]')
          ?.click(),
      60
    )
    schedule(() => checklist.completeTask('create-project'), 1200)
  }, [checklist, schedule])

  const showNps = useCallback(() => {
    nps.reset()
    window.dispatchEvent(new CustomEvent(NPS_OPEN_EVENT))
  }, [nps])

  const showCsat = useCallback(() => {
    csat.reset()
    schedule(() => csat.show(), 120)
  }, [csat, schedule])

  const showNudge = useCallback(() => {
    setShowReadout(true)
    setNudgeOn(true)
    setNudgeKey((k) => k + 1)
    // Adopt a feature so the readout's adoption rate visibly climbs on camera.
    schedule(() => exportFeature.trackUsage(), 500)
  }, [exportFeature, schedule])

  const askAi = useCallback(() => {
    aiChat.open()
    msgSeq.current += 1
    const n = msgSeq.current
    aiChat.setMessages([
      { id: `dir-u-${n}`, role: 'user', parts: [{ type: 'text', text: 'how do I invite a teammate?' }] },
      {
        id: `dir-a-${n}`,
        role: 'assistant',
        parts: [{ type: 'text', text: "Sure — open Team and hit Invite. Here, I'll walk you through it." }],
      },
    ])
    // Hand off: chat shows the Q&A, then closes as the tour launches (chat and
    // tour-card focus traps can't both own focus, so they don't overlap).
    schedule(() => {
      aiChat.close()
      inviteTour.restart()
    }, 1600)
  }, [aiChat, inviteTour, schedule])

  // Jump the onboarding tour to a specific step. If already running, jump
  // instantly; otherwise start then re-issue goToStep until it sticks (restart
  // activates async and a late START_TOUR would clobber an early jump to step 0).
  const showStep = useCallback(
    (stepId: string) => {
      setActiveId('tour')
      if (onboarding.isActive) {
        onboarding.goToStep(stepId)
        return
      }
      clearTimers()
      clearStage()
      setActiveId('tour')
      schedule(() => onboarding.restart(), 320)
      schedule(() => onboarding.goToStep(stepId), 1100)
      schedule(() => onboarding.goToStep(stepId), 1450)
    },
    [onboarding, clearTimers, clearStage, schedule]
  )

  // ── gallery (grouped by package) ───────────────────────────────────
  const groups: GalleryGroup[] = useMemo(
    () => [
      {
        title: 'Tours',
        pkg: '@tour-kit/react',
        icon: Compass,
        items: [
          {
            id: 'tour',
            label: 'Onboarding tour',
            run: () => onboarding.restart(),
            steps: ONBOARDING_STEPS,
          },
          { id: 'media', label: 'Media inside a step', run: () => mediaTour.restart() },
        ],
      },
      {
        title: 'Announcements',
        pkg: '@tour-kit/announcements',
        icon: Megaphone,
        items: [
          { id: 'a-banner', label: 'Banner', run: () => banner.forceShow() },
          { id: 'a-modal', label: 'Modal', run: () => modal.forceShow() },
          { id: 'a-toast', label: 'Toast', run: () => toast.forceShow() },
          { id: 'a-slideout', label: 'Slideout', run: () => slideout.forceShow() },
          { id: 'a-spotlight', label: 'Spotlight', run: () => spotlight.forceShow() },
        ],
      },
      {
        title: 'Checklist',
        pkg: '@tour-kit/checklists',
        icon: CheckSquare,
        items: [{ id: 'checklist', label: 'Onboarding checklist', run: showChecklist }],
      },
      {
        title: 'Surveys',
        pkg: '@tour-kit/surveys',
        icon: MessageSquare,
        items: [
          { id: 's-nps', label: 'NPS slide-in', run: showNps },
          { id: 's-csat', label: 'CSAT modal', run: showCsat },
          { id: 's-npsm', label: 'NPS modal', run: () => window.dispatchEvent(new CustomEvent(TURNKEY_NPS_EVENT)) },
          { id: 's-ces', label: 'CES modal', run: () => window.dispatchEvent(new CustomEvent(TURNKEY_CES_EVENT)) },
        ],
      },
      {
        title: 'Adoption + analytics',
        pkg: '@tour-kit/adoption',
        icon: TrendingUp,
        items: [
          { id: 'nudge', label: 'Adoption nudge', run: showNudge },
          { id: 'readout', label: 'Live events readout', run: () => setShowReadout(true) },
        ],
      },
      {
        title: 'Scheduling',
        pkg: '@tour-kit/scheduling',
        icon: Clock,
        items: [{ id: 'sched', label: 'Business-hours banner', run: () => scheduledBanner.forceShow() }],
      },
      {
        title: 'AI assistant',
        pkg: '@tour-kit/ai',
        icon: Sparkles,
        items: [
          { id: 'ai-chat', label: 'Open chat', run: () => aiChat.open() },
          { id: 'ai-tour', label: 'Ask → launches tour', run: askAi },
        ],
      },
    ],
    [
      onboarding,
      mediaTour,
      banner,
      modal,
      toast,
      slideout,
      spotlight,
      scheduledBanner,
      aiChat,
      showChecklist,
      showNps,
      showCsat,
      showNudge,
      askAi,
    ]
  )

  // ── auto-play reel (storyboard B4 order) ───────────────────────────
  // Composite cuts (banner→modal, scheduled+media) re-use the gallery actions
  // but keep the storyboard's pacing. Ids align with gallery items so the
  // matching tile highlights as the reel plays.
  const reel = useMemo(
    () => [
      { id: 'tour', run: () => onboarding.restart() },
      {
        id: 'a-banner',
        run: () => {
          banner.forceShow()
          schedule(() => modal.forceShow(), 1500)
        },
      },
      { id: 'checklist', run: showChecklist },
      { id: 's-nps', run: showNps },
      { id: 'nudge', run: showNudge },
      {
        id: 'sched',
        run: () => {
          scheduledBanner.forceShow()
          schedule(() => mediaTour.restart(), 250)
        },
      },
      { id: 'ai-tour', run: askAi },
    ],
    [onboarding, banner, modal, scheduledBanner, mediaTour, showChecklist, showNps, showNudge, askAi, schedule]
  )

  const autoPlay = useCallback(() => {
    clearTimers()
    clearStage()
    setReelRunning(true)
    reel.forEach((cut, i) => {
      schedule(() => {
        if (i > 0) clearStage()
        setActiveId(cut.id)
        cut.run()
      }, i * CUE_GAP + 400)
    })
    schedule(() => setReelRunning(false), reel.length * CUE_GAP + 600)
  }, [reel, clearTimers, clearStage, schedule])

  const resetAll = useCallback(() => {
    clearTimers()
    resetAllDemoState()
  }, [clearTimers])

  return (
    <>
      {/* Always-mounted reel hosts — render nothing until fired. The tours
          themselves live in <ToursHost> (one shared MultiTourKitProvider). */}
      <NpsSlideoutHost />
      {nudgeOn && <AdoptionNudge key={nudgeKey} delay={0} position="top-right" />}
      {showReadout && <AdoptionReadout onClose={() => setShowReadout(false)} />}

      {/* Discoverable launcher when the panel is closed — click or press `~`. */}
      {!enabled && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Open Director mode (~)"
          title="Open Director (~)"
          className="fixed bottom-4 left-4 z-[60] flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#c9a033] bg-[#1e2023] text-[#c9a033] shadow-xl transition hover:scale-105"
        >
          <Clapperboard className="h-4 w-4" />
        </button>
      )}

      {enabled && (
        <div className="fixed bottom-5 right-5 z-[60] flex max-h-[82vh] w-72 flex-col overflow-hidden rounded-xl border border-pro/40 bg-popover/95 text-popover-foreground shadow-2xl backdrop-blur">
          {/* header */}
          <div className="flex shrink-0 items-center justify-between border-b border-pro/30 bg-pro/10 px-3 py-2">
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <Clapperboard className="h-4 w-4 text-pro" />
              Director
            </span>
            <button
              type="button"
              onClick={toggle}
              title="Hide panel for a clean screenshot (~ / Esc) — keeps the stage"
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <EyeOff className="h-3 w-3" /> hide
            </button>
          </div>

          {/* top actions */}
          <div className="flex shrink-0 items-center gap-1.5 border-b p-2">
            <button
              type="button"
              onClick={autoPlay}
              disabled={reelRunning}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              {reelRunning ? 'Playing…' : 'Auto-play reel'}
            </button>
            <button
              type="button"
              onClick={clearStage}
              title="Dismiss whatever is on screen (no reload)"
              className="flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs transition hover:bg-accent"
            >
              <Eraser className="h-3.5 w-3.5" />
              Clear
            </button>
            <button
              type="button"
              onClick={resetAll}
              title="Reset all Tour Kit state and reload"
              className="flex items-center justify-center rounded-md border px-2 py-1.5 text-xs transition hover:bg-accent"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* component gallery */}
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-2">
            {/* item.run handlers are deferred (onClick), not invoked in render —
                the ref-access analyzer can't see that, so suppress the false positive. */}
            {/* eslint-disable-next-line react-hooks/refs */}
            {groups.map((group) => (
              <div key={group.title}>
                <div className="mb-1 flex items-center gap-1.5 px-1">
                  <group.icon className="h-3.5 w-3.5 text-pro" />
                  <span className="text-[11px] font-semibold">{group.title}</span>
                  <span className="truncate font-mono text-[9px] text-muted-foreground">
                    {group.pkg}
                  </span>
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <div key={item.id}>
                      <button
                        type="button"
                        onClick={() => present(item.id, item.run)}
                        disabled={reelRunning}
                        className={`flex w-full items-center justify-between rounded-md border px-2.5 py-1.5 text-left text-xs transition disabled:opacity-50 ${
                          activeId === item.id
                            ? 'border-primary bg-primary/10'
                            : 'border-transparent hover:border-border hover:bg-accent'
                        }`}
                      >
                        <span className="truncate font-medium">{item.label}</span>
                        <span className="shrink-0 font-mono text-[9px] uppercase text-muted-foreground">
                          show
                        </span>
                      </button>

                      {item.steps && (
                        <div className="mt-1 mb-0.5 flex flex-wrap gap-1 pl-2">
                          {item.steps.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => showStep(s.id)}
                              disabled={reelRunning}
                              className="rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* footer hint */}
          <div className="shrink-0 border-t px-3 py-1.5 text-center font-mono text-[10px] text-muted-foreground">
            {showReadout ? (
              <button
                type="button"
                onClick={() => setShowReadout(false)}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <X className="h-3 w-3" /> hide readout
              </button>
            ) : (
              <span>~ / Esc hides panel · keeps the shot</span>
            )}
          </div>
        </div>
      )}
    </>
  )
}

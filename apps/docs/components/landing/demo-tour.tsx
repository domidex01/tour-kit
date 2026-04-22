'use client'

import {
  BarChart3,
  Bell,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Component,
  Eye,
  Lightbulb,
  Lock,
  MessageSquare,
  Play,
  Send,
  Sparkles,
  Star,
  TrendingUp,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

/* ═══════════════════════════════════════════
   Shared: mock app chrome
   ═══════════════════════════════════════════ */

function AppChrome({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.04] bg-fd-card shadow-elegant dark:border-white/[0.06]">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-black/[0.04] bg-fd-muted/50 px-4 py-2.5 dark:border-white/[0.06]">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-fd-muted-foreground/20" />
          <div className="h-2.5 w-2.5 rounded-full bg-fd-muted-foreground/20" />
          <div className="h-2.5 w-2.5 rounded-full bg-fd-muted-foreground/20" />
        </div>
        <div className="ml-2 flex-1 rounded-md bg-fd-background/80 px-3 py-1 text-[11px] text-fd-muted-foreground">
          {title}
        </div>
      </div>
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════
   Demo 1: Tours (@tour-kit/react)
   ═══════════════════════════════════════════ */

const tourSteps = [
  { target: 'nav', title: 'Navigation', content: 'Use the sidebar to browse your projects.' },
  { target: 'main', title: 'Dashboard', content: 'Your key metrics at a glance.' },
  { target: 'action', title: 'Quick actions', content: 'Create new items from here.' },
]

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: demo component with conditional rendering
function TourDemo() {
  const [step, setStep] = useState<number | null>(null)
  const active = step !== null

  return (
    <AppChrome title="your-app.com/dashboard">
      <div className="relative flex min-h-[340px]">
        {/* Sidebar */}
        <div
          className={`w-44 shrink-0 border-r border-fd-border bg-fd-muted/30 p-4 transition-all ${
            active && step === 0
              ? 'ring-2 ring-inset ring-[var(--tk-primary)]/40 bg-[var(--tk-primary)]/5'
              : ''
          }`}
        >
          <div className="mb-4 h-3 w-20 rounded bg-fd-foreground/10" />
          <div className="space-y-2">
            {['Dashboard', 'Projects', 'Settings'].map((item) => (
              <div
                key={item}
                className={`rounded-md px-3 py-1.5 text-[12px] ${
                  item === 'Dashboard'
                    ? 'bg-[var(--tk-primary)]/10 font-semibold text-[var(--tk-primary)]'
                    : 'text-fd-muted-foreground'
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-3.5 w-24 rounded bg-fd-foreground/10" />
            <button
              type="button"
              className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all ${
                active && step === 2
                  ? 'bg-[var(--tk-primary)] text-white ring-2 ring-[var(--tk-primary)]/40 ring-offset-2 ring-offset-fd-card'
                  : 'bg-[var(--tk-primary)]/10 text-[var(--tk-primary)]'
              }`}
            >
              + New project
            </button>
          </div>

          {/* Stat cards */}
          <div
            className={`mb-4 grid grid-cols-3 gap-3 transition-all ${
              active && step === 1
                ? 'rounded-lg ring-2 ring-[var(--tk-primary)]/40 ring-offset-2 ring-offset-fd-card'
                : ''
            }`}
          >
            {[
              { label: 'Active', value: '12' },
              { label: 'Complete', value: '47' },
              { label: 'Revenue', value: '$8.2k' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-fd-border bg-fd-background p-3"
              >
                <div className="text-[11px] text-fd-muted-foreground">{stat.label}</div>
                <div className="text-[16px] font-bold text-fd-foreground">{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="h-2.5 w-full rounded bg-fd-foreground/5" />
            <div className="h-2.5 w-4/5 rounded bg-fd-foreground/5" />
            <div className="h-2.5 w-3/5 rounded bg-fd-foreground/5" />
          </div>
        </div>

        {/* Tour tooltip */}
        {active && (
          <div
            className="absolute z-10 w-64 rounded-xl border border-fd-border bg-fd-background p-4 shadow-xl transition-all duration-300"
            style={{
              ...(step === 0 ? { top: 60, left: 180 } : {}),
              ...(step === 1 ? { top: 160, left: '50%', transform: 'translateX(-20%)' } : {}),
              ...(step === 2 ? { top: 48, right: 20 } : {}),
            }}
          >
            {/* Arrow */}
            <div
              className="absolute h-3 w-3 rotate-45 bg-fd-background"
              style={{
                ...(step === 0 ? { top: 16, left: -6 } : {}),
                ...(step === 1 ? { top: -6, left: 24 } : {}),
                ...(step === 2 ? { top: -6, right: 24 } : {}),
              }}
            />
            <p className="mb-1 text-[13px] font-bold text-fd-foreground">
              {tourSteps[step ?? 0].title}
            </p>
            <p className="mb-3 text-[12px] text-fd-muted-foreground">
              {tourSteps[step ?? 0].content}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {tourSteps.map((s, i) => (
                  <div
                    key={s.target}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step ? 'w-4 bg-[var(--tk-primary)]' : 'w-1.5 bg-fd-muted'
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-1.5">
                {(step ?? 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s ?? 1) - 1)}
                    aria-label="Previous step"
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-fd-border text-fd-muted-foreground hover:bg-fd-muted"
                  >
                    <ChevronLeft className="h-3 w-3" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setStep((s) => (s !== null && s < 2 ? s + 1 : null))}
                  className="flex h-6 items-center gap-1 rounded-md bg-[var(--tk-primary)] px-2.5 text-[11px] font-semibold text-white hover:brightness-110"
                >
                  {step === 2 ? 'Done' : 'Next'}
                  {step !== 2 && <ChevronRight className="h-2.5 w-2.5" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overlay */}
        {active && <div className="pointer-events-none absolute inset-0 bg-fd-foreground/5" />}

        {/* Start button */}
        {!active && (
          <button
            type="button"
            onClick={() => setStep(0)}
            className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--tk-primary)] px-4 py-2 text-[12px] font-semibold text-white shadow-md transition-all hover:brightness-110"
          >
            <Play className="h-3.5 w-3.5" />
            Start tour
          </button>
        )}
      </div>
    </AppChrome>
  )
}

/* ═══════════════════════════════════════════
   Demo 2: Hints (@tour-kit/hints)
   ═══════════════════════════════════════════ */

function HintsDemo() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [activeHint, setActiveHint] = useState<string | null>(null)

  const toggle = (id: string) => setActiveHint((a) => (a === id ? null : id))
  const dismiss = (id: string) => {
    setDismissed((s) => new Set(s).add(id))
    setActiveHint(null)
  }

  return (
    <AppChrome title="your-app.com/settings">
      <div className="relative min-h-[340px] p-5">
        <div className="mb-5 h-3.5 w-28 rounded bg-fd-foreground/10" />

        {/* Settings rows with hints */}
        {[
          {
            id: 'theme',
            label: 'Theme',
            value: 'System',
            hint: 'New! Auto-detect your OS preference for light and dark mode.',
          },
          {
            id: 'notif',
            label: 'Notifications',
            value: 'Email',
            hint: 'Tip: Enable push notifications for real-time alerts.',
          },
          {
            id: 'api',
            label: 'API Key',
            value: '•••••••dk4f',
            hint: 'Your API key rotates every 90 days for security.',
          },
        ].map((row) => (
          <div
            key={row.id}
            className="relative mb-3 flex items-center justify-between rounded-lg border border-fd-border bg-fd-background p-4"
          >
            <div>
              <div className="text-[13px] font-semibold text-fd-foreground">{row.label}</div>
              <div className="text-[12px] text-fd-muted-foreground">{row.value}</div>
            </div>

            {/* Hint beacon */}
            {!dismissed.has(row.id) && (
              <button
                type="button"
                onClick={() => toggle(row.id)}
                aria-label={`Show hint for ${row.label}`}
                className="relative flex h-5 w-5 items-center justify-center"
              >
                <span
                  aria-hidden="true"
                  className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--tk-primary)] opacity-40"
                />
                <span
                  aria-hidden="true"
                  className="relative inline-flex h-3 w-3 rounded-full bg-[var(--tk-primary)]"
                />
              </button>
            )}

            {/* Hint tooltip */}
            {activeHint === row.id && (
              <div className="absolute -top-2 right-10 z-10 w-56 -translate-y-full rounded-lg border border-fd-border bg-fd-background p-3 shadow-xl">
                <div className="absolute -bottom-1.5 right-4 h-3 w-3 rotate-45 border-b border-r border-fd-border bg-fd-background" />
                <p className="mb-2 text-[12px] leading-relaxed text-fd-muted-foreground">
                  {row.hint}
                </p>
                <button
                  type="button"
                  onClick={() => dismiss(row.id)}
                  className="text-[11px] font-semibold text-[var(--tk-primary)] hover:underline"
                >
                  Got it
                </button>
              </div>
            )}
          </div>
        ))}

        <p className="mt-4 text-center text-[11px] text-fd-muted-foreground/60">
          Click the pulsing dots to see contextual hints
        </p>
      </div>
    </AppChrome>
  )
}

/* ═══════════════════════════════════════════
   Demo 3: Announcements (@tour-kit/announcements)
   ═══════════════════════════════════════════ */

type AnnouncementVariant = 'modal' | 'toast' | 'banner'

function AnnouncementsDemo() {
  const [variant, setVariant] = useState<AnnouncementVariant | null>(null)

  return (
    <AppChrome title="your-app.com/home">
      <div className="relative min-h-[340px] p-5">
        {/* Mock page content */}
        <div className="mb-4 flex items-center justify-between">
          <div className="h-3.5 w-24 rounded bg-fd-foreground/10" />
          <div className="flex gap-2">
            <div className="h-7 w-7 rounded-lg bg-fd-muted" />
            <div className="h-7 w-7 rounded-lg bg-fd-muted" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2.5 w-full rounded bg-fd-foreground/5" />
          <div className="h-2.5 w-4/5 rounded bg-fd-foreground/5" />
          <div className="h-2.5 w-3/5 rounded bg-fd-foreground/5" />
        </div>

        <div className="mt-16 space-y-2">
          <div className="h-2.5 w-full rounded bg-fd-foreground/5" />
          <div className="h-2.5 w-2/3 rounded bg-fd-foreground/5" />
        </div>

        {/* Variant selector */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2">
          {(['modal', 'toast', 'banner'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVariant(v)}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold capitalize transition-all ${
                variant === v
                  ? 'bg-[var(--tk-primary)] text-white'
                  : 'border border-fd-border text-fd-muted-foreground hover:bg-fd-muted'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Banner */}
        {variant === 'banner' && (
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-[#0197f6] px-4 py-2.5">
            <p className="text-[12px] font-medium text-white">
              Version 2.0 is here — check out the new features!
            </p>
            <button
              type="button"
              onClick={() => setVariant(null)}
              aria-label="Dismiss banner"
              className="rounded-md p-0.5 text-white/70 hover:text-white"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Toast */}
        {variant === 'toast' && (
          <div className="absolute bottom-14 right-4 z-10 w-64 rounded-xl border border-fd-border bg-fd-background p-4 shadow-xl">
            <div className="mb-1 flex items-start justify-between">
              <p className="text-[13px] font-bold text-fd-foreground">New: Dark mode</p>
              <button
                type="button"
                onClick={() => setVariant(null)}
                aria-label="Dismiss toast"
                className="rounded-md p-0.5 text-fd-muted-foreground hover:text-fd-foreground"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
            <p className="mb-2 text-[12px] text-fd-muted-foreground">
              Toggle between light and dark themes in settings.
            </p>
            <button
              type="button"
              onClick={() => setVariant(null)}
              className="text-[11px] font-semibold text-[var(--tk-primary)] hover:underline"
            >
              Try it now
            </button>
          </div>
        )}

        {/* Modal */}
        {variant === 'modal' && (
          <>
            <div className="absolute inset-0 z-10 bg-fd-foreground/20" />
            <div className="absolute inset-0 z-20 flex items-center justify-center p-8">
              <div className="w-72 rounded-2xl border border-fd-border bg-fd-background p-6 shadow-2xl">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--tk-primary)]/10">
                  <Bell className="h-5 w-5 text-[var(--tk-primary)]" />
                </div>
                <h4 className="mb-1.5 text-[15px] font-bold text-fd-foreground">What&apos;s new</h4>
                <p className="mb-4 text-[12px] leading-relaxed text-fd-muted-foreground">
                  We shipped 3 new features this week: real-time collaboration, API v2, and custom
                  themes.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVariant(null)}
                    className="flex-1 rounded-lg bg-[var(--tk-primary)] py-2 text-[12px] font-semibold text-white hover:brightness-110"
                  >
                    See details
                  </button>
                  <button
                    type="button"
                    onClick={() => setVariant(null)}
                    className="flex-1 rounded-lg border border-fd-border py-2 text-[12px] font-semibold text-fd-muted-foreground hover:bg-fd-muted"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppChrome>
  )
}

/* ═══════════════════════════════════════════
   Demo 4: Checklists (@tour-kit/checklists)
   ═══════════════════════════════════════════ */

const checklistTasks = [
  { id: 'profile', label: 'Complete your profile', done: true, locked: false },
  { id: 'team', label: 'Invite team members', done: false, locked: false },
  { id: 'project', label: 'Create first project', done: false, locked: false },
  { id: 'integrate', label: 'Connect integration', done: false, locked: true },
]

function ChecklistsDemo() {
  const [tasks, setTasks] = useState(checklistTasks)

  const completed = tasks.filter((t) => t.done).length
  const total = tasks.length
  const pct = Math.round((completed / total) * 100)

  const toggleTask = (id: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === id && !t.locked ? { ...t, done: !t.done } : t))
      // Unlock "integrate" when "project" is done
      const projectDone = updated.find((t) => t.id === 'project')?.done
      return updated.map((t) => (t.id === 'integrate' ? { ...t, locked: !projectDone } : t))
    })
  }

  return (
    <AppChrome title="your-app.com/onboarding">
      <div className="relative min-h-[340px] p-5">
        <div className="mx-auto max-w-sm">
          {/* Progress header */}
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-[14px] font-bold text-fd-foreground">Getting started</h4>
              <span className="text-[12px] font-semibold text-[var(--tk-primary)]">{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-fd-muted">
              <div
                className="h-full rounded-full bg-[var(--tk-primary)] transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-fd-muted-foreground">
              {completed} of {total} complete
            </p>
          </div>

          {/* Task list */}
          <div className="space-y-2">
            {/* biome-ignore lint/complexity/noExcessiveCognitiveComplexity: task card conditional rendering */}
            {tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => toggleTask(task.id)}
                disabled={task.locked}
                className={`flex w-full items-center gap-3 rounded-lg border p-3.5 text-left transition-all ${
                  task.done
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : task.locked
                      ? 'border-fd-border/50 bg-fd-muted/30 opacity-60'
                      : 'border-fd-border bg-fd-background hover:border-fd-ring/30 hover:shadow-sm'
                }`}
              >
                {task.done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                ) : task.locked ? (
                  <Lock className="h-4.5 w-4.5 shrink-0 text-fd-muted-foreground/40" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-fd-muted-foreground/40" />
                )}
                <span
                  className={`text-[13px] font-medium ${
                    task.done
                      ? 'text-fd-muted-foreground line-through'
                      : task.locked
                        ? 'text-fd-muted-foreground/50'
                        : 'text-fd-foreground'
                  }`}
                >
                  {task.label}
                </span>
                {task.locked && (
                  <span className="ml-auto text-[10px] text-fd-muted-foreground/40">
                    Requires previous
                  </span>
                )}
              </button>
            ))}
          </div>

          <p className="mt-4 text-center text-[11px] text-fd-muted-foreground/60">
            Click tasks to toggle &middot; &quot;Connect integration&quot; unlocks after
            &quot;Create first project&quot;
          </p>
        </div>
      </div>
    </AppChrome>
  )
}

/* ═══════════════════════════════════════════
   Demo 5: Media (@tour-kit/media)
   ═══════════════════════════════════════════ */

function MediaDemo() {
  return (
    <AppChrome title="your-app.com/features">
      <div className="relative min-h-[480px]">
        {/* Mock app content behind */}
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-3.5 w-24 rounded bg-fd-foreground/10" />
            <div className="h-7 w-20 rounded-lg bg-fd-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-2.5 w-full rounded bg-fd-foreground/5" />
            <div className="h-2.5 w-4/5 rounded bg-fd-foreground/5" />
          </div>
        </div>

        {/* Tour step with embedded media */}
        <div className="absolute inset-0 z-10 bg-fd-foreground/10" />
        <div className="absolute inset-x-4 top-12 bottom-4 z-20 flex items-start justify-center sm:inset-x-6">
          <div className="w-full max-w-xl rounded-2xl border border-fd-border bg-fd-background p-4 shadow-2xl sm:p-5">
            <p className="mb-1 text-[13px] font-bold text-fd-foreground">See it in action</p>
            <p className="mb-3 text-[12px] text-fd-muted-foreground">
              Watch a quick walkthrough of the new export feature.
            </p>

            {/* Real YouTube embed */}
            <div className="relative mb-4 overflow-hidden rounded-lg">
              <div className="aspect-video">
                <iframe
                  src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
                  title="userTourKit media embed demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-fd-muted-foreground">Step 2 of 4</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  className="rounded-lg border border-fd-border px-3 py-1.5 text-[11px] font-semibold text-fd-muted-foreground hover:bg-fd-muted"
                >
                  Skip
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-[var(--tk-primary)] px-3 py-1.5 text-[11px] font-semibold text-white hover:brightness-110"
                >
                  Next step
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppChrome>
  )
}

/* ═══════════════════════════════════════════
   Demo 6: Analytics (@tour-kit/analytics)
   ═══════════════════════════════════════════ */

function AnalyticsDemo() {
  const [events, setEvents] = useState([
    { name: 'tour.started', time: '0.0s', color: 'text-emerald-400' },
  ])

  const allEvents = [
    { name: 'tour.started', time: '0.0s', color: 'text-emerald-400' },
    { name: 'step.viewed', time: '1.2s', color: 'text-sky-400', meta: 'step: "welcome"' },
    { name: 'step.viewed', time: '4.8s', color: 'text-sky-400', meta: 'step: "features"' },
    { name: 'step.cta_clicked', time: '6.1s', color: 'text-amber-400', meta: 'cta: "Try it"' },
    { name: 'tour.completed', time: '8.3s', color: 'text-emerald-400' },
  ]

  const addEvent = useCallback(() => {
    setEvents((prev) => {
      if (prev.length >= allEvents.length) return [allEvents[0]]
      return allEvents.slice(0, prev.length + 1)
    })
  }, [])

  useEffect(() => {
    const timer = setInterval(addEvent, 1800)
    return () => clearInterval(timer)
  }, [addEvent])

  return (
    <AppChrome title="analytics-dashboard">
      <div className="min-h-[340px] p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr]">
          {/* Left: Event stream */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[12px] font-semibold text-fd-foreground">
                Live event stream
              </span>
            </div>
            <div className="overflow-hidden rounded-lg border border-fd-border bg-[#0d1117]">
              <div className="space-y-0.5 px-3 py-2 font-mono text-[11px]">
                {events.map((event, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: event log entries don't have unique ids and are append-only
                  <div key={i} className="flex items-start gap-2 py-1">
                    <span className="shrink-0 text-white/20">{event.time}</span>
                    <span className={event.color}>{event.name}</span>
                    {'meta' in event && typeof event.meta === 'string' && (
                      <span className="text-white/25">{event.meta}</span>
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-1 py-1 text-white/15">
                  <span className="inline-block h-3 w-1 animate-pulse bg-white/40" />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Plugin badges + mini funnel */}
          <div>
            <div className="mb-3 text-[12px] font-semibold text-fd-foreground">
              Connected plugins
            </div>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {['PostHog', 'Mixpanel', 'Amplitude', 'GA4'].map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 rounded-full border border-fd-border bg-fd-background px-2.5 py-1 text-[11px] font-medium text-fd-muted-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {p}
                </span>
              ))}
            </div>

            <div className="mb-3 text-[12px] font-semibold text-fd-foreground">Tour funnel</div>
            <div className="space-y-2">
              {[
                { label: 'Started', pct: 100, color: 'bg-[var(--tk-primary)]' },
                { label: 'Step 2 reached', pct: 78, color: 'bg-[var(--tk-primary)]/80' },
                { label: 'Completed', pct: 52, color: 'bg-emerald-500' },
                { label: 'CTA clicked', pct: 31, color: 'bg-amber-500' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="text-fd-muted-foreground">{row.label}</span>
                    <span className="font-semibold text-fd-foreground">{row.pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-fd-muted">
                    <div
                      className={`h-full rounded-full ${row.color} transition-all duration-700`}
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppChrome>
  )
}

/* ═══════════════════════════════════════════
   Demo 7: Adoption (@tour-kit/adoption)
   ═══════════════════════════════════════════ */

function AdoptionDemo() {
  const [nudgeVisible, setNudgeVisible] = useState(true)

  const features = [
    {
      name: 'Search',
      score: 92,
      status: 'Adopted',
      statusColor: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      name: 'Filters',
      score: 64,
      status: 'Improving',
      statusColor: 'text-amber-500 bg-amber-500/10',
    },
    { name: 'Export', score: 23, status: 'Low', statusColor: 'text-rose-500 bg-rose-500/10' },
    { name: 'Templates', score: 8, status: 'New', statusColor: 'text-violet-500 bg-violet-500/10' },
  ]

  return (
    <AppChrome title="your-app.com/admin/adoption">
      <div className="relative min-h-[340px] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-[13px] font-bold text-fd-foreground">Feature adoption</h4>
          <span className="rounded-full bg-fd-muted px-2.5 py-0.5 text-[11px] font-medium text-fd-muted-foreground">
            Last 30 days
          </span>
        </div>

        {/* Adoption table */}
        <div className="overflow-hidden rounded-lg border border-fd-border">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-fd-border bg-fd-muted/50">
                <th className="px-3 py-2 text-left font-semibold text-fd-muted-foreground">
                  Feature
                </th>
                <th className="px-3 py-2 text-left font-semibold text-fd-muted-foreground">
                  Score
                </th>
                <th className="px-3 py-2 text-left font-semibold text-fd-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((f) => (
                <tr key={f.name} className="border-b border-fd-border/50 last:border-b-0">
                  <td className="px-3 py-2.5 font-medium text-fd-foreground">{f.name}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-fd-muted">
                        <div
                          className="h-full rounded-full bg-[var(--tk-primary)]"
                          style={{ width: `${f.score}%` }}
                        />
                      </div>
                      <span className="text-fd-muted-foreground">{f.score}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${f.statusColor}`}
                    >
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Nudge example */}
        {nudgeVisible && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div className="flex-1">
              <p className="text-[12px] font-semibold text-fd-foreground">
                Export has low adoption (23%)
              </p>
              <p className="text-[11px] text-fd-muted-foreground">
                Trigger a nudge for users who haven&apos;t tried it yet?
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNudgeVisible(false)}
              className="shrink-0 rounded-md bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-600"
            >
              Send nudge
            </button>
          </div>
        )}
      </div>
    </AppChrome>
  )
}

/* ═══════════════════════════════════════════
   Demo 8: Scheduling (@tour-kit/scheduling)
   ═══════════════════════════════════════════ */

function SchedulingDemo() {
  const [now] = useState(() => {
    const d = new Date()
    return { hour: d.getHours(), day: d.getDay() }
  })

  const isBusinessHours = now.hour >= 9 && now.hour < 17 && now.day >= 1 && now.day <= 5
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <AppChrome title="schedule-config">
      <div className="min-h-[340px]">
        <div className="grid sm:grid-cols-2">
          {/* Left: Visual config */}
          <div className="border-b border-fd-border p-5 sm:border-b-0 sm:border-r">
            <h4 className="mb-4 text-[13px] font-bold text-fd-foreground">Tour schedule rules</h4>

            {/* Active schedule card */}
            <div className="mb-3 rounded-lg border border-fd-border bg-fd-background p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-fd-foreground">Business hours</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    isBusinessHours
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-fd-muted text-fd-muted-foreground'
                  }`}
                >
                  {isBusinessHours ? 'Active now' : 'Inactive'}
                </span>
              </div>
              <p className="mb-2.5 text-[11px] text-fd-muted-foreground">
                Mon–Fri, 9:00 AM – 5:00 PM
              </p>
              <div className="flex gap-1">
                {days.map((d, i) => (
                  <div
                    key={d}
                    className={`flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-semibold ${
                      i >= 1 && i <= 5
                        ? i === now.day
                          ? 'bg-[var(--tk-primary)] text-white'
                          : 'bg-[var(--tk-primary)]/10 text-[var(--tk-primary)]'
                        : 'bg-fd-muted/50 text-fd-muted-foreground/40'
                    }`}
                  >
                    {d[0]}
                  </div>
                ))}
              </div>
            </div>

            {/* Blackout */}
            <div className="mb-3 rounded-lg border border-fd-border bg-fd-background p-3.5">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-fd-foreground">
                  Blackout period
                </span>
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-500">
                  Upcoming
                </span>
              </div>
              <p className="text-[11px] text-fd-muted-foreground">
                Dec 23 – Jan 2 (Holiday freeze)
              </p>
            </div>

            {/* Recurring */}
            <div className="rounded-lg border border-fd-border bg-fd-background p-3.5">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-fd-foreground">
                  Recurring weekly
                </span>
                <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-500">
                  Every Monday
                </span>
              </div>
              <p className="text-[11px] text-fd-muted-foreground">
                Show &quot;Weekly tips&quot; tour each week
              </p>
            </div>

            {/* Timezone */}
            <div className="mt-3 flex items-center gap-2 rounded-md bg-fd-muted/50 px-3 py-2">
              <Clock className="h-3.5 w-3.5 text-fd-muted-foreground" />
              <span className="text-[11px] text-fd-muted-foreground">
                User timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </span>
            </div>
          </div>

          {/* Right: Code */}
          <div className="overflow-hidden bg-[#0d1117]">
            <div className="border-b border-white/[0.06] px-4 py-2">
              <span className="text-[11px] text-white/30">schedule-config.ts</span>
            </div>
            <pre className="overflow-x-auto px-4 py-4 font-mono text-[11.5px] leading-[1.8]">
              <code>
                <span className="text-[#c4a7e7]">import</span>
                <span className="text-[#d4d4d8]">{' { checkSchedule } '}</span>
                <span className="text-[#c4a7e7]">from</span>
                <span className="text-[#a8cc8c]">{" '@tour-kit/scheduling'"}</span>
                <span className="text-[#d4d4d8]">;</span>
                {'\n\n'}
                <span className="text-[#c4a7e7]">const</span>
                <span className="text-[#d4d4d8]"> schedule = {'{'}</span>
                {'\n  '}
                <span className="text-[#cba6f7]">businessHours</span>
                <span className="text-[#d4d4d8]">: {'{'}</span>
                {'\n    '}
                <span className="text-[#cba6f7]">days</span>
                <span className="text-[#d4d4d8]">: [</span>
                <span className="text-[#a8cc8c]">&apos;mon&apos;</span>
                <span className="text-[#d4d4d8]">, </span>
                <span className="text-[#a8cc8c]">&apos;tue&apos;</span>
                <span className="text-[#d4d4d8]">, </span>
                <span className="text-[#a8cc8c]">&apos;wed&apos;</span>
                <span className="text-[#d4d4d8]">, </span>
                <span className="text-[#a8cc8c]">&apos;thu&apos;</span>
                <span className="text-[#d4d4d8]">, </span>
                <span className="text-[#a8cc8c]">&apos;fri&apos;</span>
                <span className="text-[#d4d4d8]">],</span>
                {'\n    '}
                <span className="text-[#cba6f7]">start</span>
                <span className="text-[#d4d4d8]">: </span>
                <span className="text-[#a8cc8c]">&apos;09:00&apos;</span>
                <span className="text-[#d4d4d8]">,</span>
                {'\n    '}
                <span className="text-[#cba6f7]">end</span>
                <span className="text-[#d4d4d8]">: </span>
                <span className="text-[#a8cc8c]">&apos;17:00&apos;</span>
                <span className="text-[#d4d4d8]">,</span>
                {'\n  '}
                <span className="text-[#d4d4d8]">{'}'},</span>
                {'\n  '}
                <span className="text-[#cba6f7]">blackout</span>
                <span className="text-[#d4d4d8]">: [{'{'}</span>
                {'\n    '}
                <span className="text-[#cba6f7]">from</span>
                <span className="text-[#d4d4d8]">: </span>
                <span className="text-[#a8cc8c]">&apos;2025-12-23&apos;</span>
                <span className="text-[#d4d4d8]">,</span>
                {'\n    '}
                <span className="text-[#cba6f7]">to</span>
                <span className="text-[#d4d4d8]">: </span>
                <span className="text-[#a8cc8c]">&apos;2026-01-02&apos;</span>
                <span className="text-[#d4d4d8]">,</span>
                {'\n  '}
                <span className="text-[#d4d4d8]">{'}'}],</span>
                {'\n  '}
                <span className="text-[#cba6f7]">recurring</span>
                <span className="text-[#d4d4d8]">: {'{'}</span>
                {'\n    '}
                <span className="text-[#cba6f7]">every</span>
                <span className="text-[#d4d4d8]">: </span>
                <span className="text-[#a8cc8c]">&apos;monday&apos;</span>
                <span className="text-[#d4d4d8]">,</span>
                {'\n    '}
                <span className="text-[#cba6f7]">tourId</span>
                <span className="text-[#d4d4d8]">: </span>
                <span className="text-[#a8cc8c]">&apos;weekly-tips&apos;</span>
                <span className="text-[#d4d4d8]">,</span>
                {'\n  '}
                <span className="text-[#d4d4d8]">{'}'},</span>
                {'\n'}
                <span className="text-[#d4d4d8]">{'}'};</span>
                {'\n\n'}
                <span className="text-[#5a5a6e]">{'// Evaluates against user timezone'}</span>
                {'\n'}
                <span className="text-[#c4a7e7]">const</span>
                <span className="text-[#d4d4d8]"> active = </span>
                <span className="text-[#e2cca9]">checkSchedule</span>
                <span className="text-[#d4d4d8]">(schedule);</span>
                {'\n'}
                <span className="text-[#5a5a6e]">{'// => { active: '}</span>
                <span className="text-[#5a5a6e]">{isBusinessHours ? 'true' : 'false'}</span>
                <span className="text-[#5a5a6e]">{', reason: "'}</span>
                <span className="text-[#5a5a6e]">
                  {isBusinessHours ? 'business_hours' : 'outside_hours'}
                </span>
                <span className="text-[#5a5a6e]">{'" }'}</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </AppChrome>
  )
}

/* ═══════════════════════════════════════════
   Demo 9: Surveys (@tour-kit/surveys)
   ═══════════════════════════════════════════ */

type SurveyType = 'nps' | 'csat' | 'ces'

function SurveysDemo() {
  const [surveyType, setSurveyType] = useState<SurveyType>('nps')
  const [rating, setRating] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const surveys: Record<
    SurveyType,
    {
      title: string
      question: string
      scaleMin: number
      scaleMax: number
      lowLabel: string
      highLabel: string
    }
  > = {
    nps: {
      title: 'NPS',
      question: 'How likely are you to recommend userTourKit to a colleague?',
      scaleMin: 0,
      scaleMax: 10,
      lowLabel: 'Not likely',
      highLabel: 'Very likely',
    },
    csat: {
      title: 'CSAT',
      question: 'How satisfied are you with the new onboarding flow?',
      scaleMin: 1,
      scaleMax: 5,
      lowLabel: 'Very unsatisfied',
      highLabel: 'Very satisfied',
    },
    ces: {
      title: 'CES',
      question: 'It was easy to complete the setup.',
      scaleMin: 1,
      scaleMax: 7,
      lowLabel: 'Strongly disagree',
      highLabel: 'Strongly agree',
    },
  }

  const current = surveys[surveyType]
  const scale = Array.from(
    { length: current.scaleMax - current.scaleMin + 1 },
    (_, i) => i + current.scaleMin
  )

  const handleType = (t: SurveyType) => {
    setSurveyType(t)
    setRating(null)
    setSubmitted(false)
  }

  return (
    <AppChrome title="your-app.com/feedback">
      <div className="relative min-h-[340px] p-5">
        {/* Type switcher */}
        <div className="mb-4 flex items-center justify-center gap-1.5">
          {(['nps', 'csat', 'ces'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleType(t)}
              className={`rounded-md px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition-all ${
                surveyType === t
                  ? 'bg-[var(--tk-primary)] text-white'
                  : 'border border-fd-border text-fd-muted-foreground hover:bg-fd-muted'
              }`}
            >
              {surveys[t].title}
            </button>
          ))}
        </div>

        {/* Survey card */}
        <div className="mx-auto max-w-md rounded-xl border border-fd-border bg-fd-background p-5 shadow-sm">
          {!submitted ? (
            <>
              <p className="mb-4 text-[13px] font-semibold leading-snug text-fd-foreground">
                {current.question}
              </p>

              {surveyType === 'csat' ? (
                <div className="mb-3 flex items-center justify-center gap-2">
                  {scale.map((n) => {
                    const isSelected = rating !== null && n <= rating
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        aria-label={`${n} star${n > 1 ? 's' : ''}`}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            isSelected
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-fd-muted-foreground/30'
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div
                  className="mb-3 grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${scale.length}, minmax(0, 1fr))` }}
                >
                  {scale.map((n) => {
                    const isSelected = rating === n
                    const tone =
                      n <= (current.scaleMax - current.scaleMin) / 3 + current.scaleMin
                        ? 'hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/40'
                        : n <= ((current.scaleMax - current.scaleMin) * 2) / 3 + current.scaleMin
                          ? 'hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/40'
                          : 'hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/40'
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        className={`rounded-md border py-1.5 text-[12px] font-semibold transition-all ${
                          isSelected
                            ? 'border-[var(--tk-primary)] bg-[var(--tk-primary)] text-white'
                            : `border-fd-border text-fd-muted-foreground ${tone}`
                        }`}
                      >
                        {n}
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="mb-4 flex justify-between text-[10px] text-fd-muted-foreground">
                <span>{current.lowLabel}</span>
                <span>{current.highLabel}</span>
              </div>

              <button
                type="button"
                onClick={() => rating !== null && setSubmitted(true)}
                disabled={rating === null}
                className="w-full rounded-lg bg-[var(--tk-primary)] py-2 text-[12px] font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Submit
              </button>
            </>
          ) : (
            <div className="py-4 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />
              </div>
              <p className="mb-1 text-[13px] font-bold text-fd-foreground">
                Thanks for the feedback
              </p>
              <p className="text-[11px] text-fd-muted-foreground">
                Score logged &middot; routed to PostHog
              </p>
            </div>
          )}
        </div>

        {/* Fatigue rule chip */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-fd-muted-foreground/70">
          <Lock className="h-3 w-3" aria-hidden="true" />
          <span>Fatigue rule: 1 per user / 90 days &middot; skipped for high-churn segment</span>
        </div>
      </div>
    </AppChrome>
  )
}

/* ═══════════════════════════════════════════
   Demo 10: AI assistant (@tour-kit/ai)
   ═══════════════════════════════════════════ */

const aiPrompts = [
  {
    q: 'How do I trigger a tour after a user logs in?',
    a: "Call startTour('onboarding') inside a useEffect that depends on your auth state. The tour engine waits for the target element to mount — no need to manually orchestrate timing.",
    sources: ['docs/core/useTour', 'guides/auth-integration'],
  },
  {
    q: "What's the smallest setup to add hints to a shadcn/ui app?",
    a: 'Wrap your app in <HintProvider>, then drop <Hint target="#feature-x" title="New!" /> next to the element. The beacon positions itself and persists dismissal to localStorage.',
    sources: ['docs/hints/quickstart', 'examples/shadcn-hints'],
  },
  {
    q: 'Can I use this with React Server Components?',
    a: 'Yes. The tour components are client-side ("use client"), but they hydrate safely inside Server Components. Put <Tour /> in any client boundary — no SSR work needed.',
    sources: ['guides/nextjs-app-router', 'docs/react/ssr'],
  },
]

function AIDemo() {
  const [promptIndex, setPromptIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const current = aiPrompts[promptIndex]

  const nextPrompt = useCallback(() => {
    setRevealed(false)
    setPromptIndex((i) => (i + 1) % aiPrompts.length)
    setTimeout(() => setRevealed(true), 700)
  }, [])

  useEffect(() => {
    const revealTimer = setTimeout(() => setRevealed(true), 700)
    return () => clearTimeout(revealTimer)
  }, [])

  return (
    <AppChrome title="your-app.com/help">
      <div className="relative flex min-h-[340px] flex-col">
        {/* Chat header */}
        <div className="flex items-center gap-2 border-b border-fd-border bg-fd-muted/30 px-4 py-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-[var(--tk-primary)] to-violet-500">
            <Sparkles className="h-3.5 w-3.5 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-fd-foreground">Docs assistant</p>
            <p className="text-[10px] text-fd-muted-foreground">
              Answering from your indexed docs &middot; streaming
            </p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Online
          </span>
        </div>

        {/* Conversation */}
        <div className="flex-1 space-y-3 overflow-hidden px-4 py-4">
          {/* User message */}
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[var(--tk-primary)] px-3.5 py-2 text-[12px] text-white">
              {current.q}
            </div>
          </div>

          {/* AI response */}
          <div className="flex gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--tk-primary)] to-violet-500">
              <Sparkles className="h-3 w-3 text-white" aria-hidden="true" />
            </div>
            <div className="min-w-0 max-w-[85%] rounded-2xl rounded-tl-sm bg-fd-muted px-3.5 py-2">
              {revealed ? (
                <>
                  <p className="text-[12px] leading-relaxed text-fd-foreground">{current.a}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-fd-border/50 pt-2">
                    <span className="text-[10px] font-semibold text-fd-muted-foreground">
                      Sources:
                    </span>
                    {current.sources.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 rounded-md bg-fd-background px-2 py-0.5 font-mono text-[10px] text-fd-muted-foreground"
                      >
                        <MessageSquare className="h-2.5 w-2.5" aria-hidden="true" />
                        {s}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1 py-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fd-muted-foreground/50" />
                  <span
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-fd-muted-foreground/50"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-fd-muted-foreground/50"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="border-t border-fd-border bg-fd-background px-4 py-3">
          <div className="flex items-center gap-2 rounded-lg border border-fd-border bg-fd-muted/30 px-3 py-2">
            <input
              type="text"
              readOnly
              value="Ask anything about the docs..."
              className="flex-1 bg-transparent text-[12px] text-fd-muted-foreground/70 outline-none"
              aria-label="Ask the docs assistant"
            />
            <button
              type="button"
              onClick={nextPrompt}
              aria-label="Next example question"
              className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--tk-primary)] text-white transition-all hover:brightness-110"
            >
              <Send className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-fd-muted-foreground/60">
            Click send to see the next example answer
          </p>
        </div>
      </div>
    </AppChrome>
  )
}

/* ═══════════════════════════════════════════
   Tab definitions
   ═══════════════════════════════════════════ */

const tabs = [
  {
    id: 'tours',
    label: 'Tours',
    pkg: '@tour-kit/react',
    icon: Component,
    color: 'text-[var(--tk-primary)]',
    component: TourDemo,
    tier: 'free',
  },
  {
    id: 'hints',
    label: 'Hints',
    pkg: '@tour-kit/hints',
    icon: Lightbulb,
    color: 'text-amber-500',
    component: HintsDemo,
    tier: 'free',
  },
  {
    id: 'announcements',
    label: 'Announcements',
    pkg: '@tour-kit/announcements',
    icon: Bell,
    color: 'text-rose-500',
    component: AnnouncementsDemo,
    tier: 'pro',
  },
  {
    id: 'checklists',
    label: 'Checklists',
    pkg: '@tour-kit/checklists',
    icon: CheckSquare,
    color: 'text-emerald-500',
    component: ChecklistsDemo,
    tier: 'pro',
  },
  {
    id: 'media',
    label: 'Media',
    pkg: '@tour-kit/media',
    icon: Eye,
    color: 'text-pink-500',
    component: MediaDemo,
    tier: 'pro',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    pkg: '@tour-kit/analytics',
    icon: BarChart3,
    color: 'text-sky-500',
    component: AnalyticsDemo,
    tier: 'pro',
  },
  {
    id: 'adoption',
    label: 'Adoption',
    pkg: '@tour-kit/adoption',
    icon: TrendingUp,
    color: 'text-orange-500',
    component: AdoptionDemo,
    tier: 'pro',
  },
  {
    id: 'scheduling',
    label: 'Scheduling',
    pkg: '@tour-kit/scheduling',
    icon: Clock,
    color: 'text-teal-500',
    component: SchedulingDemo,
    tier: 'pro',
  },
  {
    id: 'surveys',
    label: 'Surveys',
    pkg: '@tour-kit/surveys',
    icon: Star,
    color: 'text-amber-500',
    component: SurveysDemo,
    tier: 'pro',
  },
  {
    id: 'ai',
    label: 'AI assistant',
    pkg: '@tour-kit/ai',
    icon: Sparkles,
    color: 'text-violet-500',
    component: AIDemo,
    tier: 'pro',
  },
] as const

/* ═══════════════════════════════════════════
   Main export
   ═══════════════════════════════════════════ */

export function DemoTour() {
  const [activeTab, setActiveTab] = useState('tours')
  const active = tabs.find((t) => t.id === activeTab) ?? tabs[0]
  const ActiveComponent = active.component

  return (
    <section className="px-6 py-24 sm:px-8 md:py-32 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-5 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            Try before you install
          </h2>
          <p className="mx-auto max-w-lg text-[16px] text-fd-muted-foreground">
            Interactive demos for every package. No signup, no sandbox — just click through and see
            what ships.
          </p>
        </div>

        {/* Tab bar */}
        <div className="mb-6 flex flex-wrap justify-center gap-1.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const isPro = tab.tier === 'pro'
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-label={`${tab.label}${isPro ? ' (Pro)' : ''}`}
                aria-pressed={isActive}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-[#0197f6] text-white shadow-sm'
                    : 'text-fd-muted-foreground hover:bg-fd-muted hover:text-fd-foreground'
                }`}
              >
                <tab.icon
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 ${isActive ? '' : tab.color}`}
                />
                <span className="hidden sm:inline">{tab.label}</span>
                {isPro && (
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-[4px] px-1 py-px text-[9px] font-bold uppercase tracking-wide ${
                      isActive ? 'bg-white/25 text-white' : 'bg-violet-500/10 text-violet-500'
                    }`}
                    aria-hidden="true"
                  >
                    <Sparkles className="h-2 w-2" aria-hidden="true" />
                    Pro
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Package name label */}
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.04] bg-fd-card px-4 py-1.5 font-mono text-[12px] text-fd-muted-foreground shadow-elegant dark:border-white/[0.06]">
            <span className={`h-2 w-2 rounded-full ${active.color.replace('text-', 'bg-')}`} />
            {active.pkg}
          </span>
          {active.tier === 'pro' ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-500">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Pro &middot; $99 one-time
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-500">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              Free &middot; MIT
            </span>
          )}
        </div>

        {/* Demo area */}
        <div className="mx-auto max-w-3xl">
          <ActiveComponent />
        </div>

        {/* Package link */}
        <div className="mt-6 text-center">
          <MessageSquare className="mx-auto mb-2 h-4 w-4 text-fd-muted-foreground/40" />
          <p className="text-[12px] text-fd-muted-foreground/60">
            These are visual mockups &middot; See the{' '}
            <a
              href="/docs/getting-started"
              className="font-medium text-[var(--tk-primary)] underline underline-offset-2 hover:no-underline"
            >
              docs
            </a>{' '}
            for real integration examples
          </p>
        </div>
      </div>
    </section>
  )
}

'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdoptionStats } from '@tour-kit/adoption'
import { useAiChat } from '@tour-kit/ai'
import { useAnnouncement } from '@tour-kit/announcements'
import { useChecklist } from '@tour-kit/checklists'
import { useTourActions } from '@tour-kit/core'
import { LicenseWatermark, useLicense } from '@tour-kit/license'
import { useSurvey } from '@tour-kit/surveys'
import {
  TURNKEY_CES_EVENT,
  TURNKEY_NPS_EVENT,
} from '@/components/tour-kit/turnkey-survey-hosts'
import {
  Bell,
  CheckSquare,
  Compass,
  KeyRound,
  Layers,
  MessageSquare,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useState } from 'react'

const TOUR_KIT_LS_PREFIXES = ['tour-kit:', 'tourkit-', 'tourkit:', 'tk-', 'tk:']

function resetAllDemoState() {
  if (typeof window === 'undefined') return
  const toRemove: string[] = []
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (!key) continue
    if (TOUR_KIT_LS_PREFIXES.some((p) => key.startsWith(p))) {
      toRemove.push(key)
    }
  }
  for (const k of toRemove) {
    window.localStorage.removeItem(k)
  }
  window.location.reload()
}

interface DemoRowProps {
  icon: React.ComponentType<{ className?: string }>
  pkg: string
  title: string
  state: string
  description: string
  action: { label: string; onClick: () => void; disabled?: boolean }
}

function DemoRow({ icon: Icon, pkg, title, state, description, action }: DemoRowProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium leading-tight">{title}</span>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {pkg}
            </code>
            <Badge variant="outline" className="font-mono text-[10px]">
              {state}
            </Badge>
          </div>
          <p className="text-xs leading-snug text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={action.onClick}
        disabled={action.disabled}
        className="shrink-0 self-start sm:self-center"
      >
        {action.label}
      </Button>
    </div>
  )
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: flat list of demo rows — one per package — is intentionally exhaustive
export function TourKitDemoPanel() {
  const welcome = useAnnouncement('welcome')
  const aiLive = useAnnouncement('ai-live')
  const whatsNew = useAnnouncement('whats-new')
  const profileFeature = useAnnouncement('profile-feature')
  const checklist = useChecklist('get-started')
  const adoptionStats = useAdoptionStats()
  const aiChat = useAiChat()
  const csat = useSurvey('onboarding-csat')
  const { state: licenseState } = useLicense()
  const onboardingTour = useTourActions('dashboard-onboarding')
  const [showWatermark, setShowWatermark] = useState(false)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Tour Kit packages in action
          </CardTitle>
          <CardDescription>
            Every Free + Pro package wired into one workspace. Click any trigger to see the
            corresponding UI.
          </CardDescription>
        </div>
        <Button size="sm" variant="ghost" onClick={resetAllDemoState}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Reset demo
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <DemoRow
          icon={KeyRound}
          pkg="@tour-kit/license"
          title="License gate (Pro)"
          state={`${licenseState.status} · ${licenseState.tier ?? '—'}`}
          description="Soft-gate Pro packages on the client. Localhost uses dev bypass when NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY is set — the watermark is the production unlicensed UX."
          action={{
            label: showWatermark ? 'Hide watermark' : 'Show watermark',
            onClick: () => setShowWatermark((v) => !v),
          }}
        />
        {showWatermark && <LicenseWatermark />}

        <DemoRow
          icon={Compass}
          pkg="@tour-kit/react"
          title="Onboarding tour (Free)"
          state={onboardingTour.isActive ? 'active' : 'ready'}
          description="Five-step product tour with overlay and TourCard. Replays the dashboard walkthrough via useTourActions(id).start()."
          action={{ label: 'Replay tour', onClick: onboardingTour.start }}
        />

        <DemoRow
          icon={Layers}
          pkg="@tour-kit/announcements"
          title="Welcome modal"
          state={welcome.isVisible ? 'visible' : welcome.isDismissed ? 'dismissed' : 'idle'}
          description="Centered modal with optional media. Used for high-priority onboarding announcements."
          action={{
            label: welcome.isVisible ? 'Hide modal' : 'Show modal',
            onClick: () => (welcome.isVisible ? welcome.hide() : welcome.forceShow()),
          }}
        />

        <DemoRow
          icon={Layers}
          pkg="@tour-kit/announcements"
          title="What's new slideout"
          state={whatsNew.isVisible ? 'visible' : 'idle'}
          description="Right-side slideout for changelogs, release notes, and longer-form announcements."
          action={{
            label: whatsNew.isVisible ? 'Hide slideout' : 'Show slideout',
            onClick: () => (whatsNew.isVisible ? whatsNew.hide() : whatsNew.forceShow()),
          }}
        />

        <DemoRow
          icon={Target}
          pkg="@tour-kit/announcements"
          title="Profile spotlight"
          state={profileFeature.isVisible ? 'visible' : 'idle'}
          description="Spotlights the user menu (top-right). Demonstrates contextual feature announcements."
          action={{
            label: profileFeature.isVisible ? 'Hide spotlight' : 'Show spotlight',
            onClick: () =>
              profileFeature.isVisible ? profileFeature.hide() : profileFeature.forceShow(),
          }}
        />

        <DemoRow
          icon={Bell}
          pkg="@tour-kit/announcements"
          title="AI-live toast"
          state={aiLive.isVisible ? 'visible' : aiLive.isDismissed ? 'dismissed' : 'idle'}
          description="Lightweight top-right toast that auto-dismisses after 8 seconds."
          action={{
            label: 'Show toast',
            onClick: () => aiLive.forceShow(),
          }}
        />

        <DemoRow
          icon={CheckSquare}
          pkg="@tour-kit/checklists"
          title="Onboarding checklist"
          state={`${checklist.progress?.completed ?? 0} / ${checklist.progress?.total ?? 0} done`}
          description="Bottom-right floating checklist with task dependencies (e.g., 'Connect Slack' unlocks after 'Create project')."
          action={{
            label: 'Open checklist',
            onClick: () => {
              checklist.restore()
              const launcher = document.querySelector<HTMLButtonElement>(
                'button[aria-label="Open checklist"]'
              )
              launcher?.click()
            },
          }}
        />

        <DemoRow
          icon={TrendingUp}
          pkg="@tour-kit/adoption"
          title="Adoption tracking"
          state={`${adoptionStats.adoptedCount} / ${adoptionStats.totalCount} features (${Math.round(adoptionStats.adoptionRate)}%)`}
          description="Tracks dark-mode, keyboard shortcuts, and CSV export. Adoption rate updates as users hit triggers."
          action={{
            label: 'Trigger dark-mode',
            onClick: () => {
              const btn = document.getElementById('dark-mode-toggle') as HTMLButtonElement | null
              btn?.click()
            },
          }}
        />

        <DemoRow
          icon={MessageSquare}
          pkg="@tour-kit/ai"
          title="AI chat panel"
          state={aiChat.isOpen ? 'open' : 'closed'}
          description="Floating chat panel with tour-aware context. Streams responses from the /api/chat route."
          action={{
            label: aiChat.isOpen ? 'Close chat' : 'Open chat',
            onClick: () => aiChat.toggle(),
          }}
        />

        <DemoRow
          icon={CheckSquare}
          pkg="@tour-kit/surveys"
          title="CSAT survey (turnkey wired to provider)"
          state={csat.canShow ? 'ready' : 'cooldown'}
          description="Phase 2 <CsatModal> wired through useSurvey('onboarding-csat'). Frequency rule is 90-day interval — demo trigger resets it first."
          action={{
            label: 'Show survey',
            onClick: () => {
              if (typeof window !== 'undefined') {
                window.localStorage.removeItem('tour-kit:surveys:state')
              }
              csat.reset()
              queueMicrotask(() => csat.show())
            },
          }}
        />

        <DemoRow
          icon={CheckSquare}
          pkg="@tour-kit/surveys"
          title="NPS turnkey modal (fire-and-forget)"
          state="two-prop"
          description="Phase 2 <NpsModal question onSubmit />. 0–10 scale. onSubmit receives (score, NpsCategory) — toasts the result."
          action={{
            label: 'Show NPS',
            onClick: () => window.dispatchEvent(new CustomEvent(TURNKEY_NPS_EVENT)),
          }}
        />

        <DemoRow
          icon={CheckSquare}
          pkg="@tour-kit/surveys"
          title="CES turnkey modal (fire-and-forget)"
          state="two-prop"
          description="Phase 2 <CesModal question onSubmit />. 1–7 scale. onSubmit receives (score, CesCategory) — toasts the result."
          action={{
            label: 'Show CES',
            onClick: () => window.dispatchEvent(new CustomEvent(TURNKEY_CES_EVENT)),
          }}
        />
      </CardContent>
    </Card>
  )
}


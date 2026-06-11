'use client'

import {
  Checklist,
  type ChecklistConfig,
  ChecklistProvider,
  useChecklist,
} from '@tour-kit/checklists'
import { RotateCcw } from 'lucide-react'

import { DemoSurface } from './demo-surface'
import { MaybeLicensed } from './maybe-licensed'

/**
 * The real @tour-kit/checklists component running on the marketing page.
 * No persistence — every visit starts fresh, so the demo is always
 * completable. The "Connect an integration" task is locked behind
 * "Create your first project" to show dependency-aware locking live.
 */
const DEMO_CHECKLIST: ChecklistConfig = {
  id: 'capability-demo',
  title: 'Get started with Acme',
  description: 'Click a task to complete it — this is the live component.',
  dismissible: false,
  tasks: [
    {
      id: 'profile',
      title: 'Complete your profile',
      description: 'Add a name and avatar so teammates recognize you.',
    },
    {
      id: 'project',
      title: 'Create your first project',
      description: 'Projects keep your work organized.',
    },
    {
      id: 'integration',
      title: 'Connect an integration',
      description: 'Unlocks once your first project exists — task dependencies at work.',
      dependsOn: ['project'],
    },
    {
      id: 'invite',
      title: 'Invite a teammate',
      description: 'Onboarding sticks better with company.',
    },
  ],
}

function DemoChecklistCard() {
  const { progress, isComplete, reset } = useChecklist(DEMO_CHECKLIST.id)

  return (
    <div className="mx-auto max-w-md">
      <Checklist
        checklistId={DEMO_CHECKLIST.id}
        showProgress
        showDismiss={false}
        className="rounded-xl border border-fd-border bg-fd-background p-5 shadow-lg"
      />
      <div className="mt-3 flex items-center justify-between">
        <p className="font-mono text-[12px] text-fd-muted-foreground" aria-live="polite">
          {isComplete
            ? 'All done — that state can fire confetti, a tour, or your API.'
            : `${progress.completed}/${progress.total} tasks · ${progress.percentage}%`}
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-md border border-fd-border bg-fd-background px-2.5 py-1.5 font-mono text-[11px] font-semibold text-fd-muted-foreground transition-colors hover:bg-fd-muted hover:text-fd-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0197f6]"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          Reset demo
        </button>
      </div>
    </div>
  )
}

export function ChecklistDemo() {
  return (
    <MaybeLicensed>
      <ChecklistProvider checklists={[DEMO_CHECKLIST]}>
        <DemoSurface url="acme.app/onboarding" contentClassName="bg-fd-muted/20 py-10">
          <DemoChecklistCard />
        </DemoSurface>
      </ChecklistProvider>
    </MaybeLicensed>
  )
}

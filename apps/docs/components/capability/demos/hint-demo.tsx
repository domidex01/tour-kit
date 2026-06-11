'use client'

import { Hint, HintsProvider } from '@tour-kit/hints'
import { BarChart3, FolderKanban, Settings, Share2 } from 'lucide-react'

import { DemoSurface, MockRow } from './demo-surface'

/**
 * The real @tour-kit/hints components on a mock toolbar. The pulsing
 * hotspot honors prefers-reduced-motion via the package's own
 * useReducedMotion gate. No storage adapter — dismissals reset per visit.
 */
const TOOLBAR_ITEMS = [
  { id: 'hint-demo-projects', label: 'Projects', icon: FolderKanban },
  { id: 'hint-demo-reports', label: 'Reports', icon: BarChart3 },
  { id: 'hint-demo-share', label: 'Share', icon: Share2 },
  { id: 'hint-demo-settings', label: 'Settings', icon: Settings },
] as const

export function HintDemo() {
  return (
    <HintsProvider>
      <DemoSurface url="acme.app/projects" contentClassName="py-10">
        <div className="mx-auto max-w-md">
          <p className="mb-6 text-center text-[14px] text-fd-muted-foreground">
            Click a pulsing beacon — the tooltip is the live component.
          </p>

          {/* Mock toolbar with hint targets */}
          <div className="mb-6 flex items-center justify-center gap-2 rounded-lg border border-fd-border bg-fd-background p-2">
            {TOOLBAR_ITEMS.map((item) => (
              <span
                key={item.id}
                id={item.id}
                className="relative inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-medium text-fd-muted-foreground"
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </span>
            ))}
          </div>

          {/* Mock content rows */}
          <div className="space-y-2.5">
            <MockRow />
            <MockRow width="w-4/5" />
            <MockRow width="w-3/5" />
          </div>
        </div>
      </DemoSurface>

      <Hint
        id="capability-demo-reports"
        target="#hint-demo-reports"
        title="Reports just shipped"
        content="Point users at a new feature without dragging them through a full tour. Dismissals persist per user via storage adapters."
        tooltipPlacement="bottom"
        pulse
      />
      <Hint
        id="capability-demo-share"
        target="#hint-demo-share"
        title="Share with your team"
        content="Each hint has independent open/dismissed state — no sequence, no order, no tour."
        tooltipPlacement="bottom"
        pulse
        color="warning"
      />
    </HintsProvider>
  )
}

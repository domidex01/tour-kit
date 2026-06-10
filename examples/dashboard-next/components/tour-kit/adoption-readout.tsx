'use client'

import { useEventBuffer } from '@/lib/event-buffer'
import { useAdoptionStats } from '@tour-kit/adoption'
import { Activity, TrendingUp, X } from 'lucide-react'

/**
 * Director cue 5 — the live "Measure" readout. Pairs real adoption stats
 * (@tour-kit/adoption) with a rolling feed of Tour Kit analytics events
 * (@tour-kit/analytics, mirrored into an in-memory buffer). Updates live as
 * features get used during the reel.
 */
export function AdoptionReadout({ onClose }: { onClose: () => void }) {
  const stats = useAdoptionStats()
  const events = useEventBuffer()

  return (
    <div className="fixed bottom-5 left-5 z-50 w-72 rounded-xl border bg-popover/95 text-popover-foreground shadow-xl backdrop-blur">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          Adoption &amp; events
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close readout"
          className="text-muted-foreground transition hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-3 py-2.5">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">Feature adoption</span>
          <span className="font-mono text-sm font-semibold tabular-nums">
            {stats.adoptedCount}/{stats.totalCount} · {Math.round(stats.adoptionRate)}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.max(4, Math.round(stats.adoptionRate))}%` }}
          />
        </div>
      </div>

      <div className="border-t px-3 py-2">
        <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <Activity className="h-3 w-3" />
          Live events
        </div>
        <ul className="max-h-32 space-y-1 overflow-hidden font-mono text-[11px]">
          {events.length === 0 && (
            <li className="text-muted-foreground">Waiting for activity…</li>
          )}
          {events.slice(0, 6).map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2">
              <span className="truncate text-foreground">{e.name}</span>
              <span className="shrink-0 text-muted-foreground">{e.tourId || e.stepId || '—'}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

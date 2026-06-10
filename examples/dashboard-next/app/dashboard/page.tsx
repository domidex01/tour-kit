'use client'

import { AreaChart } from '@/components/dashboard/area-chart'
import { useDirector } from '@/components/tour-kit/director-context'
import { TourKitDemoPanel } from '@/components/tour-kit/demo-panel'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { activityFeed, chartSeries, kpis, projects } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { ArrowDownRight, ArrowUpRight, Plus } from 'lucide-react'

const statusDot: Record<string, string> = {
  active: 'bg-emerald-500',
  paused: 'bg-amber-500',
  archived: 'bg-zinc-500',
}

export default function DashboardHome() {
  const { enabled } = useDirector()

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your product, at a glance.</p>
        </div>
        <Button
          id="new-project-btn"
          size="sm"
          onClick={() => window.dispatchEvent(new CustomEvent('project:created'))}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          New project
        </Button>
      </div>

      {/* Dev chrome — only on screen when Director mode is revealed (`~`). */}
      {enabled && <TourKitDemoPanel />}

      {/* KPI strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Arrow = k.trend === 'up' ? ArrowUpRight : ArrowDownRight
          return (
            <Card key={k.id} id={`kpi-${k.id}`} className="transition hover:shadow-md">
              <CardHeader className="space-y-0 pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {k.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-semibold tabular-nums">{k.value}</span>
                  <span
                    className={cn(
                      'flex items-center gap-0.5 text-xs font-medium',
                      k.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'
                    )}
                  >
                    <Arrow className="h-3.5 w-3.5" />
                    {k.delta}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Chart + activity */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Growth — last 12 weeks</CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-chart-1" /> Active users
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-chart-2" /> Activation
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <AreaChart
              labels={chartSeries.labels}
              series={[
                { name: 'Active users', color: 'var(--chart-1)', values: chartSeries.users },
                { name: 'Activation', color: 'var(--chart-2)', values: chartSeries.activation },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {activityFeed.map((a, i) => (
                <li key={a.id} className="relative flex items-start gap-3">
                  {i < activityFeed.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute left-4 top-9 h-[calc(100%_-_8px)] w-px bg-border"
                    />
                  )}
                  <Avatar className="relative z-10 h-8 w-8 ring-4 ring-card">
                    <AvatarFallback className="text-[11px]">
                      {a.actor
                        .split(' ')
                        .map((p) => p[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 pt-0.5 text-sm">
                    <div>
                      <span className="font-medium">{a.actor}</span>{' '}
                      <span className="text-muted-foreground">{a.action}</span>{' '}
                      <span className="font-medium">{a.target}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{a.timestamp}</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Projects preview */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Active projects</CardTitle>
          <span className="text-xs text-muted-foreground">{projects.length} tracked</span>
        </CardHeader>
        <CardContent className="space-y-1">
          {projects.slice(0, 5).map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-md px-2 py-2 transition hover:bg-accent"
            >
              <div className="flex items-center gap-2.5">
                <span className={cn('h-2 w-2 rounded-full', statusDot[p.status])} />
                <span className="text-sm font-medium">{p.name}</span>
                <span className="hidden text-xs text-muted-foreground sm:inline">{p.owner}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:block">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${p.health}%` }}
                  />
                </div>
                <span className="w-9 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {p.health}%
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

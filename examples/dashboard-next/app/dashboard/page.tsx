'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { activityFeed } from '@/lib/mock-data'
import { Activity, CheckCircle2, FolderKanban, Plus, Users } from 'lucide-react'

const statCards = [
  {
    label: 'Active projects',
    value: 4,
    delta: '+1 this week',
    icon: FolderKanban,
    tone: 'text-sky-600 bg-sky-500/10',
  },
  {
    label: 'Open tasks',
    value: 32,
    delta: '-5 since Monday',
    icon: Activity,
    tone: 'text-amber-600 bg-amber-500/10',
  },
  {
    label: 'Teammates online',
    value: 6,
    delta: 'of 8',
    icon: Users,
    tone: 'text-violet-600 bg-violet-500/10',
  },
  {
    label: 'Completed this week',
    value: 18,
    delta: '+42% vs last week',
    icon: CheckCircle2,
    tone: 'text-emerald-600 bg-emerald-500/10',
  },
]

export default function DashboardHome() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">What your team is up to today.</p>
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="relative overflow-hidden transition hover:shadow-md">
            <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <div className={`grid h-8 w-8 place-items-center rounded-lg ${s.tone}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tabular-nums">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.delta}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
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
                  <Avatar className="relative z-10 h-8 w-8 ring-4 ring-background">
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

        <Card className="bg-gradient-to-br from-primary/5 via-background to-background">
          <CardHeader>
            <CardTitle className="text-base">Your week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex items-baseline justify-between text-xs text-muted-foreground">
                <span>Tasks completed</span>
                <span className="font-mono text-foreground">18 / 25</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[72%] rounded-full bg-primary transition-all" />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-baseline justify-between text-xs text-muted-foreground">
                <span>Projects on track</span>
                <span className="font-mono text-foreground">3 / 4</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[75%] rounded-full bg-emerald-500 transition-all" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">On pace to beat last week’s throughput.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

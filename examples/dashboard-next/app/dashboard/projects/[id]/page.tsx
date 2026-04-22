'use client'

import { ExportHint } from '@/components/tour-kit/hints'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { type KanbanColumn, kanbanCards, projects } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { IfNotAdopted, NewFeatureBadge } from '@tour-kit/adoption'
import { ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { use, useMemo, useState } from 'react'

const columns: { id: KanbanColumn; label: string; accent: string; dot: string }[] = [
  { id: 'todo', label: 'To Do', accent: 'border-t-zinc-400/60', dot: 'bg-zinc-400' },
  { id: 'in-progress', label: 'In Progress', accent: 'border-t-sky-400/80', dot: 'bg-sky-500' },
  { id: 'done', label: 'Done', accent: 'border-t-emerald-400/80', dot: 'bg-emerald-500' },
]

export default function ProjectKanbanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const project = projects.find((p) => p.id === id)
  const [cards, setCards] = useState(kanbanCards)

  const byColumn = useMemo(() => {
    const map: Record<KanbanColumn, typeof kanbanCards> = {
      todo: [],
      'in-progress': [],
      done: [],
    }
    for (const card of cards) map[card.column].push(card)
    return map
  }, [cards])

  if (!project) notFound()

  function moveCard(cardId: string, to: KanbanColumn) {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, column: to } : c)))
    window.dispatchEvent(new CustomEvent('kanban:card-moved', { detail: { cardId, to } }))
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          All projects
        </Link>
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <p className="max-w-xl text-sm text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative inline-flex">
            <Button id="export-btn" variant="outline" size="sm">
              <Download className="mr-1.5 h-4 w-4" />
              Export
            </Button>
            <IfNotAdopted featureId="export-csv">
              <NewFeatureBadge
                featureId="export-csv"
                text="New"
                className="absolute -right-2 -top-2 z-10 border-primary/30 bg-primary text-[10px] font-medium text-primary-foreground shadow-sm"
              />
            </IfNotAdopted>
          </div>
        </div>
      </div>

      <div id="kanban-board" className="grid gap-4 md:grid-cols-3">
        {columns.map((col) => (
          <div
            key={col.id}
            className={cn(
              'flex flex-col gap-3 rounded-xl border border-t-4 bg-muted/20 p-3',
              col.accent
            )}
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={cn('h-1.5 w-1.5 rounded-full', col.dot)} />
                <h2 className="text-sm font-semibold">{col.label}</h2>
              </div>
              <Badge variant="secondary" className="tabular-nums">
                {byColumn[col.id].length}
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              {byColumn[col.id].map((card) => (
                <Card
                  key={card.id}
                  className="cursor-grab bg-background p-3 text-sm transition hover:shadow-md"
                >
                  <div className="font-medium leading-snug">{card.title}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {card.labels.map((l) => (
                        <Badge key={l} variant="outline" className="text-[10px] font-normal">
                          {l}
                        </Badge>
                      ))}
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {card.assignee}
                    </span>
                  </div>
                  <div className="-mx-1 mt-2 flex gap-1">
                    {columns
                      .filter((c) => c.id !== card.column)
                      .map((c) => (
                        <Button
                          key={c.id}
                          variant="ghost"
                          size="sm"
                          className="h-6 flex-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                          onClick={() => moveCard(card.id, c.id)}
                        >
                          → {c.label}
                        </Button>
                      ))}
                  </div>
                </Card>
              ))}
              {byColumn[col.id].length === 0 && (
                <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  Nothing here yet.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <ExportHint />
    </div>
  )
}

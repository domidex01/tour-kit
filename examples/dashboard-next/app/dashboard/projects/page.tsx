import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { projects, type ProjectStatus } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const statusStyle: Record<ProjectStatus, { dot: string; label: string }> = {
  active: { dot: 'bg-emerald-500', label: 'text-emerald-700 dark:text-emerald-400' },
  paused: { dot: 'bg-amber-500', label: 'text-amber-700 dark:text-amber-400' },
  archived: { dot: 'bg-zinc-400', label: 'text-muted-foreground' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ProjectsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">
          {projects.length} projects you have access to.
        </p>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="text-right">Last updated</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => {
              const s = statusStyle[p.status]
              return (
                <TableRow key={p.id} className="group">
                  <TableCell>
                    <Link
                      href={`/dashboard/projects/${p.id}`}
                      className="font-medium group-hover:underline"
                    >
                      {p.name}
                    </Link>
                    <div className="mt-0.5 max-w-md truncate text-xs text-muted-foreground">
                      {p.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
                      <span className={cn('capitalize font-medium', s.label)}>{p.status}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 ring-1 ring-border">
                        <AvatarFallback className="text-[10px]">{p.ownerAvatar}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{p.owner}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground tabular-nums">
                    {formatDate(p.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/projects/${p.id}`}
                      aria-label={`Open ${p.name}`}
                      className="inline-block text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

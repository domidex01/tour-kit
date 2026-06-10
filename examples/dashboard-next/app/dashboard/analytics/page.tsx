'use client'

import { AreaChart } from '@/components/dashboard/area-chart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { chartSeries, kpis, projects } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

export default function AnalyticsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Revenue, activation, and retention across every project.
          </p>
        </div>
        <Button
          id="export-btn"
          size="sm"
          variant="outline"
          onClick={() => toast.success('Exported analytics.csv')}
        >
          <Download className="mr-1.5 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.slice(0, 4).map((k) => (
          <Card key={k.id} className="transition hover:shadow-md">
            <CardHeader className="space-y-0 pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">{k.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">{k.value}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{k.delta} vs last period</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Active users vs. activation</CardTitle>
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
            height={240}
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Project health</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Project</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Health</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.owner}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 text-xs capitalize',
                        p.status === 'active'
                          ? 'text-emerald-500'
                          : p.status === 'paused'
                            ? 'text-amber-500'
                            : 'text-muted-foreground'
                      )}
                    >
                      {p.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-muted sm:block">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${p.health}%` }}
                        />
                      </div>
                      <span className="w-9 text-right font-mono text-xs tabular-nums">
                        {p.health}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

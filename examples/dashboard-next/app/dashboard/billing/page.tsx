'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { teamMembers } from '@/lib/mock-data'
import { Check, Sparkles } from 'lucide-react'

const invoices = [
  { id: 'INV-2026-006', date: 'Jun 1, 2026', amount: '$290.00', status: 'Paid' },
  { id: 'INV-2026-005', date: 'May 1, 2026', amount: '$290.00', status: 'Paid' },
  { id: 'INV-2026-004', date: 'Apr 1, 2026', amount: '$232.00', status: 'Paid' },
]

function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-pro px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-pro-foreground">
      <Sparkles className="h-3 w-3" />
      Pro
    </span>
  )
}

export default function BillingPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">Manage your plan, seats, and invoices.</p>
      </div>

      <Card className="border-pro/40">
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              Current plan <ProBadge />
            </CardTitle>
            <CardDescription>
              {teamMembers.length} of 25 seats used · renews Jul 1, 2026
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Manage seats
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              'Unlimited projects',
              'Cohort retention',
              'Scheduled exports',
              'AI assistant',
              'Priority support',
              'Audit logs',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-pro" />
                {f}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-md px-2 py-2.5 text-sm transition hover:bg-accent"
            >
              <span className="font-mono text-xs text-muted-foreground">{inv.id}</span>
              <span className="text-muted-foreground">{inv.date}</span>
              <span className="font-medium tabular-nums">{inv.amount}</span>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
                <Check className="h-3.5 w-3.5" />
                {inv.status}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

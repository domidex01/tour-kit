'use client'

import { useLicense } from '@tour-kit/license'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function LicenseDebugPanel() {
  const { state } = useLicense()

  return (
    <Card>
      <CardHeader>
        <CardTitle>License state</CardTitle>
        <CardDescription>Debug view — what `useLicense()` sees right now.</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">status</dt>
          <dd className="font-mono">{state.status}</dd>
          <dt className="text-muted-foreground">tier</dt>
          <dd className="font-mono">{state.tier ?? '—'}</dd>
          <dt className="text-muted-foreground">activations</dt>
          <dd className="font-mono">
            {state.activations ?? 0} / {state.maxActivations ?? '∞'}
          </dd>
          <dt className="text-muted-foreground">domain</dt>
          <dd className="font-mono">{state.domain ?? '—'}</dd>
          <dt className="text-muted-foreground">expires</dt>
          <dd className="font-mono">{state.expiresAt ?? '—'}</dd>
        </dl>
      </CardContent>
    </Card>
  )
}

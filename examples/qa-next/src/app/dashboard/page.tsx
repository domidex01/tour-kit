'use client'

import { useTour } from '@tour-kit/react'

export default function DashboardPage() {
  const { start } = useTour('cross-page-demo')

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Dashboard</h1>
          <p className="text-muted-foreground">
            Phase 1.3 cross-page tour demo — start here, advance to /billing, then hard-refresh to
            verify resume.
          </p>
        </header>

        <section id="dashboard-stats" className="p-6 rounded-lg border bg-popover shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Stats</h2>
          <p className="text-sm text-muted-foreground">
            This element is the target for step 1 of the cross-page tour.
          </p>
        </section>

        <button
          type="button"
          id="cross-page-tour-start"
          onClick={() => start()}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Start cross-page tour
        </button>
      </div>
    </div>
  )
}

'use client'

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Billing</h1>
          <p className="text-muted-foreground">
            Hard-refresh this page during the cross-page tour — Phase 1.3's flow-session resume
            should put the tour back on step 2.
          </p>
        </header>

        <section id="billing-summary" className="p-6 rounded-lg border bg-popover shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Billing summary</h2>
          <p className="text-sm text-muted-foreground">
            This element is the target for step 2 of the cross-page tour.
          </p>
        </section>
      </div>
    </div>
  )
}

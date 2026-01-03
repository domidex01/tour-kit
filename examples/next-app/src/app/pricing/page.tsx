'use client'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header id="pricing-header" className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Pricing</h1>
          <p className="text-muted-foreground">Simple, transparent pricing for everyone</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div id="plan-free" className="p-6 rounded-lg border bg-popover shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Free</h2>
            <p className="text-3xl font-bold mb-4">$0</p>
            <ul className="space-y-2 text-muted-foreground">
              <li>Unlimited tours</li>
              <li>All core features</li>
              <li>Community support</li>
              <li>MIT License</li>
            </ul>
          </div>

          <div
            id="plan-pro"
            className="p-6 rounded-lg border-2 border-primary bg-popover shadow-sm"
          >
            <h2 className="text-xl font-semibold mb-2">Pro</h2>
            <p className="text-3xl font-bold mb-4">$29/mo</p>
            <ul className="space-y-2 text-muted-foreground">
              <li>Everything in Free</li>
              <li>Analytics dashboard</li>
              <li>A/B testing</li>
              <li>Priority support</li>
            </ul>
          </div>

          <div id="plan-enterprise" className="p-6 rounded-lg border bg-popover shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Enterprise</h2>
            <p className="text-3xl font-bold mb-4">Custom</p>
            <ul className="space-y-2 text-muted-foreground">
              <li>Everything in Pro</li>
              <li>Custom integrations</li>
              <li>SLA guarantee</li>
              <li>Dedicated support</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}

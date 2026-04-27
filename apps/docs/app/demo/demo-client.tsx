'use client'

import { Hint, HintsProvider } from '@tour-kit/hints'
import {
  MultiTourKitProvider,
  Tour,
  TourCard,
  TourOverlay,
  TourStep,
  useTour,
} from '@tour-kit/react'

const tourSource = `import { Tour, TourStep, MultiTourKitProvider, TourOverlay, TourCard } from '@tour-kit/react'

export function App() {
  return (
    <MultiTourKitProvider>
      <Tour id="quickstart">
        <TourStep
          id="welcome"
          target="#demo-header"
          title="Welcome aboard"
          content="A 4-step tour of your dashboard."
          placement="bottom"
          waitForTarget
        />
        <TourStep
          id="nav"
          target="#demo-sidebar"
          title="Navigate anywhere"
          content="Tours can span multiple pages with the router adapter."
          placement="right"
          waitForTarget
        />
        <TourStep
          id="metric"
          target="#demo-metric-revenue"
          title="Track key metrics"
          content="Highlight any DOM node — selectors, refs, or data attributes."
          placement="bottom"
          waitForTarget
        />
        <TourStep
          id="done"
          target="#demo-table"
          title="That's it"
          content="WCAG 2.1 AA, focus-trapped, keyboard-navigable. Ship it."
          placement="top"
          waitForTarget
        />
      </Tour>
      {/* your app */}
      <TourOverlay />
      <TourCard />
    </MultiTourKitProvider>
  )
}`

function StartButton() {
  const { start, isActive } = useTour('quickstart')
  return (
    <button type="button" onClick={() => start()} disabled={isActive} className="btn-primary">
      {isActive ? 'Tour running…' : 'Start interactive tour'}
    </button>
  )
}

function MockDashboard() {
  return (
    <div className="rounded-2xl border border-tk-outline-variant bg-tk-surface shadow-sm overflow-hidden">
      <header
        id="demo-header"
        className="flex items-center justify-between border-b border-tk-outline-variant bg-tk-container px-6 py-4"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-tk-primary" aria-hidden />
          <span className="font-semibold text-tk-on-surface">Acme Dashboard</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-tk-on-surface-variant">
          <span>v2.4.1</span>
          <div className="h-8 w-8 rounded-full bg-tk-tertiary" aria-hidden />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] min-h-[420px]">
        <nav
          id="demo-sidebar"
          aria-label="Demo dashboard sidebar"
          className="border-r border-tk-outline-variant bg-tk-container-dim p-4 space-y-1 text-sm"
        >
          {['Overview', 'Customers', 'Billing', 'Settings'].map((label, i) => (
            <div
              key={label}
              className={`rounded-lg px-3 py-2 ${
                i === 0
                  ? 'bg-tk-primary-container font-medium'
                  : 'text-tk-on-surface-variant hover:bg-tk-container'
              }`}
            >
              {label}
            </div>
          ))}
        </nav>

        <main className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              id="demo-metric-revenue"
              className="rounded-xl border border-tk-outline-variant bg-tk-surface p-4"
            >
              <div className="text-xs uppercase tracking-wide text-tk-on-surface-variant">
                Revenue
              </div>
              <div className="mt-2 text-2xl font-semibold text-tk-on-surface">$48,210</div>
              <div className="text-xs text-tk-success mt-1">+12.4%</div>
            </div>
            <div className="rounded-xl border border-tk-outline-variant bg-tk-surface p-4">
              <div className="text-xs uppercase tracking-wide text-tk-on-surface-variant">
                Active users
              </div>
              <div className="mt-2 text-2xl font-semibold text-tk-on-surface">3,219</div>
              <div className="text-xs text-tk-success mt-1">+4.1%</div>
            </div>
            <div className="rounded-xl border border-tk-outline-variant bg-tk-surface p-4 relative">
              <div className="text-xs uppercase tracking-wide text-tk-on-surface-variant">
                Churn
              </div>
              <div className="mt-2 text-2xl font-semibold text-tk-on-surface">1.8%</div>
              <div className="text-xs text-tk-error mt-1">+0.2%</div>
              <Hint
                id="demo-hint-churn"
                target="#demo-metric-churn-anchor"
                content={
                  <div className="space-y-1">
                    <div className="font-medium">Persistent hints</div>
                    <div>Hint beacons survive across sessions. Click the dot.</div>
                  </div>
                }
                tooltipPlacement="left"
              />
              <span id="demo-metric-churn-anchor" className="absolute right-3 top-3" />
            </div>
          </div>

          <div
            id="demo-table"
            className="rounded-xl border border-tk-outline-variant bg-tk-surface overflow-hidden"
          >
            <div className="border-b border-tk-outline-variant bg-tk-container-dim px-4 py-2 text-sm font-medium text-tk-on-surface">
              Recent activity
            </div>
            <table className="w-full text-sm">
              <thead className="text-tk-on-surface-variant text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Customer</th>
                  <th className="px-4 py-2 text-left font-medium">Plan</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tk-outline-variant">
                {[
                  ['Linear Inc.', 'Pro', 'Active'],
                  ['Vercel', 'Enterprise', 'Active'],
                  ['Acme Co.', 'Free', 'Trial'],
                ].map(([customer, plan, status]) => (
                  <tr key={customer} className="text-tk-on-surface">
                    <td className="px-4 py-2">{customer}</td>
                    <td className="px-4 py-2">{plan}</td>
                    <td className="px-4 py-2">
                      <span className="badge-primary">{status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  )
}

export function DemoClient() {
  return (
    <MultiTourKitProvider>
      <HintsProvider>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <StartButton />
            <span className="text-sm text-tk-on-surface-variant">
              No signup. Free packages only (
              <code className="rounded bg-tk-container px-1.5 py-0.5 text-xs">@tour-kit/core</code>
              {' + '}
              <code className="rounded bg-tk-container px-1.5 py-0.5 text-xs">@tour-kit/react</code>
              {' + '}
              <code className="rounded bg-tk-container px-1.5 py-0.5 text-xs">@tour-kit/hints</code>
              ).
            </span>
          </div>

          <MockDashboard />

          <details className="rounded-xl border border-tk-outline-variant bg-tk-container-dim">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-tk-on-surface">
              View source for this demo
            </summary>
            <pre className="overflow-x-auto px-4 pb-4 text-xs leading-relaxed text-tk-on-surface">
              <code>{tourSource}</code>
            </pre>
          </details>
        </div>

        <Tour id="quickstart">
          <TourStep
            id="welcome"
            target="#demo-header"
            title="Welcome aboard"
            content="A 4-step tour of your dashboard. Use Tab/Shift-Tab and Esc to test focus trap and keyboard nav."
            placement="bottom"
            waitForTarget
          />
          <TourStep
            id="nav"
            target="#demo-sidebar"
            title="Navigate anywhere"
            content="Tours can span multiple pages with the Next.js or React Router adapter."
            placement="right"
            waitForTarget
          />
          <TourStep
            id="metric"
            target="#demo-metric-revenue"
            title="Track key metrics"
            content="Highlight any DOM node — selectors, refs, or data attributes."
            placement="bottom"
            waitForTarget
          />
          <TourStep
            id="done"
            target="#demo-table"
            title="That's it"
            content="WCAG 2.1 AA, focus-trapped, keyboard-navigable. Install @tour-kit/react to ship."
            placement="top"
            waitForTarget
          />
        </Tour>

        <TourOverlay />
        <TourCard />
      </HintsProvider>
    </MultiTourKitProvider>
  )
}

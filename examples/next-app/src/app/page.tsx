'use client'

import { Hint, useHints } from '@tour-kit/hints'
import { useTour } from '@tour-kit/react'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const { start, isActive, currentStepIndex, totalSteps } = useTour('onboarding-tour')
  const { resetAllHints } = useHints()
  const [mounted, setMounted] = useState(false)

  // Wait for client-side hydration before showing hints
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 id="hero-title" className="text-3xl font-bold text-foreground">
            TourKit Multi-Page Demo
          </h1>
          <div className="flex items-center gap-4">
            {isActive && (
              <span className="text-sm text-muted-foreground">
                Step {currentStepIndex + 1} of {totalSteps}
              </span>
            )}
            <button
              type="button"
              onClick={() => resetAllHints()}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
            >
              Reset Hints
            </button>
            <button
              type="button"
              onClick={() => start()}
              disabled={isActive}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isActive ? 'Tour in Progress...' : 'Start Multi-Page Tour'}
            </button>
          </div>
        </header>

        <section id="hero-content" className="p-8 rounded-lg bg-secondary">
          <h2 className="text-2xl font-bold mb-4">Multi-Page Tours with TourKit</h2>
          <p className="text-muted-foreground mb-4">
            This demo showcases TourKit's multi-page tour functionality. The tour will:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Guide you through multiple pages automatically</li>
            <li>Navigate to the correct page for each step</li>
            <li>Persist progress across page refreshes</li>
            <li>Work with Next.js App Router</li>
          </ul>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div id="step-home" className="p-6 rounded-lg border bg-popover shadow-sm relative">
            <h2 className="text-xl font-semibold mb-2">Step 1: Home</h2>
            <p className="text-muted-foreground">
              The tour starts here with an introduction to the navigation.
            </p>
            {mounted && (
              <Hint
                id="home-hint"
                target="#step-home"
                content="This is where your journey begins!"
                position="top-right"
                tooltipPlacement="left"
                pulse
                persist
              />
            )}
          </div>

          <div id="step-features" className="p-6 rounded-lg border bg-popover shadow-sm relative">
            <h2 className="text-xl font-semibold mb-2">Step 2: Features</h2>
            <p className="text-muted-foreground">
              Next, you'll explore our key features on the Features page.
            </p>
            {mounted && (
              <Hint
                id="features-hint"
                target="#step-features"
                content="Discover all the amazing features!"
                position="top-right"
                tooltipPlacement="left"
                pulse
                persist
              />
            )}
          </div>

          <div id="step-final" className="p-6 rounded-lg border bg-popover shadow-sm relative">
            <h2 className="text-xl font-semibold mb-2">Step 3: Pricing & Contact</h2>
            <p className="text-muted-foreground">
              Finally, visit Pricing and Contact to complete the tour.
            </p>
            {mounted && (
              <Hint
                id="final-hint"
                target="#step-final"
                content="Complete the tour to see everything!"
                position="top-right"
                tooltipPlacement="left"
                pulse
                persist
              />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

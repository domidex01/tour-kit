'use client'

import { Play, RotateCcw } from 'lucide-react'
import { useState } from 'react'

function DemoContent() {
  const [step, setStep] = useState<number | null>(null)

  const steps = [
    {
      target: 'demo-title',
      title: 'Welcome to TourKit!',
      content: "This is an interactive demo. Click 'Next' to continue.",
    },
    {
      target: 'demo-feature-1',
      title: 'Feature Highlights',
      content: 'Tours can highlight any element on the page.',
    },
    {
      target: 'demo-feature-2',
      title: 'Step by Step',
      content: 'Guide users through your application flow.',
    },
    {
      target: 'demo-feature-3',
      title: 'Fully Customizable',
      content: 'Style everything to match your brand.',
    },
    {
      target: 'demo-start',
      title: "That's it!",
      content: 'Try TourKit in your own project today.',
    },
  ]

  const isActive = step !== null
  const currentStep = step !== null ? steps[step] : null

  const start = () => setStep(0)
  const next = () => {
    if (step !== null && step < steps.length - 1) {
      setStep(step + 1)
    } else {
      setStep(null)
    }
  }
  const prev = () => {
    if (step !== null && step > 0) {
      setStep(step - 1)
    }
  }
  const reset = () => setStep(null)

  return (
    <div className="relative rounded-xl border border-fd-border bg-fd-card p-8">
      {/* Demo Header */}
      <div className="mb-8 flex items-center justify-between">
        <h3
          id="demo-title"
          className={`text-xl font-semibold ${currentStep?.target === 'demo-title' ? 'ring-2 ring-[var(--tk-primary)] ring-offset-2 rounded-lg p-2 -m-2' : ''}`}
        >
          Interactive Demo
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-fd-border px-3 py-1.5 text-sm transition-colors hover:bg-fd-muted"
            disabled={!isActive}
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            type="button"
            id="demo-start"
            onClick={start}
            className={`inline-flex items-center gap-2 rounded-lg bg-[var(--tk-primary)] px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 ${currentStep?.target === 'demo-start' ? 'ring-2 ring-[var(--tk-primary)] ring-offset-2' : ''}`}
            disabled={isActive}
          >
            <Play className="h-4 w-4" />
            Start Tour
          </button>
        </div>
      </div>

      {/* Demo Content */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div
          id="demo-feature-1"
          className={`rounded-lg border border-fd-border bg-fd-background p-4 ${currentStep?.target === 'demo-feature-1' ? 'ring-2 ring-[var(--tk-primary)] ring-offset-2' : ''}`}
        >
          <div className="mb-2 h-8 w-8 rounded-lg bg-[var(--tk-primary-container)]" />
          <h4 className="font-medium">Feature One</h4>
          <p className="text-sm text-fd-muted-foreground">First feature description</p>
        </div>
        <div
          id="demo-feature-2"
          className={`rounded-lg border border-fd-border bg-fd-background p-4 ${currentStep?.target === 'demo-feature-2' ? 'ring-2 ring-[var(--tk-primary)] ring-offset-2' : ''}`}
        >
          <div className="mb-2 h-8 w-8 rounded-lg bg-[var(--tk-primary-container)]" />
          <h4 className="font-medium">Feature Two</h4>
          <p className="text-sm text-fd-muted-foreground">Second feature description</p>
        </div>
        <div
          id="demo-feature-3"
          className={`rounded-lg border border-fd-border bg-fd-background p-4 ${currentStep?.target === 'demo-feature-3' ? 'ring-2 ring-[var(--tk-primary)] ring-offset-2' : ''}`}
        >
          <div className="mb-2 h-8 w-8 rounded-lg bg-[var(--tk-primary-container)]" />
          <h4 className="font-medium">Feature Three</h4>
          <p className="text-sm text-fd-muted-foreground">Third feature description</p>
        </div>
      </div>

      {/* Tour Tooltip */}
      {currentStep && (
        <div className="absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-80 rounded-xl border border-fd-border bg-fd-background p-4 shadow-xl">
          <h4 className="mb-2 font-semibold">{currentStep.title}</h4>
          <p className="mb-4 text-sm text-fd-muted-foreground">{currentStep.content}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-fd-muted-foreground">
              Step {(step ?? 0) + 1} of {steps.length}
            </span>
            <div className="flex gap-2">
              {(step ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={prev}
                  className="rounded-lg border border-fd-border px-3 py-1.5 text-sm transition-colors hover:bg-fd-muted"
                >
                  Previous
                </button>
              )}
              <button
                type="button"
                onClick={next}
                className="rounded-lg bg-[var(--tk-primary)] px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                {step === steps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay */}
      {isActive && <div className="absolute inset-0 bg-black/20 rounded-xl pointer-events-none" />}
    </div>
  )
}

export function DemoTour() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Try It Yourself</h2>
          <p className="text-lg text-fd-muted-foreground">
            Click "Start Tour" to see TourKit in action.
          </p>
        </div>

        <DemoContent />
      </div>
    </section>
  )
}

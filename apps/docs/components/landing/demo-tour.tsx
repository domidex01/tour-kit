'use client'

import { ChevronLeft, ChevronRight, Play, RotateCcw } from 'lucide-react'
import { useState } from 'react'

const steps = [
  {
    target: 'demo-title',
    title: 'Welcome to TourKit',
    content: 'This is an interactive demo. Each step highlights a different element.',
  },
  {
    target: 'demo-feature-1',
    title: 'Highlight anything',
    content: 'Tours can spotlight any element on the page with a smooth transition.',
  },
  {
    target: 'demo-feature-2',
    title: 'Step by step',
    content: 'Guide users through your application flow at their own pace.',
  },
  {
    target: 'demo-feature-3',
    title: 'Fully customizable',
    content: 'Every visual detail — tooltip, overlay, navigation — is yours to style.',
  },
  {
    target: 'demo-start',
    title: "That's it",
    content: 'Three packages, a few lines of code, and your product tour is live.',
  },
]

const featureColors = [
  { icon: 'text-rose-500', bg: 'bg-rose-500/10', ring: 'ring-rose-500/30 bg-rose-500/5' },
  {
    icon: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    ring: 'ring-emerald-500/30 bg-emerald-500/5',
  },
  { icon: 'text-amber-500', bg: 'bg-amber-500/10', ring: 'ring-amber-500/30 bg-amber-500/5' },
]

function isHighlighted(target: string, currentTarget: string | undefined) {
  return target === currentTarget
}

export function DemoTour() {
  const [step, setStep] = useState<number | null>(null)

  const isActive = step !== null
  const currentStep = step !== null ? steps[step] : null

  const start = () => setStep(0)
  const next = () => {
    if (step !== null && step < steps.length - 1) setStep(step + 1)
    else setStep(null)
  }
  const prev = () => {
    if (step !== null && step > 0) setStep(step - 1)
  }
  const reset = () => setStep(null)

  return (
    <section className="px-6 py-20 sm:px-8 md:py-28 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-fd-foreground sm:text-4xl">
            See it in action
          </h2>
          <p className="mx-auto max-w-lg text-lg text-fd-muted-foreground">
            Click &ldquo;Start tour&rdquo; to walk through a working demo right here.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-fd-border bg-fd-card shadow-sm">
          {/* Demo header */}
          <div className="flex items-center justify-between border-b border-fd-border px-6 py-4">
            <h3
              id="demo-title"
              className={`text-[15px] font-bold transition-all ${
                isHighlighted('demo-title', currentStep?.target)
                  ? 'rounded-lg bg-[var(--tk-primary)]/10 px-3 py-1 -mx-3 -my-1 ring-2 ring-[var(--tk-primary)]/40'
                  : ''
              }`}
            >
              Interactive Demo
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={reset}
                disabled={!isActive}
                className="inline-flex items-center gap-1.5 rounded-lg border border-fd-border px-3 py-1.5 text-sm font-medium text-fd-muted-foreground transition-colors hover:bg-fd-muted disabled:opacity-40"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button
                type="button"
                id="demo-start"
                onClick={start}
                disabled={isActive}
                className={`inline-flex items-center gap-1.5 rounded-lg bg-[var(--tk-primary)] px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-40 ${
                  isHighlighted('demo-start', currentStep?.target)
                    ? 'ring-2 ring-[var(--tk-primary)]/40 ring-offset-2 ring-offset-fd-card'
                    : ''
                }`}
              >
                <Play className="h-3.5 w-3.5" />
                Start tour
              </button>
            </div>
          </div>

          {/* Demo content */}
          <div className="grid gap-px bg-fd-border sm:grid-cols-3">
            {(['demo-feature-1', 'demo-feature-2', 'demo-feature-3'] as const).map((id, i) => (
              <div
                key={id}
                id={id}
                className={`relative bg-fd-background p-6 transition-all ${
                  isHighlighted(id, currentStep?.target)
                    ? `ring-2 ring-inset ${featureColors[i].ring}`
                    : ''
                }`}
              >
                <div
                  className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${featureColors[i].bg}`}
                >
                  <span className={`text-sm font-bold ${featureColors[i].icon}`}>{i + 1}</span>
                </div>
                <h4 className="mb-1 text-sm font-bold text-fd-foreground">
                  {['Highlight targets', 'Navigation flow', 'Custom styling'][i]}
                </h4>
                <p className="text-[13px] leading-relaxed text-fd-muted-foreground">
                  {
                    [
                      'Any DOM element can become a tour target with smooth spotlight transitions.',
                      'Step-by-step navigation with keyboard support and progress tracking.',
                      'Full control over tooltip appearance, overlay, and animation timing.',
                    ][i]
                  }
                </p>
              </div>
            ))}
          </div>

          {/* Tour tooltip */}
          {currentStep && (
            <div className="absolute bottom-6 left-1/2 z-10 w-80 -translate-x-1/2 rounded-xl border border-fd-border bg-fd-background p-5 shadow-xl">
              <h4 className="mb-1.5 text-sm font-bold text-fd-foreground">{currentStep.title}</h4>
              <p className="mb-4 text-[13px] leading-relaxed text-fd-muted-foreground">
                {currentStep.content}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {steps.map((_, i) => (
                    <div
                      key={`dot-${steps[i].target}`}
                      className={`h-1.5 rounded-full transition-all ${
                        i === step ? 'w-5 bg-[var(--tk-primary)]' : 'w-1.5 bg-fd-muted'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-1.5">
                  {(step ?? 0) > 0 && (
                    <button
                      type="button"
                      onClick={prev}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-fd-border text-fd-muted-foreground transition-colors hover:bg-fd-muted"
                      aria-label="Previous step"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={next}
                    className="flex h-7 items-center gap-1 rounded-lg bg-[var(--tk-primary)] px-3 text-xs font-semibold text-white transition-all hover:brightness-110"
                  >
                    {step === steps.length - 1 ? 'Finish' : 'Next'}
                    {step !== steps.length - 1 && <ChevronRight className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Overlay */}
          {isActive && <div className="pointer-events-none absolute inset-0 bg-fd-foreground/5" />}
        </div>
      </div>
    </section>
  )
}

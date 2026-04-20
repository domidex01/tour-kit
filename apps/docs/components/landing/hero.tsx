'use client'

import { CopyButton } from '@/components/ui/copy-button'
import { ArrowRight, Terminal } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

const installCmd = 'pnpm add @tour-kit/react'

const steps = [
  {
    title: 'Welcome to your dashboard',
    content: "This is where you'll manage your projects.",
    step: 1,
  },
  {
    title: 'Create a new project',
    content: 'Click here to start building something new.',
    step: 2,
  },
  { title: 'Track your progress', content: 'Monitor metrics and activity in real time.', step: 3 },
]

function BackgroundPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <img
        src="/tourkit-lighthouse.png"
        alt=""
        role="presentation"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover opacity-90 dark:hidden"
      />
      <img
        src="/hero-dark.avif"
        alt=""
        role="presentation"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 hidden h-full w-full object-cover opacity-50 dark:block"
      />
    </div>
  )
}

function HeroDemo() {
  const [step, setStep] = useState(0)
  const [tooltipTop, setTooltipTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const targetRefs = useRef<(HTMLDivElement | null)[]>([])

  const setTargetRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      targetRefs.current[index] = el
    },
    []
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % steps.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const target = targetRefs.current[step]
    const container = containerRef.current
    if (!target || !container) return
    const containerRect = container.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    setTooltipTop(targetRect.bottom - containerRect.top + 8)
  }, [step])

  const current = steps[step]

  return (
    <div className="animate-fade-in-up-delay-2">
      <div className="overflow-hidden rounded-xl border border-white/20 bg-fd-card/80 shadow-2xl shadow-[#02182b]/10 backdrop-blur-xl dark:border-white/10">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-fd-border/50 bg-fd-muted/30 px-4 py-2.5 backdrop-blur-sm">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#d7263d]/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
          </div>
          <div className="ml-2 flex-1 rounded-md bg-fd-background/50 px-3 py-1 text-[11px] text-fd-muted-foreground">
            your-app.com
          </div>
        </div>

        {/* Mini app content */}
        <div ref={containerRef} className="relative p-6" style={{ minHeight: 380 }}>
          {/* Top bar — step 0 target */}
          <div
            ref={setTargetRef(0)}
            className={`mb-4 flex items-center justify-between rounded-lg p-2 transition-all duration-500 ${step === 0 ? 'border-2 border-[#0197f6]/30 bg-[#0197f6]/5' : 'border-2 border-transparent'}`}
          >
            <div className="h-3 w-24 rounded bg-fd-foreground/10" />
            <div className="flex gap-2">
              <div className="h-7 w-7 rounded-lg bg-fd-muted/80" />
              <div className="h-7 w-7 rounded-lg bg-fd-muted/80" />
            </div>
          </div>

          {/* Card element — step 1 target */}
          <div
            ref={setTargetRef(1)}
            className={`mb-3 rounded-lg p-3 transition-all duration-500 ${step === 1 ? 'border-2 border-[#0197f6]/30 bg-[#0197f6]/5' : 'border-2 border-transparent'}`}
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#0197f6]/15" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-20 rounded bg-fd-foreground/10" />
                <div className="h-2 w-32 rounded bg-fd-foreground/5" />
              </div>
            </div>
          </div>

          {/* Content rows — step 2 target */}
          <div
            ref={setTargetRef(2)}
            className={`mb-3 space-y-2 rounded-lg p-2 transition-all duration-500 ${step === 2 ? 'border-2 border-[#0197f6]/30 bg-[#0197f6]/5' : 'border-2 border-transparent'}`}
          >
            <div className="h-2.5 w-full rounded bg-fd-foreground/5" />
            <div className="h-2.5 w-4/5 rounded bg-fd-foreground/5" />
            <div className="h-2.5 w-3/5 rounded bg-fd-foreground/5" />
          </div>

          {/* Bottom placeholder rows */}
          <div className="space-y-2">
            <div className="h-2.5 w-full rounded bg-fd-foreground/5" />
            <div className="h-2.5 w-2/3 rounded bg-fd-foreground/5" />
          </div>

          {/* Tour tooltip — absolutely positioned, follows the active step */}
          <div
            className="absolute left-4 right-4 z-10 transition-all duration-500 ease-in-out"
            style={{ top: tooltipTop || 80 }}
          >
            <div className="relative rounded-xl border border-fd-border/50 bg-fd-background/95 p-4 shadow-lg backdrop-blur-md">
              {/* Arrow pointing up */}
              <div className="absolute -top-1.5 left-8 h-3 w-3 rotate-45 border-l border-t border-fd-border/50 bg-fd-background/95" />
              <p className="mb-1 text-[13px] font-bold text-fd-foreground">{current.title}</p>
              <p className="mb-3 text-[12px] text-fd-muted-foreground">{current.content}</p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-fd-muted-foreground">
                  {current.step} / {steps.length}
                </span>
                <div className="flex gap-1.5">
                  {steps.map((s, i) => (
                    <div
                      key={s.step}
                      className={`rounded-full transition-all duration-300 ${
                        i === step ? 'h-1.5 w-4 bg-[#0197f6]' : 'h-1.5 w-1.5 bg-fd-muted'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="rounded-lg bg-[#0197f6] px-3 py-1 text-[11px] font-semibold text-white"
                >
                  {step === steps.length - 1 ? 'Done' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Install command below the mockup */}
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-fd-border/50 bg-fd-card/60 px-4 py-2.5 backdrop-blur-sm">
        <Terminal className="h-3.5 w-3.5 text-fd-muted-foreground" />
        <code className="flex-1 font-mono text-[12px] text-fd-muted-foreground">
          <span className="select-none opacity-40">$ </span>
          {installCmd}
        </code>
        <CopyButton
          text={installCmd}
          className="text-fd-muted-foreground hover:text-fd-foreground"
        />
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-20 sm:px-8 md:pt-28 md:pb-36 lg:px-12">
      <BackgroundPattern />

      {/* Subtle dot grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--color-fd-border) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="mx-auto max-w-[1120px]">
        <div className="grid items-center gap-12 lg:grid-cols-[7fr_5fr] lg:gap-20">
          {/* Left — copy */}
          <div className="animate-fade-in-up">
            <div className="mb-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-fd-border bg-fd-card/80 px-2.5 py-1 text-[12px] font-semibold text-[#02182b] backdrop-blur-sm dark:text-white">
                <svg
                  className="h-3.5 w-3.5 text-[#0197f6]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  role="img"
                  aria-label="Checkmark"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                WCAG 2.1 AA accessible
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-fd-border bg-fd-card/80 px-2.5 py-1 text-[12px] font-semibold text-[#02182b] backdrop-blur-sm dark:text-white">
                <svg
                  className="h-3.5 w-3.5 text-fd-muted-foreground"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  role="img"
                  aria-label="Components"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M7 7h.01" />
                  <path d="M17 7h.01" />
                  <path d="M7 17h.01" />
                  <path d="M17 17h.01" />
                </svg>
                Built for shadcn/ui
              </span>
            </div>

            <h1
              data-speakable="headline"
              className="mb-6 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#02182b] dark:text-white"
            >
              The onboarding library
              <br />
              <span className="text-[#0197f6]">you wish you'd built.</span>
            </h1>

            <p
              data-speakable="summary"
              className="mb-8 max-w-[540px] text-[17px] leading-[1.7] text-[#02182b]/80 dark:text-white/80"
            >
              The open-source onboarding toolkit for React. Headless hooks, composable components,
              and WCAG 2.1 AA accessibility — all in under 8KB. Works with shadcn/ui out of the box.
            </p>

            <p className="mb-8 font-mono text-[13px] font-bold text-[#02182b]/60 dark:text-white/60">
              pnpm add @tour-kit/react <span className="mx-1 opacity-40">&middot;</span> {'<'} 8KB
              gzipped <span className="mx-1 opacity-40">&middot;</span> TypeScript strict{' '}
              <span className="mx-1 opacity-40">&middot;</span> own your code
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/docs/getting-started"
                className="group inline-flex items-center gap-2 rounded-lg bg-[#0197f6] px-6 py-3 text-[14px] font-semibold text-white shadow-lg shadow-[#0197f6]/20 transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl hover:shadow-[#0197f6]/30"
              >
                Get started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="https://github.com/DomiDex/tour-kit"
                className="inline-flex items-center gap-2 rounded-lg border border-fd-border bg-fd-background/60 px-5 py-3 text-[14px] font-semibold text-[#02182b] backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-fd-background/80 hover:shadow-md dark:text-white"
              >
                View on GitHub
              </Link>
            </div>
          </div>

          {/* Right — animated mini app mockup */}
          <HeroDemo />
        </div>
      </div>
    </section>
  )
}

'use client'

import { HeroLicenceNote } from '@/components/landing/licence-note'
import { DEFAULT_PRESET_ID, StyleSwitcher } from '@/components/landing/style-switcher'
import { CopyButton } from '@/components/ui/copy-button'
import { ArrowRight, Terminal } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

const installCmd = 'pnpm add @tour-kit/core'

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
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-x-clip">
      {/* The lighthouse photo that used to fill this layer is gone: both Figma
          frames (3945:1529 / 3792:1529) draw the hero on the flat page ground
          with only the wash and the line art over it. Its two <link rel=preload>
          tags went with it, so the hero's LCP is now text. */}

      {/* Indigo wash centred on the preview column (Figma 3945:1530 — a
          433x589 ellipse under a ~200px blur, which is a radial-gradient here
          rather than a fourth image request).

          ONE stop, and deliberately weaker than --tk-glow's own alpha. A
          horizontal sample of the dark frame across the hero peaks at a≈0.23
          around x=1050 and is flat zero left of x=500; the token carries 0.49,
          which is the strength the CTA/pricing edge blooms are drawn at. Two
          stacked passes of the full token composited to ~0.74 — three times
          the design. color-mix keeps the one token and scales it. */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            // A blurred ellipse has long tails a single linear radial stop
            // cannot follow, so this is a wide tail plus a tighter core, fitted
            // to the dark frame at (1050, 100) / (1050, 756) / (1430, 756).
            'radial-gradient(ellipse 42% 100% at 73% 55%, color-mix(in srgb, var(--tk-glow) 37%, transparent), transparent)',
            'radial-gradient(ellipse 24% 45% at 73% 72%, color-mix(in srgb, var(--tk-glow) 49%, transparent), transparent)',
          ].join(','),
        }}
      />

      {/* Concentric line art bleeding in from the right (Figma 3945:1531): the
          1067x1046 art centred on the right edge and turned 121.54deg, so only
          its left corners reach into the frame. One file for both themes — the
          SVG is a mask, so only its alpha matters and the tint is a token. */}
      <div
        className="absolute top-1/2 left-full h-[1046px] w-[1067px] -translate-x-1/2 -translate-y-1/2 rotate-[121.54deg] opacity-40"
        style={{
          background: 'var(--tk-primary-container)',
          maskImage: 'url(/hero-pattern.svg)',
          maskSize: '100% 100%',
          maskRepeat: 'no-repeat',
        }}
      />
    </div>
  )
}

/**
 * Framework logos under a top-and-bottom rule (Figma 3945:1566).
 *
 * Each logo ships as two SVGs because the wordmark is a flat fill, not
 * `currentColor` — an `<img>` cannot inherit ink, and inlining four vendor
 * logos as JSX would put ~35KB of path data in the client bundle. Sizes are
 * the exported viewBox of each asset, so none is stretched.
 */
const frameworks = [
  { name: 'React', file: 'react', width: 100, height: 30 },
  { name: 'Next.js', file: 'nextjs', width: 100, height: 20 },
  { name: 'Vue.js', file: 'vue', width: 80, height: 28 },
  { name: 'Svelte', file: 'svelte', width: 100, height: 28 },
] as const

function FrameworkStrip() {
  return (
    <>
      <p className="text-[22px] leading-10 tracking-[-0.033em] text-fd-foreground">Work with</p>
      <div className="mt-6 w-full max-w-[546px] border-[var(--tk-outline-variant)] border-t border-b py-4">
        <ul className="flex flex-wrap items-center justify-center gap-x-[38px] gap-y-4 px-6">
          {frameworks.map((f) => (
            <li key={f.file} className="flex items-center">
              {/* Light and dark differ only in wordmark ink; the mark keeps its
                  brand colour in both. */}
              <img
                src={`/frameworks/${f.file}-light.svg`}
                alt={f.name}
                width={f.width}
                height={f.height}
                loading="lazy"
                decoding="async"
                className="dark:hidden"
                style={{ width: f.width, height: f.height }}
              />
              <img
                src={`/frameworks/${f.file}-dark.svg`}
                alt={f.name}
                width={f.width}
                height={f.height}
                loading="lazy"
                decoding="async"
                className="hidden dark:block"
                style={{ width: f.width, height: f.height }}
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

function HeroDemo() {
  const [step, setStep] = useState(0)
  const [styleId, setStyleId] = useState(DEFAULT_PRESET_ID)
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
      {/* Theme switcher — six swatches that re-skin the tour below, live */}
      <div className="mb-4 flex justify-start">
        <StyleSwitcher value={styleId} onChange={setStyleId} />
      </div>

      <div
        data-tk-theme={styleId}
        className="overflow-hidden rounded-xl border border-fd-foreground/10 bg-fd-muted/80 shadow-xl shadow-[color:var(--color-fd-foreground)]/10 backdrop-blur-xl"
      >
        {/* Browser chrome — 45px bar, three 10px lights on a 6px rhythm (42px) */}
        <div className="flex h-[45px] items-center gap-2 border-b border-[var(--tk-hairline)] bg-fd-secondary px-4 py-2.5 backdrop-blur-sm">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#d7263d]/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
          </div>
          <div className="ml-2 flex-1 rounded-md bg-fd-background px-3 py-1 text-[11px] text-fd-muted-foreground">
            your-app.com
          </div>
        </div>

        {/* Mini app content */}
        <div ref={containerRef} className="relative p-6" style={{ minHeight: 380 }}>
          {/* Top bar — step 0 target */}
          <div
            ref={setTargetRef(0)}
            className={`mb-4 flex items-center justify-between rounded-lg p-2 transition-all duration-500 ${step === 0 ? 'border-[1.6px] border-[var(--tk-primary)]/30 bg-[var(--tk-primary)]/5' : 'border-[1.6px] border-transparent'}`}
          >
            <div className="h-3 w-24 rounded bg-fd-foreground/10" />
            <div className="flex gap-2">
              <div className="h-7 w-7 rounded-lg bg-fd-secondary" />
              <div className="h-7 w-7 rounded-lg bg-fd-secondary" />
            </div>
          </div>

          {/* Card element — step 1 target */}
          <div
            ref={setTargetRef(1)}
            className={`mb-3 rounded-lg p-3 transition-all duration-500 ${step === 1 ? 'border-[1.6px] border-[var(--tk-primary)]/30 bg-[var(--tk-primary)]/5' : 'border-[1.6px] border-transparent'}`}
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-[var(--tk-primary)]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-20 rounded bg-fd-foreground/10" />
                <div className="h-2 w-32 rounded bg-fd-foreground/5" />
              </div>
            </div>
          </div>

          {/* Content rows — step 2 target */}
          <div
            ref={setTargetRef(2)}
            className={`mb-3 space-y-2 rounded-lg p-2 transition-all duration-500 ${step === 2 ? 'border-[1.6px] border-[var(--tk-primary)]/30 bg-[var(--tk-primary)]/5' : 'border-[1.6px] border-transparent'}`}
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
            <div
              className="relative p-4 backdrop-blur-md transition-all duration-300 ease-out"
              style={{
                borderRadius: 'var(--tk-radius)',
                borderStyle: 'solid',
                borderWidth: 'var(--tk-card-border-width)',
                borderColor: 'var(--tk-card-border)',
                background: 'var(--tk-card-bg)',
                color: 'var(--tk-card-fg)',
                boxShadow: 'var(--tk-card-shadow)',
                fontFamily: 'var(--tk-font)',
              }}
            >
              {/* Arrow pointing up — inherits the card surface + border, weight
                  included: crimson and ember draw a 2px edge, and a nub pinned
                  to 1px reads as a seam against it. */}
              <div
                className="absolute -top-1.5 left-8 h-3 w-3 rotate-45 border-l border-t"
                style={{
                  background: 'var(--tk-card-bg)',
                  borderColor: 'var(--tk-card-border)',
                  borderLeftWidth: 'var(--tk-card-border-width)',
                  borderTopWidth: 'var(--tk-card-border-width)',
                }}
              />
              <p className="mb-1 text-[13px] font-bold" style={{ color: 'var(--tk-card-fg)' }}>
                {current.title}
              </p>
              <p className="mb-3 text-[12px]" style={{ color: 'var(--tk-card-muted)' }}>
                {current.content}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: 'var(--tk-card-muted)' }}>
                  {current.step} / {steps.length}
                </span>
                <div className="flex gap-1.5">
                  {steps.map((s, i) => (
                    <div
                      key={s.step}
                      className={`rounded-full transition-all duration-300 ${
                        i === step
                          ? 'h-1.5 w-4 bg-[var(--tk-primary)]'
                          : 'h-1.5 w-1.5 bg-[var(--tk-card-dot)]'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="px-3 py-1 text-[11px] font-semibold transition-all"
                  style={{
                    borderRadius: 'var(--tk-radius)',
                    background: 'var(--tk-primary)',
                    color: 'var(--tk-on-primary)',
                  }}
                >
                  {step === steps.length - 1 ? 'Done' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Install command below the mockup */}
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--tk-hairline)] bg-fd-muted/80 px-4 py-2.5 backdrop-blur-sm">
        <Terminal className="h-3.5 w-3.5 text-fd-muted-foreground" />
        <code className="flex-1 font-mono text-[14px] text-fd-muted-foreground sm:text-[12px]">
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
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--tk-hairline)] bg-fd-muted px-2.5 py-[5px] text-[12px] font-semibold leading-[18px] text-fd-foreground backdrop-blur-sm">
                <svg
                  className="h-3.5 w-3.5 text-[var(--color-fd-primary)]"
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
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--tk-hairline)] bg-fd-muted px-2.5 py-[5px] text-[12px] font-semibold leading-[18px] text-fd-foreground backdrop-blur-sm">
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
              className="mb-6 text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold leading-[1] tracking-[-0.024em] text-fd-foreground"
            >
              The onboarding library
              <br />
              <span className="text-[var(--color-fd-primary)]">you wish you'd built.</span>
            </h1>

            <p
              data-speakable="summary"
              className="mb-8 max-w-[540px] text-[17px] leading-[1.7] text-fd-foreground/80"
            >
              The onboarding toolkit for React, Vue and Svelte. A headless core, composable
              components, and WCAG 2.1 AA accessibility. Works with shadcn/ui out of the box.
            </p>

            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Link
                href="/builder"
                className="group inline-flex items-center gap-2 rounded-lg bg-[var(--tk-cta)] px-6 py-3 text-[14px] font-semibold text-[var(--tk-cta-ink)] shadow-lg shadow-[color:var(--color-fd-primary)]/20 transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl hover:shadow-[color:var(--color-fd-primary)]/30"
              >
                Get started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="https://github.com/domidex01/tour-kit"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--tk-hairline)] bg-fd-background px-5 py-3 text-[14px] font-semibold text-fd-foreground backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-fd-secondary hover:shadow-md"
              >
                View on GitHub
              </Link>
            </div>

            <FrameworkStrip />

            <HeroLicenceNote />
          </div>

          {/* Right — animated mini app mockup */}
          <HeroDemo />
        </div>
      </div>
    </section>
  )
}

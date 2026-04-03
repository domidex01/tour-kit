'use client'

import { highlightCode } from '@/components/landing/syntax-highlight'
import { CopyButton } from '@/components/ui/copy-button'
import { useState } from 'react'

const steps = [
  {
    number: '1',
    title: 'Install',
    description: 'One package, zero config.',
    filename: 'terminal',
    code: 'pnpm add @tour-kit/react',
  },
  {
    number: '2',
    title: 'Wrap your app',
    description: 'Add the provider at your layout root.',
    filename: 'layout.tsx',
    code: `import { TourProvider } from '@tour-kit/react';

export default function Layout({ children }) {
  return (
    <TourProvider>
      {children}
    </TourProvider>
  );
}`,
  },
  {
    number: '3',
    title: 'Define your steps',
    description: 'Declarative steps with target selectors.',
    filename: 'onboarding.tsx',
    code: `import { Tour, TourStep } from '@tour-kit/react';

export function Onboarding() {
  return (
    <Tour id="welcome" onComplete={() => {
      console.log('Tour complete!');
    }}>
      <TourStep
        target="#sidebar"
        title="Navigation"
        content="Browse your projects here."
        placement="right"
      />
      <TourStep
        target="#search"
        title="Search"
        content="Find anything instantly."
        placement="bottom"
      />
    </Tour>
  );
}`,
  },
  {
    number: '4',
    title: 'Start the tour',
    description: 'One hook, one function call.',
    filename: 'page.tsx',
    code: `import { useTour } from '@tour-kit/react';

export default function Dashboard() {
  const { start } = useTour('welcome');

  return (
    <button onClick={() => start()}>
      Take a tour
    </button>
  );
}`,
  },
]

export function QuickStart() {
  const [active, setActive] = useState(0)
  const step = steps[active]

  return (
    <section className="px-6 py-20 sm:px-8 md:py-28 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-14 max-w-lg">
          <h2 className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            Ship your first tour in 2 minutes
          </h2>
          <p className="text-[16px] leading-[1.6] text-fd-muted-foreground">
            Install, wrap, define, start. Four steps to a production-ready onboarding flow.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-12">
          {/* Step selector — vertical tabs */}
          <div className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-0 lg:overflow-visible">
            {steps.map((s, i) => {
              const isActive = i === active
              return (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`group relative flex shrink-0 items-start gap-4 rounded-xl px-4 py-4 text-left transition-colors lg:rounded-r-xl lg:rounded-l-none ${
                    isActive ? 'bg-fd-card shadow-sm' : 'hover:bg-fd-muted/40'
                  }`}
                >
                  {/* Vertical active indicator (desktop only) */}
                  <div
                    className={`absolute left-0 top-3 hidden h-[calc(100%-24px)] w-[3px] rounded-r-full transition-colors lg:block ${
                      isActive ? 'bg-[#0197f6]' : 'bg-transparent'
                    }`}
                  />

                  {/* Step number */}
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-[13px] font-bold transition-colors ${
                      isActive ? 'bg-[#0197f6] text-white' : 'bg-fd-muted text-fd-muted-foreground'
                    }`}
                  >
                    {s.number}
                  </span>

                  <div className="min-w-0">
                    <span
                      className={`block text-[15px] font-semibold transition-colors ${
                        isActive ? 'text-fd-foreground' : 'text-fd-muted-foreground'
                      }`}
                    >
                      {s.title}
                    </span>
                    <span className="mt-0.5 hidden text-[13px] text-fd-muted-foreground lg:block">
                      {s.description}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Code panel */}
          <div className="overflow-hidden rounded-xl border border-white/[0.08] shadow-2xl shadow-black/25 ring-1 ring-white/[0.04]">
            {/* Title bar */}
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#16171a] px-4 py-2.5">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span className="font-mono text-[12px] text-white/30">{step.filename}</span>
              </div>
              <CopyButton text={step.code} className="text-white/20 hover:text-white/60" />
            </div>
            {/* Code content with line numbers */}
            <div className="flex min-h-[280px] overflow-x-auto bg-[#0d0e11] py-4">
              <div
                className="select-none border-r border-white/[0.06] pl-4 pr-4 text-right font-mono text-[13px] leading-[1.8] text-white/15"
                aria-hidden="true"
              >
                {step.code.split('\n').map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: line numbers are static and never reorder
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <pre className="flex-1 px-4 font-mono text-[13px] leading-[1.8]">
                <code>{highlightCode(step.code)}</code>
              </pre>
            </div>
          </div>
        </div>

        <p className="mt-8 text-[14px] text-fd-muted-foreground">
          That&apos;s it. userTourKit handles positioning, focus trapping, keyboard navigation, and
          screen reader announcements automatically.
        </p>
      </div>
    </section>
  )
}

import { highlightCode } from '@/components/landing/syntax-highlight'

const features = [
  {
    title: 'Headless first',
    description:
      'All logic lives in hooks — your design system, your components. Need to ship fast? Use the pre-styled components and customize later.',
    code: `const tour = useTour('onboarding', {
  steps: [
    { target: '#sidebar', title: 'Nav' },
    { target: '#search', title: 'Search' },
  ],
});

// Full control over rendering
return <div style={tour.tooltipProps.style}>
  {tour.currentStep.title}
</div>;`,
    label: 'useTour',
  },
  {
    title: 'Accessible by default',
    description:
      'WCAG 2.1 AA from day one — not bolted on after an audit. Focus traps, keyboard nav, and screen reader announcements are handled so you never retrofit accessibility.',
    code: `<Tour id="onboarding">
  {/* Focus trap auto-managed */}
  {/* Arrow keys navigate steps */}
  {/* Escape dismisses tour */}
  {/* Screen readers announce steps */}
  <TourStep
    target="#welcome"
    aria-label="Welcome step"
    role="dialog"
  />
</Tour>`,
    label: '<Tour />',
  },
  {
    title: 'Tree-shakeable & tiny',
    description:
      'Core is under 8KB gzipped — 6x smaller than react-joyride. Import one hook or the full library. You only ship what you use.',
    code: `// Only imports what you use
import { useTour } from '@tour-kit/core';
// → 3.2 KB

import { Tour, TourStep } from '@tour-kit/react';
// → 7.4 KB

// vs. react-joyride → 47.2 KB
// vs. shepherd.js  → 35.1 KB`,
    label: 'import',
  },
  {
    title: 'TypeScript native',
    description:
      'Strict mode from the first commit. Full type inference for configs, hooks, and props — no @types packages, no any casts, no surprises.',
    code: `// Full type inference
const tour = useTour<MyStepData>('setup', {
  steps: [
    {
      target: '#nav',
      title: 'Navigation',
      data: { category: 'core' }, // ← typed
    },
  ],
  onComplete: (ctx) => {
    ctx.steps // ← TourStep<MyStepData>[]
  },
});`,
    label: 'type-safe',
  },
]

export function Features() {
  return (
    <section className="px-6 py-28 sm:px-8 md:py-36 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-20 max-w-lg">
          <h2 className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            Built for developers
            <br />
            who ship.
          </h2>
          <p className="text-[16px] leading-[1.6] text-fd-muted-foreground">
            Headless architecture, strict TypeScript, and WCAG accessibility — not afterthoughts, but foundations.
          </p>
        </div>

        <div className="space-y-24 md:space-y-32">
          {features.map((feature, i) => {
            const isReversed = i % 2 === 1
            return (
              <div
                key={feature.title}
                className={`grid items-center gap-10 md:grid-cols-2 md:gap-16 ${
                  isReversed ? 'md:[direction:rtl] md:[&>*]:[direction:ltr]' : ''
                }`}
              >
                {/* Text side */}
                <div>
                  <span className="mb-4 inline-block font-mono text-[13px] font-semibold text-[var(--landing-accent)]">
                    {feature.label}
                  </span>
                  <h3 className="mb-4 text-2xl font-bold tracking-[-0.01em] text-fd-foreground">
                    {feature.title}
                  </h3>
                  <p className="max-w-md text-[16px] leading-[1.7] text-fd-muted-foreground">
                    {feature.description}
                  </p>
                </div>

                {/* Code side */}
                <div className="overflow-hidden rounded-xl border border-white/[0.08] shadow-2xl shadow-black/25 ring-1 ring-white/[0.04]">
                  <div className="flex items-center gap-3 border-b border-white/[0.06] bg-[#16171a] px-4 py-2.5">
                    <div className="flex gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                      <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                      <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                    </div>
                    <span className="font-mono text-[11px] text-white/30">example.tsx</span>
                  </div>
                  <div className="flex overflow-x-auto bg-[#0d0e11] py-4">
                    <div className="select-none border-r border-white/[0.06] pl-4 pr-4 text-right font-mono text-[13px] leading-[1.8] text-white/15" aria-hidden="true">
                      {feature.code.split('\n').map((_: string, j: number) => (
                        <div key={j}>{j + 1}</div>
                      ))}
                    </div>
                    <pre className="flex-1 px-4 font-mono text-[13px] leading-[1.8]">
                      <code>{highlightCode(feature.code)}</code>
                    </pre>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

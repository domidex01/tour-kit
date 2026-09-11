import { SectionHead } from '@/components/landing/section-head'
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
    crop: 'center 18%',
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
    crop: 'center 62%',
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
    crop: 'center 88%',
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
    crop: 'center 40%',
  },
]

export function Features() {
  return (
    <section className="px-6 py-36 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <SectionHead
          title={
            <>
              Built for developers
              <br />
              who ship.
            </>
          }
        >
          Headless architecture, strict TypeScript, and WCAG accessibility — not afterthoughts, but
          foundations.
        </SectionHead>

        {/* Four 528 / 64 / 528 rows, 128px apart, alternating sides
            (Figma 3792:1965). */}
        <div className="mt-20 flex flex-col gap-20 lg:gap-32">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`flex flex-col gap-10 lg:items-center lg:gap-16 ${
                i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
              }`}
            >
              <div className="lg:w-[528px] lg:shrink-0">
                <p className="text-[13px] font-bold leading-5 text-fd-foreground">
                  {feature.label}
                </p>
                <h3 className="mt-4 text-[30px] font-bold leading-8 tracking-[-0.008em] text-fd-foreground">
                  {feature.title}
                </h3>
                <p className="mt-4 max-w-[448px] text-[16px] leading-[1.7] text-fd-muted-foreground">
                  {feature.description}
                </p>
              </div>

              {/* The code window sits on a 24px ring of photograph. One image
                  serves all four rows at four different crops — the design
                  uses four separate twilight stills, which would be four more
                  requests on a page that already carries the hero and the CTA
                  island for the same amount of colour. */}
              <div className="relative overflow-hidden rounded-3xl p-6 lg:w-[528px] lg:shrink-0">
                <img
                  src="/feature-card-bg.avif"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  width={768}
                  height={768}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: feature.crop }}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[rgb(15_23_43/0.2)] dark:bg-[rgb(2_6_24/0.45)]"
                />

                <div className="relative overflow-hidden rounded-xl border border-[rgb(2_6_24/0.08)] shadow-lg dark:border-[rgb(255_255_255/0.08)]">
                  <div className="flex items-center gap-3 border-b border-[var(--tk-card-edge)] bg-fd-secondary px-4 py-2.5">
                    <span aria-hidden="true" className="flex shrink-0 gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                    </span>
                    <span className="text-[11px] leading-5 text-fd-muted-foreground">
                      example.tsx
                    </span>
                  </div>

                  <div className="flex overflow-x-auto bg-fd-muted py-4">
                    <div
                      className="shrink-0 select-none border-r border-[var(--tk-card-edge)] px-4 text-right font-mono text-[13px] leading-[23.2px] text-fd-muted-foreground/40"
                      aria-hidden="true"
                    >
                      {feature.code.split('\n').map((_, n) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: line numbers are static and never reorder
                        <div key={n}>{n + 1}</div>
                      ))}
                    </div>
                    <pre className="flex-1 px-4 font-mono text-[13px] leading-[23.2px]">
                      <code>{highlightCode(feature.code)}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

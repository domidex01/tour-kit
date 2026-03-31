'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

const corePackages = [
  {
    name: '@tour-kit/core',
    description:
      'The headless engine. Hooks, positioning, focus management, and state — all framework-agnostic.',
    size: '< 8 KB',
    install: 'pnpm add @tour-kit/core',
    href: '/docs/core',
    features: ['useTour hook', 'Position engine', 'Focus trap', 'Keyboard nav', 'Storage adapters'],
  },
  {
    name: '@tour-kit/react',
    description: 'Pre-styled, composable React components. Drop in and go.',
    size: '< 12 KB',
    install: 'pnpm add @tour-kit/react',
    href: '/docs/react',
    features: ['Tour component', 'TourStep', 'Router adapters', 'Headless variants'],
  },
  {
    name: '@tour-kit/hints',
    description: 'Persistent contextual hints and pulsing beacons.',
    size: '< 5 KB',
    install: 'pnpm add @tour-kit/hints',
    href: '/docs/hints',
    features: ['Pulsing beacons', 'Contextual tips', 'Dismissal tracking'],
  },
]

const extensions = [
  {
    name: '@tour-kit/announcements',
    description: 'Modals, toasts, banners, slideouts',
    install: 'pnpm add @tour-kit/announcements',
    href: '/docs/announcements',
  },
  {
    name: '@tour-kit/checklists',
    description: 'Onboarding tasks with dependencies',
    install: 'pnpm add @tour-kit/checklists',
    href: '/docs/checklists',
  },
  {
    name: '@tour-kit/analytics',
    description: 'PostHog, Mixpanel, Amplitude, GA4',
    install: 'pnpm add @tour-kit/analytics',
    href: '/docs/analytics',
  },
  {
    name: '@tour-kit/adoption',
    description: 'Usage tracking & nudge scheduler',
    install: 'pnpm add @tour-kit/adoption',
    href: '/docs/adoption',
  },
  {
    name: '@tour-kit/media',
    description: 'YouTube, Vimeo, Loom, Lottie, GIF',
    install: 'pnpm add @tour-kit/media',
    href: '/docs/media',
  },
  {
    name: '@tour-kit/scheduling',
    description: 'Time-based scheduling & timezones',
    install: 'pnpm add @tour-kit/scheduling',
    href: '/docs/scheduling',
  },
]

export function Packages() {
  const { ref, visible } = useReveal()

  return (
    <section
      ref={ref}
      className="bg-[#EDF6FB] dark:bg-fd-muted/30 px-6 py-28 sm:px-8 md:py-36 lg:px-12"
    >
      <div className="mx-auto max-w-[1120px]">
        {/* Header — right-aligned for contrast with previous left-aligned sections */}
        <div className="mb-16 ml-auto max-w-lg text-right">
          <span className="mb-4 inline-block font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--landing-accent)]">
            Modular by design
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            One install.
            <br />
            Nine packages.
          </h2>
          <p className="text-[16px] leading-[1.6] text-fd-muted-foreground">
            Start with the free core. Add analytics, checklists, or scheduling when you need them —
            each package is independently tree-shakeable.
          </p>
        </div>

        {/* Core packages — featured layout: first one large, rest smaller */}
        <div className="mb-8 grid gap-4 md:grid-cols-[1.2fr_1fr_1fr]">
          {corePackages.map((pkg, i) => (
            <div
              key={pkg.name}
              className={`rounded-lg border border-fd-border bg-fd-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                visible ? 'animate-fade-in-up' : 'opacity-0'
              } ${i === 0 ? 'md:row-span-1' : ''}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-mono text-[14px] font-bold text-fd-foreground">{pkg.name}</h3>
                <span className="font-mono text-[11px] text-fd-muted-foreground">{pkg.size}</span>
              </div>
              <p className="mb-4 text-[14px] leading-[1.6] text-fd-muted-foreground">
                {pkg.description}
              </p>
              <div className="mb-5 flex flex-wrap gap-1.5">
                {pkg.features.map((f) => (
                  <span
                    key={f}
                    className="rounded bg-fd-muted px-2 py-0.5 font-mono text-[11px] text-fd-muted-foreground"
                  >
                    {f}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-fd-border pt-4">
                <code className="font-mono text-[11px] text-fd-muted-foreground">
                  <span className="select-none opacity-30">$ </span>
                  {pkg.install}
                </code>
                <Link
                  href={pkg.href}
                  className="font-mono text-[12px] font-semibold text-[var(--landing-accent)] transition-colors hover:opacity-80"
                >
                  Docs &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mb-8 flex items-center gap-4">
          <div className="h-px flex-1 border-t border-dashed border-fd-border" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-fd-muted-foreground">
            Extensions
          </span>
          <div className="h-px flex-1 border-t border-dashed border-fd-border" />
        </div>

        {/* Extensions — compact grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {extensions.map((pkg, i) => (
            <div
              key={pkg.name}
              className={`group flex items-center justify-between rounded-lg border border-dashed border-fd-border bg-fd-card px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-solid hover:shadow-sm ${
                visible ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${300 + i * 80}ms` }}
            >
              <div className="min-w-0">
                <h3 className="font-mono text-[12px] font-bold text-fd-foreground">{pkg.name}</h3>
                <p className="text-[12px] text-fd-muted-foreground">{pkg.description}</p>
              </div>
              <Link
                href={pkg.href}
                className="ml-4 shrink-0 font-mono text-[11px] font-semibold text-[var(--landing-accent)] opacity-0 transition-opacity group-hover:opacity-100"
              >
                &rarr;
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

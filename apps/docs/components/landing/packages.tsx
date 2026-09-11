import { SectionHead } from '@/components/landing/section-head'
import Link from 'next/link'

/**
 * Capability entries link to the marketing pages (commercial intent lives
 * there — plan §3.2); supporting packages keep their docs links. `linkLabel`
 * distinguishes the two destinations.
 */
const corePackages = [
  {
    name: '@tour-kit/core',
    description:
      'The headless engine. Hooks, positioning, focus management, and state — all framework-agnostic.',
    size: '< 8 KB',
    install: 'pnpm add @tour-kit/core',
    href: '/docs/core',
    linkLabel: 'Docs',
    features: ['useTour hook', 'Position engine', 'Focus trap', 'Keyboard nav', 'Storage adapters'],
  },
  {
    name: '@tour-kit/react',
    description: 'Pre-styled, composable React components. Drop in and go.',
    size: '< 12 KB',
    install: 'pnpm add @tour-kit/react',
    href: '/product-tours',
    linkLabel: 'Product tours',
    features: ['Tour component', 'TourStep', 'Router adapters', 'Headless variants'],
  },
  {
    name: '@tour-kit/hints',
    description: 'Persistent contextual hints and pulsing beacons.',
    size: '< 5 KB',
    install: 'pnpm add @tour-kit/hints',
    href: '/feature-hints',
    linkLabel: 'Feature hints',
    features: ['Pulsing beacons', 'Contextual tips', 'Dismissal tracking'],
  },
]

const extensions = [
  {
    name: '@tour-kit/announcements',
    description: 'Modals, toasts, banners, slideouts',
    install: 'pnpm add @tour-kit/announcements',
    href: '/product-announcements',
  },
  {
    name: '@tour-kit/checklists',
    description: 'Onboarding tasks with dependencies',
    install: 'pnpm add @tour-kit/checklists',
    href: '/onboarding-checklists',
  },
  {
    name: '@tour-kit/surveys',
    description: 'NPS, CSAT & CES microsurveys',
    install: 'pnpm add @tour-kit/surveys',
    href: '/in-app-surveys',
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
  return (
    <section className="px-6 py-36 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        {/* Right-aligned, for contrast with the left-aligned bands around it
            (Figma 3792:2081 sets the head at x=608 in a 1120 container). */}
        <SectionHead
          align="end"
          title={
            <>
              One install.
              <br />
              Ten packages.
            </>
          }
        >
          Start with the free core. Add analytics, checklists, or scheduling when you need them —
          each package is independently tree-shakeable.
        </SectionHead>

        {/* 408 / 340 / 340 on a 16px gutter — the design gives core the wider
            card because it carries five capability tags to the others' three.
            Three across only from `lg`: at the `md` breakpoint the columns are
            ~240px and both the install command and the tag row clip. */}
        <div className="mt-16 grid gap-4 lg:grid-cols-[408fr_340fr_340fr]">
          {corePackages.map((pkg) => (
            <div
              key={pkg.name}
              className="flex flex-col rounded-3xl border border-[var(--tk-card-edge)] bg-fd-muted p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[18px] font-bold leading-[21px] text-fd-foreground">
                  {pkg.name}
                </h3>
                <span className="shrink-0 text-[11px] leading-[17px] text-fd-muted-foreground">
                  {pkg.size}
                </span>
              </div>

              <p className="mt-4 text-[14px] leading-[1.6] text-fd-muted-foreground">
                {pkg.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-x-1.5 gap-y-[5px]">
                {pkg.features.map((f) => (
                  <span
                    key={f}
                    className="rounded bg-fd-secondary px-2 py-0.5 text-[11px] leading-[17px] text-fd-muted-foreground"
                  >
                    {f}
                  </span>
                ))}
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--tk-card-edge)] pt-4">
                <code className="truncate font-mono text-[11px] leading-[17px] text-fd-muted-foreground lg:overflow-visible lg:whitespace-nowrap">
                  <span className="select-none opacity-40">$ </span>
                  {pkg.install}
                </code>
                <Link
                  href={pkg.href}
                  className="shrink-0 text-[12px] font-bold leading-[18px] text-fd-foreground transition-colors hover:text-[var(--color-fd-primary)]"
                >
                  {pkg.linkLabel} &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* rule — label — rule (Figma 3792:2148). Solid slate-400 hairlines. */}
        <div className="mt-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-[var(--tk-card-edge)]" />
          <span className="text-[11px] font-semibold uppercase leading-[17px] tracking-[0.05em] text-fd-muted-foreground">
            Extensions
          </span>
          <div className="h-px flex-1 bg-[var(--tk-card-edge)]" />
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {extensions.map((pkg) => (
            <Link
              key={pkg.name}
              href={pkg.href}
              className="flex flex-col gap-4 rounded-2xl border border-dashed border-[var(--tk-card-edge)] bg-fd-muted px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-solid hover:shadow-sm"
            >
              <span className="text-[18px] font-bold leading-[18px] text-fd-foreground">
                {pkg.name}
              </span>
              <span className="text-[12px] leading-[18px] text-fd-muted-foreground">
                {pkg.description}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

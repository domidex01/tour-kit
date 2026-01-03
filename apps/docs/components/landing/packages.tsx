import { ArrowRight, Component, Cpu, Lightbulb } from 'lucide-react'
import Link from 'next/link'

const packages = [
  {
    name: '@tour-kit/core',
    icon: Cpu,
    description: 'Headless hooks and utilities',
    size: '< 8KB',
    href: '/docs/core',
    features: ['useTour hook', 'useSpotlight hook', 'Keyboard navigation', 'Full TypeScript'],
  },
  {
    name: '@tour-kit/react',
    icon: Component,
    description: 'Pre-styled React components',
    size: '< 12KB',
    href: '/docs/react',
    features: ['Tour component', 'TourStep component', 'Tailwind styling', 'Headless variants'],
  },
  {
    name: '@tour-kit/hints',
    icon: Lightbulb,
    description: 'Persistent hints system',
    size: '< 5KB',
    href: '/docs/hints',
    features: ['Hint component', 'Pulsing beacons', 'Dismissible', 'Persistence'],
  },
]

export function Packages() {
  return (
    <section className="bg-fd-muted/50 px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Three Packages, One Mission</h2>
          <p className="text-lg text-fd-muted-foreground">
            Choose the package that fits your needs.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {packages.map((pkg) => (
            <Link
              key={pkg.name}
              href={pkg.href}
              className="group flex flex-col rounded-xl border border-fd-border bg-fd-background p-6 transition-all hover:border-[var(--tk-primary)] hover:shadow-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <pkg.icon className="h-10 w-10 text-[var(--tk-primary)]" />
                <span className="rounded-full bg-[var(--tk-primary-container)] px-2 py-1 text-xs font-medium text-[var(--tk-primary)]">
                  {pkg.size}
                </span>
              </div>

              <h3 className="mb-2 font-mono text-lg font-semibold">{pkg.name}</h3>
              <p className="mb-4 text-sm text-fd-muted-foreground">{pkg.description}</p>

              <ul className="mb-6 flex-1 space-y-2">
                {pkg.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-fd-muted-foreground"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-[var(--tk-primary)]" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-2 text-sm font-medium text-[var(--tk-primary)] transition-colors group-hover:text-[var(--tk-primary)]">
                Learn more
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

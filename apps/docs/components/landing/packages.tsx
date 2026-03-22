import { ArrowRight, Component, Cpu, Lightbulb } from 'lucide-react'
import Link from 'next/link'

const packages = [
  {
    name: '@tour-kit/core',
    icon: Cpu,
    description: 'Headless hooks & utilities',
    size: '< 8 KB',
    href: '/docs/core',
    features: ['useTour hook', 'useSpotlight hook', 'Keyboard navigation', 'Full TypeScript'],
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    borderHover: 'hover:border-violet-500/40',
  },
  {
    name: '@tour-kit/react',
    icon: Component,
    description: 'Pre-styled React components',
    size: '< 12 KB',
    href: '/docs/react',
    features: ['Tour component', 'TourStep component', 'Tailwind styling', 'Headless variants'],
    color: 'text-[var(--tk-primary)]',
    bgColor: 'bg-[var(--tk-primary)]/10',
    borderHover: 'hover:border-[var(--tk-primary)]/40',
  },
  {
    name: '@tour-kit/hints',
    icon: Lightbulb,
    description: 'Persistent hint system',
    size: '< 5 KB',
    href: '/docs/hints',
    features: ['Hint component', 'Pulsing beacons', 'Dismissible', 'Persistence'],
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderHover: 'hover:border-amber-500/40',
  },
]

export function Packages() {
  return (
    <section className="px-6 py-20 sm:px-8 md:py-28 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-fd-foreground sm:text-4xl">
            Pick what you need
          </h2>
          <p className="mx-auto max-w-xl text-lg text-fd-muted-foreground">
            Start with core for full control, or grab react for ready-made components.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {packages.map((pkg) => (
            <Link
              key={pkg.name}
              href={pkg.href}
              className={`group flex flex-col rounded-xl border border-fd-border bg-fd-card p-7 shadow-sm transition-all hover:shadow-md ${pkg.borderHover}`}
            >
              <div className="mb-5 flex items-center justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-lg ${pkg.bgColor}`}
                >
                  <pkg.icon className={`h-5 w-5 ${pkg.color}`} />
                </div>
                <span className="rounded-full bg-fd-muted px-3 py-1 text-xs font-bold text-fd-muted-foreground">
                  {pkg.size}
                </span>
              </div>

              <h3 className="mb-1 font-mono text-[15px] font-bold text-fd-foreground">
                {pkg.name}
              </h3>
              <p className="mb-5 text-sm text-fd-muted-foreground">{pkg.description}</p>

              <ul className="mb-6 flex-1 space-y-2.5">
                {pkg.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2.5 text-sm text-fd-muted-foreground"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${pkg.color.replace('text-', 'bg-')}`}
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <span
                className={`inline-flex items-center gap-1.5 text-sm font-semibold ${pkg.color} transition-colors`}
              >
                Documentation
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

import { Code2, Eye, Keyboard, Package, Palette, Settings, Shield, Zap } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Headless First',
    description: 'All logic in hooks. Build your own UI or use our pre-styled components.',
  },
  {
    icon: Shield,
    title: 'Accessible',
    description: 'WCAG 2.1 AA compliant with focus management and keyboard navigation.',
  },
  {
    icon: Package,
    title: 'Tiny Bundle',
    description: 'Core is under 8KB gzipped. Tree-shakeable exports for optimal size.',
  },
  {
    icon: Keyboard,
    title: 'Keyboard Navigation',
    description: 'Full keyboard support with customizable key bindings.',
  },
  {
    icon: Eye,
    title: 'Spotlight Effect',
    description: 'Highlight elements with smooth animations and customizable overlays.',
  },
  {
    icon: Settings,
    title: 'Highly Configurable',
    description: 'Customize every aspect from positioning to persistence.',
  },
  {
    icon: Code2,
    title: 'TypeScript Native',
    description: 'Full type safety with comprehensive TypeScript definitions.',
  },
  {
    icon: Palette,
    title: 'Tailwind Ready',
    description: 'Works seamlessly with Tailwind CSS and shadcn/ui components.',
  },
]

export function Features() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Everything You Need</h2>
          <p className="text-lg text-fd-muted-foreground">
            Built with developer experience and accessibility in mind.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-fd-border bg-fd-card p-6 transition-all hover:border-[var(--tk-primary)]/50 hover:shadow-lg"
            >
              <feature.icon className="mb-4 h-10 w-10 text-[var(--tk-primary)] transition-transform group-hover:scale-110" />
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm text-fd-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

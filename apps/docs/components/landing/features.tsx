import { Code2, Eye, Keyboard, Package, Shield, Zap } from 'lucide-react'

const highlights = [
  {
    icon: Zap,
    title: 'Headless first',
    description:
      'All tour logic lives in hooks. Bring your own UI, or reach for the pre-styled components when speed matters.',
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    icon: Shield,
    title: 'Accessible by default',
    description:
      'WCAG 2.1 AA compliant out of the box — focus management, keyboard navigation, and ARIA attributes handled for you.',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    icon: Package,
    title: 'Tree-shakeable & tiny',
    description:
      'Core under 8 KB gzipped. Only ship the code you use — every export is independently tree-shakeable.',
    iconColor: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
  },
  {
    icon: Keyboard,
    title: 'Keyboard navigation',
    description:
      'Arrow keys, Escape, Tab — full keyboard support with customizable bindings. No mouse required.',
    iconColor: 'text-sky-500',
    bgColor: 'bg-sky-500/10',
  },
  {
    icon: Eye,
    title: 'Spotlight & overlays',
    description:
      'Smoothly highlight any element with configurable overlays, padding, and border-radius.',
    iconColor: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
  },
  {
    icon: Code2,
    title: 'TypeScript native',
    description:
      'Written in TypeScript with strict mode. Full type inference for steps, events, and configuration.',
    iconColor: 'text-[var(--tk-primary)]',
    bgColor: 'bg-[var(--tk-primary)]/10',
  },
]

export function Features() {
  return (
    <section className="border-y border-fd-border bg-fd-muted/30 px-6 py-20 sm:px-8 md:py-28 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-fd-foreground sm:text-4xl">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-fd-muted-foreground">
            Built with developer experience and accessibility as first-class priorities.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="group rounded-xl border border-fd-border bg-fd-background p-6 shadow-sm transition-all hover:border-fd-ring/30 hover:shadow-md"
            >
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ${item.bgColor}`}
              >
                <item.icon className={`h-5 w-5 ${item.iconColor}`} />
              </div>
              <h3 className="mb-2 text-[16px] font-bold text-fd-foreground">{item.title}</h3>
              <p className="text-[15px] leading-relaxed text-fd-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

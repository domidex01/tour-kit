import { CopyButton } from '@/components/ui/copy-button'
import { ArrowRight, Terminal } from 'lucide-react'
import Link from 'next/link'

const installCmd = 'pnpm add @tour-kit/react'

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-16 sm:px-8 md:pb-28 md:pt-24 lg:px-12">
      {/* Colorful background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[var(--tk-primary)] opacity-[0.07] blur-[80px]" />
        <div className="absolute -right-32 top-20 h-80 w-80 rounded-full bg-amber-500 opacity-[0.06] blur-[80px]" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-500 opacity-[0.05] blur-[80px]" />
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          {/* Left — copy */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[var(--tk-primary)]/10 px-4 py-1.5 text-sm font-medium text-[var(--tk-primary)]">
              <span className="h-2 w-2 rounded-full bg-[var(--tk-primary)] animate-pulse" />
              Now in Beta
            </div>

            <h1 className="mb-6 text-[clamp(2.5rem,5.5vw,4.5rem)] font-extrabold leading-[1.08] tracking-tight text-fd-foreground">
              Guide users <span className="text-[var(--tk-primary)]">through</span> your app
            </h1>

            <p className="mb-10 max-w-lg text-lg leading-relaxed text-fd-muted-foreground">
              Headless hooks and composable components for product tours, onboarding flows, and
              contextual hints. Built for React. Works with shadcn/ui.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/docs/getting-started"
                className="inline-flex items-center gap-2.5 rounded-lg bg-[var(--tk-primary)] px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-[var(--tk-primary)]/20 transition-all hover:shadow-xl hover:shadow-[var(--tk-primary)]/30 hover:brightness-110"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="https://github.com/DomiDex/tour-kit"
                className="inline-flex items-center gap-2 rounded-lg border border-fd-border px-6 py-3.5 text-[15px] font-semibold text-fd-foreground transition-colors hover:bg-fd-muted"
              >
                View on GitHub
              </Link>
            </div>
          </div>

          {/* Right — install + stats */}
          <div className="flex flex-col gap-6">
            {/* Install block */}
            <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-card shadow-sm">
              <div className="flex items-center justify-between border-b border-fd-border px-4 py-2.5">
                <div className="flex items-center gap-2 text-fd-muted-foreground">
                  <Terminal className="h-4 w-4" />
                  <span className="text-xs font-medium">Terminal</span>
                </div>
                <CopyButton
                  text={installCmd}
                  className="text-fd-muted-foreground hover:text-fd-foreground"
                />
              </div>
              <div className="px-5 py-4 font-mono text-sm">
                <span className="select-none text-fd-muted-foreground">$ </span>
                <span className="text-fd-foreground">{installCmd}</span>
              </div>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: '< 8KB', label: 'Core gzipped', color: 'text-[var(--tk-primary)]' },
                { value: 'AA', label: 'WCAG 2.1', color: 'text-emerald-600 dark:text-emerald-400' },
                { value: '100%', label: 'TypeScript', color: 'text-amber-600 dark:text-amber-400' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-fd-border bg-fd-card px-4 py-5 shadow-sm"
                >
                  <span className={`text-xl font-bold ${stat.color}`}>{stat.value}</span>
                  <span className="text-xs font-medium text-fd-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

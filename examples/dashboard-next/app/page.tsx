import Link from 'next/link'
import { ArrowRight, Check, Layers, Shield, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: Layers,
    title: 'Every tool in one place',
    description: 'Projects, kanban, team, and notifications in a single opinionated workspace.',
  },
  {
    icon: Zap,
    title: 'Guided onboarding',
    description: 'Tours, hints, and checklists meet teammates exactly where they are.',
  },
  {
    icon: Shield,
    title: 'Designed for trust',
    description: 'Fine-grained roles, audit logs, and SSO on every plan.',
  },
]

export default function LandingPage() {
  return (
    <div className="relative flex min-h-svh flex-col bg-gradient-to-b from-background via-background to-muted/40">
      {/* decorative background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,theme(colors.primary/15),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.border/40)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.border/40)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <header className="flex h-16 items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-sm">
            S
          </div>
          <span className="text-base font-semibold tracking-tight">Stacks</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#trust" className="hover:text-foreground">Trust</a>
          <Link href="/dashboard" className="hover:text-foreground">Live demo</Link>
        </nav>
        <Button render={<Link href="/login">Sign in</Link>} variant="outline" size="sm" />
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-6 py-20 text-center md:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Now in beta — every @tour-kit/* package wired up
          </span>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            The team workspace that actually{' '}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              onboards your team
            </span>
          </h1>
          <p className="max-w-xl text-balance text-muted-foreground sm:text-lg">
            Stacks is the opinionated collaboration layer for product teams — with product tours,
            in-app help, and AI assistance built in.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button render={<Link href="/login">Sign in to demo<ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>} />
            <Button render={<Link href="/dashboard">Skip to dashboard</Link>} variant="outline" />
          </div>

          {/* product preview — a mock dashboard card */}
          <div className="relative mt-8 w-full max-w-4xl">
            <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[28px] bg-gradient-to-b from-primary/20 to-transparent blur-2xl" />
            <div className="overflow-hidden rounded-xl border bg-card shadow-2xl ring-1 ring-foreground/5">
              <div className="flex h-9 items-center gap-1.5 border-b bg-muted/50 px-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                <span className="ml-3 text-[11px] text-muted-foreground">stacks.app / dashboard</span>
              </div>
              <div className="grid grid-cols-4 gap-0 text-left">
                <aside className="col-span-1 space-y-1 border-r bg-muted/30 p-3 text-xs">
                  {['Overview', 'Projects', 'Team', 'Settings', 'Help'].map((label, i) => (
                    <div
                      key={label}
                      className={`rounded-md px-2 py-1.5 ${i === 0 ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground'}`}
                    >
                      {label}
                    </div>
                  ))}
                </aside>
                <div className="col-span-3 space-y-3 p-4">
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { v: 4, l: 'Projects' },
                      { v: 32, l: 'Tasks' },
                      { v: 6, l: 'Online' },
                      { v: 18, l: 'Done/wk' },
                    ].map((s) => (
                      <div key={s.l} className="rounded-lg border bg-background p-2">
                        <div className="text-xs text-muted-foreground">{s.l}</div>
                        <div className="text-lg font-semibold">{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="h-20 rounded-lg border bg-gradient-to-br from-muted/40 to-background" />
                  <div className="h-16 rounded-lg border bg-gradient-to-br from-muted/40 to-background" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-5xl px-6 pb-16">
          <div className="grid gap-4 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="text-left transition hover:shadow-md">
                <CardHeader>
                  <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section id="trust" className="mx-auto mb-20 w-full max-w-4xl px-6">
          <div className="rounded-xl border bg-card/50 p-6 backdrop-blur">
            <ul className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground sm:justify-between">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> SOC 2 Type II</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> SSO on every plan</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 99.99% uptime</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Audit logs</li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t px-6 py-8 text-center text-xs text-muted-foreground">
        © 2026 Stacks, Inc. — demo app, no real data.
      </footer>
    </div>
  )
}

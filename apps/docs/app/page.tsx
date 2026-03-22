import { CodePreview } from '@/components/landing/code-preview'
import { DemoTour } from '@/components/landing/demo-tour'
import { Features } from '@/components/landing/features'
import { Hero } from '@/components/landing/hero'
import { Packages } from '@/components/landing/packages'
import { baseOptions } from '@/lib/layout.shared'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="flex flex-1 flex-col">
        <Hero />
        <Features />
        <Packages />
        <CodePreview />
        <DemoTour />

        {/* Final CTA */}
        <section className="relative overflow-hidden border-t border-fd-border bg-fd-muted/30 px-6 py-20 sm:px-8 md:py-28 lg:px-12">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-[var(--tk-primary)] opacity-[0.06] blur-[80px]" />
            <div className="absolute -left-20 top-0 h-48 w-48 rounded-full bg-amber-500 opacity-[0.05] blur-[80px]" />
          </div>
          <div className="mx-auto max-w-6xl text-center">
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-fd-foreground sm:text-4xl">
              Ready to build?
            </h2>
            <p className="mx-auto mb-8 max-w-md text-lg text-fd-muted-foreground">
              Get your first product tour running in under five minutes.
            </p>
            <Link
              href="/docs/getting-started"
              className="inline-flex items-center gap-2.5 rounded-lg bg-[var(--tk-primary)] px-8 py-4 text-[15px] font-semibold text-white shadow-lg shadow-[var(--tk-primary)]/20 transition-all hover:shadow-xl hover:shadow-[var(--tk-primary)]/30 hover:brightness-110"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </HomeLayout>
  )
}

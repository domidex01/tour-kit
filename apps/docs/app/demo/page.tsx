import type { Metadata } from 'next'
import Link from 'next/link'
import { DemoClient } from './demo-client'

export const metadata: Metadata = {
  title: 'Live Demo — Interactive Product Tour Playground',
  description:
    'Try Tour Kit in your browser. A live, interactive product tour over a mock SaaS dashboard — no signup, no install. Built with @tour-kit/react and @tour-kit/hints.',
  alternates: { canonical: '/demo' },
  openGraph: {
    title: 'Tour Kit — Live Interactive Demo',
    description:
      'Click through a working product tour built with Tour Kit. Headless React, WCAG 2.1 AA, MIT-licensed core.',
    url: '/demo',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tour Kit — Live Interactive Demo',
    description: 'Try a working product tour built with Tour Kit, in your browser.',
  },
}

export default function DemoPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <header className="mb-8 space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-tk-secondary">Live demo</p>
        <h1 className="text-3xl font-bold tracking-tight text-tk-on-surface sm:text-4xl">
          Try Tour Kit in your browser
        </h1>
        <p className="max-w-2xl text-tk-on-surface-variant">
          A working product tour over a mock SaaS dashboard. Click{' '}
          <strong className="text-tk-on-surface">Start interactive tour</strong>, then use{' '}
          <kbd className="rounded border border-tk-outline-variant bg-tk-container px-1.5 py-0.5 text-xs">
            Tab
          </kbd>
          ,{' '}
          <kbd className="rounded border border-tk-outline-variant bg-tk-container px-1.5 py-0.5 text-xs">
            Shift+Tab
          </kbd>
          , and{' '}
          <kbd className="rounded border border-tk-outline-variant bg-tk-container px-1.5 py-0.5 text-xs">
            Esc
          </kbd>{' '}
          to verify focus trap and keyboard navigation.
        </p>
      </header>

      <DemoClient />

      <section aria-labelledby="next-steps" className="mt-12 grid gap-4 sm:grid-cols-2">
        <Link
          href="/docs/getting-started/installation"
          className="block rounded-xl border border-tk-outline-variant bg-tk-surface p-5 transition hover:border-tk-primary"
        >
          <h2 id="next-steps" className="font-semibold text-tk-on-surface">
            Install Tour Kit
          </h2>
          <p className="mt-1 text-sm text-tk-on-surface-variant">
            <code className="rounded bg-tk-container px-1.5 py-0.5 text-xs">
              pnpm add @tour-kit/core @tour-kit/react
            </code>
            <br />
            Read the 2-minute quickstart →
          </p>
        </Link>
        <Link
          href="/docs"
          className="block rounded-xl border border-tk-outline-variant bg-tk-surface p-5 transition hover:border-tk-primary"
        >
          <h2 className="font-semibold text-tk-on-surface">Read the docs</h2>
          <p className="mt-1 text-sm text-tk-on-surface-variant">
            Components, hooks, headless variants, router adapters, and more →
          </p>
        </Link>
      </section>
    </main>
  )
}

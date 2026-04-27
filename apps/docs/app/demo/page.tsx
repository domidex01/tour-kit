import { Footer } from '@/components/landing/footer'
import { baseOptions } from '@/lib/layout.shared'
import { BreadcrumbJsonLd, FAQJsonLd, SoftwareSourceCodeJsonLd } from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'
import Link from 'next/link'
import { DemoClient } from './demo-client'

const SITE_URL = 'https://usertourkit.com'
const DEMO_TITLE = 'Live Demo — Interactive Product Tour Playground'
const DEMO_DESCRIPTION =
  'Try Tour Kit in your browser. Click through a working product tour over a mock SaaS dashboard with persistent hint beacons, focus trap, and full keyboard navigation. No signup, no install — built with @tour-kit/react and @tour-kit/hints.'
const DEMO_OG_IMAGE = `/api/og?title=${encodeURIComponent('Live Demo')}&subtitle=${encodeURIComponent('Interactive product tour playground')}&category=DEMO`

export const metadata: Metadata = {
  title: DEMO_TITLE,
  description: DEMO_DESCRIPTION,
  alternates: { canonical: '/demo' },
  keywords: [
    'react product tour demo',
    'product tour playground',
    'interactive onboarding demo',
    'react onboarding library demo',
    'shadcn product tour example',
    'headless product tour',
    'react walkthrough demo',
    'tour kit demo',
  ],
  openGraph: {
    title: 'Tour Kit — Live Interactive Demo',
    description:
      'Click through a working product tour built with Tour Kit. Headless React, WCAG 2.1 AA, MIT-licensed core.',
    url: '/demo',
    type: 'website',
    siteName: 'userTourKit',
    images: [{ url: DEMO_OG_IMAGE, width: 1200, height: 630, alt: 'Tour Kit live demo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tour Kit — Live Interactive Demo',
    description: 'Try a working product tour built with Tour Kit, in your browser.',
    images: [DEMO_OG_IMAGE],
  },
}

const FAQS = [
  {
    question: 'How do I install Tour Kit after trying the demo?',
    answer:
      'Run `pnpm add @tour-kit/core @tour-kit/react` (npm install and bun add work too). The free MIT-licensed core requires only React 18 or 19 and Node 18+. Add @tour-kit/hints for the persistent beacon shown in the demo.',
  },
  {
    question: 'Does Tour Kit work with Next.js, Remix, Vite, or React Router?',
    answer:
      'Yes. Tour Kit ships first-class router adapters for Next.js (App Router and Pages Router) and React Router v6/v7. For Vite, Remix, Astro, and plain React, the generic useTour API works out of the box — no adapter required.',
  },
  {
    question: 'Is the demo accessible? What about keyboard navigation?',
    answer:
      'The TourCard implements WCAG 2.1 AA: focus trap (Tab and Shift+Tab cycle inside the card), Escape to close, Enter to advance, ARIA live regions for step announcements, and prefers-reduced-motion support. Try it on the demo page above.',
  },
  {
    question: 'Is the demo using paid features?',
    answer:
      'No. The demo uses only the free MIT-licensed packages: @tour-kit/core, @tour-kit/react, and @tour-kit/hints. Pro features (checklists, announcements, surveys, adoption tracking, analytics, AI chat, media embeds, scheduling) are documented separately and require a one-time license.',
  },
]

function WebPageJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${SITE_URL}/demo#webpage`,
    url: `${SITE_URL}/demo`,
    name: DEMO_TITLE,
    description: DEMO_DESCRIPTION,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${SITE_URL}${DEMO_OG_IMAGE}`,
    },
    breadcrumb: { '@id': `${SITE_URL}/demo#breadcrumb` },
    mainContentOfPage: {
      '@type': 'WebPageElement',
      cssSelector: '#main-content',
    },
    significantLink: [
      `${SITE_URL}/docs/getting-started/installation`,
      `${SITE_URL}/docs`,
      `${SITE_URL}/pricing`,
      `${SITE_URL}/compare`,
    ],
    about: { '@id': `${SITE_URL}/#software` },
  }
  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires innerHTML
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

export default function DemoPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <WebPageJsonLd />
      <BreadcrumbJsonLd
        pageUrl="/demo"
        items={[
          { name: 'Home', url: '/' },
          { name: 'Live Demo', url: '/demo' },
        ]}
      />
      <SoftwareSourceCodeJsonLd
        title="Tour Kit quickstart — 4-step product tour"
        description="Working source for a 4-step Tour Kit product tour over a mock SaaS dashboard, including a persistent Hint beacon. Demonstrates the @tour-kit/react and @tour-kit/hints public API."
        url="/demo"
        programmingLanguage="TypeScript"
        runtimePlatform="React 18+"
      />
      <FAQJsonLd items={FAQS.map((f) => ({ question: f.question, answer: f.answer }))} />

      <main id="main-content" className="flex flex-1 flex-col">
        <header className="px-4 pt-20 pb-8 sm:px-6 md:pt-28 lg:px-12">
          <div className="mx-auto max-w-5xl space-y-3">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tk-primary)]">
              Live demo
            </p>
            <h1 className="text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
              Try Tour Kit in your browser
            </h1>
            <p className="max-w-2xl text-[16px] leading-[1.6] text-fd-muted-foreground">
              A working React product tour over a mock SaaS dashboard. Click{' '}
              <strong className="text-fd-foreground">Start interactive tour</strong>, then use{' '}
              <kbd className="rounded border border-fd-border bg-fd-muted px-1.5 py-0.5 text-xs">
                Tab
              </kbd>
              ,{' '}
              <kbd className="rounded border border-fd-border bg-fd-muted px-1.5 py-0.5 text-xs">
                Shift+Tab
              </kbd>
              , and{' '}
              <kbd className="rounded border border-fd-border bg-fd-muted px-1.5 py-0.5 text-xs">
                Esc
              </kbd>{' '}
              to verify focus trap and keyboard navigation. The demo is built entirely with the free
              MIT-licensed packages — no signup, no install, no paid tier.
            </p>
          </div>
        </header>

        <section aria-labelledby="playground-heading" className="px-4 pb-12 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <h2 id="playground-heading" className="sr-only">
              Interactive playground
            </h2>
            <DemoClient />
          </div>
        </section>

        <section
          aria-labelledby="features-heading"
          className="border-t border-fd-border bg-fd-card/30 px-4 py-12 sm:px-6 lg:px-12"
        >
          <div className="mx-auto max-w-5xl">
            <h2
              id="features-heading"
              className="text-2xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-3xl"
            >
              What this demo shows
            </h2>
            <p className="mt-2 max-w-2xl text-fd-muted-foreground">
              Each step exercises a different Tour Kit primitive. The same components ship in the
              published npm packages — copy the source from the demo and you have a working tour in
              your own app in under two minutes.
            </p>
            <dl className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-fd-foreground">
                  Multi-step tours with floating-ui positioning
                </dt>
                <dd className="mt-1 text-sm text-fd-muted-foreground">
                  The 4-step tour uses <code>{'<Tour>'}</code> and <code>{'<TourStep>'}</code> from{' '}
                  <code>@tour-kit/react</code>. Cards anchor to any DOM node via CSS selector or
                  React ref and reposition on scroll, resize, and layout shifts.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-fd-foreground">Persistent hint beacons</dt>
                <dd className="mt-1 text-sm text-fd-muted-foreground">
                  The pulsing dot on the Churn metric is a <code>{'<Hint>'}</code> from{' '}
                  <code>@tour-kit/hints</code>. Hints survive across sessions when persistence is
                  enabled and dismiss independently of the tour flow.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-fd-foreground">
                  Focus trap, keyboard nav, ARIA live regions
                </dt>
                <dd className="mt-1 text-sm text-fd-muted-foreground">
                  Every TourCard implements WCAG 2.1 AA — Tab and Shift+Tab cycle inside the card,
                  Escape closes the tour, and step changes announce via <code>aria-live</code> for
                  screen readers.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-fd-foreground">
                  Headless variants for full markup control
                </dt>
                <dd className="mt-1 text-sm text-fd-muted-foreground">
                  Prefer to render your own card? <code>TourCardHeadless</code> exposes step state
                  via render props so you keep 100% of the styling and DOM. The styled defaults
                  shown here are opt-in.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section aria-labelledby="next-steps-heading" className="px-4 py-12 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <h2
              id="next-steps-heading"
              className="text-2xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-3xl"
            >
              Next steps
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/docs/getting-started/installation"
                className="block rounded-xl border border-fd-border bg-fd-card p-5 transition hover:border-[var(--tk-primary)]"
              >
                <h3 className="font-semibold text-fd-foreground">Install Tour Kit</h3>
                <p className="mt-1 text-sm text-fd-muted-foreground">
                  <code>pnpm add @tour-kit/core @tour-kit/react</code> — read the 2-minute
                  quickstart.
                </p>
              </Link>
              <Link
                href="/docs"
                className="block rounded-xl border border-fd-border bg-fd-card p-5 transition hover:border-[var(--tk-primary)]"
              >
                <h3 className="font-semibold text-fd-foreground">Read the docs</h3>
                <p className="mt-1 text-sm text-fd-muted-foreground">
                  Components, hooks, headless variants, router adapters, and recipes.
                </p>
              </Link>
              <Link
                href="/compare"
                className="block rounded-xl border border-fd-border bg-fd-card p-5 transition hover:border-[var(--tk-primary)]"
              >
                <h3 className="font-semibold text-fd-foreground">Compare alternatives</h3>
                <p className="mt-1 text-sm text-fd-muted-foreground">
                  Side-by-side with React Joyride, Shepherd, Driver.js, Intro.js, and more.
                </p>
              </Link>
              <Link
                href="/pricing"
                className="block rounded-xl border border-fd-border bg-fd-card p-5 transition hover:border-[var(--tk-primary)]"
              >
                <h3 className="font-semibold text-fd-foreground">Unlock Pro features</h3>
                <p className="mt-1 text-sm text-fd-muted-foreground">
                  Checklists, announcements, surveys, AI chat, and analytics — one-time $99.
                </p>
              </Link>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="faq-heading"
          className="border-t border-fd-border px-4 py-12 sm:px-6 lg:px-12"
        >
          <div className="mx-auto max-w-3xl">
            <h2
              id="faq-heading"
              className="text-2xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-3xl"
            >
              Frequently asked questions
            </h2>
            <dl className="mt-8 space-y-6">
              {FAQS.map((faq) => (
                <div key={faq.question}>
                  <dt className="font-semibold text-fd-foreground">{faq.question}</dt>
                  <dd className="mt-2 text-fd-muted-foreground">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <Footer />
    </HomeLayout>
  )
}

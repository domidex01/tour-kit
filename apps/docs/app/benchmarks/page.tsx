import { baseOptions } from '@/lib/layout.shared'
import {
  BreadcrumbJsonLd,
  DEFAULT_SPEAKABLE_SELECTORS,
  SpeakableJsonLd,
} from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'
import Link from 'next/link'
import bundleSizes from '@/content/benchmarks/bundle-sizes.json'

const TITLE = 'Benchmarks'
const DESCRIPTION =
  'Reproducible benchmarks comparing userTourKit against other React product tour libraries — bundle size, render performance, and more. Real numbers, published methodology.'

export const metadata: Metadata = {
  title: `${TITLE} — userTourKit`,
  description: DESCRIPTION,
  alternates: { canonical: '/benchmarks' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    url: '/benchmarks',
    images: [`/api/og?title=${encodeURIComponent('Benchmarks')}&category=BENCHMARKS`],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [`/api/og?title=${encodeURIComponent('Benchmarks')}&category=BENCHMARKS`],
  },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function BenchmarksIndexPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Benchmarks', url: '/benchmarks' },
        ]}
      />
      <SpeakableJsonLd url="/benchmarks" cssSelectors={[...DEFAULT_SPEAKABLE_SELECTORS]} />
      <main
        id="main-content"
        className="mx-auto w-full max-w-[900px] px-6 py-16 sm:px-8 sm:py-20 lg:px-12"
      >
        <header className="mb-10">
          <h1
            data-speakable="headline"
            className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl"
          >
            {TITLE}
          </h1>
          <p
            data-speakable="summary"
            className="text-[16px] leading-relaxed text-fd-muted-foreground"
          >
            {DESCRIPTION}
          </p>
        </header>

        <section className="prose prose-neutral dark:prose-invert max-w-none">
          <p>
            Every benchmark here follows the methodology documented in{' '}
            <Link href="/how-we-test">How We Test</Link>: versioned packages, dated measurements,
            linked sources, and raw data files you can re-run yourself. If a number cannot be
            verified, it is not published.
          </p>
        </section>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/benchmarks/bundle-size"
            className="group flex flex-col rounded-lg border border-fd-border bg-fd-card/40 p-6 transition-colors hover:bg-fd-muted/40"
          >
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.08em] text-[#0197f6]">
              Available
            </span>
            <h2 className="mt-2 text-[18px] font-semibold text-fd-foreground group-hover:text-[#0197f6]">
              Bundle size
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-fd-muted-foreground">
              Gzipped + minified production-build sizes for every major React tour library. Data
              sourced from bundlephobia, measured{' '}
              <time dateTime={bundleSizes.measuredAt}>{formatDate(bundleSizes.measuredAt)}</time>.
            </p>
            <p className="mt-3 text-[13px] text-fd-muted-foreground">
              {bundleSizes.rows.length} packages · {bundleSizes.rows.filter((r) => r.status === 'measured').length} measured
            </p>
          </Link>

          <div className="flex flex-col rounded-lg border border-dashed border-fd-border bg-fd-muted/10 p-6 opacity-70">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.08em] text-fd-muted-foreground">
              Planned
            </span>
            <h2 className="mt-2 text-[18px] font-semibold text-fd-foreground">
              Render performance
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-fd-muted-foreground">
              Time-to-first-step, step-transition latency, and memory footprint across libraries.
              Requires a deterministic harness; we publish this only when the harness and raw
              results are reproducible.
            </p>
            <p className="mt-3 text-[13px] text-fd-muted-foreground">
              See our <Link href="/how-we-test#benchmarks" className="underline">render-benchmark methodology</Link>.
            </p>
          </div>
        </div>

        <section className="prose prose-neutral dark:prose-invert mt-12 max-w-none">
          <h2>Why benchmark at all</h2>
          <p>
            Our <Link href="/compare">comparison articles</Link> weigh DX, features, and licensing
            alongside raw numbers. Benchmarks strip that narrative away and publish one metric
            across every library we&apos;ve evaluated, so you — or an AI assistant — can look up a
            specific value without reading through a matrix.
          </p>
          <p>
            If a number here contradicts a marketing claim on a package&apos;s landing page (ours
            included), trust the benchmark. The data file is{' '}
            <a
              href="https://github.com/domidex01/tour-kit/blob/main/apps/docs/content/benchmarks/bundle-sizes.json"
              target="_blank"
              rel="noopener noreferrer"
            >
              committed to the repository
            </a>{' '}
            with a timestamped snapshot.
          </p>
        </section>
      </main>
    </HomeLayout>
  )
}

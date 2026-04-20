import { baseOptions } from '@/lib/layout.shared'
import {
  BreadcrumbJsonLd,
  DEFAULT_SPEAKABLE_SELECTORS,
  DatasetJsonLd,
  SpeakableJsonLd,
} from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'
import Link from 'next/link'
import bundleSizesRaw from '@/content/benchmarks/bundle-sizes.json'

interface BundleSizeRow {
  name: string
  label: string
  homepage: string
  isOurs?: boolean
  status: 'measured' | 'unavailable'
  version?: string
  minifiedBytes?: number
  gzipBytes?: number
  dependencyCount?: number
  error?: string
  sourceUrl: string
}

interface BundleSizeSnapshot {
  measuredAt: string
  methodology: string
  rows: BundleSizeRow[]
}

const bundleSizes = bundleSizesRaw as BundleSizeSnapshot

const TITLE = 'React tour library bundle sizes'
const PAGE_DESCRIPTION =
  'Gzipped and minified production-build sizes for every major React product tour library — userTourKit, React Joyride, Shepherd.js, Driver.js, Intro.js, Onborda, and Reactour. Sourced from bundlephobia with a timestamped snapshot.'

export const metadata: Metadata = {
  title: `${TITLE} — userTourKit benchmarks`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/benchmarks/bundle-size' },
  openGraph: {
    title: TITLE,
    description: PAGE_DESCRIPTION,
    type: 'article',
    url: '/benchmarks/bundle-size',
    images: [`/api/og?title=${encodeURIComponent('Bundle size')}&category=BENCHMARK`],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: PAGE_DESCRIPTION,
    images: [`/api/og?title=${encodeURIComponent('Bundle size')}&category=BENCHMARK`],
  },
}

function formatBytes(bytes: number | undefined): string {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  return kb >= 100 ? `${Math.round(kb)} KB` : `${kb.toFixed(1)} KB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function BundleSizeBenchmarkPage() {
  const measuredRows = bundleSizes.rows.filter((r) => r.status === 'measured')
  const unavailableRows = bundleSizes.rows.filter((r) => r.status === 'unavailable')
  const sortedByGzip = [...measuredRows].sort(
    (a, b) => (a.gzipBytes ?? Infinity) - (b.gzipBytes ?? Infinity),
  )
  const measuredDate = formatDate(bundleSizes.measuredAt)
  const smallest = sortedByGzip[0]
  const largest = sortedByGzip[sortedByGzip.length - 1]

  return (
    <HomeLayout {...baseOptions()}>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Benchmarks', url: '/benchmarks' },
          { name: 'Bundle size', url: '/benchmarks/bundle-size' },
        ]}
      />
      <SpeakableJsonLd
        url="/benchmarks/bundle-size"
        cssSelectors={[...DEFAULT_SPEAKABLE_SELECTORS]}
      />
      <DatasetJsonLd
        name={TITLE}
        description={PAGE_DESCRIPTION}
        url="/benchmarks/bundle-size"
        dateModified={bundleSizes.measuredAt}
        measurementMethod="/how-we-test#bundle-size"
        keywords={[
          'bundle size',
          'react tour library',
          'product tour bundle',
          'react onboarding library size',
          'javascript bundle comparison',
        ]}
        variables={[
          {
            name: 'Gzipped size',
            unitText: 'B',
            description: 'Gzipped production-build size of the package default export.',
          },
          {
            name: 'Minified size',
            unitText: 'B',
            description: 'Minified (but un-gzipped) production-build size.',
          },
          {
            name: 'Dependency count',
            unitText: 'count',
            description: 'Transitive dependency count reported by bundlephobia.',
          },
          {
            name: 'Package version',
            description: 'npm version measured.',
          },
        ]}
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-[980px] px-6 py-16 sm:px-8 sm:py-20 lg:px-12"
      >
        <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-fd-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-fd-foreground">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/benchmarks" className="hover:text-fd-foreground">
                Benchmarks
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-fd-foreground">Bundle size</li>
          </ol>
        </nav>

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
            {PAGE_DESCRIPTION}
          </p>
          <p className="mt-3 text-[13px] text-fd-muted-foreground">
            Measured <time dateTime={bundleSizes.measuredAt}>{measuredDate}</time> ·{' '}
            {measuredRows.length} packages ·{' '}
            <Link href="/how-we-test#bundle-size" className="underline">
              methodology
            </Link>
          </p>
        </header>

        {smallest && largest && (
          <section className="mb-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-fd-border bg-fd-card/40 p-5">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-fd-muted-foreground">
                Smallest
              </p>
              <p className="mt-2 text-[20px] font-semibold text-fd-foreground">
                {smallest.label}
              </p>
              <p className="text-[13px] text-fd-muted-foreground">
                {formatBytes(smallest.gzipBytes)} gzipped · v{smallest.version}
              </p>
            </div>
            <div className="rounded-lg border border-fd-border bg-fd-card/40 p-5">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-fd-muted-foreground">
                Largest
              </p>
              <p className="mt-2 text-[20px] font-semibold text-fd-foreground">
                {largest.label}
              </p>
              <p className="text-[13px] text-fd-muted-foreground">
                {formatBytes(largest.gzipBytes)} gzipped · v{largest.version}
              </p>
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-4 text-[20px] font-semibold text-fd-foreground">
            Sorted by gzipped size
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-fd-border bg-fd-muted/30 text-left">
                  <th className="px-3 py-2 font-semibold">Package</th>
                  <th className="px-3 py-2 text-right font-semibold">Gzipped</th>
                  <th className="px-3 py-2 text-right font-semibold">Minified</th>
                  <th className="px-3 py-2 text-right font-semibold">Deps</th>
                  <th className="px-3 py-2 font-semibold">Version</th>
                  <th className="px-3 py-2 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody>
                {sortedByGzip.map((r) => (
                  <tr
                    key={r.name}
                    className={`border-b border-fd-border/60 ${r.isOurs ? 'bg-[#0197f6]/5' : ''}`}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {r.isOurs && (
                          <span
                            className="rounded bg-[#0197f6]/15 px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#0197f6]"
                            title="userTourKit package"
                          >
                            ours
                          </span>
                        )}
                        <a
                          href={r.homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-fd-foreground hover:underline"
                        >
                          {r.label}
                        </a>
                      </div>
                      <code className="text-[11px] text-fd-muted-foreground">{r.name}</code>
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-fd-foreground">
                      {formatBytes(r.gzipBytes)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-fd-muted-foreground">
                      {formatBytes(r.minifiedBytes)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-fd-muted-foreground">
                      {r.dependencyCount ?? '—'}
                    </td>
                    <td className="px-3 py-2 font-mono text-[12px] text-fd-muted-foreground">
                      {r.version ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      <a
                        href={r.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] text-fd-muted-foreground underline hover:text-fd-foreground"
                      >
                        bundlephobia
                      </a>
                    </td>
                  </tr>
                ))}
                {unavailableRows.map((r) => (
                  <tr key={r.name} className="border-b border-fd-border/60 text-fd-muted-foreground">
                    <td className="px-3 py-2">
                      <a
                        href={r.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline"
                      >
                        {r.label}
                      </a>
                      <br />
                      <code className="text-[11px]">{r.name}</code>
                    </td>
                    <td colSpan={4} className="px-3 py-2 text-[13px] italic">
                      unavailable — {r.error}
                    </td>
                    <td className="px-3 py-2">
                      <a
                        href={r.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] underline hover:text-fd-foreground"
                      >
                        bundlephobia
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="prose prose-neutral dark:prose-invert mt-12 max-w-none">
          <h2>How these numbers were measured</h2>
          <p>
            Every row is pulled from{' '}
            <a href="https://bundlephobia.com/" target="_blank" rel="noopener noreferrer">
              bundlephobia.com
            </a>
            &apos;s public API via a script committed alongside this page (
            <a
              href="https://github.com/DomiDex/tour-kit/blob/main/apps/docs/scripts/fetch-bundle-sizes.ts"
              target="_blank"
              rel="noopener noreferrer"
            >
              <code>scripts/fetch-bundle-sizes.ts</code>
            </a>
            ). The raw JSON output is committed to the repository at{' '}
            <code>content/benchmarks/bundle-sizes.json</code> and re-fetched on a quarterly cadence.
            For the complete methodology — what counts as a bundle, how gzip is computed, and what
            we do when bundlephobia 404s a scoped package — see{' '}
            <Link href="/how-we-test#bundle-size">How We Test</Link>.
          </p>

          <h2>Caveats you should read</h2>
          <ul>
            <li>
              <strong>Full-package vs tree-shaken.</strong> Bundlephobia reports the default-export
              size. A package that&apos;s heavily tree-shaken in real usage (userTourKit/hints
              especially, which ships many independent primitives) can measure much higher here
              than the subset you actually import. When you care about your real bundle cost,
              measure your production build with <code>size-limit</code> or{' '}
              <code>next build --profile</code>, not this table.
            </li>
            <li>
              <strong>Peer dependencies.</strong> React and React DOM are standard peer deps and
              are excluded from every measurement — otherwise every library would show a false
              +42&nbsp;KB.
            </li>
            <li>
              <strong>Version drift.</strong> These numbers are frozen as of {measuredDate}.
              Competitor packages ship new versions frequently; if the table looks stale, the data
              file&apos;s <code>measuredAt</code> timestamp is authoritative.
            </li>
            <li>
              <strong>Feature parity is not equal.</strong> userTourKit and Shepherd.js include
              checklists, hints, analytics hooks, and announcement primitives in their builds.
              React Joyride is a single-purpose tour component. Compare features{' '}
              <em>and</em> size together — see our{' '}
              <Link href="/compare">comparison articles</Link> for per-competitor context.
            </li>
          </ul>

          <h2>What this means in practice</h2>
          <p>
            If shaving every kilobyte matters (landing pages, marketing sites, mobile-first
            B2C), the single-purpose libraries at the top of the table —{' '}
            {sortedByGzip
              .slice(0, 3)
              .map((r) => r.label)
              .join(', ')}
            &nbsp;— are the right starting point. If you need tours{' '}
            <em>plus</em> hints, checklists, announcements, and analytics in one install, the
            middle of the table (userTourKit, Shepherd.js) costs more but replaces multiple
            packages. When in doubt, run <Link href="/docs/getting-started">a proof-of-concept</Link>{' '}
            and measure your actual production build.
          </p>

          <h2>Related</h2>
          <ul>
            <li>
              <Link href="/how-we-test">How we test</Link> — the methodology this benchmark follows.
            </li>
            <li>
              <Link href="/editorial-policy">Editorial policy</Link> — why this page honestly lists
              our packages alongside competitors (including where our numbers look worse).
            </li>
            <li>
              <Link href="/compare">Head-to-head comparisons</Link> — bundle size in context of
              features, licensing, and DX.
            </li>
          </ul>
        </section>
      </main>
    </HomeLayout>
  )
}

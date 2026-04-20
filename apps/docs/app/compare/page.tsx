import { ArticleCard } from '@/components/article/article-card'
import { Footer } from '@/components/landing/footer'
import { getComparisonsByCategory, getPublishedComparisons } from '@/lib/comparisons'
import { baseOptions } from '@/lib/layout.shared'
import { BreadcrumbJsonLd, ItemListJsonLd, OrganizationJsonLd } from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'

const COMPARE_TITLE = 'Compare userTourKit — Side-by-Side Comparisons'
const COMPARE_DESC =
  'Compare userTourKit with Shepherd.js, React Joyride, Driver.js, Intro.js, Appcues, Pendo, WalkMe, and more. Side-by-side feature, pricing, and performance comparisons.'
const COMPARE_OG_IMAGE = `/api/og?title=${encodeURIComponent('Compare')}&category=COMPARE`

export const metadata: Metadata = {
  title: COMPARE_TITLE,
  description: COMPARE_DESC,
  alternates: { canonical: '/compare' },
  openGraph: {
    title: COMPARE_TITLE,
    description:
      'Compare userTourKit with popular product tour libraries and onboarding platforms. Features, pricing, bundle size, and accessibility compared.',
    type: 'website',
    url: '/compare',
    images: [COMPARE_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: COMPARE_TITLE,
    description: COMPARE_DESC,
    images: [COMPARE_OG_IMAGE],
  },
}

const openSource = getComparisonsByCategory('open-source')
const commercial = getComparisonsByCategory('commercial')
const platforms = getComparisonsByCategory('platform')

export default function CompareHub() {
  return (
    <HomeLayout {...baseOptions()}>
      <OrganizationJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Compare', url: '/compare' },
        ]}
      />
      <ItemListJsonLd
        name="userTourKit head-to-head comparisons"
        url="/compare"
        description="Side-by-side comparisons of userTourKit against every major React product tour library and SaaS onboarding platform."
        items={getPublishedComparisons().map((c) => ({
          url: `/compare/${c.slug}`,
          name: `userTourKit vs ${c.competitor}`,
        }))}
      />
      <main id="main-content" className="mx-auto w-full max-w-[1120px] px-6 py-16 sm:px-8 lg:px-12">
        <header className="mb-16 max-w-2xl">
          <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            userTourKit vs the rest
          </h1>
          <p className="text-[16px] leading-relaxed text-fd-muted-foreground">
            Honest, data-driven comparisons between userTourKit and every major product tour library
            and onboarding platform. Each page covers feature parity, gzipped bundle weight,
            accessibility (WCAG 2.1 focus management, keyboard nav, screen-reader support),
            license terms, framework fit, and the pricing model — so you can make the call that
            fits your stack and your team. Where it matters, we also walk through the migration
            path: API mappings, behavioral differences, and the gotchas that bite once you start
            replacing code in production. No marketing language — just the trade-offs that
            actually inform a tooling choice.
          </p>
        </header>

        {/* Open-source libraries */}
        <Section
          title="Open-source libraries"
          description="MIT, AGPL, and permissive-licensed tour libraries."
        >
          {openSource.map((c) => (
            <ArticleCard
              key={c.slug}
              title={`userTourKit vs ${c.competitor}`}
              description={c.description}
              href={`/compare/${c.slug}`}
              badge="Open Source"
            />
          ))}
        </Section>

        {/* Commercial tools */}
        <Section
          title="Commercial onboarding tools"
          description="SaaS platforms with no-code builders and hosted analytics."
        >
          {commercial.map((c) => (
            <ArticleCard
              key={c.slug}
              title={`userTourKit vs ${c.competitor}`}
              description={c.description}
              href={`/compare/${c.slug}`}
              badge="Commercial"
            />
          ))}
        </Section>

        {/* Open-source platforms */}
        {platforms.length > 0 && (
          <Section
            title="Open-source platforms"
            description="Self-hosted onboarding platforms with open-source cores."
          >
            {platforms.map((c) => (
              <ArticleCard
                key={c.slug}
                title={`userTourKit vs ${c.competitor}`}
                description={c.description}
                href={`/compare/${c.slug}`}
                badge="Platform"
              />
            ))}
          </Section>
        )}
      </main>
      <Footer />
    </HomeLayout>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-16">
      <h2 className="mb-2 text-xl font-bold text-fd-foreground">{title}</h2>
      <p className="mb-6 text-[14px] text-fd-muted-foreground">{description}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  )
}

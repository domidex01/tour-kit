import { ArticleCard } from '@/components/article/article-card'
import { Footer } from '@/components/landing/footer'
import { COMPARISONS, getComparisonsByCategory } from '@/lib/comparisons'
import { baseOptions } from '@/lib/layout.shared'
import { BreadcrumbJsonLd, OrganizationJsonLd } from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compare User Tour Kit — Side-by-Side Comparisons',
  description:
    'Compare User Tour Kit with Shepherd.js, React Joyride, Driver.js, Intro.js, Appcues, Pendo, WalkMe, and more. Side-by-side feature, pricing, and performance comparisons.',
  openGraph: {
    title: 'Compare User Tour Kit — Side-by-Side Comparisons',
    description:
      'Compare User Tour Kit with popular product tour libraries and onboarding platforms. Features, pricing, bundle size, and accessibility compared.',
    type: 'website',
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
      <main className="mx-auto w-full max-w-[1120px] px-6 py-16 sm:px-8 lg:px-12">
        <header className="mb-16 max-w-2xl">
          <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            User Tour Kit vs the rest
          </h1>
          <p className="text-[16px] leading-relaxed text-fd-muted-foreground">
            Honest, data-driven comparisons between User Tour Kit and every major product tour library and
            onboarding platform. We cover features, bundle size, accessibility, licensing, and
            pricing so you can make the right choice for your stack.
          </p>
        </header>

        {/* Open-source libraries */}
        <Section title="Open-source libraries" description="MIT, AGPL, and permissive-licensed tour libraries.">
          {openSource.map((c) => (
            <ArticleCard
              key={c.slug}
              title={`User Tour Kit vs ${c.competitor}`}
              description={c.description}
              href={`/compare/${c.slug}`}
              badge="Open Source"
            />
          ))}
        </Section>

        {/* Commercial tools */}
        <Section title="Commercial onboarding tools" description="SaaS platforms with no-code builders and hosted analytics.">
          {commercial.map((c) => (
            <ArticleCard
              key={c.slug}
              title={`User Tour Kit vs ${c.competitor}`}
              description={c.description}
              href={`/compare/${c.slug}`}
              badge="Commercial"
            />
          ))}
        </Section>

        {/* Open-source platforms */}
        {platforms.length > 0 && (
          <Section title="Open-source platforms" description="Self-hosted onboarding platforms with open-source cores.">
            {platforms.map((c) => (
              <ArticleCard
                key={c.slug}
                title={`User Tour Kit vs ${c.competitor}`}
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

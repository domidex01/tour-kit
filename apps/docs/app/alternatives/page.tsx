import { ArticleCard } from '@/components/article/article-card'
import { Footer } from '@/components/landing/footer'
import { getPublishedAlternatives } from '@/lib/comparisons'
import { baseOptions } from '@/lib/layout.shared'
import { BreadcrumbJsonLd, OrganizationJsonLd } from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Alternatives — userTourKit',
  description:
    'Find the best alternatives to Appcues, Pendo, WalkMe, Userpilot, UserGuiding, React Joyride, Shepherd.js, and more. Ranked by developers for developers.',
  openGraph: {
    title: 'Alternatives — userTourKit',
    description:
      'Find the best alternatives to popular onboarding tools and product tour libraries. Developer-focused rankings.',
    type: 'website',
  },
}

export default function AlternativesHub() {
  return (
    <HomeLayout {...baseOptions()}>
      <OrganizationJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Alternatives', url: '/alternatives' },
        ]}
      />
      <main className="mx-auto w-full max-w-[1120px] px-6 py-16 sm:px-8 lg:px-12">
        <header className="mb-16 max-w-2xl">
          <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            Alternatives to popular onboarding tools
          </h1>
          <p className="text-[16px] leading-relaxed text-fd-muted-foreground">
            Looking to switch from your current product tour or onboarding platform? We ranked the
            best alternatives for each tool based on developer experience, features, performance,
            licensing, and maintenance health.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {getPublishedAlternatives().map((alt) => (
            <ArticleCard
              key={alt.slug}
              title={`Best ${alt.competitor} Alternatives`}
              description={alt.description}
              href={`/alternatives/${alt.slug}`}
            />
          ))}
        </div>
      </main>
      <Footer />
    </HomeLayout>
  )
}

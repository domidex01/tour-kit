import { ArticleCard } from '@/components/article/article-card'
import { Footer } from '@/components/landing/footer'
import { getPublishedAlternatives } from '@/lib/comparisons'
import { baseOptions } from '@/lib/layout.shared'
import { BreadcrumbJsonLd, OrganizationJsonLd } from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'

const ALT_TITLE = 'Alternatives — userTourKit'
const ALT_DESC =
  'Find the best alternatives to Appcues, Pendo, WalkMe, Userpilot, UserGuiding, React Joyride, Shepherd.js, and more. Ranked by developers for developers.'
const ALT_OG_IMAGE = `/api/og?title=${encodeURIComponent('Alternatives')}&category=ALTERNATIVES`

export const metadata: Metadata = {
  title: ALT_TITLE,
  description: ALT_DESC,
  alternates: { canonical: '/alternatives' },
  openGraph: {
    title: ALT_TITLE,
    description:
      'Find the best alternatives to popular onboarding tools and product tour libraries. Developer-focused rankings.',
    type: 'website',
    url: '/alternatives',
    images: [ALT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: ALT_TITLE,
    description: ALT_DESC,
    images: [ALT_OG_IMAGE],
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
      <main id="main-content" className="mx-auto w-full max-w-[1120px] px-6 py-16 sm:px-8 lg:px-12">
        <header className="mb-16 max-w-2xl">
          <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            Alternatives to popular onboarding tools
          </h1>
          <p className="text-[16px] leading-relaxed text-fd-muted-foreground">
            Outgrew your current product tour or onboarding platform? Each roundup ranks the best
            alternatives for a specific tool — Appcues, Pendo, WalkMe, Userpilot, UserGuiding,
            React Joyride, Shepherd.js, Driver.js, Intro.js, and others — across developer
            experience, framework support, bundle size, accessibility, licensing, pricing, and
            project health (release cadence, open issues, maintainer responsiveness). We also flag
            the migration cost: API surface differences, behavioral gaps, and the migration
            patterns that have worked for teams who have already made the switch. Use these to
            shortlist three options worth a serious evaluation.
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

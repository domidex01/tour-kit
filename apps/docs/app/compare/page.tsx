import { ArticleCard } from '@/components/article/article-card'
import { Footer } from '@/components/landing/footer'
import { getComparisonsByCategory, getPublishedComparisons } from '@/lib/comparisons'
import { baseOptions } from '@/lib/layout.shared'
import {
  BreadcrumbJsonLd,
  FAQJsonLd,
  ItemListJsonLd,
  OrganizationJsonLd,
} from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'
import Link from 'next/link'

const COMPARE_TITLE = 'Compare userTourKit — Side-by-Side Comparisons'
const COMPARE_DESC =
  'Compare userTourKit with Shepherd.js, React Joyride, Driver.js, Intro.js, Appcues, Pendo, WalkMe, and more. Side-by-side feature, pricing, and performance comparisons.'
const COMPARE_OG_IMAGE = `/api/og?title=${encodeURIComponent('Compare')}&category=COMPARE`

const COMPARE_FAQS = [
  {
    question: 'How does userTourKit compare to React Joyride and Shepherd.js?',
    answer:
      'userTourKit is headless-first and ships under 8 KB for the core. React Joyride is the most established React-specific library but is heavier and uses its own UI runtime. Shepherd.js is framework-agnostic with strong popper-based positioning but no React-native primitives. See the head-to-head comparison pages for feature parity, bundle weight, and migration paths.',
  },
  {
    question: 'How does userTourKit compare to SaaS platforms like Appcues, Pendo, and WalkMe?',
    answer:
      'SaaS platforms ship a no-code builder, hosted analytics, and an account-level dashboard for non-engineers — at a monthly per-MAU price that typically lands between $300 and $2,000+ for small teams. userTourKit is a code-first React library: lower running cost (free MIT core or $99 one-time Pro), full control over rendering and data, but no no-code builder. The comparison pages map use cases to the right tool.',
  },
  {
    question: 'What methodology do these comparisons use?',
    answer:
      "Every feature claim is sourced from the competitor's current official docs (with version + access date footnoted), every bundle figure is measured from a published npm version with the same tooling on the same day, and every benchmark publishes its harness. The full methodology is documented at /how-we-test.",
  },
  {
    question: 'Are these comparisons biased? userTourKit is your own product.',
    answer:
      'Yes, we sell userTourKit Pro. Every comparison page brackets the bias in a labeled "From the authors" note so readers can weigh it. Comparison rows map to evidence URLs on the competitor site, and subjective claims are marked as opinion with concrete examples. See /editorial-policy for the full disclosure.',
  },
  {
    question: 'Which React product tour library should I pick?',
    answer:
      'If you need a no-code builder, hosted analytics, or non-engineer authoring: an SaaS platform. If you need full control, low cost, accessibility-first defaults, and shadcn/Radix composability: userTourKit. If you have an existing React Joyride or Shepherd.js integration that ships fine: keep it. Each comparison page includes a TL;DR recommendation in the first 200 words.',
  },
]

export const metadata: Metadata = {
  title: COMPARE_TITLE,
  description: COMPARE_DESC,
  keywords: [
    'tour kit comparisons',
    'react tour library comparison',
    'usertourkit vs alternatives',
    'product tour library comparison',
    'react joyride alternatives',
    'shepherd.js alternatives',
    'appcues alternatives',
    'pendo alternatives',
  ],
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
      <FAQJsonLd items={COMPARE_FAQS} />
      <main id="main-content" className="mx-auto w-full max-w-[1120px] px-6 py-16 sm:px-8 lg:px-12">
        <header className="mb-16 max-w-2xl">
          <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            userTourKit vs the rest
          </h1>
          <p className="text-[16px] leading-relaxed text-fd-muted-foreground">
            Honest, data-driven comparisons between userTourKit and every major product tour library
            and onboarding platform. Each page covers feature parity, gzipped bundle weight,
            accessibility (WCAG 2.1 focus management, keyboard nav, screen-reader support), license
            terms, framework fit, and the pricing model — so you can make the call that fits your
            stack and your team. Where it matters, we also walk through the migration path: API
            mappings, behavioral differences, and the gotchas that bite once you start replacing
            code in production. No marketing language — just the trade-offs that actually inform a
            tooling choice.
          </p>
          <p className="mt-3 text-[14px] text-fd-muted-foreground">
            See{' '}
            <Link
              href="/how-we-test"
              className="underline decoration-dotted underline-offset-4 hover:decoration-solid"
            >
              how we test
            </Link>{' '}
            for the methodology behind every benchmark and feature claim on these pages, and{' '}
            <Link
              href="/pricing"
              className="underline decoration-dotted underline-offset-4 hover:decoration-solid"
            >
              pricing
            </Link>{' '}
            for what the Free vs Pro split costs.
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

        <section aria-labelledby="compare-faq-heading" className="mt-8 max-w-3xl">
          <h2
            id="compare-faq-heading"
            className="mb-2 text-2xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-3xl"
          >
            Frequently asked questions
          </h2>
          <p className="mb-8 text-[14px] text-fd-muted-foreground">
            Methodology, bias disclosure, and when an SaaS platform beats a React library.
          </p>
          <dl className="space-y-6">
            {COMPARE_FAQS.map((faq) => (
              <div key={faq.question}>
                <dt className="font-semibold text-fd-foreground">{faq.question}</dt>
                <dd className="mt-2 text-fd-muted-foreground">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
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

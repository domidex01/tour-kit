import { ArticleCard } from '@/components/article/article-card'
import { getComparisonsByCategory } from '@/lib/comparisons'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const openSource = getComparisonsByCategory('open-source')
const commercial = getComparisonsByCategory('commercial')
const platforms = getComparisonsByCategory('platform')

export function CompareGrid() {
  const total = openSource.length + commercial.length + platforms.length
  if (total === 0) return null

  return (
    <section className="px-6 py-20 sm:px-8 md:py-28 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0197f6]">
            Compare
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            How Tour Kit compares
          </h2>
          <p className="text-[16px] leading-[1.6] text-fd-muted-foreground">
            Picking a tour library is a long-term decision. We&apos;ve published {total} detailed
            head-to-heads — bundle weight, accessibility, license terms, and migration paths —
            covering the open-source libraries and commercial platforms you&apos;re probably
            evaluating right now. No marketing language. Just the trade-offs that actually inform a
            tooling choice.
          </p>
        </div>

        {openSource.length > 0 && (
          <CompareSection
            title="Open-source libraries"
            description="MIT, AGPL, and permissive-licensed React tour libraries."
            items={openSource}
            badge="Open Source"
          />
        )}

        {commercial.length > 0 && (
          <CompareSection
            title="Commercial onboarding tools"
            description="SaaS platforms with hosted analytics and no-code builders."
            items={commercial}
            badge="Commercial"
          />
        )}

        {platforms.length > 0 && (
          <CompareSection
            title="Open-source platforms"
            description="Self-hosted onboarding platforms with open-source cores."
            items={platforms}
            badge="Platform"
          />
        )}

        <div className="mt-4">
          <Link
            href="/compare"
            className="group inline-flex items-center gap-1.5 font-mono text-[13px] font-semibold text-[#0197f6] underline underline-offset-4 transition-colors hover:opacity-80"
          >
            See all comparisons
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function CompareSection({
  title,
  description,
  items,
  badge,
}: {
  title: string
  description: string
  items: ReturnType<typeof getComparisonsByCategory>
  badge: string
}) {
  return (
    <section className="mb-12 last:mb-0">
      <h3 className="mb-2 text-lg font-bold text-fd-foreground">{title}</h3>
      <p className="mb-6 text-[14px] text-fd-muted-foreground">{description}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <ArticleCard
            key={c.slug}
            title={`Tour Kit vs ${c.competitor}`}
            description={c.description}
            href={`/compare/${c.slug}`}
            badge={badge}
          />
        ))}
      </div>
    </section>
  )
}

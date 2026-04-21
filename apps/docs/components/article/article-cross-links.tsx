import type { AlternativeMeta, BlogMeta, ComparisonMeta } from '@/lib/comparisons'
import Link from 'next/link'

/**
 * Underline style reused for every inline cross-link so the prose reads as continuous
 * copy and not a link dump. Keeps hover legibility high in both themes.
 */
const LINK_CLASS =
  'text-fd-foreground underline decoration-fd-border underline-offset-4 hover:decoration-fd-foreground'

interface CompareCrossLinksProps {
  /** Current comparison (excluded from sibling picks). */
  current: ComparisonMeta
  /** Up to 2 sibling comparisons surfaced as prose links. */
  siblings: ComparisonMeta[]
}

/**
 * Prose cross-link paragraph rendered in the body of every comparison article.
 *
 * Ensures every comparison has contextual internal links to (1) the comparison
 * pillar, (2) getting-started, (3) the core API docs, and (4) one or two
 * sibling comparisons — so it passes the cluster-density audit and carries
 * descriptive anchor text instead of generic "see also" dumps.
 */
export function CompareArticleCrossLinks({ current, siblings }: CompareCrossLinksProps) {
  const [first, second] = siblings
  return (
    <aside
      className="not-prose mt-10 rounded-lg border border-fd-border bg-fd-muted/20 p-5 text-[14px] leading-relaxed text-fd-muted-foreground"
      aria-label="Further reading"
    >
      <p className="mb-0">
        <strong className="text-fd-foreground">Further reading.</strong> For the broader landscape,
        see the{' '}
        <Link href="/blog/tour-kit-comparison-index" className={LINK_CLASS}>
          userTourKit comparison index
        </Link>{' '}
        — our pillar page covering every tour library we&apos;ve benchmarked. To get started with
        userTourKit itself, follow the{' '}
        <Link href="/docs/getting-started" className={LINK_CLASS}>
          getting started guide
        </Link>{' '}
        or jump straight to the{' '}
        <Link href="/docs/core" className={LINK_CLASS}>
          @tour-kit/core API reference
        </Link>
        {first && (
          <>
            . If you&apos;re weighing {current.competitor} against others, our{' '}
            <Link href={`/compare/${first.slug}`} className={LINK_CLASS}>
              userTourKit vs {first.competitor}
            </Link>{' '}
            comparison
            {second ? (
              <>
                {' '}
                and{' '}
                <Link href={`/compare/${second.slug}`} className={LINK_CLASS}>
                  userTourKit vs {second.competitor}
                </Link>{' '}
                cover adjacent trade-offs
              </>
            ) : (
              <> covers adjacent trade-offs</>
            )}
          </>
        )}
        .
      </p>
    </aside>
  )
}

/**
 * Editorial mapping from blog category → primary pillar post slug.
 *
 * The 9 pillar pages already exist in the blog (category: "Pillar Pages").
 * Every other category gets routed to the most topically adjacent pillar so
 * every under-linked spoke gains at least one prose link back to the right hub.
 */
const CATEGORY_TO_PILLAR: Record<string, { slug: string; anchorText: string } | undefined> = {
  'Build vs Buy': {
    slug: 'open-source-onboarding-stack',
    anchorText: 'the open-source onboarding stack',
  },
  Comparison: { slug: 'tour-kit-comparison-index', anchorText: 'the userTourKit comparison index' },
  Comparisons: {
    slug: 'tour-kit-comparison-index',
    anchorText: 'the userTourKit comparison index',
  },
  'Deep-Dives': {
    slug: 'headless-onboarding-explained',
    anchorText: 'headless onboarding explained',
  },
  'Deep Dives': {
    slug: 'headless-onboarding-explained',
    anchorText: 'headless onboarding explained',
  },
  GEO: { slug: 'tour-kit-documentation-hub', anchorText: 'the documentation hub' },
  Glossary: { slug: 'user-onboarding-handbook', anchorText: 'the user onboarding handbook' },
  Industry: { slug: 'user-onboarding-handbook', anchorText: 'the user onboarding handbook' },
  'Industry Guides': {
    slug: 'user-onboarding-handbook',
    anchorText: 'the user onboarding handbook',
  },
  Integrations: {
    slug: 'product-tour-best-practices-react',
    anchorText: 'React product tour best practices',
  },
  Listicle: {
    slug: 'onboarding-software-comparison-hub',
    anchorText: 'the onboarding software comparison hub',
  },
  Listicles: {
    slug: 'onboarding-software-comparison-hub',
    anchorText: 'the onboarding software comparison hub',
  },
  Metrics: { slug: 'onboarding-metrics-explained', anchorText: 'onboarding metrics explained' },
  'Metrics & Analytics': {
    slug: 'onboarding-metrics-explained',
    anchorText: 'onboarding metrics explained',
  },
  'Pillar Pages': { slug: 'tour-kit-documentation-hub', anchorText: 'the documentation hub' },
  'Thought Leadership': {
    slug: 'user-onboarding-handbook',
    anchorText: 'the user onboarding handbook',
  },
  Tutorial: {
    slug: 'product-tour-guide-2026',
    anchorText: 'the complete React product tour guide',
  },
  Tutorials: {
    slug: 'product-tour-guide-2026',
    anchorText: 'the complete React product tour guide',
  },
  'Use Cases': {
    slug: 'product-tour-best-practices-react',
    anchorText: 'React product tour best practices',
  },
}

interface BlogPostCrossLinksProps {
  current: BlogMeta
  /** Adjacent posts in the same category (2 preferred). */
  siblings: BlogMeta[]
}

/**
 * Prose cross-link block rendered at the bottom of every blog post body.
 *
 * Ensures every post — regardless of how thin its MDX links are — gains at
 * minimum: one link to its category's pillar, one link to getting-started,
 * and 1-2 sibling links in the same category. Prose paragraph, descriptive
 * anchor text, no "see also" dump.
 *
 * Pillar routing is intentional and editorial (see `CATEGORY_TO_PILLAR`).
 * For a post that IS itself a pillar, the pillar link is skipped to avoid a
 * self-link.
 */
export function BlogPostCrossLinks({ current, siblings }: BlogPostCrossLinksProps) {
  const pillar = CATEGORY_TO_PILLAR[current.category]
  const isOwnPillar = pillar?.slug === current.slug
  const [first, second] = siblings
  return (
    <aside
      className="not-prose mt-10 rounded-lg border border-fd-border bg-fd-muted/20 p-5 text-[14px] leading-relaxed text-fd-muted-foreground"
      aria-label="Further reading"
    >
      <p className="mb-0">
        <strong className="text-fd-foreground">Keep reading.</strong>{' '}
        {pillar && !isOwnPillar && (
          <>
            For the broader topic, our pillar article —{' '}
            <Link href={`/blog/${pillar.slug}`} className={LINK_CLASS}>
              {pillar.anchorText}
            </Link>{' '}
            — ties every post in this series together.{' '}
          </>
        )}
        {first && (
          <>
            If this was useful, read{' '}
            <Link href={`/blog/${first.slug}`} className={LINK_CLASS}>
              {first.title.replace(/["']/g, '')}
            </Link>
            {second ? (
              <>
                {' '}
                and{' '}
                <Link href={`/blog/${second.slug}`} className={LINK_CLASS}>
                  {second.title.replace(/["']/g, '')}
                </Link>{' '}
                next
              </>
            ) : (
              <> next</>
            )}
            .{' '}
          </>
        )}
        To try userTourKit on your own stack, start with the{' '}
        <Link href="/docs/getting-started" className={LINK_CLASS}>
          getting started guide
        </Link>{' '}
        or browse every head-to-head in the{' '}
        <Link href="/compare" className={LINK_CLASS}>
          comparisons index
        </Link>
        .
      </p>
    </aside>
  )
}

interface AlternativeCrossLinksProps {
  current: AlternativeMeta
  /** Matching head-to-head comparison (if the vs/ article exists). */
  vsComparison?: ComparisonMeta
  /** Up to 2 adjacent alternatives (other competitor alternatives pages). */
  adjacentAlternatives: AlternativeMeta[]
}

export function AlternativeArticleCrossLinks({
  current,
  vsComparison,
  adjacentAlternatives,
}: AlternativeCrossLinksProps) {
  const [first, second] = adjacentAlternatives
  return (
    <aside
      className="not-prose mt-10 rounded-lg border border-fd-border bg-fd-muted/20 p-5 text-[14px] leading-relaxed text-fd-muted-foreground"
      aria-label="Further reading"
    >
      <p className="mb-0">
        <strong className="text-fd-foreground">Further reading.</strong> Our onboarding pillar
        article,{' '}
        <Link href="/blog/onboarding-software-comparison-hub" className={LINK_CLASS}>
          the onboarding software comparison hub
        </Link>
        , groups every major category of tour and onboarding tool.{' '}
        {vsComparison && (
          <>
            For a direct head-to-head with {current.competitor}, read{' '}
            <Link href={`/compare/${vsComparison.slug}`} className={LINK_CLASS}>
              userTourKit vs {current.competitor}
            </Link>
            .{' '}
          </>
        )}
        To evaluate userTourKit on your own stack, start with the{' '}
        <Link href="/docs/getting-started" className={LINK_CLASS}>
          getting started guide
        </Link>
        {first && (
          <>
            , or explore alternatives to{' '}
            <Link href={`/alternatives/${first.slug}`} className={LINK_CLASS}>
              {first.competitor}
            </Link>
            {second && (
              <>
                {' '}
                and{' '}
                <Link href={`/alternatives/${second.slug}`} className={LINK_CLASS}>
                  {second.competitor}
                </Link>
              </>
            )}
          </>
        )}
        .
      </p>
    </aside>
  )
}

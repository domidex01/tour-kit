import type { ReactNode } from 'react'

const SITE_URL = 'https://usertourkit.com'
const SITE_LAUNCH_DATE = '2025-01-01T00:00:00.000Z'

// ── Types ──

interface TechArticleProps {
  title: string
  description: string
  url: string
  datePublished?: string
  dateModified?: string
  section?: string
}

interface FAQItem {
  question: string
  answer: string
}

interface SoftwareSourceCodeProps {
  title: string
  description: string
  url: string
  programmingLanguage: string
  runtimePlatform?: string
}

// ── Components ──

export function TechArticleJsonLd({
  title,
  description,
  url,
  datePublished,
  dateModified,
  section,
}: TechArticleProps): ReactNode {
  const resolvedPublished = datePublished ?? SITE_LAUNCH_DATE
  const resolvedModified = dateModified ?? resolvedPublished
  const data = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    url: `${SITE_URL}${url}`,
    datePublished: resolvedPublished,
    dateModified: resolvedModified,
    ...(section && { articleSection: section }),
    author: { '@id': `${SITE_URL}/about#person` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    isPartOf: {
      '@type': 'WebSite',
      name: 'userTourKit Documentation',
      url: `${SITE_URL}/docs`,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}${url}`,
    },
  }

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires innerHTML
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

interface ArticleMention {
  '@type': 'SoftwareApplication' | 'Organization'
  name: string
  sameAs: string
}

interface ArticleJsonLdProps {
  headline: string
  description: string
  url: string
  datePublished: string
  dateModified: string
  authorName?: string
  authorUrl?: string
  authorGithub?: string
  authorLinkedin?: string
  authorX?: string
  authorJobTitle?: string
  authorKnowsAbout?: string[]
  image?: string
  wordCount?: number
  articleSection?: string
  keywords?: string[]
  mentions?: ArticleMention[]
}

interface BreadcrumbItem {
  name: string
  url: string
}

interface GraphJsonLdProps {
  items: Record<string, unknown>[]
}

// ── Comparison / Article Schemas ──

const ORGANIZATION = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'userTourKit',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/logo.png`,
    width: 600,
    height: 60,
  },
  foundingDate: '2025',
  description:
    'Open-source headless React library for product tours, onboarding, and in-app messaging.',
}

export function ArticleJsonLd({
  headline,
  description,
  url,
  datePublished,
  dateModified,
  authorName = 'userTourKit Team',
  authorUrl,
  authorGithub,
  authorLinkedin,
  authorX,
  authorJobTitle,
  authorKnowsAbout,
  image,
  wordCount,
  articleSection,
  keywords,
  mentions,
}: ArticleJsonLdProps): ReactNode {
  const sameAs = [authorGithub, authorLinkedin, authorX].filter(Boolean)
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    url: url.startsWith('http') ? url : `${SITE_URL}${url}`,
    datePublished,
    dateModified,
    author: {
      '@type': 'Person',
      '@id': `${SITE_URL}/about#person`,
      name: authorName,
      ...(authorUrl && { url: authorUrl }),
      ...(sameAs.length > 0 && { sameAs }),
      ...(authorJobTitle && { jobTitle: authorJobTitle }),
      ...(authorKnowsAbout && authorKnowsAbout.length > 0 && { knowsAbout: authorKnowsAbout }),
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'userTourKit',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
        width: 600,
        height: 60,
      },
    },
    ...(image && { image }),
    ...(wordCount && { wordCount }),
    ...(articleSection && { articleSection }),
    ...(keywords && { keywords }),
    ...(mentions && mentions.length > 0 && { mentions }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url.startsWith('http') ? url : `${SITE_URL}${url}`,
    },
  }

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires innerHTML
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }): ReactNode {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  }

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires innerHTML
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

export function OrganizationJsonLd(): ReactNode {
  const data = {
    '@context': 'https://schema.org',
    ...ORGANIZATION,
    sameAs: [
      'https://github.com/domidex01/tour-kit',
      'https://www.npmjs.com/package/@tour-kit/core',
    ],
    publishingPrinciples: `${SITE_URL}/editorial-policy`,
    ethicsPolicy: `${SITE_URL}/editorial-policy#ethics`,
    correctionsPolicy: `${SITE_URL}/editorial-policy#corrections`,
    verificationFactCheckingPolicy: `${SITE_URL}/how-we-test`,
    founder: { '@id': `${SITE_URL}/about#person` },
  }

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires innerHTML
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

export function ProductJsonLd(): ReactNode {
  // Tour Kit is software, not a physical good. Using `Product` triggers
  // Google's Merchant listings validator (shippingDetails / hasMerchantReturnPolicy).
  // `SoftwareApplication` is the correct schema type for a digital library
  // and exempts us from those retail-product rules.
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'userTourKit',
    description:
      'Open-source headless React library for product tours, onboarding checklists, hints, announcements, analytics, and scheduling.',
    brand: { '@type': 'Brand', name: 'userTourKit' },
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    url: SITE_URL,
    image: `${SITE_URL}/images/tour-kit-og.png`,
    offers: [
      {
        '@type': 'Offer',
        name: 'userTourKit Free (MIT)',
        price: '0',
        priceCurrency: 'USD',
        description: 'Core library, React bindings, and hints package. MIT licensed.',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/pricing/`,
      },
      {
        '@type': 'Offer',
        name: 'userTourKit Pro',
        price: '99',
        priceCurrency: 'USD',
        description:
          'One-time purchase. Adds adoption tracking, analytics, announcements, checklists, media, scheduling, and AI chat.',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/pricing/`,
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '99',
          priceCurrency: 'USD',
          billingDuration: { '@type': 'Duration', name: 'Lifetime' },
        },
      },
    ],
    publisher: { '@id': `${SITE_URL}/#organization` },
  }

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires innerHTML
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

export function GraphJsonLd({ items }: GraphJsonLdProps): ReactNode {
  const data = {
    '@context': 'https://schema.org',
    '@graph': items,
  }

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires innerHTML
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

export function FAQJsonLd({ items }: { items: FAQItem[] }): ReactNode {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires innerHTML
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

export function SoftwareSourceCodeJsonLd({
  title,
  description,
  url,
  programmingLanguage,
  runtimePlatform,
}: SoftwareSourceCodeProps): ReactNode {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: title,
    description,
    url: `${SITE_URL}${url}`,
    programmingLanguage,
    ...(runtimePlatform && { runtimePlatform }),
    codeRepository: 'https://github.com/domidex01/tour-kit',
    license: 'https://opensource.org/licenses/MIT',
  }

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires innerHTML
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

// ── SoftwareApplication ──

interface SoftwareApplicationProps {
  name: string
  description: string
  /** Path appended to SITE_URL, e.g. "" for homepage or "/docs" */
  url?: string
  /** Defaults to "DeveloperApplication" */
  applicationCategory?: string
  softwareVersion?: string
}

export function SoftwareApplicationJsonLd({
  name,
  description,
  url = '',
  applicationCategory = 'DeveloperApplication',
  softwareVersion,
}: SoftwareApplicationProps): ReactNode {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    applicationCategory,
    operatingSystem: 'Any',
    description,
    url: `${SITE_URL}${url}`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    ...(softwareVersion && { softwareVersion }),
    author: {
      '@type': 'Organization',
      name: 'userTourKit',
      url: SITE_URL,
    },
  }

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires innerHTML
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

// ── WebSite (+ optional SearchAction) ──

interface WebSiteJsonLdProps {
  name: string
  description: string
  /** Absolute or relative site URL. If relative, prefixed with SITE_URL. */
  url?: string
  /**
   * Absolute search endpoint URL that accepts `?q=` — enables sitelinks searchbox.
   * Omit to skip SearchAction (preferred over emitting a stub pointing at a 404).
   */
  searchUrl?: string
}

export function WebSiteJsonLd({
  name,
  description,
  url,
  searchUrl,
}: WebSiteJsonLdProps): ReactNode {
  const resolvedUrl = url ? (url.startsWith('http') ? url : `${SITE_URL}${url}`) : SITE_URL
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url: resolvedUrl,
    description,
  }
  if (searchUrl) {
    data.potentialAction = {
      '@type': 'SearchAction',
      target: `${searchUrl}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    }
  }

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires innerHTML
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

// ── Person (canonical author entity, emitted once from /about) ──

interface PersonJsonLdProps {
  /** Display handle (e.g. "domidex01"). */
  name: string
  /** Legal/real name (e.g. "Dominique Degottex"). Maps to schema name; handle becomes alternateName. */
  legalName?: string
  /** Canonical page for this Person (absolute or path). Used as `url` and to build `@id`. */
  url: string
  jobTitle?: string
  image?: string
  description?: string
  knowsAbout?: string[]
  /** External profile URLs used for `sameAs` (GitHub, LinkedIn, X, etc.). Falsy entries are dropped. */
  sameAs?: (string | undefined)[]
}

export function PersonJsonLd({
  name,
  legalName,
  url,
  jobTitle,
  image,
  description,
  knowsAbout,
  sameAs,
}: PersonJsonLdProps): ReactNode {
  const resolvedUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`
  const resolvedSameAs = (sameAs ?? []).filter((s): s is string => Boolean(s))
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${resolvedUrl}#person`,
    name: legalName ?? name,
    ...(legalName && { alternateName: name }),
    url: resolvedUrl,
    mainEntityOfPage: resolvedUrl,
    ...(image && { image }),
    ...(description && { description }),
    ...(jobTitle && { jobTitle }),
    ...(knowsAbout && knowsAbout.length > 0 && { knowsAbout }),
    ...(resolvedSameAs.length > 0 && { sameAs: resolvedSameAs }),
    worksFor: { '@id': `${SITE_URL}/#organization` },
  }

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires innerHTML
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

// ── Speakable ──

/**
 * Default CSS selectors used across article-like pages to mark content
 * suitable for text-to-speech and AI voice summarization.
 *
 * Combines explicit `data-speakable` attributes (author-controlled) with
 * structural fallbacks (`.prose > p:first-of-type` for intros, `.prose h3 + p`
 * for FAQ-style answers) so no MDX edits are required on 300+ existing
 * articles.
 */
export const DEFAULT_SPEAKABLE_SELECTORS: readonly string[] = [
  '[data-speakable="headline"]',
  '[data-speakable="summary"]',
  '[data-speakable="intro"]',
  '[data-speakable="faq-answer"]',
  '.prose > p:first-of-type',
  '.prose h3 + p',
]

interface SpeakableJsonLdProps {
  /** URL this speakable spec applies to. Defaults to the current origin. */
  url?: string
  /** CSS selectors AI voice assistants should read aloud (e.g. `[data-speakable="summary"]`). */
  cssSelectors: string[]
}

export function SpeakableJsonLd({ url, cssSelectors }: SpeakableJsonLdProps): ReactNode {
  if (cssSelectors.length === 0) return null
  const resolvedUrl = url ? (url.startsWith('http') ? url : `${SITE_URL}${url}`) : SITE_URL
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: resolvedUrl,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: cssSelectors,
    },
  }

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires innerHTML
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

// ── ItemList (listing / index / category pages) ──
//
// Google's "summary page" carousel format — each ListItem needs just
// `position` + `url`. Google then fetches the article schema from the
// linked detail page to build the rich carousel. Use for /blog, /compare,
// /alternatives, and category indexes. Do NOT emit on the home page or
// other non-listing surfaces; it's specifically a listing-page signal.

interface ItemListEntry {
  url: string
  /** Optional display name — helps AI crawlers label items in quick summaries. */
  name?: string
}

interface ItemListJsonLdProps {
  /** Name of the list (e.g. "Blog posts", "React tour library comparisons"). */
  name: string
  /** Canonical URL of the listing page itself. */
  url: string
  /** Items in display order. Position is added automatically (1-indexed). */
  items: ItemListEntry[]
  /** Optional human-readable description. */
  description?: string
}

export function ItemListJsonLd({ name, url, items, description }: ItemListJsonLdProps): ReactNode {
  if (items.length === 0) return null
  const resolvedUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: resolvedUrl,
    numberOfItems: items.length,
    ...(description && { description }),
    itemListElement: items.map((item, index) => {
      const itemUrl = item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`
      return {
        '@type': 'ListItem',
        position: index + 1,
        url: itemUrl,
        ...(item.name && { name: item.name }),
      }
    }),
  }

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires innerHTML
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

// ── Dataset (benchmarks, comparison tables, any quantitative snapshot) ──

interface DatasetVariable {
  /** Variable label (column header, e.g. "Gzip size (bytes)"). */
  name: string
  /** Units (schema.org/unitText — "B", "ms", "%", etc.). */
  unitText?: string
  /** Free-form description of what is being measured. */
  description?: string
}

interface DatasetJsonLdProps {
  name: string
  description: string
  /** Page URL (absolute or path). */
  url: string
  /** ISO 8601 date the measurements were taken. */
  dateModified: string
  /** Methodology page or section URL. */
  measurementMethod?: string
  /** Column variables being measured. */
  variables: DatasetVariable[]
  /** License URL (default: CC-BY, since the data is editorial). */
  license?: string
  /** Optional keywords aiding discovery. */
  keywords?: string[]
}

export function DatasetJsonLd({
  name,
  description,
  url,
  dateModified,
  measurementMethod,
  variables,
  license = 'https://creativecommons.org/licenses/by/4.0/',
  keywords,
}: DatasetJsonLdProps): ReactNode {
  const resolvedUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name,
    description,
    url: resolvedUrl,
    dateModified,
    license,
    isAccessibleForFree: true,
    creator: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': resolvedUrl },
    ...(keywords && keywords.length > 0 && { keywords }),
    ...(measurementMethod && {
      measurementTechnique: measurementMethod.startsWith('http')
        ? measurementMethod
        : `${SITE_URL}${measurementMethod}`,
    }),
    variableMeasured: variables.map((v) => ({
      '@type': 'PropertyValue',
      name: v.name,
      ...(v.unitText && { unitText: v.unitText }),
      ...(v.description && { description: v.description }),
    })),
  }

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires innerHTML
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

// ── HowTo ──

interface HowToStep {
  name: string
  text: string
  url?: string
}

interface HowToJsonLdProps {
  name: string
  description: string
  /** Must be ≥2 entries; caller should skip emission otherwise. */
  steps: HowToStep[]
  /** ISO 8601 duration, e.g. "PT15M" for 15 minutes. */
  totalTime?: string
  estimatedCost?: string
}

export function HowToJsonLd({
  name,
  description,
  steps,
  totalTime,
  estimatedCost,
}: HowToJsonLdProps): ReactNode {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    ...(totalTime && { totalTime }),
    ...(estimatedCost && { estimatedCost }),
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.url && {
        url: step.url.startsWith('http') ? step.url : `${SITE_URL}${step.url}`,
      }),
    })),
  }

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires innerHTML
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

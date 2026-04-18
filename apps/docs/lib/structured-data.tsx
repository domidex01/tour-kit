import type { ReactNode } from 'react'

const SITE_URL = 'https://usertourkit.com'

// ── Types ──

interface TechArticleProps {
  title: string
  description: string
  url: string
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
  dateModified,
  section,
}: TechArticleProps): ReactNode {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    url: `${SITE_URL}${url}`,
    ...(dateModified && { dateModified }),
    ...(section && { articleSection: section }),
    author: {
      '@type': 'Organization',
      name: 'userTourKit',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'userTourKit',
      url: SITE_URL,
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'userTourKit Documentation',
      url: `${SITE_URL}/docs`,
    },
  }

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires innerHTML
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
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
  image?: string
  wordCount?: number
  articleSection?: string
  keywords?: string[]
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
  image,
  wordCount,
  articleSection,
  keywords,
}: ArticleJsonLdProps): ReactNode {
  const sameAs = [authorGithub, authorLinkedin].filter(Boolean)
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
      name: authorName,
      ...(authorUrl && { url: authorUrl }),
      ...(sameAs.length > 0 && { sameAs }),
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
    sameAs: ['https://github.com/DomiDex/tour-kit', 'https://www.npmjs.com/package/@tour-kit/core'],
  }

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires innerHTML
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

export function ProductJsonLd(): ReactNode {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'userTourKit',
    description:
      'Open-source headless React library for product tours, onboarding checklists, hints, announcements, analytics, and scheduling.',
    brand: { '@type': 'Organization', '@id': `${SITE_URL}/#organization` },
    category: 'Developer Tools > Frontend Libraries',
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
    codeRepository: 'https://github.com/DomiDex/tour-kit',
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

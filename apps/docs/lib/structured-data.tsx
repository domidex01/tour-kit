import type { ReactNode } from 'react'

const SITE_URL = 'https://tourkit.dev'

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
      name: 'TourKit',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'TourKit',
      url: SITE_URL,
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'TourKit Documentation',
      url: `${SITE_URL}/docs`,
    },
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

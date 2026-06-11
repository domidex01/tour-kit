const SITE_URL = 'https://usertourkit.com'

interface CapabilityWebPageJsonLdProps {
  /** Route path ("/onboarding-checklists"). */
  path: string
  title: string
  description: string
  /** Relative OG image URL (/api/og?…). */
  ogImage: string
}

/**
 * WebPage node tying the capability page into the site graph — same shape as
 * the /pricing page's WebPage block (isPartOf #website, breadcrumb by @id).
 */
export function CapabilityWebPageJsonLd({
  path,
  title,
  description,
  ogImage,
}: CapabilityWebPageJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${SITE_URL}${path}#webpage`,
    url: `${SITE_URL}${path}`,
    name: title,
    description,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${SITE_URL}${ogImage}`,
    },
    breadcrumb: { '@id': `${SITE_URL}${path}#breadcrumb` },
  }
  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires innerHTML
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

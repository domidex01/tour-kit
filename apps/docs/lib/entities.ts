// Known third-party entities referenced across blog articles.
// Used to emit JSON-LD `mentions` on Article schema so AI search engines can
// disambiguate which product/library each article is discussing.
//
// URLs verified from blog content (GitHub issue references) or from each
// product's canonical marketing site. Commercial SaaS tools map to their
// corporate website rather than a non-existent open-source repo.

export interface EntityRecord {
  slug: string
  name: string
  /** schema.org @type — most are SoftwareApplication; a few may be Organization. */
  type: 'SoftwareApplication' | 'Organization'
  /** Canonical URL for this entity: GitHub repo for OSS, corporate site for SaaS. */
  sameAs: string
  /**
   * Additional name variants to match in article body. The primary `name` is
   * always matched; variants add synonyms (e.g. "react-joyride" for "React Joyride").
   */
  aliases?: string[]
}

export const ENTITIES: EntityRecord[] = [
  // ── Open-source ──
  {
    slug: 'react-joyride',
    name: 'React Joyride',
    type: 'SoftwareApplication',
    sameAs: 'https://github.com/gilbarbara/react-joyride',
    aliases: ['react-joyride'],
  },
  {
    slug: 'shepherd-js',
    name: 'Shepherd.js',
    type: 'SoftwareApplication',
    sameAs: 'https://github.com/shipshapecode/shepherd',
    aliases: ['Shepherd.js', 'shepherd-js'],
  },
  {
    slug: 'driver-js',
    name: 'Driver.js',
    type: 'SoftwareApplication',
    sameAs: 'https://github.com/kamranahmedse/driver.js',
    aliases: ['Driver.js', 'driver-js', 'driverjs'],
  },
  {
    slug: 'intro-js',
    name: 'Intro.js',
    type: 'SoftwareApplication',
    sameAs: 'https://github.com/usablica/intro.js',
    aliases: ['Intro.js', 'intro-js', 'introjs'],
  },
  {
    slug: 'reactour',
    name: 'Reactour',
    type: 'SoftwareApplication',
    sameAs: 'https://github.com/elrumordelaluz/reactour',
  },
  {
    slug: 'onborda',
    name: 'Onborda',
    type: 'SoftwareApplication',
    sameAs: 'https://github.com/uixmat/onborda',
  },
  {
    slug: 'onboardjs',
    name: 'OnboardJS',
    type: 'SoftwareApplication',
    sameAs: 'https://github.com/OnboardJS',
    aliases: ['OnboardJS', 'Onboard.js'],
  },

  // ── Commercial SaaS ──
  {
    slug: 'appcues',
    name: 'Appcues',
    type: 'SoftwareApplication',
    sameAs: 'https://www.appcues.com',
  },
  {
    slug: 'pendo',
    name: 'Pendo',
    type: 'SoftwareApplication',
    sameAs: 'https://www.pendo.io',
  },
  {
    slug: 'walkme',
    name: 'WalkMe',
    type: 'SoftwareApplication',
    sameAs: 'https://www.walkme.com',
  },
  {
    slug: 'userpilot',
    name: 'Userpilot',
    type: 'SoftwareApplication',
    sameAs: 'https://userpilot.com',
  },
  {
    slug: 'chameleon',
    name: 'Chameleon',
    type: 'SoftwareApplication',
    sameAs: 'https://www.chameleon.io',
  },
  {
    slug: 'whatfix',
    name: 'Whatfix',
    type: 'SoftwareApplication',
    sameAs: 'https://whatfix.com',
  },
  {
    slug: 'userflow',
    name: 'Userflow',
    type: 'SoftwareApplication',
    sameAs: 'https://userflow.com',
  },
]

/**
 * Substring-match the article body against the entity registry.
 * Uses case-insensitive word-boundary matching to avoid false positives
 * (e.g. "Intro" matching inside "introduction"). Caps at 10 to keep
 * JSON-LD payload manageable and satisfy schema.org best practices.
 */
export function findMentionedEntities(body: string): EntityRecord[] {
  if (!body) return []
  const matches: EntityRecord[] = []
  for (const entity of ENTITIES) {
    const candidates = [entity.name, ...(entity.aliases ?? [])]
    const hit = candidates.some((candidate) => {
      const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp(`(?:^|[^\\w-])${escaped}(?:[^\\w-]|$)`, 'i')
      return re.test(body)
    })
    if (hit) matches.push(entity)
    if (matches.length >= 10) break
  }
  return matches
}

export interface EntityMentionJsonLd {
  '@type': 'SoftwareApplication' | 'Organization'
  name: string
  sameAs: string
}

export function toMentionsJsonLd(entities: EntityRecord[]): EntityMentionJsonLd[] {
  return entities.map((e) => ({
    '@type': e.type,
    name: e.name,
    sameAs: e.sameAs,
  }))
}

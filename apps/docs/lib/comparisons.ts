// ── Comparison & Alternatives Content Registry ──
// Central registry of all comparison/alternatives/blog pages.
// Each article page reads its metadata from here.

export interface ComparisonMeta {
  slug: string
  competitor: string
  competitorSlug: string
  category: 'open-source' | 'commercial' | 'platform'
  title: string
  metaTitle: string
  description: string
  keywords: string[]
  /** Set to true when the article has actual content (MDX written). Unpublished entries won't appear on the site. */
  published?: boolean
  publishedAt?: string
  lastUpdated?: string
}

export interface AlternativeMeta {
  slug: string
  competitor: string
  competitorSlug: string
  title: string
  metaTitle: string
  description: string
  keywords: string[]
  published?: boolean
  publishedAt?: string
  lastUpdated?: string
}

export interface BlogMeta {
  slug: string
  title: string
  metaTitle: string
  description: string
  keywords: string[]
  category: string
  published?: boolean
  publishedAt?: string
  lastUpdated?: string
  /** Path to static OG/featured image relative to public/ */
  ogImage?: string
}

// ── Comparisons ──

export const COMPARISONS: ComparisonMeta[] = [
  // Tier 1: Open-source libraries (weeks 1-4)
  {
    slug: 'tour-kit-vs-react-joyride',
    competitor: 'React Joyride',
    competitorSlug: 'react-joyride',
    category: 'open-source',
    published: true,
    title: 'User Tour Kit vs React Joyride: Which React Tour Library Should You Choose in 2026?',
    metaTitle: 'User Tour Kit vs React Joyride: 2026 Comparison for Developers',
    description:
      'Compare User Tour Kit vs React Joyride for React product tours. See features, bundle size, pricing, and accessibility side-by-side. Find which fits your React stack in 2026.',
    keywords: [
      'user tour kit',
      'react joyride',
      'react joyride alternative',
      'product tour library',
      'react tour',
    ],
  },
  {
    slug: 'tour-kit-vs-shepherd-js',
    competitor: 'Shepherd.js',
    competitorSlug: 'shepherd-js',
    category: 'open-source',
    published: true,
    title: 'User Tour Kit vs Shepherd.js: Which Product Tour Library Should You Choose in 2026?',
    metaTitle: 'User Tour Kit vs Shepherd.js: 2026 Comparison for Developers',
    description:
      'Compare User Tour Kit vs Shepherd.js for product tours. See features, bundle size, licensing, and accessibility side-by-side. Find which fits your stack in 2026.',
    keywords: [
      'user tour kit',
      'shepherd.js',
      'shepherd.js alternative',
      'product tour library',
      'AGPL license',
    ],
  },
  {
    slug: 'tour-kit-vs-intro-js',
    competitor: 'Intro.js',
    competitorSlug: 'intro-js',
    category: 'open-source',
    published: true,
    title: 'User Tour Kit vs Intro.js: Which Tour Library Should You Choose in 2026?',
    metaTitle: 'User Tour Kit vs Intro.js: 2026 Comparison for Developers',
    description:
      'Compare User Tour Kit vs Intro.js for product tours and onboarding. See features, bundle size, licensing, and accessibility side-by-side in 2026.',
    keywords: [
      'user tour kit',
      'intro.js',
      'intro.js alternative',
      'product tour library',
      'onboarding',
    ],
  },
  {
    slug: 'tour-kit-vs-driver-js',
    competitor: 'Driver.js',
    competitorSlug: 'driver-js',
    category: 'open-source',
    published: true,
    title: 'User Tour Kit vs Driver.js: Which Tour Library Should You Choose in 2026?',
    metaTitle: 'User Tour Kit vs Driver.js: 2026 Comparison for Developers',
    description:
      'Compare User Tour Kit vs Driver.js for product tours. See features, bundle size, React integration, and accessibility side-by-side in 2026.',
    keywords: [
      'user tour kit',
      'driver.js',
      'driver.js alternative',
      'product tour library',
      'lightweight tour',
    ],
  },
  {
    slug: 'tour-kit-vs-reactour',
    competitor: 'Reactour',
    competitorSlug: 'reactour',
    category: 'open-source',
    published: true,
    title: 'User Tour Kit vs Reactour: Which React Tour Library Should You Choose in 2026?',
    metaTitle: 'User Tour Kit vs Reactour: 2026 Comparison for Developers',
    description:
      'Compare User Tour Kit vs Reactour for React product tours. See features, bundle size, pricing, accessibility, and TypeScript side-by-side in 2026.',
    keywords: [
      'user tour kit',
      'reactour',
      'reactour alternative',
      'react tour library',
      'product tour',
    ],
  },
  // Tier 2: Commercial tools (months 1-2)
  {
    slug: 'tour-kit-vs-appcues',
    competitor: 'Appcues',
    competitorSlug: 'appcues',
    category: 'commercial',
    published: true,
    title: 'User Tour Kit vs Appcues: Which Onboarding Tool Should You Choose in 2026?',
    metaTitle: 'User Tour Kit vs Appcues: 2026 Comparison for React Teams',
    description:
      'Compare User Tour Kit vs Appcues for product onboarding. $99 one-time vs $300+/month. See features, pricing, and developer experience side-by-side in 2026.',
    keywords: [
      'user tour kit',
      'appcues',
      'appcues alternative',
      'product onboarding',
      'no-code onboarding',
    ],
  },
  {
    slug: 'tour-kit-vs-userguiding',
    competitor: 'UserGuiding',
    competitorSlug: 'userguiding',
    category: 'commercial',
    published: true,
    title: 'User Tour Kit vs UserGuiding: Which Onboarding Tool Should You Choose in 2026?',
    metaTitle: 'User Tour Kit vs UserGuiding: 2026 Comparison for Developers',
    description:
      'Compare User Tour Kit vs UserGuiding for product onboarding. See features, pricing, customization, and developer control side-by-side in 2026.',
    keywords: [
      'user tour kit',
      'userguiding',
      'userguiding alternative',
      'product tour',
      'onboarding tool',
    ],
  },
  {
    slug: 'tour-kit-vs-userpilot',
    competitor: 'Userpilot',
    competitorSlug: 'userpilot',
    category: 'commercial',
    published: true,
    title: 'User Tour Kit vs Userpilot: Which Onboarding Tool Should You Choose in 2026?',
    metaTitle: 'User Tour Kit vs Userpilot: 2026 Comparison for Developers',
    description:
      'Compare User Tour Kit vs Userpilot for product onboarding. See features, pricing, analytics, and developer experience side-by-side in 2026.',
    keywords: [
      'user tour kit',
      'userpilot',
      'userpilot alternative',
      'product analytics',
      'onboarding tool',
    ],
  },
  // Tier 3: Enterprise (months 2-4)
  {
    slug: 'tour-kit-vs-pendo',
    competitor: 'Pendo',
    competitorSlug: 'pendo',
    category: 'commercial',
    title: 'User Tour Kit vs Pendo: Which Product Tour Tool Should You Choose in 2026?',
    metaTitle: 'User Tour Kit vs Pendo: 2026 Comparison for Developers',
    description:
      'Compare User Tour Kit vs Pendo for product tours and analytics. See features, pricing, and developer experience side-by-side in 2026.',
    keywords: ['user tour kit', 'pendo', 'pendo alternative', 'product analytics', 'enterprise'],
  },
  {
    slug: 'tour-kit-vs-walkme',
    competitor: 'WalkMe',
    competitorSlug: 'walkme',
    category: 'commercial',
    published: true,
    title: 'User Tour Kit vs WalkMe: Which Digital Adoption Platform Should You Choose in 2026?',
    metaTitle: 'User Tour Kit vs WalkMe: 2026 Comparison for Developers',
    description:
      'Compare User Tour Kit vs WalkMe for digital adoption. See features, pricing, performance, and implementation complexity side-by-side in 2026.',
    keywords: [
      'user tour kit',
      'walkme',
      'walkme alternative',
      'digital adoption platform',
      'enterprise',
    ],
  },
  {
    slug: 'tour-kit-vs-userflow',
    competitor: 'Userflow',
    competitorSlug: 'userflow',
    category: 'commercial',
    published: true,
    title: 'User Tour Kit vs Userflow: Which Onboarding Tool Should You Choose in 2026?',
    metaTitle: 'User Tour Kit vs Userflow: 2026 Comparison for Developers',
    description:
      'Compare User Tour Kit vs Userflow for product onboarding. See features, pricing, flow builder, and developer experience side-by-side in 2026.',
    keywords: [
      'user tour kit',
      'userflow',
      'userflow alternative',
      'product onboarding',
      'flow builder',
    ],
  },
  {
    slug: 'tour-kit-vs-frigade',
    competitor: 'Frigade',
    competitorSlug: 'frigade',
    category: 'platform',
    title: 'User Tour Kit vs Frigade: Which React Onboarding Library Should You Choose in 2026?',
    metaTitle: 'User Tour Kit vs Frigade: 2026 Comparison for Developers',
    description:
      'Compare User Tour Kit vs Frigade for React onboarding. See features, self-hosting, pricing, and vendor independence side-by-side in 2026.',
    keywords: [
      'user tour kit',
      'frigade',
      'frigade alternative',
      'react onboarding',
      'self-hosted',
    ],
  },
  // Tier 4: Smaller tools (months 4-6)
  {
    slug: 'tour-kit-vs-onborda',
    competitor: 'Onborda',
    competitorSlug: 'onborda',
    category: 'open-source',
    published: true,
    title: 'User Tour Kit vs Onborda: Which Next.js Tour Library Should You Choose in 2026?',
    metaTitle: 'User Tour Kit vs Onborda: 2026 Comparison for Developers',
    description:
      'Compare User Tour Kit vs Onborda for Next.js product tours. See features, framework support, and compatibility side-by-side in 2026.',
    keywords: ['user tour kit', 'onborda', 'onborda alternative', 'nextjs tour', 'product tour'],
  },
  {
    slug: 'tour-kit-vs-onboardjs',
    competitor: 'OnboardJS',
    competitorSlug: 'onboardjs',
    category: 'open-source',
    published: true,
    title: 'User Tour Kit vs OnboardJS: Which Headless Tour Library Should You Choose in 2026?',
    metaTitle: 'User Tour Kit vs OnboardJS: 2026 Comparison for Developers',
    description:
      'Compare User Tour Kit vs OnboardJS for headless product tours. See features, visual components, and TypeScript support side-by-side in 2026.',
    keywords: ['user tour kit', 'onboardjs', 'onboardjs alternative', 'headless tour', 'product tour'],
  },
  {
    slug: 'tour-kit-vs-usertour',
    competitor: 'Usertour.io',
    competitorSlug: 'usertour',
    category: 'platform',
    title: 'User Tour Kit vs Usertour.io: Which Onboarding Tool Should You Choose in 2026?',
    metaTitle: 'User Tour Kit vs Usertour.io: 2026 Comparison for Developers',
    description:
      'Compare User Tour Kit vs Usertour.io for product onboarding. See features, self-hosting, pricing, and developer experience side-by-side in 2026.',
    keywords: [
      'user tour kit',
      'usertour',
      'usertour alternative',
      'product onboarding',
      'self-hosted',
    ],
  },
  {
    slug: 'tour-kit-vs-chameleon',
    competitor: 'Chameleon',
    competitorSlug: 'chameleon',
    category: 'commercial',
    published: true,
    title: 'User Tour Kit vs Chameleon: Which Onboarding Tool Should You Choose in 2026?',
    metaTitle: 'User Tour Kit vs Chameleon: 2026 Comparison for Developers',
    description:
      'Compare User Tour Kit vs Chameleon for product onboarding. See features, pricing, and developer experience side-by-side in 2026.',
    keywords: [
      'user tour kit',
      'chameleon',
      'chameleon alternative',
      'product onboarding',
      'in-app messaging',
    ],
  },
  {
    slug: 'tour-kit-vs-whatfix',
    competitor: 'Whatfix',
    competitorSlug: 'whatfix',
    category: 'commercial',
    title: 'User Tour Kit vs Whatfix: Which Digital Adoption Platform Should You Choose in 2026?',
    metaTitle: 'User Tour Kit vs Whatfix: 2026 Comparison for Developers',
    description:
      'Compare User Tour Kit vs Whatfix for digital adoption. See features, pricing, and developer experience side-by-side in 2026.',
    keywords: [
      'user tour kit',
      'whatfix',
      'whatfix alternative',
      'digital adoption',
      'enterprise',
    ],
  },
]

// ── Alternatives ──

export const ALTERNATIVES: AlternativeMeta[] = [
  {
    slug: 'appcues-alternatives',
    competitor: 'Appcues',
    competitorSlug: 'appcues',
    title: 'Best Appcues Alternatives for React and JavaScript Developers in 2026',
    metaTitle: 'Best Appcues Alternatives for Developers (2026)',
    description:
      'The best Appcues alternatives for developers in 2026. Compare User Tour Kit, Userpilot, UserGuiding, Userflow, and more. Ranked by DX, features, and pricing.',
    keywords: ['appcues alternative', 'appcues alternatives', 'product onboarding', 'react'],
  },
  {
    slug: 'pendo-alternatives',
    competitor: 'Pendo',
    competitorSlug: 'pendo',
    title: 'Best Pendo Alternatives for React and JavaScript Developers in 2026',
    metaTitle: 'Best Pendo Alternatives for Developers (2026)',
    description:
      'The best Pendo alternatives for developers in 2026. Compare User Tour Kit, Appcues, Userpilot, and more. Ranked by DX, features, and pricing.',
    keywords: ['pendo alternative', 'pendo alternatives', 'product analytics', 'onboarding'],
  },
  {
    slug: 'walkme-alternatives',
    competitor: 'WalkMe',
    competitorSlug: 'walkme',
    title: 'Best WalkMe Alternatives for React and JavaScript Developers in 2026',
    metaTitle: 'Best WalkMe Alternatives for Developers (2026)',
    description:
      'The best WalkMe alternatives for developers in 2026. Compare User Tour Kit, Pendo, Whatfix, and more. Ranked by DX, features, and pricing.',
    keywords: [
      'walkme alternative',
      'walkme alternatives',
      'digital adoption',
      'enterprise onboarding',
    ],
  },
  {
    slug: 'userpilot-alternatives',
    competitor: 'Userpilot',
    competitorSlug: 'userpilot',
    title: 'Best Userpilot Alternatives for React and JavaScript Developers in 2026',
    metaTitle: 'Best Userpilot Alternatives for Developers (2026)',
    description:
      'The best Userpilot alternatives for developers in 2026. Compare User Tour Kit, Appcues, UserGuiding, and more. Ranked by DX, features, and pricing.',
    keywords: [
      'userpilot alternative',
      'userpilot alternatives',
      'product onboarding',
      'analytics',
    ],
  },
  {
    slug: 'userguiding-alternatives',
    competitor: 'UserGuiding',
    competitorSlug: 'userguiding',
    title: 'Best UserGuiding Alternatives for React and JavaScript Developers in 2026',
    metaTitle: 'Best UserGuiding Alternatives for Developers (2026)',
    description:
      'The best UserGuiding alternatives for developers in 2026. Compare User Tour Kit, Appcues, Userpilot, and more. Ranked by DX, features, and pricing.',
    keywords: [
      'userguiding alternative',
      'userguiding alternatives',
      'product tour',
      'onboarding tool',
    ],
  },
  {
    slug: 'userflow-alternatives',
    competitor: 'Userflow',
    competitorSlug: 'userflow',
    title: 'Best Userflow Alternatives for React and JavaScript Developers in 2026',
    metaTitle: 'Best Userflow Alternatives for Developers (2026)',
    description:
      'The best Userflow alternatives for developers in 2026. Compare User Tour Kit, Appcues, UserGuiding, and more. Ranked by DX, features, and pricing.',
    keywords: [
      'userflow alternative',
      'userflow alternatives',
      'product onboarding',
      'flow builder',
    ],
  },
  {
    slug: 'react-joyride-alternatives',
    competitor: 'React Joyride',
    competitorSlug: 'react-joyride',
    title: 'Best React Joyride Alternatives for Developers in 2026',
    metaTitle: 'Best React Joyride Alternatives for Developers (2026)',
    description:
      'The best React Joyride alternatives in 2026. Compare User Tour Kit, Shepherd.js, Driver.js, and more. Ranked by bundle size, features, and DX.',
    keywords: [
      'react joyride alternative',
      'react joyride alternatives',
      'react tour library',
      'product tour',
    ],
  },
  {
    slug: 'shepherd-js-alternatives',
    competitor: 'Shepherd.js',
    competitorSlug: 'shepherd-js',
    title: 'Best Shepherd.js Alternatives for Developers in 2026',
    metaTitle: 'Best Shepherd.js Alternatives for Developers (2026)',
    description:
      'The best Shepherd.js alternatives in 2026. Compare User Tour Kit, React Joyride, Driver.js, and more. Ranked by license, features, and DX.',
    keywords: [
      'shepherd.js alternative',
      'shepherd.js alternatives',
      'product tour library',
      'AGPL alternative',
    ],
  },
  {
    slug: 'intro-js-alternatives',
    competitor: 'Intro.js',
    competitorSlug: 'intro-js',
    title: 'Best Intro.js Alternatives for Developers in 2026',
    metaTitle: 'Best Intro.js Alternatives for Developers (2026)',
    description:
      'The best Intro.js alternatives in 2026. Compare User Tour Kit, Shepherd.js, Driver.js, and more. Ranked by license, features, and DX.',
    keywords: [
      'intro.js alternative',
      'intro.js alternatives',
      'product tour library',
      'AGPL alternative',
    ],
  },
  {
    slug: 'frigade-alternatives',
    competitor: 'Frigade',
    competitorSlug: 'frigade',
    title: 'Best Frigade Alternatives for Developers in 2026',
    metaTitle: 'Best Frigade Alternatives for Developers (2026)',
    description:
      'The best Frigade alternatives in 2026. Compare User Tour Kit, Appcues, and more. Ranked by self-hosting, pricing, and DX.',
    keywords: [
      'frigade alternative',
      'frigade alternatives',
      'react onboarding',
      'self-hosted onboarding',
    ],
  },
]

// ── Blog Posts ──

export const BLOG_POSTS: BlogMeta[] = [
  {
    slug: 'best-react-product-tour-libraries-2026',
    title: 'The 12 Best React Product Tour Libraries in 2026, Ranked',
    metaTitle: '12 Best React Product Tour Libraries in 2026 (Ranked by Developers)',
    description:
      'The best React product tour libraries in 2026, ranked by bundle size, features, accessibility, and developer experience. Includes open-source and commercial tools.',
    keywords: [
      'best react product tour library',
      'react onboarding library',
      'product tour javascript library',
    ],
    category: 'Listicle',
  },
  {
    slug: 'best-open-source-onboarding-tools-2026',
    title: 'The 9 Best Open-Source Onboarding Tools in 2026, Ranked',
    metaTitle: '9 Best Open-Source Onboarding Tools in 2026 (Ranked by Developers)',
    description:
      'The best open-source onboarding and product tour tools in 2026. Compare User Tour Kit, Shepherd.js, React Joyride, Driver.js, and more.',
    keywords: [
      'product tour open source',
      'best free product tour library',
      'open source onboarding',
    ],
    category: 'Listicle',
  },
  {
    slug: 'best-product-tour-tools-2026',
    title: 'The 15 Best Product Tour Tools in 2026, Ranked',
    metaTitle: '15 Best Product Tour Tools in 2026 (Ranked by Developers)',
    description:
      'The best product tour and onboarding tools in 2026 for developers and product teams. Open-source libraries and commercial platforms compared.',
    keywords: ['best product tour tools', 'onboarding tools', 'product tour software'],
    category: 'Listicle',
  },
  {
    slug: 'best-product-tour-tools-react',
    title: '10 Best Product Tour Tools for React Developers (2026)',
    metaTitle: '10 Best Product Tour Tools for React Developers (2026)',
    description:
      'Discover the best product tour tools for React in 2026. We installed and tested 10 options, comparing bundle size, TypeScript support, React 19 compatibility, and pricing.',
    keywords: [
      'best product tour tool react',
      'react onboarding tool',
      'react product tour software',
      'developer onboarding tool',
    ],
    category: 'Listicle',
    published: true,
    publishedAt: '2026-04-01',
    lastUpdated: '2026-04-01',
    ogImage: '/og-images/best-product-tour-tools-react.avif',
  },
  {
    slug: 'best-free-product-tour-libraries-open-source',
    title: 'Best Free Product Tour Libraries in 2026 (Open Source Only)',
    metaTitle: 'Best Free Product Tour Libraries in 2026 (Open Source Only)',
    description:
      'We installed 9 open-source tour libraries into the same React 19 project. Here\'s what actually works, what\'s abandoned, and which licenses have traps.',
    keywords: [
      'free product tour library open source',
      'open source tour library',
      'free onboarding library javascript',
      'react tour library free',
    ],
    category: 'Listicle',
    published: true,
    publishedAt: '2026-04-02',
    lastUpdated: '2026-04-02',
    ogImage: '/og-images/best-free-product-tour-libraries-open-source.avif',
  },
  {
    slug: 'add-product-tour-react-19',
    title: 'How to Add a Product Tour to a React 19 App in 5 Minutes',
    metaTitle: 'Add a Product Tour to React 19 in 5 Minutes (2026)',
    description:
      'Add a working product tour to your React 19 app with Tour Kit. Covers useTransition async steps, ref-as-prop targeting, and full TypeScript examples.',
    keywords: [
      'add product tour react 19',
      'react 19 onboarding tutorial',
      'product tour react 19 guide',
      'headless product tour react',
    ],
    category: 'Tutorial',
    published: true,
    publishedAt: '2026-04-02',
    lastUpdated: '2026-04-02',
    ogImage: '/og-images/add-product-tour-react-19-v2.avif',
  },
  {
    slug: 'best-headless-ui-libraries-onboarding',
    title: '7 Best Headless UI Libraries for Onboarding in 2026',
    metaTitle: '7 Best Headless UI Libraries for Onboarding (2026)',
    description:
      'We tested 7 headless libraries for building product tours and onboarding flows in React. Comparing bundle size, accessibility, and composition patterns.',
    keywords: [
      'headless onboarding library',
      'headless ui product tour',
      'composable onboarding library',
      'headless tour library react',
    ],
    category: 'Listicle',
    published: true,
    publishedAt: '2026-04-02',
    lastUpdated: '2026-04-02',
    ogImage: '/og-images/best-headless-ui-libraries-onboarding.avif',
  },
  {
    slug: 'best-typescript-product-tour-libraries',
    title: '8 TypeScript Product Tour Libraries Ranked by Developer Experience (2026)',
    metaTitle: '8 TypeScript Product Tour Libraries Ranked by DX (2026)',
    description:
      'We tested 8 product tour libraries for TypeScript quality. See which have real types, which ship broken generics, and which force you into any.',
    keywords: [
      'typescript product tour library',
      'typescript onboarding library',
      'typed product tour react',
      'react product tour typescript',
    ],
    category: 'Listicle',
    published: true,
    publishedAt: '2026-04-02',
    lastUpdated: '2026-04-02',
    ogImage: '/og-images/best-typescript-product-tour-libraries.avif',
  },
]

// ── Helpers ──

export function getComparison(slug: string): ComparisonMeta | undefined {
  return COMPARISONS.find((c) => c.slug === slug)
}

export function getAlternative(slug: string): AlternativeMeta | undefined {
  return ALTERNATIVES.find((a) => a.slug === slug)
}

export function getBlogPost(slug: string): BlogMeta | undefined {
  return BLOG_POSTS.find((b) => b.slug === slug)
}

export function getComparisonsByCategory(category: ComparisonMeta['category']): ComparisonMeta[] {
  return COMPARISONS.filter((c) => c.category === category && c.published)
}

export function getPublishedComparisons(): ComparisonMeta[] {
  return COMPARISONS.filter((c) => c.published)
}

export function getPublishedAlternatives(): AlternativeMeta[] {
  return ALTERNATIVES.filter((a) => a.published)
}

export function getPublishedBlogPosts(): BlogMeta[] {
  return BLOG_POSTS.filter((b) => b.published)
}

export function getRelatedComparisons(slug: string, limit = 3): ComparisonMeta[] {
  const current = getComparison(slug)
  if (!current) return getPublishedComparisons().slice(0, limit)
  return COMPARISONS.filter((c) => c.slug !== slug && c.category === current.category && c.published).slice(
    0,
    limit,
  )
}

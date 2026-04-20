import { type BlogMeta, getPublishedBlogPosts } from '@/lib/comparisons'

export const POSTS_PER_PAGE = 20

/** Pinned slugs shown in the featured section on page 1. */
export const FEATURED_SLUGS = [
  'add-product-tour-react-19',
  'tour-kit-vs-react-joyride',
  'shadcn-ui-product-tour-tutorial',
]

/** Get featured blog posts. */
export function getFeaturedBlogPosts(): BlogMeta[] {
  const all = getPublishedBlogPosts()
  return FEATURED_SLUGS.map((slug) => all.find((p) => p.slug === slug)).filter(
    (p): p is BlogMeta => !!p
  )
}

/** Read raw MDX file (frontmatter included). Returns empty string on read failure. */
function readMdxRaw(slug: string): string {
  try {
    const fs = require('node:fs')
    const path = require('node:path')
    const filePath = path.join(process.cwd(), 'content/blog', `${slug}.mdx`)
    return fs.readFileSync(filePath, 'utf-8') as string
  } catch {
    return ''
  }
}

/** Read raw MDX body (frontmatter stripped). Returns empty string on read failure. */
export function readMdxBody(slug: string): string {
  const raw = readMdxRaw(slug)
  return raw ? raw.replace(/^---[\s\S]*?---/, '') : ''
}

export interface FAQEntry {
  question: string
  answer: string
}

/**
 * Extract FAQ Q&A pairs from an article's MDX body.
 *
 * Matches a `## FAQ` or `## Frequently asked questions` section, then captures
 * every `### Question?` heading and the paragraph(s) that follow until the next
 * H3, H2, or horizontal rule. Used to emit proper schema.org/Question entries
 * instead of hardcoded generic FAQs.
 */
export function getFaqFromMdx(slug: string): FAQEntry[] {
  const body = readMdxBody(slug)
  if (!body) return []

  // Scan line-by-line so the section boundary doesn't hinge on regex lookaheads
  // (which can't express "any H2 or --- or end-of-string" reliably in JS).
  const lines = body.split('\n')
  let start = -1
  let end = lines.length
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (start === -1) {
      if (/^##\s+(?:FAQ|Frequently\s+asked\s+questions)\s*$/i.test(line)) {
        start = i + 1
      }
      continue
    }
    if (/^##\s+/.test(line) && !/^###/.test(line)) {
      end = i
      break
    }
    if (/^---\s*$/.test(line)) {
      end = i
      break
    }
  }
  if (start === -1) return []

  const section = lines.slice(start, end).join('\n')
  // Split on `### ` headings. First chunk before any H3 is preamble (discard).
  const chunks = section.split(/^###\s+/m).slice(1)

  const entries: FAQEntry[] = []
  for (const chunk of chunks) {
    const newlineIdx = chunk.indexOf('\n')
    if (newlineIdx === -1) continue

    const question = chunk.slice(0, newlineIdx).trim().replace(/\s+/g, ' ')
    const answerRaw = chunk.slice(newlineIdx + 1)
    // Strip markdown formatting, code fences, HTML, JSX comments, and links.
    const answer = answerRaw
      .replace(/```[\s\S]*?```/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_`]+/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (question && answer) {
      entries.push({ question, answer })
    }
  }

  return entries
}

export interface HowToStepEntry {
  name: string
  text: string
}

export interface HowToExtraction {
  name: string
  steps: HowToStepEntry[]
}

const TUTORIAL_SLUG_PATTERN = /^(add-|how-|migrate-|setup-|build-|integrate-)/

/**
 * Extract HowTo step data from an article's MDX body when it qualifies as a tutorial.
 *
 * Qualifies when the slug starts with a tutorial prefix (add-, how-, migrate-,
 * setup-, build-, integrate-) or the frontmatter declares `schema_type: HowTo`.
 * Recognized step heading patterns (H2):
 *   - `## Step 1: …`, `## Step 1 — …`, `## Step 1 - …`, `## Step 1 …`
 *   - `## 1. …`, `## 2. …` (numbered list-style)
 * Returns null when fewer than 2 steps are found (Google's minimum for HowTo).
 */
export function getHowToFromMdx(slug: string): HowToExtraction | null {
  const raw = readMdxRaw(slug)
  if (!raw) return null

  const fm = raw.match(/^---\n([\s\S]*?)\n---/)
  const frontmatter = fm?.[1] ?? ''
  const schemaTypeMatch = frontmatter.match(/^schema_type:\s*["']?(.+?)["']?\s*$/m)
  const frontmatterSaysHowTo = schemaTypeMatch?.[1].trim() === 'HowTo'
  if (!TUTORIAL_SLUG_PATTERN.test(slug) && !frontmatterSaysHowTo) return null

  const body = raw.replace(/^---[\s\S]*?---/, '')
  const lines = body.split('\n')

  type Heading = { idx: number; name: string }
  const headings: Heading[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!/^##\s+/.test(line) || /^###/.test(line)) continue
    const match =
      line.match(/^##\s+Step\s+\d+\s*[:—\-]\s*(.+?)\s*$/i) ??
      line.match(/^##\s+Step\s+\d+\s+(.+?)\s*$/i) ??
      line.match(/^##\s+\d+\.\s+(.+?)\s*$/)
    if (match) {
      headings.push({ idx: i, name: match[1].trim().replace(/\s+/g, ' ') })
    }
  }
  if (headings.length < 2) return null

  const steps: HowToStepEntry[] = []
  for (let s = 0; s < headings.length; s++) {
    const start = headings[s].idx + 1
    const nextIdx = headings[s + 1]?.idx ?? lines.length
    let end = nextIdx
    for (let i = start; i < nextIdx; i++) {
      if (/^##\s+/.test(lines[i]) && !/^###/.test(lines[i])) {
        end = i
        break
      }
    }
    const text = lines
      .slice(start, end)
      .join('\n')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_`]+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (text) steps.push({ name: headings[s].name, text })
  }
  if (steps.length < 2) return null

  const titleMatch = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m)
  const name = titleMatch?.[1].trim() ?? ''

  return { name, steps }
}

/** Estimate reading time from MDX file word count. Returns "X min read". */
export function getReadingTime(slug: string): string {
  try {
    const fs = require('node:fs')
    const path = require('node:path')
    const filePath = path.join(process.cwd(), 'content/blog', `${slug}.mdx`)
    const content = fs.readFileSync(filePath, 'utf-8')
    // Strip frontmatter, code blocks, HTML tags, and JSON-LD
    const stripped = content
      .replace(/^---[\s\S]*?---/, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    const words = stripped.split(/\s+/).filter(Boolean).length
    const minutes = Math.max(1, Math.round(words / 200))
    return `${minutes} min read`
  } catch {
    return '5 min read'
  }
}

/** Normalize a category name into a URL-safe slug: lowercase, spaces→hyphens, strip non [a-z0-9-]. */
export function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Get all unique categories from published posts. */
export function getBlogCategories(): string[] {
  const posts = getPublishedBlogPosts()
  const categories = new Set(posts.map((p) => p.category))
  return [...categories].sort()
}

/** Get published posts filtered by slugified category (e.g. "build-vs-buy"). */
export function getPostsByCategory(categorySlug: string): BlogMeta[] {
  return getPublishedBlogPosts().filter((p) => slugifyCategory(p.category) === categorySlug)
}

/** Look up the original category display name from a slug, or undefined. */
export function getCategoryDisplayName(categorySlug: string): string | undefined {
  return getBlogCategories().find((c) => slugifyCategory(c) === categorySlug)
}

/**
 * 80–120 word intro paragraphs for each category landing page.
 * Diluting card-grid term repetition is the SEO point — keyword-stuffing audits
 * fire when listing cards repeat headings/categories without surrounding prose.
 * Keys match the slugified category name.
 */
const CATEGORY_INTROS: Record<string, string> = {
  'build-vs-buy':
    'Should you build product tours in-house or pay for an onboarding platform? These articles work the math: engineering time, ongoing maintenance, accessibility audits, analytics integration, and the hidden cost of being locked into a vendor pricing model. We compare in-house React implementations against Appcues, Pendo, WalkMe, and Userpilot across feature parity, total cost of ownership, and time to ship. If you are weighing a six-figure SaaS contract against a few weeks of engineering work, start here.',
  comparisons:
    'Honest, side-by-side comparisons between userTourKit and the rest of the product tour landscape — open-source libraries like React Joyride, Shepherd.js, Driver.js, and Intro.js, and commercial platforms like Appcues, Pendo, WalkMe, Userpilot, UserGuiding, and Userflow. Each comparison covers bundle size, accessibility, license terms, framework fit, pricing, and the migration path between tools. No marketing claims — just feature matrices, real code, and the trade-offs that actually matter when you are choosing what to ship.',
  'deep-dives':
    'Long-form technical writing on the hard parts of product tours and onboarding: focus management and WCAG-compliant ARIA patterns, positioning engines that survive scroll and resize, hydration-safe persistence with localStorage and IndexedDB, framework-specific gotchas in Next.js App Router and Remix, and the architectural choices behind a headless tour library. Read these when you want to understand how something works under the hood, not just how to use the API.',
  geo: 'Generative Engine Optimization — making your product, docs, and content discoverable inside ChatGPT, Claude, Perplexity, and the new wave of AI search. We cover llms.txt manifests, structured data for AI ingestion (HowTo, FAQ, SoftwareApplication, Speakable), entity-first content design, and the difference between traditional SEO and being cited by an LLM. Practical playbooks for engineers and developer-relations teams who want their product to show up when an AI is asked "how do I add an onboarding tour to React?"',
  glossary:
    'Plain-language definitions of the terms developers, PMs, and growth teams actually use when talking about product tours, onboarding flows, feature adoption, in-app messaging, and user activation. Each entry is a self-contained reference page: definition, when it matters, the metrics that surround it, and how it shows up in real product work. Bookmark this if you are new to the space or onboarding teammates.',
  industry:
    'How product tours and onboarding play out across specific industries — SaaS, fintech, devtools, e-commerce, healthcare, education, and developer platforms. Each guide covers the regulatory constraints, the user expectations, the activation metrics that move the needle, and the patterns that work (and the ones that backfire) for that vertical. Sector-specific advice you cannot get from a generic "best practices" post.',
  'industry-guides':
    'How product tours and onboarding play out across specific industries — SaaS, fintech, devtools, e-commerce, healthcare, education, and developer platforms. Each guide covers the regulatory constraints, the user expectations, the activation metrics that move the needle, and the patterns that work (and the ones that backfire) for that vertical. Sector-specific advice you cannot get from a generic "best practices" post.',
  integrations:
    'Step-by-step integration guides for the tools you already use: Next.js, Remix, Vite, React Router, TanStack Router, Supabase, Clerk, Auth0, Mixpanel, PostHog, Segment, Amplitude, LaunchDarkly, GrowthBook, and shadcn/ui. Each tutorial ships with a working code repo, type-safe React snippets, and notes on the framework-specific edge cases (App Router hydration, route adapters, analytics deduplication). Drop these into your stack and ship.',
  listicle:
    'Curated lists for builders deciding what to use: best React onboarding libraries, top accessibility-focused tour tools, fastest open-source alternatives, the most thoughtfully designed onboarding flows in production, and tooling roundups for product-led growth. Each list is opinionated, dated, and ranked by criteria we publish — not affiliate fees.',
  listicles:
    'Curated lists for builders deciding what to use: best React onboarding libraries, top accessibility-focused tour tools, fastest open-source alternatives, the most thoughtfully designed onboarding flows in production, and tooling roundups for product-led growth. Each list is opinionated, dated, and ranked by criteria we publish — not affiliate fees.',
  metrics:
    'The numbers that matter for onboarding and product tours: activation rate, time-to-value, feature adoption, tooltip CTR, completion rate, drop-off curves, North-Star metrics, and how to instrument them without polluting your analytics. We cover what each metric measures, how to calculate it correctly, common pitfalls, and the dashboards that actually drive product decisions.',
  'metrics-analytics':
    'The numbers that matter for onboarding and product tours: activation rate, time-to-value, feature adoption, tooltip CTR, completion rate, drop-off curves, North-Star metrics, and how to instrument them without polluting your analytics. We cover what each metric measures, how to calculate it correctly, common pitfalls, and the dashboards that actually drive product decisions.',
  'pillar-pages':
    'Comprehensive, deeply-linked guides that cover an entire topic end-to-end: product tours in React, the complete onboarding playbook, accessibility for in-app guidance, headless UI patterns, and the modern feature-adoption stack. These are the articles you bookmark, share with the team, and come back to. Each one links out to the focused tutorials and comparisons that go deeper.',
  'thought-leadership':
    'Opinions, predictions, and field notes on where product onboarding is going: the rise of headless UI, the death of one-size-fits-all SaaS, AI-driven personalization, the developer experience of growth tools, and what the next generation of in-app guidance looks like. Less playbook, more perspective.',
  tutorial:
    'Hands-on tutorials with copy-pasteable code: building your first product tour in React, adding a tour to a Next.js App Router app, integrating with shadcn/ui, persisting tour state, customizing the spotlight, and shipping accessible tours that pass a Lighthouse audit. Each tutorial is end-to-end — start with `pnpm add` and finish with a running demo.',
  tutorials:
    'Hands-on tutorials with copy-pasteable code: building your first product tour in React, adding a tour to a Next.js App Router app, integrating with shadcn/ui, persisting tour state, customizing the spotlight, and shipping accessible tours that pass a Lighthouse audit. Each tutorial is end-to-end — start with `pnpm add` and finish with a running demo.',
  'use-cases':
    'Real-world use cases for product tours and in-app guidance: new-user onboarding, feature launches, contextual help, internal tool training, ticket deflection, upgrade prompts, and re-engagement flows for dormant users. Each post breaks down the user-journey, the trigger logic, the success metric, and the implementation pattern in code.',
}

/** Look up the SEO intro paragraph for a category landing page. Returns undefined when no intro is registered. */
export function getCategoryIntro(categorySlug: string): string | undefined {
  return CATEGORY_INTROS[categorySlug]
}

export function getPaginatedBlogPosts(page: number) {
  const allPosts = getPublishedBlogPosts()
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE)
  const start = (page - 1) * POSTS_PER_PAGE
  const posts = allPosts.slice(start, start + POSTS_PER_PAGE)

  return { posts, totalPages, currentPage: page, totalPosts: allPosts.length }
}

export function getBlogPageCount(): number {
  return Math.ceil(getPublishedBlogPosts().length / POSTS_PER_PAGE)
}

/** Get previous and next posts for navigation. */
export function getAdjacentPosts(slug: string): {
  prev: Pick<BlogMeta, 'slug' | 'title'> | null
  next: Pick<BlogMeta, 'slug' | 'title'> | null
} {
  const posts = getPublishedBlogPosts()
  const index = posts.findIndex((p) => p.slug === slug)
  if (index === -1) return { prev: null, next: null }

  const prev = index > 0 ? { slug: posts[index - 1].slug, title: posts[index - 1].title } : null
  const next =
    index < posts.length - 1 ? { slug: posts[index + 1].slug, title: posts[index + 1].title } : null

  return { prev, next }
}

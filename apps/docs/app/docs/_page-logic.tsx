import { MarkdownCopyButton, ViewOptionsPopover } from '@/components/ai/page-actions'
import { DocsByline } from '@/components/article/docs-byline'
import { DEFAULT_AUTHOR } from '@/lib/authors'
import { SITE_LAUNCH_FALLBACK, getGitFirstCommitted, getGitLastModified } from '@/lib/git-dates'
import { source } from '@/lib/source'
import {
  DEFAULT_SPEAKABLE_SELECTORS,
  FAQJsonLd,
  HowToJsonLd,
  SoftwareSourceCodeJsonLd,
  SpeakableJsonLd,
  TechArticleJsonLd,
} from '@/lib/structured-data'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

const SITE_URL = 'https://usertourkit.com'

// TOC titles are ReactNode. For simple headings they wrap as <a>Heading Text</a>.
// Recurse through children to extract plain text.
function stringifyReactNode(node: unknown): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (node == null || typeof node === 'boolean') return ''
  if (Array.isArray(node)) return node.map(stringifyReactNode).join('')
  if (typeof node === 'object' && node !== null && 'props' in node) {
    const props = (node as { props?: { children?: unknown } }).props
    if (props && 'children' in props) return stringifyReactNode(props.children)
  }
  return ''
}

function tocTitleToString(title: unknown): string {
  return stringifyReactNode(title).replace(/\s+/g, ' ').trim()
}

// ── FAQ Data (inline — Fumadocs default schema doesn't support custom frontmatter) ──

const FAQ_DATA: Record<string, { question: string; answer: string }[]> = {
  'getting-started/installation': [
    {
      question: 'How do I install userTourKit?',
      answer:
        'Run pnpm add @tour-kit/core @tour-kit/react to install both packages. You can also use npm, yarn, or bun as your package manager.',
    },
    {
      question: 'Does userTourKit work with Next.js?',
      answer:
        'Yes, userTourKit works with Next.js App Router and Pages Router. Wrap your layout with TourProvider and use the Next.js App Router adapter for multi-page tours.',
    },
    {
      question: "What are userTourKit's peer dependencies?",
      answer:
        'userTourKit requires React 18+ and React DOM 18+ as peer dependencies. TypeScript 4.7+ is recommended but not required.',
    },
    {
      question: 'Which userTourKit packages should I install?',
      answer:
        '@tour-kit/react is the main package for most projects. It includes @tour-kit/core automatically. Add @tour-kit/hints for feature discovery beacons.',
    },
  ],
  'getting-started/quick-start': [
    {
      question: 'How do I create my first product tour?',
      answer:
        'Wrap your app with TourProvider, add Tour with TourStep children that target elements via CSS selectors, and call useTour().start() to launch the tour.',
    },
    {
      question: 'What is the minimum code for a userTourKit tour?',
      answer:
        'Import Tour and TourStep from @tour-kit/react, define steps with target selectors and content, then trigger the tour with the useTour hook.',
    },
    {
      question: 'How do I target specific elements in a tour step?',
      answer:
        'Use the target prop on TourStep with a CSS selector string like "#my-button" or ".feature-card". userTourKit will highlight and position the tooltip near that element.',
    },
  ],
  'core/hooks/use-tour': [
    {
      question: 'What does the useTour hook return?',
      answer:
        'useTour returns isActive, currentStep, currentStepIndex, totalSteps, and actions: start(), next(), prev(), skip(), and complete() for controlling tour state.',
    },
    {
      question: 'How do I programmatically start a tour?',
      answer:
        'Call const { start } = useTour() and invoke start() from a button click handler or useEffect. You can optionally pass a step index to start at a specific step.',
    },
    {
      question: 'Can I have multiple tours on one page?',
      answer:
        'Yes, use TourKitProvider at the app level and give each Tour a unique id. Use useTour({ tourId }) to control a specific tour instance.',
    },
    {
      question: 'How do I listen for tour events?',
      answer:
        'Pass onStart, onComplete, onSkip, and onStepChange callback props to the Tour component. These fire at each lifecycle event with tour state.',
    },
  ],
  'core/hooks/use-step': [
    {
      question: 'How do I access the current step data?',
      answer:
        'Call useStep() inside a Tour to get the current step object, index, isFirst, isLast, and progress with percentage and fraction values.',
    },
    {
      question: 'How do I navigate between steps programmatically?',
      answer:
        'Use useTour() which returns next() and prev() functions. Call next() to advance or prev() to go back. useStep provides the current position data.',
    },
    {
      question: 'What data does the step object contain?',
      answer:
        'Each step has target (CSS selector), content (React node), placement (tooltip position), title, and optional advanceOn trigger configuration.',
    },
  ],
  'react/components/tour': [
    {
      question: 'How do I define tour steps?',
      answer:
        'Add TourStep children inside a Tour component. Each TourStep takes a target selector, placement direction, and content as children or render prop.',
    },
    {
      question: 'How do I customize the tour card appearance?',
      answer:
        'Use the TourCard compound component with TourCardHeader, TourCardContent, and TourCardFooter sub-components. Or use headless mode for complete control.',
    },
    {
      question: 'What props does the Tour component accept?',
      answer:
        'Tour accepts id (required), autoStart, startAt, keyboard config, spotlight config, and lifecycle callbacks like onStart, onComplete, and onSkip.',
    },
    {
      question: 'How do I add a spotlight overlay to the tour?',
      answer:
        'Add TourOverlay as a child of Tour. It automatically highlights the current step target with a dimmed backdrop and configurable padding.',
    },
  ],
  'react/components/tour-card': [
    {
      question: 'What props does TourCard accept?',
      answer:
        'TourCard is a compound component accepting className and asChild props. Use TourCardHeader, TourCardContent, and TourCardFooter as children.',
    },
    {
      question: 'How do I style the tour card?',
      answer:
        'Apply CSS classes via className prop, use CSS variables for theming, or use Tailwind utilities. For full control, use HeadlessTourCard with render props.',
    },
    {
      question: 'How do I add navigation buttons to the tour card?',
      answer:
        'Place TourNavigation inside TourCardFooter. It renders previous/next buttons automatically with disabled states based on step position.',
    },
  ],
  'react/headless': [
    {
      question: 'What is headless mode in userTourKit?',
      answer:
        'Headless components provide tour logic without any styling. They expose state and actions via render props so you can build a completely custom UI.',
    },
    {
      question: 'How do I build a custom tour UI?',
      answer:
        'Import HeadlessTourCard from @tour-kit/react/headless and use its render prop to access step data, positioning, and navigation actions for your own components.',
    },
    {
      question: 'What headless components are available?',
      answer:
        'userTourKit provides HeadlessTourCard, HeadlessTourOverlay, HeadlessTourNavigation, and HeadlessTourProgress as unstyled primitives with render props.',
    },
    {
      question: 'Can I mix styled and headless components?',
      answer:
        'Yes, you can use pre-styled components like TourOverlay alongside headless ones like HeadlessTourCard in the same tour for maximum flexibility.',
    },
  ],
  'guides/accessibility': [
    {
      question: 'Is userTourKit accessible?',
      answer:
        'Yes, userTourKit targets WCAG 2.1 AA compliance with built-in focus trapping, ARIA attributes, keyboard navigation, screen reader announcements, and reduced motion support.',
    },
    {
      question: 'How does userTourKit handle focus management?',
      answer:
        'userTourKit uses the useFocusTrap hook to trap keyboard focus within the active tour step. Focus returns to the trigger element when the tour ends.',
    },
    {
      question: 'Does userTourKit support screen readers?',
      answer:
        'Yes, tour steps use ARIA live regions for announcements, role="dialog" for the card, and aria-describedby to connect step content with the target element.',
    },
    {
      question: 'How do I respect prefers-reduced-motion?',
      answer:
        'userTourKit automatically detects the prefers-reduced-motion media query and disables animations. The useMediaQuery hook lets you customize behavior further.',
    },
  ],
  hints: [
    {
      question: 'What are hints in userTourKit?',
      answer:
        'Hints are non-blocking UI elements like pulsing beacons and floating tooltips that highlight features. Unlike tours, hints are independent and do not follow a sequence.',
    },
    {
      question: 'How do I show a hint beacon on an element?',
      answer:
        'Use the Hint component with HintHotspot for the pulsing beacon and HintTooltip for the floating content. Target elements with CSS selectors.',
    },
    {
      question: 'How do hints differ from tours?',
      answer:
        'Tours are sequential multi-step guides. Hints are standalone, always-visible indicators that draw attention to individual features without interrupting user flow.',
    },
    {
      question: 'Can I persist hint dismissals?',
      answer:
        'Yes, @tour-kit/hints supports localStorage and custom storage adapters to remember which hints a user has dismissed across sessions.',
    },
  ],
  'examples/basic-tour': [
    {
      question: 'How do I create a basic multi-step tour?',
      answer:
        'Define a Tour with TourStep children targeting elements by CSS selector. Add TourCard for content, TourOverlay for spotlight, and TourNavigation for step buttons.',
    },
    {
      question: 'How do I handle tour completion?',
      answer:
        'Pass an onComplete callback to the Tour component. It fires when the user reaches the last step and clicks finish, or when complete() is called programmatically.',
    },
    {
      question: 'How do I add keyboard navigation to a tour?',
      answer:
        'The Tour component supports keyboard navigation by default. Arrow keys navigate between steps, Escape closes the tour, and Tab cycles through focusable elements.',
    },
  ],
}

export async function renderDocsPage(slug: string[] | undefined) {
  const page = source.getPage(slug)
  if (!page) notFound()

  const MDXContent = page.data.body
  const slugPath = page.slugs.join('/')
  const section = page.slugs[0]
  const faqItems = FAQ_DATA[slugPath]
  const isApiPage = section === 'api'

  const howToSteps =
    page.data.howto === true
      ? (page.data.toc ?? [])
          .filter((t) => t.depth === 2)
          .map((t) => {
            const name = tocTitleToString(t.title)
            return {
              name,
              text: name,
              url: `${SITE_URL}${page.url}${t.url}`,
            }
          })
          .filter((step) => step.name.length > 0)
      : []

  const absPath = page.absolutePath
  const firstCommitted = absPath ? getGitFirstCommitted(absPath) : null
  const lastModified = absPath ? getGitLastModified(absPath) : null
  const datePublished = firstCommitted ? firstCommitted.toISOString() : SITE_LAUNCH_FALLBACK
  const dateModified = lastModified ? lastModified.toISOString() : SITE_LAUNCH_FALLBACK

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <TechArticleJsonLd
        title={page.data.title}
        description={page.data.description ?? ''}
        url={page.url}
        section={section}
        datePublished={datePublished}
        dateModified={dateModified}
      />
      {isApiPage && (
        <SoftwareSourceCodeJsonLd
          title={page.data.title}
          description={page.data.description ?? ''}
          url={page.url}
          programmingLanguage="TypeScript"
          runtimePlatform="Node.js"
        />
      )}
      {howToSteps.length >= 2 && (
        <HowToJsonLd
          name={page.data.title}
          description={page.data.description ?? ''}
          steps={howToSteps}
        />
      )}
      {faqItems && <FAQJsonLd items={faqItems} />}
      <SpeakableJsonLd
        url={page.url}
        cssSelectors={[
          ...DEFAULT_SPEAKABLE_SELECTORS,
          // Fumadocs-specific: DocsTitle renders an <h1>, DocsDescription a <p>.
          'main h1',
          'main h1 + p',
          'main h2 + p',
        ]}
      />
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsByline
        author={DEFAULT_AUTHOR}
        datePublished={datePublished}
        dateModified={dateModified}
      />
      <div className="mt-4 flex flex-row items-center gap-2 border-b border-fd-border pb-4 pt-2">
        <MarkdownCopyButton markdownUrl={`${page.url}.mdx`} />
        <ViewOptionsPopover
          markdownUrl={`${page.url}.mdx`}
          githubUrl={`https://github.com/domidex01/tour-kit/blob/main/apps/docs/content/docs/${page.slugs.join('/')}.mdx`}
        />
      </div>
      <DocsBody>
        <MDXContent components={{ ...defaultMdxComponents, Tab, Tabs }} />
      </DocsBody>
    </DocsPage>
  )
}

const SECTION_LABELS: Record<string, string> = {
  'getting-started': 'GETTING STARTED',
  core: 'CORE',
  react: 'REACT',
  hints: 'HINTS',
  adoption: 'ADOPTION',
  analytics: 'ANALYTICS',
  announcements: 'ANNOUNCEMENTS',
  checklists: 'CHECKLISTS',
  media: 'MEDIA',
  scheduling: 'SCHEDULING',
  surveys: 'SURVEYS',
  guides: 'GUIDE',
  examples: 'EXAMPLE',
  api: 'API',
}

function buildDocsOgUrl(title: string, description: string, section: string | undefined): string {
  const params = new URLSearchParams({ title })
  if (description) params.set('subtitle', description)
  if (section) {
    const label = SECTION_LABELS[section] ?? 'DOCS'
    params.set('category', label)
  } else {
    params.set('category', 'DOCS')
  }
  return `/api/og?${params.toString()}`
}

export async function getDocsMetadata(slug: string[] | undefined): Promise<Metadata> {
  const page = source.getPage(slug)
  if (!page) return {}

  const ogImage = buildDocsOgUrl(page.data.title, page.data.description ?? '', page.slugs[0])

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: { canonical: page.url },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    openGraph: {
      title: page.data.title,
      description: page.data.description,
      type: 'article',
      url: page.url,
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.data.title,
      description: page.data.description,
      images: [ogImage],
    },
  }
}

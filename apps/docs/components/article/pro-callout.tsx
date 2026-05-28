import { TrackedCtaLink } from '@/components/analytics/tracked-cta-link'
import { ArrowRight } from 'lucide-react'

/**
 * The eight Pro packages a free-package docs page can cross-sell to. Matches
 * the `proCrossSell` frontmatter enum in `source.config.ts`.
 */
export type ProPackage =
  | 'adoption'
  | 'announcements'
  | 'checklists'
  | 'surveys'
  | 'ai'
  | 'media'
  | 'analytics'
  | 'scheduling'

interface CrossSell {
  /** npm package name, shown as the eyebrow code. */
  name: string
  /** Outcome-led headline — what the reader gets by adding this package. */
  title: string
  /** One line of supporting context. */
  body: string
}

const CROSS_SELL: Record<ProPackage, CrossSell> = {
  checklists: {
    name: '@tour-kit/checklists',
    title: 'Turn this tour into a guided onboarding checklist',
    body: 'Multi-step onboarding with task dependencies and progress tracking — the natural next step after a tour.',
  },
  adoption: {
    name: '@tour-kit/adoption',
    title: 'Measure whether the feature actually gets adopted',
    body: 'Track adoption of the feature this tour introduces, and nudge the users who stall.',
  },
  announcements: {
    name: '@tour-kit/announcements',
    title: 'Announce new features with the same toolkit',
    body: 'Modals, toasts, banners, and changelogs that share your tour styling and analytics.',
  },
  surveys: {
    name: '@tour-kit/surveys',
    title: 'Ask for feedback right after the tour',
    body: 'In-app NPS, CSAT, and CES microsurveys with built-in fatigue prevention.',
  },
  ai: {
    name: '@tour-kit/ai',
    title: 'Add an AI assistant that answers in context',
    body: 'Let users ask product questions and get guided to the right feature.',
  },
  media: {
    name: '@tour-kit/media',
    title: 'Embed video and animation in your steps',
    body: 'YouTube, Vimeo, Loom, Wistia, GIF, and Lottie embeds for richer, more visual tours.',
  },
  analytics: {
    name: '@tour-kit/analytics',
    title: 'Pipe tour events into your analytics stack',
    body: 'A plugin-based bridge to the tools you already use — one integration, every event.',
  },
  scheduling: {
    name: '@tour-kit/scheduling',
    title: 'Show tours on a time-based schedule',
    body: 'Timezone-aware scheduling and recurring patterns for when tours and announcements appear.',
  },
}

interface ProCalloutProps {
  /** Which Pro package to cross-sell. Driven by the `proCrossSell` frontmatter. */
  package: ProPackage
}

/**
 * Inline Pro cross-sell rendered mid-article on free-package docs pages (driven
 * by the `proCrossSell` frontmatter field; see `app/docs/_page-logic.tsx`).
 *
 * The biggest conversion lever for Tour Kit Pro is *adoption*: the production
 * watermark only sells the one-time $99 license once a reader actually ships a
 * Pro package. Free-package docs are the largest engaged surface, so this routes
 * those readers toward the relevant Pro package. Keeps the same free-first voice
 * as the blog/home/docs CTAs — Pro packages run unlicensed in development; the
 * $99 license removes the production watermark when you ship.
 *
 * Compact (`not-prose`, left of an end-of-page band) so it reads as part of the
 * article, not an interstitial. Distinct from `DocsCta` (the end-of-page footer
 * band that renders after `<DocsBody>` on every docs page).
 */
export function ProCallout({ package: pkg }: ProCalloutProps) {
  const cross = CROSS_SELL[pkg]

  return (
    <aside
      aria-label={`Pro package: ${cross.name}`}
      className="not-prose my-8 rounded-xl border border-[#0197f6]/30 bg-gradient-to-br from-[#0197f6]/5 to-transparent p-5 dark:from-[#0197f6]/10"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-[#0197f6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Pro
        </span>
        <code className="text-[12px] text-fd-muted-foreground">{cross.name}</code>
      </div>
      <p className="mt-2.5 font-semibold leading-snug text-fd-foreground">{cross.title}</p>
      <p className="mt-1 text-[14px] leading-relaxed text-fd-muted-foreground">{cross.body}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-fd-muted-foreground">
        Works unlicensed in development — a one-time $99 license removes the production watermark
        when you ship.
      </p>
      <TrackedCtaLink
        href={`/docs/${pkg}`}
        placement="docs_pro_callout"
        className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[#0197f6] transition-opacity hover:opacity-80"
      >
        Explore {cross.name}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </TrackedCtaLink>
    </aside>
  )
}

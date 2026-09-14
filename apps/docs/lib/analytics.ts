import { sendGAEvent } from '@next/third-parties/google'

/**
 * PostHog project key. Unset means PostHog never loads and none of its bytes
 * ship — the deployment runs on GA alone, which is the state `/legal/privacy`
 * describes when this is empty. Set in Dokploy, never in the repo.
 */
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? ''

export const POSTHOG_ENABLED = POSTHOG_KEY !== ''

/**
 * Same-origin ingestion path. PostHog is reached through the `/ingest`
 * rewrites in `next.config.mjs` rather than `eu.i.posthog.com` directly: this
 * audience blocks third-party trackers more than most, and a blocked request
 * is an event we never see. It also keeps `connect-src 'self'` in the CSP.
 */
export const POSTHOG_PROXY_PATH = '/ingest'

/** PostHog's own dashboard host, for the "open in PostHog" links it renders. */
export const POSTHOG_UI_HOST = 'https://eu.posthog.com'

type EventProps = Record<string, string | number | undefined>

/**
 * Send one funnel event to every analytics system, under the same name.
 *
 * The shared name is the point. GA and PostHog run side by side through the
 * migration, and the two are only comparable across that overlap window if
 * `pricing_buy_clicked` means the same thing in both. Fanning out from one
 * function makes that true by construction rather than by remembering to
 * update a second call site.
 */
export function trackEvent(name: string, props: EventProps): void {
  sendGAEvent('event', name, props)

  if (!POSTHOG_ENABLED) return
  // Dynamic so an unconfigured deployment ships no posthog-js at all. After
  // the provider's init the module is cached, so this is not a second fetch.
  void import('posthog-js')
    .then(({ default: posthog }) => posthog.capture(name, props))
    .catch(() => {
      // Analytics must never break a Buy click.
    })
}

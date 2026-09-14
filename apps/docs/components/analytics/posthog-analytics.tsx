'use client'

import { POSTHOG_ENABLED, POSTHOG_KEY, POSTHOG_PROXY_PATH, POSTHOG_UI_HOST } from '@/lib/analytics'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

/**
 * App Router does not fire a page load between client-side navigations, so
 * `capture_pageview` is off in init and pageviews are sent from here instead.
 *
 * The query string has to be part of it: the badge's only signal back to us is
 * the UTM on `/pricing?utm_source=unlicensed_badge&...`, and PostHog reads
 * `utm_*` off the captured URL automatically.
 */
function PostHogPageviews() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!POSTHOG_ENABLED || !pathname) return

    const query = searchParams.toString()
    const url = `${window.location.origin}${pathname}${query ? `?${query}` : ''}`

    void import('posthog-js').then(({ default: posthog }) => {
      posthog.capture('$pageview', { $current_url: url })
    })
  }, [pathname, searchParams])

  return null
}

/**
 * PostHog, EU Cloud, cookieless.
 *
 * `person_profiles: 'identified_only'` means anonymous visitors get no person
 * profile, and `persistence: 'localStorage'` means no cookie is ever set — so
 * the "we do not set tracking cookies" line on `/legal/privacy` is true of
 * PostHog rather than aspirational. Session recording is off explicitly: we
 * just removed Yandex webvisor for being undisclosed, and the privacy page now
 * states that we run none.
 */
export function PostHogAnalytics() {
  useEffect(() => {
    if (!POSTHOG_ENABLED) return

    void import('posthog-js').then(({ default: posthog }) => {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_PROXY_PATH,
        ui_host: POSTHOG_UI_HOST,
        person_profiles: 'identified_only',
        persistence: 'localStorage',
        capture_pageview: false,
        autocapture: false,
        disable_session_recording: true,
      })
    })
  }, [])

  // useSearchParams opts a route into client rendering unless it sits behind a
  // Suspense boundary; without this every page would stop being static.
  return (
    <Suspense fallback={null}>
      <PostHogPageviews />
    </Suspense>
  )
}

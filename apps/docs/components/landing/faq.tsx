'use client'

import { useState } from 'react'

const FAQ_ITEMS = [
  {
    q: 'Does it work with React 19, Next.js App Router, and Tailwind?',
    a: 'Yes to all three. First-class adapters ship for the Next.js App Router, Pages Router, React Router, and TanStack Router. No inline styles fighting Tailwind, no CSS injection, no global reset. shadcn/ui is the reference stack — if it renders in your app, userTourKit targets it.',
  },
  {
    q: 'Does it play nice with SSR and React Server Components?',
    a: 'Yes. Tour code is client-side only, marked with "use client". The core has zero DOM access outside effects, so SSR and streaming do not break. Drop a Tour inside a Server Component and it hydrates on the client like any interactive island.',
  },
  {
    q: 'Should we just build our own?',
    a: 'A production-grade tour engine — positioning, focus trap, keyboard nav, router integration, WCAG 2.1 AA — is 2–4 weeks of senior engineering time. At market rates that is $6,400–$24,000. userTourKit is $0 for the core and $99 one-time for the full suite. Ship the product, not the widget.',
  },
  {
    q: 'What does the $99 actually cover? Any seats, MAU, or usage caps?',
    a: 'One license, all eight Pro packages (analytics, checklists, announcements, adoption, scheduling, media, surveys, AI assistant), on up to 5 production domains. Lifetime updates. No per-seat, no MAU limits, no renewal invoice. Same model as Tailwind UI. In development and on localhost, everything runs without a key.',
  },
  {
    q: 'We already pay Appcues, Userpilot, or Pendo. Why switch?',
    a: 'Three reasons. (1) Cost — a $99 one-time line item versus $3,000–$48,000 per year. (2) Design — your components and tokens, not their iframe overlay fighting your CSS. (3) Control — tours live in your bundle, authenticated by your auth, logged by your logging. No vendor raising prices on you next quarter.',
  },
  {
    q: 'Can PMs and non-engineers create tours without filing a ticket?',
    a: 'Honestly, ask yourself how often that actually happens today. Most SaaS tour editors still need engineering to fix CSS, wire up dynamic targets, or handle SPA routing. With userTourKit, steps are just config — pair with a feature flag or a CMS-driven JSON feed and PMs can edit the copy without touching code. Or wire it to the (Pro) AI assistant and they can generate flows from a prompt.',
  },
  {
    q: 'How does it handle progress, completion, and returning users?',
    a: 'Out of the box, progress persists to localStorage keyed by tour ID — a returning user picks up where they left off, or skips tours they already finished. Swap in a custom storage adapter (cookies, your API, a server session) in a single line when you need cross-device or authenticated persistence.',
  },
  {
    q: 'What if my target element is not on the page yet, or gets removed?',
    a: 'The positioner uses a MutationObserver and re-queries on route changes — tours survive async mounts, route transitions, and conditional rendering. If a target disappears mid-tour, you pick: skip the step, pause until it returns, or fall back to a centered dialog. All three are one-line configs.',
  },
  {
    q: 'Does it phone home or track my users?',
    a: "No. The library ships zero telemetry — no analytics pings, no license check beacons during user sessions (activation happens once per domain and caches for 72 hours). Pro analytics are opt-in and route through your own PostHog, Mixpanel, Amplitude, or GA4. Your users' data never touches our infrastructure.",
  },
  {
    q: 'How painful is migrating from React Joyride or Shepherd?',
    a: 'Tour step configs map over near-directly — target selectors, titles, content, and placement keys are the same shape. The typical 5–10 step tour ports in under an hour. Migration guides with before/after diffs live in the docs for Joyride, Shepherd, Intro.js, and Driver.js.',
  },
  {
    q: 'What happens if the maintainer disappears?',
    a: 'MIT licensed. The code is in your node_modules and on GitHub — fork it, freeze it, patch it, your call. Unlike a SaaS where your tours vanish the day an invoice bounces, the worst case here is "no new features." You keep shipping.',
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="px-6 py-28 sm:px-8 md:py-36 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <div className="mx-auto mb-12 max-w-lg text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            The honest answers.
          </h2>
          <p className="text-[16px] leading-[1.6] text-fd-muted-foreground">
            What every developer asks before adding another dependency. No marketing spin.
          </p>
        </div>

        <div className="mx-auto max-w-3xl divide-y divide-fd-border overflow-hidden rounded-xl border border-fd-border bg-fd-card">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i
            const panelId = `home-faq-panel-${i}`
            const triggerId = `home-faq-trigger-${i}`
            return (
              <div key={item.q}>
                <button
                  type="button"
                  id={triggerId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left text-[15px] font-semibold text-fd-foreground transition-colors hover:bg-fd-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--tk-primary)]"
                >
                  {item.q}
                  <svg
                    className={`h-4 w-4 shrink-0 text-fd-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                <section
                  id={panelId}
                  aria-labelledby={triggerId}
                  hidden={!isOpen}
                  className={`grid transition-all duration-200 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-[14px] leading-relaxed text-fd-muted-foreground">
                      {item.a}
                    </p>
                  </div>
                </section>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

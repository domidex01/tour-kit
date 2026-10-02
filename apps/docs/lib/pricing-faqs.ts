// Single source of truth for the /pricing FAQ. Consumed by both the visible
// accordion (components/landing/pricing.tsx) and the FAQPage JSON-LD emitted
// once in app/pricing/page.tsx. Keep cost first — it's the top-asked question
// and the lead answer for AI/answer-engine extraction.
export interface PricingFaq {
  question: string
  answer: string
}

export const PRICING_FAQS: PricingFaq[] = [
  {
    question: 'How much does the userTourKit React product tour library cost?',
    answer:
      'Nothing. Every userTourKit package is MIT-licensed: tours, hints, checklists, announcements, surveys, analytics, scheduling, media, the AI assistant and the Vue and Svelte bindings. Use it in development and in production, commercially, on as many projects as you like. There is no licence key, no badge and no feature gate.',
  },
  {
    question: 'Why is there an "Unlicensed" badge on my site?',
    answer:
      'Your app runs an older version. Core, react and hints 3.0.x, and the extended packages released before October 2026, were published under commercial terms and showed that badge in production without a key. Update your @tour-kit packages to their latest versions and the badge is gone. No key and no code change needed.',
  },
  {
    question: 'I bought a licence key. What happens now?',
    answer:
      'You do not need it any more: the latest versions are MIT and never check a key. Your key keeps working on the older versions it was bought for, and nothing is revoked. Receipts and invoices stay available from your account page, and you can write to hello@usertourkit.com about anything else.',
  },
  {
    question: 'What is Tour Kit Cloud?',
    answer:
      'A hosted dashboard for Tour Kit, in development. The library stays MIT and complete without it. Join the waitlist on this page to hear when it opens.',
  },
  {
    question: 'What happens to my React onboarding flows if userTourKit is discontinued?',
    answer:
      'They keep working. The MIT licence lets you copy, modify and redistribute the source, so you can fork the version you have and keep building on it. Nothing in the library calls home, so there is no server whose shutdown could break your app. All source lives in a public monorepo at github.com/domidex01/tour-kit.',
  },
]

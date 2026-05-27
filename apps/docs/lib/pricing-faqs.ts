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
      'The free tier — @tour-kit/core, @tour-kit/react, and @tour-kit/hints — is MIT-licensed and costs nothing for any project, commercial or otherwise. The Pro tier is a single one-time payment of $99 for the eight extended packages (analytics, checklists, adoption, announcements, media, scheduling, surveys, AI chat). No subscription, no per-seat fee, no upgrade fee.',
  },
  {
    question: 'Is the userTourKit Pro license a subscription?',
    answer:
      'No. Pro is a one-time purchase. You pay $99 once and the license activates the version you bought, forever. The MIT core packages will keep working even if you never renew anything.',
  },
  {
    question: 'How many sites can I activate with one Pro license?',
    answer:
      'Up to five production domains per Pro license. Localhost, preview environments, and staging URLs are unrestricted. Each production activation is permanent — there is no monthly check-in or auto-deactivation.',
  },
  {
    question: 'Who handles checkout and tax for Pro purchases?',
    answer:
      'Checkout runs through Polar.sh as the merchant of record. They accept card, Apple Pay, Google Pay, and Link, and they calculate and remit VAT/sales tax automatically based on your billing country. Receipts and license keys arrive by email within minutes.',
  },
  {
    question: 'What happens to my React onboarding flows if userTourKit is discontinued?',
    answer:
      'The MIT core (core, react, hints) is forkable forever — any team can fork and ship indefinitely. The Pro license is perpetual, so the version you bought keeps working with no kill switch or phone-home. All source lives in a public monorepo at github.com/domidex01/tour-kit.',
  },
  {
    question: 'Do you offer refunds on the Pro license?',
    answer:
      "Yes. Polar.sh handles a 14-day no-questions-asked refund window from the purchase date. Refunds revoke the license key. After 14 days, refunds are case-by-case for genuine defects we can't fix in a reasonable window.",
  },
]

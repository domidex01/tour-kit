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
      'Everything is free while you build. Development, evaluation, testing, CI and preview deploys cost nothing and have no feature gates — you get every package. Serving Tour Kit to end users of a deployed application needs a one-time licence key: $9.99 for one project, $49.99 for five, $299.99 for unlimited. No subscription, no per-seat fee, no upgrade fee.',
  },
  {
    question: 'Is the userTourKit Pro license a subscription?',
    answer:
      'No. Every tier is a one-time purchase — you pay once and the key activates the version you bought, forever. On top of that, each published version converts to the MIT licence on its Change Date, so the code you shipped cannot be taken away from you.',
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
      'Three structural answers. (1) BSL 1.1 lets you copy, modify and redistribute the source today — you can fork the version you have and keep building on it. (2) The licence is perpetual, so the version you bought keeps working with no kill switch. (3) Each published version converts to the MIT licence on its Change Date, on a schedule stated in the licence file, so the code you shipped becomes fully permissive whatever happens to us. All source lives in a public monorepo at github.com/domidex01/tour-kit.',
  },
  {
    question: 'Do you offer refunds on the Pro license?',
    answer:
      "Yes. Polar.sh handles a 14-day no-questions-asked refund window from the purchase date. Refunds revoke the license key. After 14 days, refunds are case-by-case for genuine defects we can't fix in a reasonable window.",
  },
]

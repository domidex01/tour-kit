# Your Product Tour Shouldn't End at the Browser Tab

## How to connect in-app onboarding to email with React Email and Resend

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-react-email-onboarding-emails)*

Most product tours end when the user clicks "Done." The tooltip disappears, and then silence. If that user doesn't come back tomorrow, the tour was wasted effort. The fix isn't a better tooltip — it's an email that lands 24 hours later, picking up exactly where the tour left off.

Cross-channel onboarding campaigns are roughly 2x as effective as single-channel approaches, boosting retention by 130% compared to 71% for in-app messages alone (Braze, 2025). But most teams treat email and in-app as separate systems built by separate people. The onboarding email says "Check out Feature X" while the product tour already showed Feature X yesterday.

## The approach

React Email turns emails into React components. Tour Kit gives you lifecycle callbacks for every tour event. Connect them with a simple API route:

1. Tour Kit's `onTourEnd` fires when the user finishes or abandons the tour
2. A Next.js API route receives the event with step completion data
3. React Email renders a template with that data as props
4. Resend delivers the email

The key insight: behavior-based email sequences convert 30% better than fixed drip schedules (Encharge). When you know which tour steps a user skipped, the follow-up email writes itself.

## What makes this work

React Email has 920,325 weekly npm downloads as of April 2026. The entire email is a function that receives props and returns markup. No Handlebars. No drag-and-drop editor. Just TypeScript. You can pass tour completion data — step count, skipped features, last active step — directly into the email template.

One gotcha: React Email's Tailwind package pulls in 6.5 MB at build time. This only affects the server since emails render to static HTML, but it's surprising on first install.

## The missing pattern

Nobody has written about connecting product tour analytics events to email sequences. Every article covers either tours OR email — never the bridge. The cross-channel deduplication pattern (checking if a user already discovered a feature via tour before emailing about it) prevents the most annoying pattern in onboarding: telling users about something they already know.

Research suggests 5-7 emails over 14 days hits the sweet spot. Well-tuned sequences achieve 14-25% trial-to-paid conversion rates, compared to 2-5% for generic drip campaigns.

Full implementation with code examples: [usertourkit.com/blog/tour-kit-react-email-onboarding-emails](https://usertourkit.com/blog/tour-kit-react-email-onboarding-emails)

---

*Suggested publications: JavaScript in Plain English, Better Programming, Bits and Pieces*

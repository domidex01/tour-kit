## Thread (6 tweets)

**1/** 68% of fintech users abandon onboarding. KYC flows hit 70-80% dropout.

Product tours help — but in regulated apps, most tour libraries create new compliance problems.

Here's what I learned building tours for fintech:

**2/** Problem #1: PII in analytics.

Your tour targets a form with an SSN field. Your analytics callback auto-captures the target element's content.

Congratulations, you just sent PII to PostHog.

Fix: explicit payload construction. Send only step ID + timestamp. Never field values.

**3/** Problem #2: GDPR consent timing.

Most tour libraries auto-initialize on mount — writing to localStorage before the user consents.

In the EU, that's a violation before the user's first click.

Fix: lazy initialization. Don't mount the provider until consent is captured.

**4/** Problem #3: SaaS tour tools expand your PCI DSS scope.

Appcues, Pendo, Intercom inject JS with full DOM read/write access.

In a fintech app with payment inputs, your auditor will flag this.

Code-owned tours = no third-party DOM access = no scope change.

**5/** The accessibility gap is a legal gap.

70% of European fintechs fail basic WCAG requirements (TestDevLab).

The European Accessibility Act enforces WCAG 2.1 AA since June 2025.

Tour overlays without focus trapping, ARIA labels, and reduced-motion support are compliance violations.

**6/** Full guide with TypeScript code examples for:
- PII-safe analytics callbacks
- Consent-gated tour initialization
- KYC-aware tour branching
- Audit trail integration

https://usertourkit.com/blog/product-tours-fintech-compliance-onboarding

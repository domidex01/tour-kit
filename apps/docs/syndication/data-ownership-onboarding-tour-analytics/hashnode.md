---
title: "Data ownership in onboarding: who owns your tour analytics?"
slug: "data-ownership-onboarding-tour-analytics"
canonical: https://usertourkit.com/blog/data-ownership-onboarding-tour-analytics
tags: react, javascript, web-development, privacy, open-source
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/data-ownership-onboarding-tour-analytics)*

# Data ownership in onboarding: who owns your tour analytics?

You shipped a 7-step onboarding tour last quarter. It runs through Pendo. Users complete it, skip steps, drop off at step 4. All of that behavior data, hundreds of thousands of events per month for a 10,000 MAU product, sits on Pendo's servers. Accessed through Pendo's dashboard. Exported through Pendo's API at Pendo's rate limits.

You call it "your data." But can you actually take it with you?

As of April 2026, most SaaS onboarding tools operate as data custodians, not partners. They hold your tour analytics in proprietary formats, behind premium export tiers, subject to retention policies you didn't write. The EU Data Act (enforced September 2025) now requires machine-readable exports at no cost, but compliance across onboarding vendors remains inconsistent at best.

## The ownership illusion in SaaS onboarding

Most product teams assume they own their tour analytics because the data describes their users, but that assumption crumbles the moment you try to migrate. As of April 2026, Pendo stores analytics on vendor-managed cloud infrastructure with proprietary API export, Appcues offers CSV via async polling, and WalkMe requires manual requests with 90-day processing windows.

Onur Alp Soner, CEO at Countly: "When you rely on third-party tools, you're essentially renting insight. The data might live on someone else's servers, and you access it via their interfaces" ([Countly Blog](https://countly.com/blog/data-ownership)).

| Dimension | Pendo | Appcues | WalkMe | Code-owned |
|---|---|---|---|---|
| Data location | Vendor cloud | Vendor cloud | US or EU data center | Your app + your DB |
| Export formats | API (proprietary) | CSV, JSON via async API | By request (90-day processing) | Direct DB/localStorage |
| Retention control | Per vendor ToS | Per vendor ToS | 7 years max (personal data) | Full control |
| Vendor lock-in risk | High | Medium | High | None |
| DPA required | Yes | Yes | Yes | No |

WalkMe retains personal data for up to 7 years and processes deletion requests within 90 days. That's three months between "delete my users' data" and it actually happening.

## What GDPR actually requires

Under GDPR, the company deploying an onboarding tool is the data controller, and the vendor is the data processor. GDPR Article 28 mandates a Data Processing Agreement, subject access requests require a 30-day response window, and 94% of businesses agree that insufficient data protection discourages customers (IAPP, 2023).

Three requirements:

1. **A Data Processing Agreement is mandatory.** If your vendor hasn't signed one, you're in violation of GDPR Article 28.
2. **You must be able to delete and export user data on demand.** SARs have a 30-day window. If your vendor takes 90 days, you fail the deadline.
3. **Data minimization isn't optional.** SaaS tools collecting IP addresses and geolocation by default put the justification burden on you.

Code-owned solutions sidestep this entirely. No processor. No DPA. No third-party retention policy.

## The EU Data Act changes the calculus

Since September 2025, the EU Data Act requires SaaS vendors to provide data exports in structured, machine-readable formats at no additional cost. Penalties can reach 2% of annual global turnover. As of April 2026, no major onboarding vendor has publicly documented compliance.

Thirteen US states now have consumer privacy laws in effect or pending. GDPR fines totaled over EUR 4.5 billion between 2018 and 2025.

## What code-owned onboarding looks like

Tour logic ships in your application bundle at under 8KB gzipped. Analytics pipe through your existing infrastructure. No third-party JavaScript loads on your users' pages.

```tsx
// src/components/OnboardingTour.tsx
import { TourProvider } from '@tourkit/react';
import posthog from 'posthog-js';

const tourAnalytics = {
  onStepView: (stepId: string) => {
    posthog.capture('tour_step_viewed', { step: stepId });
  },
  onStepComplete: (stepId: string) => {
    posthog.capture('tour_step_completed', { step: stepId });
  },
  onTourComplete: (tourId: string) => {
    posthog.capture('tour_completed', { tour: tourId });
  },
  onTourDismiss: (tourId: string, stepId: string) => {
    posthog.capture('tour_dismissed', { tour: tourId, step: stepId });
  },
};

export function OnboardingTour({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider analytics={tourAnalytics}>
      {children}
    </TourProvider>
  );
}
```

Fifteen lines of adapter code. Swap PostHog for Mixpanel or Plausible without touching your tour configuration.

## The data sovereignty checklist

1. Can you export all tour analytics in CSV/JSON/Parquet without contacting support?
2. Do you have a signed DPA?
3. What happens to your data if the vendor shuts down?
4. Can you satisfy a GDPR deletion request within 30 days using only vendor tools?
5. Is your tour analytics data in your disaster recovery plan?

The average data breach cost: $4.45 million in 2023, up 15% over three years (IBM). 92% of companies acknowledge inadequate data security discourages purchases (Cisco).

---

*We built Tour Kit, so take our take with appropriate skepticism. Every claim is verifiable against public vendor documentation.*

*Get started: [usertourkit.com](https://usertourkit.com/) | [GitHub](https://github.com/domidex01/tour-kit)*

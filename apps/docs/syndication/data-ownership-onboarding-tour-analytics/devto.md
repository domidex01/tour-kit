---
title: "Who actually owns your product tour analytics? (It's not who you think)"
published: false
description: "SaaS onboarding tools hold your tour data in proprietary formats with 90-day deletion windows. Here's what GDPR, the EU Data Act, and vendor ToS actually say about data ownership."
tags: react, webdev, javascript, opensource
canonical_url: https://usertourkit.com/blog/data-ownership-onboarding-tour-analytics
cover_image: https://usertourkit.com/og-images/data-ownership-onboarding-tour-analytics.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/data-ownership-onboarding-tour-analytics)*

# Data ownership in onboarding: who owns your tour analytics?

You shipped a 7-step onboarding tour last quarter. It runs through Pendo. Users complete it, skip steps, drop off at step 4. All of that behavior data, hundreds of thousands of events per month for a 10,000 MAU product, sits on Pendo's servers. Accessed through Pendo's dashboard. Exported through Pendo's API at Pendo's rate limits.

You call it "your data." But can you actually take it with you?

As of April 2026, most SaaS onboarding tools operate as data custodians, not partners. They hold your tour analytics in proprietary formats, behind premium export tiers, subject to retention policies you didn't write. The EU Data Act (enforced September 2025) now requires machine-readable exports at no cost, but compliance across onboarding vendors remains inconsistent at best.

## The ownership illusion in SaaS onboarding

Most product teams assume they own their tour analytics because the data describes their users, but that assumption crumbles the moment you try to migrate. As of April 2026, Pendo stores analytics on vendor-managed cloud infrastructure with proprietary API export, Appcues offers CSV via async polling, and WalkMe requires manual requests with 90-day processing windows.

Onur Alp Soner, CEO at Countly, put it plainly: "When you rely on third-party tools, you're essentially renting insight. The data might live on someone else's servers, and you access it via their interfaces" ([Countly Blog](https://countly.com/blog/data-ownership)).

Here's what "ownership" actually looks like across major vendors:

| Dimension | Pendo | Appcues | WalkMe | Code-owned |
|---|---|---|---|---|
| Data location | Vendor cloud | Vendor cloud | US or EU data center | Your app + your DB |
| Export formats | API (proprietary) | CSV, JSON via async API | By request (90-day processing) | Direct DB/localStorage |
| Retention control | Per vendor ToS | Per vendor ToS | 7 years max (personal data) | Full control |
| Vendor lock-in risk | High | Medium | High | None |
| DPA required | Yes | Yes | Yes | No |

WalkMe retains personal data for up to 7 years for backup and litigation purposes, and processes deletion requests within 90 days ([WalkMe Support](https://support.walkme.com/knowledge-base/what-data-does-walkme-collect/)). That's three months between "delete my users' data" and it actually happening.

## What GDPR actually requires (and what vendors don't tell you)

Under GDPR, the company deploying an onboarding tool is the data controller, and the vendor is the data processor. This distinction carries real consequences: GDPR Article 28 mandates a Data Processing Agreement, subject access requests require a 30-day response window, and 94% of businesses agree that insufficient data protection discourages customers (IAPP, 2023).

Three requirements flow from this:

1. **A Data Processing Agreement is mandatory.** Every SaaS onboarding vendor must sign a DPA with you. If they haven't, you're in violation of GDPR Article 28 right now.

2. **You must be able to delete and export user data on demand.** Subject access requests (SARs) have a 30-day response window. If your vendor takes 90 days to process a deletion request, you're the one who fails the compliance deadline.

3. **Data minimization isn't optional.** The Usetiful blog states it clearly: "For every variable stored or user profile maintained, you must have a legitimate reason" ([Usetiful](https://blog.usetiful.com/2021/03/user-onboarding-tools-and-gdpr.html)).

Code-owned solutions sidestep this entirely. When tour analytics stay in your application's own database, there is no processor. No DPA. No third-party retention policy.

## The EU Data Act changes the calculus

Since September 2025, the EU Data Act requires SaaS vendors to provide data exports in structured, machine-readable formats at no additional cost. Penalties for non-compliance can reach 2% of annual global turnover ([AssetBank](https://www.assetbank.co.uk/blog/eu-data-act-dam-vendor-lock-in-portability)).

As of April 2026, no major onboarding vendor has publicly documented how they comply. Thirteen US states now have consumer privacy laws in effect or pending. GDPR fines totaled over EUR 4.5 billion between 2018 and 2025.

Compare that to a code-owned architecture: your tour analytics live in your database. Export means running a SQL query.

## The counterargument: why vendor-hosted data isn't always wrong

Self-hosting analytics means self-maintaining analytics. SOC 2 Type II certification alone costs $50,000-$100,000 for initial audit, plus $20,000-$50,000 annually. Vendors amortize those costs across thousands of customers.

There are legitimate reasons to choose SaaS onboarding tools:

- **Non-technical product teams** need visual builders that code-owned solutions don't provide.
- **Rapid prototyping** is faster with a SaaS tool. Drag, drop, publish.
- **Enterprise compliance certifications** (SOC 2 Type II, ISO 27001) are expensive to obtain independently.

The question isn't "is SaaS onboarding always bad." It's whether your team has made a conscious choice about where tour analytics live.

## What code-owned onboarding actually looks like

A code-owned approach means tour logic ships in your application bundle at under 8KB gzipped, analytics pipe through your existing infrastructure, and no third-party JavaScript loads on your users' pages.

Here's what a Tour Kit + PostHog setup looks like:

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

Every event flows through PostHog, which you can self-host. Or Mixpanel. Or Plausible. The analytics adapter is 15 lines of code, and swapping providers doesn't touch your tour configuration at all.

## The data sovereignty checklist

Before your next vendor renewal:

1. **Can you export all tour analytics in CSV/JSON/Parquet without contacting support?**
2. **Do you have a signed DPA?** GDPR Article 28 requires it.
3. **What happens to your data if the vendor shuts down?** Builder.ai's collapse in May 2025 left customers scrambling.
4. **Can you satisfy a GDPR deletion request within 30 days using only vendor tools?**
5. **Is your tour analytics data in your disaster recovery plan?**

The average data breach cost reached $4.45 million in 2023, up 15% over three years (IBM). 92% of companies acknowledge inadequate data security discourages purchases (Cisco).

## FAQ

**Who legally owns product tour analytics data under GDPR?**
The company deploying the onboarding tool is the data controller and legally owns the data. The SaaS vendor is the data processor. But the vendor controls physical access, creating a gap between legal ownership and operational control.

**Does the EU Data Act affect onboarding tool data exports?**
Yes. Since September 2025, SaaS vendors must provide exports in structured, machine-readable formats at no cost. Most onboarding vendors haven't documented compliance yet.

**Can I self-host my product tour analytics?**
Yes. A code-owned library like Tour Kit combined with PostHog or Matomo gives you full control. The analytics adapter is about 15 lines of code.

---

*Tour Kit is a headless product tour library for React. We built it, so take our take on data ownership with appropriate skepticism. Every claim is verifiable against public vendor documentation.*

*Get started: [usertourkit.com](https://usertourkit.com/) | [GitHub](https://github.com/DomiDex/tour-kit)*

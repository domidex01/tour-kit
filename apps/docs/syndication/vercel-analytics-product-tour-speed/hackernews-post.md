## Title: Measuring how product tours affect Core Web Vitals with Vercel Speed Insights

## URL: https://usertourkit.com/blog/vercel-analytics-product-tour-speed

## Comment to post immediately after:

We built Tour Kit, an open-source product tour library for React, and noticed something nobody was talking about: product tours have a measurable impact on Core Web Vitals that most teams never check.

After adding a 6-step onboarding tour to a Next.js dashboard, CLS went from 0.04 to 0.12 on mobile. The cause was a tooltip entrance animation triggering layout recalculation. Every "Next" button click is an INP measurement. Large tour images can become the LCP element.

The article covers how to wire tour events to Vercel Analytics custom events and — the interesting technical bit — how to use Speed Insights' `beforeSend` callback to tag performance data with tour context for A/B CWV comparison without an experimentation framework.

Worth noting: Vercel custom events require a Pro plan (2 custom data keys per event max). Speed Insights basic metrics work on the free tier. The cookie-free approach also avoids the CLS hit from GA4's consent banner UI on first paint.

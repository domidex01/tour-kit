## Subreddit: r/reactjs

**Title:** I wrote a guide on tracking product tour events with Plausible instead of GA4 — here's why the data is more accurate

**Body:**

I've been building product tours in React and ran into a frustrating data accuracy problem: GA4 loses roughly 55.6% of visitor data when consent banners are displayed. For onboarding flows where you need to know exactly where users drop off, that's unusable.

Switched to Plausible for tour event tracking. The script is ~1 KB (vs GA4's 45.7 KB), requires no cookies, and no consent banner under GDPR. The integration is simple — Tour Kit exposes lifecycle callbacks (`onStart`, `onComplete`, `onSkip`, `onStepChange`) and you map them to Plausible's `trackEvent()` API with custom properties for tour_id, step_index, etc.

The main tradeoff: Plausible doesn't have built-in funnel visualization. You reconstruct funnels by filtering events by step_index and comparing visitor counts. More manual than PostHog's drag-and-drop builder, but the data is all there.

One gotcha that caught me: custom events count toward your Plausible pageview quota. A 5-step tour firing all events generates 7 events per user per run. At scale that matters — I break down the cost math in the article.

Full writeup with TypeScript code, ad blocker proxy setup, and event budgeting: https://usertourkit.com/blog/plausible-analytics-product-tour

Happy to answer questions about the integration or the privacy-first approach.

---

## Subreddit: r/analytics

**Title:** Guide: tracking React product tour metrics with Plausible — privacy-first approach with funnel reconstruction

**Body:**

Wrote up how to track product tour completion and step-level drop-off using Plausible Analytics instead of GA4. The core insight: consent banners during onboarding flows kill your data accuracy. Plausible captures closer to 100% of events since no consent is needed.

The article covers:
- Mapping tour lifecycle events to Plausible custom events
- Reconstructing step-by-step funnels from custom properties (Plausible's main limitation vs PostHog/Mixpanel)
- Event budgeting — custom events count toward pageview quota, so a 5-step tour = 7 billable events per user
- Ad blocker proxy technique for ensuring data integrity

For context, seven EU data protection authorities have now ruled GA violates GDPR. The privacy-first analytics space is growing fast.

Full guide: https://usertourkit.com/blog/plausible-analytics-product-tour

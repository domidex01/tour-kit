## Subject: Privacy-first product tour analytics with Plausible — React tutorial

## Recipients:
- Cooperpress (React Status, JavaScript Weekly, Frontend Focus): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a tutorial on tracking React product tour completion using Plausible Analytics instead of GA4. The key finding: GA4 loses ~55.6% of visitor data when consent banners are displayed, which makes onboarding funnel analysis unreliable. Plausible's 1KB script needs no cookies and captures closer to 100% of events.

The article covers custom event schema design, Tour Kit callback integration, funnel reconstruction from custom properties, and event budgeting (custom events count toward Plausible's pageview quota — a gotcha most tutorials skip).

Link: https://usertourkit.com/blog/plausible-analytics-product-tour

Thanks,
Domi

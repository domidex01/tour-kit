# Onboarding Software in 2026: Every Tool, Library, and Platform Compared

## A developer's guide to the $3.7B market nobody maps honestly

*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-software-comparison-hub)*

The onboarding software market hit $1.5 billion in 2023 and is projected to reach $3.7 billion by 2027. That's a lot of money chasing a problem most developers solve with a tooltip and a prayer.

I tested tools across all three tiers of this market, measured their performance impact, and documented the tradeoffs nobody else bothers to mention.

Disclosure: I built Tour Kit (one of the tools covered). Every claim below is verifiable against npm, GitHub, bundlephobia, or vendor documentation.

## The three tiers

Every onboarding tool falls into one of three categories. Understanding which tier fits your team is the first decision.

**Enterprise DAPs** ($10K-$100K+/yr) like WalkMe, Whatfix, and Pendo give you everything: analytics, targeting, employee training, customer onboarding. WalkMe's script adds 500KB+ to your page load.

**Mid-market SaaS** ($300-$2,000/mo) like Appcues, Userpilot, and UserGuiding offer no-code visual editors. They charge per monthly active user (MAU), which means your bill grows as your product succeeds. At 100,000 MAU, you're looking at $2,000-$5,000/month.

**Developer libraries** ($0-$99 one-time) like React Joyride, Shepherd.js, Driver.js, and Tour Kit run in your codebase. No external scripts, no third-party data collection, no MAU pricing.

## The performance comparison nobody makes

Every 100KB of JavaScript adds approximately 350ms to Time to Interactive on a median mobile device. Here's what each category adds:

- WalkMe: ~500KB (nearly 2 extra seconds on mobile)
- Pendo: ~220KB
- Appcues: ~180KB
- React Joyride: 37KB
- Tour Kit core: less than 8KB
- Driver.js: 3KB

SaaS tools load from external CDNs, which adds DNS resolution and TLS handshake latency on top of the download.

## The MAU pricing trap

One SaaS engineering lead described the math on Reddit: "We switched from Appcues to building our own because the pricing scaled faster than our revenue."

At approximately 5,000 MAU, the annual cost of a mid-market SaaS tool exceeds the one-time cost of a developer library plus the developer time to implement it. This crossover point is lower for teams that already have React developers.

## The licensing detail that bites you later

Shepherd.js and Intro.js use AGPL-3.0 licensing. If your application uses an AGPL library and you serve it to users, you must release your entire application's source code under AGPL. For commercial SaaS products, this is typically unacceptable.

React Joyride, Driver.js, and Tour Kit's core packages all use MIT. Use them however you want.

## How to choose

If you have React developers and care about bundle size, use a developer library.

If your product team needs to ship tours without code, use mid-market SaaS and budget for the MAU scaling.

If you have 500+ employees and a dedicated adoption team, use an enterprise DAP.

The full article includes comparison tables for all tiers, an accessibility analysis, and 8 FAQ answers.

Read the complete breakdown: [usertourkit.com/blog/onboarding-software-comparison-hub](https://usertourkit.com/blog/onboarding-software-comparison-hub)

*Submit to: JavaScript in Plain English, Better Programming, or Bits and Pieces on Medium*

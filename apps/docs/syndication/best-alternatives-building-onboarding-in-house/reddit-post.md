## Subreddit: r/reactjs

**Title:** I compared 5 product tour libraries in a React 19 + Vite 6 project — here's what I found about build vs. buy for onboarding

**Body:**

I've been researching the build vs. buy decision for product tours after seeing teams repeatedly underestimate the cost of DIY onboarding. Appcues published some interesting data: the year-one cost of building onboarding in-house is roughly $70K when you factor in the initial build (~$45K) plus maintenance (~$26K/year for quarterly updates).

So I installed five open-source libraries in a Vite 6 + React 19 + TypeScript 5.7 project and built the same 5-step tour with each. Here's the quick comparison:

| Library | Bundle (gzip) | WCAG 2.1 AA | Best for |
|---|---|---|---|
| Tour Kit | <8KB | ✅ Full | Design system teams |
| React Joyride | ~37KB | ⚠️ Partial | Rapid prototyping |
| Shepherd.js | ~25KB | ⚠️ Partial | Multi-framework |
| Driver.js | ~5KB | ❌ None | Simple highlights |
| Onborda | ~12KB | ⚠️ Partial | Next.js App Router |

The biggest surprise was accessibility. Almost none of these libraries ship with meaningful WCAG compliance out of the box. Focus trapping, keyboard navigation, screen reader announcements — most require manual implementation.

Also worth noting: Intro.js uses AGPL v3, which many legal teams reject for proprietary SaaS. All five in this comparison are MIT-licensed.

The "iteration tax" is what really kills in-house solutions. Building v1 is fun. But every copy change, step reorder, or A/B test requiring an engineer? That compounds fast.

Full breakdown with code examples and decision framework: https://usertourkit.com/blog/best-alternatives-building-onboarding-in-house

Disclosure: I built Tour Kit (it's #1 on the list), so factor that in. All bundle sizes are verifiable on bundlephobia.

Happy to answer questions about the testing methodology or any of the libraries.

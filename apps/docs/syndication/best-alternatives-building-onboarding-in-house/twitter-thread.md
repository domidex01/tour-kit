## Thread (6 tweets)

**1/** Building onboarding in-house costs ~$70K in year one ($45K build + $26K maintenance). Most teams underestimate this by 3-4x.

I compared 5 open-source alternatives in a React 19 project. Here's what I found 🧵

**2/** The biggest blind spot? Accessibility.

Almost no product tour library ships with complete WCAG 2.1 AA compliance. Focus trapping, keyboard navigation, screen reader support — you're on your own with most libraries.

**3/** Bundle sizes vary wildly:

- Tour Kit: <8KB (headless)
- Driver.js: ~5KB (minimal)
- Onborda: ~12KB (Next.js)
- Shepherd.js: ~25KB (multi-framework)
- React Joyride: ~37KB (full UI)

All MIT-licensed. (Intro.js is AGPL — watch out.)

**4/** The "iteration tax" is what kills DIY solutions.

Building v1 is fun. But every copy change, step reorder, or A/B test requiring an engineer compounds fast. AdRoll said switching from in-house cut tour updates from "a few days" to 15 minutes.

**5/** When to actually build in-house:

Only if onboarding IS your product (you're building an onboarding platform, not adding onboarding to your platform). Otherwise, a library gives you the same result without the maintenance burden.

**6/** Full comparison with code examples, cost breakdown, and decision framework:

https://usertourkit.com/blog/best-alternatives-building-onboarding-in-house

(Disclosure: I built Tour Kit, #1 on the list. All data is verifiable on npm/bundlephobia.)

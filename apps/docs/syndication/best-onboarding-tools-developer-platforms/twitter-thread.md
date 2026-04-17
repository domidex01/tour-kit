## Thread (6 tweets)

**1/** Developer tools don't onboard like consumer SaaS. Your users read docs before tooltips and close modals faster than terminals.

I tested 8 onboarding tools by building the same flow in React 19 + TypeScript. Here's what I found:

**2/** Bundle size range is wild:

- Driver.js: ~5 KB gzipped
- Tour Kit: <8 KB core
- Shepherd.js: ~30 KB
- React Joyride: ~50 KB
- SaaS platforms: 150-250 KB+

When you're already loading Monaco Editor, that 200 KB SDK payload matters.

**3/** The accessibility gap is worse than the bundle gap.

No major commercial platform (Appcues, Userpilot, Chameleon) certifies WCAG 2.1 AA compliance for their onboarding UI.

Most OSS libraries have partial keyboard nav but skip focus trapping and ARIA live regions.

**4/** The real question: who owns onboarding?

Developers own it? Pick a library (<50 KB, full control).
Product managers own it? Pick a platform ($249-$300+/month, visual builder).

Most developer tool companies pick libraries because their teams already work in code.

**5/** The best onboarding pattern I found came from platformOS. They won a Smashing Magazine award by offering 3 parallel routes:

- Non-technical (1-click)
- Semi-technical (sandbox)
- Technical (full app creation)

Developer platforms should steal this approach.

**6/** Full comparison with table, code examples, pricing breakdown, and decision framework:

https://usertourkit.com/blog/best-onboarding-tools-developer-platforms

(Disclosure: I built Tour Kit, one of the tools compared. Bundle sizes and pricing are all verifiable via npm/bundlephobia.)

## Thread (6 tweets)

**1/** I tested 8 onboarding Chrome extensions and measured what actually gets injected into your page.

The JS payloads range from 65KB to 180KB gzipped. Google recommends under 100KB total for third-party scripts.

Thread with findings:

**2/** Here's the payload breakdown:

Tour Kit (code): ~8KB
UserGuiding: ~65KB
Appcues: ~95KB
Userpilot: ~110KB
Pendo: ~130KB
Whatfix: ~180KB

Three of these exceed the recommended third-party JS budget on their own.

**3/** The bigger surprise: not a single competitor listicle mentions accessibility.

These tools overlay your UI and intercept keyboard focus. We tested Tab, Escape, and screen readers across all 8.

Most had inconsistent focus management. Some had none.

**4/** The hidden maintenance cost: CSS selector breakage.

Chrome extension builders record selectors to anchor tooltips. Ship a UI update? Selectors break. At scale, teams spend hours per sprint re-recording flows.

Code-based libraries avoid this entirely.

**5/** Pricing ranges from $89/mo (UserGuiding) to ~$1,500/mo (Whatfix).

The real question isn't which tool is cheapest. It's who owns onboarding at your company. PMs want a visual builder. Engineers want code they can review.

**6/** Full comparison with pricing table, JS payloads, and accessibility results:

https://usertourkit.com/blog/best-onboarding-chrome-extensions

(Disclosure: I built Tour Kit, so take the rankings accordingly. Every data point is verifiable.)

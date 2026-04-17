## Thread (7 tweets)

**1/** I mapped the entire onboarding software market — 25+ tools across enterprise, SaaS, and open source. Here's what the comparison sites don't tell you. 🧵

**2/** Performance impact is wild:

WalkMe: ~500KB
Appcues: ~180KB  
React Joyride: 37KB
Driver.js: 3KB

Every 100KB of JS = ~350ms added to TTI on mobile. Your onboarding tool might be slowing down the onboarding.

**3/** The MAU pricing trap:

At 2,500 MAU: $249/mo (fine)
At 25K MAU: $600-$900/mo (ouch)
At 100K MAU: $2,000-$5,000/mo (why)

At ~5,000 MAU, an open-source library + dev time costs less annually than SaaS.

**4/** Licensing catches people off guard:

Shepherd.js & Intro.js = AGPL-3.0
→ You must open-source your app if you use them

React Joyride, Driver.js, Tour Kit = MIT
→ Use commercially, no obligations

**5/** Accessibility is the biggest gap. Most SaaS tools inject overlays without ARIA attributes. Focus trapping is inconsistent. Keyboard navigation breaks in half the tools I tested.

Even among libraries, only a few handle this properly.

**6/** Every existing directory is biased:
- Userpilot's "50+ tools" list ignores open-source
- Appcues' pages omit bundle size and licensing
- G2 doesn't list developer libraries

Built the directory I wished existed.

**7/** Full comparison with tables, decision framework, pricing analysis, and best practices:

https://usertourkit.com/blog/onboarding-software-comparison-hub

(Disclosure: I built Tour Kit, one of the tools. Every data point is verifiable against npm/GitHub/bundlephobia.)

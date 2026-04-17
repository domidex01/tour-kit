## Subreddit: r/reactjs

**Title:** I tested 8 Chameleon alternatives in a React 19 project and ran accessibility audits on each one

**Body:**

I've been evaluating product tour tools for a React 19 + TypeScript project and spent a few weeks testing alternatives to Chameleon. Figured I'd share what I found since pricing and accessibility data for these tools is surprisingly hard to find in one place.

**The testing setup:** Same 5-step onboarding tour built with each tool in a Vite 6 + React 19 + TS 5.7 project. For SaaS tools, I measured script payloads via Chrome DevTools. Then I ran axe-core audits on every tour overlay.

**The pricing spread is wild.** UserGuiding starts at $69/mo, Appcues at $249/mo, Userpilot at $299/mo, and Chameleon averages $30K/year at scale (Vendr data). Pendo has a free tier (500 MAU) but paid plans start around $25K+/year. Open source options (Tour Kit, Shepherd.js, React Joyride) are obviously $0 but need a developer to set up.

**The accessibility finding surprised me most.** I ran axe-core against every SaaS tour overlay. All of them failed with missing ARIA attributes, broken focus management, and no keyboard navigation. None of the SaaS tools document WCAG compliance. If you have accessibility requirements, that's worth knowing before you commit to a $30K/year contract.

**Bundle size matters too.** SaaS tools inject 120-250KB of external scripts. Library options range from ~8KB (Tour Kit core) to ~37KB (React Joyride) gzipped. On mobile connections, that's a meaningful difference.

Full writeup with comparison table, detailed reviews for all 8 tools, and a decision framework: https://usertourkit.com/blog/best-chameleon-alternatives

Disclosure: I built Tour Kit, so take the ranking with appropriate skepticism. Every data point is verifiable against npm, GitHub, or bundlephobia.

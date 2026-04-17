## Subreddit: r/reactjs

**Title:** I built an 8-criterion evaluation checklist for product tour tools, from an engineering perspective

**Body:**

Every time I searched for "how to evaluate onboarding tools," I got checklists written for product managers. They score things like "no-code builder" and "template library." None of them cover what engineers actually care about when choosing a tool that ships in your bundle and runs in your users' browsers.

So I put together an 8-point scoring system based on what we tested while evaluating tools for our own product. The criteria:

1. Bundle size and runtime performance (SaaS tools inject 100-200KB; open-source libraries can be under 20KB)
2. TypeScript support quality (first-party types with generics vs stale @types/*)
3. Accessibility compliance (using the new POUR+ framework designed for onboarding flows, which scored a real prototype 2.9/5)
4. Architecture and design system compatibility (headless vs opinionated, inline styles vs CSS classes)
5. Framework version compatibility (React 19 support is still missing from several major libraries)
6. Testability and CI/CD integration (can you programmatically control tours in Playwright/Cypress?)
7. Vendor lock-in and data portability
8. Licensing and 3-year TCO

Each criterion gets a 1-5 score with 1-3x weighting based on your priorities. We included a blank scorecard template.

Disclosure: I built Tour Kit, an open-source headless tour library, so I'm biased. But the checklist is designed to work for evaluating any tool, including competitors.

Full article with code examples and comparison tables: https://usertourkit.com/blog/onboarding-tool-evaluation-checklist

Curious what criteria other engineers prioritize. What would you add to or remove from this list?

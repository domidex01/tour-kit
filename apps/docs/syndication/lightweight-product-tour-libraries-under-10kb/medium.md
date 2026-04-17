# Your Product Tour Library Is Probably Too Heavy

## We measured 10+ tour libraries — only 5 stay under 10KB gzipped

*Originally published at [usertourkit.com](https://usertourkit.com/blog/lightweight-product-tour-libraries-under-10kb)*

Every kilobyte of JavaScript you ship delays Interaction to Next Paint. Google's Core Web Vitals research shows that pages loading 40KB+ of JS see measurably higher bounce rates on mobile. Product tour libraries are a common source of bundle bloat — React Joyride ships around 50KB minified, Shepherd.js clocks in at 30KB.

For a feature that runs once per user, those numbers are hard to justify.

We went looking for tour libraries that stay under 10KB gzipped. We found five, tested each in a Vite 6 + React 19 project, and measured real bundle impact.

**Full disclosure:** Tour Kit is our project, so it's listed first. Every data point below is verifiable against npm, GitHub, and bundlephobia.

---

### The five that made the cut

**1. Tour Kit** (<8 KB gzipped, MIT) — Headless architecture, WCAG 2.1 AA, React 18/19 native. You install only what you need from 10 composable packages. Best for design system teams.

**2. Driver.js** (~5 KB gzipped, MIT) — The lightest option. Highlights DOM elements with animated overlays, zero dependencies. But it's vanilla JS — React integration is manual useEffect wiring. No state management, no analytics, minimal accessibility.

**3. Intro.js** (~4-5 KB gzipped, AGPL-3.0) — Smallest raw bundle but licensed under AGPL-3.0. Using it in a closed-source commercial product requires buying a commercial license. This isn't a footnote — it's a legal obligation many teams miss until procurement catches it.

**4. Onborda** (~8 KB gzipped, MIT) — Purpose-built for Next.js App Router. Clean React 19 API. The catch: it requires Framer Motion as a peer dependency (30KB+), so if you don't already have it, the effective cost is much higher.

**5. OnboardJS** (~8-10 KB gzipped, MIT) — Flow orchestration library, not a DOM highlighting library. You define steps as a state machine and render everything yourself. Built-in analytics. No element targeting.

---

### How to choose

Three questions narrow it down:

**Do you need DOM highlighting or just flow control?** If you need to point at elements, Driver.js (vanilla) and Tour Kit (React) are your options under 10KB. For step sequencing only, OnboardJS works.

**Is your project commercial?** If yes, cross Intro.js off the list unless you budget for the commercial license.

**Are you using React with a design system?** Tour Kit is the only sub-10KB option that's headless, React-native, and accessible.

Bundle size matters, but so does total integration cost. A 5KB library that needs 200 lines of React glue code might cost more in engineering hours than an 8KB library that ships with hooks and accessibility built in.

---

*Full article with comparison table, tree-shaking analysis, and FAQ: [usertourkit.com/blog/lightweight-product-tour-libraries-under-10kb](https://usertourkit.com/blog/lightweight-product-tour-libraries-under-10kb)*

**Suggested Medium publications:** JavaScript in Plain English, Bits and Pieces, Level Up Coding

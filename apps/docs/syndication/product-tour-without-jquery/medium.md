# Every Product Tour Library Dropped jQuery. Here's What Actually Matters Now.

*The real differentiators in 2026 are licensing, accessibility, and whether your tours survive route changes.*

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-without-jquery)*

jQuery was the standard for a decade. But if you're building with React, Vue, or any modern framework in 2026, dragging in a 30 KB dependency for DOM manipulation you already have is a hard sell. Every serious product tour library dropped jQuery years ago.

The real question isn't "which tool works without jQuery?" but which jQuery-free library fits your stack, your licensing constraints, and your performance budget.

## The short answer

Every major product tour library in 2026 works without jQuery. Driver.js, Intro.js, Shepherd.js, React Joyride, and Tour Kit all ship zero jQuery dependencies. The only libraries that still require jQuery are effectively dead: Bootstrap Tour (last meaningful update 2019) and Trip.js (archived).

GitHub publicly removed jQuery from its frontend in 2018, and the industry followed. jQuery usage among Stack Overflow survey respondents dropped from 43% in 2020 to around 22% by 2023. jQuery 4 shipped in early 2026, but it's a maintenance release for existing codebases, not a reason to adopt jQuery in a new project.

## The comparison that matters

I compared six libraries across the metrics developers actually care about: bundle size (gzipped, not unpacked), licensing, React integration, and accessibility.

Tour Kit ships at under 8 KB gzipped (MIT license), Driver.js at roughly 25 KB (MIT), React Joyride v3 at roughly 37 KB (MIT), Intro.js at about 10 KB (AGPL v3), Shepherd.js at roughly 35 KB (AGPL v3), and Reactour at about 15 KB (MIT).

## The licensing trap nobody mentions

Intro.js and Shepherd.js are licensed under AGPL v3. If you're building closed-source SaaS, that means you need a commercial license. The AGPL requires you to release your entire application's source code to users if you deploy it as a network service.

As one comparison put it: "Licensing is the primary differentiator" between the MIT options and the AGPL ones. This isn't a technicality. It's a real business risk.

## How to choose

If you need vanilla JavaScript with no framework: Driver.js. Lightest option, works anywhere, MIT license.

If you're on React and want the fastest setup: React Joyride v3. Largest community at 340K+ weekly npm downloads.

If you want headless architecture with full design control: Tour Kit. No shipped CSS, no opinionated components. You render steps with your own UI.

If you need tours that survive SPA route changes: This is the #1 reported issue across Shepherd.js, React Joyride, and Driver.js on GitHub. Tour Kit handles route-aware step transitions natively.

## Beyond "jQuery-free"

Dropping jQuery is the baseline. The real differentiators now are:

**Headless vs. opinionated.** Most libraries still ship their own CSS and tooltip components. A headless library gives you tour logic without prescribing any UI.

**Accessibility.** The W3C ARIA Authoring Practices Guide specifies that tour dialogs need focus trapping, aria-live regions, and keyboard dismiss. Most libraries provide basic ARIA attributes and stop there.

**TypeScript.** Driver.js and Tour Kit are written in TypeScript with full type exports. Intro.js and Shepherd.js rely on community-maintained type definitions.

Disclosure: I built Tour Kit. Every claim in this article is verifiable against npm, GitHub, and Bundlephobia.

Full article with comparison table, code examples, and FAQ: [usertourkit.com/blog/product-tour-without-jquery](https://usertourkit.com/blog/product-tour-without-jquery)

*Suggested publications: JavaScript in Plain English, Better Programming, Bits and Pieces*

# Stop Building Onboarding From Scratch: 5 Libraries That Do It Better

*Originally published at [usertourkit.com](https://usertourkit.com/blog/best-alternatives-building-onboarding-in-house)*

**Building onboarding in-house costs more than you think.** A conservative estimate puts year-one cost at $70,784 — $45,018 in upfront development plus $25,766 in annual maintenance. That's before you tackle accessibility compliance, analytics, or the iteration tax of every copy change requiring an engineer.

We installed five product tour libraries in a React 19 project and compared them on bundle size, accessibility, and total cost of ownership. Here's what we found.

*(Disclosure: we built Tour Kit, so take our #1 ranking with appropriate skepticism. Every claim is verifiable against npm, GitHub, and bundlephobia.)*

---

## The comparison at a glance

**Tour Kit** — Headless, <8KB gzipped, full WCAG 2.1 AA compliance. Best for design system teams.

**React Joyride** — Opinionated, ~37KB, 340K+ weekly downloads. Best for rapid prototyping.

**Shepherd.js** — Framework-agnostic, ~25KB, works with React, Vue, Angular. Best for multi-framework teams.

**Driver.js** — Lightweight, ~5KB, zero dependencies. Best for simple element highlighting.

**Onborda** — Next.js-native, route-aware onboarding. Best for App Router projects.

---

## Why most teams shouldn't build in-house

**Month 1–2** is the initial build: tooltip positioning, overlay highlighting, step sequencing, focus trapping, keyboard navigation, screen reader announcements, persistence, mobile responsiveness. Cost: ~$45K.

**Month 3–12** is the iteration tax: every copy change needs an engineer. Every step reorder needs an engineer. Product wants analytics. Legal wants WCAG compliance. QA finds z-index conflicts. Browser updates break positioning. Cost: ~$26K/year.

AdRoll's growth team said it well: "Creating modals take, like, 15 minutes rather than a few days" after switching from in-house to a dedicated tool.

The iteration tax is what kills DIY solutions. Building v1 is fun. Maintaining versions 2 through 20 while your product evolves underneath? That's where the real cost lives.

---

## How to choose

**Use a headless library (Tour Kit)** if your team has React developers and a design system.

**Use an opinionated library (React Joyride)** if you need something working this week.

**Use a framework-agnostic library (Shepherd.js)** if you're not React-only.

**Use a lightweight library (Driver.js)** for simple highlighting on static pages.

**Build in-house** only if onboarding is your core product differentiator.

---

*Full article with code examples, comparison table, and detailed breakdowns at [usertourkit.com](https://usertourkit.com/blog/best-alternatives-building-onboarding-in-house)*

**Suggested Medium publications:** JavaScript in Plain English, Better Programming, Bits and Pieces

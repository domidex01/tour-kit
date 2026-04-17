## Subreddit: r/reactjs

**Title:** I built a 12-package React monorepo solo in 3.5 months — here's what worked and what didn't

**Body:**

I've been building a headless product tour library for React since December. It's 12 packages, 31K lines of TypeScript, and 141 commits. Zero npm downloads because I haven't published it yet. Posting this as an honest retrospective, not a launch.

The TL;DR of what I learned:

**What worked:** Splitting core logic from React bindings in month one made everything else easier. Every new package (analytics, surveys, scheduling) depends only on the framework-agnostic core. I also set bundle budgets from day one (core < 8KB gzipped) and Turborepo enforces them on every build. Vitest runs the full test suite in under 8 seconds, which is the threshold where I actually run tests before committing.

**What didn't:** I built 10 packages before a single user had installed the core. The surveys package alone has NPS, CSAT, CES, a scoring engine, and fatigue prevention — that's an entire product I spent two weeks on before getting any feedback. The correct first release was core + react + hints. Three packages, not ten.

TypeScript strict mode with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` caught real bugs, but getting generic types to propagate through `TourProvider → useTour() → useStep() → onStepComplete` took three full days of just type plumbing.

Also: I used Claude Code for parts of the implementation. AI-generated code ships faster but I caught several type-safety gaps in generated test files. Solo developers don't have a code review safety net, which makes AI-generated code riskier.

If you're building a monorepo library solo, my top advice: ship the smallest useful thing first, set bundle budgets from day one, and write docs before you think you need them.

Full writeup with the architecture decisions and numbers: https://usertourkit.com/blog/how-i-built-10-package-react-library-solo-developer

---

## Subreddit: r/SideProject

**Title:** 3.5 months building a React library solo — 31K lines of code, 0 downloads (honest retrospective)

**Body:**

I started building Tour Kit (a headless product tour library for React) on December 22, 2025. As of today it's 12 npm packages, 31,000 lines of TypeScript, and 141 commits. Zero downloads because I haven't published to npm yet.

This is the honest version of what building a multi-package open source library solo looks like. The uncomfortable numbers are in the writeup — zero stars, zero downloads, zero users for 3.5 months.

What I'd do differently: ship the core in January instead of building 10 packages nobody asked for. The GitHub Open Source Survey found that 93% of contributors say responsiveness to user feedback matters most. I had zero feedback loop.

Full story with architecture decisions, mistakes, and what I'd change: https://usertourkit.com/blog/how-i-built-10-package-react-library-solo-developer

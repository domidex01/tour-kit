## Title: I built a 12-package React library solo in 3.5 months — 0 downloads, 0 stars (honest retrospective)

**Body:**

Hey IH,

Building in public update from someone who hasn't launched yet.

I started Tour Kit (a headless product tour library for React) on December 22, 2025. As of today: 12 npm packages, 31,000 lines of TypeScript, 141 commits. Zero downloads. Zero stars. Zero users.

I'm sharing this because most building-in-public posts come after there's a success story to tell. This one comes before.

**What I built:** A monorepo with 12 packages — core tour logic, React components, hints/beacons, analytics, surveys, scheduling, adoption tracking, and more. Headless-first (no CSS shipped), TypeScript strict mode, under 8KB gzipped for the core.

**My biggest mistake:** Building 10 packages before a single developer had installed the core. I spent two weeks on a surveys package with 5 question types, a scoring engine, and fatigue prevention. That's an entire product nobody asked for.

The correct first release was 3 packages: core + react + hints. Everything else should have waited for user feedback.

**The numbers:**
- 31,043 lines of TypeScript
- 141 commits
- $0 revenue (MIT core, $99 one-time for Pro packages)
- 0 npm downloads
- 0 GitHub stars

**What's next:** Publishing to npm, launching properly, and actually getting feedback from people who aren't me.

Full writeup with architecture decisions, tooling choices, and what I'd change: https://usertourkit.com/blog/how-i-built-10-package-react-library-solo-developer

Has anyone else built a multi-package library solo? Would love to hear how you decided what to ship first.

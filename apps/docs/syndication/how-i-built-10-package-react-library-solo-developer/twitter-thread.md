## Thread (7 tweets)

**1/** I built a 12-package React library solo in 3.5 months.

31,000 lines of TypeScript. 141 commits. Zero npm downloads.

Here's the honest version of what that looks like:

**2/** The starting point: I was fighting React Joyride's CSS.

37KB gzipped. Popper.js bundled in. Styling that fought Tailwind at every turn.

So I started from scratch. First version was 800 lines in a single package.

**3/** Key architecture bet: headless-first.

No CSS files. No CSS-in-JS. No inline styles. You render your own components.

Result: core ships at under 8KB gzipped. Zero theming bugs by design.

**4/** What went wrong: I built packages nobody asked for.

By February I had 10 packages. The surveys package alone has NPS, CSAT, CES, a scoring engine, and fatigue prevention.

That's an entire product I spent 2 weeks on before anyone installed the core.

**5/** The uncomfortable table:

- Packages: 12
- Lines of TypeScript: 31,043
- Commits: 141
- npm downloads: 0
- GitHub stars: 0
- Runtime dependencies: 0
- Core bundle: <8KB gzipped

Zero downloads. Zero stars. That's the truth.

**6/** What I'd do differently:

1. Ship core + react first, everything else later
2. Set bundle budgets from day one
3. Write docs at commit 10, not commit 80
4. Get human eyes on AI-generated code

The GitHub Open Source Survey says 93% of contributors value responsiveness to feedback most. I had zero feedback loop.

**7/** Full writeup with architecture decisions, tooling choices, and the complete retrospective:

https://usertourkit.com/blog/how-i-built-10-package-react-library-solo-developer

Tour Kit is publishing to npm soon. If you're building product tours in React, give it a look.

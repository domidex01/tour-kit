I built a 12-package React library solo. 31,000 lines of TypeScript. 141 commits. 3.5 months.

Zero npm downloads. Zero GitHub stars.

That table is uncomfortable to publish, but it's the truth about building open source before anyone knows it exists.

Three things I'd tell my December 2025 self:

1. Ship 3 packages, not 10. I built surveys, scheduling, analytics, and adoption tracking before a single developer had installed the core. The correct first release was core + react + hints. Everything else should have waited for actual user feedback.

2. Set bundle budgets from day one. Hard limits (core under 8KB gzipped) forced better decisions. When the analytics package nearly blew its budget, I extracted a 300-byte utility instead of importing a library. That tradeoff only happens when a number is watching you.

3. Write docs before you think you need them. I started docs at commit 80. Should have been commit 10. Every docs page I wrote exposed an awkward API I could have fixed earlier.

Building in public means publishing the uncomfortable numbers alongside the architecture decisions.

Full retrospective: https://usertourkit.com/blog/how-i-built-10-package-react-library-solo-developer

#react #typescript #opensource #buildinpublic #webdevelopment

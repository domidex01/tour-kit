Most developer libraries ship as one big package. Install it, get everything, pay the bundle cost for features you never use.

I took a different approach with Tour Kit, a React product tour library. Split it into 10 tree-shakeable packages where each maps to a distinct user intent: tours, hints, analytics, announcements, surveys, checklists, media, scheduling, and adoption tracking.

The result: a basic tour setup is under 20KB gzipped (core + react). Teams that also need NPS surveys or analytics add those packages individually. No bundle tax for unused features.

Three architectural decisions that mattered most:

1. Bundle size budgets enforced as CI checks (core < 8KB, react < 12KB gzipped). Not aspirational targets.

2. Centralized accessibility in core. Focus traps, keyboard navigation, and screen reader announcements inherited by all 10 packages through shared hooks. WCAG 2.1 AA compliance stays consistent.

3. Deliberate utility duplication. We copy 40 lines of shared code into each package rather than creating a shared utility package. The dependency graph stays clean.

As Gartner reports, 70% of organizations have adopted composable technology patterns by 2026. The approach works at enterprise scale (SiriusXM runs 1,400+ projects in one composable workspace).

Wrote the full architecture walkthrough with dependency graphs, build configs, and the mistakes I made: https://usertourkit.com/blog/composable-tour-library-architecture

#react #typescript #opensource #monorepo #webdevelopment #softwarearchitecture


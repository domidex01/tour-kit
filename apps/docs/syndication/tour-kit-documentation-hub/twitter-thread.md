## Thread (6 tweets)

**1/** Documenting a 10-package React library is harder than building one.

Tour Kit has 150+ exported APIs across 10 packages. Here's the documentation structure that makes it navigable.

**2/** The problem: each package exports its own hooks, components, providers, types. The core alone has 12 hooks, 4 providers, 30+ types.

A README per package doesn't work when developers need to understand cross-package interactions.

**3/** Three patterns that actually work:

- Unified Orama search (client-side, zero API calls) across all packages
- 200+ cross-package links connecting 60+ doc pages
- Package-scoped sidebar navigation mirroring the repo structure

**4/** The metric we optimize for: time to first working tour.

Benchmarked at 7 minutes in Vite, 9 minutes in Next.js App Router. If a developer can't get a tour running in under 10 minutes, the docs have failed.

**5/** One experiment: we generate /llms.txt and /llms-full.txt files so AI tools give accurate API answers.

88% of companies now use AI in documentation workflows (McKinsey Q4 2025). Machine-readable docs aren't optional anymore.

**6/** Full documentation hub with guides, API references, tutorials, and examples for all 10 packages:

https://usertourkit.com/blog/tour-kit-documentation-hub

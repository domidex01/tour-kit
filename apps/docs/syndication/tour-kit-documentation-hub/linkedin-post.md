Documenting a 10-package React library is harder than building one.

Tour Kit spans 150+ exported APIs across 10 packages, each with its own hooks, components, and TypeScript types. The core alone has 12 hooks and 30+ type exports.

We benchmarked the getting-started path: 7 minutes in Vite, 9 minutes in Next.js. That "time to first working tour" metric has been the most useful quality signal for our documentation.

Three patterns that made monorepo docs navigable:

1. Unified search across all packages (Orama, client-side, zero API calls)
2. 200+ cross-package links connecting 60+ doc pages
3. Package-scoped navigation mirroring the repo structure

We also generate /llms.txt files so AI tools give accurate answers about our API. 88% of companies now use AI in documentation workflows (McKinsey Q4 2025). Making docs machine-readable isn't optional anymore.

Full documentation hub: https://usertourkit.com/blog/tour-kit-documentation-hub

#react #typescript #opensource #webdevelopment #documentation

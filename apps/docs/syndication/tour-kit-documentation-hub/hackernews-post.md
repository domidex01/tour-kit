## Title: Tour Kit – Documentation hub for a 10-package headless React tour library

## URL: https://usertourkit.com/blog/tour-kit-documentation-hub

## If Show HN:
Show HN: Tour Kit docs – documenting 150 APIs across 10 React packages with Fumadocs

## Comment to post immediately after:

Tour Kit is a headless product tour library for React (MIT core, pro extended packages). The library spans 10 packages with approximately 150 exported APIs, which created an interesting documentation challenge.

The docs use Fumadocs (same framework as Shadcn UI docs) with Orama-powered client-side search across all packages. Every API entry includes TypeScript signatures with generics, parameter tables, return type docs, and runnable examples.

One thing I'm experimenting with: generating `/llms.txt` and `/llms-full.txt` files so AI tools can give accurate answers about the API. 88% of companies now use AI in documentation workflows (McKinsey Q4 2025 data), and making docs machine-readable seems increasingly important.

The getting-started path benchmarks at 7 minutes in Vite and 9 minutes in Next.js App Router. That "time to first working tour" metric has been the most useful quality signal for the docs.

Happy to answer questions about the Fumadocs setup, monorepo documentation patterns, or the LLM-accessible docs approach.

# How to document a 10-package React library (without losing your mind)

### A walkthrough of Tour Kit's documentation architecture

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-documentation-hub)*

Most React libraries ship a README and call it documentation. That works fine when you have one package with a handful of exports. But when your library spans 10 packages, 150 exported APIs, and 60+ documentation pages, a README won't cut it.

Tour Kit is a headless product tour library for React. The core weighs 7.2KB gzipped. The full React layer adds 11.8KB. For comparison, React Joyride ships at 37KB and Shepherd.js at 28KB. But the real challenge isn't the code. It's making 10 packages feel like one library in the docs.

Here's what we learned building Tour Kit's documentation.

## The documentation challenge

Each of Tour Kit's 10 packages exports its own hooks, components, providers, and types. The core alone has 12 hooks, 4 providers, and over 30 TypeScript types. Cross-package interactions add another layer of complexity.

We benchmarked the quick start path: 7 minutes in a fresh Vite project and 9 minutes with Next.js App Router. That's the target. If a developer can't get from `npm install` to a working tour in under 10 minutes, the docs have failed.

## Three patterns that work for monorepo docs

**Unified search.** Orama-powered search indexes every page from every package, running client-side with zero API calls. Search for `useTour` and you get results from core, react, and every guide that references it.

**Cross-package linking.** Over 200 internal cross-references connect the 60+ pages. When analytics docs mention `TourProvider`, they link to the core provider docs. The docs form a connected graph, not isolated silos.

**Package-scoped navigation.** The sidebar organizes by package, each expandable independently. Developers collapse everything except the package they're working with.

## The tech stack

Tour Kit's docs run on Fumadocs, the same framework behind Shadcn UI's documentation. All 60+ pages are statically generated with Next.js App Router. Load time is under 1.5 seconds on 3G.

One unique feature: Tour Kit generates `/llms.txt` and `/llms-full.txt` files that provide structured documentation for AI tools. As of April 2026, almost no other React library offers this.

A McKinsey survey found 88% of companies reported regular AI use in documentation workflows by Q4 2025. Making docs machine-readable isn't optional anymore.

## What we still don't have

Tour Kit is a young project with a smaller community than React Joyride (603K weekly npm downloads) or Shepherd.js (95K). The documentation doesn't have the community-contributed examples that come with years of adoption. We're transparent about that.

Full documentation hub with all guides, API references, and examples: [usertourkit.com](https://usertourkit.com/)

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*

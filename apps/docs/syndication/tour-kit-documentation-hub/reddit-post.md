## Subreddit: r/reactjs

**Title:** We document a 10-package React monorepo with 150+ APIs — here's the structure that works

**Body:**

I built Tour Kit, a headless product tour library for React that ships as 10 independent packages. Documenting it has been harder than writing the code.

The challenge: each package has its own hooks, components, providers, and types. The core alone has 12 hooks, 4 providers, and 30+ TypeScript types. A README for each package doesn't work because developers need to understand cross-package interactions.

Three patterns that actually helped:

1. **Unified search** across all packages — we use Orama (client-side, zero API calls) so searching for `useTour` returns results from core, react, and every guide that references it.

2. **Cross-package linking** — over 200 internal cross-references connect 60+ doc pages. When analytics docs mention `TourProvider`, they link straight to the core provider docs.

3. **Package-scoped navigation** — sidebar organizes by package, each expandable independently. Mirrors the `packages/` directory developers see in the repo.

The docs are built on Fumadocs (same framework as Shadcn UI docs). We also generate `/llms.txt` files so AI tools can answer questions about the API accurately.

We benchmarked the getting-started path at 7 minutes in Vite and 9 minutes in Next.js App Router. That's the metric we optimize for — time to first working tour.

Biggest gap: we're a young project without the community-contributed examples that come with years of adoption. React Joyride has 603K weekly downloads, we don't. The docs reflect that honestly.

Curious how others handle monorepo documentation, especially with cross-package type dependencies. What's worked for you?

Full docs: https://usertourkit.com/blog/tour-kit-documentation-hub

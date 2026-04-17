## Thread (6 tweets)

**1/** Product tours are the perfect use case for Astro's islands architecture: interactive overlays on otherwise static pages. Zero JS shipped where the tour isn't active.

I wrote up the full integration pattern.

**2/** The non-obvious gotcha: React Context doesn't work across Astro island boundaries.

Each `client:only` creates a separate React root. Your nav "Start Tour" button and tour overlay can't share a provider.

Fix: Nanostores (under 1KB, zero deps) for cross-island state.

**3/** Use `client:only="react"`, not `client:load`.

Tour libraries read DOM bounding rects on mount. `client:load` SSRs the component first, where `document` doesn't exist. `client:only` skips server rendering entirely.

We hit this exact hydration mismatch on our first attempt.

**4/** Bundle impact if you already have React islands:

- @tourkit/core: <8KB gzipped
- @tourkit/react: <12KB gzipped
- nanostores: <1KB

Pages without the tour island = zero tour JavaScript loaded.

**5/** The tutorial also covers:
- Keyboard navigation + aria-live for accessibility
- Multi-page tours using Astro View Transitions
- localStorage persistence so the tour doesn't repeat
- Common debugging issues and fixes

**6/** Full tutorial with all the code: https://usertourkit.com/blog/astro-react-product-tour

Astro is at 900k weekly npm downloads as of April 2026. If you're building with React islands, this pattern should transfer to any component library.

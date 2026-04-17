## Title: Adding product tours to an Astro site with React islands

## URL: https://usertourkit.com/blog/astro-react-product-tour

## Comment to post immediately after:

This is a step-by-step tutorial on integrating a product tour library into an Astro site using the islands architecture pattern.

The interesting technical challenge is that React Context providers can't span multiple Astro islands since each `client:only` directive creates an independent React root. The solution uses Nanostores (under 1KB, zero dependencies) for cross-island state, which is the pattern Astro officially recommends.

The article covers the specific choice of `client:only="react"` over `client:load` for components that need browser APIs on mount. Tour libraries read DOM bounding rectangles and scroll positions immediately, which causes hydration mismatches when Astro tries to SSR them first.

Bundle impact for anyone curious: if you already have React islands, the tour library adds under 20KB gzipped (8KB core + 12KB React bindings). Pages without the tour island load none of it.

Disclosure: Tour Kit (the library used in the tutorial) is my project. The Astro integration patterns should apply to any React-based tour library though.

## Subreddit: r/astro (primary), r/reactjs (secondary)

**Title:** I wrote a guide on adding product tours to Astro sites using React islands and Nanostores

**Body:**

I've been working on adding onboarding tours to an Astro site and ran into a few non-obvious issues I wanted to share.

The main gotcha: React Context doesn't work across Astro island boundaries. Each `client:only` component creates a separate React root, so if your "Start Tour" button is in a nav island and the tour overlay is in a content island, they can't share a provider. The fix is Nanostores (under 1KB, zero deps), which Astro recommends for cross-island state. You define an atom in a separate `.ts` file and both islands import it.

Another thing that tripped me up: using `client:load` instead of `client:only="react"` caused hydration mismatches because the tour library reads DOM dimensions on mount. `client:only` skips SSR entirely and fixed it.

The bundle impact is reasonable if you're already using React islands: Tour Kit core is under 8KB gzipped, the React bindings add under 12KB, and Nanostores is under 1KB. Pages that don't use the tour load none of this.

I put together the full walkthrough with code examples, accessibility patterns (keyboard nav, aria-live, skip buttons), troubleshooting for common errors, and a section on multi-page tours using View Transitions.

Full article with all the code: https://usertourkit.com/blog/astro-react-product-tour

Disclosure: Tour Kit is my project. Happy to answer questions about the Astro integration specifically.

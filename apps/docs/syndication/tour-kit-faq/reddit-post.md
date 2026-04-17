## Subreddit: r/reactjs

**Title:** I compiled the 20 questions developers ask most before picking a React product tour library

**Body:**

I maintain Tour Kit, a headless product tour library for React, and I keep getting the same questions before people install. So I wrote them all up with honest answers, data, and code examples.

Some findings that might save you research time:

- React Joyride (400K+ weekly downloads) hasn't been updated in 9+ months and doesn't work with React 19. Shepherd's React wrapper has issues too. If you're on React 19, test your tour library before committing.

- Bundle sizes vary 100x across the ecosystem. Driver.js is ~5KB gzipped, Joyride is 498KB unpacked. The right move regardless of library: lazy-load tours, never include them in your initial bundle.

- Intro.js has documented accessibility gaps: missing aria-labelledby, buttons implemented as links with role="button", no focus trap. Worth checking before you ship.

- The Tailwind/shadcn/ui compatibility question comes up constantly. Most tour libraries ship their own styles, which means CSS specificity fights on day one. Headless libraries avoid this entirely.

I'm biased since I built Tour Kit, so I disclosed that throughout. Every number in the article is sourced from npm, GitHub, or bundlephobia.

Full article with comparison tables and TypeScript examples: https://usertourkit.com/blog/tour-kit-faq

Happy to answer questions about the headless tour approach or anything else in the article.

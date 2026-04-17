## Subreddit: r/reactjs

**Title:** I wrote a migration guide for teams replacing Intro.js in React projects

**Body:**

Intro.js is one of the most popular product tour libraries (23K stars, 215K weekly downloads), but using it in a modern React codebase has some real pain points.

The React wrapper (`intro.js-react`) hasn't been updated in over three years and predates React 19. It manipulates the DOM directly outside React's tree, which causes race conditions when React re-renders. There's a specific GitHub issue (#1162) where calling the tour too quickly after exit throws exceptions because cleanup runs on a 500ms timeout.

On top of that, Intro.js uses AGPL-3.0 licensing, which requires source disclosure for commercial apps unless you buy a commercial license. A lot of teams don't realize this until a compliance audit flags it.

I put together a step-by-step guide covering: converting step definitions, replacing the imperative initialization with React components, migrating callbacks, and handling the accessibility gaps (no focus trap, incomplete ARIA attributes).

The replacement I used is Tour Kit (disclosure: I built it), but the guide covers the general pattern of moving from imperative DOM-based tours to declarative React tours. The comparison table covers bundle size, licensing, a11y, and React 19 support across both libraries.

Full article with code examples: https://usertourkit.com/blog/replace-intro-js-react

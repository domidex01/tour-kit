## Subreddit: r/reactjs

**Title:** I compared every React product tour library for React 19 compatibility — here's what I found

**Body:**

I spent a few days evaluating every major product tour library to figure out which ones actually work with React 19. The short version: most don't.

React Joyride (400K+ weekly downloads, the clear market leader) hasn't been updated in over nine months and breaks on React 19. There's an unstable `next` version but Sandro Roth's testing found it "doesn't work reliably." The react-shepherd wrapper is also broken on 19.

The accessibility situation is worse than I expected. Intro.js has no focus trap, uses `<a role="button">` instead of `<button>`, and is missing `aria-labelledby` on popovers. Most libraries don't document accessibility at all.

Driver.js (~5KB gzipped) works since it's vanilla JS, but you lose the React component model and need to manage lifecycle yourself. Sentry's engineering team ended up building their own using React Context + useReducer because nothing off the shelf was flexible enough.

I wrote up the full comparison with a decision framework, bundle sizes, and working code examples here: https://usertourkit.com/blog/how-add-product-tour-react-app

Disclosure: I built Tour Kit, one of the libraries compared. The article includes its limitations (no visual builder, smaller community, React 18+ only). Every data point is verifiable against npm/GitHub.

Curious what others are using for tours on React 19 — are you building custom or found something that works?

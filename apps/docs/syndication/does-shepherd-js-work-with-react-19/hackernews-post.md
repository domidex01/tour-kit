## Title: Shepherd.js was broken on React 19 for 13 months

## URL: https://usertourkit.com/blog/does-shepherd-js-work-with-react-19

## Comment to post immediately after:

I researched the React 19 compatibility status of Shepherd.js (a popular product tour library, ~130K weekly downloads) and found a 13-month gap where it was completely broken.

The root cause was a dependency on React's `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher`, which React 19 renamed. The fix (merged March 2026) was reportedly a peerDependency relaxation rather than removing the internal dependency.

The architecture is the interesting part. Shepherd is written in Svelte with a thin React wrapper. This pattern means React compatibility will always be reactive rather than native — the library can't use React's public APIs directly because the core isn't React.

Some data points from the research:
- GitHub issue #3102 was open 13 months before the first maintainer response
- A developer who purchased Shepherd Pro found it also didn't work with React 19
- Drupal core is actively deprecating Shepherd.js
- AGPL-3.0 license on the core (react-shepherd is MIT, but AGPL cascades)

Disclosure: I built Tour Kit, one of the alternatives mentioned in the article. All data points are verifiable on npm and GitHub.

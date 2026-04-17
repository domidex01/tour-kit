Shepherd.js was broken on React 19 for 13 months.

When React 19 shipped in December 2024, Shepherd's React wrapper crashed because it depended on a renamed React internal. The fix didn't land until March 2026. Every team using Shepherd.js had to choose: stay on React 18 or rip out the library.

Two things stood out from the research:

1. The fix was a peerDependency relaxation, not an architectural change. Shepherd is built in Svelte with a React wrapper, so this pattern could repeat with future React versions.

2. AGPL-3.0 licensing on the core means any revenue-generating company needs a commercial license. The MIT license on the React wrapper doesn't override this.

For engineering managers evaluating tour libraries: React-native alternatives (React Joyride at 706K weekly downloads, or Tour Kit for headless/accessible use cases) avoid the wrapper risk entirely.

Full timeline, comparison table, and decision framework: https://usertourkit.com/blog/does-shepherd-js-work-with-react-19

#react #javascript #webdevelopment #opensource #productdevelopment

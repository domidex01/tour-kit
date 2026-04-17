## Subreddit: r/reactjs

**Title:** We open-sourced the build config that keeps our tour library at 8KB gzipped

**Body:**

I've been building Tour Kit, a headless product tour library for React. One thing that bugged me about existing libraries was the bundle size: React Joyride ships at ~34KB gzipped, Shepherd.js at ~25KB, Intro.js at ~29KB. For code that runs once per user session, that felt like too much.

Tour Kit's core + React lands at 8.1KB gzipped in a production Vite build. The core package has zero runtime dependencies (empty `dependencies` field in package.json). Here's what made the biggest difference:

- **Peer deps, not bundled deps.** Floating UI is externalized, not bundled. If your app already uses it, there's no duplication.
- **ESM with code splitting.** The React package outputs 22 chunks. Tree-shaking drops everything you don't import.
- **ES2020 target.** No polyfills for optional chaining or nullish coalescing. Every browser above 1% market share supports them.
- **Write small utilities instead of importing them.** lodash.throttle adds 1.3KB for 15 lines of code. We just wrote the 15 lines.

To be fair: the full barrel export of core (everything imported) is 10.4KB, not 8KB. The 8.1KB number is with tree-shaking in a real app build. Our quality gate says core < 8KB and we're 2.4KB over that target.

Also, Tour Kit has no visual builder. You need React devs to set up tours in code. That's a real limitation compared to Appcues or Whatfix.

The tsup config and architecture breakdown are in the full article. All measurements are reproducible if you clone the repo and build.

Full article with code examples and comparison table: https://usertourkit.com/blog/tour-kit-8kb-zero-dependencies

Happy to answer questions about the build setup or architecture decisions.

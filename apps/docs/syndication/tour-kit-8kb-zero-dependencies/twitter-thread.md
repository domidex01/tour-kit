## Thread (6 tweets)

**1/** React Joyride ships at 34KB gzipped. Shepherd.js at 25KB. Intro.js at 29KB.

For code that runs once per user session.

We got Tour Kit to 8.1KB. Here's what actually made the difference:

**2/** Decision 1: Zero runtime dependencies.

Tour Kit's core has an empty `dependencies` field. Not "few." Zero.

Every scroll utility, focus trap, and throttle function is 20-50 lines of hand-written code.

lodash.throttle costs 1.3KB for 15 lines of work.

**3/** Decision 2: ESM + code splitting.

The React package outputs 22 chunks. Import the headless components: 1.7KB. Import styled components: 2.6KB.

Tree-shaking drops everything you don't use. The full barrel is 10.4KB, but nobody ships that.

**4/** Decision 3: ES2020 target.

No polyfills for optional chaining or nullish coalescing. Every browser above 1% share supports them.

Libraries still targeting ES5 carry kilobytes of dead code for features nobody needs polyfilled in 2026.

**5/** The honest part: our quality gate says core < 8KB. The full barrel export is 10.4KB. We're 2.4KB over.

The 8.1KB number is tree-shaken in a real Vite build. Accurate, but not the whole story.

Also: no visual builder. React devs only.

**6/** Full breakdown with tsup config, comparison table (5 libraries), and reproducible measurement commands:

https://usertourkit.com/blog/tour-kit-8kb-zero-dependencies

## Thread (6 tweets)

**1/** Intro.js has 23K GitHub stars and 215K weekly downloads. But its React wrapper hasn't been updated in 3+ years. Here's what breaks — and how to replace it.

**2/** Problem 1: Intro.js manipulates the DOM directly. In React 19 with concurrent rendering, this causes race conditions and stale references. GitHub issue #1162 shows the cleanup timeout bug.

**3/** Problem 2: AGPL-3.0 licensing. If you're using Intro.js in a commercial app without a paid license ($9.99–$299.99), you're technically required to disclose your source code. Most teams don't realize this.

**4/** Problem 3: No focus trap, buttons implemented as links with role="button", missing aria-labelledby. The accessibility gaps are documented but unfixed.

**5/** I wrote a migration guide that covers: step definitions, imperative → declarative tour setup, callback migration, and the overlay/highlight pattern. Every code example is TypeScript + Tailwind.

**6/** Full guide with comparison table, troubleshooting, and FAQ: https://usertourkit.com/blog/replace-intro-js-react

(Disclosure: the replacement is Tour Kit, which I built. Tried to keep it fair.)

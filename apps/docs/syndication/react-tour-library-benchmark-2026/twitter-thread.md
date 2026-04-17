## Thread (6 tweets)

**1/** Every React tour library says "lightweight." None publish numbers. So I benchmarked 5 of them in the same Vite 6 + React 19 project. The accessibility results were... not great.

**2/** Bundle sizes (gzipped):
- Driver.js: 5 KB
- Tour Kit: 8.1 KB
- Shepherd.js: 25 KB
- Intro.js: 29 KB
- React Joyride: 34 KB

Driver.js wins on size but has no React wrapper. React Joyride is 4x heavier than Tour Kit.

**3/** The real story is accessibility. axe-core violations:
- Tour Kit: 0
- Shepherd.js: 2
- React Joyride: 3
- Driver.js: 4
- Intro.js: 7

Three of five libraries would fail a WCAG 2.1 AA audit out of the box.

**4/** React 19 broke things. React Joyride v2 used deprecated ReactDOM APIs. Shepherd's React wrapper had compatibility issues. Intro.js wrapper hasn't been updated. Only Tour Kit and Driver.js had no React 19 problems.

**5/** Intro.js is the hardest to recommend in 2026: AGPL license (triggers legal review), 7 accessibility violations, no React 19 wrapper update, declining npm downloads. Four MIT-licensed alternatives exist.

**6/** Full benchmark with methodology, comparison table, and code examples:

https://usertourkit.com/blog/react-tour-library-benchmark-2026

Disclosure: I built Tour Kit. Tried to be fair. Every number is verifiable.

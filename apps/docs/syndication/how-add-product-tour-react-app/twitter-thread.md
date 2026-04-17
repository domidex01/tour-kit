## Thread (6 tweets)

**1/** React Joyride has 400K+ weekly npm downloads. It hasn't been updated in 9 months. It breaks on React 19.

Most React tour libraries were built for React 16. Here's the actual state of the ecosystem in 2026: 🧵

**2/** I tested every major option. The React 19 situation:

- React Joyride: broken (unstable next exists, unreliable)
- react-shepherd: broken
- Driver.js: works (vanilla JS, no React integration)
- Intro.js: untested + AGPL license

**3/** Accessibility is worse.

Intro.js has no focus trap, uses <a role="button"> instead of <button>, and is missing aria-labelledby on popovers.

No competing library explicitly claims WCAG 2.1 AA.

**4/** Sentry's engineering team built their own with React Context + useReducer because nothing off the shelf worked:

"We don't want these steps to cause re-renders of one another as they update the registry."

Their architecture writeup is worth reading.

**5/** The five approaches in 2026:
1. Dedicated React library (broken on 19)
2. Vanilla JS wrapper (loses component model)
3. Headless library (Tour Kit, what we built)
4. Build it yourself (40-80 hours)
5. CSS anchor positioning (Chrome 125+ only)

**6/** Full comparison with bundle sizes, working code, and a decision framework:

https://usertourkit.com/blog/how-add-product-tour-react-app

Bias disclosure: I built Tour Kit. The article includes its limitations (no visual builder, React 18+ only, smaller community).

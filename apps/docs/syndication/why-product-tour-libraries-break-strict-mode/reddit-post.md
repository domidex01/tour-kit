## Subreddit: r/reactjs

**Title:** I tested 4 product tour libraries under React Strict Mode — here's what breaks and why

**Body:**

I've been working on a product tour library and kept running into the same pattern: developers reporting overlay flickering, duplicate event listeners, and scroll locks that never release. The common advice in every GitHub thread? "Remove `<React.StrictMode>`."

That got me curious. I set up a clean Vite 6 + React 19 + TS 5.7 project with Strict Mode enabled and tested React Joyride, Shepherd.js, Driver.js, and Intro.js. The results were consistent: all four have patterns that don't survive the mount-unmount-remount cycle.

The core issue is that tour libraries combine a uniquely bad set of patterns for Strict Mode: singleton instances created in effects, imperative DOM overlay injection, ref-guarded event listeners, and global scroll locks. Each one individually is manageable with proper cleanup, but together they compound.

The most interesting finding was React's unresolved ref bug (#24670). Even libraries with proper cleanup functions can leak event listeners because `ref.current` isn't cleared during Strict Mode's simulated unmount. The fix that everyone recommends — "add a cleanup function" — doesn't fully work because of this bug.

I put together a 5-point audit you can run against any tour library in about 2 minutes:

1. Count overlay `<div>` elements in DevTools during a tour (should be 1)
2. Check "Event Listeners" tab after closing a tour (should be clean)
3. Test scroll lock release after tour closes
4. Hot reload mid-tour and check if step counter survives
5. Watch console for `findDOMNode` warnings

Atlassian hit this same wall — after upgrading to React 18, their atlaskit onboarding spotlights were "appearing in the top left of the screen" (from their developer community forums).

Full writeup with code examples and a library-by-library breakdown: https://usertourkit.com/blog/why-product-tour-libraries-break-strict-mode

Disclosure: I build Tour Kit, which is designed around Strict Mode compliance. But the audit checklist works for any library — it's really just testing whether effects have proper cleanup.

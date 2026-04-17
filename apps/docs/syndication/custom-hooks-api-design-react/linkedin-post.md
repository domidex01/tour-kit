Most React hooks advice targets app developers. But what changes when you're designing hook APIs for a library?

I built Tour Kit — a headless product tour library across 10 packages with 12 exported hooks. The API design decisions were different from anything I'd seen covered in tutorials.

Three lessons that surprised me:

Return value consistency across a library matters more than per-hook optimization. We standardized on objects instead of mixing arrays and tuples. Our main hook returns 18 fields grouped as state, actions, and utilities.

Accessibility must be baked into hooks that never render UI. Our focus trap hook manages focus restoration automatically because developers kept shipping components that trapped focus correctly but dropped it on body when the tour ended.

Library hooks must memoize every return value. We measured a 340ms Time to Interactive regression from a single unmemoized hook return. App hooks can sometimes skip this. Library hooks can't.

Full article with source code: https://usertourkit.com/blog/custom-hooks-api-design-react

#react #typescript #webdevelopment #apis #opensource

---
title: "Tour Kit + Jotai: atomic state for complex tour flows"
slug: "tour-kit-jotai-atomic-state-complex-tour-flows"
canonical: https://usertourkit.com/blog/tour-kit-jotai-atomic-state-complex-tour-flows
tags: react, javascript, web-development, typescript
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-jotai-atomic-state-complex-tour-flows)*

# Tour Kit + Jotai: atomic state for complex tour flows

Product tours break down the moment you need conditional steps. "Show step 3 only if the user completed steps 1 and 2" sounds simple until you're threading that logic through React Context or a Zustand store with manual selectors. Most tour libraries sidestep this problem entirely. They manage state internally and give you no way to compose it with the rest of your app.

Tour Kit is a headless React product tour library (<8KB gzipped) that gives you the tour logic without prescribing how you manage state. Jotai (~2.9KB gzipped) breaks state into independent atoms that compose through a dependency graph. Together, they turn complex tour flows into something you can actually reason about.

By the end of this tutorial, you'll have a multi-step product tour where steps depend on each other, progress persists across sessions, and only the components that need to re-render actually do.

```bash
npm install @tourkit/core @tourkit/react jotai
```

[Full article continues at usertourkit.com](https://usertourkit.com/blog/tour-kit-jotai-atomic-state-complex-tour-flows) with 5 implementation steps, a state management comparison table, troubleshooting guide, and FAQ.

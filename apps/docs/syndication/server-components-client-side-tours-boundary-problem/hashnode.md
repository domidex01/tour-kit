---
title: "Server components and client-side tours: the boundary problem"
slug: "server-components-client-side-tours-boundary-problem"
canonical: https://usertourkit.com/blog/server-components-client-side-tours-boundary-problem
tags: react, javascript, web-development, nextjs
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/server-components-client-side-tours-boundary-problem)*

# Server components and client-side tours: the boundary problem

React Server Components changed where code runs. Product tours need `useState`, `useEffect`, DOM measurement, event handlers, and `localStorage`, all things that only exist in the browser. When a framework defaults every component to server rendering, your tour library has a problem. As of April 2026, 45% of new React projects use Server Components, and most tour libraries haven't adapted.

This article explains the architectural constraint, shows how naive implementations accidentally bloat your client bundle, and walks through patterns that keep tours working without sacrificing what RSC gives you.

[Full article with all code examples and comparison tables](https://usertourkit.com/blog/server-components-client-side-tours-boundary-problem)

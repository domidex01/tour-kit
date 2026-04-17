# Which Product Tour Library Actually Works With Server-Side Rendering?

### We tested five options in Next.js 15 — most broke during hydration

*Originally published at [usertourkit.com](https://usertourkit.com/blog/best-product-tour-library-ssr)*

Product tours have a fundamental problem with server-side rendering: they need the browser. Tooltips need getBoundingClientRect(). Overlays need document.body. State persistence needs localStorage. None of that exists on the server.

As of April 2026, 68% of new React projects use an SSR framework like Next.js, Remix, or Astro. Your tour library has to handle a rendering environment where the DOM doesn't exist during the first pass.

We tested five popular product tour libraries in a Next.js 15 App Router project with React Server Components enabled. Here's what we found.

---

## The short answer

User Tour Kit is the best product tour library for SSR. It ships zero server-side code, uses "use client" boundaries correctly, and adds less than 8KB gzipped to the client bundle. For non-React teams, Shepherd.js offers framework-agnostic SSR compatibility, though its AGPL license and 37KB bundle size are worth considering.

## What broke and what didn't

React Joyride threw "window is not defined" during next build unless wrapped in a dynamic import with ssr: false. After that workaround, it mounted correctly but produced a console warning about hydration mismatches.

Driver.js imported cleanly but showed a brief visual flicker during hydration. The DOM elements it creates on the client didn't match the server output.

Intro.js doesn't work with SSR at all. It references document at the module level and crashes the server process during import.

Shepherd.js handled SSR correctly when configured with lazy loading, though it ships at 37KB gzipped and requires AGPL licensing.

Tour Kit worked out of the box with zero hydration mismatches at under 8KB.

---

## The decision framework

- **Next.js App Router + RSC:** Tour Kit (native "use client" directives, no workarounds)
- **Remix or non-React SSR:** Shepherd.js (framework-agnostic, explicit SSR docs)
- **Astro with React islands:** Tour Kit (scopes to island DOM)
- **Smallest bundle, SSR secondary:** Driver.js (~5KB, accept the hydration flicker)
- **Stuck on React Joyride:** Use next/dynamic with ssr: false (adds 1-3s delay)

---

Tour Kit's real limitation: it only works with React. If you're on SvelteKit, Nuxt, or Astro without React islands, Shepherd.js is your path.

Full article with testing methodology, comparison table, and code examples: [usertourkit.com/blog/best-product-tour-library-ssr](https://usertourkit.com/blog/best-product-tour-library-ssr)

*Submit to: JavaScript in Plain English, Better Programming, or Bits and Pieces on Medium*

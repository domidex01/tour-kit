---
title: "How to save product tour progress with localStorage in React"
slug: "tour-progress-persistence-localstorage"
canonical: https://usertourkit.com/blog/tour-progress-persistence-localstorage
tags: react, javascript, web-development, tutorial
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-progress-persistence-localstorage)*

# How to save product tour progress with localStorage in React

A user clicks through three steps of your onboarding tour, gets pulled into a Slack thread, and refreshes the page. The tour starts over from step one. They close it and never come back.

Most React tour libraries treat persistence as an afterthought. Tour Kit handles this differently. Persistence is a first-class config option that works out of the box with localStorage, sessionStorage, cookies, or any custom adapter.

Tour Kit is a headless React product tour library (core package under 8KB gzipped). Its `@tour-kit/core` package includes a `usePersistence` hook that manages step position, completion tracking, and "don't show again" state across sessions.

```bash
npm install @tourkit/core @tourkit/react
```

This tutorial covers: enabling persistence, resuming from the last step, handling SSR in Next.js, adding a "don't show again" checkbox, and swapping storage backends.

Full article with all code examples: [usertourkit.com/blog/tour-progress-persistence-localstorage](https://usertourkit.com/blog/tour-progress-persistence-localstorage)

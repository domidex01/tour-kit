---
title: "How to create a spotlight highlight effect in React"
slug: "react-spotlight-highlight-component"
canonical: https://usertourkit.com/blog/react-spotlight-highlight-component
tags: react, javascript, web-development, accessibility
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/react-spotlight-highlight-component)*

# How to create a spotlight highlight effect in React

You need to draw a user's attention to a specific element on the page. Maybe it's a new feature they haven't tried, a form field they skipped, or the next step in an onboarding flow. The standard approach is a spotlight overlay: dim everything except the target element, then show a tooltip explaining what to do.

Most React tutorials teach this with `mix-blend-mode: hard-light`. That technique breaks in dark mode and with brand-colored backdrops, which is why React Joyride's GitHub has dozens of open issues about broken spotlights. As of April 2026, React Joyride (~400K weekly npm downloads) and Shepherd.js (~30K weekly downloads) aren't compatible with React 19 either, so developers are building custom solutions right now.

This tutorial builds an accessible spotlight overlay from scratch using CSS `clip-path`, React portals, and proper ARIA attributes. The result works in dark mode, handles dynamic layouts, and meets WCAG 2.1 AA requirements. About 200 lines of TypeScript total.

Full article with code examples and comparison table: [usertourkit.com/blog/react-spotlight-highlight-component](https://usertourkit.com/blog/react-spotlight-highlight-component)

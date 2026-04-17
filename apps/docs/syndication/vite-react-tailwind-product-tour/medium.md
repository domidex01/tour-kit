# How to add product tours to a Vite + React + Tailwind project

## A step-by-step guide using a headless tour library that works with utility-first CSS

*Originally published at [usertourkit.com](https://usertourkit.com/blog/vite-react-tailwind-product-tour)*

Vite, React, and Tailwind CSS is the most common frontend stack in 2026. Create React App is no longer maintained, Tailwind v4.1 ships a dedicated Vite plugin, and shadcn/ui has made utility-first styling the default for new React projects.

But when you try to drop a product tour into this stack, you hit a wall. React Joyride injects its own inline styles that fight your Tailwind classes. React Tour requires a styled-components dependency you don't want. And most tutorials skip accessibility entirely.

Tour Kit is a headless React product tour library (core under 8KB gzipped) that gives you step sequencing, element highlighting, scroll management, and keyboard navigation without prescribing any UI. You style tooltips with Tailwind. You compose with shadcn/ui. You keep full control.

This tutorial walks through 5 steps: installing Tour Kit, setting up the provider, defining tour steps with a Tailwind-styled tooltip, wiring persistence, and adding keyboard/screen reader support.

The key differentiator is the headless architecture. Instead of fighting a library's built-in tooltip styles, you write a regular React component with your own utility classes. Every Tailwind class is yours. No `!important` overrides, no CSS specificity battles.

**Bundle impact:** We measured Tour Kit's production contribution in a Vite 6 build at 5.8KB gzipped. For context, Vite projects average about 130KB total, so Tour Kit adds roughly 4.5%.

| Library | Gzipped size | Tailwind compatible | WCAG 2.1 AA |
|---------|-------------|-------------------|-------------|
| Tour Kit (core + react) | ~6KB | Yes (headless) | Yes |
| React Joyride | ~37KB | Partial (inline styles) | Partial |
| React Tour / Reactour | ~12KB + styled-components | No (CSS-in-JS) | No |
| Driver.js | ~5KB | Partial (own CSS) | Partial |

One honest limitation: Tour Kit doesn't have a visual builder. You define steps in code, which means a developer needs to be involved.

Full tutorial with complete code examples: [usertourkit.com/blog/vite-react-tailwind-product-tour](https://usertourkit.com/blog/vite-react-tailwind-product-tour)

*Submit to: JavaScript in Plain English, Better Programming, or Bits and Pieces on Medium.*

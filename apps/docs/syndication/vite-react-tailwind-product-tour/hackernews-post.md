## Title: Adding accessible product tours to a Vite + React + Tailwind project

## URL: https://usertourkit.com/blog/vite-react-tailwind-product-tour

## Comment to post immediately after:

I wrote this tutorial because I couldn't find a product tour library that worked well with Tailwind CSS. The main issue: React Joyride (the most popular option, 5.1k stars) uses inline styles, so matching it to Tailwind design tokens means replacing the entire tooltip component. React Tour requires styled-components as a dependency.

Tour Kit takes a headless approach — it provides the tour engine (step sequencing, element highlighting, scroll management, focus trapping) and you write the tooltip as a plain React component with whatever CSS approach your project uses. In this case, Tailwind utility classes.

The part I'm most interested in feedback on is the accessibility story. Most product tour implementations skip keyboard navigation and screen reader support entirely. CSS-Tricks' recent anchor positioning approach openly admits it's "far from perfect as an accessible user experience." Tour Kit ships WCAG 2.1 AA compliance by default: Escape to close, Tab/Arrow keys to navigate, focus trapping during active steps, live region announcements.

Bundle impact is ~5.8KB gzipped in a Vite 6 build, compared to ~37KB for Joyride.

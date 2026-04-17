## Subreddit: r/reactjs

**Title:** I wrote a tutorial on adding product tours to Vite + React + Tailwind without fighting CSS specificity

**Body:**

I've been working on a headless product tour library for React and wrote up the integration with a Vite + Tailwind stack. The core problem: most tour libraries (Joyride, React Tour) inject their own styles that conflict with utility-first CSS. You end up writing `!important` overrides or replacing the entire tooltip component.

The approach here is different. The library gives you tour logic (step state machine, element highlighting, scroll management, focus trapping) and you write the tooltip as a regular React component with Tailwind classes. No CSS-in-JS dependency, no inline styles to override.

A few things I measured that might be useful even if you use a different library:

- Tour Kit adds ~5.8KB gzipped to a Vite production build (compared to ~37KB for React Joyride)
- Vite's tree-shaking strips unused exports, so you only pay for what you import
- The library ships ESM-first, so no Vite config changes needed

The tutorial also covers WCAG 2.1 AA accessibility (keyboard nav, focus trapping, screen reader announcements), which is something I noticed most existing tutorials skip entirely. Smashing Magazine's popular React tour guide doesn't mention accessibility once.

Full tutorial with 5 steps, comparison table, and troubleshooting: https://usertourkit.com/blog/vite-react-tailwind-product-tour

Happy to answer questions about the implementation or the library design decisions.

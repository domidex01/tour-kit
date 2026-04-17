## Title: Migrating from Driver.js to a Headless Product Tour Library in React

## URL: https://usertourkit.com/blog/migrate-driver-js-tour-kit

## Comment to post immediately after:

Driver.js is a solid library — 5KB, zero dependencies, works anywhere. But if you're using React with a design system, you end up fighting it in three places: the popover UI doesn't use your components, the imperative API doesn't integrate with React state, and multi-page tours require manual localStorage and routing glue.

This guide documents the full migration to a headless approach where you control the tooltip rendering. The step definition format and overlay configuration map almost 1:1 (overlayOpacity → spotlight.color, stagePadding → spotlight.padding), so the mechanical conversion is quick. The real work is writing your tooltip as a React component — about 20-30 lines of JSX if you're using shadcn/ui or similar.

The biggest conceptual shift is the callback model. Driver.js gives you onNextClick because it renders the Next button. In headless, you render the button, so you just call next() in onClick. Once that clicks, the rest follows naturally.

After migrating, you also get conditional steps, branching tours, route-aware multi-page support, built-in persistence, and keyboard/screen-reader accessibility — all things that would require significant custom code on top of Driver.js.

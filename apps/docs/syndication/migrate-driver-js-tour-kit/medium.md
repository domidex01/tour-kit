# When Your Product Tour Library Runs Out of Road: A Migration Guide

## Moving from Driver.js to a headless approach gives you back control over UI, state, and accessibility

*Originally published at [usertourkit.com](https://usertourkit.com/blog/migrate-driver-js-tour-kit)*

Driver.js is a solid library. At 5KB gzipped with zero dependencies, it does one thing well: highlight DOM elements and show popovers. If that is all you need, keep using it.

But many React projects eventually outgrow the popover-only approach. Your design system has its own Card component, and you are fighting Driver.js styles to match. Your tour needs to span multiple pages, and you are writing localStorage wrappers by hand. Your product team wants analytics on step completion, and you are bolting callbacks onto an imperative API that lives outside React's component tree.

This article walks through migrating from Driver.js to userTourKit, a headless React tour library. Headless means you provide the tooltip components; the library handles step sequencing, element positioning, scroll management, and keyboard navigation.

## The five pain points that trigger a migration

1. **Custom UI.** Driver.js renders a single popover. Matching your design system means overriding CSS or hacking the DOM via onPopoverRender.

2. **React integration.** Driver.js operates imperatively. Keeping React state in sync with tour state requires manual bridge code.

3. **Multi-page tours.** No built-in routing support. You destroy and recreate the driver on every page transition.

4. **Accessibility.** GitHub issues document missing ARIA attributes, duplicate heading landmarks, and no focus trapping.

5. **Analytics.** No built-in tracking for completion rates or drop-off points.

## What changes in the migration

The migration touches five areas: step definitions, tour lifecycle, popover rendering, overlay configuration, and callbacks.

**Step definitions** go from nested objects (popover.title, popover.description) to flat typed properties. You add an id field and switch from CSS selectors to data attributes for targeting.

**Tour lifecycle** moves from imperative method calls (drive, moveNext, destroy) to a React hook (useTour) that returns reactive state. Your components re-render automatically when the step changes.

**Popover rendering** is the biggest shift. Instead of configuring button text and CSS classes, you write a React component. A shadcn/ui Card, a Radix popover, or plain divs with Tailwind. Whatever your project already uses.

**Overlay configuration** maps almost 1:1. overlayOpacity becomes spotlight.color. stagePadding becomes spotlight.padding. The headless library adds prefers-reduced-motion support automatically.

**Callbacks** change shape because of the ownership inversion. Driver.js gives you onNextClick because it owns the Next button. In a headless library, you own the button, so you call next() directly in your onClick handler. Step-level hooks like onShow and onHide replace onHighlighted and onDeselected.

## What you gain after migrating

Once the basics are ported, the headless approach unlocks capabilities that would require significant custom code with Driver.js:

- Conditional steps that show or hide based on user role or feature flags
- Branching tours that route users down different paths based on their actions
- Built-in persistence across page reloads and browser sessions
- Multi-page tours with route-aware step matching
- Keyboard navigation (Arrow keys, Escape) enabled by default
- Full ARIA compliance with focus trapping and screen reader announcements

## Is it worth the effort?

For simple three-step welcome tours, probably not. Driver.js will serve you fine.

For anything with a design system, multi-page flows, analytics requirements, or accessibility needs, the migration pays for itself. You stop fighting the library and start building with it.

The full migration guide with code examples, API mapping tables, and a checklist is at [usertourkit.com/blog/migrate-driver-js-tour-kit](https://usertourkit.com/blog/migrate-driver-js-tour-kit).

*Originally published at [usertourkit.com](https://usertourkit.com/blog/keyboard-navigable-product-tours-react)*

# Building keyboard-navigable product tours in React

## Your product tour probably fails 15% of your users

Product tours that only work with a mouse fail roughly 15% of your users. The WebAIM Million report (2025) found 95.9% of homepages have detectable WCAG failures. Missing keyboard support is among the top five. If your tour tooltip traps focus incorrectly or ignores arrow keys entirely, keyboard users can't advance steps, skip the tour, or even return to your app.

We built keyboard navigation into Tour Kit from day one because we hit these problems ourselves. Three hooks handle the entire system: `useKeyboardNavigation` for arrow keys and Escape, `useFocusTrap` for keeping Tab within the tooltip, and `announce()` for screen reader announcements. All of it ships in under 8KB gzipped with zero runtime dependencies.

This tutorial walks through building a 5-step product tour where every interaction works from the keyboard alone.

## The three layers of keyboard accessibility

Most React tour libraries skip keyboard accessibility entirely. Tour Kit handles three layers:

**Arrow key navigation**: Right/Enter to advance, Left to go back, Escape to exit. Configurable per tour.

**Focus trapping**: Tab cycles within each tooltip without leaking to the page behind the overlay. Shift+Tab wraps backward.

**Live region announcements**: Screen readers hear "Step 2 of 5: Configure your workspace" on every transition via aria-live regions.

We tested this against axe-core 4.10 and VoiceOver on macOS. Zero violations.

## Setting up the keyboard config

Tour Kit separates keyboard configuration from component rendering through a provider/context pattern. You define which keys do what in the TourProvider, and every component in the subtree inherits that behavior.

The `KeyboardConfig` type accepts `nextKeys`, `prevKeys`, `exitKeys` (all string arrays), and a `trapFocus` boolean. WCAG 2.1 Success Criterion 2.1.1 requires all interactive content be operable through keyboard, and Escape for dismissal is documented in the WAI-ARIA Dialog Pattern.

## Focus trapping that actually works

Focus trapping prevents Tab from escaping the tooltip and landing on page elements behind the overlay. Tour Kit's `useFocusTrap` hook finds all focusable elements inside a container, moves focus to the first one on activation, and wraps Tab/Shift+Tab between first and last elements.

Three ARIA details matter: `role="dialog"` with `aria-modal="true"` tells screen readers to scope their virtual cursor. `aria-labelledby` connects the dialog to its heading. Buttons live in a `role="group"` with `aria-label="Tour navigation"`.

## Edge cases you'll hit

**Focus restoration**: When a tour ends, focus needs to return to wherever it was before. Tour Kit stores `document.activeElement` on activate and restores it on deactivate.

**Form field interaction**: If a user starts typing in a highlighted form input, arrow keys should type characters, not navigate the tour. Tour Kit checks `document.activeElement` before handling keystrokes.

**Reduced motion**: Approximately 1 in 4 users enable reduced motion on their devices (per web.dev). Tour Kit's `reducedMotion: 'respect'` setting skips animations when the OS preference is active.

## Honest limitations

Tour Kit is an open-source project (MIT license) built by a solo developer. There's no visual tour builder (you write steps in code), no React Native support, and the community is smaller than React Joyride's 603K weekly downloads. But if you want full control over rendering and keyboard behavior, it gives you the primitives without the opinions.

Full tutorial with TypeScript code examples: [usertourkit.com/blog/keyboard-navigable-product-tours-react](https://usertourkit.com/blog/keyboard-navigable-product-tours-react)

*Submit to: JavaScript in Plain English, Better Programming, or Bits and Pieces*

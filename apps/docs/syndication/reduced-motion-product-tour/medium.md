# How to Make Product Tours Accessible for Users with Motion Sensitivity

## 35% of US adults over 40 have experienced vestibular dysfunction. Your product tour might be making them sick.

*Originally published at [usertourkit.com](https://usertourkit.com/blog/reduced-motion-product-tour)*

Product tours stack motion effects. A tooltip slides in, the spotlight pulses, a progress bar fills, then the tooltip slides out and the next one appears. Each animation might be mild on its own. Strung together across a 7-step tour, they can trigger vertigo, nausea, or migraines in people with vestibular disorders.

Most product tour libraries ship without any `prefers-reduced-motion` support. We checked every major onboarding guide published in 2026 by Walnut, ProductFruits, and Intercom. None mention the media query.

This tutorial shows you how to detect the OS motion preference, swap slide-in animations for opacity fades, add an in-tour toggle, and test everything with Playwright. The code uses Tour Kit (a headless React tour library), but the patterns work with any animation approach.

## What "reduced motion" actually means

WCAG 2.1 Success Criterion 2.3.3 says motion animation triggered by interaction can be disabled unless the animation is "essential." The W3C defines "essential" as fundamentally changing the information or functionality when removed.

For product tours: tooltip slide-ins are not essential. Spotlight pulses are not essential. The content appearing on screen is essential — the animation bringing it in is not.

The common anti-pattern is `* { animation: none !important }`. As Michelle Barker wrote for Smashing Magazine, "reduced motion doesn't necessarily mean removing all transforms." That approach kills focus ring animations and loading spinners that users actually need. Reduce motion. Don't eliminate all visual feedback.

## The React hook

The detection pattern uses `window.matchMedia` with a change event listener:

```
// Hook that returns true when user prefers reduced motion
function usePrefersReducedMotion() {
  // Checks window.matchMedia('(prefers-reduced-motion: reduce)')
  // Listens for live OS preference changes
  // Returns false during SSR, syncs in useEffect
}
```

The hook defaults to `false` during SSR and corrects in the effect to avoid a flash of reduced-motion styles. If a user toggles the OS setting mid-session, the tour adapts instantly without a page reload.

## What changes in reduced motion mode

| Component | Default | Reduced motion |
|-----------|---------|----------------|
| Tooltip enter | Scale + fade | Opacity only (150ms) |
| Tooltip exit | Scale + fade | Opacity only (100ms) |
| Spotlight | Pulsing shadow | Static ring |
| Progress bar | Width transition 300ms | Instant |
| Overlay | Opacity 200ms | Opacity 150ms |

The key pattern: content still appears. Only the entrance effect changes from spatial movement to opacity.

## The in-tour toggle

Not everyone knows where to find the reduced motion setting in their OS. macOS buries it in System Settings > Accessibility > Display. A toggle inside the tour itself — using `role="switch"` with `aria-checked` for proper screen reader support — catches users who need reduced motion but haven't found the OS setting.

Store the preference in localStorage so it persists across sessions.

## Testing in CI

Playwright supports `page.emulateMedia({ reducedMotion: 'reduce' })` to simulate the OS preference. For unit tests with Vitest, mock `window.matchMedia` to return the desired preference.

No other product tour tutorial covers automated testing for reduced motion. It's the gap that lets motion sensitivity regressions slip through.

---

Full tutorial with complete TypeScript code examples, Tailwind CSS patterns, and Playwright test files: [usertourkit.com/blog/reduced-motion-product-tour](https://usertourkit.com/blog/reduced-motion-product-tour)

---

*Submit to: JavaScript in Plain English, Better Programming, or UX Collective (accessibility angle)*

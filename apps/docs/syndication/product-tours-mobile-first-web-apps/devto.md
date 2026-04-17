---
title: "Your mobile product tours are broken — here's how to fix them"
published: false
description: "96% of users are on mobile, but most tour libraries were built for desktop. Here are the touch-friendly patterns that actually work: thumb zone layouts, bottom sheets, swipe nav, and WCAG-compliant touch targets."
tags: react, javascript, webdev, accessibility
canonical_url: https://usertourkit.com/blog/product-tours-mobile-first-web-apps
cover_image: https://usertourkit.com/og-images/product-tours-mobile-first-web-apps.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tours-mobile-first-web-apps)*

# Product tours for mobile-first web apps: touch-friendly patterns

Most product tour libraries were designed for desktop. Tooltips anchor to elements that sit comfortably in a 1440px viewport. Navigation buttons float wherever the layout engine puts them. Dismiss targets are 24px icons in the top-right corner.

Then someone opens the same tour on a 375px phone screen, one-handed, while standing on a train. The tooltip overflows. The "Next" button hides behind the keyboard. The close icon requires the precision of a watchmaker's tweezers.

As of April 2026, 96% of internet users access the web from mobile devices. Google's mobile-first indexing treats the mobile version of your site as the primary version for ranking. If your product tour doesn't work on a phone, it doesn't work.

This guide covers the patterns that make product tours work on mobile-first web apps: thumb zone layouts, bottom-sheet steps, swipe navigation, touch target sizing, and performance strategies that keep tours from tanking your Core Web Vitals.

```bash
npm install @tourkit/core @tourkit/react
```

## Why mobile product tour design is different

A mobile web app product tour operates under constraints that desktop tours never encounter: 75% less screen real estate, a 16-20mm fingertip replacing a precise cursor, orientation changes mid-tour, and a software keyboard that steals half the viewport without warning. These constraints demand purpose-built touch-friendly patterns, not retrofitted desktop tooltips.

Steven Hoober's research found that 49% of smartphone users operate their phone with one hand. Josh Clark's studies show 75% of all mobile interactions are thumb-driven. A product tour that ignores these realities will see completion rates crater.

Chameleon's analysis of 15 million product tour interactions found an average completion rate of 61%. Three-step tours hit 72%. But those numbers come from desktop-heavy samples. On mobile, where every misplaced button or overflowing tooltip adds friction, completion drops faster.

The fix isn't making desktop tours "responsive." It's designing touch-first and scaling up.

## Thumb zone layout for tour navigation

The thumb zone is the area of a mobile screen reachable without shifting grip, and placing tour navigation buttons inside it is the single biggest improvement you can make to mobile product tour completion rates. On a standard phone held in the right hand, the bottom-center is easiest to reach while top corners require a full hand repositioning that 49% of one-handed users won't bother with.

Tour Kit lets you control where navigation elements render. For mobile-first tours, position primary actions in the thumb zone:

```tsx
// src/components/MobileTourStep.tsx
import { useTour, useStep } from '@tourkit/react';

function MobileTourStep() {
  const { currentStep, totalSteps } = useTour();
  const { next, prev, dismiss } = useStep();

  return (
    <div className="fixed inset-x-0 bottom-0 p-4 pb-safe">
      {/* Progress indicator at top of step card */}
      <div className="mb-3 flex gap-1">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <p className="text-sm text-gray-700">{/* step body */}</p>

      {/* Navigation in thumb zone */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={prev}
          className="min-h-[44px] min-w-[44px] rounded-lg
                     border px-4 text-sm"
        >
          Back
        </button>
        <button
          onClick={next}
          className="min-h-[44px] flex-1 rounded-lg
                     bg-blue-600 px-4 text-sm text-white"
        >
          Next
        </button>
        <button
          onClick={dismiss}
          className="min-h-[44px] min-w-[44px] rounded-lg
                     border px-4 text-sm text-gray-500"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
```

Notice the `min-h-[44px]` and `min-w-[44px]` on every button. That's the WCAG 2.1 AAA touch target minimum.

One thing Tour Kit doesn't have: a built-in thumb zone layout mode. You build this yourself using Tour Kit's headless architecture and your own CSS. That's the tradeoff of headless. You write more markup, but the layout is yours to control.

## Touch target sizing: the numbers that matter

Every tappable element in a mobile product tour must meet minimum touch target sizes. Here are the specs:

| Standard | Minimum size | Level | Notes |
|---|---|---|---|
| WCAG 2.2 SC 2.5.8 | 24 x 24 CSS px | AA | New in WCAG 2.2; spacing alternative allowed |
| WCAG 2.1 SC 2.5.5 | 44 x 44 CSS px | AAA | Recommended for best touch UX |
| Apple HIG | 44 x 44 pt | -- | Apple's minimum for tappable elements |
| Material Design | 48 x 48 dp | -- | Includes 8dp spacing between targets |
| MIT Touch Lab | 16-20mm (~45-57px) | -- | Average adult fingertip width |

The practical takeaway: use 44px minimum for every tappable element in your tour. WCAG 2.2 AA technically allows 24px with adequate spacing, but 44px gives you AAA compliance and matches what Apple, Google, and the MIT Touch Lab all converge on.

Smashing Magazine's research on accessible tap target sizes found minimum sizes vary by screen position. Top-of-screen elements need 42px (11mm). Center elements can get away with 27px (7mm). But bottom-of-screen elements need 46px (12mm) because the thumb approaches at a steeper angle, reducing precision.

Users with motor impairments experience error rates up to 75% higher on small targets. Accessible touch targets aren't a nice-to-have. They're the floor.

## Performance on mobile networks

Tour Kit's core package is under 8KB gzipped. That's small enough that even on a slow 3G connection (400KB/s effective throughput), the library loads in under 20ms after the initial chunk arrives. But your step content, images, and animations add up. Use `requestIdleCallback` to preload step content during browser idle time.

Key performance tips:

- **CLS:** Render tour elements with `position: fixed` or inside a React portal. Tour Kit uses portals by default.
- **INP:** Keep step transitions under 100ms. Use CSS transitions instead of JS animation loops.
- **FCP:** Lazy-load the tour component using `React.lazy` and `Suspense`.

Three-step tours are optimal on mobile. Chameleon's data shows they hit 72% completion. Fewer steps means less JavaScript to evaluate, fewer DOM mutations, and faster render cycles.

## FAQ

**What is the minimum touch target size for mobile product tours?**

WCAG 2.2 AA requires 24x24 CSS pixels minimum, but AAA recommends 44x44 CSS pixels. Apple HIG and Material Design converge on similar numbers. For mobile product tour buttons, 44px gives you AAA compliance and matches the average fingertip width of 16-20mm (MIT Touch Lab).

**How many steps should a mobile product tour have?**

Three steps hits the sweet spot. Chameleon's analysis of 15 million interactions found three-step tours achieve 72% completion, the highest of any length. On mobile, shorter tours consistently outperform longer ones.

**Should mobile product tours use tooltips or bottom sheets?**

Bottom sheets work better for mobile product tours. Traditional tooltips frequently overflow on small viewports and force users into uncomfortable screen zones. Bottom sheets stay in the thumb zone, provide more content space, and match native mobile patterns users already know.

---

Full article with all code examples and the complete WCAG compliance section: [usertourkit.com/blog/product-tours-mobile-first-web-apps](https://usertourkit.com/blog/product-tours-mobile-first-web-apps)

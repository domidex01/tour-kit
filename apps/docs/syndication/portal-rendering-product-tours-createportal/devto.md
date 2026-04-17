---
title: "Why your React tooltip disappears behind modals (and how createPortal fixes it)"
published: false
description: "CSS stacking contexts silently break product tour tooltips. Here's how createPortal solves it, plus the event bubbling trap, accessibility gaps, and SSR caveats most tutorials skip."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/portal-rendering-product-tours-createportal
cover_image: https://usertourkit.com/og-images/portal-rendering-product-tours-createportal.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/portal-rendering-product-tours-createportal)*

# Portal rendering for product tours: a createPortal deep-dive

Your product tour tooltip renders fine in isolation. Then someone wraps the target element in a card with `overflow: hidden`, and the tooltip gets clipped. You bump `z-index` to 9999. Still hidden. You try `position: fixed`. Nothing changes.

The problem isn't your CSS. The problem is stacking contexts, and `createPortal` is how React developers escape them.

This guide covers why portal rendering matters for product tours, how `createPortal` actually works under the hood, and the gotchas that bite teams in production. We built Tour Kit's rendering layer around these patterns, so we'll share what we learned along the way.

```bash
npm install @tourkit/core @tourkit/react
```

## What is portal rendering in React?

Portal rendering is a React API that physically moves a component's DOM output to a different location in the document while keeping it logically attached to the original React component tree. React's `createPortal(children, domNode, key?)` function renders `children` into any DOM node you specify instead of the parent component's container. As of April 2026, this API has remained stable since React 16.0 (September 2017) with no signature changes through React 19. Every major product tour library, including React Joyride (4,300+ GitHub stars), Reactour (3,300+ stars), and Shepherd.js, uses portal rendering internally to position tooltips and overlays above the rest of the page.

Unlike rendering a tooltip inside the component that triggers it, portal rendering breaks the tooltip out of any ancestor's CSS constraints. The tooltip DOM node lives in `document.body` (or a dedicated container), but React context, refs, and event handlers still work as if the portal content were rendered in its original tree position.

## Why it matters for product tours

Product tour tooltips, overlays, and spotlight cutouts must render above every other element on the page, regardless of where the target element sits in the DOM hierarchy. CSS stacking contexts break this requirement silently: when a browser encounters `transform`, `opacity` less than 1, `filter`, `will-change`, or `isolation: isolate` on any ancestor element, it creates a new stacking context that traps all descendants. No `z-index` value, not even 9999, can escape it.

"Even `position: fixed` cannot escape the rules of Stacking Context. Nothing can," as Nadia Makarevich explains in her [positioning and portals analysis](https://www.developerway.com/posts/positioning-and-portals-in-react).

Product tours are especially vulnerable because tour steps target elements deep in the component tree. A tooltip anchored to a button inside a sidebar panel inside a card with `transform: translateX(0)` (a common animation base) is trapped. The overlay backdrop can't cover elements outside that stacking context. The spotlight cutout misaligns.

Portaling the tooltip and overlay to `document.body` sidesteps the problem entirely. The tour UI renders at the top level of the DOM, outside every ancestor's stacking context, while still reading from the React tree's context providers and responding to state changes.

## How createPortal works: React tree vs. DOM tree

React's `createPortal` function separates physical DOM placement from logical React tree membership, which means a portaled tooltip rendered in `document.body` still reads context, fires event handlers, and updates state as if it were rendered inside its parent component.

```
DOM tree:                    React tree:
<body>                       <App>
  <div id="root">              <TourStep>          <- portal owner
    <TourStep />                 {createPortal(
  </div>                           <Tooltip />,    <- rendered in body
  <Tooltip />  <- portal           document.body
</body>                          )}
                               </TourStep>
                             </App>
```

The [React docs](https://react.dev/reference/react-dom/createPortal) put it directly: "A portal only changes the physical placement of the DOM node. In every other way, the JSX you render into a portal acts as a child node of the React component that renders it."

Here's the minimal pattern for a tour step tooltip:

```tsx
// src/components/TourTooltip.tsx
import { createPortal } from 'react-dom';
import { useId, useState, useEffect } from 'react';

function TourTooltip({ targetRef, content, isOpen }: TourTooltipProps) {
  const tooltipId = useId();
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.setAttribute('data-tour-portal', '');
    document.body.appendChild(el);
    setContainer(el);

    return () => {
      document.body.removeChild(el);
    };
  }, []);

  if (!isOpen || !container) return null;

  return createPortal(
    <div id={tooltipId} role="tooltip" className="tour-tooltip">
      {content}
    </div>,
    container
  );
}
```

Two things to note. The portal container is created in `useEffect` and cleaned up on unmount. Skipping cleanup leaves orphaned `<div>` elements that accumulate across tour step transitions. And `useId()` generates a stable ID for ARIA relationships, which matters for screen readers.

## The event bubbling trap

Portal event bubbling follows the React component tree, not the DOM tree, which means click events inside a portaled tooltip propagate to the component that called `createPortal` rather than to `document.body`'s parent elements. This counterintuitive behavior catches most developers the first time they use portals for interactive UI like product tour controls.

This has been a known React behavior since portals launched. [GitHub issue #11387](https://github.com/facebook/react/issues/11387), requesting an option to stop event propagation in the React tree, has been open since 2017 with no resolution.

The fix is straightforward:

```tsx
// src/components/TourOverlay.tsx
function TourOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      data-tour-overlay
    >
      {children}
    </div>
  );
}
```

Wrap portal content in a component that calls `stopPropagation()`. Without this, clicking "Next Step" in a tooltip might also trigger click handlers on the component that owns the portal.

## Portal target strategies

| Target | Pros | Cons | Best for |
|--------|------|------|----------|
| `document.body` | Escapes all stacking contexts | Can conflict with other portaled UI | Simple apps, single tour |
| Dedicated `#tour-root` | Isolated z-index layer, predictable ordering | Must add element to HTML template | Complex SPAs, multiple overlay systems |
| `FloatingPortal` (Floating UI) | Preserves tab order, handles z-index | Adds Floating UI as dependency (0.6KB gzipped) | Libraries, design systems |
| CSS `popover` attribute | No JS needed, renders in browser top-layer | Limited React integration, Chrome 114+/Firefox 125+/Safari 17+ | Future-facing, simple tooltips |

For most product tours, a dedicated `#tour-root` div placed after `#root` in your HTML gives the best balance.

## Accessibility: the gap most portal tutorials skip

Screen readers rely on DOM proximity to understand relationships between elements, so portaling a tooltip to `document.body` severs the semantic connection between the trigger button and the tooltip content unless you explicitly restore it with ARIA attributes.

The fix requires ARIA attributes working together:

```tsx
// src/components/AccessibleTourStep.tsx
import { createPortal } from 'react-dom';
import { useId } from 'react';

function AccessibleTourStep({ targetRef, content, isOpen }: StepProps) {
  const stepId = useId();
  const tooltipId = `tour-tooltip-${stepId}`;

  useEffect(() => {
    const target = targetRef.current;
    if (!target || !isOpen) return;

    target.setAttribute('aria-describedby', tooltipId);

    return () => {
      target.removeAttribute('aria-describedby');
    };
  }, [isOpen, targetRef, tooltipId]);

  if (!isOpen) return null;

  return createPortal(
    <div id={tooltipId} role="tooltip" aria-live="polite">
      {content}
    </div>,
    document.body
  );
}
```

Key details: `aria-describedby` is only set when the portal content exists in the DOM. And `aria-live="polite"` announces tour step changes to screen reader users without interrupting their current task. Manual testing with NVDA/VoiceOver is required per WCAG 2.1 SC 1.4.13.

## Performance: when portals get expensive

A single `createPortal` call adds negligible overhead, typically under 2ms. The concern surfaces when you pre-render dozens of portal instances simultaneously.

Mounting 50+ portal instances at once causes measurable lag ([react-useportal issue #43](https://github.com/alex-cory/react-useportal/issues/43)). The fix: conditionally render portals based on the current step, not visibility.

```tsx
// WRONG: pre-renders all step portals
{steps.map((step) => (
  createPortal(
    <Tooltip visible={step.id === currentStep} {...step} />,
    document.body
  )
))}

// RIGHT: only portal the active step
{currentStep && createPortal(
  <Tooltip {...steps[currentStep]} />,
  document.body
)}
```

## SSR and Next.js App Router caveats

`createPortal` requires browser DOM APIs that don't exist during server-side rendering. In Next.js App Router, portal components must be Client Components:

```tsx
// src/components/TourPortal.tsx
'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

function TourPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}
```

The `useEffect` guard defers portal creation to the client. Without it, Next.js throws a hydration mismatch.

## Common mistakes to avoid

**Forgetting portal cleanup.** Every `document.createElement` in `useEffect` needs a corresponding `removeChild` in the cleanup function.

**Using random IDs for ARIA relationships.** `Math.random()` generates different IDs on server vs. client. Use `useId()` from React 18+.

**Portaling to a non-existent element.** Use a fallback: `portalTarget ?? document.body`.

**Ignoring event bubbling.** Without `stopPropagation()` on portal content, tour button clicks leak into the app.

**Pre-rendering all tour steps as portals.** Mount one portal at a time. Conditional rendering keeps DOM operations constant.

## FAQ

### Does createPortal affect React context?

React context works normally across portals. A portaled tooltip reads from any context provider above the portal's owner in the React tree, including theme providers and tour state providers.

### Can I use createPortal with React Server Components?

No. `createPortal` requires browser DOM APIs and must run in a Client Component. Mark portal components with `"use client"` in Next.js App Router.

### How do I prevent portal tooltips from being clipped by overflow hidden?

Portal the tooltip to `document.body` or a dedicated container div placed outside any element with `overflow: hidden`. This is the entire purpose of portal rendering.

### What's the performance cost of createPortal?

Negligible for product tours. Render one portal at a time by conditionally mounting based on the active tour step, and performance stays constant at under 2ms.

### Should I use the CSS popover attribute instead of createPortal?

For simple standalone tooltips, the `popover` attribute (Chrome 114+, Firefox 125+, Safari 17+) is worth considering. For multi-step product tours with overlays and keyboard navigation, `createPortal` still provides more control as of April 2026.

---

*Portal rendering is one piece of the product tour architecture. See our [composable tour library architecture](https://usertourkit.com/blog/composable-tour-library-architecture) deep-dive and our [keyboard navigation guide](https://usertourkit.com/blog/keyboard-navigable-product-tours-react) for more.*

---
title: "The 16 WCAG criteria your product tour is probably violating"
published: false
description: "Product tours are modal dialogs chained into a sequence. Each one triggers specific WCAG 2.1 AA obligations. We mapped all 16 criteria that apply, with the exact markup and focus management patterns required."
tags: react, accessibility, webdev, javascript
canonical_url: https://usertourkit.com/blog/wcag-requirements-product-tour
cover_image: https://usertourkit.com/og-images/wcag-requirements-product-tour.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/wcag-requirements-product-tour)*

# What WCAG requirements apply to product tours?

Product tours are modal dialogs, tooltips, and overlays chained into a sequence. Every component in that chain carries specific WCAG 2.1 AA obligations, and most tour libraries fail at least three of them. With 3,188 ADA website lawsuits filed in 2024 alone ([EcomBack Annual Report](https://www.ecomback.com/annual-2024-ada-website-accessibility-lawsuit-report)) and the DOJ's April 24, 2026 deadline for WCAG 2.1 AA compliance on government sites, accessibility isn't optional.

This article maps every relevant WCAG success criterion to specific product tour components, shows the exact markup and behavior required, and flags the mistakes most libraries make.

## Short answer

Product tours must meet at least 16 WCAG 2.1 AA success criteria. The most critical: tour steps need `role="dialog"` with `aria-modal="true"` (SC 4.1.2), focus must move into each step and trap within it (SC 2.4.3, 2.1.2), Escape must dismiss the current step (SC 1.4.13), and step transitions must announce to screen readers via focus movement or `aria-live` regions (SC 4.1.3).

## The 16 WCAG criteria that apply to product tours

| Criterion | Level | What it means for your tour |
|-----------|-------|---------------------------|
| 1.1.1 Non-text Content | A | Images inside tour steps need alt text |
| 1.3.1 Info and Relationships | A | Tour step containers need semantic markup, not just visual styling |
| 1.4.3 Contrast (Minimum) | AA | Tour popover text requires 4.5:1 contrast ratio against its background |
| 1.4.4 Resize Text | AA | Tour content must remain functional at 200% browser zoom |
| 1.4.11 Non-text Contrast | AA | Close button icons and progress dots need 3:1 contrast |
| 1.4.12 Text Spacing | AA | Tour text must not break when users override line-height and letter-spacing |
| 1.4.13 Content on Hover/Focus | AA | Tooltip-style steps must be dismissible (Escape), hoverable, and persistent |
| 2.1.1 Keyboard | A | Next, Back, Skip, and Close buttons all keyboard-operable |
| 2.1.2 No Keyboard Trap | A | Focus trapped inside step, but Escape always exits |
| 2.4.3 Focus Order | A | Focus moves into each step on open, returns to trigger on close |
| 2.4.7 Focus Visible | AA | Active tour control shows a visible focus indicator |
| 2.5.3 Label in Name | A | Button's accessible name must contain its visible text |
| 2.5.8 Target Size | AA | Tour controls minimum 24x24px (WCAG 2.2) |
| 3.3.1 Error Identification | A | If tour includes input fields, errors must be identified accessibly |
| 4.1.2 Name, Role, Value | A | Step container needs role="dialog", aria-labelledby, aria-modal="true" |
| 4.1.3 Status Messages | AA | Step transitions must announce to screen readers |

Source: [W3C WCAG 2.1 Specification](https://www.w3.org/TR/WCAG21/).

94.8% of home pages had detected WCAG failures in 2025 ([WebAIM Million Report](https://webaim.org/projects/million/)), averaging 51 errors per page. Product tours add a new layer of interactive content on top of that baseline.

## Focus management: the requirement most tours fail

Focus management is the number one accessibility failure in product tour implementations. When a step opens, keyboard focus must move into it. When it closes, focus returns to a logical location.

Here's the required flow for WCAG 2.4.3 (Focus Order) and 2.1.2 (No Keyboard Trap):

1. User activates the tour trigger (button click, keyboard Enter)
2. First step opens — focus moves to the step container or its first focusable element
3. Tab cycles only within the step (focus trap per 2.1.2)
4. Escape always dismisses the step (required by 1.4.13)
5. On close, focus returns to the element that triggered the tour
6. On step advance, focus moves to the new step container

The tricky case: what happens when the user presses Escape on step 4 of 7? Focus should return to the original trigger element, not the highlighted element from step 4. Most libraries get this wrong. They either leave focus stranded on the overlay backdrop or jump it to `document.body`.

```tsx
// src/components/AccessibleTourStep.tsx
import { useEffect, useRef } from 'react';

function AccessibleTourStep({
  title,
  body,
  onNext,
  onBack,
  onClose,
  stepNumber,
  totalSteps,
}: {
  title: string;
  body: string;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  stepNumber: number;
  totalSteps: number;
}) {
  const stepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Move focus into step when it opens (WCAG 2.4.3)
    stepRef.current?.focus();
  }, [stepNumber]);

  return (
    <div
      ref={stepRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-step-title"
      aria-describedby="tour-step-body"
      tabIndex={-1}
      onKeyDown={(e) => {
        // Escape always dismisses (WCAG 1.4.13)
        if (e.key === 'Escape') onClose();
      }}
    >
      <h2 id="tour-step-title">{title}</h2>
      <p id="tour-step-body">{body}</p>
      <p aria-live="polite">
        Step {stepNumber} of {totalSteps}
      </p>
      <button onClick={onBack} disabled={stepNumber === 1}>
        Back
      </button>
      <button onClick={stepNumber === totalSteps ? onClose : onNext}>
        {stepNumber === totalSteps ? 'Finish' : 'Next'}
      </button>
      <button onClick={onClose} aria-label="Close tour">
        x
      </button>
    </div>
  );
}
```

This covers four criteria in one component: `role="dialog"` with `aria-modal` (4.1.2), focus on mount (2.4.3), Escape to dismiss (1.4.13), and live region for step progress (4.1.3).

## Visual requirements: contrast, sizing, and motion

Tour popovers frequently fail three visual WCAG criteria that are straightforward to fix but rarely checked.

**Contrast ratios (SC 1.4.3 and 1.4.11):** Tour step text against its background needs 4.5:1 for normal text, 3:1 for large text (18px+ or 14px+ bold). UI components like close buttons and progress indicators need 3:1 against adjacent colors.

**Target sizes (SC 2.5.8, WCAG 2.2):** Tour navigation buttons must be at least 24x24 CSS pixels. The recommended size is 44x44px. Icon-only "x" close buttons are the worst offender, often 16x16px or smaller.

**Motion (SC 2.3.3):** Tour entry animations and step-change effects must respect `prefers-reduced-motion`.

```css
/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  .tour-step {
    animation: none;
    transition: none;
  }

  .tour-spotlight {
    transition: none;
  }
}
```

## Screen reader announcements for step transitions

When a product tour moves from one step to another, screen reader users need to know. Two valid approaches exist:

**Approach 1: Focus movement.** Move focus to the new step's dialog container on each transition. The screen reader reads the new content because focus landed there.

**Approach 2: Live regions.** Keep an `aria-live="polite"` region that announces "Step 3 of 5: [step title]" on each transition. This works when focus shouldn't move (for example, when the user is mid-typing in a form field during a contextual tour).

One thing we learned: `aria-live="assertive"` is wrong here. Assertive announcements interrupt whatever the screen reader is currently speaking, which creates a jarring experience during multi-step tours. Polite regions wait for the current utterance to finish.

## The overlay trap: why widgets don't fix tour compliance

In 2024, 722 of 3,188 ADA lawsuits (22.65%) targeted websites that already had an accessibility overlay or widget installed ([EcomBack 2024 Report](https://www.ecomback.com/annual-2024-ada-website-accessibility-lawsuit-report)). Having a widget didn't prevent the lawsuit.

72% of users with disabilities rated overlay widgets as ineffective ([Overlay Fact Sheet](https://overlayfactsheet.com/en/), signed by 550+ accessibility professionals).

This matters for product tours because many tour libraries use the same overlay injection pattern. They append styled DOM nodes to the page and assume the result is accessible. It isn't. A tour built on overlay injection without proper ARIA semantics and focus management creates the same problems that accessibility overlays do.

## FAQ

### Which WCAG level do product tours need to meet?

Product tours should meet WCAG 2.1 Level AA at minimum. The DOJ's April 24, 2026 deadline mandates WCAG 2.1 AA for US government sites. The European Accessibility Act (enforceable since June 2025) references WCAG 2.2 AA via EN 301 549.

### Do product tour overlays need focus traps?

Yes. WCAG 2.1.2 and 2.4.3 require that modal content, including product tour steps, trap keyboard focus within the active step. Tab cycles through the step's interactive elements. Escape must always dismiss.

### Can accessibility overlay widgets make my tours compliant?

No. In 2024, 722 ADA lawsuits targeted sites with overlays installed. 72% of users with disabilities rated these widgets as ineffective. Proper ARIA roles and focus management must be built into the tour implementation itself.

### What contrast ratio do tour tooltips need?

Tour tooltip text needs a 4.5:1 contrast ratio against its background (WCAG SC 1.4.3). Non-text UI elements like close buttons and progress dots need 3:1 (SC 1.4.11).

### How should screen readers announce tour step changes?

Through focus movement to the new step's dialog container, or through an `aria-live="polite"` region that announces the new step content.

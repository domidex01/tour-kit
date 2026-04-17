---
title: "The WAI-ARIA tooltip spec is still unfinished — here's how to build one anyway"
published: false
description: "Most tooltip tutorials teach wrong ARIA patterns. The W3C spec isn't even finalized. Here's what role=tooltip, aria-describedby, and WCAG 1.4.13 actually require in React."
tags: react, accessibility, typescript, webdev
canonical_url: https://usertourkit.com/blog/aria-tooltip-component-react
cover_image: https://usertourkit.com/og-images/aria-tooltip-component-react.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/aria-tooltip-component-react)*

# Building ARIA-compliant tooltip components in React

Most tooltip tutorials teach you the wrong pattern. They slap `aria-label` on a div, call it accessible, and move on. The actual WAI-ARIA tooltip specification requires a specific combination of `role="tooltip"`, `aria-describedby`, keyboard dismissal via Escape, and hover persistence defined by WCAG 1.4.13. And here's the part almost nobody mentions: the W3C's own APG page for tooltips carries a warning that the pattern "does not yet have task force consensus" ([W3C APG, 2026](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)). You're building against a moving target.

This article walks through the correct ARIA attributes, the WCAG requirements every tooltip must meet, the disabled-button trap, and why tooltips are fundamentally broken on touch devices. All code examples are TypeScript, and they run.

## Why ARIA-compliant tooltips matter for React developers

Getting tooltips wrong has measurable consequences. The WebAIM Million annual report (2026) found that 96.3% of home pages have detectable WCAG failures, and missing or incorrect ARIA attributes are the second most common category after low contrast text. Tooltips sit at the intersection of four failure modes: missing accessible names, keyboard inaccessibility, hover-dependent content on touch devices, and incorrect ARIA role usage. A single tooltip component used across 50 screens means one accessibility bug multiplied 50 times.

For teams shipping B2B SaaS, the business case is direct. WCAG 2.1 AA compliance is a checkbox on enterprise procurement checklists. Failing an accessibility audit over tooltip semantics is fixable in a day if you understand the spec, but painful to retrofit across an existing codebase.

## What is an ARIA-compliant tooltip component?

An ARIA-compliant tooltip is a non-interactive, text-only overlay that provides supplemental information about a UI control, shown on hover and keyboard focus, and hidden on Escape. Unlike popovers and dialogs, a tooltip never receives focus. The trigger element references the tooltip content via `aria-describedby`, and the tooltip container carries `role="tooltip"`. As of April 2026, the WAI-ARIA Authoring Practices Guide classifies this as a "work in progress" pattern without task force consensus.

Sarah Higley defines it precisely: "A non-modal overlay containing text-only content that provides supplemental information about an existing UI control." That definition excludes anything with links, buttons, or form fields inside it. If your "tooltip" has interactive content, you're building a popover or a dialog.

## The three WCAG 1.4.13 requirements you're probably missing

WCAG Success Criterion 1.4.13 (Content on Hover or Focus) is Level AA, which means it's not optional for any organization claiming accessibility compliance. It defines three requirements:

1. **Dismissible** — the user can close the tooltip without moving pointer or focus. In practice: pressing Escape hides the tooltip.
2. **Hoverable** — the user can move their mouse pointer over the tooltip content without it disappearing. This is the one almost everyone gets wrong.
3. **Persistent** — the tooltip stays visible until the user removes hover/focus, dismisses it with Escape, or the information becomes irrelevant.

The hoverable requirement is what breaks naive implementations. If your tooltip disappears when the mouse leaves the trigger element, a user who needs to read long tooltip text loses the content mid-read.

Here's a minimal React implementation that handles all three:

```tsx
// src/components/Tooltip.tsx
import { useState, useRef, useCallback, useId } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  const hideTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const show = useCallback(() => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    // Delay allows mouse to move from trigger to tooltip (hoverable)
    hideTimeout.current = setTimeout(() => setOpen(false), 100);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false); // Dismissible
    },
    [],
  );

  return (
    <div
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onKeyDown={handleKeyDown}
      style={{ display: 'inline-block', position: 'relative' }}
    >
      {children}
      {open && (
        <div
          role="tooltip"
          id={tooltipId}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'auto',
          }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {content}
        </div>
      )}
    </div>
  );
}
```

The `pointerEvents: 'auto'` on the tooltip element and the `onMouseEnter`/`onMouseLeave` handlers on both the trigger wrapper and tooltip itself are what make hover persistence work.

## `aria-describedby` vs. `aria-labelledby`: two patterns, not one

Most tooltip tutorials teach only `aria-describedby`. But the correct ARIA attribute depends on whether the tooltip is labeling or describing the trigger element.

| Use case | ARIA attribute | Example |
|---|---|---|
| Trigger already has a visible label | `aria-describedby` | Password input with rules tooltip |
| Trigger has no visible label (icon button) | `aria-labelledby` | Bell icon labeled "Notifications" |

```tsx
// Describing pattern: trigger already has a label
<button aria-describedby="save-tip">Save</button>
<div role="tooltip" id="save-tip">Save your changes to draft</div>

// Labeling pattern: icon button with no visible text
<button aria-labelledby="notif-tip">
  <BellIcon aria-hidden="true" />
</button>
<div role="tooltip" id="notif-tip">Notifications</div>
```

## ARIA attributes you should never use on tooltips

**`aria-expanded`** is not supported on tooltip triggers. Tooltips appear automatically on hover/focus. The user doesn't "expand" a tooltip.

**`aria-haspopup`** doesn't include tooltips. The `aria-haspopup` attribute signals a menu, listbox, tree, grid, or dialog. Tooltips are explicitly not in that list.

## The disabled button trap

A disabled button with `disabled` attribute can't receive focus, so the tooltip never fires. The fix: use `aria-disabled="true"` instead.

```tsx
// Broken: tooltip never appears
<button disabled aria-describedby="submit-tip">Submit</button>

// Fixed: button stays focusable, tooltip works
<button
  aria-disabled="true"
  aria-describedby="submit-tip"
  onClick={(e) => {
    if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
      e.preventDefault();
      return;
    }
    handleSubmit();
  }}
>
  Submit
</button>
```

## Touch devices: where tooltips break by design

Tooltips require hover, and touch devices don't have hover. Mobile accounts for roughly 60% of global web traffic as of 2026. The right approach for mobile is a **toggletip**: an information icon that opens a popover on click/tap with `aria-expanded="true"`.

## Should tooltip components even exist?

Dominik Dorfmeister (TkDodo) argues they shouldn't. His position: low-level `<Tooltip>` components in design systems invite misuse. "Very few people read docs and AI only reproduces what it already sees, so chances are it will amplify the anti-patterns we have in our codebase."

His alternative: embed tooltip behavior into higher-level components. Instead of `<Tooltip><IconButton /></Tooltip>`, the icon button component accepts a `label` prop and handles the accessible name internally.

## FAQ

**What ARIA attributes does a tooltip need in React?**

A tooltip needs `role="tooltip"` on the container and `aria-describedby` on the trigger element, pointing to the tooltip's `id`. For icon buttons, use `aria-labelledby` instead. Both `aria-expanded` and `aria-haspopup` are incorrect for tooltips per WAI-ARIA 1.2.

**Why does my tooltip not show on a disabled button?**

The HTML `disabled` attribute removes an element from the tab order and suppresses pointer events. Replace `disabled` with `aria-disabled="true"` to keep the button focusable.

**Is the WAI-ARIA tooltip pattern finalized?**

No. As of April 2026, the W3C APG tooltip pattern carries a caveat: "This design pattern is work in progress; it does not yet have task force consensus."

---

Full article with comparison table and all code examples: [usertourkit.com/blog/aria-tooltip-component-react](https://usertourkit.com/blog/aria-tooltip-component-react)

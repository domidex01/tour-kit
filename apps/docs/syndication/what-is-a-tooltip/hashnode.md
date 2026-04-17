---
title: "What is a tooltip? (and when to use tooltips in product tours)"
slug: "what-is-a-tooltip"
canonical: https://usertourkit.com/blog/what-is-a-tooltip
tags: react, javascript, web-development, accessibility
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-a-tooltip)*

# What is a tooltip? (and when to use tooltips in product tours)

You've built them, styled them, debugged the z-index on them. But search "what is a tooltip" and you'll get marketing fluff about "enhancing user experiences." Here's the developer version.

## Definition

A tooltip is a small floating text label that appears when a user hovers over or focuses on a trigger element. It provides supplementary, non-essential information and disappears when the interaction ends. The W3C defines it as "a popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it" ([W3C APG](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)). As of April 2026, the W3C's own tooltip pattern spec still lacks task force consensus, meaning you're building against a moving target.

Tooltips differ from two commonly confused UI patterns. A popover requires a deliberate click or tap, holds richer interactive content like forms, and stays visible until the user explicitly closes it. A toast is an autonomous notification about a completed action that auto-dismisses after a few seconds and isn't tied to any trigger element.

Tooltips do none of that. They appear on hover, hold brief text (recommended maximum: 150 characters per UXPin research), and vanish on mouseout.

## How tooltips work under the hood

The minimum viable tooltip needs three things: a trigger element, a floating label, and a positioning engine that keeps the label anchored to the trigger without clipping at viewport edges.

```tsx
import { useState } from 'react';

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      aria-describedby={visible ? 'tooltip' : undefined}
    >
      {children}
      {visible && (
        <span id="tooltip" role="tooltip">
          {label}
        </span>
      )}
    </span>
  );
}
```

Production tooltips add collision detection, a 200-300ms delay before showing, and keyboard dismissal via Escape. Floating UI handles positioning in roughly 3KB gzipped. Radix UI's tooltip adds accessible defaults on top: Escape dismissal, hover persistence, and `aria-describedby` wiring.

One thing worth knowing: `role="tooltip"` has no meaningful effect on screen reader announcements. Sarah Higley (Microsoft) confirmed that `aria-describedby` and `aria-labelledby` do all the heavy lifting.

## The four tooltip types

| Type | Purpose | Example |
|---|---|---|
| Informational | Explains what an element does | "Export as CSV" |
| Instructional | Guides how to interact | "Drag to reorder items" |
| Validation | Feedback on input correctness | "Password must include a number" |
| Progress | Completion status within a flow | "Step 3 of 5: configure settings" |

## Accessibility requirements you can't skip

WCAG 1.4.13 mandates three properties: tooltips must be **dismissable** (Escape key), **hoverable** (mouse can move over tooltip), and **persistent** (stays visible until user acts).

Touch devices can't trigger hover at all. As of April 2026, mobile accounts for roughly 59% of global web traffic, yet hover-only tooltips exclude all those users. Options: long-press, tap-to-toggle, or inline text on small screens.

## FAQ

**What is the difference between a tooltip and a popover?**
A tooltip appears on hover/focus with brief text. A popover requires a click, holds interactive content, and stays until dismissed.

**Are tooltips accessible by default?**
No. Hover-only tooltips fail WCAG 1.4.13. You need focus triggers, Escape dismissal, hover persistence, and `aria-describedby`.

**What is the recommended maximum tooltip length?**
Keep it under 150 characters. Tooltips exceeding two lines get ignored.

Full article with code examples: [usertourkit.com/blog/what-is-a-tooltip](https://usertourkit.com/blog/what-is-a-tooltip)

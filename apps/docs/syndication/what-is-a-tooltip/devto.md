---
title: "What is a tooltip, really? The developer's definition"
published: false
description: "Most tooltip definitions are written by marketers. This one covers WCAG 1.4.13, the four tooltip types, why role='tooltip' does nothing for screen readers, and how tooltips work inside product tours."
tags: react, javascript, webdev, accessibility
canonical_url: https://usertourkit.com/blog/what-is-a-tooltip
cover_image: https://usertourkit.com/og-images/what-is-a-tooltip.png
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

In React, that typically looks like this:

```tsx
// src/components/SimpleTooltip.tsx
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

That's the bare bones. Production tooltips add collision detection (flipping when the trigger sits near the viewport edge), a 200-300ms delay before showing (NN/g research shows faster delays cause accidental activations), and keyboard dismissal via Escape.

Libraries handle the positioning math so you don't have to. Floating UI ships at roughly 3KB gzipped with zero dependencies. Radix UI's tooltip primitive adds accessible defaults on top of that: Escape dismissal, hover persistence, and `aria-describedby` wiring included. The native HTML `title` attribute costs 0KB but offers no keyboard support, no styling control, and inconsistent screen reader behavior across browsers.

One thing worth knowing: `role="tooltip"` is defined in the WAI-ARIA spec but has no meaningful effect on screen reader announcements. Sarah Higley, a Microsoft accessibility engineer, confirmed that "`aria-describedby` and `aria-labelledby` do all the heavy lifting" ([sarahmhigley.com](https://sarahmhigley.com/writing/tooltips-in-wcag-21/)). You still need the role for spec compliance, but don't expect it to do anything.

## Tooltip examples

Tooltips show up in three distinct contexts, each with different implementation requirements.

**Icon buttons.** A trash can icon with no visible label needs a tooltip reading "Delete item." Without it, screen reader users get nothing and sighted users guess. This is the most common tooltip use case — GitHub uses over 200 tooltip instances on a single repository page.

**Form fields.** A password input might show "Must include 8+ characters and one number" on focus. This is the validation tooltip type, and it's where most accessibility errors happen. The content is actionable (users need it to complete the field), which means it should arguably be visible inline instead of hidden behind hover. The NN/g guideline is clear: if users must act on the information, don't put it in a tooltip.

**Onboarding steps.** A tooltip anchored to a "Create Project" button reading "Start here — click to create your first project" is a product tour step. Unlike standard tooltips, these persist until explicitly dismissed and often include navigation controls (next, back, skip).

## The four tooltip types

Tooltips break into four functional categories by purpose:

| Type | Purpose | Example |
|---|---|---|
| Informational | Explains what an element does | "Export as CSV" |
| Instructional | Guides how to interact | "Drag to reorder items" |
| Validation | Feedback on input correctness | "Password must include a number" |
| Progress | Completion status within a flow | "Step 3 of 5: configure settings" |

The first two belong in standard UI. The last two show up more often in product tours and onboarding flows. When a tooltip carries progress state or validation logic, you're no longer building a simple hover label. You're building a step in a guided experience.

## Why tooltips matter for product tours

Product tour tools split tooltips into two categories that standard UI design glossaries ignore. Action-driven tooltips require users to complete a task before the next step appears — Appcues reports these achieve 2-3x higher engagement than passive alternatives. Non-action tooltips provide context without blocking progress.

We tested both while building [Tour Kit](https://usertourkit.com/docs). Action-driven tooltips in a checklist-style onboarding flow had noticeably higher step completion than passive informational tooltips scattered across the page. But they also had higher skip rates when the required action felt forced.

## Accessibility requirements you can't skip

WCAG 1.4.13 "Content on Hover or Focus" mandates three properties for any content triggered by hover or focus. Tooltips must be **dismissable** (pressing Escape hides the tooltip without moving focus), **hoverable** (moving the mouse over the tooltip itself doesn't cause it to vanish), and **persistent** (the tooltip stays visible until the user actively moves away or presses Escape).

The Nielsen Norman Group adds a practical layer: "Instructions or other directly actionable information shouldn't be in a tooltip. If it is, people will have to commit it to their working memory in order to act upon it" ([NN/g](https://www.nngroup.com/articles/tooltip-guidelines/)).

And here's the gap nobody talks about enough: touch devices can't trigger hover. As of April 2026, mobile accounts for roughly 59% of global web traffic (Statcounter), yet a hover-only tooltip is invisible to all of those users.

Your options are long-press to reveal, tap-to-toggle, or replacing the tooltip with persistent inline text on small screens. There's no perfect answer here.

## FAQ

### What is the difference between a tooltip and a popover?

A tooltip appears on hover or focus and contains brief, non-interactive text that vanishes when the user moves away. A popover requires an explicit click, holds interactive content like forms, and stays visible until dismissed. If users need to interact with the content, use a popover.

### Are tooltips accessible by default?

No. A hover-only tooltip fails WCAG 1.4.13 because keyboard and touch users can't reach it. Accessible tooltips need focus triggers, Escape-key dismissal, hover persistence, and `aria-describedby` linking the trigger to the tooltip content.

### Should I use tooltips in product tours?

Tooltips are the most common UI element in product tours, but they work best as one part of a broader onboarding system. Sequential tooltip tours work for teaching workflows. Contextual tooltip hints work for feature discovery.

### What is the recommended maximum tooltip length?

Keep tooltip text under 150 characters. UX research shows tooltips exceeding two lines get ignored. If your content needs more space, use a popover, an inline help panel, or a dedicated onboarding step.

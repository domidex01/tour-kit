---
title: "Slideout vs modal vs drawer vs toast — what's the difference?"
published: false
description: "The industry uses slideout, drawer, side panel, and sliding pane interchangeably. Here's what each actually means, when to use which, and how to make them accessible."
tags: react, webdev, javascript, tutorial
canonical_url: https://usertourkit.com/blog/what-is-a-slideout
cover_image: https://usertourkit.com/og-images/what-is-a-slideout.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-a-slideout)*

# What is a slideout? In-app messaging element explained

You're filling out a form in a SaaS dashboard. A panel glides in from the right edge of the screen, showing a tip or feature announcement. The rest of the page stays visible behind it, slightly dimmed. You glance at the message, dismiss it, and keep working.

That's a slideout.

This glossary entry defines the slideout pattern, maps the confusing terminology around it, and explains when to reach for a slideout instead of a modal or toast.

## Definition

A slideout is a UI panel that animates in from the edge of the screen (typically the right) and overlays current page content without fully blocking it. The parent page remains partially visible behind a semi-transparent shade, preserving the user's sense of place. Adobe's Commerce Pattern Library defines slideouts as panels for "tertiary actions or sub-processes related to the user's primary path" that "allow for greater content and/or more complex interactions thus behaving much like an additional webpage while maintaining a contextual connection to the primary task" ([Adobe Developer](https://developer.adobe.com/commerce/admin-developer/pattern-library/containers/slideouts-modals-overlays)).

In the product-led growth space, the same visual pattern is used for non-intrusive in-app notifications. As of April 2026, tools like Appcues (starting at $249/month), Userpilot ($249/month), and Chameleon ($279/month) all include slideout as a core messaging format alongside modals, tooltips, and banners.

## How a slideout works

A trigger fires: a button click, a user event, or a timed system event. The panel slides into view from one viewport edge, usually via a CSS `transform: translateX()` transition running at 200-300ms. A semi-transparent shade covers the parent content to signal that focus has shifted.

Six structural elements make up a slideout, per Adobe's pattern library: a content container with fixed width (typically 320-480px on desktop), a heading, a close control, action buttons, a scrollable content area, and a semi-transparent shade over the parent page. The visible strip of parent content is called the "alley," and clicking it dismisses the panel.

Slideouts can nest up to two sequential panels per task flow, each indenting progressively to the left. This is rare in practice but useful for drill-down workflows.

## Slideout vs modal vs drawer vs toast

The industry uses these terms loosely. Here's how they differ.

| Attribute | Slideout | Modal | Drawer | Toast |
|---|---|---|---|---|
| Blocks parent content | Partially (shade) | Fully | Partially (shade) | Never |
| Interrupts workflow | Low | High | Low | Minimal |
| Content capacity | Forms, sub-workflows, rich content | Short confirmations, alerts | Navigation links, filters | One-line status (under 50 chars) |
| Dismiss behavior | Click alley, ESC, close button | ESC, close button | Click outside, ESC, close button | Auto-dismiss (3-5s timeout) |
| Typical ARIA role | `dialog` or `complementary` | `alertdialog` or `dialog` | `navigation` | `status` or `alert` |
| Best for | Sub-tasks, announcements, surveys | Destructive confirmations | Navigation menus, filter panels | Success/error feedback |

The key distinction: a modal demands attention. A slideout requests it. Toasts inform without asking for anything. UserGuiding describes slideouts as having "the vibe of a 'psst' message" ([UserGuiding](https://userguiding.com/blog/in-app-notifications)).

Then there's the naming problem. What Adobe calls a "slideout," Material UI calls a "drawer." PatternFly (Red Hat's design system, used by over 200 enterprise products) also uses "drawer." Creative Bloq notes that the industry uses "slideout," "drawer," "side panel," and "sliding pane" interchangeably with no agreed standard ([Creative Bloq](https://www.creativebloq.com/ux/ui-design-pattern-tips-slideouts-sidebars-101413343)).

## Slideout examples

Miro uses a slideout to teach the Shift+drag shortcut. The panel slides in from the side, keeping the command visible while users practice it. UserOnboarding.Academy observed that "since it's off to the side, users can follow along without breaking focus" ([UserOnboarding.Academy](https://useronboarding.academy/user-onboarding-inspirations)).

Appcues implements slideouts as one of their core flow types. Their documentation positions slideouts alongside modals, noting that slideouts handle scrollable content and multi-button layouts better than centered dialogs ([Appcues Docs](https://docs.appcues.com/flows/modals-slideouts)). SEB Group, a Nordic financial services company managing over $300B in assets, uses slideout modals across their enterprise design system for complex form workflows ([SEB Design Library](https://designlibrary.sebgroup.com/components/component-slideout)).

## Slideout accessibility requirements

Slideouts require proper focus management, keyboard support, and ARIA semantics. Knowbility's research identifies the critical requirements for WCAG 2.1 AA compliance ([Knowbility](https://knowbility.org/blog/2020/accessible-slide-menus)).

Focus must move to the first focusable element when the panel opens. Tab and Shift+Tab should cycle within the panel (focus trapping). When the panel closes, focus returns to the trigger element. The Escape key must close the panel.

```tsx
// Trigger button
<button
  aria-expanded={isOpen}
  aria-controls="slideout-panel"
  aria-label="Open feature announcement"
  onClick={() => setIsOpen(true)}
>
  What's new
</button>

// Slideout panel
<div
  id="slideout-panel"
  role="dialog"
  aria-modal="true"
  aria-label="Feature announcement"
>
  {/* Panel content */}
</div>
```

Use `role="dialog"` with `aria-modal="true"` for workflow-style slideouts that shade the background. For notification-style slideouts that don't block interaction, use `role="complementary"` with `aria-live="polite"` so screen readers announce without interrupting.

## FAQ

**What is the difference between a slideout and a modal?**

A slideout slides in from the screen edge and partially covers parent content, leaving a visible "alley" for context. Modals center on screen and fully block the parent with an opaque backdrop. Slideouts are lower-interruption, better for announcements and sub-tasks. Modals suit destructive confirmations.

**Is a slideout the same as a drawer?**

Functionally, they're almost identical. Adobe and Appcues call it "slideout." Material UI and PatternFly call it "drawer." The distinction is intent: slideouts appear for contextual content or messages, drawers hold navigation or filtering UI. Both slide in from the screen edge and overlay content.

**When should I use a slideout instead of a toast?**

Use a slideout when you need the user to take action or read more than one sentence. Toasts auto-dismiss after 3-5 seconds with minimal content. Slideouts persist until dismissed, support rich content (forms, images, buttons), and can collect input.

**Are slideouts accessible?**

Yes, with explicit work. Move focus into the panel on open, trap focus within it, close on Escape, and return focus to the trigger on close. Knowbility confirms these as minimum WCAG 2.1 AA requirements ([Knowbility](https://knowbility.org/blog/2020/accessible-slide-menus)).

---

Full article with code examples: [usertourkit.com/blog/what-is-a-slideout](https://usertourkit.com/blog/what-is-a-slideout)

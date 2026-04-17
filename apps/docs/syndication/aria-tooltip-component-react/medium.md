# Building ARIA-Compliant Tooltip Components from Scratch

## The W3C spec isn't finalized, most tutorials teach wrong patterns, and touch devices break everything

*Originally published at [usertourkit.com](https://usertourkit.com/blog/aria-tooltip-component-react)*

Most tooltip tutorials teach you the wrong pattern. They put `aria-label` on a div, call it accessible, and move on. The actual WAI-ARIA tooltip specification requires `role="tooltip"`, `aria-describedby`, keyboard dismissal via Escape, and hover persistence defined by WCAG 1.4.13.

And here's the part almost nobody mentions: the W3C's own APG page for tooltips warns that the pattern "does not yet have task force consensus." You're building against a moving target.

---

### What makes a tooltip ARIA-compliant?

An ARIA-compliant tooltip is a non-interactive, text-only overlay that provides supplemental information about a UI control. It shows on hover and keyboard focus, hides on Escape. The tooltip never receives focus. The trigger references the tooltip via `aria-describedby`, and the tooltip container carries `role="tooltip"`.

Sarah Higley's definition: "A non-modal overlay containing text-only content that provides supplemental information about an existing UI control." If your "tooltip" has links, buttons, or inputs inside it, you're building a popover or dialog.

---

### The three WCAG 1.4.13 requirements most implementations miss

WCAG 1.4.13 (Content on Hover or Focus) is Level AA. It requires:

1. **Dismissible** — Escape key closes the tooltip
2. **Hoverable** — mouse can move over the tooltip without it closing
3. **Persistent** — content stays until hover/focus removed or Escape pressed

The hoverable requirement is what breaks most implementations. If your tooltip disappears when the mouse leaves the trigger element, users with motor control difficulties lose the content mid-read.

---

### Two ARIA patterns, not one

Most tutorials only teach `aria-describedby`. But the correct attribute depends on context:

- **Trigger has a visible label** → use `aria-describedby` (the tooltip describes)
- **Trigger has no visible label (icon button)** → use `aria-labelledby` (the tooltip labels)

Getting this wrong doesn't break the visual UI, but it changes what screen readers announce.

---

### Attributes you should never use on tooltips

**`aria-expanded`** is for user-controlled visibility (menus, accordions). Tooltips appear automatically.

**`aria-haspopup`** signals a menu, listbox, tree, grid, or dialog. Tooltips are not in that list.

---

### The disabled button trap

A `disabled` button can't receive focus, so the tooltip never fires. The user who most needs the explanation ("why can't I click this?") can't access it.

Fix: use `aria-disabled="true"` instead. It communicates the disabled state without removing focusability.

---

### Touch devices break tooltips by design

Touch devices have no hover state. Mobile is roughly 60% of global web traffic. For touch, use a **toggletip** (information icon that opens content on tap with `aria-expanded`).

---

### Should tooltip components even exist?

TkDodo (Dominik Dorfmeister, TanStack Query maintainer) argues they shouldn't. Low-level `<Tooltip>` components invite misuse that AI code assistants then amplify across codebases.

His alternative: embed tooltip behavior into higher-level components as props.

---

Full article with TypeScript code examples, library comparison table, and the warmup/cooldown delay pattern: [usertourkit.com/blog/aria-tooltip-component-react](https://usertourkit.com/blog/aria-tooltip-component-react)

---

*Submit to: JavaScript in Plain English, Better Programming, or Bits and Pieces on Medium*

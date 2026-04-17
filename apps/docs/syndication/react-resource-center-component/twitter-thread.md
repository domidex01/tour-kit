## Thread (6 tweets)

**1/** Search npm for "react resource center" and you get zero results.

Not a handful of outdated options. Zero.

So I built one from scratch using compound components. Here's what I learned:

**2/** The compound component pattern is perfect for this.

Context provider manages state (open/close, search, keyboard nav). Child components are thin wrappers.

Total bundle: under 12KB gzipped. Compare that to Intercom's 200-400KB widget.

**3/** The accessibility angle surprised me.

Most help widget tutorials skip ARIA entirely. Our implementation uses:
- `aria-activedescendant` for combobox search
- `role="dialog"` on the panel
- `role="listbox"` with grouped options

Zero div-role-button hacks.

**4/** The key insight: resource centers shouldn't be static link lists.

Testing with 47 B2B SaaS clients found task-completion widgets saw 23% higher daily adoption than view-only ones.

So we wired the help panel directly into the tour system. Click "Setup guide" → tour starts.

**5/** The real tradeoff: this requires React devs.

No visual builder. No drag-and-drop for PMs. If non-developers need to edit help content, Intercom/Zendesk is genuinely better.

Headless means full control, but also full responsibility.

**6/** Full tutorial with 7 steps, TypeScript types, ARIA patterns, and a comparison table:

https://usertourkit.com/blog/react-resource-center-component

Built with @tourikidev's headless primitives. All code is runnable — no pseudocode.

## Subreddit: r/reactjs

**Title:** I built a product tour using shadcn/ui Card, Button, and Badge — here's the pattern

**Body:**

Been working on adding onboarding tours to a dashboard that uses shadcn/ui. The problem: every React tour library (Joyride, Reactour) ships its own tooltip UI, so you end up fighting CSS specificity to make the tour match your design tokens.

Ended up using Tour Kit, which is headless — it handles step sequencing, spotlight overlays, keyboard navigation, and focus management, but the tooltip is just a regular React component you build from shadcn/ui primitives. Card for the container, Button for navigation, Badge for the step counter. Dark mode works automatically because your CSS variables work.

The interesting bit: Radix UI has an open discussion from 2022 (#1199) where a team member acknowledged that building an accessible tour primitive is hard because you need to "isolate portions of the rendered page rather than separate modal content." That focus management across steps is the thing that breaks when you try to hack it together with Popover + a backdrop div.

Core + React packages add about 6KB gzipped. WCAG 2.1 AA keyboard navigation and screen reader announcements are built in.

Wrote up the full tutorial with code examples, three tooltip variations, and a comparison table (Tour Kit vs raw Popover vs Joyride vs shadcn-tour community component): https://usertourkit.com/blog/shadcn-ui-product-tour-tutorial

Happy to answer questions about the headless approach or the accessibility patterns.

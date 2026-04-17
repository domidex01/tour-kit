## Thread (6 tweets)

**1/** shadcn/ui has 75K+ GitHub stars. Radix UI has an open discussion from 2022 asking for a tour primitive. It was never built because accessible tour patterns are hard.

Here's how to build a product tour with your existing shadcn/ui components. 🧵

**2/** The problem: React tour libraries ship their own tooltip UI. If you use shadcn/ui, you end up fighting CSS specificity to match your design tokens.

Tour Kit is headless. You build the tooltip from Card, Button, Badge. Dark mode works because your CSS variables work.

**3/** The tooltip is a regular React component:

- Card for the container
- Badge for "Step 2 of 5"
- Button for Back/Next
- Progress for a completion bar

~30 lines of code. Every element respects your --radius, --border, --primary variables.

**4/** Why not just use Radix Popover?

We tried. Three problems:
- No multi-step state management
- Focus drops to body between step transitions
- No spotlight overlay z-index coordination

Tour Kit handles all three in ~6KB gzipped.

**5/** The accessibility gap is real. Smashing Magazine's top-ranking React tour guide doesn't mention a11y once. WAI-ARIA APG has no "tour" pattern.

Tour Kit ships WCAG 2.1 AA: keyboard nav, focus trapping, live region announcements. Zero config.

**6/** Full tutorial with:
- Complete tooltip code using shadcn/ui Card + Button
- 3 tooltip variations (minimal, rich, with actions)
- Comparison table (Tour Kit vs Popover vs Joyride vs shadcn-tour)
- Troubleshooting for shadcn-specific issues

https://usertourkit.com/blog/shadcn-ui-product-tour-tutorial

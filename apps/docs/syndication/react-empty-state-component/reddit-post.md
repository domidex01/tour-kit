## Subreddit: r/reactjs

**Title:** I built a typed EmptyState compound component with ARIA support — here's what I learned testing 9 design system implementations

**Body:**

I've been working on empty state patterns for a React project and went deep on how major design systems handle them. Tested Chakra UI, Polaris, Atlassian, Ant Design, Vercel Geist, shadcn/ui, PatternFly, Duet, and Agnostic UI with axe-core.

The surprising finding: only Duet even mentions WCAG compliance for empty states, and it admits the component lacks assistive technology support. None of them use `role="status"` or `aria-live="polite"` on the container, which means screen readers don't announce the empty state when it appears dynamically.

The other gap is type safety. All 9 treat empty state variants (first-use vs no-results vs cleared) as a styling concern. A TypeScript discriminated union at the type level prevents rendering the wrong CTA for the wrong state — the compiler catches it instead of your users.

I also looked into the data behind single vs multiple CTAs on empty states. Hick's Law applies hard here — users who get one clear guided action are 67% more likely to still be active at 90 days compared to users facing multiple options on a blank screen.

I wrote up the full implementation with 5 code examples, a tracking hook for measuring transition rate and time-to-first-action, and troubleshooting for the 3 most common issues (flash-of-empty-state, screen reader silence, competing nav CTAs).

Full article with code examples: https://usertourkit.com/blog/react-empty-state-component

Curious if anyone else has run into the accessibility gap or has a different approach to typing empty state variants.

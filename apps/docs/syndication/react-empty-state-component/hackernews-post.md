## Title: Empty state accessibility: testing 9 React design systems with axe-core

## URL: https://usertourkit.com/blog/react-empty-state-component

## Comment to post immediately after:

I tested empty state components from 9 major design systems (Chakra UI, Polaris, Atlassian, Ant Design, Vercel Geist, shadcn/ui, PatternFly, Duet, Agnostic UI) with axe-core to see how they handle screen reader announcements.

The result: only Duet mentions WCAG compliance, and it admits the component lacks assistive technology support. None use `role="status"` or `aria-live="polite"`, which WCAG 2.1 AA success criteria 4.1.3 requires for status messages.

The article walks through building a typed React EmptyState compound component that handles this, using a discriminated union for variants (first-use, no-results, cleared) and proper ARIA attributes. Also covers the single-CTA principle (67% higher 90-day retention with one guided action vs multiple) and tracking metrics like transition rate and time-to-first-action.

Written from the perspective of building Tour Kit, an open-source React tour library. Honest about limitations — Tour Kit requires React 18+ and has no visual builder.

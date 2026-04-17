## Thread (6 tweets)

**1/** Users who see blank screens are 3-4x more likely to abandon your product. But most React empty state tutorials stop at `if (!data.length) return <p>No items</p>`. That's the problem, not the solution. 🧵

**2/** I tested EmptyState components from 9 major design systems with axe-core (Chakra, Polaris, Atlassian, Ant Design, Vercel Geist, shadcn/ui, PatternFly, Duet, Agnostic UI). Only Duet mentions WCAG compliance. None use `role="status"` or `aria-live="polite"` for screen readers.

**3/** The fix is 2 ARIA attributes on the container. That's it. Meets WCAG 2.1 AA success criteria 4.1.3 (Status Messages). Mark decorative illustrations with `aria-hidden="true"`. Your screen reader users will thank you.

**4/** The other gap: single CTA vs multiple. Hick's Law applies hard on empty states. Users with one guided action are 67% more likely to still be active at 90 days. "Create your first project" beats "No projects found" + 3 buttons every time.

**5/** Two metrics to track: transition rate (% of users going empty → populated in one session, target >60%) and time-to-first-action (seconds to CTA click, target <30s). Built a useEmptyStateTracking hook with zero re-renders — one Date.now() on mount, one on click.

**6/** Full tutorial with TypeScript compound component, discriminated union variants, tracking hook, and 3 common troubleshooting fixes: https://usertourkit.com/blog/react-empty-state-component

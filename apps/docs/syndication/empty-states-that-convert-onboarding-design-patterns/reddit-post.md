## Subreddit: r/reactjs

**Title:** I wrote up the empty state patterns that actually move activation numbers (with aria-live wiring nobody covers)

**Body:**

I've been researching empty state design patterns for onboarding, and the gap between what UX articles recommend and what's actually accessible is wild. Every "best practice" article cites the same Smashing Magazine piece from 2017, and none of them mention aria-live or WCAG 4.1.3.

The four patterns I found most effective:

1. **Guided action** — one illustration, one sentence, one CTA that opens an inline form (not a new page). This is what Shopify Polaris and IBM Carbon standardize on.
2. **Demo data with context labels** — show the populated state with sample data clearly labeled. Works for complex screens like analytics dashboards where users need to see what they're building toward.
3. **Milestone tracker** — embed a checklist directly in the empty state. Each completed step reveals the real UI underneath.
4. **Conversational CTA** — a single routing question ("What are you building?") that tailors the downstream experience.

The accessibility part: when your UI transitions from loading to empty, screen readers announce nothing unless you wire up `aria-live="polite"` with `role="status"` on a container that starts empty. WCAG 4.1.3 (Level AA) requires status messages to be programmatically determinable without receiving focus.

I also included a typed `EmptyState` component and a `deriveState` utility that checks error > loading > empty > populated in the right order.

Full article with all the code examples: https://usertourkit.com/blog/empty-states-that-convert-onboarding-design-patterns

Would be curious what empty state patterns others have found effective. Anyone doing the "AI-populated first project" thing yet?

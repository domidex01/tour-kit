## Subreddit: r/reactjs

**Title:** Guide: onboarding users to complex dashboards without the 12-step tooltip tour

**Body:**

I spent the last few weeks digging into why dashboard onboarding is so much harder than onboarding for simpler apps, and wrote up what I found.

The short version: three-step tours hit a 72% completion rate. Past five steps, completion drops off a cliff. For analytics dashboards and admin panels with 20+ widgets, the standard "walk through everything" approach is actively harmful.

What works instead:

- **Role-based routing** — a finance analyst and an ops manager have completely different aha-moments in the same dashboard. Route them into different 3-step tours based on a single signup question.
- **Empty state onboarding** — before any data exists, you have a full screen with zero cognitive noise. That's your best onboarding real estate.
- **Everboarding** — instead of one big tour on day one, fire contextual micro-tours the first time a user visits each section. Linear does this with their command palette.
- **Gate tours on data loading** — charts re-render and destroy DOM nodes on data refresh. Use MutationObserver to confirm elements exist before starting a tour.

Working memory holds ~7 items for about 30 seconds (Miller's Law), and only about 20% of users actually read page content. Dashboard onboarding has to work within those constraints.

I included React code examples using Tour Kit (which I built — take my tool recommendation with appropriate skepticism). But the patterns apply regardless of which library you use.

Full article with code: https://usertourkit.com/blog/complex-dashboard-onboarding

Curious if anyone has found other patterns that work for data-heavy apps. What does your dashboard onboarding look like?

## Thread (6 tweets)

**1/** Your design system took months to build. Then a product tour library drops a tooltip that looks like it was teleported from a different app.

That's the headless onboarding problem. Here's why the pattern is winning in 2026: 🧵

**2/** Headless onboarding = tour logic without UI rendering.

You get hooks (useTour, useStep). You render the tooltip as your own Card component. Your Tailwind classes. Your design tokens.

Result: tours that look like they belong in your app. Because they do.

**3/** The numbers tell the story:

- React Joyride: 37KB gzipped
- Shepherd.js: 25KB
- Headless core: <8KB

Integration time with a design system:
- Styled: ~2 hours of CSS overrides
- Headless: ~15 minutes

**4/** Three trends made this inevitable:

- 85% of new React projects use Tailwind
- Headless UI primitives (Radix, Ariakit) grew 70% YoY
- Google penalizes 45KB+ JS bundles with 23% higher bounce rates

Styled tour libraries didn't keep up.

**5/** Headless onboarding covers more than just tours:

- Product tours
- Onboarding checklists
- Feature announcements
- Hint beacons
- In-app surveys
- Adoption nudges

All with the same pattern: library handles logic, you handle rendering.

**6/** Full guide with architecture breakdown, implementation steps, comparison table, and 10 FAQs:

https://usertourkit.com/blog/headless-onboarding-explained

(I built Tour Kit, the headless library in the examples. The pattern applies to any headless approach.)

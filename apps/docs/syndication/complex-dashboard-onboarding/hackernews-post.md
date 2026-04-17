## Title: How to onboard users to a complex dashboard (role-based tours, progressive disclosure)

## URL: https://usertourkit.com/blog/complex-dashboard-onboarding

## Comment to post immediately after:

I wrote this after building a 50-widget analytics dashboard and watching 62% of new signups disappear after day one. The standard "tour every widget" approach actively hurts activation in data-heavy interfaces.

The key finding: three-step tours hit 72% completion. Past five steps, it collapses. Working memory holds ~7 items for 30 seconds (Miller's Law), and only 20% of users read page content. Dashboard onboarding has to work within those constraints.

The patterns that actually moved retention: role-based tour routing (different roles get different 3-step tours), empty state onboarding (use the blank screen as your primary onboarding surface), and everboarding (contextual micro-tours triggered by behavior, not calendar dates).

Article includes React code examples. I used Tour Kit (my own library) for the implementation, so take the specific tool recommendation with a grain of salt. The architectural patterns are library-agnostic.

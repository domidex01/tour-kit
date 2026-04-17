## Title: Building conditional product tours based on user role in React

## URL: https://usertourkit.com/blog/conditional-product-tour-user-role

## Comment to post immediately after:

I wrote this because I kept hitting the same problem in SaaS dashboards: admins, editors, and viewers all see the same onboarding tour, even though they have access to completely different features. The admin misses billing tools, the viewer gets shown buttons they can't click.

The pattern is straightforward: a `when` callback on each tour step checks the user's role from React Context. Steps that don't match get skipped, and the progress indicator adjusts automatically. The article walks through 6 code examples covering the role guard helper, wiring auth context into tour data, handling mid-session role changes, and when to use step filtering vs. separate tour definitions per role.

One data point that surprised me during research: personalized onboarding increases feature adoption by 42% and retention by 40% (UserGuiding, 2026). That's a significant gap for something most teams skip.

The code uses Tour Kit (which I built), but the conditional step pattern is library-agnostic. The article includes a security caveat about client-side role filtering not being a real access control mechanism.

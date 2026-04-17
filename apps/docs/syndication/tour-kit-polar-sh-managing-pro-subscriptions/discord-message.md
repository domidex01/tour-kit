## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote up how we handle Pro license validation in Tour Kit using Polar.sh. The interesting bit: their customer portal API needs no auth, so you can validate keys directly from React without a backend. Also documented three gotchas (lifetime activation limits, hidden international fees, snake_case API bodies) that aren't in their docs.

https://usertourkit.com/blog/tour-kit-polar-sh-managing-pro-subscriptions

If anyone else is doing free/pro tiers for a React library, curious how you handle license gating.

## Thread (6 tweets)

**1/** The onboarding tools market is $3.5B. Appcues charges $299/mo. Userpilot charges $249/mo. Pendo charges $15K-$140K/year.

React libraries ship the same core functionality for $0 and a fraction of the bundle weight.

Here's the data:

**2/** SaaS onboarding scripts inject 50-200KB of JavaScript on EVERY page load. They parse your DOM at runtime and overlay their own UI.

React libraries?
- Driver.js: ~5KB
- Tour Kit: <12KB
- React Joyride: ~37KB

All tree-shakeable. All lazy-loadable.

**3/** The "build vs buy" framing is a false binary.

Vendors estimate a custom build at $55K / 2 months. But that assumes building from scratch.

Using a library eliminates ~80% of that work. It's the third option nobody talks about: use a library, own the code.

**4/** SaaS tools genuinely win on visual builders, built-in analytics, and non-technical team access.

But those solve organizational problems, not technical ones. If your team writes React, every one of those "advantages" costs less to build than to integrate with a vendor.

**5/** Three trends accelerating this shift:

- EU Data Act (Sept 2025): vendor lock-in is now a compliance risk
- AI personalization: code-owned = you choose YOUR model
- Headless UI movement: Radix/shadcn proved logic-from-presentation works

**6/** Full breakdown with pricing tables, bundle size comparisons, code examples, and the honest counterargument:

https://usertourkit.com/blog/best-onboarding-software-is-library

(Disclosure: I built Tour Kit, but the argument applies to any React tour library)

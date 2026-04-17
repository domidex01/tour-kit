## Thread (6 tweets)

**1/** Online shoppers abandon 70% of carts. Baymard says $260B is recoverable through better checkout UX.

I built 6 product tour patterns in React that target specific abandonment causes. Here's what I found:

**2/** 18% abandon because checkout is too complicated. 19% because they don't trust the site with payment info.

A 3-step trust tour (SSL badge, return policy, payment options) directly addresses the second. 3-step tours hit 72% completion.

**3/** The biggest mistake: autostarting tours on every page.

E-commerce SPAs mount/unmount elements constantly. An autostarted tour that can't find its target shows a broken overlay. Smashing Magazine specifically warns against this.

**4/** The stat that surprised me: 71% of disabled users abandon inaccessible e-commerce sites immediately.

That's $2.3B/year in lost revenue. And 68% of ADA lawsuits in 2024 targeted online stores. Accessible tours aren't a nice-to-have.

**5/** Anti-patterns that consistently hurt conversion:
- Tours longer than 6 steps (completion drops below 40%)
- Blocking the Add to Cart button
- No dismiss option
- Ignoring mobile viewport

Measure against revenue metrics, not tour engagement metrics.

**6/** Full guide with all 6 React patterns, code examples, and comparison table:

https://usertourkit.com/blog/ecommerce-product-tour

Built with Tour Kit (headless, 8KB, WCAG 2.1 AA). Patterns apply to any tour library though.

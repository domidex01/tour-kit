## Thread (6 tweets)

**1/** Intercom product tours cost $273/month minimum.

The tours are linear-only, desktop-only, and show a 34% median completion rate.

I tested 6 alternatives side-by-side. Here's what I found:

**2/** The pricing spread is wild:

- Product Fruits: $79/mo
- UserGuiding: $174/mo
- Appcues: $249/mo
- Chameleon: $279/mo
- Intro.js: $9.99 one-time
- Tour Kit: free (MIT) / $99 Pro

Intercom charges $273/mo for an add-on feature. Most alternatives include it as core.

**3/** Nobody in this space talks about bundle size.

Intercom loads the entire Messenger SDK even if you only use tours.

Tour Kit's core: under 8KB gzipped.
Intro.js: ~10KB gzipped.
SaaS tools: opaque, but they all inject their own scripts.

**4/** Accessibility is the hidden gap.

Intercom achieved WCAG 2.0 AA for the Messenger widget.
Zero evidence of accessibility compliance for Product Tours specifically.

Tour Kit: WCAG 2.1 AA with ARIA roles, focus trapping, keyboard nav built in.

**5/** The real question: does your team write code or use visual builders?

Code → Tour Kit or Intro.js (one-time cost, full control)
Visual → Appcues or UserGuiding (monthly, less customization)

That split determines everything else.

**6/** Full comparison with pricing tables, code examples, and accessibility data:

https://usertourkit.com/blog/best-intercom-product-tour-alternatives

(Disclosure: Tour Kit is my project. All numbers are verifiable against npm, GitHub, and vendor pricing pages.)

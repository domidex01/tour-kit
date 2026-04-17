How much JavaScript does your product tour library add to your bundle?

I measured 10+ options and was surprised: React Joyride ships ~50KB, Shepherd.js is 30KB + dependencies. For code that runs once per user session and then sits idle, that's a real Core Web Vitals cost.

Only 5 libraries stay under 10KB gzipped. The interesting findings:

- Intro.js is the smallest (~4-5KB) but AGPL-licensed — commercial use requires a paid license that many teams don't discover until procurement flags it
- Driver.js is the lightest MIT option (~5KB) but has zero React integration
- No library in this category markets WCAG 2.1 AA compliance or tree-shaking support

Full comparison with table, licensing breakdown, and accessibility analysis:
https://usertourkit.com/blog/lightweight-product-tour-libraries-under-10kb

(Disclosure: I built Tour Kit, one of the five. Tried to be fair — every number is verifiable.)

#react #javascript #webperformance #corewebvitals #opensource #webdevelopment

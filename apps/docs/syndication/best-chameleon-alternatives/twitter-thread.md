## Thread (6 tweets)

**1/** I tested 8 Chameleon alternatives in a React 19 project and ran axe-core on every tour overlay.

The results were... revealing.

**2/** The pricing spread is wild:

- UserGuiding: $69/mo
- Product Fruits: $96/mo
- Appcues: $249/mo
- Userpilot: $299/mo
- Chameleon: avg $30K/yr (Vendr data)
- Pendo: $25K+/yr (paid plans)

Open source: $0 (Tour Kit, React Joyride, Shepherd.js)

**3/** The bundle/script sizes tell a story too:

- Tour Kit core: ~8KB gzipped
- Shepherd.js: ~25KB
- React Joyride: ~37KB
- Product Fruits: ~120KB
- UserGuiding: ~150KB
- Appcues: ~180KB
- Userpilot: ~200KB
- Pendo: ~250KB

That 250KB script hits hard on mobile.

**4/** The biggest surprise: accessibility.

I ran axe-core against every SaaS tour overlay. ALL of them failed.

Missing ARIA attributes. Broken focus management. No keyboard navigation.

Not one SaaS product tour tool documents WCAG compliance.

**5/** If your app has accessibility requirements (and it should), this is worth knowing before you sign a $30K/yr contract.

A library approach gives you the control to handle focus management, ARIA, and keyboard nav yourself.

**6/** Full comparison with detailed reviews for all 8 tools, pricing breakdown, and decision framework:

https://usertourkit.com/blog/best-chameleon-alternatives

(Disclosure: I built Tour Kit, #1 on the list. Every data point is verifiable.)

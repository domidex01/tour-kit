## Subject: Performance-first onboarding patterns for slow networks

## Recipients:
- Cooperpress (React Status, JavaScript Weekly, Frontend Focus): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a guide on building product tours that work on 3G and flaky connections. It covers React.lazy code splitting for tour libraries, adaptive rendering with the Network Information API, and service worker caching strategies.

The key finding: every "product tour best practices" guide from the major vendors ignores performance entirely, yet a typical SaaS tour SDK adds 300 KB+ to the page, taking 2.4 seconds to download on 3G before any tour step renders. The article includes a comparison table, working code examples, and a 7-point checklist tested on throttled Chrome DevTools.

Link: https://usertourkit.com/blog/low-bandwidth-onboarding-performance-first-patterns

Thanks,
Domi

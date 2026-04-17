Your product tour tooltips might be an XSS vector.

I audited how 5 popular tour libraries render dynamic tooltip content. The results: Shepherd.js, Driver.js, and Intro.js accept raw HTML strings and render them via innerHTML without sanitization. If that content comes from a CMS or API, you've got a stored XSS vulnerability.

Some numbers that put this in context:
- 6.29 billion web application attacks in 2025 (56% YoY increase)
- 6,227 XSS-specific CVEs published in 2025
- 43% of web apps have no Content Security Policy header

The fix is architectural. Libraries that type step content as React.ReactNode instead of string get React's auto-escaping for free. No DOMPurify needed for the common case.

I wrote up the full comparison with code examples for sanitization, URL validation, and CSP configuration.

https://usertourkit.com/blog/product-tour-xss-prevention

#react #javascript #websecurity #webdevelopment #opensource

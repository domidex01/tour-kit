## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote up a deep-dive on XSS risks in product tour tooltip rendering. Compared how Shepherd.js, React Joyride, Driver.js, Intro.js, and Tour Kit handle dynamic content. Some use innerHTML with no sanitization, which is a problem if your step content comes from a CMS or API. Includes DOMPurify integration, URL scheme validation, and CSP setup for Next.js.

https://usertourkit.com/blog/product-tour-xss-prevention

Would appreciate feedback on the CSP section if anyone has experience with nonce-based policies and CSS-in-JS libraries.

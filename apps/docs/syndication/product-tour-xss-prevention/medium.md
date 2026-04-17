# The Hidden XSS Risk in Your Product Tour Tooltips

## How the way your tour library renders content determines whether you're safe by default

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-xss-prevention)*

Product tours inject HTML into your app at runtime. Every tooltip, popover, and overlay is a potential XSS vector if the library renders unsanitized user input.

In the first half of 2025, cross-site scripting and SQL injection accounted for 38% of all identified web application weaknesses. Tooltip libraries have been hit before. Bootstrap's tooltip component had a stored XSS vulnerability (CVE-2019-8331) that persisted across two major versions. The react-tooltip package had an XSS vulnerability in versions before 3.8.1.

This isn't theoretical. If your product tour pulls step content from a CMS, translation service, or database, you need to know how that content reaches the DOM.

## The numbers

Web application attacks reached 6.29 billion incidents in 2025, up 56% year-over-year. Exploited web app vulnerabilities cost organizations an average of $4.44 million. Over 6,227 XSS-specific CVEs were published in 2025 alone.

Product tours run inside authenticated sessions. A successful XSS in a tour tooltip can steal session cookies, redirect users to phishing pages, or exfiltrate data from the DOM.

## Two approaches to rendering tooltip content

The key architectural decision: does the library accept HTML strings or React elements?

Libraries like Shepherd.js, Driver.js, and Intro.js accept raw HTML strings rendered via innerHTML. If that string comes from an external source, you're one unsanitized API response away from stored XSS.

Libraries like Tour Kit use React.ReactNode exclusively. React's JSX auto-escaping handles the sanitization. If a variable contains a script tag, it renders as text, not executable code.

The difference is one line of code in the type definition. But it eliminates an entire class of vulnerabilities.

## When React's escaping isn't enough

Three situations still require extra defense:

**CMS content.** If you render HTML from a headless CMS using dangerouslySetInnerHTML, sanitize with DOMPurify first. It adds about 6.4KB gzipped.

**URL schemes.** React won't stop a javascript: URL from rendering in an anchor tag. Validate protocols against an allowlist (http:, https:, mailto:).

**Direct DOM manipulation.** Using refs to set attributes bypasses React's escaping. Stick to JSX attributes.

## Content Security Policy

43% of web applications have no CSP header at all. Another 19% have one that's overly permissive. CSP is your second line of defense. If sanitization fails, a strict CSP prevents injected scripts from executing.

Product tour libraries create unique CSP challenges because they use inline styles for positioning. The pragmatic approach: allow unsafe-inline for style-src only, keep script-src locked down with nonces.

## Quick audit

1. Does your library accept HTML strings? If yes, sanitize any external data with DOMPurify.
2. Search your codebase for dangerouslySetInnerHTML. Every instance that renders external data needs a sanitization wrapper.
3. Validate URL schemes in tour links.
4. Check for a Content-Security-Policy header. script-src should not include unsafe-inline.
5. Test with payloads like `<img src=x onerror=alert(1)>`.
6. Run npm audit regularly.

The full article includes working code examples for DOMPurify integration, URL validation, CSP configuration in Next.js, and a comparison table of how five popular tour libraries handle content rendering.

[Read the full article with code examples](https://usertourkit.com/blog/product-tour-xss-prevention)

---

*Suggested publications: JavaScript in Plain English, Better Programming, ITNEXT*

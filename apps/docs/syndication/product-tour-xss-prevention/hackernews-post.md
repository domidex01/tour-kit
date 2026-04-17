## Title: Product tour libraries and XSS: innerHTML vs. React.ReactNode

## URL: https://usertourkit.com/blog/product-tour-xss-prevention

## Comment to post immediately after:

I built a product tour library for React and got curious about how other libraries handle the security implications of rendering dynamic tooltip content.

The core finding: libraries that accept HTML strings for step content (Shepherd.js, Driver.js, Intro.js) render them via innerHTML with no sanitization. If the string originates from a CMS, translation service, or database, that's a stored XSS vector. Bootstrap's tooltip had this exact problem (CVE-2019-8331), and react-tooltip had an XSS vulnerability in versions before 3.8.1.

The architectural fix is straightforward: type step content as React.ReactNode instead of string. React's auto-escaping handles it. But there are three gaps React doesn't cover: dangerouslySetInnerHTML for CMS content, javascript: URLs in anchor tags, and direct DOM manipulation via refs.

Also did some research on CSP adoption. 43% of web applications have no Content Security Policy header at all, and product tours create unique CSP challenges because of inline styles for positioning.

The article includes a comparison table, code examples for DOMPurify integration, URL scheme validation, and Next.js CSP middleware configuration.

Disclosure: I built Tour Kit, the library discussed in the article. The XSS comparison data is independently verifiable against each library's documentation and type definitions.

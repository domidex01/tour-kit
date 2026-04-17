## Thread (6 tweets)

**1/** Product tour tooltips are XSS vectors that nobody talks about.

I audited 5 tour libraries. Some render step content via innerHTML with zero sanitization.

Bootstrap's tooltip had CVE-2019-8331. react-tooltip had XSS before v3.8.1.

Here's what I found:

**2/** The architectural split:

- Shepherd.js, Driver.js, Intro.js: accept HTML strings, render via innerHTML
- React Joyride: accepts both strings and ReactNode
- Tour Kit: React.ReactNode only

If your step content comes from a CMS or API, the rendering method matters.

**3/** React's auto-escaping handles the common case. A {userName} with script tags renders as text, not executable code.

But React doesn't cover:
- dangerouslySetInnerHTML
- javascript: URLs in hrefs
- Direct DOM manipulation via refs

**4/** The CSP gap is worse than expected.

43% of web apps have no Content Security Policy header at all.
19% have one that's overly permissive.

Product tours make CSP harder because inline styles are needed for positioning.

**5/** Quick audit for your product tour:

1. Does your library accept HTML strings? Sanitize with DOMPurify.
2. grep for dangerouslySetInnerHTML
3. Validate URL schemes (block javascript:)
4. Check your CSP headers
5. Test with: <img src=x onerror=alert(1)>

**6/** Full writeup with comparison table, DOMPurify integration code, URL validation, and Next.js CSP middleware:

https://usertourkit.com/blog/product-tour-xss-prevention

Stats: 6,227 XSS CVEs in 2025. 38% of all web app weaknesses. $4.44M average cost per exploited vulnerability.

## Subreddit: r/reactjs

**Title:** I audited how 5 product tour libraries render tooltip content. Some use innerHTML with no sanitization.

**Body:**

I've been building a product tour library and got curious about how different libraries handle the security side of rendering tooltip content. Specifically: what happens when your step content includes data from a CMS, API, or user input?

Turns out there's a significant architectural split. Libraries like Shepherd.js, Driver.js, and Intro.js accept raw HTML strings and render them via innerHTML. If that string includes untrusted data, you've got a stored XSS vector. Bootstrap's tooltip had exactly this problem (CVE-2019-8331), and react-tooltip had an XSS vulnerability in versions before 3.8.1.

React-based libraries can avoid this entirely by typing step content as `React.ReactNode` instead of `string`. React's JSX auto-escaping handles the sanitization. A `{userName}` variable containing `<script>alert(1)</script>` renders as harmless text. No DOMPurify needed for the common case.

But React doesn't cover everything. Three gaps remain:
- `dangerouslySetInnerHTML` (for CMS HTML content) bypasses escaping entirely
- `javascript:` URLs in anchor tags aren't validated
- Direct DOM manipulation via refs skips React's pipeline

Also found that 43% of web apps have no CSP header at all. Product tours create unique CSP challenges because they use inline styles for positioning.

I wrote up the full comparison with code examples for DOMPurify integration, URL validation, and CSP configuration: https://usertourkit.com/blog/product-tour-xss-prevention

Curious if anyone else has run into XSS issues with tour/tooltip libraries. What's your approach to sanitizing dynamic tooltip content?

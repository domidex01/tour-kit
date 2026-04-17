## Subject: XSS prevention in product tour tooltip content — comparison of 5 libraries

## Recipients:
- Cooperpress (React Status, JavaScript Weekly, Frontend Focus): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a deep-dive comparing how 5 product tour libraries (Shepherd.js, React Joyride, Driver.js, Intro.js, Tour Kit) handle XSS risks in tooltip rendering. The key finding: libraries using innerHTML for step content have no default sanitization, while React.ReactNode-based libraries are safe by default.

The article includes a comparison table, DOMPurify integration code, URL scheme validation, and a CSP configuration guide for Next.js. Relevant stats: 38% of all web app weaknesses in H1 2025 were XSS/SQLi, and 43% of apps have no CSP header.

Link: https://usertourkit.com/blog/product-tour-xss-prevention

Thanks,
Domi

---
title: "Your product tour tooltips might be an XSS vector. Here's how to check."
published: false
description: "Product tour libraries render dynamic content in your DOM. Some use innerHTML, some use React elements. The difference decides whether you're safe by default or one API response away from a stored XSS."
tags: react, javascript, security, webdev
canonical_url: https://usertourkit.com/blog/product-tour-xss-prevention
cover_image: https://usertourkit.com/og-images/product-tour-xss-prevention.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-xss-prevention)*

# XSS prevention in product tour tooltip content

Product tours inject HTML into your app at runtime. Every tooltip, popover, and overlay is a potential XSS vector if the library renders unsanitized user input. In the first half of 2025, cross-site scripting and SQL injection accounted for 38% of all identified web application weaknesses ([Security Boulevard, March 2026](https://securityboulevard.com/2026/03/46-vulnerability-statistics-2026-key-trends-in-discovery-exploitation-and-risk/)). And tooltip libraries have been hit before. Bootstrap's tooltip component had a stored XSS vulnerability (CVE-2019-8331) that persisted across two major versions.

This isn't theoretical. If your product tour pulls step content from a CMS, translation service, or database, you need to know exactly how that content reaches the DOM.

## Why XSS prevention matters for product tours

Cross-site scripting costs real money. Web application attacks reached 6.29 billion incidents in 2025, a 56% year-over-year increase ([Indusface, 2026](https://www.indusface.com/blog/key-cybersecurity-statistics/)). Exploited vulnerabilities in web applications cost organizations an average of $4.44 million in damages. Over 6,227 XSS-specific CVEs were published in 2025 alone.

Product tours are a particularly attractive attack surface because they run inside authenticated sessions. A successful XSS in a tour tooltip can steal session cookies, redirect users to phishing pages, or exfiltrate data from the DOM. The `react-tooltip` package had exactly this kind of vulnerability in versions before 3.8.1 ([Snyk](https://security.snyk.io/vuln/SNYK-JS-REACTTOOLTIP-72363)).

## How tour libraries render content differently

The rendering approach determines the default XSS posture. Does the library accept HTML strings or React elements?

| Library | Content type | Rendering method | Default XSS posture |
|---|---|---|---|
| Tour Kit | `React.ReactNode` | JSX auto-escaping | Safe by default |
| React Joyride | `string \| ReactNode` | Accepts HTML elements | Safe with JSX, risky with strings |
| Shepherd.js | `string \| HTMLElement` | `innerHTML` | Vulnerable if content is untrusted |
| Driver.js | `string` | `innerHTML` | Vulnerable if content is untrusted |
| Intro.js | `string` | `innerHTML` | Vulnerable if content is untrusted |

Shepherd.js documentation confirms the `text` property accepts "a regular HTML string or an HTMLElement object." That HTML string hits the DOM without sanitization.

## Why React.ReactNode is the safer default

Tour Kit's step type definition uses `React.ReactNode` for content, not HTML strings. When you pass JSX to a Tour Kit step, React's rendering pipeline handles escaping automatically.

```tsx
// src/tours/onboarding.tsx
import type { TourStep } from '@tourkit/core'

const steps: TourStep[] = [
  {
    id: 'welcome',
    target: '#dashboard-header',
    content: (
      <div>
        <h3>Welcome, {userName}</h3>
        <p>Here's your dashboard.</p>
      </div>
    ),
  },
]
```

That `{userName}` variable gets escaped by React before it reaches the DOM. If `userName` contains `<script>alert('xss')</script>`, it renders as a harmless text string.

Compare with Shepherd.js:

```js
const step = {
  text: `<div>
    <h3>Welcome, ${userName}</h3>
    <p>Here's your dashboard.</p>
  </div>`,
}
// If userName = "<img src=x onerror=alert(1)>", that's XSS
```

## When you still need to sanitize (even with React)

React's auto-escaping covers the common case, but three situations require extra defense.

### CMS content with dangerouslySetInnerHTML

```tsx
import DOMPurify from 'dompurify'

function CmsStepContent({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}
```

DOMPurify adds roughly 6.4KB gzipped. Tour Kit's core is under 8KB gzipped, so ~14KB total.

### URL scheme validation

React won't stop a `javascript:` URL from rendering in an `<a>` tag:

```tsx
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol)
  } catch {
    return false
  }
}
```

## Content Security Policy and product tours

As of 2025, 43% of tested web applications had no CSP header at all ([2NS Cybersecurity, 2025](https://www.2ns.fi/en/application-security-in-2025-what-the-data-really-tells-us/)). CSP is your second line of defense.

Tour Kit works with nonce-based CSP because it doesn't inject inline `<style>` blocks:

```tsx
// src/middleware.ts (Next.js)
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self';
    frame-ancestors 'none';
  `.replace(/\n/g, '')

  const response = NextResponse.next()
  response.headers.set('Content-Security-Policy', cspHeader)
  return response
}
```

## Common mistakes

### Template literal step content

```tsx
// Vulnerable
const step = { content: `<p>Welcome, ${user.name}!</p>` }

// Fixed
const step = { content: <p>Welcome, {user.name}!</p> }
```

### Markdown without sanitization

```tsx
// Vulnerable
<div dangerouslySetInnerHTML={{ __html: marked(cmsContent) }} />

// Fixed
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked(cmsContent)) }} />
```

## Security audit checklist

1. Check if your library accepts HTML strings or `ReactNode`
2. Search for `dangerouslySetInnerHTML` in your codebase
3. Validate all URL schemes against an allowlist
4. Check attribute injection in `data-*` and `title` attributes
5. Verify CSP headers (`script-src` should not include `'unsafe-inline'`)
6. Test with XSS payloads: `<img src=x onerror=alert(1)>`
7. Run `npm audit` regularly

---

*Tour Kit is a headless product tour library for React that uses `React.ReactNode` for step content, making it safe by default against XSS. [Get started](https://usertourkit.com/docs/getting-started) or [view the source on GitHub](https://github.com/AmanVarshney01/tour-kit).*

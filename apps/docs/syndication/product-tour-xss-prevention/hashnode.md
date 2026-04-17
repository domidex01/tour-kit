---
title: "XSS prevention in product tour tooltip content"
slug: "product-tour-xss-prevention"
canonical: https://usertourkit.com/blog/product-tour-xss-prevention
tags: react, javascript, web-security, web-development
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-xss-prevention)*

# XSS prevention in product tour tooltip content

Product tours inject HTML into your app at runtime. Every tooltip, popover, and overlay is a potential XSS vector if the library renders unsanitized user input. In the first half of 2025, cross-site scripting and SQL injection accounted for 38% of all identified web application weaknesses ([Security Boulevard, March 2026](https://securityboulevard.com/2026/03/46-vulnerability-statistics-2026-key-trends-in-discovery-exploitation-and-risk/)). And tooltip libraries have been hit before. Bootstrap's tooltip component had a stored XSS vulnerability (CVE-2019-8331) that persisted across two major versions.

If your product tour pulls step content from a CMS, translation service, or database, you need to know exactly how that content reaches the DOM.

## Why XSS prevention matters for product tours

Web application attacks reached 6.29 billion incidents in 2025, a 56% year-over-year increase. Exploited vulnerabilities cost organizations an average of $4.44 million. Over 6,227 XSS-specific CVEs were published in 2025 alone.

Product tours run inside authenticated sessions. A successful XSS in a tour tooltip can steal session cookies, redirect users to phishing pages, or exfiltrate data from the DOM.

## How tour libraries render content

| Library | Content type | Rendering method | Default XSS posture |
|---|---|---|---|
| Tour Kit | `React.ReactNode` | JSX auto-escaping | Safe by default |
| React Joyride | `string \| ReactNode` | Accepts HTML elements | Safe with JSX, risky with strings |
| Shepherd.js | `string \| HTMLElement` | `innerHTML` | Vulnerable if content is untrusted |
| Driver.js | `string` | `innerHTML` | Vulnerable if content is untrusted |
| Intro.js | `string` | `innerHTML` | Vulnerable if content is untrusted |

## ReactNode vs HTML strings

Tour Kit uses `React.ReactNode` for step content. React's rendering pipeline handles escaping automatically:

```tsx
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
// userName with <script> tags renders as harmless text
```

Versus Shepherd.js where the same content uses template literals:

```js
const step = {
  text: `<div><h3>Welcome, ${userName}</h3></div>`,
}
// If userName = "<img src=x onerror=alert(1)>", that's XSS
```

## When you still need DOMPurify

If your tour content comes from a CMS as HTML:

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

Also validate URL schemes. React won't stop `javascript:` URLs:

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

## CSP for product tours

43% of web applications have no Content Security Policy header. Tour Kit works with strict CSP because it doesn't inject inline `<style>` blocks or scripts.

## Quick audit checklist

1. Check if your library accepts HTML strings or `ReactNode`
2. Search for `dangerouslySetInnerHTML` in your codebase
3. Validate URL schemes against an allowlist
4. Verify CSP headers exist
5. Test with XSS payloads
6. Run `npm audit` regularly

Full article with code examples and CSP configuration: [usertourkit.com/blog/product-tour-xss-prevention](https://usertourkit.com/blog/product-tour-xss-prevention)

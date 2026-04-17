## Thread (6 tweets)

**1/** Product tours trigger at least 16 WCAG 2.1 AA success criteria. Most tour libraries fail 3 or more of them. Here's the full mapping:

**2/** The #1 failure: focus management. When a tour step opens, keyboard focus must move into it. When it closes, focus returns to the trigger. Most libraries leave focus stranded on the overlay backdrop or dump it to document.body.

**3/** In 2024, 722 of 3,188 ADA lawsuits targeted sites that ALREADY had an accessibility overlay widget installed. Having a widget didn't prevent the lawsuit. Tour libraries using the same overlay injection pattern create the same problems.

**4/** The minimum viable accessible tour step needs:
- role="dialog" + aria-modal="true"
- Focus moves to step on open
- Focus trapped within step (Tab cycles)
- Escape always dismisses
- aria-live announces step changes

**5/** Two deadlines developers need to know:
- DOJ: April 24, 2026 — WCAG 2.1 AA for US gov sites
- EU: June 2025 — European Accessibility Act (WCAG 2.2 AA)

Enterprise procurement already requires AA for all web apps.

**6/** Full article with 16-criteria mapping table, library comparison, decision framework, and code examples:

https://usertourkit.com/blog/wcag-requirements-product-tour

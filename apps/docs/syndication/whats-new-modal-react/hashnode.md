---
title: "How to build a 'What's New' changelog modal in React"
slug: "whats-new-modal-react"
canonical: https://tourkit.dev/blog/whats-new-modal-react
tags: react, javascript, web-development, typescript
---

*Originally published at [tourkit.dev](https://tourkit.dev/blog/whats-new-modal-react)*

# How to build a "What's New" changelog modal in React

Users don't read changelogs. Not the ones on your marketing site, and definitely not the ones buried in a GitHub releases page. A Featurebase analysis found that in-product announcements consistently outperform external channels because they appear where users are already working ([Featurebase, 2026](https://www.featurebase.app/blog/product-updates)). The industry has shifted from tracking open rates to measuring 7-day feature adoption rate, because a thousand impressions mean nothing if nobody tries the feature ([Arcade, 2026](https://www.arcade.software/post/feature-announcement-examples)).

This tutorial builds a "What's New" changelog modal using `@tour-kit/announcements` — a headless React library that handles persistence, frequency rules, and analytics callbacks. Under 80 lines, ~4KB gzipped.

```bash
npm install @tour-kit/announcements
```

The full tutorial covers:

1. **Typed changelog data** — A TypeScript interface with stable IDs for seen/unseen tracking
2. **AnnouncementsProvider** — Manages display state, localStorage persistence, and 5 frequency presets
3. **Native `<dialog>` modal** — Focus trapping and ESC dismissal with zero library code (vs. react-modal at 188KB)
4. **Manual trigger button** — "What's New" badge with reactive unseen count
5. **Analytics callbacks** — `onView`, `onDismiss`, `onAction` lifecycle hooks

Read the full tutorial with all code examples: [How to build a "What's New" changelog modal in React](https://tourkit.dev/blog/whats-new-modal-react)

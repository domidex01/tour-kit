---
title: "What is a banner? In-app announcements and feature releases"
slug: "what-is-in-app-banner"
canonical: https://usertourkit.com/blog/what-is-in-app-banner
tags: react, javascript, web-development, ux
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-in-app-banner)*

# What is a banner? In-app announcements and feature releases

You shipped a feature last Tuesday. Your changelog got 40 views. Your email announcement had a 19% open rate. Meanwhile, 100% of your active users loaded the dashboard today and saw nothing.

In-app banners fix that gap. They sit inside the application itself, not in an inbox.

## Definition

An in-app banner is a non-blocking UI element, typically a horizontal strip at the top or bottom of the viewport, that communicates information to users without interrupting their current task. Banners persist until the user dismisses them or the display condition expires. Unlike modals, they don't require interaction before the user can continue working. Unlike toasts, they don't disappear on a timer.

## How in-app banners work

An in-app banner renders as a fixed or sticky `<div>` at the viewport edge, handling three concerns: visibility logic (frequency rules), dismissal persistence (remembering closed state), and accessible markup (correct ARIA roles).

**Visibility** — Production banners need frequency rules: show once ever, once per session, or N times total. Without that control, users see the same announcement on every page load. Facebook's research confirmed that reducing notification volume improved long-term retention ([Smashing Magazine, 2026](https://www.smashingmagazine.com/2025/12/design-guidelines-notifications-ux/)).

**Dismissal persistence** — For anonymous users, `localStorage` works. Authenticated users who switch devices need server-side storage.

**Accessibility** — Here's the gotcha: `role="banner"` is a landmark role for the site header, not a notification. Use `role="alert"` for urgent banners or `role="status"` for non-urgent ones ([W3C WAI-ARIA](https://www.w3.org/TR/wai-aria-1.2/#alert)).

## Banners vs toasts vs modals

| Pattern | Blocking? | Auto-dismiss? | Best for | ARIA role |
|---|---|---|---|---|
| Banner | No | No (manual dismiss) | Persistent announcements | `role="alert"` or `role="status"` |
| Toast | No | Yes (3-8 seconds) | Action confirmations | `role="status"` |
| Modal | Yes (focus trap) | No | Critical decisions, consent | `role="dialog"` |

The general rule: if the user needs to act before continuing, use a modal. If the message confirms something the user just did, use a toast. If the message should stay visible but not interrupt, use a banner ([AnnounceKit, 2025](https://announcekit.app/blog/in-app-banners-vs-modals-vs-tooltips)).

## Why in-app banners matter

Email open rates average around 20%. Push notifications get muted by ~60% of mobile users. In-app banners reach 100% of active users because they render where the user already is ([Flows.sh, 2026](https://flows.sh/blog/building-in-app-announcement)).

Frequency control prevents fatigue. Limit banners to once per feature release, cap active banners at one, and tie display rules to user behavior.

## Building an in-app banner in React

```tsx
import {
  AnnouncementsProvider,
  AnnouncementBanner,
} from '@tour-kit/announcements'

const announcements = [
  {
    id: 'new-export-feature',
    variant: 'banner' as const,
    title: 'CSV exports are here',
    description: 'Export any report to CSV with one click.',
    frequency: { type: 'times' as const, count: 3 },
    bannerOptions: { position: 'top' as const, intent: 'info' as const },
  },
]

export function FeatureBanner() {
  return (
    <AnnouncementsProvider announcements={announcements}>
      <AnnouncementBanner id="new-export-feature" />
    </AnnouncementsProvider>
  )
}
```

Full article with headless variant example and comparison table: [usertourkit.com/blog/what-is-in-app-banner](https://usertourkit.com/blog/what-is-in-app-banner)

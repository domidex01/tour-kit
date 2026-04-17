---
title: "How to create a feature announcement banner in React"
slug: "feature-announcement-banner-react"
canonical: https://usertourkit.com/blog/feature-announcement-banner-react
tags: react, javascript, web-development, typescript, tutorial
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/feature-announcement-banner-react)*

# How to create a feature announcement banner in React

You shipped a new feature. Now you need users to actually notice it. Email open rates sit around 20% on average, push notifications get muted by roughly 60% of mobile users, and changelog pages collect dust. In-app banners reach 100% of active users because they appear right where the user is already looking ([Flows.sh, 2026](https://flows.sh/blog/building-in-app-announcement)).

The problem is that most "React banner" tutorials stop at a hardcoded `useState` toggle. That works for a hackathon. It doesn't work when you need banners that remember who dismissed them, show only three times, or fire an analytics event on click.

This tutorial builds a production-grade feature announcement banner using `@tour-kit/announcements` — a headless announcement library for React that handles persistence, frequency control, and accessibility. Under 60 lines of code total.

```bash
npm install @tour-kit/announcements
```

## What you'll build

A banner component that persists dismissal state to `localStorage`, respects 5 frequency rules (`once`, `session`, `always`, N-times, interval-based), fires analytics callbacks, and renders with `role="alert"` for screen readers. Under 4KB gzipped added to your bundle.

## Step 1: set up the provider

```tsx
// src/providers/announcements.tsx
import {
  AnnouncementsProvider,
  type AnnouncementConfig,
} from '@tour-kit/announcements'

const announcements: AnnouncementConfig[] = [
  {
    id: 'dark-mode-launch',
    variant: 'banner',
    title: 'Dark mode is here',
    description: 'Switch to dark mode from your settings page.',
    frequency: 'once',
    bannerOptions: { position: 'top', dismissable: true, intent: 'info' },
    primaryAction: {
      label: 'Try it now',
      onClick: () => window.location.assign('/settings'),
      dismissOnClick: true,
    },
  },
]

export function AppAnnouncements({ children }: { children: React.ReactNode }) {
  return (
    <AnnouncementsProvider
      announcements={announcements}
      onAnnouncementShow={(id) => console.log('shown:', id)}
      onAnnouncementDismiss={(id, reason) => console.log('dismissed:', id, reason)}
    >
      {children}
    </AnnouncementsProvider>
  )
}
```

## Step 2: render the banner

```tsx
// src/components/layout.tsx
import { AnnouncementBanner } from '@tour-kit/announcements'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AnnouncementBanner id="dark-mode-launch" />
      <main>{children}</main>
    </div>
  )
}
```

## Step 3: go headless for design control

```tsx
// src/components/feature-banner.tsx
import { HeadlessBanner } from '@tour-kit/announcements'

export function FeatureBanner({ id }: { id: string }) {
  return (
    <HeadlessBanner id={id}>
      {({ open, config, dismiss, bannerProps }) => {
        if (!open) return null
        return (
          <div {...bannerProps} className="flex items-center gap-4 bg-blue-50 px-4 py-3 border-b border-blue-200 text-sm">
            <p className="flex-1">
              <strong>{config?.title}</strong>
              {config?.description && ` — ${config.description}`}
            </p>
            <button onClick={() => dismiss('close_button')} aria-label="Dismiss announcement">✕</button>
          </div>
        )
      }}
    </HeadlessBanner>
  )
}
```

The `HeadlessBanner` ships 0KB of CSS. You get `role="alert"` and `data-state` via `bannerProps` — you control everything else.

## Step 4: frequency rules

Tour Kit supports 5 frequency modes: `'once'`, `'session'`, `'always'`, `{ type: 'times', count: N }`, and `{ type: 'interval', days: N }`. All persistence is handled via `localStorage` automatically.

## Step 5: analytics

The provider accepts `onAnnouncementShow`, `onAnnouncementDismiss`, and `onAnnouncementComplete` callbacks. Tour Kit tracks 7 dismissal reasons so you can distinguish close-button vs CTA-click in your analytics.

---

Full article with all code examples, frequency table, and troubleshooting: [usertourkit.com/blog/feature-announcement-banner-react](https://usertourkit.com/blog/feature-announcement-banner-react)

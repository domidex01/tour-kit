---
title: "Build a 'What's New' changelog modal in React (with localStorage + analytics)"
published: false
description: "Step-by-step tutorial: changelog modal with seen/unseen tracking, frequency rules, WCAG focus trapping, and analytics callbacks. Under 80 lines, ~4KB gzipped."
tags: react, typescript, webdev, tutorial
canonical_url: https://tourkit.dev/blog/whats-new-modal-react
cover_image: https://tourkit.dev/og-images/whats-new-modal-react.png
---

*Originally published at [tourkit.dev](https://tourkit.dev/blog/whats-new-modal-react)*

# How to build a "What's New" changelog modal in React

Users don't read changelogs. Not the ones on your marketing site, and definitely not the ones buried in a GitHub releases page. A Featurebase analysis found that in-product announcements consistently outperform external channels because they appear where users are already working ([Featurebase, 2026](https://www.featurebase.app/blog/product-updates)). The industry has shifted from tracking open rates to measuring 7-day feature adoption rate, because a thousand impressions mean nothing if nobody tries the feature ([Arcade, 2026](https://www.arcade.software/post/feature-announcement-examples)).

The typical React approach to this problem is a `useState` toggle, a hardcoded list of entries, and a `div` styled to look like a modal. That covers about 30% of the real requirements. You still need: localStorage persistence so the modal doesn't reappear after dismissal, seen/unseen tracking per entry, proper focus trapping for accessibility, and a way to know which updates users actually read.

This tutorial builds a "What's New" changelog modal using `@tour-kit/announcements`. You get five display variants (modal, toast, banner, slideout, spotlight), localStorage-based persistence, analytics callbacks, and WCAG 2.1 AA-compliant focus management out of the box. We tested the full setup in a Vite 6 + React 19 + TypeScript 5.7 project.

```bash
npm install @tour-kit/announcements
```

## What you'll build

A changelog modal in React that tracks which entries each user has seen, persists that state across sessions in localStorage, supports keyboard navigation and screen readers, and fires analytics events when users view or dismiss entries. Tour Kit's `@tour-kit/announcements` package handles the display logic, frequency rules, and persistence layer while you control the rendering. The whole implementation runs under 80 lines across 3 files and adds roughly 4KB gzipped to your bundle.

## Prerequisites

- React 18.2+ or React 19
- TypeScript 5.0+
- A React project (Vite, Next.js, or CRA)
- Familiarity with React context and hooks

## Step 1: define your changelog entries

A changelog modal in React needs a typed data source that's version-controllable, cheap to update during releases, and keyed by stable IDs for seen/unseen tracking in localStorage. Most tutorials hardcode entries inline, but a separate TypeScript file works better because you can import it anywhere and validate the shape at compile time. As Edvins Antonovs puts it: "The trick is keeping it simple. We don't need real-time updates or complex state management" ([edvins.io, 2026](https://edvins.io/building-a-lightweight-changelog-system-in-react)).

```tsx
// src/data/changelog.ts
export interface ChangelogEntry {
  id: string
  version: string
  date: string
  title: string
  description: string
  type: 'feature' | 'improvement' | 'fix'
  link?: string
}

export const changelog: ChangelogEntry[] = [
  {
    id: 'v2-4-0-dark-mode',
    version: '2.4.0',
    date: '2026-04-01',
    title: 'Dark mode support',
    description:
      'All components now respect your system color scheme preference. No configuration needed.',
    type: 'feature',
    link: '/docs/guides/dark-mode',
  },
  {
    id: 'v2-3-2-export-csv',
    version: '2.3.2',
    date: '2026-03-20',
    title: 'CSV export for dashboards',
    description:
      'Export any dashboard view as a CSV file. Click the download icon in the top-right corner.',
    type: 'improvement',
  },
  {
    id: 'v2-3-1-safari-fix',
    version: '2.3.1',
    date: '2026-03-15',
    title: 'Safari scroll position fix',
    description:
      'Fixed an issue where Safari would reset scroll position after closing a modal.',
    type: 'fix',
  },
]
```

Each entry has a stable `id` string. Tour Kit uses this ID for seen/unseen tracking in localStorage under the `tour-kit:announcements:` key prefix. Keep IDs immutable once shipped. Changing an ID makes the entry appear "new" again for every user.

## Step 2: set up the announcements provider

Tour Kit's `AnnouncementsProvider` wraps your app layout and manages three things that every What's New modal needs: which entries are visible, whether the user has already seen them (persisted to localStorage), and how often each entry should reappear. You pass it an array of `AnnouncementConfig` objects mapped from your changelog data, and the provider handles the rest internally.

```tsx
// src/providers/changelog-provider.tsx
import {
  AnnouncementsProvider,
  type AnnouncementConfig,
} from '@tour-kit/announcements'
import { changelog } from '../data/changelog'

const announcements: AnnouncementConfig[] = changelog.map((entry) => ({
  id: entry.id,
  content: entry,
  displayType: 'modal',
  frequency: 'once',
  priority: entry.type === 'feature' ? 10 : entry.type === 'improvement' ? 5 : 1,
}))

export function ChangelogProvider({ children }: { children: React.ReactNode }) {
  return (
    <AnnouncementsProvider
      announcements={announcements}
      storageKey="app-changelog"
    >
      {children}
    </AnnouncementsProvider>
  )
}
```

The `frequency: 'once'` setting means each entry appears until the user marks it as seen, then never again. Tour Kit also supports `'session'`, `'always'`, a numeric count, or an interval like `{ hours: 72 }`. The `priority` field controls display order when multiple unseen entries exist.

## Step 3: build the changelog modal component

The modal component renders all unseen changelog entries in a single native `<dialog>` element, using Tour Kit's `useAnnouncements` hook for state and the browser's built-in focus trapping and ESC-key dismissal. This approach adds zero modal-library JavaScript to your bundle while meeting WCAG 2.1 AA requirements for dialog accessibility, including `aria-modal`, focus return, and keyboard navigation.

```tsx
// src/components/WhatsNewModal.tsx
'use client'

import { useAnnouncements } from '@tour-kit/announcements'
import { useEffect, useRef } from 'react'
import type { ChangelogEntry } from '../data/changelog'

export function WhatsNewModal() {
  const { active, markSeen, markAllSeen } = useAnnouncements()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  const unseen = active.map((a) => a.content as ChangelogEntry)

  useEffect(() => {
    if (unseen.length > 0 && dialogRef.current && !dialogRef.current.open) {
      triggerRef.current = document.activeElement as HTMLElement
      dialogRef.current.showModal()
    }
  }, [unseen.length])

  function handleClose() {
    markAllSeen()
    dialogRef.current?.close()
    triggerRef.current?.focus()
  }

  if (unseen.length === 0) return null

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="changelog-title"
      aria-modal="true"
      onClose={handleClose}
      className="changelog-modal"
    >
      <header>
        <h2 id="changelog-title">What's new</h2>
        <button onClick={handleClose} aria-label="Close changelog">
          ×
        </button>
      </header>
      <ul role="list">
        {unseen.map((entry) => (
          <li key={entry.id}>
            <span className={`badge badge-${entry.type}`}>{entry.type}</span>
            <h3>{entry.title}</h3>
            <p>{entry.description}</p>
            {entry.link && (
              <a href={entry.link} onClick={() => markSeen(entry.id)}>
                Learn more
              </a>
            )}
          </li>
        ))}
      </ul>
      <footer>
        <span>{unseen.length} update{unseen.length !== 1 ? 's' : ''}</span>
        <button onClick={handleClose}>Got it</button>
      </footer>
    </dialog>
  )
}
```

This uses the native HTML `<dialog>` element, which gives you focus trapping and ESC-key dismissal for free. As of April 2026, `<dialog>` has 97%+ global browser support, saving you from pulling in react-modal (188KB per [Bundlephobia](https://bundlephobia.com/package/react-modal)) or building a focus trap from scratch. The W3C ARIA Authoring Practices Guide specifies that modals must use `aria-modal="true"`, trap focus inside the dialog, and return focus to the trigger element on close ([W3C APG](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)). The `<dialog>` element handles the first two; the `triggerRef` pattern handles the third.

## Step 4: add a manual trigger button

Users who dismiss the automatic modal still need a way to revisit the changelog on demand. A "What's New" button in your navigation with an unseen-count badge solves this. The `useAnnouncements` hook exposes `unseenCount` directly, so the badge updates reactively as entries get marked seen without any extra state management on your side.

```tsx
// src/components/WhatsNewButton.tsx
'use client'

import { useAnnouncements } from '@tour-kit/announcements'

export function WhatsNewButton() {
  const { active, unseenCount } = useAnnouncements()

  return (
    <button
      aria-label={`What's new. ${unseenCount} unread updates.`}
      onClick={() => {
        const dialog = document.querySelector('.changelog-modal')
        dialog?.showModal()
      }}
    >
      What's new
      {unseenCount > 0 && (
        <span className="badge" aria-hidden="true">
          {unseenCount}
        </span>
      )}
    </button>
  )
}
```

The `unseenCount` property comes directly from the `useAnnouncements` hook. It recalculates whenever entries are marked as seen. The `aria-label` includes the count so screen reader users hear "What's new. 3 unread updates" rather than just the button text plus a decorative badge.

## Step 5: wire in analytics

Tracking which changelog entries users view, dismiss, or click through is the difference between guessing what landed and measuring 7-day feature adoption rate. Tour Kit's announcements accept `onView`, `onDismiss`, and `onAction` callbacks that fire at the correct lifecycle moment so you're measuring real behavior, not just modal impressions.

```tsx
// src/providers/changelog-provider.tsx (updated)
const announcements: AnnouncementConfig[] = changelog.map((entry) => ({
  id: entry.id,
  content: entry,
  displayType: 'modal',
  frequency: 'once',
  priority: entry.type === 'feature' ? 10 : 5,
  onView: () => {
    analytics.track('changelog_entry_viewed', {
      entryId: entry.id,
      version: entry.version,
      type: entry.type,
    })
  },
  onDismiss: () => {
    analytics.track('changelog_dismissed', {
      entryId: entry.id,
      unseenRemaining: changelog.length,
    })
  },
  onAction: () => {
    analytics.track('changelog_link_clicked', {
      entryId: entry.id,
      destination: entry.link,
    })
  },
}))
```

Replace `analytics.track` with whatever you use: Segment, PostHog, Plausible, or a custom fetch call.

## Why not just build it from scratch?

You could build a basic What's New modal in React with `useState`, `useEffect`, and `localStorage.getItem` in about 30 lines. But the remaining 80% of production requirements is where homegrown solutions accumulate tech debt: frequency rules, per-entry seen tracking, SSR hydration guards, focus management, and analytics instrumentation.

| Requirement | DIY approach | Tour Kit approach |
|---|---|---|
| Seen/unseen tracking per entry | Custom localStorage logic, manual JSON parsing | Built-in, keyed by entry ID |
| Frequency control (once, N times, interval) | Build a scheduler with timestamp math | 5 presets + custom intervals |
| Focus trapping and ARIA | aria-modal, focus-trap-react, return focus | Native dialog + ARIA attributes |
| SSR hydration safety | hasMounted guard in useEffect | Handled internally by the provider |
| Analytics hooks | Custom event wiring per entry | onView, onDismiss, onAction callbacks |
| Multiple display variants | Build separate components for each | Switch displayType: modal, toast, banner, slideout, spotlight |
| Bundle cost | 0KB (your code) to 188KB (react-modal) | ~4KB gzipped |

Tour Kit is a headless library, so you write all the JSX. It gives you the state management and lifecycle hooks. That said, Tour Kit requires React 18+ and doesn't have a visual builder. If your team needs drag-and-drop changelog editing, a SaaS tool like LaunchNotes or Featurebase might be a better fit.

## Common issues and troubleshooting

### "Modal opens but entries show as empty"

This happens when the `content` field in `AnnouncementConfig` doesn't match the shape your component expects. The `useAnnouncements` hook returns `active` as an array of `AnnouncementConfig` objects. Access the changelog data through `a.content`, not directly on the announcement object. TypeScript will catch this if you type the cast: `a.content as ChangelogEntry`.

### "Modal keeps reappearing after dismissal"

Check that your entry IDs are stable across renders. If you're generating IDs dynamically (like `crypto.randomUUID()`), every render creates "new" entries that haven't been seen. Use deterministic IDs tied to your release version: `v2-4-0-dark-mode`, not a random string.

### "Hydration mismatch in Next.js"

The `AnnouncementsProvider` reads localStorage on mount, which doesn't exist during server-side rendering. If you're using Next.js App Router, make sure the file containing `ChangelogProvider` has `'use client'` at the top. Tour Kit's provider handles the mount check internally, but the component tree above it must be a Client Component.

### "Focus doesn't return to trigger after closing"

The native `<dialog>` element doesn't automatically return focus to the element that triggered it. That's why the `WhatsNewModal` component stores `document.activeElement` in a ref before calling `showModal()`, then calls `triggerRef.current?.focus()` on close. If focus still isn't returning, verify that the trigger element is focusable (buttons are by default; divs are not).

## Next steps

You have a working changelog modal. Here are three ways to extend it:

1. **Add rich media** with `@tour-kit/media` to embed Loom walkthroughs or GIFs inside changelog entries, since interactive demos cut announcement-to-adoption time by 50% ([Arcade, 2026](https://www.arcade.software/post/feature-announcement-examples)).

2. **Schedule entries** with `@tour-kit/scheduling` to show changelog modals only during business hours or delay them for users who signed up less than 24 hours ago.

3. **Track adoption** by combining `@tour-kit/adoption` with your changelog entries to stop showing an update once the user has actually used the feature, not just seen the announcement.

For a modal UX decision framework covering when to use modals versus separate pages, Smashing Magazine published a thorough guide in March 2026: [Modal vs. separate page UX decision tree](https://www.smashingmagazine.com/2026/03/modal-separate-page-ux-decision-tree/).

## FAQ

### What is a "What's New" modal in React?

A "What's New" modal in React is a dialog component that shows users recent product updates and feature releases inside the app. Tour Kit's `@tour-kit/announcements` package provides state management, localStorage persistence, and display logic for building changelog modals with TypeScript support and WCAG 2.1 AA compliance.

### Does a changelog modal hurt page performance?

Not meaningfully. Tour Kit's announcements package adds roughly 4KB gzipped. For comparison, react-modal ships at 188KB (as of April 2026 per [Bundlephobia](https://bundlephobia.com/package/react-modal)). The native `<dialog>` element adds zero JavaScript. Code-split with `React.lazy()` to defer loading until unseen entries exist.

### How is Tour Kit different from changelog SaaS tools?

SaaS changelog tools like LaunchNotes and Featurebase provide hosted changelog pages, widget embeds, and admin dashboards. Tour Kit is a React library that gives you headless components and hooks. You own the data, write your own UI, and pay nothing for the MIT-licensed packages. The tradeoff: no visual editor and no hosted page. Tour Kit is built for teams that want in-app announcements matching their design system exactly.

### Can I use this with Next.js App Router?

Yes. Wrap the `ChangelogProvider` in a Client Component (add `'use client'` at the top of the file). The provider handles the localStorage hydration guard internally, so you won't hit the server/client mismatch that breaks most localStorage-based React patterns in SSR. Tour Kit supports both React 18 and React 19.

### How do I track which changelog entries users actually read?

Pass `onView`, `onDismiss`, and `onAction` callbacks to each `AnnouncementConfig` object. Tour Kit fires `onView` when the entry renders in the modal, `onDismiss` when the user closes without clicking through, and `onAction` when they click a link. Pipe these to your analytics provider (Segment, PostHog, Plausible) to measure feature adoption rate, not just impressions.

# Product Announcements Landing Page

**URL:** `/announcements`
**Goal:** Convert teams needing in-app messaging (changelog, feature launches, banners).
**SEO Target:** "react in-app announcements", "product announcement component", "in-app messaging react"
**Audience:** Product teams who need to communicate with users inside the app.

---

## Section 1: Hero

```
+------------------------------------------------------------------------+
|  [Logo]  Docs   Pricing   GitHub   Discord        [Get Started ->]     |
+------------------------------------------------------------------------+
|                                                                        |
|              Announce features where users                             |
|              actually see them.                                        |
|                                                                        |
|         In-app modals, toasts, banners, slideouts, and                |
|         spotlights. Priority queues. Frequency rules.                 |
|         No third-party dashboard needed.                              |
|                                                                        |
|         [Get Started]              [See Variants]                      |
|                                                                        |
|   +----------------------------------------------------------------+  |
|   |                                                                |  |
|   |   +--App UI----------------------------------------------+    |  |
|   |   |                                                      |    |  |
|   |   |  +--- New! Dark mode is here ----[x]---+             |    |  |
|   |   |  |                                      |             |    |  |
|   |   |  |  We heard you! Dark mode is now      |             |    |  |
|   |   |  |  available for all users.             |             |    |  |
|   |   |  |                                      |             |    |  |
|   |   |  |  [Try it now]    [Maybe later]       |             |    |  |
|   |   |  +--------------------------------------+             |    |  |
|   |   |                                                      |    |  |
|   |   +------------------------------------------------------+    |  |
|   |                                                                |  |
|   +----------------------------------------------------------------+  |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 2: 5 Display Variants

**Purpose:** Show the full range of announcement types.

```
+------------------------------------------------------------------------+
|                                                                        |
|              5 ways to reach your users.                              |
|                                                                        |
|   [Modal]  [Toast]  [Banner]  [Slideout]  [Spotlight]  <- tabs        |
|                                                                        |
|   MODAL                                                               |
|   +----------------------------------+                                |
|   |  ::::::::::::::::::::::::::::    |  Best for: Major features,    |
|   |  ::  +------------------+  ::    |  breaking changes, important  |
|   |  ::  |  New Feature!    |  ::    |  updates that need attention. |
|   |  ::  |                  |  ::    |                               |
|   |  ::  |  Description...  |  ::    |  Blocks interaction until     |
|   |  ::  |                  |  ::    |  dismissed. Supports images,  |
|   |  ::  |  [CTA] [Dismiss] |  ::    |  video, and rich content.    |
|   |  ::  +------------------+  ::    |                               |
|   |  ::::::::::::::::::::::::::::    |                               |
|   +----------------------------------+                                |
|                                                                        |
|   TOAST                                                               |
|   +----------------------------------+                                |
|   |                                  |  Best for: Quick updates,     |
|   |  App content here...             |  confirmations, non-critical  |
|   |                                  |  announcements.               |
|   |            +------------------+  |                               |
|   |            | New: Export CSV  |  |  Auto-dismisses after         |
|   |            | now available!   |  |  configurable duration.       |
|   |            +------------------+  |  Stackable.                   |
|   +----------------------------------+                                |
|                                                                        |
|   BANNER                                                              |
|   +----------------------------------+                                |
|   |  [!] Maintenance window: March   |  Best for: System-wide        |
|   |  28, 2-4am UTC  [Details] [x]    |  notices, promotions,         |
|   |  --------------------------------|  maintenance alerts.          |
|   |                                  |                               |
|   |  App content continues below...  |  Persistent until dismissed.  |
|   |                                  |  Top or bottom positioned.    |
|   +----------------------------------+                                |
|                                                                        |
|   SLIDEOUT                                                            |
|   +----------------------------------+                                |
|   |                        +--------+|  Best for: Detailed           |
|   |  App content           | What's ||  changelogs, multi-item       |
|   |  stays visible         | New    ||  updates, release notes.      |
|   |                        |        ||                               |
|   |                        | - Feat ||  Slides in from edge.         |
|   |                        | - Fix  ||  Doesn't block the app.       |
|   |                        | - Impr ||                               |
|   |                        +--------+|                               |
|   +----------------------------------+                                |
|                                                                        |
|   SPOTLIGHT                                                           |
|   +----------------------------------+                                |
|   |  ::::::::::::::::::::::::::::    |  Best for: Drawing attention  |
|   |  ::                        ::    |  to a specific new UI         |
|   |  ::   [New Button!]        ::    |  element or feature.          |
|   |  ::        |               ::    |                               |
|   |  ::   +----v-----------+   ::    |  Combines overlay dimming     |
|   |  ::   | This button is |   ::    |  with targeted tooltip.       |
|   |  ::   | brand new!     |   ::    |                               |
|   |  ::   +----------------+   ::    |                               |
|   |  ::::::::::::::::::::::::::::    |                               |
|   +----------------------------------+                                |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 3: Priority Queue & Frequency Rules

```
+------------------------------------------------------------------------+
|                                                                        |
|              Smart delivery. Not notification spam.                    |
|                                                                        |
|   +----------------------------------+  +---------------------------+ |
|   |  PRIORITY QUEUE                  |  |                           | |
|   |                                  |  |  Multiple announcements?  | |
|   |  Queue:                          |  |  Tour Kit queues them     | |
|   |  #1 [!!!] Security update        |  |  by priority. Users see   | |
|   |  #2 [!! ] New feature            |  |  one at a time, most      | |
|   |  #3 [!  ] Minor improvement      |  |  important first.         | |
|   |                                  |  |                           | |
|   |  User sees #1 first,            |  |  priority: 'critical'     | |
|   |  then #2 on next visit,         |  |  | 'high' | 'medium'     | |
|   |  then #3 the day after.         |  |  | 'low'                  | |
|   |                                  |  |                           | |
|   +----------------------------------+  +---------------------------+ |
|                                                                        |
|   +----------------------------------+  +---------------------------+ |
|   |  FREQUENCY RULES                |  |                           | |
|   |                                  |  |  Control how often users  | |
|   |  "Show max 1 announcement       |  |  see announcements.       | |
|   |   per session"                   |  |  Prevent fatigue.         | |
|   |                                  |  |                           | |
|   |  Mon: [announcement]             |  |  frequency: {             | |
|   |  Tue: (nothing -- already seen)  |  |    maxPerSession: 1,     | |
|   |  Wed: [next announcement]        |  |    cooldown: '24h'       | |
|   |                                  |  |  }                       | |
|   +----------------------------------+  +---------------------------+ |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 4: Scheduling Integration

```
+------------------------------------------------------------------------+
|                                                                        |
|              Schedule announcements for the right moment.             |
|                                                                        |
|   +----------------------------------------------------------------+  |
|   |                                                                |  |
|   |  With @tour-kit/scheduling:                                    |  |
|   |                                                                |  |
|   |  schedule: {                                                   |  |
|   |    startDate: '2026-04-01',                                    |  |
|   |    endDate: '2026-04-15',                                      |  |
|   |    timezone: 'America/New_York',                               |  |
|   |    businessHours: { start: '09:00', end: '17:00' }            |  |
|   |  }                                                             |  |
|   |                                                                |  |
|   |  Timeline:                                                     |  |
|   |  Mar -----[============]---- Apr                               |  |
|   |           ^             ^                                      |  |
|   |           start         end                                    |  |
|   |           (9am ET)      (5pm ET)                               |  |
|   |                                                                |  |
|   +----------------------------------------------------------------+  |
|                                                                        |
|         Pair with @tour-kit/scheduling for time-based delivery.       |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 5: CTA

```
+------------------------------------------------------------------------+
|                                                                        |
|              Ship announcements your users will actually read.        |
|                                                                        |
|         $ pnpm add @tour-kit/announcements                 [copy]    |
|                                                                        |
|         [Read the Docs]            [View Examples]                    |
|                                                                        |
+------------------------------------------------------------------------+
```

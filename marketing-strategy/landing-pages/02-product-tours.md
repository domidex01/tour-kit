# Product Tours Landing Page

**URL:** `/product-tours`
**Goal:** Convert developers looking specifically for a tour/walkthrough solution.
**SEO Target:** "react product tour library", "guided tour react", "user onboarding tour"
**Audience:** Developers searching for tour libraries, evaluating options.

---

## Section 1: Hero

**Purpose:** Immediately address the search intent -- they want a product tour library.

```
+------------------------------------------------------------------------+
|  [Logo]  Docs   Pricing   GitHub   Discord        [Get Started ->]     |
+------------------------------------------------------------------------+
|                                                                        |
|              Product Tours That Don't Suck                             |
|                                                                        |
|         Step-by-step guided walkthroughs that match your               |
|         design system. Headless hooks or pre-styled components.        |
|         Your choice.                                                   |
|                                                                        |
|         [Get Started]              [Live Demo]                         |
|                                                                        |
|   +----------------------------------------------------------------+  |
|   |                                                                |  |
|   |   +---App-Chrome-Bar----------------------------[x]------+    |  |
|   |   |                                                      |    |  |
|   |   |   Dashboard          Settings         Profile        |    |  |
|   |   |                                                      |    |  |
|   |   |   +-------+   +--------------------------+           |    |  |
|   |   |   | Card  |   | Welcome to Dashboard!    |           |    |  |
|   |   |   |       |   |                          |           |    |  |
|   |   |   |       |   | This is where you'll     |           |    |  |
|   |   |   +-------+   | manage all your projects.|           |    |  |
|   |   |               |                          |           |    |  |
|   |   |   +-------+   | Step 1 of 4    [Next ->] |           |    |  |
|   |   |   | Card  |   +--------------------------+           |    |  |
|   |   |   +-------+                                          |    |  |
|   |   +------------------------------------------------------+    |  |
|   |                                                                |  |
|   +----------------------------------------------------------------+  |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 2: The Problem

**Purpose:** Articulate why existing tour solutions frustrate developers.

```
+------------------------------------------------------------------------+
|                                                                        |
|              You've been here before.                                  |
|                                                                        |
|   +-------------------------------+                                   |
|   |                               |                                   |
|   |   1. Install tour library     |  <-- check                       |
|   |   2. Follow the docs          |  <-- check                       |
|   |   3. Try to customize it      |  <-- X  "Why can't I change     |
|   |   4. Fight z-index issues     |        the arrow position?"      |
|   |   5. Realize it doesn't       |                                   |
|   |      work with your router    |  <-- X  "Page change kills      |
|   |   6. Give up and build        |        the entire tour"          |
|   |      from scratch             |                                   |
|   |                               |                                   |
|   +-------------------------------+                                   |
|                                                                        |
|         Tour Kit was built because we went through this too.          |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 3: Tour Features

**Purpose:** Showcase specific tour capabilities with visual examples.

```
+------------------------------------------------------------------------+
|                                                                        |
|              Everything a tour needs. Nothing it doesn't.             |
|                                                                        |
|   +----------------------------------+  +---------------------------+ |
|   |  SPOTLIGHT OVERLAY               |  |                           | |
|   |                                  |  |  Dim the background and   | |
|   |  +-------+                       |  |  highlight the target     | |
|   |  |///////|  <- highlighted       |  |  element. Customizable    | |
|   |  |/ btn /|     element           |  |  opacity, color, padding. | |
|   |  |///////|                       |  |                           | |
|   |  +-------+                       |  |  overlay={{ opacity: 0.7, | |
|   |  :::::::::::  <- dimmed bg       |  |    padding: 8 }}          | |
|   |                                  |  |                           | |
|   +----------------------------------+  +---------------------------+ |
|                                                                        |
|   +----------------------------------+  +---------------------------+ |
|   |  SMART POSITIONING              |  |                           | |
|   |                                  |  |  Tooltip auto-flips when  | |
|   |           +--------+            |  |  it hits viewport edges.  | |
|   |           | tooltip|            |  |  12 positions supported.  | |
|   |           +---v----+            |  |  Custom offsets. Arrow     | |
|   |            [button]              |  |  alignment.               | |
|   |                                  |  |                           | |
|   |  (flips to top if no room below)|  |  placement="bottom"       | |
|   |                                  |  |  fallback="top"           | |
|   +----------------------------------+  +---------------------------+ |
|                                                                        |
|   +----------------------------------+  +---------------------------+ |
|   |  KEYBOARD NAVIGATION            |  |                           | |
|   |                                  |  |  Full keyboard support.   | |
|   |  [Tab] -> focus tooltip          |  |  Arrow keys, Escape,     | |
|   |  [Enter] -> next step            |  |  Tab cycling. Focus       | |
|   |  [Esc] -> dismiss tour           |  |  trapping within the      | |
|   |  [<-][->] -> prev/next           |  |  tooltip. Screen reader   | |
|   |                                  |  |  live regions.            | |
|   +----------------------------------+  +---------------------------+ |
|                                                                        |
|   +----------------------------------+  +---------------------------+ |
|   |  MULTI-PAGE TOURS               |  |                           | |
|   |                                  |  |  Tours persist across     | |
|   |  /dashboard -> step 1,2          |  |  page navigations.        | |
|   |       |                          |  |  First-class adapters     | |
|   |       v                          |  |  for Next.js and React    | |
|   |  /settings  -> step 3,4          |  |  Router. State survives   | |
|   |       |                          |  |  route changes.           | |
|   |       v                          |  |                           | |
|   |  /profile   -> step 5            |  |  <NextAppRouterAdapter /> | |
|   |                                  |  |                           | |
|   +----------------------------------+  +---------------------------+ |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 4: Code Walkthrough

**Purpose:** Show the developer experience is actually simple.

```
+------------------------------------------------------------------------+
|                                                                        |
|              3 steps. That's it.                                      |
|                                                                        |
|   STEP 1: Install                                                     |
|   +----------------------------------------------------------------+  |
|   |  $ pnpm add @tour-kit/react                                   |  |
|   +----------------------------------------------------------------+  |
|                                                                        |
|   STEP 2: Define your steps                                           |
|   +----------------------------------------------------------------+  |
|   |  const steps = [                                               |  |
|   |    { target: '#inbox', title: 'Your Inbox',                    |  |
|   |      content: 'All messages land here.' },                     |  |
|   |    { target: '#compose', title: 'Compose',                     |  |
|   |      content: 'Write a new message.' },                        |  |
|   |  ]                                                             |  |
|   +----------------------------------------------------------------+  |
|                                                                        |
|   STEP 3: Render                                                      |
|   +----------------------------------------------------------------+  |
|   |  <Tour steps={steps}>                                          |  |
|   |    <TourStep />                                                |  |
|   |  </Tour>                                                       |  |
|   +----------------------------------------------------------------+  |
|                                                                        |
|         [Open in StackBlitz ->]                                       |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 5: Headless vs Pre-styled

**Purpose:** Show flexibility -- use pre-built or bring your own.

```
+------------------------------------------------------------------------+
|                                                                        |
|              Your UI, your rules.                                     |
|                                                                        |
|   [Pre-styled]              [Headless]           <- toggle             |
|                                                                        |
|   PRE-STYLED                        HEADLESS                          |
|   +---------------------------+     +---------------------------+     |
|   | import { TourCard }       |     | import { useTour }        |     |
|   | from '@tour-kit/react'    |     | from '@tour-kit/core'     |     |
|   |                           |     |                           |     |
|   | <TourCard                 |     | const { current, next } = |     |
|   |   title="Welcome"        |     |   useTour({ steps })      |     |
|   |   description="..."      |     |                           |     |
|   |   variant="default"      |     | <MyCustomTooltip           |     |
|   | />                        |     |   step={current}          |     |
|   |                           |     |   onNext={next}           |     |
|   | Looks great out of the   |     | />                        |     |
|   | box. Customizable via    |     |                           |     |
|   | CSS variables.           |     | Full control. Zero        |     |
|   +---------------------------+     | opinions about styling.   |     |
|                                     +---------------------------+     |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 6: Router Adapters

**Purpose:** Address the #1 pain point -- tours breaking on navigation.

```
+------------------------------------------------------------------------+
|                                                                        |
|              Works with your router. Not against it.                  |
|                                                                        |
|   +----------------+  +----------------+  +----------------+          |
|   |                |  |                |  |                |          |
|   |   Next.js      |  |   React        |  |   Vite /       |          |
|   |   App Router   |  |   Router       |  |   Custom       |          |
|   |                |  |                |  |                |          |
|   |   First-class  |  |   v6 & v7      |  |   Generic      |          |
|   |   adapter      |  |   supported    |  |   adapter API  |          |
|   |                |  |                |  |                |          |
|   +----------------+  +----------------+  +----------------+          |
|                                                                        |
|   +----------------------------------------------------------------+  |
|   |  <TourProvider                                                 |  |
|   |    routerAdapter={nextAppRouterAdapter}                        |  |
|   |  >                                                             |  |
|   |    {children}                                                  |  |
|   |  </TourProvider>                                               |  |
|   +----------------------------------------------------------------+  |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 7: CTA

```
+------------------------------------------------------------------------+
|                                                                        |
|              Build your first tour in 5 minutes.                      |
|                                                                        |
|         $ pnpm add @tour-kit/react                         [copy]    |
|                                                                        |
|         [Read the Docs]            [View Examples]                    |
|                                                                        |
+------------------------------------------------------------------------+
```

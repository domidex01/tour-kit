# Homepage

**URL:** `/`
**Goal:** Convert developers into users. Communicate what Tour Kit is, why it's different, and get them to `pnpm add @tour-kit/react`.
**Audience:** React developers evaluating onboarding/tour libraries.

---

## Section 1: Hero

**Purpose:** Instant clarity on what Tour Kit is + credibility signals.

```
+------------------------------------------------------------------------+
|  [Logo]  Docs   Pricing   GitHub   Discord        [Get Started ->]     |
+------------------------------------------------------------------------+
|                                                                        |
|                        Now in Beta  v0.4                               |
|                                                                        |
|              Guide users through your app.                             |
|              Headless. Composable. Accessible.                         |
|                                                                        |
|         Headless hooks and composable components for product           |
|         tours, onboarding flows, and contextual hints.                 |
|         Built for React. Works with shadcn/ui.                         |
|                                                                        |
|         [Get Started]              [View on GitHub]                    |
|                                                                        |
|         $ pnpm add @tour-kit/react                          [copy]    |
|                                                                        |
|   +----------+  +----------+  +----------+  +----------+              |
|   | < 8 KB   |  | WCAG AA  |  |   100%   |  |  Tree-   |              |
|   | gzipped  |  | Compliant|  | TypeScript|  | Shakeable|              |
|   +----------+  +----------+  +----------+  +----------+              |
|                                                                        |
+------------------------------------------------------------------------+
```

**Copy Notes:**
- Badge: "Now in Beta v0.4" (real version, not aspirational)
- Metrics must be verifiable (bundle size from bundlephobia, a11y from tests)
- No fabricated stats (see memory #156)

---

## Section 2: Live Demo

**Purpose:** Let visitors experience a tour without leaving the page.

```
+------------------------------------------------------------------------+
|                                                                        |
|                     See it in action                                   |
|                                                                        |
|   +----------------------------------------------------------------+  |
|   |                                                                |  |
|   |   +---------------------------+                                |  |
|   |   |  Fake App UI              |                                |  |
|   |   |                           |                                |  |
|   |   |   [Button] <-- Tooltip ---|--- "Click here to             |  |
|   |   |                |          |     create your first          |  |
|   |   |                |          |     project"                   |  |
|   |   |                |          |                                |  |
|   |   |   Spotlight    |          |     Step 1 of 3               |  |
|   |   |   overlay dims |          |     [Next ->]                 |  |
|   |   |   background   |          |                                |  |
|   |   |                           |                                |  |
|   |   +---------------------------+                                |  |
|   |                                                                |  |
|   +----------------------------------------------------------------+  |
|                                                                        |
|   [Try the demo]                    Built with 12 lines of code       |
|                                                                        |
+------------------------------------------------------------------------+
```

**Copy Notes:**
- Interactive, not a video
- Show the code alongside the demo (split view on desktop)
- Emphasize minimal code required

---

## Section 3: Problem / Pain Points

**Purpose:** Resonate with developer frustrations. Make them feel understood.

```
+------------------------------------------------------------------------+
|                                                                        |
|              Building onboarding shouldn't be this hard.               |
|                                                                        |
|   +----------------------------+  +----------------------------+      |
|   |  "Fought with z-index      |  |  "Our tour library added   |      |
|   |   for 3 days just to get   |  |   47KB to our bundle and   |      |
|   |   a tooltip to show above  |  |   we couldn't customize    |      |
|   |   a modal."                |  |   anything."               |      |
|   |                            |  |                            |      |
|   |   -- Every React dev ever  |  |   -- Bundle-conscious dev  |      |
|   +----------------------------+  +----------------------------+      |
|                                                                        |
|   +----------------------------+  +----------------------------+      |
|   |  "The no-code tool costs   |  |  "We had to rebuild our    |      |
|   |   $300/mo and still can't  |  |   entire onboarding when   |      |
|   |   match our design system."|  |   we switched routers."    |      |
|   |                            |  |                            |      |
|   |   -- Startup founder       |  |   -- Migration survivor    |      |
|   +----------------------------+  +----------------------------+      |
|                                                                        |
+------------------------------------------------------------------------+
```

**Copy Notes:**
- Use real developer pain points (z-index hell, bundle bloat, vendor lock-in, customization limits)
- Quotes should feel authentic, not polished marketing speak
- These are composites, not attributed to real people (no fake testimonials)

---

## Section 4: Solution - Key Features

**Purpose:** Show how Tour Kit solves each pain point.

```
+------------------------------------------------------------------------+
|                                                                        |
|                     Built different.                                   |
|                                                                        |
|   +----------------------------------+                                |
|   |  [icon]  Headless First          |                                |
|   |                                  |                                |
|   |  Your components. Your styles.   |                                |
|   |  Tour Kit provides the logic,    |                                |
|   |  you bring the UI. Works with    |                                |
|   |  shadcn/ui, Radix, or plain CSS. |                                |
|   |                                  |                                |
|   |  // code snippet                 |                                |
|   |  const { steps, current } =      |                                |
|   |    useTour({ steps: [...] })     |                                |
|   +----------------------------------+                                |
|                                                                        |
|   +----------------------------------+                                |
|   |  [icon]  Accessible by Default   |                                |
|   |                                  |                                |
|   |  WCAG 2.1 AA. Focus trapping.   |                                |
|   |  Keyboard navigation. Screen     |                                |
|   |  reader announcements. Not an    |                                |
|   |  afterthought -- it's the        |                                |
|   |  foundation.                     |                                |
|   +----------------------------------+                                |
|                                                                        |
|   +----------------------------------+                                |
|   |  [icon]  Tiny & Tree-Shakeable   |      +------------------+     |
|   |                                  |      | Bundle Comparison |     |
|   |  Core: < 8KB gzipped.           |      |                  |     |
|   |  Import only what you use.       |      | Tour Kit   8KB  |##   |
|   |  No runtime CSS. No bloat.       |      | Intro.js  29KB  |#### |
|   |                                  |      | Shepherd  41KB  |#####|
|   +----------------------------------+      | Reactour  15KB  |###  |
|                                              +------------------+     |
|                                                                        |
|   +----------------------------------+                                |
|   |  [icon]  Framework Ready         |                                |
|   |                                  |                                |
|   |  Next.js App Router, Pages       |                                |
|   |  Router, React Router, Vite --   |                                |
|   |  first-class adapters for all.   |                                |
|   +----------------------------------+                                |
|                                                                        |
+------------------------------------------------------------------------+
```

**Copy Notes:**
- Each feature card maps to a pain point from Section 3
- Include real code snippets where possible
- Bundle comparison must use real numbers from bundlephobia

---

## Section 5: Package Ecosystem

**Purpose:** Show the breadth of the platform beyond basic tours.

```
+------------------------------------------------------------------------+
|                                                                        |
|              One library. Everything you need.                         |
|                                                                        |
|   +------------------+  +------------------+  +------------------+    |
|   |   @tour-kit/     |  |   @tour-kit/     |  |   @tour-kit/     |    |
|   |   core           |  |   react          |  |   hints          |    |
|   |                  |  |                  |  |                  |    |
|   |  Headless hooks  |  |  Pre-styled      |  |  Pulsing beacons |    |
|   |  Position engine |  |  components      |  |  Contextual tips |    |
|   |  Focus mgmt      |  |  Router adapters |  |  Dismissal       |    |
|   |                  |  |                  |  |  tracking        |    |
|   |  < 8KB           |  |  < 12KB          |  |  < 5KB           |    |
|   +------------------+  +------------------+  +------------------+    |
|                                                                        |
|   +------------------+  +------------------+  +------------------+    |
|   |   @tour-kit/     |  |   @tour-kit/     |  |   @tour-kit/     |    |
|   |   announcements  |  |   checklists     |  |   analytics      |    |
|   |                  |  |                  |  |                  |    |
|   |  Modals, toasts  |  |  Task deps       |  |  PostHog         |    |
|   |  Banners, slides |  |  Progress bars   |  |  Mixpanel        |    |
|   |  Priority queue  |  |  Auto-complete   |  |  Amplitude       |    |
|   +------------------+  +------------------+  +------------------+    |
|                                                                        |
|   +------------------+  +------------------+  +------------------+    |
|   |   @tour-kit/     |  |   @tour-kit/     |  |                  |    |
|   |   adoption       |  |   media          |  |   More coming    |    |
|   |                  |  |                  |  |   soon...        |    |
|   |  Usage tracking  |  |  YouTube, Vimeo  |  |                  |    |
|   |  Nudge system    |  |  Loom, Lottie    |  |  [View Roadmap]  |    |
|   |  Adoption score  |  |  GIF embeds      |  |                  |    |
|   +------------------+  +------------------+  +------------------+    |
|                                                                        |
|              Import only what you use. Tree-shake the rest.           |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 6: Code Example

**Purpose:** Show developers how simple the API is.

```
+------------------------------------------------------------------------+
|                                                                        |
|              Ship your first tour in 5 minutes.                       |
|                                                                        |
|   [Basic Tour]  [With Hints]  [Checklist]  [Headless]    <- tabs      |
|                                                                        |
|   +----------------------------------------------------------------+  |
|   |  import { Tour, TourStep } from '@tour-kit/react'              |  |
|   |                                                                |  |
|   |  function App() {                                              |  |
|   |    return (                                                    |  |
|   |      <Tour>                                                    |  |
|   |        <TourStep                                               |  |
|   |          target="#welcome-btn"                                  |  |
|   |          title="Welcome!"                                      |  |
|   |          description="Let's show you around."                  |  |
|   |        />                                                      |  |
|   |        <TourStep                                               |  |
|   |          target="#create-btn"                                   |  |
|   |          title="Create a project"                              |  |
|   |          description="Click here to get started."              |  |
|   |        />                                                      |  |
|   |      </Tour>                                                   |  |
|   |    )                                                           |  |
|   |  }                                                             |  |
|   +----------------------------------------------------------------+  |
|                                                                        |
|   [Copy Code]                          [Open in StackBlitz ->]        |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 7: Social Proof

**Purpose:** Build credibility without fabricating metrics.

```
+------------------------------------------------------------------------+
|                                                                        |
|              Trusted by developers who care about UX.                 |
|                                                                        |
|   +----------------------------------------------------------------+  |
|   |                                                                |  |
|   |  [GitHub stars badge]  [npm downloads badge]  [MIT badge]      |  |
|   |                                                                |  |
|   +----------------------------------------------------------------+  |
|                                                                        |
|   "Tour Kit replaced our $300/mo SaaS tool with 200 lines of code."  |
|   -- @developer (link to tweet/post)                                  |
|                                                                        |
|   "Finally a tour library that doesn't fight my design system."       |
|   -- @developer (link to tweet/post)                                  |
|                                                                        |
|   +------------------+  +------------------+  +------------------+    |
|   |  [Company Logo]  |  |  [Company Logo]  |  |  [Company Logo]  |    |
|   +------------------+  +------------------+  +------------------+    |
|                                                                        |
+------------------------------------------------------------------------+
```

**Copy Notes:**
- Only use REAL testimonials from actual users
- If no testimonials yet, use GitHub activity metrics (stars, forks, contributors)
- Company logos only with permission
- Do NOT fabricate quotes or metrics (see memory #156)

---

## Section 8: Comparison Table

**Purpose:** Position Tour Kit against alternatives clearly.

```
+------------------------------------------------------------------------+
|                                                                        |
|              How Tour Kit compares.                                    |
|                                                                        |
|   +------------------------------------------------------------------+|
|   |              | Tour Kit | Appcues  | Userflow | Intro.js        ||
|   |--------------|----------|----------|----------|-----------------|  |
|   | Pricing      | Free/OSS | $249/mo  | $200/mo  | Free/$9.99      |  |
|   | Bundle size  | < 8KB    | N/A(SaaS)| N/A(SaaS)| 29KB            |  |
|   | Headless     |    Y     |    N     |    N     |    N            |  |
|   | TypeScript   |    Y     | Partial  | Partial  |    N            |  |
|   | WCAG AA      |    Y     | Partial  | Partial  |    N            |  |
|   | Customizable |  Full    | Limited  | Limited  | CSS only        |  |
|   | Self-hosted  |    Y     |    N     |    N     |    Y            |  |
|   | Open Source  |    Y     |    N     |    N     |    Y            |  |
|   +------------------------------------------------------------------+|
|                                                                        |
|   [See full comparison ->]                                            |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 9: Final CTA

**Purpose:** Strong closing conversion.

```
+------------------------------------------------------------------------+
|                                                                        |
|              Ready to build better onboarding?                        |
|                                                                        |
|         Stop fighting your tour library.                              |
|         Start building experiences users love.                        |
|                                                                        |
|         $ pnpm add @tour-kit/react                         [copy]    |
|                                                                        |
|         [Get Started]              [Star on GitHub]                   |
|                                                                        |
+------------------------------------------------------------------------+

+------------------------------------------------------------------------+
|  FOOTER                                                                |
|                                                                        |
|  Tour Kit              Packages          Resources        Community   |
|  Headless onboarding   @tour-kit/core    Documentation    GitHub      |
|  for React.            @tour-kit/react   API Reference    Discord     |
|                        @tour-kit/hints   Examples         Twitter     |
|  MIT License           @tour-kit/...     Changelog        Blog        |
|                                                                        |
|  [Newsletter signup: email input] [Subscribe]                         |
|                                                                        |
|  (c) 2026 Tour Kit. Built with care.                                  |
+------------------------------------------------------------------------+
```

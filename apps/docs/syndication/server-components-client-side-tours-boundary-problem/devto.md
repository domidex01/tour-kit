---
title: "React Server Components broke my product tour (here's how I fixed it)"
published: false
description: "45% of new React projects use Server Components, but most tour libraries haven't adapted. Here's the architectural pattern that keeps tours working without bloating your client bundle."
tags: react, javascript, webdev, typescript
canonical_url: https://usertourkit.com/blog/server-components-client-side-tours-boundary-problem
cover_image: https://usertourkit.com/og-images/server-components-client-side-tours-boundary-problem.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/server-components-client-side-tours-boundary-problem)*

# Server components and client-side tours: the boundary problem

React Server Components changed where code runs. Product tours need `useState`, `useEffect`, DOM measurement, event handlers, and `localStorage`, all things that only exist in the browser. When a framework defaults every component to server rendering, your tour library has a problem. As of April 2026, 45% of new React projects use Server Components ([Strapi / State of React 2025](https://strapi.io/blog/state-of-react-2025-key-takeaways)), and most tour libraries haven't adapted.

```bash
npm install @tourkit/core @tourkit/react
```

This article explains the architectural constraint, shows how naive implementations accidentally bloat your client bundle, and walks through patterns that keep tours working without sacrificing what RSC gives you.

## What is the boundary problem for product tours?

The boundary problem is the architectural conflict between React Server Components, which render on the server with zero client JavaScript, and product tour libraries, which require browser APIs for positioning overlays, tracking state, and responding to user interaction. Every tour provider, tooltip, and highlight component must be a Client Component. The real question isn't whether tours can work with RSC (they can). It's how much of your app you accidentally pull into the client bundle when you add them.

As Josh Comeau [explains](https://www.joshwcomeau.com/react/server-components/): "This is brain-bending stuff. Even after years of React experience, I still find this very confusing."

## Why this matters more than you think

The `'use client'` directive doesn't just mark one file as client-side. It defines a boundary on the **module dependency graph**. Any module imported into that file also becomes a Client Component. Import your design system's Button inside the tour provider? That Button and everything it imports now ships to the client too.

[Smashing Magazine's RSC forensics article](https://www.smashingmagazine.com/2024/05/forensics-react-server-components/) puts it directly: "Client Components can only explicitly import other Client Components... we're unable to import a Server Component into a Client Component because of re-rendering issues."

For tour libraries, this creates a specific danger. Most libraries tell you to wrap your entire application in a provider:

```tsx
// app/layout.tsx — the naive approach
import { TourProvider } from 'some-tour-library';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <TourProvider>{children}</TourProvider>
      </body>
    </html>
  );
}
```

If that provider lives in a file with `'use client'`, and it imports utility functions, animation libraries, or UI components, all of that code ends up in the client bundle.

## How 'use client' actually works

The misconception we see most often: developers assume `'use client'` turns the entire subtree into Client Components. It doesn't. The directive applies to the **module graph**, not the render tree.

A Server Component can be a child of a Client Component, but only when passed as `children` or another prop. You can't `import` a Server Component file from within a `'use client'` file.

```tsx
// components/tour-provider.tsx
'use client';

import { TourProvider as Provider } from '@tourkit/react';

export function AppTourProvider({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}
```

```tsx
// app/layout.tsx — this is a Server Component
import { AppTourProvider } from '@/components/tour-provider';
import { Sidebar } from '@/components/sidebar'; // Server Component

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <AppTourProvider>
          <Sidebar />
          <main>{children}</main>
        </AppTourProvider>
      </body>
    </html>
  );
}
```

The `Sidebar` here stays server-rendered. It contributes 0 KB to your client bundle even though its parent is a Client Component.

## The serialization constraint

Props flowing from Server Components to Client Components must be JSON-serializable. The React Flight protocol can send strings, numbers, objects, arrays, and JSX. It cannot send functions.

This creates a natural split for tour architecture:

| Tour concern | Where it belongs | Why |
|---|---|---|
| Step definitions (text, target selectors) | Server | Plain objects, fully serializable |
| Step sequencing and current step state | Client | Requires `useState` |
| Overlay positioning and highlighting | Client | Requires DOM measurement |
| Completion callbacks (`onStepComplete`) | Client | Functions can't cross the boundary |
| Progress persistence | Client | Requires `localStorage` or cookies |
| Tour trigger conditions (user role, feature flags) | Server (partial) | User data available server-side via session |

The pattern: define your tour configuration as data on the server, pass it through the boundary as props, and handle all interactivity in a thin client wrapper.

```tsx
// app/dashboard/page.tsx — Server Component
import { TourSteps } from './tour-steps';

const dashboardSteps = [
  { id: 'welcome', target: '[data-tour="sidebar"]', title: 'Navigation', content: 'Your main menu lives here.' },
  { id: 'search', target: '[data-tour="search"]', title: 'Search', content: 'Find anything in your workspace.' },
  { id: 'settings', target: '[data-tour="settings"]', title: 'Settings', content: 'Customize your experience.' },
];

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <TourSteps steps={dashboardSteps} tourId="dashboard-intro" />
    </div>
  );
}
```

```tsx
// app/dashboard/tour-steps.tsx
'use client';

import { useTour } from '@tourkit/react';
import type { TourStep } from '@tourkit/core';

export function TourSteps({ steps, tourId }: { steps: TourStep[]; tourId: string }) {
  const { currentStep, next, prev, isActive } = useTour({ tourId, steps });

  if (!isActive) return null;

  return (
    <div role="dialog" aria-label={`Tour step: ${currentStep?.title}`}>
      <h2>{currentStep?.title}</h2>
      <p>{currentStep?.content}</p>
      <button onClick={prev}>Back</button>
      <button onClick={next}>Next</button>
    </div>
  );
}
```

## The hydration trap

Tour libraries that conditionally render based on client-only state hit hydration mismatches. The server doesn't know whether the user completed the tour (that's in `localStorage`), so it can't predict the initial render.

The cleanest solution is to never render tour UI during SSR:

```tsx
'use client';

import { useState, useEffect } from 'react';

export function TourWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <>{children}</>;
}
```

Tour Kit handles this internally. The provider waits for mount before rendering overlays.

## How other libraries handle the boundary

We tested how five tour libraries behave in a Next.js 15 App Router project with React 19. None of them document RSC-specific patterns as of April 2026.

| Library | RSC-aware? | Provider strategy | Documented RSC guide | Client boundary surface |
|---|---|---|---|---|
| Tour Kit | Yes | Thin client provider, children slot | Yes | Minimal: provider + active step only |
| Onborda | Partial | Full app wrap + Framer Motion | No | Large: Framer Motion + provider |
| OnboardJS | Partial | OnboardingProvider (client) | Minimal | Medium: acknowledges 'use client' |
| React Joyride | No | Imperative, no provider | No | Entire library is client-only |
| Shepherd.js | No | Vanilla JS, no React awareness | No | Entire library is client-only |

React Joyride ships at ~37KB gzipped and lands entirely in the client bundle. Onborda requires Framer Motion (~32KB additional).

**Disclosure:** We built Tour Kit, so take this comparison with appropriate skepticism.

## The architectural pattern that works

**1. Isolate the client boundary.** Create a single `'use client'` file for the tour provider. Don't import anything you don't need inside it.

**2. Pass config as serializable props.** Define tour steps in Server Components. Pass them down. Functions stay on the client side.

**3. Use the children slot.** Your page content stays server-rendered.

**4. Defer render until mount.** Tour UI that depends on client state should gate on `useEffect`.

**5. Co-locate tour steps with pages.** Define steps in the Server Component page file where they're relevant.

## Bundle impact: RSC vs traditional SPA

| Metric | Traditional SPA (Vite) | Next.js App Router (RSC) | Difference |
|---|---|---|---|
| Tour Kit client JS | ~8KB gzipped | ~8KB gzipped | Same |
| Total page JS (with tour) | 100% baseline | 60-80% of baseline | 20-40% reduction from RSC |
| TTFB | Baseline | 3-5x faster | Server rendering eliminates round trips |
| Tour step config JS cost | Included in bundle | 0 KB (serialized via Flight) | Config stays off client bundle |

Adding Tour Kit costs the same ~8KB regardless of rendering strategy. But RSC lets you keep everything *around* the tour leaner.

## FAQ

### Can product tours work with React Server Components?

Tour Kit and other React tour libraries work with Server Components by isolating tour logic inside `'use client'` boundaries. The provider, overlays, and interactive elements must be Client Components. Server Components in the same app stay server-rendered and pass through as children.

### Why does 'use client' affect my tour library's bundle size?

The `'use client'` directive marks a module boundary, not just a single component. Every file imported by a `'use client'` module becomes client code too. Tour Kit keeps its provider under 8KB gzipped to limit the boundary's blast radius.

### How do I avoid hydration mismatches with product tours?

Wrap tour UI in a `useEffect` mount gate: render nothing on the server, then show the tour after mount. Tour Kit handles this internally.

### Should I define tour steps in Server Components or Client Components?

Define step configuration in Server Components and pass the data as props. Step definitions are serializable objects that transfer through the RSC wire format without inflating your client bundle. Callbacks must stay in Client Components.

### Will the boundary problem go away in future React versions?

The server-client boundary is a fundamental architectural decision in React. React's core team has confirmed that Server Components and Client Components will coexist. Building with clear boundaries now is the right long-term approach.

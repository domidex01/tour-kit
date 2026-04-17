---
title: "Replacing Pendo with code-owned React tours (step-by-step migration)"
published: false
description: "Pendo costs $40K-$80K/year and adds 54KB to every page. Here's how to export your guides and rebuild them as React components you own."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/migrate-pendo-to-react
cover_image: https://usertourkit.com/og-images/migrate-pendo-to-react.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/migrate-pendo-to-react)*

# How to export Pendo tours to a self-owned React solution

You're paying Pendo $40K-$80K a year for product tours. Your React app has grown. The guides take 54KB of third-party JavaScript on every page load, your SPA throws `pendo is undefined` errors after navigation, and your design team gave up trying to match your Tailwind tokens inside Pendo's theme editor.

This isn't a "Pendo is bad" article. Pendo does analytics, session replay, and NPS surveys across web and mobile. But if your primary use case is in-app guides and you have a React codebase, owning that code eliminates a six-figure annual dependency and gives you full control over rendering, accessibility, and data.

This guide walks you through exporting your Pendo guide configurations, rebuilding them as React components with Tour Kit, and removing the Pendo snippet. The process is incremental, so nothing breaks in production. Budget 3-5 hours for a typical setup with 5-10 guides.

**Bias disclosure:** We built Tour Kit. Every claim below is verifiable against npm, GitHub, and Pendo's own documentation.

```bash
npm install @tourkit/core @tourkit/react
```

## What you'll build

By the end of this tutorial, you'll have replaced Pendo's third-party guide system with React components you own and deploy from your codebase. Your Pendo tooltip walkthroughs become `<Tour>` components with typed steps, your badges become `<HintSpot>` components, and your segment targeting becomes standard React conditional logic.

## Why migrate away from Pendo guides?

Pendo serves over 10,000 companies and combines product analytics, session replay, and in-app guidance in a single platform. As of April 2026, mid-market customers pay $40K-$80K annually, with renewal increases of 5-20% unless capped by multi-year contracts ([Userorbit, 2026](https://userorbit.com/blog/pendo-pricing-guide)).

One former customer put it plainly: "High price was the decision criteria because we were paying lots and not using it."

Here are the specific technical pain points that push React teams toward a code-owned solution:

- **SPA routing friction.** Pendo uses `window.pendo.initialize` and DOM mutation observers. React's virtual DOM and client-side routing cause "page mismatch" errors where guides target elements that have already unmounted
- **54KB third-party script** on every page, loaded before your app code. Tour Kit's core is under 8KB gzipped and tree-shakes to only what you import
- **Design system conflicts.** Pendo's theme editor constrains you to their CSS variables. Teams using Tailwind or shadcn/ui end up overriding every tooltip to match design tokens
- **Accessibility gaps.** Pendo claims WCAG 2.2 AA alignment but admits they're "in the process" of full compliance
- **Data lock-in.** Full data export requires the Ultimate tier at $100K+/year

To be fair: Pendo's visual guide builder lets non-technical PMs create tours without deploying code. Tour Kit requires React developers. Migrate when your engineering team owns guide creation and the SaaS cost no longer makes sense.

## Step 1: Export your Pendo guide configurations

Pendo doesn't offer a one-click "export all guides" button. Pull guide data from their REST API:

```bash
# List all guides for your app
curl -X GET "https://app.pendo.io/api/v1/guide" \
  -H "x-pendo-integration-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  | jq '.[].name, .[].id, .[].state' > pendo-guides.txt
```

For each guide, pull the detailed configuration:

```bash
curl -X GET "https://app.pendo.io/api/v1/guide/GUIDE_ID" \
  -H "x-pendo-integration-key: YOUR_API_KEY" \
  | jq '{name, steps: [.steps[] | {content, elementPathRule, type}], \
         segment: .audienceUiHint}' > guide-detail.json
```

Key fields to capture:

- `elementPathRule`: the CSS selector (maps to Tour Kit's `target` prop)
- `content`: the HTML body (convert to JSX)
- `type`: tooltip, lightbox, or banner
- `audienceUiHint`: segment targeting rules (convert to React conditionals)

## Step 2: Install Tour Kit alongside Pendo

Don't rip out the Pendo snippet yet. Install Tour Kit and run both simultaneously:

```bash
npm install @tourkit/core @tourkit/react
```

```tsx
// src/app/layout.tsx (Next.js) or src/App.tsx (Vite)
import { TourKitProvider } from '@tourkit/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <TourKitProvider>
      {children}
    </TourKitProvider>
  );
}
```

## Step 3: Rebuild your first guide as a React component

Start with your simplest Pendo guide. Here's a dashboard walkthrough converted from Pendo's configuration:

```tsx
// src/tours/dashboard-tour.tsx
import { Tour, TourStep, TourCard, TourOverlay } from '@tourkit/react';
import { useTour } from '@tourkit/react';

const steps = [
  {
    id: 'welcome',
    target: '[data-pendo="dashboard-header"]',
    title: 'Welcome to your dashboard',
    content: 'This is where you track key metrics.',
  },
  {
    id: 'metrics',
    target: '[data-pendo="metrics-panel"]',
    title: 'Your metrics at a glance',
    content: 'Revenue, churn, and activation rates update in real time.',
  },
  {
    id: 'actions',
    target: '[data-pendo="quick-actions"]',
    title: 'Quick actions',
    content: 'Create segments, export reports, or invite teammates.',
  },
];

export function DashboardTour() {
  const { isActive } = useTour('dashboard-tour');

  return (
    <Tour tourId="dashboard-tour" steps={steps}>
      <TourOverlay />
      <TourStep>
        {({ step, next, prev, stop, currentIndex, totalSteps }) => (
          <TourCard>
            <TourCard.Header>
              <TourCard.Title>{step.title}</TourCard.Title>
              <TourCard.Close onClick={stop} />
            </TourCard.Header>
            <TourCard.Body>{step.content}</TourCard.Body>
            <TourCard.Footer>
              <TourCard.Progress current={currentIndex + 1} total={totalSteps} />
              <div className="flex gap-2">
                {currentIndex > 0 && (
                  <button onClick={prev}>Back</button>
                )}
                <button onClick={next}>
                  {currentIndex === totalSteps - 1 ? 'Done' : 'Next'}
                </button>
              </div>
            </TourCard.Footer>
          </TourCard>
        )}
      </TourStep>
    </Tour>
  );
}
```

## Step 4: Convert Pendo targeting rules to React logic

Pendo's segment targeting becomes standard React conditionals:

```tsx
import { useTour } from '@tourkit/react';
import { useUser } from '@/hooks/use-user';

export function OnboardingTour() {
  const { user } = useUser();
  const { start } = useTour('onboarding');

  // Pendo equivalent: segment = "signed up within 7 days"
  const isNewUser = user.createdAt > Date.now() - 7 * 24 * 60 * 60 * 1000;

  if (!isNewUser) return null;

  return (
    <button onClick={() => start()}>Start tour</button>
  );
}
```

## Step 5: Migrate Pendo badges to Tour Kit hints

```bash
npm install @tourkit/hints
```

```tsx
import { HintSpot, HintContent } from '@tourkit/hints';

export function NewExportHint() {
  return (
    <HintSpot target="[data-pendo='export-button']" pulse>
      <HintContent>
        <p className="text-sm">New: export reports as CSV or PDF.</p>
        <a href="/docs/exports" className="text-sm underline">Learn more</a>
      </HintContent>
    </HintSpot>
  );
}
```

## Step 6: Remove the Pendo snippet

After migrating and testing all guides for at least one sprint:

1. Set each migrated guide to "Draft" status in Pendo
2. Monitor for one release cycle
3. Remove the Pendo snippet from your layout
4. Uninstall Pendo npm packages and remove `window.pendo` references

## What you gain (and what you lose)

| Dimension | Pendo | Tour Kit |
|-----------|-------|----------|
| Annual cost (mid-market) | $40K-$80K | $0 (MIT) or $99 one-time Pro |
| Bundle impact | 54KB third-party script | <8KB core gzipped, tree-shakeable |
| Guide creation | Visual builder, no-code | React components, requires developers |
| Design system fit | Theme editor with constraints | Full headless, your CSS |
| React 19 support | Manual initialization, SPA workarounds | Native hooks, zero workarounds |
| Accessibility | "In process" WCAG 2.2 AA | WCAG 2.1 AA built-in |
| Data ownership | Pendo servers, export costs extra | Your database, standard JSON |
| Mobile support | iOS + Android SDK | Web only (no React Native) |

**What you lose:** Pendo's visual guide builder, mobile SDK, built-in product analytics, and session replay.

**What you gain:** Full rendering control, your design system's CSS, automatic accessibility, React-native architecture, data ownership, and $40K-$80K/year back in your budget.

Tour Kit has no visual builder and requires React developers. That's a genuine limitation.

---

Full article with troubleshooting section, FAQ, and additional code examples: [usertourkit.com/blog/migrate-pendo-to-react](https://usertourkit.com/blog/migrate-pendo-to-react)

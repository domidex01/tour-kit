## Subreddit: r/reactjs

**Title:** We tested 7 headless UI libraries for building onboarding flows — here's how the space breaks down

**Body:**

I've been working on a headless product tour library and wanted to understand the landscape. Turns out "headless onboarding library" barely exists as a category — only 2 libraries are purpose-built for it.

Here's the quick breakdown after testing each in a Vite 6 + React 19 + TS 5.7 project:

**Purpose-built headless onboarding:**
- **userTourKit** (ours, bias disclosed) — hooks-based, DOM-aware tours, `asChild` pattern, <8KB core. Does element highlighting, scroll management, keyboard nav while rendering nothing.
- **OnboardJS** — state machine flow orchestrator with analytics plugins (PostHog, Mixpanel). No DOM awareness though — can't highlight elements or position tooltips.

**Headless UI primitives you'd compose into tour steps:**
- **Radix Primitives** (28+ components) — used by Vercel, Supabase, Linear. The `asChild` pattern is great for tour tooltips.
- **React Aria** (43+ components) — Adobe's hooks-based library. Best accessibility implementation but steeper learning curve.
- **Base UI** (35+ components) — reached v1 in Feb 2026, separated from MUI. Good for teams migrating off Material.
- **Ark UI** (34+ components) — works across React, Vue, and Solid with identical APIs.
- **Headless UI** (~10 components) — smallest set, Tailwind-first from Tailwind Labs.

The interesting finding: React Joyride (~400K weekly downloads) and react-shepherd still don't have stable React 19 support. One developer (Sandro Roth) documented giving up on all existing libraries and building a custom solution with XState + Floating UI instead.

Nobody has applied the Radix/React Aria composition pattern to onboarding specifically — that's the gap we're trying to fill.

Full comparison table and code examples: https://usertourkit.com/blog/best-headless-ui-libraries-onboarding

Curious if anyone else has gone the headless route for onboarding. What did you end up using?

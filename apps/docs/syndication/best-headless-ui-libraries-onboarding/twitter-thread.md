## Thread (6 tweets)

**1/** "Headless onboarding library" barely exists as a category. I tested 7 libraries and only 2 are purpose-built for it. Here's how the space actually breaks down:

**2/** The React 19 compatibility crisis is real. React Joyride (~400K weekly npm downloads) still has no stable React 19 release. Its class component architecture is fundamentally incompatible. One dev wrote up giving up on all existing options.

**3/** Only 2 libraries do headless onboarding directly:

- Tour Kit (ours): hooks + DOM awareness + asChild pattern, <8KB core
- OnboardJS: state machine flow orchestrator, but no DOM targeting

The other 5 (Radix, React Aria, Base UI, Ark UI, Headless UI) are rendering primitives you'd pair with tour logic.

**4/** Headless component adoption grew 70% in 2025 for general UI. Radix is used by Vercel, Supabase, and Linear. But nobody applied those composition patterns to onboarding until now.

**5/** The emerging stack: tour engine for logic + headless primitives for rendering.

npm install @tourkit/core @tourkit/react
npm install @radix-ui/react-popover

Your design system. Your components. Zero style conflicts.

**6/** Full comparison table with 7 libraries, code examples, and a decision framework for choosing the right approach:

https://usertourkit.com/blog/best-headless-ui-libraries-onboarding

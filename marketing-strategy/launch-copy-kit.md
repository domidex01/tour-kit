# TourKit Launch Copy Kit

> Pre-written copy for every launch channel. Review and adapt before posting.

---

## Hacker News — Show HN

### Title
```
Show HN: Tour-Kit – Headless product tours for React (open source)
```

Link: GitHub repository (NOT docs site or landing page)

### Founder Comment (Post within 5 minutes)

```
Hi HN – I built tour-kit because every product tour solution I evaluated fell into one of two traps:

1. SaaS platforms (Appcues, Pendo, UserGuiding) charge $250-$900/month to inject an iframe overlay that doesn't match your design system. And you still need engineering help for targeting, routing, and custom styling.

2. Open-source libraries (React Joyride, Shepherd.js) ship with their own CSS opinions and no extended features. Joyride has React 19 compatibility issues. Shepherd uses AGPL.

Tour-kit takes a different approach:

- Headless-first. Core is React hooks — useTour, useFocusTrap, useKeyboard. You bring your own UI.
- Works natively with shadcn/ui and Tailwind (the stack most React devs use in 2026).
- TypeScript strict mode across all packages. No `any` types.
- WCAG 2.1 AA accessibility built in: focus trapping, keyboard nav, screen reader announcements, prefers-reduced-motion.
- Core is free and MIT. Under 8KB gzipped.

Extended packages (analytics, checklists, announcements, adoption tracking, media embeds, scheduling) are $99 one-time. No subscriptions, no MAU limits.

What it doesn't do: no visual/WYSIWYG builder, no drag-and-drop, no framework support beyond React. It's a developer tool, not a platform.

Happy to answer questions about the architecture, positioning engine, or accessibility approach.
```

---

## Product Hunt

### Tagline (60 chars max)
```
Headless product tours for React. Open source.
```

### Description
```
Tour-kit is a headless React library for product tours, onboarding flows, and contextual hints. You write the UI with your own components, we handle positioning, step sequencing, keyboard navigation, focus management, and accessibility.

Free tier (MIT):
• @tour-kit/core — hooks and utilities (<8KB gzipped)
• @tour-kit/react — pre-styled shadcn/ui components
• @tour-kit/hints — contextual hints and beacons

Pro tier ($99 once):
• Analytics (PostHog, Mixpanel, Amplitude)
• Onboarding checklists with task dependencies
• Product announcements (modals, toasts, banners)
• Feature adoption tracking
• Media embeds (YouTube, Loom, Lottie)
• Time-based scheduling

No subscriptions. No per-seat pricing. No MAU limits.
```

### Maker's First Comment
```
Hey PH — I built tour-kit because every product tour library I tried either locked me into their UI (Joyride), required a $300/mo SaaS subscription (Chameleon, UserGuiding), or wasn't accessible out of the box.

Tour-kit is headless-first. The core package is React hooks — useTour, useFocusTrap, useKeyboard — and you build whatever UI you want on top. If you use shadcn/ui, there's a pre-styled component layer that drops right in.

Accessibility is built in, not bolted on: focus trapping, keyboard navigation, screen reader announcements, and prefers-reduced-motion support are all in the core.

Free tier (MIT): tours, hints, spotlights, keyboard nav, TypeScript. Extended packages (analytics, checklists, announcements, media embeds): $99 one-time.

Would genuinely appreciate feedback on the API design — especially from anyone who's built onboarding flows before.
```

---

## Twitter/X — Launch Thread

### Tweet 1 (Hook)
```
tour-kit is live.

Headless product tours for React — hooks-based, accessible, TypeScript-strict. Built for the shadcn/ui era.

Free core (MIT). Pro packages $99 once.

Thread: what it does, how it works, and why I built it.
```

### Tweet 2 (The Problem)
```
The problem with product tour tools in 2026:

SaaS platforms: $250-900/month for an iframe overlay that doesn't match your design system.

OSS libraries: React Joyride broken on React 19. Shepherd uses AGPL. Driver.js has no React hooks.

Neither gives you headless control over your UI.
```

### Tweet 3 (Code Example)
```
tour-kit's approach: you own the UI, we handle the logic.

[CODE SCREENSHOT: 8-line useTour hook example with custom component]

That's a fully accessible, keyboard-navigable tour in your own components.
```

### Tweet 4 (shadcn/ui)
```
If you use shadcn/ui, it works natively:

[CODE SCREENSHOT: <Tour> + <TourStep> component example]

Same Radix primitives. Same composition patterns. Looks like it belongs in your app because it IS your app.
```

### Tweet 5 (What's Included)
```
Free tier (MIT):
- @tour-kit/core (<8KB gzipped)
- @tour-kit/react (pre-styled components)
- @tour-kit/hints (contextual hints)

Pro ($99 once — not $300/month):
- Analytics (PostHog, Mixpanel, Amplitude)
- Checklists with task dependencies
- Announcements (modals, toasts, banners)
- Adoption tracking
- Media embeds
- Scheduling
```

### Tweet 6 (Accessibility)
```
Accessibility isn't optional:

- Focus traps that restore on close
- aria-live announcements for step changes
- Full keyboard nav (arrows, Tab, Escape)
- prefers-reduced-motion support
- WCAG 2.1 AA out of the box

No extra config. No a11y plugin. It just works.
```

### Tweet 7 (Price Comparison)
```
The math:

Appcues: $2,988/year
UserGuiding: $1,068/year
Pendo: ~$6,000/year

tour-kit Pro: $99. Once. Forever.

Same features. Your components. Your code.
```

### Tweet 8 (CTA)
```
Try it:

pnpm add @tour-kit/react

Docs: [link]
GitHub: [link]

Star it if it's useful. Feedback welcome — especially on the API design.
```

---

## Reddit — r/reactjs

### Title
```
I built an open-source product tour library for React because I got tired of fighting Joyride's callback-based API
```

### Body
```
I've been building product tours for React apps for a while, and I kept running into the same problems:

- React Joyride is the default choice, but it has React 19 compatibility issues, uses inline styles that clash with Tailwind, and the spotlight breaks in dark mode via mix-blend-mode.
- Shepherd.js uses AGPL (dealbreaker for commercial projects) and the React wrapper feels bolted on.
- SaaS tools like Appcues charge $250-900/month for overlays that don't match your design system.

So I built tour-kit. It's headless-first — core is just hooks, ~8KB. There's a styled layer for shadcn/ui if you want pre-built components.

What it does well: composition-based API (components, not config objects), real accessibility (focus trap, keyboard nav, screen reader announcements), TypeScript strict mode throughout, works natively with shadcn/ui.

What it doesn't do: no visual builder, no analytics dashboard, no drag-and-drop. It's a library, not a platform.

Free tier (MIT) covers tours, hints, and spotlights. Extended packages (analytics, checklists, announcements, adoption tracking, media, scheduling) are $99 one-time.

Repo: [link]
Docs: [link]

Disclosure: I built this. Happy to answer questions about the architecture or the accessibility approach.
```

---

## Reddit — r/nextjs

### Title
```
How to add accessible product tours to Next.js App Router (open source, works with shadcn/ui)
```

### Body
```
I built tour-kit — a headless React library for product tours. It works natively with Next.js App Router and shadcn/ui.

Quick setup:

pnpm add @tour-kit/react

Then wrap your layout and add tour steps. The library handles positioning, focus trapping, keyboard navigation, and screen reader announcements.

Why I built it: existing options either don't support React 19 properly (Joyride), are Next.js-only with Framer Motion lock-in (Onborda), or charge $300/month (Appcues).

Tour-kit is headless — you can use the pre-styled shadcn/ui components or bring your own UI entirely.

Core is free (MIT, <8KB gzipped). Extended packages are $99 one-time.

Docs: [link]
GitHub: [link]

Disclosure: I'm the maintainer. Feedback on the Next.js integration welcome.
```

---

## Reddit — r/SaaS

### Title
```
How I'm replacing $300/month onboarding tools with a $99 one-time open-source library
```

### Body
```
If you're running a SaaS and using Appcues, UserGuiding, or Pendo for product tours, you're probably paying $3,000-$10,000+ per year for something that could be a library in your codebase.

I built tour-kit — a headless React library that gives you the same features:
- Product tours and onboarding flows
- Onboarding checklists with task dependencies
- Product announcements (modals, toasts, banners)
- Analytics integration (PostHog, Mixpanel, Amplitude)
- Feature adoption tracking

The difference: $99 one-time vs $300/month. The code ships to your node_modules. No vendor dependency, no MAU limits, no invoice surprises.

The free tier (MIT) covers basic tours, hints, and spotlights — handles 80% of use cases for indie products.

If you're a solo founder or small team with React/Next.js, this might save you a few thousand a year.

[link to docs]

Disclosure: I built this. Happy to share the cost comparison math.
```

---

## Dev.to Launch Article

### Title
```
Introducing Tour-Kit: Headless Product Tours for React (Open Source)
```

### Structure
```
1. The problem (3 paragraphs: SaaS costs, OSS limitations, accessibility gaps)
2. What tour-kit does (packages, architecture, code example)
3. How it works with shadcn/ui (code example with screenshot)
4. Accessibility by default (what's included, why it matters)
5. Free vs Pro (honest comparison, no hard sell)
6. What's next (roadmap, community, how to contribute)
7. Links (docs, GitHub, getting started)
```

Tags: `#react #typescript #opensource #webdev`

---

## Shoutout Tweets (Post on Launch Day)

### Floating UI
```
tour-kit's positioning engine is built on @floating_ui. Accurate, performant, and handles every edge case we've thrown at it. If you're building anything with popovers or tooltips, it's the foundation to use.
```

### shadcn/ui
```
tour-kit is designed to work natively with @shadaborek's component patterns. Same Radix primitives, same composition philosophy. Building on top of shadcn/ui is one of the best decisions we made.
```

### Radix UI
```
The accessibility patterns in tour-kit are informed by @radaboredix_ui. Focus management, keyboard handling, and ARIA patterns done right. Grateful for the prior art.
```

### Turborepo
```
tour-kit is 9 packages in a monorepo managed by @turborepo. Build caching alone saves hours per week. If you're managing multiple packages, it's essential.
```

---

## Email to Newsletter Editors

### Subject
```
New open-source headless tour library for React — launching [date]
```

### Body
```
Hi [name],

I'm Domi, building tour-kit — a headless React library for product tours and onboarding.

Key differentiators:
- Headless-first: hooks for logic, you bring the UI
- shadcn/ui native: works with the stack most React devs use
- TypeScript strict mode, WCAG 2.1 AA accessible
- Free core (MIT, <8KB) + Pro packages ($99 one-time)
- Fills the gap between free-but-limited OSS and $300/mo SaaS

We're launching [date] on HN and Product Hunt.

Docs: [link]
GitHub: [link]
Demo: [link]

Would love to be included in your next issue — happy to write custom copy that matches your newsletter's tone.

Best,
Domi
```

# TourKit Product Overview

## What It Is
A headless React library for product tours and user onboarding. Hooks-based, TypeScript-strict, WCAG 2.1 AA accessible, built natively for the shadcn/ui + Tailwind stack.

## Architecture
- **Headless-first:** Core is React hooks and utilities — no DOM rendering, no CSS injection
- **Composable:** Small hooks that compose, not a monolithic component with 50 props
- **shadcn/ui native:** Follows shadcn composition patterns, uses same Radix UI primitives
- **Tree-shakeable:** ESM + CJS builds via tsup, install only what you use
- **Zero runtime CSS:** No style conflicts, no specificity wars

## Package Map

### Free Tier (MIT Licensed)

| Package | Purpose | Bundle (gzip) |
|---------|---------|---------------|
| `@tour-kit/core` | Hooks + utilities: `useTour`, `useFocusTrap`, `useKeyboard` | <8KB |
| `@tour-kit/react` | Pre-styled shadcn/ui components: `<Tour>`, `<TourStep>` | <12KB |
| `@tour-kit/hints` | Contextual hints, beacons, tooltips | <5KB |

### Pro Tier ($99 One-Time)

| Package | Purpose |
|---------|---------|
| `@tour-kit/analytics` | Plugin-based: PostHog, Mixpanel, Amplitude, custom |
| `@tour-kit/checklists` | Task lists with dependencies, progress tracking |
| `@tour-kit/announcements` | Modals, toasts, banners, slideouts, spotlights |
| `@tour-kit/adoption` | Feature adoption tracking and nudge system |
| `@tour-kit/media` | YouTube, Vimeo, Loom, Wistia, GIF, Lottie embeds |
| `@tour-kit/scheduling` | Time-based scheduling with timezone support |

### Pro License Terms
- $99 one-time payment
- Lifetime updates
- 5 production sites
- No per-seat, no MAU limits, no recurring fees
- Code ships to `node_modules` — no server, no tracking, no vendor dependency

## Technical Specs
- **TypeScript:** Strict mode across all packages, full inference, no `any` types
- **Accessibility:** Focus traps, `aria-live` announcements, full keyboard nav (arrows, Tab, Escape), `prefers-reduced-motion` support
- **Positioning:** Built on Floating UI
- **React:** Supports React 18 and 19 (including Server Components context)
- **Bundling:** tsup, tree-shakeable ESM + CJS
- **Monorepo:** Turborepo with Changesets-based versioning

## Competitive Position

| vs Category | Tour-Kit Advantage |
|---|---|
| vs React Joyride (680K dl/week) | Headless, React 19 support, TS strict, 8 extended packages, shadcn native |
| vs Shepherd/Intro.js | MIT license (not AGPL), native React (not wrapper), headless |
| vs Appcues ($249-879/mo) | $99 once, own the code, native design system integration, no vendor lock-in |
| vs Pendo ($4K/mo) | Developer-first, lightweight, no enterprise bloat |
| vs Onborda (1.3K stars) | Works with any React setup (not Next.js only), 8 packages, no Framer Motion lock-in |

## Market Context
- Product Tour Software Market: $550M (2024), growing to $1.32B by 2033 (10% CAGR)
- React: 42.62% JS framework market share, 85M weekly npm downloads
- shadcn/ui: 110K+ GitHub stars, becoming default for new React projects
- PLG activation rates: 64% with guided onboarding vs 25% baseline
- No OSS library ranks for any product tour SEO keyword — massive content gap

## Revenue Model
- Free tier = adoption funnel (covers 80% of use cases)
- Pro tier = revenue ($99 one-time, zero marginal cost)
- Future potential: Enterprise tier, consulting, managed deployment
- Year 1 SOM: $50K-$200K (500-2,000 Pro licenses)

## Tech Stack (TourKit Development)
- **Language:** TypeScript (strict mode)
- **Framework:** React 18/19
- **Styling:** Tailwind CSS, CSS custom properties (`--tk-*` tokens)
- **Components:** Radix UI primitives (same as shadcn/ui)
- **Positioning:** Floating UI
- **Monorepo:** Turborepo
- **Bundling:** tsup
- **Docs:** Fumadocs (Next.js based)
- **Versioning:** Changesets
- **Package manager:** pnpm
- **CI:** GitHub Actions

## Related
- Market analysis: `context/company/market-analysis.md`
- Competitive landscape: `context/tour-kit-marketing/competitive-landscape.md`
- Go-to-market: `context/tour-kit-marketing/go-to-market.md`
- Shipping plan: `context/tour-kit-shipping-plan.md`

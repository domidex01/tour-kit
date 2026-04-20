---
title: Glossary
type: overview
sources:
  - ../marketing-strategy/
  - ../CLAUDE.md
  - ../apps/docs/content/
updated: 2026-04-19
---

*Shared vocabulary for TourKit content. Use these definitions consistently across docs, blog posts, tweets, and wiki pages.*

## Product concepts

### Tour
A sequence of steps that guides a user through a UI. In TourKit: `<Tour id="...">` wraps the steps; `useTour()` manages state. See [product/packages.md](product/packages.md).

### Step
A single stop in a tour — a tooltip attached to an element with a title, content, and placement. `<TourStep>` in the React package.

### Target
The DOM element (or CSS selector) a step points at. Can be a ref, a selector string, or `"body"` for a centered modal-style step.

### Placement
Where the step appears relative to the target: `top`, `bottom`, `left`, `right`, plus `center` (no target). Resolved via Floating UI.

### Beacon
A persistent, passive UI element that invites a click — a pulsing dot or badge. Used to draw attention to a feature without a full tour. See `@tour-kit/hints`.

### Hint
A contextual tooltip attached to a feature. Similar to a tooltip but persistent — stays until dismissed. Often paired with a beacon.

### Hotspot
Synonym for hint/beacon in some competitor docs (Userpilot, Pendo). TourKit prefers "hint."

### Spotlight
A visual effect that dims the rest of the UI while highlighting the target element. Implemented via overlay + cutout, not `mix-blend-mode` (which breaks in dark mode).

### Focus trap
Constraining keyboard focus to within the tour step while active, then restoring focus on close. Built into `@tour-kit/core` via `useFocusTrap`. A WCAG 2.1 AA requirement.

### aria-live
ARIA attribute that announces dynamic content changes to screen readers. TourKit uses `aria-live="polite"` for step changes so assistive tech reads the new content.

### Checklist
A task list with progress tracking and dependencies between tasks. `@tour-kit/checklists` — Pro package.

### Task dependency
A task that can't start until another task is complete. Supported in `@tour-kit/checklists`.

### Announcement
A broadcast UI element: modal, toast, banner, slideout, or spotlight. `@tour-kit/announcements` — Pro.

### Adoption tracking
Measuring which users have used which features, with a nudge system to prompt discovery of unused features. `@tour-kit/adoption` — Pro.

### Nudge
A time-delayed, context-aware hint that appears when a user has *not* adopted a feature after a set period.

### Microsurvey
A short in-app survey, typically 1–5 questions. Types: NPS, CSAT, CES. `@tour-kit/surveys` — Pro.

### NPS / CSAT / CES
**NPS** (Net Promoter Score): "How likely are you to recommend?" 0–10 scale. **CSAT** (Customer Satisfaction): "How satisfied were you?" **CES** (Customer Effort Score): "How much effort did it take?"

### Fatigue prevention
Logic that prevents a user from seeing too many surveys / nudges in a short window. Built into `@tour-kit/surveys`.

### Schedule (`@tour-kit/scheduling`)
A time-based rule for when a tour / announcement / survey is eligible to fire. Supports timezones, recurring patterns, date ranges.

## Marketing / business concepts

### MAU
Monthly Active Users. A pricing unit used by Appcues, UserGuiding, Userpilot, etc. TourKit does not use MAU pricing — one-time $99 license.

### PLG
Product-Led Growth. Strategy where the product itself drives acquisition and expansion (vs sales-led). PLG achieves ~64% activation vs 25% baseline. See [market/analysis.md](market/analysis.md).

### DAP
Digital Adoption Platform. Category name for enterprise tools (WalkMe, Pendo, Whatfix) that combine onboarding, analytics, and feature adoption. TourKit is a library, not a DAP.

### ICP
Ideal Customer Profile. Our three: Frontend Lead (50%), Indie Hacker (30%), Product Manager (20%). See [audience/icps.md](audience/icps.md).

### TAM / SAM / SOM
**TAM** (Total Addressable Market): entire market = $550M. **SAM** (Serviceable Addressable Market): React-ecosystem slice = ~$165M. **SOM** (Serviceable Obtainable Market): Year 1 target = $50K–$200K. See [market/analysis.md](market/analysis.md).

### Activation
When a new user reaches the "aha moment" that proves the product's value. PLG activation benchmark: 64% with guided onboarding vs 25% without.

### CAC
Customer Acquisition Cost. For TourKit must stay below $25 (4x return on $99). See [gtm/paid-channels.md](gtm/paid-channels.md).

### Anti-persona
A user segment we explicitly do NOT target. See [audience/anti-personas.md](audience/anti-personas.md).

### Wedge
The singular, sharp differentiator that opens the market. TourKit's wedge: **$99 once, not $300/month.**

### Headless (business sense)
Separating logic from presentation so customers bring their own UI. Established patterns: headless CMS (Contentful), headless commerce (Medusa), headless auth (Clerk). TourKit is headless onboarding.

## Technical terms

### Headless (technical sense)
An architecture where the library provides logic (hooks, utilities) but no rendered DOM or CSS. User composes the UI. TourKit's `@tour-kit/core` is headless; `@tour-kit/react` adds the styled layer on top.

### Composable
An API design where small, focused pieces combine into bigger features — as opposed to a monolithic component with 50 props. TourKit uses composition (`<Tour>` + `<TourStep>`) not configuration.

### Tree-shakeable
Build-tool feature that removes unused exports from the final bundle. All TourKit packages ship ESM + CJS; bundlers can drop unused imports.

### Gzip / gzipped
Compression used for HTTP transfer. Bundle size numbers (core <8KB, react <12KB, hints <5KB) are post-gzip.

### TypeScript strict mode
`"strict": true` in tsconfig — enables all strict type-checking options. No implicit `any`, strict null checks, strict function types. All TourKit packages use it.

### Discriminated union
A TypeScript pattern where a `kind` / `type` field narrows a union to a specific variant. Used for TourKit step types so each variant has its own valid props.

### Floating UI
A positioning library that handles tooltips, popovers, menus — calculates where an element should render relative to a target, avoiding viewport edges. TourKit uses it for step placement.

### Radix UI
An accessibility-first unstyled component library. TourKit and shadcn/ui both build on Radix primitives.

### shadcn/ui
A copy-paste React component library built on Radix + Tailwind. Not a traditional npm package — components are copied into your repo. TourKit is designed to work natively with it.

### Tailwind CSS
Utility-first CSS framework. The dominant styling choice in the 2026 indie stack.

### Turborepo
Monorepo build orchestrator. TourKit uses it for parallel builds and caching across the 10 packages.

### tsup
Zero-config TypeScript bundler (built on esbuild). Produces ESM + CJS + declarations. TourKit's packaging tool.

### Changesets
Monorepo versioning tool. Developers write changesets describing what changed; `changeset publish` bumps + releases. TourKit uses it.

### Fumadocs
Next.js–based docs framework. TourKit's docs site (`apps/docs/`) uses Fumadocs. See [sources/docs-content.md](sources/docs-content.md).

### MDX
Markdown + JSX. Used throughout Fumadocs content — lets you drop React components into docs pages.

### MCP server
Model Context Protocol server — exposes tools/resources to LLM clients. TourKit has one (not yet deeply covered in wiki).

### UnifiedSlot
TourKit-specific: a component that supports both Radix's `asChild` pattern (element cloning) and Base UI's render-prop pattern. Each package has a copy in `lib/slot.tsx`.

### asChild
Radix UI pattern where a component renders its child instead of its own element, forwarding props. TourKit supports this via UnifiedSlot.

### Provider
React context provider. `TourProvider` and `TourKitProvider` live in `@tour-kit/core`; each Pro package (AdoptionProvider, ChecklistProvider, etc.) wraps its own context.

## Naming conventions

### "TourKit" vs "tour-kit"
- **TourKit** — display name in prose. Two words, capital T and K.
- **tour-kit** — code name. npm scope (`@tour-kit/*`), GitHub slug, filesystem. Never in prose.

Avoid: "Tour Kit", "Tourkit", "tourKit".

See [brand/identity.md](brand/identity.md).

## Related

- [product/packages.md](product/packages.md) — Where the product concepts are implemented
- [product/tourkit.md](product/tourkit.md) — Tech stack
- [brand/voice.md](brand/voice.md) — Word-level style rules (banned words, preferred phrases)
- [market/analysis.md](market/analysis.md) — Where business terms come from
- [sources/docs-content.md](sources/docs-content.md) — Authoritative API docs

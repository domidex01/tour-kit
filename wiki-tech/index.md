# Index

Catalog of every wiki-tech page. Alphabetical within each section. Update on every ingest that creates or deletes a page.

## Entry points

- [overview.md](overview.md) — Top-level synthesis, package map, quality gates
- [CLAUDE.md](CLAUDE.md) — Schema and conventions for maintaining this wiki
- [README.md](README.md) — Short human-facing intro
- [log.md](log.md) — Chronological log of wiki operations

## Packages

- [packages/adoption.md](packages/adoption.md) — Feature adoption tracking + nudge system
- [packages/ai.md](packages/ai.md) — AI chat with CAG/RAG strategies; strict client/server split
- [packages/analytics.md](packages/analytics.md) — Plugin-based event tracking (PostHog, Mixpanel, Amplitude, GA4, console, custom)
- [packages/announcements.md](packages/announcements.md) — Modal/Slideout/Banner/Toast/Spotlight + priority queue + frequency rules
- [packages/checklists.md](packages/checklists.md) — Onboarding checklists with task dependencies and locked-task semantics
- [packages/core.md](packages/core.md) — Framework-agnostic foundation: types, context, hooks, utilities (zero runtime deps)
- [packages/hints.md](packages/hints.md) — Persistent hints / hotspots; independent dismissal state per hint
- [packages/license.md](packages/license.md) — Polar.sh validation, dev bypass, render-key anti-bypass, dual entry (React + headless)
- [packages/media.md](packages/media.md) — TourMedia + 7 embed variants; URL auto-detection
- [packages/react.md](packages/react.md) — React components, router adapters, MultiTourKitProvider; re-exports core
- [packages/scheduling.md](packages/scheduling.md) — Date-range, blackout, business-hours, recurring-pattern evaluation
- [packages/surveys.md](packages/surveys.md) — NPS / CSAT / CES / custom + fatigue prevention + skip logic

## Architecture

- [architecture/accessibility.md](architecture/accessibility.md) — WCAG 2.1 AA model, focus, keyboard, ARIA, RTL, reduced motion
- [architecture/build-pipeline.md](architecture/build-pipeline.md) — tsup per package, ESM+CJS, bundle budgets, Turborepo orchestration
- [architecture/client-server-split.md](architecture/client-server-split.md) — Hard runtime boundaries in `@tour-kit/ai` and `@tour-kit/license`
- [architecture/dependency-graph.md](architecture/dependency-graph.md) — Who depends on whom; tier split (free vs Pro); third-party deps
- [architecture/monorepo.md](architecture/monorepo.md) — pnpm workspace, Turborepo, releasing via Changesets
- [architecture/provider-architecture.md](architecture/provider-architecture.md) — Layered providers, optional analytics integration

## Concepts

- [concepts/audience-targeting.md](concepts/audience-targeting.md) — `AudienceCondition` model, composition, gotchas
- [concepts/focus-trap.md](concepts/focus-trap.md) — `useFocusTrap()` semantics, focusable element selection
- [concepts/license-gating.md](concepts/license-gating.md) — Lifecycle, states, render-key anti-bypass, domain activation
- [concepts/plugin-system.md](concepts/plugin-system.md) — Analytics plugin interface, custom destinations, auto-wiring
- [concepts/positioning-engine.md](concepts/positioning-engine.md) — Core math vs floating-ui; placement model; collision fallbacks
- [concepts/queue-and-frequency.md](concepts/queue-and-frequency.md) — Priority queue, stack behaviors, frequency rules; survey extras
- [concepts/rag-pipeline.md](concepts/rag-pipeline.md) — CAG vs RAG, vector store / embedding adapters, chunking, route handler wiring
- [concepts/router-adapters.md](concepts/router-adapters.md) — Factory + direct-hook patterns; multi-page persistence
- [concepts/schedule-evaluation.md](concepts/schedule-evaluation.md) — 6-step evaluation order; timezone handling; blackout priority
- [concepts/storage-adapters.md](concepts/storage-adapters.md) — Pluggable persistence, prefix convention, SSR safety
- [concepts/unified-slot.md](concepts/unified-slot.md) — Radix `asChild` + Base UI render-prop reconciliation
- [concepts/url-parsing.md](concepts/url-parsing.md) — Media URL detection, per-platform helpers, responsive source selection

## Sources

- [sources/coding-rules.md](sources/coding-rules.md) — Pointer to `tour-kit/rules/*.md`
- [sources/package-claude-files.md](sources/package-claude-files.md) — Pointer to `packages/*/CLAUDE.md` (with stale-claim notes)
- [sources/package-entry-points.md](sources/package-entry-points.md) — Pointer to `packages/*/src/index.ts` (and multi-entry variants)
- [sources/package-manifests.md](sources/package-manifests.md) — Pointer to `packages/*/package.json` (version snapshot table)

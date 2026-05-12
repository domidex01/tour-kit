# Tour Kit — 100 Update Ideas

Generated 2026-05-08 from package audit (`packages/*`) + competitive scan (Appcues, Pendo, Userflow, Userpilot, Chameleon, WalkMe, Usertour, Joyride, Shepherd, Driver.js).

Legend: **[D]** dashboard-focused · **[C]** core/engine · **[F]** new feature · **[X]** DX/tooling · **[AI]** AI-native · **[N]** new package/niche · **[P]** performance/infra

Effort hint: 🟢 small · 🟡 medium · 🔴 large.

---

## I. Adoption Dashboard — make it the killer feature (1–22)

The current `AdoptionDashboard` ships stats grid + table + filters + category chart. That's the floor. Every commercial tool offers more. Below, 22 upgrades sorted by leverage.

1. **[D]🟡 Funnel widget** — `<AdoptionFunnel featureId>` step-by-step drop-off bar chart with % retained between checkpoints. Highest-requested chart in PLG tooling.
2. **[D]🟡 Cohort retention curves** — `<AdoptionRetentionGrid>` D1/D7/D30/D90 sliced by signup week; render as classic triangle heatmap.
3. **[D]🔴 Sankey flow diagram** — visualize step-to-step paths through a tour or checklist; surface branch popularity.
4. **[D]🟢 Time-to-adopt distribution** — p50/p90/p99 histogram per feature; companion to existing stats grid.
5. **[D]🟡 Engagement-by-segment matrix** — heatmap rows=segments, cols=features; click cell to drill in.
6. **[D]🟢 Date range comparison mode** — overlay "this week vs last", with delta badges on every stat card.
7. **[D]🟡 Annotations on time-series** — mark releases, marketing campaigns, A/B test starts on charts.
8. **[D]🟢 CSV/Parquet export on every chart** — single `<ExportMenu>` slot, hooked into TanStack Table data.
9. **[D]🟡 Public share links** — read-only dashboard URL with token + optional password, expirable.
10. **[D]🔴 Embeddable widgets** — `<AdoptionStatCard embed>` exposes an iframe-safe build for Notion/Confluence/intranet pages.
11. **[D]🟡 Saved views / pinned charts** — let users compose personal dashboards from widgets, persisted via storage adapter.
12. **[D]🟢 Density toggle** — compact vs comfortable rows in tables, mirrors Linear/Vercel.
13. **[D]🟡 Mobile-responsive layout** — Pendo's admin is desktop-only; ship a real mobile dashboard variant. Differentiator.
14. **[D]🟡 Print/PDF export** — board-meeting-ready snapshot with branded header, generated via `@react-pdf/renderer` or Puppeteer hook.
15. **[D]🟡 Anomaly alerts** — drop in adoption rate or completion rate triggers webhook/email; rule builder in dashboard.
16. **[D]🟢 Flow health score** — composite metric (completion × frequency × recency × satisfaction) shown as 0–100 ring on every flow row.
17. **[D]🟡 User-level drilldown** — click any number, get the actual user IDs behind it, gated by RBAC.
18. **[D]🟢 Tag/label system** — group features and tours by team, lifecycle stage, area; filter dashboards by tag.
19. **[D]🟢 Bulk operations** — multi-select rows in `AdoptionTable`, archive/retag/pause in one action.
20. **[D]🟡 Real-time live mode** — tail events as they happen via the analytics queue; useful during launches.
21. **[D]🔴 A/B test stats panel** — significance, confidence intervals, lift calculations baked in (today users compute manually).
22. **[D]🟡 Reverse funnel / churn lens** — "of users who churned, which tours did they skip"; pair with adoption-status-badge.

## II. Core engine & positioning (23–34)

23. **[C]🟡 Self-healing selectors** — vision-model fallback when CSS selector misses; cache successful matches in storage.
24. **[C]🟢 Element-not-found strategies** — declarative `onMissing: 'skip' | 'wait' | 'error' | 'advance'` per step.
25. **[C]🟡 Native CSS Anchor Positioning adapter** — modern browsers (2025+) ship anchor-name; route through it when supported, fall back to Floating UI. Bundle savings.
26. **[C]🟢 Popover API attribute mode** — emit `popover=auto` on cards; let the platform manage stacking.
27. **[C]🟡 View Transitions API** — smooth step morphing, respecting `prefers-reduced-motion`.
28. **[C]🟢 Container queries in cards** — adapt to panel width, not viewport; matches modern docking patterns.
29. **[C]🟡 RSC-aware tour boundary** — Server Components can declare a static slot that hydrates into a client tour; document & helper hook.
30. **[C]🟡 Multi-window/popup awareness** — flow that survives `window.open`; broadcast via existing cross-tab channel.
31. **[C]🟢 Hot reload of flows in dev** — change flow JSON, see update without remount; uses `import.meta.hot`.
32. **[C]🟢 Why-didn't-this-fire diagnostic** — explain mode for predicate evaluation, returns reason string at each gate.
33. **[C]🟡 OpenTelemetry instrumentation** — spans for step transitions and eligibility checks; opt-in.
34. **[C]🟢 Type-safe step IDs** — generic over `Steps[number]['id']`; stop accepting `string` everywhere.

## III. Authoring & flow lifecycle (35–46)

35. **[F]🔴 Visual no-code builder** (`@tour-kit/builder`) — Vite-hosted local app that writes flows back to your repo. Closes the biggest Appcues/Userflow gap.
36. **[F]🔴 Chrome extension recorder** — record flows by clicking through your live app; emit Tour Kit code (Playwright codegen analog).
37. **[F]🟡 Server-side flow storage adapter** — `createDatabaseFlowSource()` so flows can live in Postgres/Redis and hot-swap without redeploy. Usertour's killer feature.
38. **[F]🟢 Headless CMS sources** — Sanity/Contentful/Payload adapters for tour copy.
39. **[F]🟢 Git-based flow storage** — Contentlayer/Velite pattern; flows in `/content/flows/*.mdx`, PR-reviewed.
40. **[F]🟡 Versioning + rollback** — git-style history per flow with one-click revert in the dashboard.
41. **[F]🟡 Approval workflow** — draft → review → publish pipeline; permissions tied to RBAC.
42. **[F]🟢 Scheduled publishing** — set a flow live at a future timestamp; piggyback on `@tour-kit/scheduling`.
43. **[F]🟡 Tour preview links** — shareable URL that forces a flow for QA/stakeholders, bypassing audience rules.
44. **[F]🟢 Staging environment toggle** — separate analytics buckets for non-prod runs.
45. **[F]🟡 Audit log** — who changed which flow, diff view, exportable; needs persistence layer.
46. **[F]🟢 Tour preview as MDX in docs** — `<TourPreview slug="onboarding" />` Fumadocs component; powers product marketing pages.

## IV. Targeting, segmentation & experimentation (47–57)

47. **[F]🔴 Segmentation engine** — rule builder with AND/OR groups over user traits + events. New `@tour-kit/segments` package.
48. **[F]🟡 Behavioral triggers** — fire tour when user does/doesn't do X within Y minutes.
49. **[F]🟡 Branching / conditional steps** — declarative `if: predicate` per step, jumps to `goto: stepId`.
50. **[F]🔴 A/B testing of tours** — split traffic between variants, measure completion lift; needs holdout group support.
51. **[F]🟡 Multivariate experiments** — vary copy, position, trigger timing simultaneously.
52. **[F]🟡 Goal tracking per flow** — bind a tour to a target event, surface conversion rate in dashboard.
53. **[F]🟢 URL pattern targeting** — regex/glob/query-param/hash-route matchers as a first-class `match:` field.
54. **[F]🟢 Device/browser/viewport targeting** — declarative gates baked into audience rules.
55. **[F]🟢 Geographic targeting** — country/region rules via `Accept-Language` and timezone heuristics (privacy-friendly).
56. **[F]🟢 Frequency capping** — global "max 2 tours per session, 5 per week"; new top-level provider config.
57. **[F]🟢 Holdout groups** — exclude N% of users for baseline comparison; expose as analytics dimension.

## V. AI-native features (58–67)

58. **[AI]🔴 AI Copilot for authoring** — "build me a tour for the billing page"; uses `@tour-kit/ai` infra to scaffold flow JSON.
59. **[AI]🟡 Auto-translation pipeline** — DeepL/GPT-driven, glossary-aware, RTL-correct; ship a `tour-kit i18n sync` CLI.
60. **[AI]🟡 Personalized step copy** — vary CTA per persona via LLM at runtime, with deterministic fallback.
61. **[AI]🟡 Voice-narrated walkthroughs** — TTS via ElevenLabs/Cartesia, captions on by default, fallback to silent text.
62. **[AI]🟡 Open-text survey AI summarization** — cluster verbatims into themes in the surveys dashboard.
63. **[AI]🔴 Screen-recording → tour extraction** — record once, vision model emits draft Tour Kit code.
64. **[AI]🟢 AI tour QA agent** — autonomous bot runs every flow nightly, files breakage issues against your repo.
65. **[AI]🟡 In-tour AI search** — "ask about this step" without leaving the spotlight; RAG over your docs via `@tour-kit/ai`.
66. **[AI]🟢 AI-generated changelog tours** — point at a release, get a guided walkthrough of new features.
67. **[AI]🟢 EU AI Act disclosure flag** — auto-tag flows that contain LLM-generated copy; surface in audit log.

## VI. New surfaces & packages (68–80)

68. **[N]🔴 `@tour-kit/native`** — React Native / Expo support: spotlight, beacon, checklist, native gestures.
69. **[N]🟡 `@tour-kit/web-component`** — `<tour-kit-spotlight>` custom element so non-React apps can embed.
70. **[N]🟡 `@tour-kit/launcher`** — persistent in-app widget aggregating tours, docs, changelog (Pendo Resource Center analog). Major commercial parity feature.
71. **[N]🟡 `@tour-kit/cli-tour`** — terminal walkthroughs (TUI) for developer-tool onboarding; pairs with the existing `tour-kit-mcp` app.
72. **[N]🟢 `@tour-kit/storybook`** — preview tours per story, debug positioning, time-travel through steps.
73. **[N]🟡 `@tour-kit/devtools`** — Chrome/Edge extension panel showing active flow, eligibility verdict per rule, why a flow didn't fire.
74. **[N]🟡 `@tour-kit/figma`** — Figma plugin: annotate frames, export to Tour Kit JSON.
75. **[N]🟢 `@tour-kit/email-preview`** — render any flow as static HTML/GIF for marketing emails.
76. **[N]🟢 `@tour-kit/pdf-export`** — turn a flow into a documentation/training PDF (LMS/SCORM compliance).
77. **[N]🟢 `@tour-kit/markdown-export`** — emit a flow as Markdown for docs sites; closes the loop with MDX import.
78. **[N]🟡 Browser extension onboarding kit** — tours inside extension popups, chrome.storage adapter prebuilt.
79. **[N]🟡 Tauri/Electron desktop adapter** — point at native menus and OS dialogs.
80. **[N]🟢 Slack/Discord chat onboarding** — bot relays step progression, keeps state in sync with web flow.

## VII. Developer experience & tooling (81–92)

81. **[X]🔴 MCP server** (`apps/tour-kit-mcp`) — already exists; add tools for `create_flow`, `edit_step`, `run_audit`. Lets Claude Code & Cursor author tours.
82. **[X]🟡 VS Code extension** — autocomplete step IDs, jump from selector to DOM, mid-edit preview.
83. **[X]🟢 ESLint plugin** — catch dangling step refs, missing target selectors, untranslated strings.
84. **[X]🟡 Codemods** — `tour-kit migrate from-joyride|from-shepherd|from-intro`. Direct conversion path = SEO + adoption.
85. **[X]🟢 React Testing Library helpers** — `expectStepVisible`, `advanceTour`, deterministic positioning shim for jsdom.
86. **[X]🟢 Playwright fixtures** — `await tour.complete('onboarding')`; ships in a `@tour-kit/playwright` subpath.
87. **[X]🟢 Cypress commands** — `cy.tour('onboarding').step('billing').click()`.
88. **[X]🟢 Visual regression presets** — Chromatic/Percy snapshots for every step, gated in CI.
89. **[X]🟢 Bundle analyzer badge** — track per-package gzipped size in CI; publish a JSON manifest for dashboards.
90. **[X]🟢 `<TourDebugger />` overlay** — visualize active selectors, viewport, scroll; toggle via query string.
91. **[X]🟢 Zod schemas for flow definitions** — validate at runtime, infer types, share with CMS sources.
92. **[X]🟢 Telemetry-free by default** — make zero-telemetry the documented stance; opt-in only for usage stats.

## VIII. Integrations & infra (93–100)

93. **[F]🟡 SSO/SAML/SCIM for the dashboard** — paywalled feature for the eventual hosted/self-hosted admin.
94. **[F]🟡 RBAC** — viewer/editor/admin scopes for the dashboard; mirrors flow-level permissions.
95. **[F]🟢 Webhook outputs** — fire on step view, completion, dismissal; signed payloads.
96. **[F]🟢 CDP source connectors** — Segment, RudderStack, Hightouch reverse-ETL targets.
97. **[F]🟢 Slack/Teams notifications** — alert when NPS dips or a high-value user stalls.
98. **[F]🟢 Salesforce/HubSpot sync** — push tour completion events to CRM via reusable analytics plugin pattern.
99. **[P]🟡 Edge-rendered eligibility** — Cloudflare Workers / Vercel Edge route for sub-100ms audience checks; offload from client bundle.
100. **[P]🟡 Public OSS adoption dashboard** — host live `npm-stat` + GitHub stars + issue burn-down at `tour-kit.dev/dashboard`. Marketing leverage and proof-of-tool dogfood.

---

## Suggested first sprint (highest ROI, lowest risk)

| # | Title | Effort | Why |
|---|---|---|---|
| 1 | Funnel widget | 🟡 | Most-asked PLG chart, lifts dashboard parity vs Pendo overnight |
| 4 | Time-to-adopt histogram | 🟢 | Cheap, complements existing stats grid |
| 6 | Date range comparison | 🟢 | One-day win, perceived as "modern" |
| 8 | CSV export | 🟢 | Unblocks B2B/enterprise evaluators |
| 16 | Flow health score | 🟢 | Single number = exec-friendly |
| 32 | Why-didn't-fire diagnostic | 🟢 | Top OSS pain point with Joyride |
| 34 | Type-safe step IDs | 🟢 | Reinforces the "TS-first" positioning |
| 70 | Launcher package | 🟡 | Closes the biggest commercial-parity gap (Resource Center) |
| 81 | MCP server tools | 🔴 | Differentiator: tours authored by AI agents |
| 84 | Codemods from Joyride | 🟢 | SEO + migration funnel |

---

## Notes for follow-up

- Items 35 (visual builder) and 47 (segmentation engine) are the two highest-impact / highest-effort bets. They're also the two features most likely to push Tour Kit from "OSS lib" to "OSS platform" — sequence accordingly.
- Several ideas (40, 41, 45, 93, 94) imply a hosted/self-hosted admin server. If that direction is on the roadmap, group them as a single epic; otherwise drop them.
- Anything tagged **[AI]** assumes `@tour-kit/ai` is already a dependency in the consumer app — keep gating to avoid forcing AI cost on free-tier users.

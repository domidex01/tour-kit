# Docs internal-link graph audit

Scanned **282** MDX pages under `content/docs`.

## Top-line metrics

- Total docs→docs edges: **1276**
- Avg outbound docs-links per page: **4.52**
- Avg inbound docs-links per page: **4.52**
- Orphans (0 inbound): **3** (1.1%)
- Dead-ends (0 outbound): **0** (0.0%)
- Low-inbound (1 inbound): **36**
- Natural-link candidates: **1015** across **262** pages

## Per-section health

| Section | Pages | Orphans | Dead-ends | Avg out | Avg in |
| --- | ---: | ---: | ---: | ---: | ---: |
| _root | 1 | 0 | 0 | 12 | 0 |
| adoption | 19 | 0 | 0 | 3.53 | 4.26 |
| ai | 8 | 0 | 0 | 3.38 | 4.25 |
| analytics | 11 | 0 | 0 | 3.09 | 4.45 |
| announcements | 27 | 2 | 0 | 4.3 | 4.96 |
| api | 12 | 0 | 0 | 17.5 | 3.75 |
| build-with-llms | 1 | 0 | 0 | 1 | 1 |
| checklists | 21 | 0 | 0 | 3.05 | 4 |
| core | 37 | 0 | 0 | 3.92 | 5.43 |
| examples | 7 | 0 | 0 | 2.86 | 2.57 |
| getting-started | 4 | 0 | 0 | 5.25 | 5.5 |
| guides | 24 | 0 | 0 | 4.33 | 4.96 |
| hints | 10 | 0 | 0 | 3.7 | 4.8 |
| licensing | 2 | 0 | 0 | 8.5 | 3 |
| media | 17 | 0 | 0 | 4 | 5.24 |
| migration | 3 | 0 | 0 | 6.67 | 6 |
| react | 27 | 0 | 0 | 5.37 | 5.85 |
| scheduling | 17 | 0 | 0 | 3.35 | 4.41 |
| surveys | 30 | 1 | 0 | 3 | 2.93 |
| troubleshooting | 1 | 0 | 0 | 6 | 3 |
| use-cases | 3 | 0 | 0 | 5 | 1 |

## Top inbound (current hubs)

| URL | Inbound |
| --- | ---: |
| [/docs/core/hooks/use-tour](/docs/core/hooks/use-tour) | 23 |
| [/docs/announcements/hooks/use-announcement](/docs/announcements/hooks/use-announcement) | 19 |
| [/docs/react/components/tour-card](/docs/react/components/tour-card) | 16 |
| [/docs/checklists/hooks/use-checklist](/docs/checklists/hooks/use-checklist) | 15 |
| [/docs/guides/accessibility](/docs/guides/accessibility) | 15 |
| [/docs/media/components/tour-media](/docs/media/components/tour-media) | 15 |
| [/docs/getting-started/quick-start](/docs/getting-started/quick-start) | 14 |
| [/docs/scheduling/types](/docs/scheduling/types) | 14 |
| [/docs/core/providers/tour-provider](/docs/core/providers/tour-provider) | 13 |
| [/docs/react/components/tour-overlay](/docs/react/components/tour-overlay) | 13 |
| [/docs/react/components/tour](/docs/react/components/tour) | 13 |
| [/docs/surveys/types](/docs/surveys/types) | 13 |
| [/docs/announcements/providers/announcements-provider](/docs/announcements/providers/announcements-provider) | 11 |
| [/docs/api](/docs/api) | 11 |
| [/docs/core/hooks/use-spotlight](/docs/core/hooks/use-spotlight) | 11 |
| [/docs/react/components/tour-step](/docs/react/components/tour-step) | 11 |
| [/docs/analytics/plugins](/docs/analytics/plugins) | 10 |
| [/docs/analytics/providers](/docs/analytics/providers) | 10 |
| [/docs/core/diagnostic](/docs/core/diagnostic) | 10 |
| [/docs/guides/unified-slot](/docs/guides/unified-slot) | 10 |

## Orphan pages (0 inbound docs links)

Pages no other doc page points to. The section index page is usually the right home for at least one inbound link.

| Section | URL | Outbound |
| --- | --- | ---: |
| announcements | [/docs/announcements/hooks/use-filtered-announcements](/docs/announcements/hooks/use-filtered-announcements) | 2 |
| announcements | [/docs/announcements/hooks/use-resolved-text](/docs/announcements/hooks/use-resolved-text) | 2 |
| surveys | [/docs/surveys/components/question-media](/docs/surveys/components/question-media) | 1 |

## Dead-end pages (0 outbound docs links)

Pages a reader cannot navigate further from. Every dead-end should at minimum point back to its section index and to one peer.

| Section | URL | Inbound |
| --- | --- | ---: |

## Top natural-link opportunities (per page)

Pages whose prose mentions API symbols (hooks, components, packages) that are not currently linked. Top 30 by opportunity count.

### `/docs/surveys` (19 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `console` | [/docs/analytics/plugins/console](/docs/analytics/plugins/console) | …othing and a warning is logged to the console. </Callout> In-app microsurveys that surface at the right… |
| `Custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …s friction before it becomes churn. - **Custom** — Multi-step question flows for anything else: feature se… |
| `custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …urvey types (NPS, CSAT, CES) plus fully custom question flows, all delivered through five display modes an… |
| `Banner` | [/docs/announcements/components/banner](/docs/announcements/components/banner) | …rveys/components"> Modal, Slideout, Banner, Popover, Inline, and question components </Card> <Card… |
| `Modal` | [/docs/announcements/components/modal](/docs/announcements/components/modal) | …s" href="/docs/surveys/components"> Modal, Slideout, Banner, Popover, Inline, and question components… |
| `Slideout` | [/docs/announcements/components/slideout](/docs/announcements/components/slideout) | …="/docs/surveys/components"> Modal, Slideout, Banner, Popover, Inline, and question components </Card>… |
| `storage` | [/docs/core/utilities/storage](/docs/core/utilities/storage) | …iately. Every `answer()` call writes to storage, not just on `complete()`. If a user closes mid-survey, t… |
| `QuestionBoolean` | [/docs/surveys/components/question-boolean](/docs/surveys/components/question-boolean) | …ve `aria-label` - `QuestionRating` and `QuestionBoolean` implement roving tabindex on a `role="radiogroup"` contain… |
| `QuestionRating` | [/docs/surveys/components/question-rating](/docs/surveys/components/question-rating) | …gion"` with descriptive `aria-label` - `QuestionRating` and `QuestionBoolean` implement roving tabindex on a `role… |
| `QuestionSelect` | [/docs/surveys/components/question-select](/docs/surveys/components/question-select) | …x on a `role="radiogroup"` container - `QuestionSelect` uses `role="radiogroup"` (single) or `role="group"` (multi… |
| `QuestionText` | [/docs/surveys/components/question-text](/docs/surveys/components/question-text) | …`aria-valuemax` - Character counts in `QuestionText` are announced via `aria-live="polite"` --- ## Related -… |
| `SurveyBanner` | [/docs/surveys/components/survey-banner](/docs/surveys/components/survey-banner) | …he open dialog and restored on close - `SurveyBanner` and `SurveyInline` use `role="region"` with descriptive `a… |

### `/docs/api` (14 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `useFeature` | [/docs/adoption/hooks/use-feature](/docs/adoption/hooks/use-feature) | …` \| core/react \| State persistence \| \| `useFeature` \| adoption \| Feature adoption tracking \| \| `useAnalytics`… |
| `Spotlight` | [/docs/announcements/components/spotlight](/docs/announcements/components/spotlight) | …d component \| \| `TourOverlay` \| react \| Spotlight overlay \| \| `Hint` \| hints \| Hint with hotspot and tooltip… |
| `useAnnouncement` | [/docs/announcements/hooks/use-announcement](/docs/announcements/hooks/use-announcement) | …` \| analytics \| Analytics tracking \| \| `useAnnouncement` \| announcements \| Announcement control \| \| `useChecklist`… |
| `Checklist` | [/docs/checklists/components/checklist](/docs/checklists/components/checklist) | …ntrol \| \| `useChecklist` \| checklists \| Checklist progress \| \| `TourMedia` \| media \| Embedded media component… |
| `useChecklist` | [/docs/checklists/hooks/use-checklist](/docs/checklists/hooks/use-checklist) | …nouncements \| Announcement control \| \| `useChecklist` \| checklists \| Checklist progress \| \| `TourMedia` \| media… |
| `progress` | [/docs/checklists/utilities/progress](/docs/checklists/utilities/progress) | …`useChecklist` \| checklists \| Checklist progress \| \| `TourMedia` \| media \| Embedded media component \| \| `use… |
| `usePersistence` | [/docs/core/hooks/use-persistence](/docs/core/hooks/use-persistence) | …int` \| hints \| Single hint control \| \| `usePersistence` \| core/react \| State persistence \| \| `useFeature` \| adopti… |
| `useTour` | [/docs/core/hooks/use-tour](/docs/core/hooks/use-tour) | …\| \|--------\|---------\|-------------\| \| `useTour` \| core/react \| Main tour control hook \| \| `Tour` \| react \|… |
| `TourMedia` | [/docs/media/components/tour-media](/docs/media/components/tour-media) | …\| checklists \| Checklist progress \| \| `TourMedia` \| media \| Embedded media component \| \| `useSchedule` \| sch… |
| `TourCard` | [/docs/react/components/tour-card](/docs/react/components/tour-card) | …react \| Step definition component \| \| `TourCard` \| react \| Tooltip card component \| \| `TourOverlay` \| react… |
| `TourOverlay` | [/docs/react/components/tour-overlay](/docs/react/components/tour-overlay) | …` \| react \| Tooltip card component \| \| `TourOverlay` \| react \| Spotlight overlay \| \| `Hint` \| hints \| Hint with… |
| `TourStep` | [/docs/react/components/tour-step](/docs/react/components/tour-step) | …\| react \| Declarative tour wrapper \| \| `TourStep` \| react \| Step definition component \| \| `TourCard` \| react… |

### `/docs/examples/dashboard` (14 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `console` | [/docs/analytics/plugins/console](/docs/analytics/plugins/console) | …ment/checklist/adoption) to the browser console. \| \| `@tour-kit/react` \| `components/tour-kit/onboarding-to… |
| `Tour` | [/docs/react/components/tour](/docs/react/components/tour) | …l, end-to-end integration of the entire Tour Kit suite. It's a small team-workspace dashboard ("Stacks")… |
| `useSchedule` | [/docs/scheduling/hooks/use-schedule](/docs/scheduling/hooks/use-schedule) | …nents/tour-kit/scheduled-banner.tsx` \| `useSchedule` gates the maintenance banner to business hours. \| \| `@tour… |
| `@tour-kit/react` | [/docs/react](/docs/react) | …/adoption) to the browser console. \| \| `@tour-kit/react` \| `components/tour-kit/onboarding-tour.tsx` \| 5-step dashb… |
| `@tour-kit/hints` | [/docs/hints](/docs/hints) | …onComplete` fires the CSAT survey. \| \| `@tour-kit/hints` \| `components/tour-kit/hints.tsx` \| `DarkModeHint` on `#da… |
| `@tour-kit/adoption` | [/docs/adoption](/docs/adoption) | …th auto-completion via DOM events. \| \| `@tour-kit/adoption` \| `lib/tour-kit-config.ts`, `app/dashboard/projects/[id]/p… |
| `@tour-kit/analytics` | [/docs/analytics](/docs/analytics) | …o controls behind `<LicenseGate>`. \| \| `@tour-kit/analytics` \| `app/providers.tsx` \| `consolePlugin` streams every even… |
| `@tour-kit/announcements` | [/docs/announcements](/docs/announcements) | …e`; `ExportHint` on `#export-btn`. \| \| `@tour-kit/announcements` \| `lib/tour-kit-config.ts`, `components/tour-kit/announcem… |
| `@tour-kit/checklists` | [/docs/checklists](/docs/checklists) | …ss-hours schedule), AI-live toast. \| \| `@tour-kit/checklists` \| `lib/tour-kit-config.ts`, `components/tour-kit/checklist… |
| `@tour-kit/media` | [/docs/media](/docs/media) | …NewFeatureBadge>` fades after use. \| \| `@tour-kit/media` \| `components/tour-kit/announcements-host.tsx` \| `<TourMed… |
| `@tour-kit/scheduling` | [/docs/scheduling](/docs/scheduling) | …Tube URL inside the welcome modal. \| \| `@tour-kit/scheduling` \| `components/tour-kit/scheduled-banner.tsx` \| `useSchedul… |
| `@tour-kit/surveys` | [/docs/surveys](/docs/surveys) | …ntenance banner to business hours. \| \| `@tour-kit/surveys` \| `lib/tour-kit-config.ts`, `components/tour-kit/csat-surv… |

### `/docs/troubleshooting` (13 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `console` | [/docs/analytics/plugins/console](/docs/analytics/plugins/console) | …or `<Hint autoShow>` **Symptom** — The console spams `Maximum update depth exceeded` infinitely when a `<C… |
| `progress` | [/docs/checklists/utilities/progress](/docs/checklists/utilities/progress) | …once we add first-class support. Track progress in the canonical `UnifiedSlot` source at `@tour-kit/core/li… |
| `useTour` | [/docs/core/hooks/use-tour](/docs/core/hooks/use-tour) | …dispatched. Only persistence restore, `useTour().start()`, and branch navigation would activate a tour. *… |
| `Tour` | [/docs/react/components/tour](/docs/react/components/tour) | …Common issues when integrating Tour Kit into real apps. Each entry lists the minimum package ve… |
| `SurveyBanner` | [/docs/surveys/components/survey-banner](/docs/surveys/components/survey-banner) | …e`, `SurveySlideout`, `SurveyPopover`, `SurveyBanner`) uses `surveyId`. This is intentional for now — both are s… |
| `SurveyInline` | [/docs/surveys/components/survey-inline](/docs/surveys/components/survey-inline) | …odal` (and the other survey variants — `SurveyInline`, `SurveySlideout`, `SurveyPopover`, `SurveyBanner`) uses `… |
| `SurveyModal` | [/docs/surveys/components/survey-modal](/docs/surveys/components/survey-modal) | …riants `AnnouncementModal` uses `id`. `SurveyModal` (and the other survey variants — `SurveyInline`, `SurveySl… |
| `SurveyPopover` | [/docs/surveys/components/survey-popover](/docs/surveys/components/survey-popover) | …ts — `SurveyInline`, `SurveySlideout`, `SurveyPopover`, `SurveyBanner`) uses `surveyId`. This is intentional for… |
| `SurveySlideout` | [/docs/surveys/components/survey-slideout](/docs/surveys/components/survey-slideout) | …ther survey variants — `SurveyInline`, `SurveySlideout`, `SurveyPopover`, `SurveyBanner`) uses `surveyId`. This is… |
| `@tour-kit/core` | [/docs/core](/docs/core) | …o card, no errors. **Cause** — Before `@tour-kit/core@0.4.3`, the `autoStart` prop on a declarative `<Tour>` or o… |
| `@tour-kit/hints` | [/docs/hints](/docs/hints) | …— In `@tour-kit/checklists@0.1.4` and `@tour-kit/hints@0.4.2`, the mount effects re-ran on every render because de… |
| `@tour-kit/announcements` | [/docs/announcements](/docs/announcements) | …le` stays `false`. **Cause** — Before `@tour-kit/announcements@0.1.5`, the provider registered configs on mount but never… |

### `/docs/guides/animations` (12 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `Custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …\| ### Default Keyframes --- ## CSS Custom Properties Animation timing is controlled via CSS variable… |
| `Banner` | [/docs/announcements/components/banner](/docs/announcements/components/banner) | …imations ### Toast Animations ### Banner Animations --- ## Common Patterns ### Staggered Entran… |
| `Modal` | [/docs/announcements/components/modal](/docs/announcements/components/modal) | …kage has its own animation system: ### Modal Animations ### Toast Animations ### Banner Animations… |
| `Spotlight` | [/docs/announcements/components/spotlight](/docs/announcements/components/spotlight) | …t pulse \| Continuous pulse \| Static \| \| Spotlight move \| Animated \| Instant \| \| Video autoplay \| Enabled \| Sh… |
| `Toast` | [/docs/announcements/components/toast](/docs/announcements/components/toast) | …on system: ### Modal Animations ### Toast Animations ### Banner Animations --- ## Common Patte… |
| `Checklist` | [/docs/checklists/components/checklist](/docs/checklists/components/checklist) | …floating placement flips \| 150ms \| \| **Checklist task completion** \| Strike-through label + check-icon scale… |
| `Progress` | [/docs/checklists/utilities/progress](/docs/checklists/utilities/progress) | …n](/docs/core/hooks/use-media-query) - [Progress variants gallery](/docs/examples/progress-variants)… |
| `progress` | [/docs/checklists/utilities/progress](/docs/checklists/utilities/progress) | …ogress variants gallery](/docs/examples/progress-variants)… |
| `position` | [/docs/core/utilities/position](/docs/core/utilities/position) | …TourCard>` uses `@floating-ui/react` to position itself near the current step's target. When the placement f… |
| `Tour` | [/docs/react/components/tour](/docs/react/components/tour) | …nt beacon pulse \| 1.5s (infinite) \| \| **Tour card docking** \| Smooth re-positioning when the floating pl… |
| `@tour-kit/announcements` | [/docs/announcements](/docs/announcements) | …--- ## Announcement Animations The `@tour-kit/announcements` package has its own animation system: ### Modal Animation… |
| `@tour-kit/checklists` | [/docs/checklists](/docs/checklists) | …sk Completion `<ChecklistTask>` (from `@tour-kit/checklists`) runs a 3-phase state machine when a task transitions to `… |

### `/docs/guides/reduced-motion` (12 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `Custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …on flash. 2. **CSS keyframe wrappers.** Custom keyframes that we own (`tour-pulse`, `tour-spotlight-in`, `… |
| `custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …`tour-pulse` on `<HintHotspot>` \| n/a (custom keyframe, not tailwindcss-animate) \| yes (`packages/hints/s… |
| `a11y` | [/docs/core/utilities/a11y](/docs/core/utilities/a11y) | …](/docs/guides/accessibility) — broader a11y coverage - [`useReducedMotion`](/docs/core/hooks/use-media-… |
| `usePrefersReducedMotion` | [/docs/media/hooks/use-prefers-reduced-motion](/docs/media/hooks/use-prefers-reduced-motion) | …is not a concern, use the lower-level `usePrefersReducedMotion()` (defaults to `false`). ## Override knobs `A11yConfig.r… |
| `Tour` | [/docs/react/components/tour](/docs/react/components/tour) | …ion sensitivity, attention regulation). Tour Kit takes this seriously: every animation in every Tour Kit… |
| `@tour-kit/core` | [/docs/core](/docs/core) | …ponent reads `useReducedMotion()` from `@tour-kit/core` and omits the animation class entirely under reduce mode.… |
| `@tour-kit/react` | [/docs/react](/docs/react) | …otion()` \| n/a \| n/a \| hook source \| \| `@tour-kit/react` \| `tour-spotlight-in`, `tour-card-in`, card docking transi… |
| `@tour-kit/hints` | [/docs/hints](/docs/hints) | …(`<TourCard>` docking transition) \| \| `@tour-kit/hints` \| `tour-pulse` on `<HintHotspot>` \| n/a (custom keyframe,… |
| `@tour-kit/announcements` | [/docs/announcements](/docs/announcements) | …pulse>` reads `useReducedMotion`) \| \| `@tour-kit/announcements` \| `animate-in`/`animate-out` + `fade-*` + `slide-*` + `zoo… |
| `@tour-kit/checklists` | [/docs/checklists](/docs/checklists) | …`tailwindcss-animate` plugin \| n/a \| \| `@tour-kit/checklists` \| `tk-strike`, `tk-check-pop` on task completion \| n/a (cu… |
| `@tour-kit/media` | [/docs/media](/docs/media) | …e `completing` phase under reduce) \| \| `@tour-kit/media` \| video / GIF / Lottie autoplay \| n/a \| n/a \| yes (renders… |
| `@tour-kit/surveys` | [/docs/surveys](/docs/surveys) | …`tailwindcss-animate` plugin \| n/a \| \| `@tour-kit/surveys` \| `animate-in`/`animate-out` + `fade-*` + `slide-*` + `zoo… |

### `/docs/build-with-llms` (10 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `Custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …into your conversation: Or create a Custom GPT with the file as a knowledge source. ### Claude In Cl… |
| `@tour-kit/core` | [/docs/core](/docs/core) | …ze \| \|---------\|-------------\|------\| \| @tour-kit/core \| [core.txt](/context/core.txt) \| ~243 lines \| \| @tour-kit/… |
| `@tour-kit/react` | [/docs/react](/docs/react) | …xt](/context/core.txt) \| ~243 lines \| \| @tour-kit/react \| [react.txt](/context/react.txt) \| ~551 lines \| \| @tour-ki… |
| `@tour-kit/hints` | [/docs/hints](/docs/hints) | …t](/context/react.txt) \| ~551 lines \| \| @tour-kit/hints \| [hints.txt](/context/hints.txt) \| ~231 lines \| \| @tour-ki… |
| `@tour-kit/adoption` | [/docs/adoption](/docs/adoption) | …t](/context/hints.txt) \| ~231 lines \| \| @tour-kit/adoption \| [adoption.txt](/context/adoption.txt) \| ~438 lines \| \| @t… |
| `@tour-kit/analytics` | [/docs/analytics](/docs/analytics) | …/context/adoption.txt) \| ~438 lines \| \| @tour-kit/analytics \| [analytics.txt](/context/analytics.txt) \| ~288 lines \| \|… |
| `@tour-kit/announcements` | [/docs/announcements](/docs/announcements) | …context/analytics.txt) \| ~288 lines \| \| @tour-kit/announcements \| [announcements.txt](/context/announcements.txt) \| ~104 li… |
| `@tour-kit/checklists` | [/docs/checklists](/docs/checklists) | …ext/announcements.txt) \| ~104 lines \| \| @tour-kit/checklists \| [checklists.txt](/context/checklists.txt) \| ~264 lines \|… |
| `@tour-kit/media` | [/docs/media](/docs/media) | …ontext/checklists.txt) \| ~264 lines \| \| @tour-kit/media \| [media.txt](/context/media.txt) \| ~201 lines \| \| @tour-ki… |
| `@tour-kit/scheduling` | [/docs/scheduling](/docs/scheduling) | …t](/context/media.txt) \| ~201 lines \| \| @tour-kit/scheduling \| [scheduling.txt](/context/scheduling.txt) \| ~158 lines \|… |

### `/docs/checklists` (10 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `Conditional` | [/docs/adoption/components/conditional](/docs/adoption/components/conditional) | …different actions when clicked: ### Conditional Visibility Show/hide tasks based on context: ### Auto-C… |
| `custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …can navigate, launch tours, or execute custom logic - **Persistent state** - Track completion across sess… |
| `ChecklistProgress` | [/docs/checklists/components/checklist-progress](/docs/checklists/components/checklist-progress) | …ponents"> Checklist, ChecklistTask, ChecklistProgress - Pre-styled components </Card> <Card title="Headless"… |
| `ChecklistTask` | [/docs/checklists/components/checklist-task](/docs/checklists/components/checklist-task) | …/checklists/components"> Checklist, ChecklistTask, ChecklistProgress - Pre-styled components </Card> <Car… |
| `Checklist` | [/docs/checklists/components/checklist](/docs/checklists/components/checklist) | …href="/docs/checklists/components"> Checklist, ChecklistTask, ChecklistProgress - Pre-styled components… |
| `useTask` | [/docs/checklists/hooks/use-task](/docs/checklists/hooks/use-task) | …hooks/use-checklist"> useChecklist, useTask - Programmatic control and state access </Card> <Card t… |
| `Dependencies` | [/docs/checklists/utilities/dependencies](/docs/checklists/utilities/dependencies) | …ble tasks \| --- ## Features ### Task Dependencies Build complex workflows with automatic dependency manageme… |
| `dependencies` | [/docs/checklists/utilities/dependencies](/docs/checklists/utilities/dependencies) | …lout> Interactive checklists with task dependencies, progress tracking, and action triggers. Perfect for onboar… |
| `Progress` | [/docs/checklists/utilities/progress](/docs/checklists/utilities/progress) | …ulti-step workflows with dependencies - Progress tracking toward goals **Use tours instead when:** - You ne… |
| `progress` | [/docs/checklists/utilities/progress](/docs/checklists/utilities/progress) | …tive checklists with task dependencies, progress tracking, and action triggers. Perfect for onboarding flows… |

### `/docs/guides/base-ui` (10 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `AdoptionNudge` | [/docs/adoption/components/adoption-nudge](/docs/adoption/components/adoption-nudge) | …intTooltip` \| \| `@tour-kit/adoption` \| `AdoptionNudge`, `FeatureButton` \| \| `@tour-kit/checklists` \| `Checklist`,… |
| `FeatureButton` | [/docs/adoption/components/feature-button](/docs/adoption/components/feature-button) | …@tour-kit/adoption` \| `AdoptionNudge`, `FeatureButton` \| \| `@tour-kit/checklists` \| `Checklist`, `ChecklistPanel`… |
| `Custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …imitive behind every `asChild` prop. - [Custom components guide](/docs/react/styling/custom-components) —… |
| `custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …ents use the `asChild` pattern to allow custom element composition: The `UILibraryProvider` automatical… |
| `ChecklistPanel` | [/docs/checklists/components/checklist-panel](/docs/checklists/components/checklist-panel) | …`@tour-kit/checklists` \| `Checklist`, `ChecklistPanel` \| ## How It Works ### The `asChild` Pattern userTourKit… |
| `Checklist` | [/docs/checklists/components/checklist](/docs/checklists/components/checklist) | …reButton` \| \| `@tour-kit/checklists` \| `Checklist`, `ChecklistPanel` \| ## How It Works ### The `asChild` Pa… |
| `@tour-kit/react` | [/docs/react](/docs/react) | …--\|--------------------------------\| \| `@tour-kit/react` \| `TourClose` \| \| `@tour-kit/hints` \| `HintHotspot`, `Hint… |
| `@tour-kit/hints` | [/docs/hints](/docs/hints) | …\| `@tour-kit/react` \| `TourClose` \| \| `@tour-kit/hints` \| `HintHotspot`, `HintTooltip` \| \| `@tour-kit/adoption` \|… |
| `@tour-kit/adoption` | [/docs/adoption](/docs/adoption) | …ts` \| `HintHotspot`, `HintTooltip` \| \| `@tour-kit/adoption` \| `AdoptionNudge`, `FeatureButton` \| \| `@tour-kit/checklis… |
| `@tour-kit/checklists` | [/docs/checklists](/docs/checklists) | …\| `AdoptionNudge`, `FeatureButton` \| \| `@tour-kit/checklists` \| `Checklist`, `ChecklistPanel` \| ## How It Works ### Th… |

### `/docs/guides/checklists-tours` (10 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `Custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …conditions: ### Tour Completion ### Custom Condition ### Event-Based Completion --- ## Progress… |
| `custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …to-complete based on tour completion or custom conditions: ### Tour Completion ### Custom Condition… |
| `Checklist` | [/docs/checklists/components/checklist](/docs/checklists/components/checklist) | …h two mechanisms: 1. **Task Actions**: Checklist items can trigger tours when clicked 2. **Auto-completion**… |
| `ChecklistProvider` | [/docs/checklists/providers/checklist-provider](/docs/checklists/providers/checklist-provider) | …ure Providers Wrap your app with both `ChecklistProvider` and `TourKitProvider`: <Callout type="info"> `TourKitPr… |
| `Dependencies` | [/docs/checklists/utilities/dependencies](/docs/checklists/utilities/dependencies) | …represent one clear task: ### 2. Use Dependencies Wisely Create logical progression through tasks: ### 3.… |
| `dependencies` | [/docs/checklists/utilities/dependencies](/docs/checklists/utilities/dependencies) | …Progress tracking and motivation - Task dependencies and ordering - Persistent completion state Tours provide:… |
| `Progress` | [/docs/checklists/utilities/progress](/docs/checklists/utilities/progress) | …de: - Clear list of tasks to complete - Progress tracking and motivation - Task dependencies and ordering -… |
| `progress` | [/docs/checklists/utilities/progress](/docs/checklists/utilities/progress) | …ress Tracking Track checklist and tour progress together: --- ## Complete Onboarding Flow Example Here… |
| `TourKitProvider` | [/docs/core/providers/tour-kit-provider](/docs/core/providers/tour-kit-provider) | …app with both `ChecklistProvider` and `TourKitProvider`: <Callout type="info"> `TourKitProvider` should wrap `C… |
| `Tour` | [/docs/react/components/tour](/docs/react/components/tour) | …Step> <Step> ### Define Checklist with Tour Actions Create a checklist where items trigger tours: </… |

### `/docs/guides/unified-slot` (10 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `Custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …LibraryProvider library="base-ui">`. - [Custom components guide](/docs/react/styling/custom-components) —… |
| `custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …- **Don't lose refs.** When writing a custom slot consumer, forward refs through both branches. - **No d… |
| `Tour` | [/docs/react/components/tour](/docs/react/components/tour) | …from 'fumadocs-ui/components/callout' Tour Kit's UI packages need to compose with whatever component p… |
| `@tour-kit/react` | [/docs/react](/docs/react) | …k>} />` \| Every Tour Kit UI package — `@tour-kit/react`, `@tour-kit/hints`, `@tour-kit/adoption`, `@tour-kit/annou… |
| `@tour-kit/hints` | [/docs/hints](/docs/hints) | …ur Kit UI package — `@tour-kit/react`, `@tour-kit/hints`, `@tour-kit/adoption`, `@tour-kit/announcements`, `@tour-k… |
| `@tour-kit/adoption` | [/docs/adoption](/docs/adoption) | …`@tour-kit/react`, `@tour-kit/hints`, `@tour-kit/adoption`, `@tour-kit/announcements`, `@tour-kit/checklists`, `@tour… |
| `@tour-kit/announcements` | [/docs/announcements](/docs/announcements) | …tour-kit/hints`, `@tour-kit/adoption`, `@tour-kit/announcements`, `@tour-kit/checklists`, `@tour-kit/media`, `@tour-kit/sur… |
| `@tour-kit/checklists` | [/docs/checklists](/docs/checklists) | …/adoption`, `@tour-kit/announcements`, `@tour-kit/checklists`, `@tour-kit/media`, `@tour-kit/surveys` — ships a `Unified… |
| `@tour-kit/media` | [/docs/media](/docs/media) | …nnouncements`, `@tour-kit/checklists`, `@tour-kit/media`, `@tour-kit/surveys` — ships a `UnifiedSlot` that handles… |
| `@tour-kit/surveys` | [/docs/surveys](/docs/surveys) | …ur-kit/checklists`, `@tour-kit/media`, `@tour-kit/surveys` — ships a `UnifiedSlot` that handles both. ## Consumer us… |

### `/docs/adoption/components/adoption-nudge` (9 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `Conditional` | [/docs/adoption/components/conditional](/docs/adoption/components/conditional) | …res are nudged at once. </Callout> ### Conditional Display Only show nudges in certain contexts: ### Persi… |
| `AdoptionProvider` | [/docs/adoption/providers/adoption-provider](/docs/adoption/providers/adoption-provider) | …es based on the nudge configuration in `AdoptionProvider`. It handles scheduling, display, and user interactions out… |
| `Custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …ops) => ReactNode', description: 'Custom render function for complete UI control', }, delay:… |
| `custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …fault: 'false', description: 'Use custom element via Slot pattern', }, className: { ty… |
| `Progress` | [/docs/checklists/utilities/progress](/docs/checklists/utilities/progress) | …ently based on feature category: ### Progress Indicator Show how many uses until adoption: ## Styling… |
| `Position` | [/docs/core/utilities/position](/docs/core/utilities/position) | …: '"bottom-right"', description: 'Position of the nudge on screen', }, size: { type: '"s… |
| `position` | [/docs/core/utilities/position](/docs/core/utilities/position) | …owing nudge (milliseconds)', }, position: { type: '"bottom-right" \| "bottom-left" \| "top-right… |
| `Tour` | [/docs/react/components/tour](/docs/react/components/tour) | …entrance/exit animations: ### With Tour Integration Launch a tour when user clicks the nudge: #… |
| `Examples` | [/docs/react/headless/examples](/docs/react/headless/examples) | …tional CSS classes', }, }} /> ## Examples ### Default Nudge The default styling provides a clean, s… |

### `/docs/announcements` (9 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …docs/announcements/headless"> Build custom announcement UI with render props </Card> <Card title="… |
| `Banner` | [/docs/announcements/components/banner](/docs/announcements/components/banner) | …og entries, detailed announcements ### Banner Full-width bar at top or bottom - persistent and non-block… |
| `Modal` | [/docs/announcements/components/modal](/docs/announcements/components/modal) | …e right variant for your use case: ### Modal Centered dialog with overlay - best for important announce… |
| `Slideout` | [/docs/announcements/components/slideout](/docs/announcements/components/slideout) | …breaking changes, critical updates ### Slideout Side panel that slides in from left or right - less intrus… |
| `Spotlight` | [/docs/announcements/components/spotlight](/docs/announcements/components/spotlight) | …critical updates, success messages ### Spotlight Highlights a specific element with an overlay - draws atte… |
| `Toast` | [/docs/announcements/components/toast](/docs/announcements/components/toast) | …enance alerts, persistent messages ### Toast Temporary notification that auto-dismisses - minimal and u… |
| `Variants` | [/docs/announcements/components/variants](/docs/announcements/components/variants) | …--- ## Quick Start --- ## UI Variants Choose the right variant for your use case: ### Modal Ce… |
| `useAnnouncementQueue` | [/docs/announcements/hooks/use-announcement-queue](/docs/announcements/hooks/use-announcement-queue) | …useAnnouncement, useAnnouncements, useAnnouncementQueue - Programmatic control </Card> <Card title="Components"… |
| `useAnnouncements` | [/docs/announcements/hooks/use-announcements](/docs/announcements/hooks/use-announcements) | …use-announcement"> useAnnouncement, useAnnouncements, useAnnouncementQueue - Programmatic control </Card> <C… |

### `/docs/announcements/types` (9 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …adata Extend announcement configs with custom metadata: ### Generic User Context Type-safe user conte… |
| `Banner` | [/docs/announcements/components/banner](/docs/announcements/components/banner) | …t components directly (Modal, Slideout, Banner, Toast, Spotlight); these props matter when you compose you… |
| `Modal` | [/docs/announcements/components/modal](/docs/announcements/components/modal) | …rs use the variant components directly (Modal, Slideout, Banner, Toast, Spotlight); these props matter wh… |
| `Slideout` | [/docs/announcements/components/slideout](/docs/announcements/components/slideout) | …the variant components directly (Modal, Slideout, Banner, Toast, Spotlight); these props matter when you com… |
| `Spotlight` | [/docs/announcements/components/spotlight](/docs/announcements/components/spotlight) | …rectly (Modal, Slideout, Banner, Toast, Spotlight); these props matter when you compose your own layout. ###… |
| `Toast` | [/docs/announcements/components/toast](/docs/announcements/components/toast) | …ents directly (Modal, Slideout, Banner, Toast, Spotlight); these props matter when you compose your own l… |
| `Storage` | [/docs/core/utilities/storage](/docs/core/utilities/storage) | …apps never construct it directly. ## Storage ### AnnouncementStorageAdapter Pluggable persistence laye… |
| `storage` | [/docs/core/utilities/storage](/docs/core/utilities/storage) | …r Pluggable persistence layer. Default storage uses `localStorage`; pass an adapter on the provider to swa… |
| `Examples` | [/docs/react/headless/examples](/docs/react/headless/examples) | …ntent Types ### AnnouncementMedia **Examples:** ### AnnouncementAction **Example:** --- ## Fre… |

### `/docs/checklists/providers/checklist-provider` (9 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `Custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …### Modal (requires integration) ### Custom Handle custom actions via `onTaskAction`: ## Automati… |
| `custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …te change. </Callout> ## Context Pass custom context to make it available in task conditions: Tasks c… |
| `Modal` | [/docs/announcements/components/modal](/docs/announcements/components/modal) | …handle tour launching. </Callout> ### Modal (requires integration) ### Custom Handle custom actio… |
| `Checklist` | [/docs/checklists/components/checklist](/docs/checklists/components/checklist) | …this: Then complete manually: ## Checklist Lifecycle ## Multiple Checklists Provide multiple check… |
| `Dependencies` | [/docs/checklists/utilities/dependencies](/docs/checklists/utilities/dependencies) | …ity as needed: ### Validate Circular Dependencies Always validate dependencies during development: ### Co… |
| `dependencies` | [/docs/checklists/utilities/dependencies](/docs/checklists/utilities/dependencies) | …Circular Dependencies Always validate dependencies during development: ### Context Best Practices Keep con… |
| `Storage` | [/docs/core/utilities/storage](/docs/core/utilities/storage) | …checklist state across sessions: ### Storage Format The provider persists: - Completed tasks per checkl… |
| `storage` | [/docs/core/utilities/storage](/docs/core/utilities/storage) | …n: 'Persistence configuration for state storage', }, context: { type: '{ user?: object; data?… |
| `Tour` | [/docs/react/components/tour](/docs/react/components/tour) | …s: ### Navigate ### Callback ### Tour (requires integration) <Callout type="warn"> Tour acti… |

### `/docs/guides/analytics-integration` (9 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `Custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …astUsedDate`, `daysSinceUse` \| --- ## Custom Event Tracking Track custom events using the `useTrack` ho… |
| `custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …\| --- ## Custom Event Tracking Track custom events using the `useTrack` hook: --- ## Building Dashb… |
| `Checklist` | [/docs/checklists/components/checklist](/docs/checklists/components/checklist) | …, `interactionType` \| --- ## Tracking Checklist Progress Checklists from `@tour-kit/checklists` emit event… |
| `Progress` | [/docs/checklists/utilities/progress](/docs/checklists/utilities/progress) | …tionType` \| --- ## Tracking Checklist Progress Checklists from `@tour-kit/checklists` emit events for tas… |
| `progress` | [/docs/checklists/utilities/progress](/docs/checklists/utilities/progress) | …ed complete \| `checklistId`, `itemId`, `progress` \| \| `checklist_completed` \| All tasks done \| `checklistId`… |
| `Tour` | [/docs/react/components/tour](/docs/react/components/tour) | …ugin system. --- ## Why Track Product Tour Analytics Understanding how users engage with your onboard… |
| `@tour-kit/hints` | [/docs/hints](/docs/hints) | …-- ## Auto-Tracking Hints Hints from `@tour-kit/hints` also emit events automatically: ### Tracked Hint Events… |
| `@tour-kit/adoption` | [/docs/adoption](/docs/adoption) | …--- ## Tracking Feature Adoption Use `@tour-kit/adoption` to track feature usage and adoption: ### Tracked Adopti… |
| `@tour-kit/checklists` | [/docs/checklists](/docs/checklists) | …ng Checklist Progress Checklists from `@tour-kit/checklists` emit events for task completion: ### Tracked Checklist… |

### `/docs/media/types` (9 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …# Generic Component Types For building custom media components: ## Hook Return Types ### UseMediaEven… |
| `Variants` | [/docs/announcements/components/variants](/docs/announcements/components/variants) | …ns `undefined` for unknown types. ## Variants Types CVA-derived variant prop types for the styled embed… |
| `GifPlayer` | [/docs/media/components/gif-player](/docs/media/components/gif-player) | …onent: ### GifPlayerProps Props for GifPlayer component: ### LottiePlayerProps Props for LottiePlayer… |
| `LoomEmbed` | [/docs/media/components/loom-embed](/docs/media/components/loom-embed) | …onent: ### LoomEmbedProps Props for LoomEmbed component: ### WistiaEmbedProps Props for WistiaEmbed c… |
| `LottiePlayer` | [/docs/media/components/lottie-player](/docs/media/components/lottie-player) | …nt: ### LottiePlayerProps Props for LottiePlayer component: ## Headless Types ### MediaHeadlessProps Pr… |
| `NativeVideo` | [/docs/media/components/native-video](/docs/media/components/native-video) | …ent: ### NativeVideoProps Props for NativeVideo component: ### GifPlayerProps Props for GifPlayer compo… |
| `VimeoEmbed` | [/docs/media/components/vimeo-embed](/docs/media/components/vimeo-embed) | …nent: ### VimeoEmbedProps Props for VimeoEmbed component: ### LoomEmbedProps Props for LoomEmbed compo… |
| `WistiaEmbed` | [/docs/media/components/wistia-embed](/docs/media/components/wistia-embed) | …ent: ### WistiaEmbedProps Props for WistiaEmbed component: ### NativeVideoProps Props for NativeVideo c… |
| `@tour-kit/media` | [/docs/media](/docs/media) | …ments all TypeScript types exported by `@tour-kit/media`. Use these for type-safe media component development. ##… |

### `/docs/analytics` (8 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `Amplitude` | [/docs/analytics/plugins/amplitude](/docs/analytics/plugins/amplitude) | …xpanel-browser` \| \| `amplitudePlugin` \| Amplitude analytics \| `@amplitude/analytics-browser` \| \| `googleAnaly… |
| `amplitude` | [/docs/analytics/plugins/amplitude](/docs/analytics/plugins/amplitude) | …litudePlugin` \| Amplitude analytics \| `@amplitude/analytics-browser` \| \| `googleAnalyticsPlugin` \| Google Ana… |
| `console` | [/docs/analytics/plugins/console](/docs/analytics/plugins/console) | …nts will automatically be logged to the console during development. ## Available Plugins userTourKit prov… |
| `custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …ismisses nudge ## Manual Tracking For custom tracking needs, use the `useAnalytics` hook: ## Privacy… |
| `Mixpanel` | [/docs/analytics/plugins/mixpanel](/docs/analytics/plugins/mixpanel) | …s \| `posthog-js` \| \| `mixpanelPlugin` \| Mixpanel event tracking \| `mixpanel-browser` \| \| `amplitudePlugin` \|… |
| `mixpanel` | [/docs/analytics/plugins/mixpanel](/docs/analytics/plugins/mixpanel) | …nelPlugin` \| Mixpanel event tracking \| `mixpanel-browser` \| \| `amplitudePlugin` \| Amplitude analytics \| `@am… |
| `posthog` | [/docs/analytics/plugins/posthog](/docs/analytics/plugins/posthog) | …gPlugin` \| PostHog product analytics \| `posthog-js` \| \| `mixpanelPlugin` \| Mixpanel event tracking \| `mixpa… |
| `Tour` | [/docs/react/components/tour](/docs/react/components/tour) | …atically tracks these event types: ### Tour Lifecycle - `tour_started` - User begins a tour - `tour_com… |

### `/docs/checklists/components/checklist-launcher` (8 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `Custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …type: 'ReactNode', description: 'Custom icon', }, className: { type: 'string',… |
| `Variants` | [/docs/announcements/components/variants](/docs/announcements/components/variants) | …Icon ### Without Badge ### Styled Variants ## Progress Badge The launcher automatically shows: - N… |
| `Checklist` | [/docs/checklists/components/checklist](/docs/checklists/components/checklist) | …/docs/checklists/hooks/use-checklist) - Checklist control… |
| `Progress` | [/docs/checklists/utilities/progress](/docs/checklists/utilities/progress) | …hout Badge ### Styled Variants ## Progress Badge The launcher automatically shows: - Number of comple… |
| `progress` | [/docs/checklists/utilities/progress](/docs/checklists/utilities/progress) | …visibility of a checklist panel. Shows progress indicator. ## Usage ## Props <TypeTable type={{… |
| `Position` | [/docs/core/utilities/position](/docs/core/utilities/position) | …: "'bottom-right'", description: 'Position on screen', }, variant: { type: "'default' \|… |
| `position` | [/docs/core/utilities/position](/docs/core/utilities/position) | …f the checklist to control', }, position: { type: "'bottom-right' \| 'bottom-left' \| 'top-right… |
| `Examples` | [/docs/react/headless/examples](/docs/react/headless/examples) | …tional CSS classes', }, }} /> ## Examples ### Basic Launcher ### Different Positions ### Custo… |

### `/docs/core/types/tour-types` (8 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …xported for consumers that need to type custom hint reducers. ## Hook Return Types Hooks defined in `@… |
| `a11y` | [/docs/core/utilities/a11y](/docs/core/utilities/a11y) | …fig` (keyboard, spotlight, persistence, a11y, scroll). Used as the `config` prop on `<Tour>` and the `op… |
| `createStep` | [/docs/core/utilities/create-step](/docs/core/utilities/create-step) | …tepOptions Per-step overrides used by `createStep()` and `createNamedStep()`. Mirrors the optional fields on… |
| `createTour` | [/docs/core/utilities/create-tour](/docs/core/utilities/create-tour) | …<Tour>` and the `options` parameter on `createTour()`. ## StepOptions Per-step overrides used by `createSt… |
| `scroll` | [/docs/core/utilities/scroll](/docs/core/utilities/scroll) | …keyboard, spotlight, persistence, a11y, scroll). Used as the `config` prop on `<Tour>` and the `options` p… |
| `TourStep` | [/docs/react/components/tour-step](/docs/react/components/tour-step) | …tep()`. Mirrors the optional fields on `TourStep`. ## Hints Types (re-exported) Used by `@tour-kit/hints… |
| `@tour-kit/core` | [/docs/core](/docs/core) | …## Hook Return Types Hooks defined in `@tour-kit/core` document their return shape on each hook page; the type al… |
| `@tour-kit/hints` | [/docs/hints](/docs/hints) | …## Hints Types (re-exported) Used by `@tour-kit/hints`; re-exported for consumers that need to type custom hint r… |

### `/docs/guides/announcements-scheduling` (8 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `Variants` | [/docs/announcements/components/variants](/docs/announcements/components/variants) | …al workflows: ### 2. Use Appropriate Variants Match variant to urgency and schedule: ### 3. Test Time… |
| `useScheduleStatus` | [/docs/scheduling/hooks/use-schedule-status](/docs/scheduling/hooks/use-schedule-status) | …within your schedule's time range. Use `useScheduleStatus()` to debug. </Callout> <Callout type="error" title="Black… |
| `useUserTimezone` | [/docs/scheduling/hooks/use-user-timezone](/docs/scheduling/hooks/use-user-timezone) | …imezone: <Callout type="info"> When `useUserTimezone: true`, the schedule uses the browser's timezone instead of… |
| `Recurring` | [/docs/scheduling/utilities/recurring](/docs/scheduling/utilities/recurring) | …splay during specific hours: --- ## Recurring Announcements ### Daily Recurring Show every day at a spe… |
| `recurring` | [/docs/scheduling/utilities/recurring](/docs/scheduling/utilities/recurring) | …to appear at specific times, dates, or recurring intervals using `@tour-kit/scheduling`. --- ## Why Schedu… |
| `Timezone` | [/docs/scheduling/utilities/timezone](/docs/scheduling/utilities/timezone) | …during specific times: --- ## User Timezone Detection Automatically detect and respect user timezone:… |
| `timezone` | [/docs/scheduling/utilities/timezone](/docs/scheduling/utilities/timezone) | …Automatically detect and respect user timezone: <Callout type="info"> When `useUserTimezone: true`, the… |
| `@tour-kit/scheduling` | [/docs/scheduling](/docs/scheduling) | …s, dates, or recurring intervals using `@tour-kit/scheduling`. --- ## Why Schedule Announcements Time-based schedulin… |

### `/docs/guides/i18n` (8 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …\| `Hi there` \| ## `useT()` in a custom step Inside any component rendered under `<LocaleProvider>… |
| `Tour` | [/docs/react/components/tour](/docs/react/components/tour) | …from 'fumadocs-ui/components/callout' Tour Kit ships first-class i18n primitives in `@tour-kit/core`.… |
| `@tour-kit/core` | [/docs/core](/docs/core) | …t ships first-class i18n primitives in `@tour-kit/core`. Every UI package — `@tour-kit/react`, `@tour-kit/hints`,… |
| `@tour-kit/react` | [/docs/react](/docs/react) | …n `@tour-kit/core`. Every UI package — `@tour-kit/react`, `@tour-kit/hints`, `@tour-kit/checklists`, `@tour-kit/sur… |
| `@tour-kit/hints` | [/docs/hints](/docs/hints) | …Every UI package — `@tour-kit/react`, `@tour-kit/hints`, `@tour-kit/checklists`, `@tour-kit/surveys`, `@tour-kit/a… |
| `@tour-kit/announcements` | [/docs/announcements](/docs/announcements) | …-kit/checklists`, `@tour-kit/surveys`, `@tour-kit/announcements` — consumes them automatically once `<LocaleProvider>` is m… |
| `@tour-kit/checklists` | [/docs/checklists](/docs/checklists) | …`@tour-kit/react`, `@tour-kit/hints`, `@tour-kit/checklists`, `@tour-kit/surveys`, `@tour-kit/announcements` — consumes… |
| `@tour-kit/surveys` | [/docs/surveys](/docs/surveys) | …ur-kit/hints`, `@tour-kit/checklists`, `@tour-kit/surveys`, `@tour-kit/announcements` — consumes them automatically o… |

### `/docs/guides/persistence` (8 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `Custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …y` \| Page only \| Yes \| SSR, testing \| \| Custom adapter \| Your choice \| Depends \| API backend, IndexedDB \|… |
| `custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …rsistence For server-side storage, use custom handlers: --- ## Announcement Persistence Announcement… |
| `Checklist` | [/docs/checklists/components/checklist](/docs/checklists/components/checklist) | …it - Dismissed announcements reappear - Checklist progress is lost on refresh - Feature adoption tracking res… |
| `progress` | [/docs/checklists/utilities/progress](/docs/checklists/utilities/progress) | …all packages, allowing you to save user progress, dismissed announcements, checklist completion, and feature… |
| `logger` | [/docs/core/utilities/logger](/docs/core/utilities/logger) | …setItem` errors are caught, logged via `logger.warn`, and swallowed. - **Stale schema** — a blob written b… |
| `Tour` | [/docs/react/components/tour](/docs/react/components/tour) | …ydrate client-side. </Callout> --- ## Tour Persistence The `usePersistence` hook saves tour progress… |
| `@tour-kit/adoption` | [/docs/adoption](/docs/adoption) | …n --- ## Adoption Persistence The `@tour-kit/adoption` package tracks feature usage over time. ### Persisted Sta… |
| `@tour-kit/checklists` | [/docs/checklists](/docs/checklists) | …--- ## Checklist Persistence The `@tour-kit/checklists` package persists task completion and dismissal state. ###… |

### `/docs/use-cases/saas-onboarding` (8 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `Amplitude` | [/docs/analytics/plugins/amplitude](/docs/analytics/plugins/amplitude) | …with your provider (Mixpanel, PostHog, Amplitude, GA4, or a custom sink) and every tour/step event is captur… |
| `custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …Mixpanel, PostHog, Amplitude, GA4, or a custom sink) and every tour/step event is captured automatically.… |
| `Mixpanel` | [/docs/analytics/plugins/mixpanel](/docs/analytics/plugins/mixpanel) | …s/analytics) plugin with your provider (Mixpanel, PostHog, Amplitude, GA4, or a custom sink) and every tour/… |
| `dependencies` | [/docs/checklists/utilities/dependencies](/docs/checklists/utilities/dependencies) | …rs can re-open on each visit, with task dependencies and completion persistence built in. ## Instrument activ… |
| `progress` | [/docs/checklists/utilities/progress](/docs/checklists/utilities/progress) | …hecklists) package renders a persistent progress widget that users can re-open on each visit, with task depe… |
| `TourStep` | [/docs/react/components/tour-step](/docs/react/components/tour-step) | …Wrap your dashboard in a `Tour`, point `TourStep` elements at the UI you want to highlight, and the library… |
| `Tour` | [/docs/react/components/tour](/docs/react/components/tour) | …from 'fumadocs-ui/components/callout' Tour Kit is a headless React library for building first-run onbo… |
| `@tour-kit/react` | [/docs/react](/docs/react) | …tom tour UI. Ready to build? [Install `@tour-kit/react`](/docs/getting-started/installation) and ship your first o… |

### `/docs/adoption/types` (7 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `Custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …Usage) => boolean', description: 'Custom adoption logic', }, }} /> ### FeatureResources <T… |
| `custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …ithout use before churning', }, custom: { type: '(usage: FeatureUsage) => boolean', de… |
| `Variants` | [/docs/announcements/components/variants](/docs/announcements/components/variants) | …tionStatsGrid>` dashboard widget. ## Variants Types CVA-derived variant prop types. Use these when exten… |
| `Tour` | [/docs/react/components/tour](/docs/react/components/tour) | …type: 'string', description: 'Tour ID from @tour-kit/react', }, hintIds: { type:… |
| `Examples` | [/docs/react/headless/examples](/docs/react/headless/examples) | …}, }} /> ### FeatureTrigger **Examples:** ### AdoptionCriteria <TypeTable type={{ minU… |
| `@tour-kit/react` | [/docs/react](/docs/react) | …ring', description: 'Tour ID from @tour-kit/react', }, hintIds: { type: 'string[]', descr… |
| `@tour-kit/hints` | [/docs/hints](/docs/hints) | …g[]', description: 'Hint IDs from @tour-kit/hints', }, }} /> ### FeatureUsage <TypeTable type={{… |

### `/docs/ai/tour-integration` (7 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …object directly. Useful in tests or in custom hosts: Returns `null`-shaped context when `isActive` is… |
| `progress` | [/docs/checklists/utilities/progress](/docs/checklists/utilities/progress) | …total steps, completed tours, checklist progress). Re-assembled on every render. 2. **`askAboutStep()`** — s… |
| `useTour` | [/docs/core/hooks/use-tour](/docs/core/hooks/use-tour) | …as a navigation surface Combine with `useTour` from `@tour-kit/react` to let the assistant drive tour nav… |
| `TourProvider` | [/docs/core/providers/tour-provider](/docs/core/providers/tour-provider) | …is works because the `@tour-kit/react` `TourProvider` exposes the active tour via context, and `useTourAssistant… |
| `Tour` | [/docs/react/components/tour](/docs/react/components/tour) | …Tour integration is the differentiator for `@tour-kit/ai`. A gen… |
| `@tour-kit/react` | [/docs/react](/docs/react) | …`useAiChat`) This works because the `@tour-kit/react` `TourProvider` exposes the active tour via context, and `u… |
| `@tour-kit/ai` | [/docs/ai](/docs/ai) | …integration is the differentiator for `@tour-kit/ai`. A generic chat widget answers "how do I save a file?" — t… |

### `/docs/analytics/plugins/google-analytics` (7 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `Funnel` | [/docs/adoption/dashboard/funnel](/docs/adoption/dashboard/funnel) | …n Google Analytics ### Tour Completion Funnel Create a funnel exploration to analyze tour completion: 1… |
| `Console` | [/docs/analytics/plugins/console](/docs/analytics/plugins/console) | …View 2. Events appear in real-time ### Console Debugging Use the console plugin alongside GA4: ## Best… |
| `console` | [/docs/analytics/plugins/console](/docs/analytics/plugins/console) | …is Loaded The plugin will warn in the console if gtag is not available: ### Enable Debug Mode Use GA4… |
| `Custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …licked` \| `tourkit_hint_clicked` \| ### Custom Prefix ### No Prefix ## Event Parameters Events incl… |
| `custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …vent count ### Custom Report Create a custom report for tour analytics: 1. Go to Explore > Blank 2. Dim… |
| `dependencies` | [/docs/checklists/utilities/dependencies](/docs/checklists/utilities/dependencies) | …ibrary. ## Installation No additional dependencies required - the plugin uses the global `gtag` function that… |
| `Tour` | [/docs/react/components/tour](/docs/react/components/tour) | …## Analytics in Google Analytics ### Tour Completion Funnel Create a funnel exploration to analyze t… |

### `/docs/announcements/changelog` (7 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `console` | [/docs/analytics/plugins/console](/docs/analytics/plugins/console) | …liminates the `DialogTitle is required` console warning. - Install graph: `@tour-kit/analytics` moved from… |
| `Custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …4.1.0 — Priority queue comparator fix Custom `priorityWeights` and `priorityOrder: 'fifo' \| 'lifo'` from… |
| `dependencies` | [/docs/checklists/utilities/dependencies](/docs/checklists/utilities/dependencies) | …cleanup, no API changes. - **Updated dependencies** lines mean the version bump was triggered by a dependen… |
| `helpers` | [/docs/core/utilities/helpers](/docs/core/utilities/helpers) | …looked wrong, this release is why. New helpers exposed: `createAnnouncementComparator(order, weights, sequ… |
| `@tour-kit/core` | [/docs/core](/docs/core) | …s triggered by a dependency (usually `@tour-kit/core`) — the announcement package itself hasn't shipped behavi… |
| `@tour-kit/analytics` | [/docs/analytics](/docs/analytics) | …red` console warning. - Install graph: `@tour-kit/analytics` moved from optional peer to direct dependency. No more m… |
| `@tour-kit/announcements` | [/docs/announcements](/docs/announcements) | …). </Callout> Release history for the `@tour-kit/announcements` package. Every entry below is auto-generated by [Changeset… |

### `/docs/announcements/configuration/frequency` (7 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `Conditional` | [/docs/adoption/components/conditional](/docs/adoption/components/conditional) | …erns ### Reset After Completion ### Conditional Frequency ### Progressive Disclosure Show different ann… |
| `custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …tside React (tests, server-side checks, custom orchestrators). ### canShowByFrequency Returns `true` w… |
| `helpers` | [/docs/core/utilities/helpers](/docs/core/utilities/helpers) | …## TypeScript --- ## Programmatic helpers Pure functions for evaluating frequency rules outside Reac… |
| `Storage` | [/docs/core/utilities/storage](/docs/core/utilities/storage) | …cements based on view count: --- ## Storage Frequency state is persisted using the storage option:… |
| `storage` | [/docs/core/utilities/storage](/docs/core/utilities/storage) | …User closes all browser tabs - Session storage is cleared - Browser is restarted --- ## Always Show eve… |
| `Examples` | [/docs/react/headless/examples](/docs/react/headless/examples) | …y reminders - Recurring promotions ### Examples ### How It Works The interval starts from the last time… |
| `Recurring` | [/docs/scheduling/utilities/recurring](/docs/scheduling/utilities/recurring) | …tes - Weekly tips - Monthly reminders - Recurring promotions ### Examples ### How It Works The interval… |

### `/docs/api/adoption` (7 candidates)

| Symbol mention | Suggested link | Excerpt |
| --- | --- | --- |
| `useFunnelData` | [/docs/adoption/hooks/use-funnel-data](/docs/adoption/hooks/use-funnel-data) | …s ### UseFunnelDataInput Used by `useFunnelData()` to derive a current-state funnel from `useAdoptionStats`… |
| `Custom` | [/docs/analytics/plugins/custom](/docs/analytics/plugins/custom) | …\| \| `render` \| `(props) => ReactNode` \| Custom render function \| \| `asChild` \| `boolean` \| Merge props to… |
| `Position` | [/docs/core/utilities/position](/docs/core/utilities/position) | …------------\| \| `position` \| `string` \| Position of nudge \| \| `delay` \| `number` \| Delay before showing (ms)… |
| `position` | [/docs/core/utilities/position](/docs/core/utilities/position) | …tion \| \|------\|------\|-------------\| \| `position` \| `string` \| Position of nudge \| \| `delay` \| `number` \| De… |
| `Storage` | [/docs/core/utilities/storage](/docs/core/utilities/storage) | …tions \| \| `storage` \| `StorageConfig` \| Storage configuration \| \| `nudge` \| `NudgeConfig` \| Nudge configura… |
| `storage` | [/docs/core/utilities/storage](/docs/core/utilities/storage) | …[]` \| Array of feature definitions \| \| `storage` \| `StorageConfig` \| Storage configuration \| \| `nudge` \| `N… |
| `@tour-kit/analytics` | [/docs/analytics](/docs/analytics) | …analytics) — wire adoption events into `@tour-kit/analytics`. - [Adoption analytics guide](/docs/guides/adoption-analyt… |

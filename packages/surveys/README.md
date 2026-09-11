# @tour-kit/surveys

> React in-app microsurveys — NPS, CSAT, CES with skip logic, audience targeting, fatigue prevention and 5 display modes.

[![npm version](https://img.shields.io/npm/v/@tour-kit/surveys.svg)](https://www.npmjs.com/package/@tour-kit/surveys)
[![npm downloads](https://img.shields.io/npm/dm/@tour-kit/surveys.svg)](https://www.npmjs.com/package/@tour-kit/surveys)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@tour-kit/surveys?label=gzip)](https://bundlephobia.com/package/@tour-kit/surveys)
[![types](https://img.shields.io/npm/types/@tour-kit/surveys.svg)](https://www.npmjs.com/package/@tour-kit/surveys)

Drop-in **in-app microsurveys** for React — **NPS**, **CSAT**, **CES**, and custom feedback flows with skip logic, audience targeting, sampling, snooze, and built-in fatigue prevention. Five display modes: Modal, Slideout, Banner, Popover, Inline.

> **Pro tier** — requires a license key. See [Licensing](https://usertourkit.com/docs/licensing).

**Alternative to:** [Delighted](https://delighted.com/), [Sprig](https://sprig.com/), [Wootric](https://www.wootric.com/), [Typeform](https://www.typeform.com/) embedded surveys, [Pendo](https://www.pendo.io/) feedback, [Hotjar](https://www.hotjar.com/) surveys.

## Features

- **NPS, CSAT, CES** with built-in scoring helpers (`calculateNPS`, `calculateCSAT`, `calculateCES`)
- **5 display modes** — Modal, Slideout, Banner, Popover, Inline
- **Skip logic** — conditional question flow based on previous answers, with cycle detection
- **Fatigue prevention** — global cooldown, sampling rate, snooze, max-per-session, frequency rules
- **Audience targeting** — show only to matching user segments
- **Question types** — rating, text, textarea, single-select, multi-select, boolean
- **Persistence** — partial answers survive reload via storage adapter
- **TypeScript-first**, supports React 18 & 19

## Installation

```bash
npm install @tour-kit/surveys @tour-kit/license
# or
pnpm add @tour-kit/surveys @tour-kit/license
```

## Quick Start

```tsx
import { LicenseProvider } from '@tour-kit/license'
import { SurveysProvider, SurveyModal } from '@tour-kit/surveys'

const npsSurvey = {
  id: 'nps-q4',
  type: 'nps',
  displayMode: 'modal',
  title: 'How likely are you to recommend us?',
  questions: [
    {
      id: 'score',
      type: 'rating',
      scale: { min: 0, max: 10 },
      label: '0 = Not likely, 10 = Extremely likely',
    },
    {
      id: 'reason',
      type: 'textarea',
      label: 'What is the main reason for your score?',
    },
  ],
  frequency: { type: 'interval', days: 90 },
}

function App() {
  return (
    <LicenseProvider licenseKey={process.env.NEXT_PUBLIC_TOURKIT_LICENSE!}>
      <SurveysProvider surveys={[npsSurvey]} userContext={{ plan: 'pro' }}>
        <SurveyModal id="nps-q4" />
        <YourApp />
      </SurveysProvider>
    </LicenseProvider>
  )
}
```

## i18n & interpolation

All user-facing strings in `@tour-kit/surveys` accept the `{{var | fallback}}` interpolation grammar from `@tour-kit/core`. Wrap your tree in `<LocaleProvider>` and every survey title and question label resolves automatically.

```tsx
import { LocaleProvider } from '@tour-kit/core'
import { SurveysProvider, SurveyModal } from '@tour-kit/surveys'

const survey = {
  id: 'nps-q4',
  type: 'nps',
  displayMode: 'modal',
  title: { key: 'nps.title' },
  questions: [{ id: 'score', type: 'rating', label: 'Hi {{user.name | there}} — score 0–10', scale: { min: 0, max: 10 } }],
}

<LocaleProvider locale="en" messages={{ 'nps.title': 'How likely is {{user.name | a friend}} to recommend us?' }}>
  <SurveysProvider surveys={[survey]}>
    <SurveyModal id="nps-q4" />
  </SurveysProvider>
</LocaleProvider>
```

> Full guide: https://usertourkit.com/docs/guides/i18n

## Survey types

| Type | Scoring |
|---|---|
| **NPS** | 0–10 rating → promoters / passives / detractors |
| **CSAT** | rating with positive/negative threshold |
| **CES** | effort score → easy / neutral / difficult |
| **Custom** | arbitrary question flows |

## Display modes

| Mode | When to use |
|---|---|
| **Modal** | High-priority survey, blocks UI |
| **Slideout** | Detailed survey, non-blocking side panel |
| **Banner** | Lightweight, top/bottom strip |
| **Popover** | Contextual feedback near a target element |
| **Inline** | Embedded in page flow (settings, dashboards) |

## Question types

```ts
type QuestionType =
  | 'rating'                // numeric scale (NPS 0-10, stars, emoji)
  | 'text' | 'textarea'
  | 'single-select' | 'multi-select'
  | 'boolean'
```

## Fatigue prevention

| Mechanism | Description |
|---|---|
| **Global cooldown** | Minimum days between any two surveys (checked first) |
| **Sampling rate** | 0.0–1.0 probability of showing on mount |
| **Snooze** | User-initiated delay; configurable max snooze count |
| **Max per session** | Hard cap on surveys shown in one browser session |
| **Frequency rules** | `once`, `session`, `always`, `{ type: 'times', count: N }`, `{ type: 'interval', days: N }` |

## Skip logic

```ts
const survey = {
  id: 'csat',
  type: 'csat',
  questions: [
    { id: 'satisfied', type: 'boolean', label: 'Are you satisfied?' },
    {
      id: 'why-not',
      type: 'textarea',
      label: 'What went wrong?',
      skipLogic: { showIf: (answers) => answers.satisfied === false },
    },
  ],
}
```

The FlowEngine tracks visited steps to prevent infinite loops in skip chains.

## API Reference

### Provider & context

```ts
import { SurveysProvider, useSurveysContext } from '@tour-kit/surveys'
```

### Hooks

| Hook | Description |
|---|---|
| `useSurvey(id)` | Single survey state + `show`, `dismiss`, `complete`, `answer`, `next`, `prev`, `snooze` |
| `useSurveys()` | All registered surveys + queue inspection |
| `useSurveyScoring()` | Score aggregation across responses |

### Scoring functions

```ts
import { calculateNPS, calculateCSAT, calculateCES } from '@tour-kit/surveys'

const result = calculateNPS(responses)
// { score: 42, promoters: 60, passives: 22, detractors: 18 }
```

### Display components

| Export | Mode |
|---|---|
| `SurveyModal` | Centered dialog |
| `SurveySlideout` | Side panel |
| `SurveyBanner` | Top/bottom strip |
| `SurveyPopover` | Floating near a target |
| `SurveyInline` | Embedded in page flow |

### Question components

`QuestionRating`, `QuestionText`, `QuestionSelect`, `QuestionBoolean`, `SurveyProgress` — each with their own `*Props` type.

### Variants (CVA)

```ts
import {
  ratingOptionVariants,
  textInputVariants,
  selectOptionVariants,
  booleanOptionVariants,
  progressBarVariants,
} from '@tour-kit/surveys'
```

### Types

```ts
import type {
  SurveyConfig,
  SurveyState,
  SurveyType,                  // 'nps' | 'csat' | 'ces' | 'custom'
  DisplayMode,                 // 'modal' | 'slideout' | 'banner' | 'popover' | 'inline'
  SurveyPriority,
  FrequencyRule,
  DismissalReason,
  SurveyStorageAdapter,
  AudienceCondition,
  // Question
  QuestionConfig, QuestionType, AnswerValue, SkipLogic, RatingScale, SelectOption,
  // Scoring
  NPSResult, CSATResult, CESResult,
  // Variant options
  ModalOptions, SlideoutOptions, BannerOptions, PopoverOptions,
  // Position
  SlideoutPosition, BannerPosition, PopoverPosition,
  // Queue
  SurveyQueueConfig, SurveyQueueItem, PriorityOrder, StackBehavior,
  // Events
  SurveyEvent, SurveyEventType,
  // Context
  SurveysContextValue, SurveysProviderProps,
} from '@tour-kit/surveys'
```

## Gotchas

- **Cooldown short-circuits.** Global cooldown is checked first — if within cooldown, no survey shows regardless of individual frequency rules.
- **Sampling on mount.** The random sampling check runs once when `SurveysProvider` mounts. To re-roll, remount the provider.
- **Partial responses persist immediately.** Each `answer()` call writes to storage; you don't lose data on reload.
- **Audience targeting needs `userContext`.** Pass it to the provider, otherwise audience-targeted surveys never show.

## Related packages

- [`@tour-kit/scheduling`](https://www.npmjs.com/package/@tour-kit/scheduling) — optional time-based gating (release windows, business hours)
- [`@tour-kit/announcements`](https://www.npmjs.com/package/@tour-kit/announcements) — modal / toast / banner announcements
- [`@tour-kit/analytics`](https://www.npmjs.com/package/@tour-kit/analytics) — track survey events to PostHog, Mixpanel, etc.
- [`@tour-kit/license`](https://www.npmjs.com/package/@tour-kit/license) — required Pro license validation

## Documentation

Full documentation: [https://usertourkit.com/docs/surveys](https://usertourkit.com/docs/surveys)

## License

Business Source License 1.1 (`BUSL-1.1`) — **free in development, a key in production.**

Use Tour Kit freely for development, evaluation, testing, CI and any other non-production
purpose. Serving it to end users of a deployed application needs a Tour Kit Pro licence key,
from **$9.99 one-time** — [usertourkit.com/pricing](https://usertourkit.com/pricing). Each published version converts to the MIT licence on its
Change Date (2030-09-11). Full terms in [LICENSE.md](./LICENSE.md).

Copyright © 2026 domidex01.

## `@tour-kit/surveys/engine` — the React-free subpath

Everything that decides *whether, when and to whom* a survey shows — the queue,
the six fatigue gates, the audience, the schedule, persistence and NPS/CSAT/CES
scoring — is available with no React installed:

```ts
import { createSurveysEngine } from '@tour-kit/surveys/engine'

const engine = createSurveysEngine({
  surveys: [{ id: 'nps-q3', type: 'nps' }],
  storage: localStorage,
  onScoreCalculated: (id, type, result) => report(type, result.score),
})

engine.subscribe(() => render(engine.getState()))
await engine.boot()
```

It resolves under ESM and CJS, runs in plain Node, and pulls in no React, no
JSX runtime and no DOM. Render whatever you like from `getState()`.

**Four seams worth knowing about.**

`boot()` is async — it hydrates from storage — and it is cancellable: a
`destroy()` while the read is in flight never lands a stale state.

`storage` is an adapter *you* pass, not one the engine resolves. Anything with
`getItem`/`setItem`/`removeItem` works, sync or async.

`setTourActive(true)` suppresses surveys while something else is running, and
hides whatever is currently visible without promoting the next one. In React,
`<SurveysProvider>` wires this from the tour context for you.

`config.schedule` needs the optional `@tour-kit/scheduling` peer, reached
through a call-time `require`. That degrades *open* — a survey is never
suppressed just because the peer is missing — but an ESM bundle gets no gating
unless you inject the evaluator:

```ts
import { isScheduleActive } from '@tour-kit/scheduling/engine'

createSurveysEngine({ surveys, isScheduleActive })
```

`samplingRate` reads a roll drawn once at construction; pass `random` to make
it deterministic in tests.

> The engine path is currently **ungated**: the Pro licence check lives in
> `<SurveysProvider>`, not in the engine.

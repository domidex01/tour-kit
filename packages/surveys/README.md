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

Pro tier — see [LICENSE.md](./LICENSE.md). Requires a Tour Kit Pro license key.

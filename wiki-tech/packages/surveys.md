---
title: "@tour-kit/surveys"
type: package
package: "@tour-kit/surveys"
version: 0.1.3
sources:
  - ../packages/surveys/CLAUDE.md
  - ../packages/surveys/package.json
  - ../packages/surveys/src/index.ts
updated: 2026-04-26
---

*In-app microsurveys: NPS, CSAT, CES, and custom flows. Includes fatigue prevention, skip logic, and 5 display modes.*

## Identity

| | |
|---|---|
| Name | `@tour-kit/surveys` |
| Version | 0.1.3 |
| Tier | Pro (license-gated) |
| Deps | `@tour-kit/core`, `@tour-kit/license`, `@floating-ui/react`, `@radix-ui/react-dialog`, `class-variance-authority`, `clsx`, `tailwind-merge` |
| Optional peers | `tailwindcss`, `@mui/base`, `@tour-kit/scheduling` |

## Survey types

| Type | Scoring |
|---|---|
| **NPS** | 0–10 rating → promoters / passives / detractors |
| **CSAT** | rating with positive/negative threshold |
| **CES** | effort score → easy / neutral / difficult |
| **Custom** | arbitrary question flows |

## Question types

```ts
type QuestionType =
  | 'rating'         // numeric scale (NPS, stars, emoji)
  | 'text' | 'textarea'
  | 'single-select' | 'multi-select'
  | 'boolean'
```

## Display modes

| Mode | Use case |
|---|---|
| **Modal** | Centered dialog |
| **Slideout** | Side panel |
| **Banner** | Top/bottom strip |
| **Popover** | Floating near a target element |
| **Inline** | Embedded in page flow |

## Public API

### Provider & context

```ts
SurveysProvider
useSurveysContext
```

### Hooks

```ts
useSurvey(id)
useSurveys()
useSurveyScoring()
```

### Scoring functions

```ts
calculateNPS(responses)    → NPSResult
calculateCSAT(responses)   → CSATResult
calculateCES(responses)    → CESResult
```

### Display components

```ts
SurveyPopover, SurveyModal, SurveySlideout, SurveyBanner, SurveyInline
```

### Question components

```ts
QuestionRating, QuestionText, QuestionSelect, QuestionBoolean, SurveyProgress
```

Each with `*Props` types.

### CVA variants

```ts
ratingOptionVariants, textInputVariants, selectOptionVariants,
booleanOptionVariants, progressBarVariants
```

### Types

- **Survey**: `SurveyConfig`, `SurveyState`, `SurveyType`, `DisplayMode`, `SurveyPriority`, `FrequencyRule`, `DismissalReason`, `SurveyStorageAdapter`
- **Variant options**: `ModalOptions`, `SlideoutOptions`, `BannerOptions`, `PopoverOptions`
- **Position**: `SlideoutPosition`, `BannerPosition`, `PopoverPosition`
- **Audience**: `AudienceCondition`
- **Question**: `QuestionConfig`, `QuestionType`, `AnswerValue`, `SkipLogic`, `RatingScale`, `SelectOption`
- **Scoring**: `NPSResult`, `CSATResult`, `CESResult`
- **Context**: `SurveysContextValue`, `SurveysProviderProps`
- **Queue**: `SurveyQueueConfig`, `SurveyQueueItem`, `PriorityOrder`, `StackBehavior`
- **Events**: `SurveyEvent`, `SurveyEventType`, `BaseSurveyEvent`, `SurveyShownEvent`, `SurveyDismissedEvent`, `SurveySnoozedEvent`, `SurveyCompletedEvent`, `SurveyQuestionAnsweredEvent`, `SurveyScoreCalculatedEvent`

## Fatigue prevention

| Mechanism | Description |
|---|---|
| **Global cooldown** | Minimum days between *any* two surveys (checked first) |
| **Sampling rate** | `0.0–1.0` probability of show on a per-mount basis |
| **Snooze** | User-initiated delay; max snooze count per survey |
| **Max per session** | Hard cap on surveys shown in one session |
| **Frequency rules** | `once` / `session` / `always` / `times,N` / `interval,Ndays` |

## Skip logic

Conditional question flow based on previous answers. Supports function predicates for arbitrary logic. Cycle detection lives in the FlowEngine via visited-step tracking.

## Gotchas

- **Cooldown short-circuits.** Global cooldown is the first check. If within cooldown, no survey shows — individual frequency rules don't get evaluated.
- **Sampling on mount.** The random check happens once when `SurveysProvider` mounts, not on each `show()` call. To re-roll, remount the provider.
- **Skip-logic cycles.** FlowEngine tracks visited steps to prevent infinite loops in skip chains.
- **Partial responses persist immediately.** Each `answer()` call writes to storage, not just on `complete()`.

## Related

- [packages/core.md](core.md) — storage adapters
- [packages/scheduling.md](scheduling.md) — optional peer for time-based gating
- [packages/license.md](license.md) — gating
- [concepts/queue-and-frequency.md](../concepts/queue-and-frequency.md)
- [concepts/audience-targeting.md](../concepts/audience-targeting.md)

# @tour-kit/surveys

In-app microsurveys: NPS, CSAT, CES, and custom feedback with fatigue prevention.

## Key Concepts

### Survey Types
- **NPS** - Net Promoter Score (0-10 rating, promoters/passives/detractors)
- **CSAT** - Customer Satisfaction Score (positive/negative threshold)
- **CES** - Customer Effort Score (easy/difficult/neutral)
- **Custom** - Arbitrary question flows

### Question Types
- `rating` - Numeric scale (NPS, stars, emoji)
- `text` / `textarea` - Free-form text input
- `single-select` / `multi-select` - Option lists
- `boolean` - Yes/No toggle

### Display Modes
- **Modal** - Centered dialog
- **Slideout** - Side panel
- **Banner** - Top/bottom strip
- **Popover** - Floating near target element
- **Inline** - Embedded in page flow

### Fatigue Prevention
- **Global cooldown** - Minimum days between any two surveys
- **Sampling rate** - Probability (0-1) that a user sees a survey
- **Snooze** - User-initiated delay with max snooze count
- **Max per session** - Limit surveys shown in one session
- **Frequency rules** - once, session, always, N times, every N days

### Skip Logic
- Conditional question flow based on previous answers
- Function predicates for maximum flexibility
- Cycle detection via visited-step tracking

## Architecture

```
types/       - All type definitions (survey, question, scoring, context, events, queue)
core/        - Priority queue, scheduler, frequency checker, audience targeting
context/     - SurveysProvider with useReducer
hooks/       - useSurvey, useSurveys, useSurveyQueue
components/  - Modal, Slideout, Banner, Popover, Inline + headless variants
lib/         - cn(), UnifiedSlot, UILibraryContext
styles/      - CSS custom properties
```

## Gotchas

- **Global cooldown vs per-survey frequency**: Global cooldown is checked first; if within cooldown, no survey shows regardless of individual frequency rules
- **Sampling rate evaluated on mount**: The random check happens once when the provider mounts, not on each show() call
- **Skip logic cycle detection**: FlowEngine tracks visited steps to prevent infinite loops in skip logic chains
- **Partial responses persist immediately**: Each answer() call persists to storage, not just on complete()

## Commands

```bash
pnpm --filter @tour-kit/surveys build
pnpm --filter @tour-kit/surveys typecheck
pnpm --filter @tour-kit/surveys test
```

## Related Rules
- `tour-kit/rules/components.md` - Component patterns
- `tour-kit/rules/accessibility.md` - A11y requirements

# Feature Expansion Roadmap

> Closing the gap between tour-kit and $250-900/mo SaaS platforms.
> These four packages would make tour-kit the first open-source library with true feature parity against commercial digital adoption platforms.

---

## 1. @tour-kit/surveys

**Priority**: Highest — every SaaS competitor has this, no OSS library does.

### What It Is

In-app microsurveys for collecting NPS, CSAT, CES, and custom feedback directly inside the product. Lightweight, not a full survey builder — optimized for 1-5 question contextual feedback.

### Survey Types

| Type | Question | Scale | Scoring |
|------|----------|-------|---------|
| **NPS** | "How likely are you to recommend us?" | 0-10 | `%Promoters(9-10) - %Detractors(0-6)` → range -100 to +100 |
| **CSAT** | "How satisfied were you with X?" | 1-5 stars or emoji | `(positive responses / total) * 100` |
| **CES** | "X made it easy to handle my issue" | 1-7 Likert | Average score |
| **Custom** | Any question | Text, single-select, multi-select, rating scale | Raw responses |

### Question Types

- `rating` — numeric scale (NPS 0-10, stars 1-5, emoji)
- `text` — short text input
- `textarea` — long text input (follow-up feedback)
- `single-select` — radio buttons / dropdown
- `multi-select` — checkboxes
- `boolean` — yes/no toggle

### Display Modes

| Mode | Use Case |
|------|----------|
| **Popover** | Bottom-corner widget — default for microsurveys, least intrusive |
| **Modal** | Centered overlay — important surveys, post-onboarding NPS |
| **Slideout** | Side panel — longer surveys (3-5 questions) |
| **Banner** | Top/bottom strip — persistent satisfaction pulse |
| **Inline** | Embedded in page content — contextual feedback on specific features |

### Survey Fatigue Prevention

This is the key differentiator from just building a form. Surveys need cross-survey coordination:

- **Global cooldown**: After any survey is shown, suppress all surveys for N days (default: 14)
- **Per-survey frequency**: Reuse the existing `FrequencyRule` pattern from `@tour-kit/announcements` (`once`, `session`, `always`, `{ type: 'times', count }`, `{ type: 'interval', days }`)
- **Sampling rate**: Show to only X% of eligible users (e.g., 20%)
- **Snooze**: "Ask me later" with configurable return delay and max snooze count
- **Priority queue**: When multiple surveys qualify, highest-priority wins (reuse `PriorityQueue` pattern from announcements)
- **Context awareness**: Never show during active tours or critical flows

### Scoring Engine

Built-in calculators for standard metrics:

```typescript
// NPS
calculateNPS(responses: number[]): {
  score: number           // -100 to +100
  promoters: number       // count of 9-10
  passives: number        // count of 7-8
  detractors: number      // count of 0-6
  promoterPct: number
  detractorPct: number
}

// CSAT
calculateCSAT(responses: number[], positiveThreshold?: number): {
  score: number           // 0-100%
  positive: number
  negative: number
  total: number
}

// CES
calculateCES(responses: number[]): {
  score: number           // average (1-7)
  easy: number            // count >= 5
  difficult: number       // count <= 3
}
```

### Multi-Step Flow

Surveys support sequential questions with optional branching:

- Step through questions one at a time (microsurvey pattern)
- Skip logic: if NPS score < 7, show follow-up "What could we improve?"
- Progress indicator for multi-question surveys
- Partial submission: save responses as they're answered, not just on complete

### Analytics Events

| Event | Key Payload |
|-------|-------------|
| `survey_shown` | surveyId, displayMode, triggerType |
| `survey_dismissed` | surveyId, reason, questionsAnswered, viewDuration |
| `survey_snoozed` | surveyId, snoozeCount, returnAfterDays |
| `survey_completed` | surveyId, responseCount, totalDuration |
| `survey_question_answered` | surveyId, questionId, questionType, answer, timeToAnswer |
| `survey_score_calculated` | surveyId, scoreType (nps/csat/ces), score, category |

### Package Structure

```
packages/surveys/
├── src/
│   ├── index.ts                    # Public API
│   ├── headless.ts                 # Headless exports
│   ├── types/
│   │   ├── index.ts
│   │   ├── survey.ts              # SurveyConfig, SurveyState, QuestionConfig
│   │   ├── context.ts             # SurveysContextValue, SurveysProviderProps
│   │   ├── scoring.ts             # NPSResult, CSATResult, CESResult
│   │   └── events.ts              # SurveyEvent types
│   ├── core/
│   │   ├── scoring.ts             # calculateNPS, calculateCSAT, calculateCES
│   │   ├── scheduler.ts           # SurveyScheduler (fatigue + priority)
│   │   ├── frequency.ts           # Reuse pattern from announcements
│   │   └── flow.ts                # Multi-step question flow + skip logic
│   ├── context/
│   │   ├── surveys-context.ts     # SurveysContext + useSurveysContext
│   │   └── surveys-provider.tsx   # SurveysProvider (reducer + persistence)
│   ├── hooks/
│   │   ├── use-surveys.ts         # All surveys state
│   │   ├── use-survey.ts          # Single survey control
│   │   └── use-survey-scoring.ts  # Real-time score calculation
│   ├── components/
│   │   ├── survey-popover.tsx     # Bottom-corner widget (default)
│   │   ├── survey-modal.tsx       # Centered dialog
│   │   ├── survey-slideout.tsx    # Side panel
│   │   ├── survey-banner.tsx      # Top/bottom strip
│   │   ├── survey-inline.tsx      # Embedded in page
│   │   ├── question-rating.tsx    # Star/emoji/numeric rating
│   │   ├── question-text.tsx      # Text input
│   │   ├── question-select.tsx    # Single/multi select
│   │   ├── survey-progress.tsx    # Step progress indicator
│   │   ├── ui/                    # CVA variants
│   │   └── headless/              # Render-prop variants
│   └── lib/
│       ├── slot.tsx               # UnifiedSlot (copy from other packages)
│       ├── ui-library-context.tsx
│       └── utils.ts               # cn() utility
```

### API Surface

```tsx
// Provider
<SurveysProvider
  surveys={[npsConfig, csatConfig]}
  globalCooldown={14}           // days between any surveys
  samplingRate={1.0}            // 0-1, default show to everyone
  storage={localStorage}
  storageKey="tour-kit:surveys:"
  onResponse={(surveyId, questionId, answer) => {}}
  onComplete={(surveyId, responses) => {}}
>

// Declarative
<SurveyPopover id="post-onboarding-nps" />
<SurveyModal id="quarterly-feedback" />

// Hooks
const { show, dismiss, responses, score } = useSurvey('nps-q1')
const { nps, promoters, detractors } = useSurveyScoring('nps-q1', 'nps')
const { surveys, activeSurvey } = useSurveys()

// Headless
<HeadlessSurvey id="nps">
  {({ questions, currentStep, answer, next, back, progress }) => (
    <MyCustomUI />
  )}
</HeadlessSurvey>
```

### Dependencies

- `@tour-kit/core` (logger, storage utilities)
- `@floating-ui/react` (popover positioning)
- `@radix-ui/react-dialog` (modal/slideout)
- `class-variance-authority`, `clsx`, `tailwind-merge` (styling)
- No external survey libraries — keep it lightweight

### Bundle Budget

< 5KB gzipped (no heavy dependencies, just React components + scoring math)

---

## 2. @tour-kit/segmentation

**Priority**: High — without this, nothing can be personalized.

### What It Is

A client-side rule engine for targeting tours, announcements, surveys, and any other content to specific user segments. Evaluates conditions against user attributes, events, and behavioral data.

### Why It Matters

Every SaaS platform gates features behind segmentation. Without it, every user sees the same tours, the same announcements, the same surveys. Segmentation turns a static onboarding tool into a personalized one.

### Rule Structure

Rules compose with `all` (AND), `any` (OR), and `not` operators, nesting arbitrarily:

```typescript
type SegmentRule =
  | { all: SegmentRule[] }                    // AND
  | { any: SegmentRule[] }                    // OR
  | { not: SegmentRule }                      // NOT
  | { fact: string; operator: Operator; value: unknown }  // Leaf condition

type Operator =
  // Equality
  | 'equal' | 'notEqual'
  // Numeric
  | 'greaterThan' | 'lessThan' | 'greaterThanInclusive' | 'lessThanInclusive'
  // String
  | 'contains' | 'doesNotContain' | 'startsWith' | 'endsWith' | 'matches'
  // Set
  | 'in' | 'notIn'
  // Existence
  | 'exists' | 'notExists'
  // Date
  | 'before' | 'after' | 'within'
  // Boolean
  | 'isTrue' | 'isFalse'
```

### Segment Definition

```typescript
interface Segment {
  id: string
  name: string
  description?: string
  rules: SegmentRule
}

// Examples
const newUsers: Segment = {
  id: 'new-users',
  name: 'New Users',
  rules: {
    all: [
      { fact: 'signupDate', operator: 'within', value: { days: 7 } },
      { fact: 'completedOnboarding', operator: 'equal', value: false },
    ]
  }
}

const powerUsers: Segment = {
  id: 'power-users',
  name: 'Power Users',
  rules: {
    all: [
      { fact: 'plan', operator: 'in', value: ['pro', 'enterprise'] },
      { fact: 'loginCount', operator: 'greaterThan', value: 50 },
      { not: { fact: 'role', operator: 'equal', value: 'viewer' } }
    ]
  }
}
```

### Fact Sources

Facts are the data points rules evaluate against. The engine supports three sources:

```typescript
interface FactSource {
  // Static attributes (set once, rarely change)
  attributes: {
    userId: string
    email: string
    plan: 'free' | 'pro' | 'enterprise'
    role: 'admin' | 'editor' | 'viewer'
    signupDate: Date
    company: string
    // ... any custom attributes
  }

  // Dynamic facts (computed on demand)
  computed: {
    loginCount: () => number
    lastActiveAt: () => Date
    completedOnboarding: () => boolean
    featureUsage: (featureId: string) => number
    // ... any async or sync function
  }

  // Event-based facts (aggregated from tracked events)
  events: {
    tourCompleted: string[]      // IDs of completed tours
    featuresUsed: string[]       // IDs of used features
    lastSurveyAt: Date | null
  }
}
```

### Evaluation

Client-side evaluation — no network calls, instant results:

```typescript
// Core function
evaluateSegment(segment: Segment, facts: FactSource): boolean

// With detail (for debugging)
evaluateSegmentDetailed(segment: Segment, facts: FactSource): {
  matches: boolean
  evaluatedRules: number
  failedRule?: SegmentRule    // first rule that failed
  duration: number            // ms
}
```

### Integration with Other Packages

This is the cross-cutting concern. Every package that shows content to users should accept a segment:

```typescript
// Tours
<Tour id="pro-onboarding" segment="pro-users">

// Announcements
const announcement: AnnouncementConfig = {
  id: 'new-feature',
  audience: { segment: 'power-users' },  // already has audience field
}

// Surveys
<SurveyPopover id="nps" segment="active-30d" />

// Checklists
<Checklist id="onboarding" segment="new-users" />
```

The `SegmentationProvider` sits above all other providers and makes `evaluateSegment()` available via context. Packages call it internally when they have an `audience` or `segment` prop.

### Package Structure

```
packages/segmentation/
├── src/
│   ├── index.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── segment.ts            # Segment, SegmentRule, Operator
│   │   ├── facts.ts              # FactSource, FactResolver
│   │   └── context.ts            # SegmentationContextValue, ProviderProps
│   ├── engine/
│   │   ├── evaluator.ts          # evaluateSegment(), evaluateRule()
│   │   ├── operators.ts          # Operator implementations
│   │   └── facts.ts              # Fact resolution (sync + async)
│   ├── context/
│   │   ├── segmentation-context.ts
│   │   └── segmentation-provider.tsx
│   ├── hooks/
│   │   ├── use-segment.ts        # Check if current user matches a segment
│   │   ├── use-segments.ts       # All segments state
│   │   └── use-segmentation.ts   # Direct access to evaluator
│   ├── components/
│   │   ├── if-segment.tsx         # <IfSegment match="new-users">...</IfSegment>
│   │   └── segment-gate.tsx       # <SegmentGate segment="pro" fallback={<Upgrade />}>
│   └── presets/
│       └── common-segments.ts     # newUsers, returningUsers, trialExpiring, etc.
```

### API Surface

```tsx
// Provider (wraps entire app, above other tour-kit providers)
<SegmentationProvider
  segments={[newUsers, powerUsers, trialExpiring]}
  user={{
    id: 'user-123',
    attributes: { plan: 'pro', role: 'admin', signupDate: new Date('2026-01-15') },
    events: { tourCompleted: ['onboarding'], featuresUsed: ['dark-mode'] },
  }}
  computedFacts={{
    loginCount: () => getLoginCount(),
    lastActiveAt: () => getLastActive(),
  }}
>

// Conditional rendering
<IfSegment match="new-users">
  <OnboardingChecklist />
</IfSegment>

<SegmentGate segment="pro-users" fallback={<UpgradePrompt />}>
  <AdvancedFeature />
</SegmentGate>

// Hooks
const isNewUser = useSegment('new-users')         // boolean
const { matches, evaluate } = useSegmentation()    // direct evaluator access
```

### Custom Operators

Extensible operator registry for domain-specific logic:

```typescript
<SegmentationProvider
  customOperators={{
    'hasBillingIssue': (factValue, ruleValue) => checkBilling(factValue),
    'withinGeo': (factValue, ruleValue) => isInRegion(factValue, ruleValue),
  }}
>
```

### Bundle Budget

< 3KB gzipped (pure logic, no UI components beyond conditional renderers)

---

## 3. @tour-kit/resource-center

**Priority**: Medium-high — standard in Pendo, Appcues, UserGuiding, Whatfix, WalkMe.

### What It Is

A floating help widget that aggregates tours, checklists, announcements, docs, and custom content into a single searchable panel. The "help hub" that lives in the corner of the app.

### Why It Matters

Without a resource center, each piece of onboarding content (tours, checklists, announcements) exists in isolation. Users have no way to discover available help or re-access tours they dismissed. The resource center ties everything together.

### Content Modules

The resource center aggregates content from other tour-kit packages:

| Module Type | Source | Description |
|-------------|--------|-------------|
| **Tours** | `@tour-kit/react` | Available and completed tours with replay |
| **Checklists** | `@tour-kit/checklists` | Active checklists with progress |
| **Announcements** | `@tour-kit/announcements` | Recent announcements with unread badge |
| **Surveys** | `@tour-kit/surveys` | Pending surveys |
| **Articles** | Custom/external | Help articles, FAQs, guides |
| **Links** | Custom | External URLs (docs site, support, community) |
| **Custom** | Render prop | Any custom React content |

### Widget Patterns

Two complementary access patterns:

#### 1. Floating Panel (Primary)

- Fixed-position button (bottom-right by default, configurable)
- Opens a sidebar panel with module tabs
- Badge shows unread count (new announcements, pending checklists)
- Search bar filters across all modules
- Sections/categories for organizing content

#### 2. Command Palette (Optional Enhancement)

- CMD+K / Ctrl+K keyboard shortcut
- Search-first interface using `cmdk` (same library behind shadcn/ui Command)
- Quick actions: start a tour, open a checklist, read an article
- Fuzzy search across all registered content

### Content Registry

Each module registers its content with the resource center:

```typescript
interface ResourceItem {
  id: string
  type: 'tour' | 'checklist' | 'announcement' | 'survey' | 'article' | 'link' | 'custom'
  title: string
  description?: string
  icon?: React.ReactNode
  category?: string
  tags?: string[]
  status?: 'new' | 'in-progress' | 'completed' | 'unread'
  priority?: number
  action: () => void           // What happens when clicked
  segment?: string             // Optional targeting (uses @tour-kit/segmentation)
}
```

### Auto-Registration

If other tour-kit providers are present, the resource center auto-discovers their content:

```typescript
// Tours auto-registered from MultiTourKitProvider
// Checklists auto-registered from ChecklistProvider
// Announcements auto-registered from AnnouncementsProvider
// Manual registration for articles and links
```

### Search

- Fuzzy search across title, description, tags, and category
- Grouped results by module type
- Keyboard navigation through results
- Recent searches (optional persistence)

### Package Structure

```
packages/resource-center/
├── src/
│   ├── index.ts
│   ├── headless.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── resource.ts           # ResourceItem, ResourceModule, ResourceCategory
│   │   ├── context.ts            # ResourceCenterContextValue, ProviderProps
│   │   └── search.ts             # SearchConfig, SearchResult
│   ├── core/
│   │   ├── registry.ts           # Content registry (register/unregister items)
│   │   ├── search.ts             # Fuzzy search engine
│   │   └── auto-discover.ts      # Auto-register from other providers
│   ├── context/
│   │   ├── resource-center-context.ts
│   │   └── resource-center-provider.tsx
│   ├── hooks/
│   │   ├── use-resource-center.ts     # Open/close, search, navigate
│   │   ├── use-resource-search.ts     # Search with debounce
│   │   └── use-unread-count.ts        # Badge count
│   ├── components/
│   │   ├── resource-center.tsx         # Main widget (trigger + panel)
│   │   ├── resource-trigger.tsx        # Floating button with badge
│   │   ├── resource-panel.tsx          # Sidebar panel
│   │   ├── resource-search.tsx         # Search input
│   │   ├── resource-list.tsx           # Grouped item list
│   │   ├── resource-item.tsx           # Individual item row
│   │   ├── resource-tabs.tsx           # Module type tabs
│   │   ├── command-palette.tsx         # CMD+K interface (optional)
│   │   ├── ui/                         # CVA variants
│   │   └── headless/                   # Render-prop variants
│   └── lib/
│       ├── slot.tsx
│       ├── ui-library-context.tsx
│       └── utils.ts
```

### API Surface

```tsx
// Provider
<ResourceCenterProvider
  modules={[
    {
      type: 'articles',
      items: [
        { id: 'getting-started', title: 'Getting Started', action: () => openDocs('/start') },
        { id: 'keyboard-shortcuts', title: 'Keyboard Shortcuts', action: () => openDocs('/keys') },
      ]
    },
    {
      type: 'links',
      items: [
        { id: 'docs', title: 'Documentation', action: () => window.open('https://tourkit.dev') },
        { id: 'support', title: 'Contact Support', action: () => openIntercom() },
      ]
    },
  ]}
  autoDiscover={true}          // Auto-register tours, checklists, announcements
  position="bottom-right"
  searchEnabled={true}
>

// Widget (renders trigger button + panel)
<ResourceCenter />

// Or compose individually
<ResourceTrigger />
<ResourcePanel />

// Command palette (optional, separate from panel)
<CommandPalette shortcut="mod+k" />

// Hooks
const { open, close, isOpen, search, results, unreadCount } = useResourceCenter()
```

### Dependencies

- `@tour-kit/core` (logger, utilities)
- `@floating-ui/react` (panel positioning)
- `@radix-ui/react-dialog` (panel overlay)
- `cmdk` (command palette — optional peer dependency)
- `class-variance-authority`, `clsx`, `tailwind-merge`

### Bundle Budget

< 6KB gzipped (search engine + UI components, cmdk is optional peer dep)

---

## 4. @tour-kit/experiments

**Priority**: Medium — differentiating feature, available in Appcues, Chameleon, Userpilot, Pendo.

### What It Is

A/B testing for tours, announcements, surveys, and any other onboarding content. Run experiments to measure which variant performs better, with built-in statistical analysis.

### Why It Matters

Product teams need data to optimize onboarding. "Does the 3-step tour convert better than the 5-step tour?" Without experiments, they're guessing. This is what separates data-driven onboarding from static walkthroughs.

### Architecture

Thin layer on top of the existing analytics plugin system. Does NOT replace feature flag platforms — integrates with them.

### Traffic Splitting

Deterministic hash-based assignment (same approach as GrowthBook):

```typescript
// Hash userId + experimentId to get a stable decimal 0-1
// Same user always gets the same variant, no storage needed
function assignVariant(userId: string, experimentId: string, weights: number[]): number {
  const hash = fnv32a(`${userId}:${experimentId}`)
  const decimal = hash / MAX_UINT32  // 0-1
  let cumulative = 0
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i]
    if (decimal < cumulative) return i
  }
  return weights.length - 1
}
```

Properties:
- **Deterministic**: Same user always gets same variant (no storage needed)
- **Stable**: Adding new experiments doesn't reassign existing ones
- **Coverage**: Can expose only X% of users (the rest see default)

### Experiment Definition

```typescript
interface Experiment {
  id: string
  name: string
  description?: string
  status: 'draft' | 'running' | 'paused' | 'completed'
  startedAt?: Date
  endedAt?: Date

  // Variants
  variants: ExperimentVariant[]
  weights: number[]                  // Must sum to 1.0

  // Coverage
  coverage: number                   // 0-1, what % of eligible users enter the experiment
  segment?: string                   // Optional: only target a segment

  // Goals
  goals: ExperimentGoal[]
}

interface ExperimentVariant {
  id: string
  name: string                       // "Control", "3-step tour", "Video tour"
  config: Record<string, unknown>    // Variant-specific config passed to the component
}

interface ExperimentGoal {
  id: string
  name: string
  type: 'conversion' | 'count' | 'duration'
  event: string                      // Analytics event name to track
  window?: number                    // Days after exposure to count conversions
}
```

### Usage Pattern

```tsx
// Experiment: test 3-step vs 5-step onboarding tour
const onboardingExperiment: Experiment = {
  id: 'onboarding-length',
  name: 'Short vs Long Onboarding',
  status: 'running',
  variants: [
    { id: 'control', name: '5-step tour', config: { tourId: 'onboarding-5' } },
    { id: 'short', name: '3-step tour', config: { tourId: 'onboarding-3' } },
  ],
  weights: [0.5, 0.5],
  coverage: 1.0,
  goals: [
    { id: 'completed', name: 'Tour completed', type: 'conversion', event: 'tour_completed' },
    { id: 'adoption', name: 'Feature adopted in 7d', type: 'conversion', event: 'feature_adopted', window: 7 },
  ],
}
```

### Statistical Analysis

Bayesian approach — better for small sample sizes (typical of product tours):

```typescript
interface ExperimentResults {
  experimentId: string
  variants: VariantResult[]
  winner: string | null              // null if not significant
  confidenceLevel: number            // 0-1 probability that winner is better
  sampleSize: number
  duration: number                   // days running
}

interface VariantResult {
  variantId: string
  sampleSize: number
  goals: GoalResult[]
}

interface GoalResult {
  goalId: string
  conversionRate: number
  uplift: number                     // % change vs control
  chanceToWin: number                // 0-1 Bayesian probability
  credibleInterval: [number, number] // 95% CI
}
```

Built-in Bayesian calculator:

```typescript
// Uses Beta distribution conjugate prior
calculateBayesianResults(
  controlConversions: number,
  controlSamples: number,
  variantConversions: number,
  variantSamples: number,
  prior?: { alpha: number; beta: number }  // default: uniform (1, 1)
): {
  chanceToWin: number
  expectedUplift: number
  credibleInterval: [number, number]
}
```

### Analytics Integration

Experiments emit events through the existing `@tour-kit/analytics` plugin system:

| Event | Payload |
|-------|---------|
| `experiment_exposure` | experimentId, variantId, userId |
| `experiment_goal_reached` | experimentId, variantId, goalId, userId |
| `experiment_completed` | experimentId, winnerId, confidenceLevel, duration |

Also integrates with external platforms as an alternative to built-in splitting:

```typescript
// Use PostHog feature flags for assignment
<ExperimentsProvider
  assignmentStrategy="external"
  getVariant={(experimentId) => posthog.getFeatureFlag(experimentId)}
>

// Or use built-in deterministic hashing
<ExperimentsProvider
  assignmentStrategy="hash"
  userId={currentUser.id}
>
```

### Package Structure

```
packages/experiments/
├── src/
│   ├── index.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── experiment.ts          # Experiment, Variant, Goal
│   │   ├── results.ts             # ExperimentResults, VariantResult
│   │   ├── context.ts             # ExperimentsContextValue, ProviderProps
│   │   └── events.ts              # Experiment analytics events
│   ├── engine/
│   │   ├── assignment.ts          # Deterministic hash assignment (fnv32a)
│   │   ├── bayesian.ts            # Bayesian statistical analysis
│   │   └── goals.ts               # Goal tracking and conversion counting
│   ├── context/
│   │   ├── experiments-context.ts
│   │   └── experiments-provider.tsx
│   ├── hooks/
│   │   ├── use-experiment.ts      # Get assigned variant for an experiment
│   │   ├── use-experiments.ts     # All experiments state
│   │   ├── use-experiment-results.ts  # Results + statistical analysis
│   │   └── use-track-goal.ts      # Track goal conversion
│   ├── components/
│   │   ├── experiment.tsx          # <Experiment> wrapper — renders assigned variant
│   │   ├── variant.tsx             # <Variant id="control"> — conditional render
│   │   └── experiment-dashboard.tsx  # Admin results view (optional)
│   └── lib/
│       └── utils.ts
```

### API Surface

```tsx
// Provider
<ExperimentsProvider
  experiments={[onboardingExperiment]}
  userId={currentUser.id}
  assignmentStrategy="hash"        // or "external"
>

// Declarative variant rendering
<Experiment id="onboarding-length">
  <Variant id="control">
    <Tour id="onboarding-5" />
  </Variant>
  <Variant id="short">
    <Tour id="onboarding-3" />
  </Variant>
</Experiment>

// Hook-based
const { variant, trackGoal } = useExperiment('onboarding-length')

if (variant.id === 'control') {
  return <LongTour />
} else {
  return <ShortTour />
}

// Track goals
trackGoal('completed')
trackGoal('adoption')

// Results (admin)
const { results, isSignificant, winner } = useExperimentResults('onboarding-length')
```

### Dependencies

- `@tour-kit/core` (logger)
- No heavy stats libraries — Bayesian calculation is ~50 lines of math
- Optional: `@tour-kit/analytics` (for event emission)
- Optional: `@tour-kit/segmentation` (for targeting experiments to segments)

### Bundle Budget

< 3KB gzipped (pure logic, minimal UI)

---

## Cross-Package Integration Map

How the new packages connect with existing ones:

```
                     ┌─────────────────────┐
                     │  @tour-kit/segmentation  │
                     │  (targets everything)    │
                     └──────────┬──────────┘
                                │ evaluateSegment()
          ┌─────────────────────┼─────────────────────┐
          │                     │                      │
          ▼                     ▼                      ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│ @tour-kit/react │  │ @tour-kit/      │  │ @tour-kit/surveys   │
│ (tours)         │  │ announcements   │  │ (NPS/CSAT/CES)      │
└────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘
         │                    │                       │
         │         ┌──────────┴──────────┐            │
         │         │                     │            │
         ▼         ▼                     ▼            ▼
┌─────────────────────┐       ┌─────────────────────────────┐
│ @tour-kit/experiments│       │ @tour-kit/resource-center   │
│ (A/B test any above)│       │ (aggregates all above)      │
└─────────┬───────────┘       └──────────────┬──────────────┘
          │                                  │
          ▼                                  ▼
┌─────────────────────┐       ┌──────────────────────┐
│ @tour-kit/analytics │       │ @tour-kit/checklists │
│ (tracks everything) │       │ @tour-kit/adoption   │
└─────────────────────┘       │ @tour-kit/media      │
                              │ @tour-kit/scheduling │
                              └──────────────────────┘
```

### Dependency Rules

1. **Segmentation is optional everywhere** — packages check if `SegmentationProvider` exists, skip evaluation if absent
2. **Experiments wraps content** — doesn't modify other packages, just controls which variant renders
3. **Resource center reads from other providers** — auto-discovers via context, never writes
4. **Surveys is standalone** — no required dependencies on other tour-kit packages
5. **All four are pro packages** — gated behind `@tour-kit/license`

---

## Implementation Order

| Order | Package | Reason |
|-------|---------|--------|
| **1st** | `@tour-kit/surveys` | Standalone, no dependencies on new packages, highest user demand |
| **2nd** | `@tour-kit/segmentation` | Enables targeting for surveys + all existing packages |
| **3rd** | `@tour-kit/experiments` | Requires analytics (exists), benefits from segmentation |
| **4th** | `@tour-kit/resource-center` | Aggregates everything — needs the others to exist first |

Estimated total: 120-160 hours across all four packages.

---

## Competitive Position After Build

| Feature | Tour-Kit | Best OSS (Joyride) | Appcues ($249/mo) | Pendo ($1,300/mo) |
|---------|:---:|:---:|:---:|:---:|
| Tours | Yes | Yes | Yes | Yes |
| Hints/beacons | Yes | Yes | Yes | Yes |
| Checklists | Yes | No | Growth only | Yes |
| Announcements | Yes | No | Yes | Yes |
| NPS/Surveys | **New** | No | Yes | Yes |
| Segmentation | **New** | No | Yes | Yes |
| Resource center | **New** | No | Growth only | Yes |
| A/B testing | **New** | No | Yes | Yes |
| Analytics | Yes | No | Yes | Yes |
| Adoption tracking | Yes | No | No | Yes |
| Media embedding | Yes | No | No | No |
| Scheduling | Yes | No | No | No |
| AI assistant | Yes | No | No | No |
| Headless/composable | Yes | No | No | No |
| Code-first | Yes | Yes | No | No |
| One-time pricing | $99 | Free | $2,988/yr | $15,600/yr |

After building these four packages, tour-kit would have **full feature parity with Appcues Growth ($879/mo)** and **near-parity with Pendo** — at a one-time $99 price point.

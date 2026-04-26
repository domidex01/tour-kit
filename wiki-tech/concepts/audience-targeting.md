---
title: Audience targeting
type: concept
sources:
  - ../packages/announcements/src/core/audience.ts
  - ../packages/announcements/src/types/announcement.ts
  - ../packages/surveys/src/types/survey.ts
updated: 2026-04-26
---

*Decide whether the current user should see an item, given a `userContext` provided to the package's provider. Used by `@tour-kit/announcements` and `@tour-kit/surveys`.*

## Shape

```ts
type AudienceCondition =
  | { type: 'equals', field: string, value: unknown }
  | { type: 'in', field: string, values: unknown[] }
  | { type: 'gt' | 'lt' | 'gte' | 'lte', field: string, value: number }
  | { type: 'contains', field: string, value: string }
  | { type: 'and' | 'or', conditions: AudienceCondition[] }
  | { type: 'not', condition: AudienceCondition }
  // ... plus custom predicates
```

## Provider input

```tsx
<AnnouncementsProvider userContext={{
  userId: 'u_123',
  plan: 'pro',
  signupDate: '2026-01-15',
  country: 'US',
  customField: 42,
}}>
```

Without `userContext`, audience-targeted items never match (the safe default).

## Helpers

```ts
matchesAudience(conditions, userContext)   → boolean
validateConditions(conditions)             → ValidationResult  // dev-time check
```

## Composition

Combine conditions with `and` / `or` / `not`:

```ts
{
  type: 'and',
  conditions: [
    { type: 'equals', field: 'plan', value: 'pro' },
    { type: 'gte', field: 'signupDays', value: 7 },
  ]
}
```

## Gotchas

- **Missing fields = no match.** If `userContext` doesn't include the field referenced by a condition, the condition fails (closed-world assumption).
- **Type strictness.** `equals` does strict equality; numeric comparisons require numbers, not coerced strings.
- **Validate at dev time.** Call `validateConditions()` in your tests to catch typos in field names.

## Related

- [packages/announcements.md](../packages/announcements.md)
- [packages/surveys.md](../packages/surveys.md)
- [concepts/queue-and-frequency.md](queue-and-frequency.md)

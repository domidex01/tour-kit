# @tour-kit/announcements

Product announcements with 5 UI variants: Modal, Slideout, Banner, Toast, Spotlight.

## Key Concepts

### Variant Types
- **Modal** - Centered dialog for important announcements
- **Slideout** - Side panel for detailed content
- **Banner** - Top/bottom strip for persistent messages
- **Toast** - Corner notifications with auto-dismiss
- **Spotlight** - Highlights a target element with floating content

### Queue System
- Priority-based ordering (critical > high > normal > low)
- Configurable max concurrent announcements
- Stack behaviors: queue, replace, stack

### Frequency Rules
- `once` - Show only once ever
- `session` - Show once per session
- `always` - Show every time conditions are met
- `{ type: 'times', count: N }` - Show N times total
- `{ type: 'interval', days: N }` - Show every N days

## Architecture

```
types/
  announcement.ts     - AnnouncementConfig, State, Actions
  context.ts          - Provider props and context value
  queue.ts            - QueueConfig, priority ordering
  events.ts           - Analytics event types

core/
  priority-queue.ts   - Priority queue implementation
  scheduler.ts        - Queue management, can-show logic
  frequency.ts        - Frequency rule evaluation
  audience.ts         - Audience targeting conditions

context/
  announcements-context.ts  - Context definition
  announcements-provider.tsx - Provider with useReducer

hooks/
  use-announcement.ts      - Single announcement control
  use-announcements.ts     - All announcements state
  use-announcement-queue.ts - Queue management

components/
  announcement-modal.tsx
  announcement-slideout.tsx
  announcement-banner.tsx
  announcement-toast.tsx
  announcement-spotlight.tsx
  headless/              - Render-prop versions
```

## Gotchas

- **Queue vs Show**: `show()` may queue if at max concurrent
- **Frequency persistence**: Uses localStorage by default
- **Schedule integration**: Pass `schedule` prop for time-based rules
- **Audience targeting**: Pass `userContext` to provider for targeting

## Commands

```bash
pnpm --filter @tour-kit/announcements build
pnpm --filter @tour-kit/announcements typecheck
pnpm --filter @tour-kit/announcements test
```

## Related Rules
- `tour-kit/rules/components.md` - Component patterns
- `tour-kit/rules/accessibility.md` - A11y requirements

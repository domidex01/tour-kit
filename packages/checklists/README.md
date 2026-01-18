# @tour-kit/checklists

Onboarding checklists and task management for Tour Kit.

## Installation

```bash
npm install @tour-kit/checklists @tour-kit/core
# or
pnpm add @tour-kit/checklists @tour-kit/core
```

## Quick Start

```tsx
import {
  ChecklistProvider,
  Checklist,
  ChecklistItem,
  useChecklist,
} from '@tour-kit/checklists'

// Define checklist items
const onboardingChecklist = {
  id: 'onboarding',
  title: 'Get Started',
  items: [
    { id: 'profile', label: 'Complete your profile', tourId: 'profile-tour' },
    { id: 'invite', label: 'Invite a teammate', requires: ['profile'] },
    { id: 'project', label: 'Create your first project' },
  ],
}

// Wrap your app
function App() {
  return (
    <ChecklistProvider checklists={[onboardingChecklist]}>
      <YourApp />
    </ChecklistProvider>
  )
}

// Render checklist
function OnboardingPanel() {
  return (
    <Checklist id="onboarding">
      <ChecklistItem id="profile" />
      <ChecklistItem id="invite" />
      <ChecklistItem id="project" />
    </Checklist>
  )
}

// Control checklist programmatically
function ProfileForm() {
  const { completeItem, isItemCompleted } = useChecklist('onboarding')

  const handleSubmit = () => {
    // ... save profile
    completeItem('profile')
  }

  return (
    <form onSubmit={handleSubmit}>
      {isItemCompleted('profile') && <span>Done!</span>}
      {/* ... form fields */}
    </form>
  )
}
```

## API Reference

### Components

| Component | Description |
|-----------|-------------|
| `ChecklistProvider` | Context provider for checklists |
| `Checklist` | Checklist container component |
| `ChecklistItem` | Individual checklist item |
| `ChecklistProgress` | Progress bar component |
| `ChecklistDismiss` | Dismiss button component |

### Hooks

| Hook | Description |
|------|-------------|
| `useChecklist(id)` | Get checklist state and actions |
| `useChecklistItem(checklistId, itemId)` | Individual item control |
| `useChecklistProgress(id)` | Progress calculation |

## Item Dependencies

Items can depend on other items:

```tsx
const checklist = {
  id: 'setup',
  items: [
    { id: 'signup', label: 'Create account' },
    { id: 'verify', label: 'Verify email', requires: ['signup'] },
    { id: 'profile', label: 'Complete profile', requires: ['verify'] },
  ],
}
```

Locked items are automatically disabled until dependencies are met.

## Tour Integration

Link checklist items to tours:

```tsx
const checklist = {
  items: [
    {
      id: 'dashboard',
      label: 'Explore the dashboard',
      tourId: 'dashboard-tour', // Triggers tour on click
    },
  ],
}
```

## Persistence

Checklist progress is automatically persisted:

```tsx
<ChecklistProvider
  checklists={checklists}
  storage={{ type: 'localStorage', key: 'my-app-checklists' }}
/>
```

## Documentation

Full documentation: [https://tour-kit.dev/docs/checklists](https://tour-kit.dev/docs/checklists)

## License

MIT

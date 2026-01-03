# @tour-kit/analytics Test Plan

## Overview

This document provides a comprehensive test plan for the `@tour-kit/analytics` package. The package provides analytics tracking capabilities for tour-kit with support for multiple analytics providers via a plugin architecture.

## Package Structure

```
packages/analytics/src/
├── core/
│   ├── tracker.ts         # TourAnalytics class - main tracker implementation
│   └── context.tsx        # AnalyticsProvider and useAnalytics hook
├── hooks/
│   └── use-analytics.ts   # Re-exports from context (barrel file)
├── plugins/
│   ├── amplitude.ts       # Amplitude integration
│   ├── google-analytics.ts # Google Analytics 4 integration
│   ├── mixpanel.ts        # Mixpanel integration
│   ├── posthog.ts         # PostHog integration
│   └── console.ts         # Console logging plugin (debugging)
├── types/
│   ├── events.ts          # Event type definitions
│   └── plugin.ts          # Plugin interface definitions
└── index.ts               # Main exports
```

## Test File Structure

```
packages/analytics/src/
├── __tests__/
│   ├── setup.ts                           # Test setup and global mocks
│   ├── core/
│   │   ├── tracker.test.ts                # TourAnalytics class tests
│   │   └── context.test.tsx               # Provider and hook tests
│   ├── plugins/
│   │   ├── __mocks__/
│   │   │   └── analytics-sdks.ts          # Mock implementations for SDKs
│   │   ├── amplitude.test.ts              # Amplitude plugin tests
│   │   ├── google-analytics.test.ts       # Google Analytics plugin tests
│   │   ├── mixpanel.test.ts               # Mixpanel plugin tests
│   │   ├── posthog.test.ts                # PostHog plugin tests
│   │   └── console.test.ts                # Console plugin tests
│   └── integration/
│       └── multi-plugin.test.tsx          # Integration tests with multiple plugins
└── vitest.config.ts                       # Vitest configuration
```

## Coverage Thresholds

| Metric | Target |
|--------|--------|
| Statements | 85% |
| Branches | 80% |
| Functions | 85% |
| Lines | 85% |

## Test Categories

### 1. Core Tracker Tests (`core/tracker.test.ts`)

#### Plugin Registration
- [x] Registers plugins from config
- [x] Initializes plugins on construction when enabled
- [x] Does not initialize plugins when `enabled: false`
- [x] Handles plugin init errors gracefully
- [x] Logs errors in debug mode when plugin init fails

#### Event Tracking
- [x] Tracks events to all registered plugins
- [x] Adds timestamp and sessionId to events
- [x] Merges globalProperties into events
- [x] Handles plugin track errors gracefully
- [x] Logs events to console in debug mode

#### User Identification
- [x] Calls identify on all plugins
- [x] Passes userId and properties to plugins
- [x] Auto-identifies on init if userId in config
- [x] Handles plugin identify errors gracefully

#### Tour Lifecycle Events
- [x] `tourStarted()` - sets tourStartTime and tracks event
- [x] `tourCompleted()` - calculates duration and tracks event
- [x] `tourSkipped()` - includes stepIndex and duration
- [x] `tourAbandoned()` - includes stepIndex and duration

#### Step Lifecycle Events
- [x] `stepViewed()` - sets stepStartTime and tracks event
- [x] `stepCompleted()` - calculates duration
- [x] `stepSkipped()` - calculates duration
- [x] `stepInteraction()` - includes interactionType in metadata

#### Hint Events
- [x] `hintShown()` - tracks with hintId as tourId
- [x] `hintDismissed()` - tracks dismissal
- [x] `hintClicked()` - tracks click

#### Utility Methods
- [x] `flush()` - calls flush on all plugins
- [x] `destroy()` - calls destroy on all plugins
- [x] Handles flush/destroy errors gracefully
- [x] `generateSessionId()` - creates unique session IDs

### 2. Context Tests (`core/context.test.tsx`)

#### AnalyticsProvider
- [x] Provides analytics instance to children
- [x] Creates analytics instance once (uses ref)
- [x] Calls destroy on unmount
- [x] Registers beforeunload handler for flush
- [x] Removes beforeunload handler on unmount

#### useAnalytics Hook
- [x] Returns analytics instance when within provider
- [x] Throws error when used outside provider
- [x] Error message is descriptive

#### useAnalyticsOptional Hook
- [x] Returns analytics instance when within provider
- [x] Returns null when used outside provider
- [x] Does not throw error

### 3. Plugin Tests

#### Common Plugin Patterns
All plugins should be tested for:
- [x] Initialization behavior
- [x] SSR safety (window check)
- [x] Event tracking with proper mapping
- [x] User identification
- [x] Error handling when SDK unavailable
- [x] Cleanup on destroy

#### Amplitude Plugin (`plugins/amplitude.test.ts`)
- [x] Initializes with API key
- [x] Supports custom eventPrefix
- [x] Supports serverUrl for EU data residency
- [x] Maps event properties correctly
- [x] Identifies user with properties
- [x] Calls flush on SDK
- [x] Handles import failure gracefully

#### Google Analytics Plugin (`plugins/google-analytics.test.ts`)
- [x] Warns when gtag not found on init
- [x] Tracks events with correct format
- [x] Maps properties to GA4 format
- [x] Identifies user via set command
- [x] Handles missing gtag gracefully

#### Mixpanel Plugin (`plugins/mixpanel.test.ts`)
- [x] Initializes with token
- [x] Supports debug mode
- [x] Tracks events with prefix
- [x] Identifies user and sets people properties
- [x] Calls reset on destroy
- [x] Handles import failure gracefully

#### PostHog Plugin (`plugins/posthog.test.ts`)
- [x] Initializes with API key
- [x] Supports custom apiHost
- [x] Disables autocapture by default
- [x] Captures events with properties
- [x] Identifies user with properties
- [x] Calls reset on destroy
- [x] Handles import failure gracefully

#### Console Plugin (`plugins/console.test.ts`)
- [x] Logs events with formatted output
- [x] Uses collapsed groups when configured
- [x] Applies correct colors based on event type
- [x] Logs user identification
- [x] Supports custom prefix

### 4. Integration Tests (`integration/multi-plugin.test.tsx`)

- [x] Multiple plugins receive same events
- [x] Plugin errors don't affect other plugins
- [x] Full tour lifecycle tracking
- [x] Provider cleanup flushes all plugins

## Mock Patterns

### External SDK Mocking

All external analytics SDKs must be mocked to prevent network calls and dependency issues in tests.

```typescript
// Example mock pattern for dynamic imports
vi.mock('@amplitude/analytics-browser', () => ({
  init: vi.fn(),
  track: vi.fn(),
  setUserId: vi.fn(),
  identify: vi.fn(),
  Identify: vi.fn(() => ({
    set: vi.fn().mockReturnThis(),
  })),
  flush: vi.fn(),
}))
```

### Window/Global Mocking

```typescript
// Mock gtag for Google Analytics
const mockGtag = vi.fn()
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true,
  configurable: true,
})
```

### Timer Mocking

```typescript
// For duration calculations
vi.useFakeTimers()
vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))

// Advance time for duration tests
vi.advanceTimersByTime(5000)

// Cleanup
vi.useRealTimers()
```

## Test Utilities

### createMockPlugin Factory

```typescript
function createMockPlugin(overrides = {}): AnalyticsPlugin {
  return {
    name: 'mock-plugin',
    init: vi.fn(),
    track: vi.fn(),
    identify: vi.fn(),
    flush: vi.fn(),
    destroy: vi.fn(),
    ...overrides,
  }
}
```

### createAnalyticsWrapper Factory

```typescript
function createAnalyticsWrapper(config: Partial<AnalyticsConfig> = {}) {
  const defaultConfig: AnalyticsConfig = {
    plugins: [createMockPlugin()],
    ...config,
  }

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AnalyticsProvider config={defaultConfig}>
        {children}
      </AnalyticsProvider>
    )
  }
}
```

## Special Considerations

### SSR Testing
- Plugins must check `typeof window !== 'undefined'`
- Use conditional logic to skip SDK initialization in SSR

### Async Initialization
- Some plugins use dynamic imports
- Tests should await init completion or handle async behavior

### Error Boundaries
- All plugin methods should be wrapped in try-catch
- Errors should not propagate to break the application
- Debug mode should log errors

### Duration Calculations
- Use fake timers for deterministic duration tests
- Verify `Date.now()` calls for timestamp generation

## Files to Create

1. `/packages/analytics/vitest.config.ts`
2. `/packages/analytics/src/__tests__/setup.ts`
3. `/packages/analytics/src/__tests__/core/tracker.test.ts`
4. `/packages/analytics/src/__tests__/core/context.test.tsx`
5. `/packages/analytics/src/__tests__/plugins/amplitude.test.ts`
6. `/packages/analytics/src/__tests__/plugins/google-analytics.test.ts`
7. `/packages/analytics/src/__tests__/plugins/mixpanel.test.ts`
8. `/packages/analytics/src/__tests__/plugins/posthog.test.ts`
9. `/packages/analytics/src/__tests__/plugins/console.test.ts`
10. `/packages/analytics/src/__tests__/integration/multi-plugin.test.tsx`

## Running Tests

```bash
# Run all analytics tests
pnpm --filter @tour-kit/analytics test

# Run with coverage
pnpm --filter @tour-kit/analytics test:coverage

# Run specific test file
pnpm --filter @tour-kit/analytics test tracker.test.ts

# Run in watch mode
pnpm --filter @tour-kit/analytics test:watch
```

## Quality Checklist

Before considering tests complete:

- [ ] All hooks tested with proper provider wrappers
- [ ] External SDKs properly mocked
- [ ] Cleanup patterns prevent test leakage
- [ ] Timer tests use fake timers for duration calculations
- [ ] Debug mode logging tested
- [ ] Error handling verified for all plugin methods
- [ ] SSR safety verified (window checks)
- [ ] Coverage thresholds met

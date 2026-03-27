# @tour-kit/core

## 0.3.0

### Minor Changes

- ### @tour-kit/react

  - Fix `Tour` component to properly render children content alongside tour steps
  - Add `TourCard`, `TourOverlay`, and navigation components with Floating UI positioning
  - Add primitive components: `TourPortal`, `TourArrow`

  ### @tour-kit/core

  - Export hooks and utilities for tour state management
  - Add focus trap, keyboard navigation, and spotlight hooks

  ### @tour-kit/hints

  - Initial hints package setup

## 0.2.0

### Minor Changes

- Add tour hooks and utility functions

  ### New Hooks

  - `useTour` - Main tour control hook with state and actions
  - `useStep` - Individual step management hook
  - `useSpotlight` - Spotlight overlay positioning and styling
  - `useKeyboardNavigation` - Keyboard navigation (arrow keys, Escape)
  - `useFocusTrap` - Focus trap for accessibility compliance
  - `usePersistence` - Tour state persistence (localStorage/sessionStorage/cookies)
  - `useElementPosition` - Track element position with ResizeObserver
  - `useMediaQuery` / `usePrefersReducedMotion` - Media query hooks

  ### New Utilities

  - DOM utilities: `waitForElement`, `isElementVisible`, `getScrollParent`
  - Position utilities: `calculatePosition`, `getOptimalPlacement`
  - Scroll utilities: `scrollIntoView`, `getScrollOffset`
  - Storage utilities: `createStorageAdapter`, `createPrefixedStorage`
  - Accessibility utilities: `generateId`, `announceToScreenReader`, `trapFocus`
  - Factory functions: `createTour`, `createStep`

  ### Context Providers

  - `TourProvider` - Main tour state management with reducer
  - `TourKitProvider` - Configuration wrapper with merged configs

## 0.1.0

### Minor Changes

- 47e702c: Initial release of tour-kit packages

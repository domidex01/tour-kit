# Tour Kit Mobile SDK - Product Requirements Document

> **Version**: 1.0.0
> **Date**: January 2026
> **Status**: Draft
> **Author**: Generated with AI assistance

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Goals & Success Metrics](#goals--success-metrics)
4. [Market Analysis](#market-analysis)
5. [Technical Architecture](#technical-architecture)
6. [Package Structure](#package-structure)
7. [Core Components](#core-components)
8. [Feature Specifications](#feature-specifications)
9. [Implementation Phases](#implementation-phases)
10. [API Design](#api-design)
11. [Platform Considerations](#platform-considerations)
12. [Testing Strategy](#testing-strategy)
13. [Documentation Plan](#documentation-plan)
14. [Risk Assessment](#risk-assessment)
15. [Appendices](#appendices)

---

## Executive Summary

### Vision

Extend Tour Kit's headless onboarding architecture to React Native and Expo, enabling developers to create consistent cross-platform product tours with the same ergonomic API and design principles that make Tour Kit successful on the web.

### Key Differentiators

1. **Truly Headless** - Business logic separated from UI, allowing complete customization
2. **Cross-Platform Consistency** - Same API patterns as `@tour-kit/react`
3. **Expo-First Design** - Native Expo module support with bare React Native fallback
4. **Code Reuse** - ~70% of `@tour-kit/core` logic is directly portable
5. **Accessibility Built-In** - VoiceOver (iOS) and TalkBack (Android) support from day one

### Target Audience

- React Native developers using Expo (primary)
- Bare React Native developers (secondary)
- Teams already using Tour Kit on web wanting mobile parity

---

## Problem Statement

### Current Landscape

Mobile app onboarding in React Native/Expo is fragmented:

| Library | Issues |
|---------|--------|
| `react-native-copilot` | Limited customization, dated API patterns |
| `react-native-product-tour` | No Expo Router support, complex setup |
| `react-native-walkthrough-tooltip` | Tooltip-only, no full tour orchestration |
| `spotlight-tour` | Good animations but lacking persistence/analytics |

### Pain Points

1. **No Headless Options** - All existing libraries couple business logic with UI
2. **Poor State Management** - No built-in persistence, analytics, or branching
3. **Navigation Fragmentation** - Libraries don't integrate well with React Navigation or Expo Router
4. **Accessibility Gaps** - VoiceOver/TalkBack support is afterthought
5. **No Web Parity** - Teams can't share logic between web and mobile

### Opportunity

Tour Kit's architecture is uniquely positioned to solve these problems because:

- Core business logic is already framework-agnostic
- Type system is portable without modification
- State management patterns (reducer-based) work identically in React Native
- Router adapter pattern can be extended to React Navigation/Expo Router

---

## Goals & Success Metrics

### Primary Goals

| Goal | Metric | Target |
|------|--------|--------|
| **Adoption** | Weekly npm downloads | 5,000+ within 6 months |
| **Developer Experience** | Time to first tour | < 15 minutes |
| **Performance** | Tour step transition | < 100ms |
| **Accessibility** | VoiceOver/TalkBack coverage | 100% core features |
| **Bundle Size** | Gzipped size | < 15KB (core+react-native) |

### Secondary Goals

| Goal | Metric | Target |
|------|--------|--------|
| **Code Reuse** | Shared logic with web | > 60% |
| **Test Coverage** | Line coverage | > 80% |
| **Documentation** | API coverage | 100% |
| **Expo Compatibility** | SDK support | 52+ (maintained SDKs) |

---

## Market Analysis

### Competitive Landscape

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FEATURE COMPARISON                           │
├─────────────────────┬──────────┬──────────┬──────────┬─────────────┤
│ Feature             │ Copilot  │ Spotlight│ Walkthru │ Tour Kit RN │
├─────────────────────┼──────────┼──────────┼──────────┼─────────────┤
│ Headless Mode       │    ✗     │    ✗     │    ✗     │      ✓      │
│ TypeScript          │    ✓     │    ✓     │    ~     │      ✓      │
│ Expo Router         │    ✗     │    ✗     │    ✗     │      ✓      │
│ React Navigation    │    ~     │    ~     │    ✗     │      ✓      │
│ Persistence         │    ✗     │    ✗     │    ✗     │      ✓      │
│ Analytics Plugin    │    ✗     │    ✗     │    ✗     │      ✓      │
│ Branching Logic     │    ✗     │    ✗     │    ✗     │      ✓      │
│ VoiceOver/TalkBack  │    ~     │    ~     │    ✗     │      ✓      │
│ Web Parity          │    ✗     │    ✗     │    ✗     │      ✓      │
│ Gesture Navigation  │    ✗     │    ~     │    ✗     │      ✓      │
│ Multi-Page Tours    │    ✗     │    ✗     │    ✗     │      ✓      │
│ Reduced Motion      │    ✗     │    ✗     │    ✗     │      ✓      │
└─────────────────────┴──────────┴──────────┴──────────┴─────────────┘
✓ = Full support  ~ = Partial support  ✗ = No support
```

### Target Market Size

- **React Native Apps**: ~500,000+ active projects (2025 estimate)
- **Expo Apps**: ~250,000+ (50% of RN ecosystem)
- **Apps with Onboarding**: ~70% of consumer apps
- **Addressable Market**: ~175,000 apps could benefit

---

## Technical Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           APPLICATION                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    @tour-kit/react-native                    │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │   │
│  │  │ Components  │ │  Adapters   │ │      Utilities          │ │   │
│  │  │             │ │             │ │                         │ │   │
│  │  │ TourModal   │ │ ExpoRouter  │ │ PositionEngine (native) │ │   │
│  │  │ TourCard    │ │ ReactNav    │ │ GestureHandlers         │ │   │
│  │  │ Spotlight   │ │ AsyncStore  │ │ AccessibilityUtils      │ │   │
│  │  │ Overlay     │ │             │ │ MeasureUtils            │ │   │
│  │  │ Navigation  │ │             │ │                         │ │   │
│  │  │ Progress    │ │             │ │                         │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                 │                                   │
│                                 ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      @tour-kit/core                          │   │
│  │                                                              │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │   │
│  │  │    Types    │ │   Context   │ │         Hooks           │ │   │
│  │  │             │ │             │ │                         │ │   │
│  │  │ TourStep    │ │ TourProvider│ │ useTour                 │ │   │
│  │  │ Tour        │ │ TourContext │ │ usePersistence          │ │   │
│  │  │ TourState   │ │ TourKit     │ │ useBranch               │ │   │
│  │  │ Branch      │ │ Provider    │ │ useAdvanceOn            │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────────┘ │   │
│  │                                                              │   │
│  │  ┌─────────────────────────────────────────────────────────┐ │   │
│  │  │                   Utilities (Portable)                   │ │   │
│  │  │  Storage Adapters | Branch Resolution | Loop Detection   │ │   │
│  │  │  Accessibility (adapt) | Logger | Tour/Step Factories    │ │   │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Platform Modules                          │   │
│  │                                                              │   │
│  │  ┌──────────────────┐  ┌──────────────────────────────────┐ │   │
│  │  │ react-native-    │  │ react-native-gesture-handler     │ │   │
│  │  │ reanimated       │  │                                  │ │   │
│  │  └──────────────────┘  └──────────────────────────────────┘ │   │
│  │  ┌──────────────────┐  ┌──────────────────────────────────┐ │   │
│  │  │ react-native-    │  │ @react-native-async-storage/     │ │   │
│  │  │ safe-area-context│  │ async-storage                    │ │   │
│  │  └──────────────────┘  └──────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Code Sharing Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CODE REUSE ANALYSIS                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  @tour-kit/core                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                                                            │    │
│  │  ████████████████████████████████████████████  PORTABLE    │    │
│  │  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ADAPT NEEDED │    │
│  │                                                            │    │
│  │  Portable (70%):                                           │    │
│  │  - All type definitions (types/)                           │    │
│  │  - Tour state reducer                                      │    │
│  │  - Branch resolution system                                │    │
│  │  - Visit tracking & loop detection                         │    │
│  │  - Storage adapter factory (custom impl needed)            │    │
│  │  - Tour/Step factory functions                             │    │
│  │  - Logger utility                                          │    │
│  │                                                            │    │
│  │  Adapt Needed (30%):                                       │    │
│  │  - Position engine (View.measure vs getBoundingClientRect) │    │
│  │  - Accessibility utils (accessibilityLiveRegion vs aria)   │    │
│  │  - DOM utilities → Native measure utilities                │    │
│  │  - Media query hook → useWindowDimensions                  │    │
│  │  - Focus trap → AccessibilityInfo focus management         │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  @tour-kit/react → @tour-kit/react-native                           │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                                                            │    │
│  │  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  REWRITE      │    │
│  │                                                            │    │
│  │  Rewrite Needed (90%):                                     │    │
│  │  - All UI components (View/Text vs div/span)               │    │
│  │  - Overlay implementation (Modal + animated View)          │    │
│  │  - Position engine (native measure + layout)               │    │
│  │  - Router adapters (React Navigation / Expo Router)        │    │
│  │  - Gesture handlers (swipe navigation)                     │    │
│  │                                                            │    │
│  │  Portable (10%):                                           │    │
│  │  - Hook patterns (useCallback, useRef, useMemo)            │    │
│  │  - Component composition patterns                          │    │
│  │  - Unified Slot concept (asChild pattern)                  │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Package Structure

### New Packages

```
packages/
├── react-native/              # @tour-kit/react-native
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsup.config.ts
│   ├── CLAUDE.md
│   ├── README.md
│   └── src/
│       ├── index.ts
│       │
│       ├── types/
│       │   ├── index.ts
│       │   ├── config.ts           # RN-specific config extensions
│       │   ├── components.ts       # Component prop types
│       │   └── native.ts           # Platform-specific types
│       │
│       ├── context/
│       │   ├── index.ts
│       │   ├── native-tour-provider.tsx    # Wraps core TourProvider
│       │   └── native-tourkit-provider.tsx # Wraps core TourKitProvider
│       │
│       ├── hooks/
│       │   ├── index.ts
│       │   ├── use-element-measure.ts      # Native element measurement
│       │   ├── use-spotlight.ts            # Adapted for RN
│       │   ├── use-gesture-navigation.ts   # Swipe prev/next
│       │   ├── use-safe-area-position.ts   # Safe area awareness
│       │   ├── use-reduced-motion.ts       # AccessibilityInfo
│       │   └── use-screen-dimensions.ts    # useWindowDimensions wrapper
│       │
│       ├── utils/
│       │   ├── index.ts
│       │   ├── measure.ts                  # View measurement utilities
│       │   ├── position.ts                 # Native position calculations
│       │   ├── accessibility.ts            # VoiceOver/TalkBack utils
│       │   ├── animation.ts                # Reanimated helpers
│       │   └── platform.ts                 # iOS/Android detection
│       │
│       ├── components/
│       │   ├── index.ts
│       │   │
│       │   ├── tour/
│       │   │   ├── index.ts
│       │   │   ├── tour.tsx                # Main tour component
│       │   │   └── tour-container.tsx      # Tour wrapper with Modal
│       │   │
│       │   ├── card/
│       │   │   ├── index.ts
│       │   │   ├── tour-card.tsx           # Styled card
│       │   │   ├── tour-card-header.tsx
│       │   │   ├── tour-card-content.tsx
│       │   │   ├── tour-card-footer.tsx
│       │   │   └── tour-card-arrow.tsx     # SVG arrow
│       │   │
│       │   ├── overlay/
│       │   │   ├── index.ts
│       │   │   ├── tour-overlay.tsx        # Full screen overlay
│       │   │   └── spotlight-cutout.tsx    # Animated cutout
│       │   │
│       │   ├── navigation/
│       │   │   ├── index.ts
│       │   │   ├── tour-navigation.tsx     # Nav controls container
│       │   │   ├── tour-prev.tsx
│       │   │   ├── tour-next.tsx
│       │   │   ├── tour-close.tsx
│       │   │   ├── tour-skip.tsx
│       │   │   └── tour-progress.tsx       # Step indicators
│       │   │
│       │   ├── headless/
│       │   │   ├── index.ts
│       │   │   ├── headless-tour.tsx       # Logic-only component
│       │   │   ├── headless-card.tsx
│       │   │   └── headless-overlay.tsx
│       │   │
│       │   └── primitives/
│       │       ├── index.ts
│       │       ├── pressable-scale.tsx     # Animated press feedback
│       │       └── animated-view.tsx       # Reanimated wrapper
│       │
│       ├── adapters/
│       │   ├── index.ts
│       │   ├── expo-router.ts              # Expo Router adapter
│       │   ├── react-navigation.ts         # React Navigation adapter
│       │   └── async-storage.ts            # Persistence adapter
│       │
│       └── styles/
│           ├── index.ts
│           ├── themes.ts                   # Light/dark themes
│           └── constants.ts                # Spacing, colors, etc.
│
├── hints-native/              # @tour-kit/hints-native (Phase 2)
│   └── src/
│       ├── index.ts
│       ├── context/
│       │   └── native-hints-provider.tsx
│       ├── components/
│       │   ├── hint.tsx
│       │   ├── hint-hotspot.tsx            # Pulsing dot
│       │   └── hint-tooltip.tsx
│       └── hooks/
│           └── use-hint.ts
│
└── react-native-example/      # Example Expo app
    ├── app.json
    ├── package.json
    ├── app/
    │   ├── _layout.tsx
    │   ├── index.tsx
    │   ├── onboarding.tsx
    │   └── settings.tsx
    └── components/
        └── tours/
            ├── welcome-tour.tsx
            └── feature-tour.tsx
```

### Package Dependencies

```
@tour-kit/react-native
├── dependencies
│   └── @tour-kit/core                     # Core logic
│
├── peerDependencies
│   ├── react                              # ^18.2.0 || ^19.0.0
│   ├── react-native                       # >=0.72.0
│   ├── react-native-reanimated            # ^3.0.0
│   ├── react-native-gesture-handler       # ^2.0.0
│   ├── react-native-safe-area-context     # ^4.0.0
│   └── react-native-svg                   # ^13.0.0 || ^14.0.0 || ^15.0.0
│
├── optionalPeerDependencies
│   ├── expo-router                        # ^4.0.0
│   ├── @react-navigation/native           # ^6.0.0 || ^7.0.0
│   └── @react-native-async-storage/async-storage  # ^1.0.0 || ^2.0.0
│
└── devDependencies
    ├── typescript
    ├── tsup
    ├── @types/react
    ├── @types/react-native
    └── vitest
```

---

## Core Components

### Component Hierarchy

```
<TourKitProvider config={...}>           // Global config (theming, a11y)
  <NativeTourProvider tours={[...]} router={routerAdapter}>
    <SafeAreaProvider>
      <NavigationContainer>

        {/* App screens */}
        <HomeScreen>
          <Text ref={featureRef}>Feature</Text>  // Tour target
        </HomeScreen>

        {/* Tour overlay (rendered via Portal/Modal) */}
        <Tour tourId="welcome">
          <TourOverlay>
            <SpotlightCutout />
          </TourOverlay>
          <TourCard>
            <TourCardHeader>
              <TourClose />
            </TourCardHeader>
            <TourCardContent />
            <TourCardFooter>
              <TourProgress />
              <TourNavigation>
                <TourPrev />
                <TourNext />
              </TourNavigation>
            </TourCardFooter>
          </TourCard>
        </Tour>

      </NavigationContainer>
    </SafeAreaProvider>
  </NativeTourProvider>
</TourKitProvider>
```

### Core Component Specifications

#### TourOverlay

```typescript
interface TourOverlayProps {
  /** Background color (default: rgba(0,0,0,0.5)) */
  backgroundColor?: string;
  /** Animation duration in ms (default: 300) */
  animationDuration?: number;
  /** Press handler for overlay background */
  onBackgroundPress?: () => void;
  /** Whether background press closes tour */
  closeOnBackgroundPress?: boolean;
  /** Custom children (spotlight, card, etc.) */
  children: React.ReactNode;
}
```

**Implementation Notes:**
- Uses `<Modal transparent>` for proper layer management
- Spotlight cutout via animated SVG mask or react-native-hole-view
- Respects safe area insets
- Blocks touches outside spotlight region

#### TourCard

```typescript
interface TourCardProps {
  /** Card placement relative to target */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  /** Offset from target element */
  offset?: number;
  /** Max width of card */
  maxWidth?: number;
  /** Custom style */
  style?: ViewStyle;
  /** Whether to show arrow pointing to target */
  showArrow?: boolean;
  /** Arrow size */
  arrowSize?: number;
  /** Custom children */
  children: React.ReactNode;
}
```

**Implementation Notes:**
- Position calculated using `View.measure()` and `useWindowDimensions()`
- Collision detection with safe areas
- Animated enter/exit with reanimated
- Arrow rendered with react-native-svg

#### SpotlightCutout

```typescript
interface SpotlightCutoutProps {
  /** Target ref to highlight */
  targetRef: React.RefObject<View>;
  /** Padding around target */
  padding?: number;
  /** Border radius of cutout */
  borderRadius?: number;
  /** Animation config */
  animationConfig?: WithTimingConfig;
  /** Cutout shape */
  shape?: 'rectangle' | 'circle' | 'pill';
}
```

**Implementation Notes:**
- Uses SVG `<ClipPath>` with inverted rect for cutout effect
- Animated measurements with reanimated
- Falls back to simple overlay without SVG if unavailable

---

## Feature Specifications

### Phase 1 Features (MVP)

#### F1.1: Basic Tour Flow

| Feature | Description | Priority |
|---------|-------------|----------|
| Sequential Steps | Navigate through ordered tour steps | P0 |
| Start/Stop/Skip | Tour lifecycle controls | P0 |
| Step Targeting | Highlight specific View refs | P0 |
| Overlay Mask | Semi-transparent background with cutout | P0 |
| Tour Card | Positioned tooltip with content | P0 |

#### F1.2: Navigation

| Feature | Description | Priority |
|---------|-------------|----------|
| Prev/Next Buttons | Navigate between steps | P0 |
| Close Button | Exit tour at any point | P0 |
| Progress Indicator | Show current step / total | P0 |
| Gesture Navigation | Swipe left/right for prev/next | P1 |
| Keyboard (external) | Support for external keyboards | P2 |

#### F1.3: Persistence

| Feature | Description | Priority |
|---------|-------------|----------|
| AsyncStorage Adapter | Persist completed/skipped tours | P0 |
| Resume State | Resume tour from last step | P1 |
| Don't Show Again | User preference storage | P1 |

#### F1.4: Router Integration

| Feature | Description | Priority |
|---------|-------------|----------|
| Expo Router Adapter | Support Expo Router navigation | P0 |
| React Navigation Adapter | Support @react-navigation | P0 |
| Multi-Screen Tours | Tour steps across different screens | P1 |
| Route-Based Triggers | Start tour when navigating to route | P2 |

### Phase 2 Features (Enhanced)

#### F2.1: Dynamic Branching

| Feature | Description | Priority |
|---------|-------------|----------|
| Conditional Steps | Show/hide steps based on conditions | P0 |
| Branch Actions | Custom action buttons triggering branches | P0 |
| Cross-Tour Navigation | Jump to different tour | P1 |
| Loop Detection | Prevent infinite navigation loops | P0 |

#### F2.2: Accessibility

| Feature | Description | Priority |
|---------|-------------|----------|
| VoiceOver Support | Full iOS accessibility | P0 |
| TalkBack Support | Full Android accessibility | P0 |
| Focus Management | Proper focus ordering | P0 |
| Reduced Motion | Respect system preferences | P0 |
| Screen Reader Announcements | Live region updates | P1 |

#### F2.3: Hints/Hotspots

| Feature | Description | Priority |
|---------|-------------|----------|
| Pulsing Beacon | Attention-grabbing indicator | P0 |
| Hint Tooltip | On-demand tooltip content | P0 |
| Dismissal State | Remember dismissed hints | P0 |
| Delay/Timing | Show hints after delay | P1 |

### Phase 3 Features (Advanced)

#### F3.1: Analytics Integration

| Feature | Description | Priority |
|---------|-------------|----------|
| Event Callbacks | onTourStart, onStepView, etc. | P0 |
| Analytics Plugin | Pluggable analytics backends | P1 |
| Funnel Tracking | Conversion metrics | P2 |

#### F3.2: Advanced UI

| Feature | Description | Priority |
|---------|-------------|----------|
| Custom Themes | Light/dark mode + custom | P0 |
| Animation Presets | Fade, slide, scale, etc. | P1 |
| Video/Media Steps | Embedded media content | P2 |
| Interactive Steps | Form inputs within steps | P2 |

#### F3.3: Extended Packages

| Feature | Description | Priority |
|---------|-------------|----------|
| Checklists | Onboarding task lists | P1 |
| Announcements | Product updates UI | P2 |
| Adoption Tracking | Feature discovery | P2 |

---

## Implementation Phases

### Phase 1: Foundation (8-10 weeks)

```
Week 1-2: Project Setup & Core Infrastructure
├── Initialize @tour-kit/react-native package
├── Configure tsup, TypeScript, monorepo integration
├── Set up example Expo app for development
├── Create CI pipeline for mobile testing
└── Establish testing infrastructure (Vitest + React Native Testing Library)

Week 3-4: Core Hooks & Utilities
├── Port useTour hook (minimal changes)
├── Implement useElementMeasure (View.measure wrapper)
├── Create native position calculation utilities
├── Implement useGestureNavigation for swipe
├── Create AsyncStorage adapter for persistence
└── Implement useReducedMotion via AccessibilityInfo

Week 5-6: Base Components
├── Implement TourOverlay with Modal
├── Create SpotlightCutout with SVG mask
├── Build TourCard with positioning logic
├── Implement TourNavigation (prev/next/close)
├── Create TourProgress indicator
└── Build basic animation system

Week 7-8: Router Adapters & Multi-Screen
├── Implement Expo Router adapter
├── Implement React Navigation adapter
├── Add multi-screen tour support
├── Handle route change during tour
└── Test cross-screen navigation

Week 9-10: Polish & Documentation
├── Accessibility audit (VoiceOver/TalkBack)
├── Performance optimization
├── Write comprehensive docs
├── Create example tours in demo app
└── Beta release preparation
```

**Deliverables:**
- Working `@tour-kit/react-native` package
- Expo Router and React Navigation adapters
- Example Expo app with basic tours
- Documentation for core features

### Phase 2: Enhanced Features (6-8 weeks)

```
Week 1-2: Branching & Conditions
├── Port branch resolution logic (no changes needed)
├── Implement conditional step visibility (when)
├── Add custom action support (onAction)
├── Cross-tour navigation
└── Loop detection verification

Week 3-4: Hints Package
├── Create @tour-kit/hints-native package
├── Implement HintHotspot with pulse animation
├── Build HintTooltip component
├── Create NativeHintsProvider
└── Add dismissal persistence

Week 5-6: Accessibility Deep Dive
├── Full VoiceOver testing & fixes
├── Full TalkBack testing & fixes
├── Focus management refinement
├── Screen reader announcement polish
└── Reduced motion implementation

Week 7-8: Theming & Customization
├── Implement theme system
├── Add animation presets
├── Create headless component variants
├── Unified Slot for RN (asChild pattern)
└── Style customization documentation
```

**Deliverables:**
- Dynamic branching support
- `@tour-kit/hints-native` package
- Complete accessibility support
- Theme and customization system

### Phase 3: Advanced & Enterprise (6-8 weeks)

```
Week 1-2: Analytics Integration
├── Port analytics plugin system
├── Implement RN-specific event tracking
├── Add funnel visualization support
└── Create analytics documentation

Week 3-4: Extended Packages
├── Port @tour-kit/checklists to native
├── Port @tour-kit/announcements to native
├── Evaluate @tour-kit/media for native
└── Create unified provider for all packages

Week 5-6: Performance & Scale
├── Large tour performance testing
├── Memory leak auditing
├── Animation performance optimization
├── Bundle size optimization
└── Lazy loading strategies

Week 7-8: Enterprise Features
├── A/B testing integration hooks
├── Remote tour configuration
├── Offline tour caching
└── Enterprise documentation
```

**Deliverables:**
- Analytics plugin system
- Extended packages (checklists, announcements)
- Enterprise-grade performance
- Remote configuration support

---

## API Design

### Basic Usage

```tsx
import {
  TourKitProvider,
  NativeTourProvider,
  Tour,
  TourOverlay,
  TourCard,
  TourNavigation,
  useTour,
} from '@tour-kit/react-native';
import { useExpoRouter } from '@tour-kit/react-native/adapters';

// Define tours
const welcomeTour = {
  id: 'welcome',
  steps: [
    {
      id: 'step-1',
      target: 'home-button', // or ref
      title: 'Welcome!',
      content: 'This is your home screen.',
      placement: 'bottom',
    },
    {
      id: 'step-2',
      target: 'settings-button',
      title: 'Settings',
      content: 'Customize your experience here.',
      placement: 'left',
    },
  ],
  onComplete: (context) => {
    console.log('Tour completed!', context);
  },
};

// App setup
export default function App() {
  const router = useExpoRouter();

  return (
    <TourKitProvider
      config={{
        accessibility: { announceStepChanges: true },
        animation: { reducedMotion: 'auto' },
      }}
    >
      <NativeTourProvider
        tours={[welcomeTour]}
        router={router}
      >
        <RootLayout />

        {/* Tour UI */}
        <Tour tourId="welcome">
          <TourOverlay>
            <TourCard>
              <TourNavigation />
            </TourCard>
          </TourOverlay>
        </Tour>
      </NativeTourProvider>
    </TourKitProvider>
  );
}

// In a screen component
function HomeScreen() {
  const { start } = useTour();
  const homeButtonRef = useRef<View>(null);

  useEffect(() => {
    // Auto-start tour for new users
    start('welcome');
  }, []);

  return (
    <View>
      <Pressable
        ref={homeButtonRef}
        // Register target by ID
        accessibilityHint="home-button"
        nativeID="home-button"
      >
        <Text>Home</Text>
      </Pressable>
    </View>
  );
}
```

### Headless Usage

```tsx
import {
  HeadlessTour,
  HeadlessCard,
  HeadlessOverlay,
} from '@tour-kit/react-native/headless';

function CustomTour() {
  return (
    <HeadlessTour tourId="custom">
      {({ isActive, currentStep, next, prev, stop }) => (
        isActive ? (
          <Modal visible transparent>
            <MyCustomOverlay>
              <MyCustomCard step={currentStep}>
                <Button onPress={prev} title="Back" />
                <Button onPress={next} title="Next" />
                <Button onPress={stop} title="Close" />
              </MyCustomCard>
            </MyCustomOverlay>
          </Modal>
        ) : null
      )}
    </HeadlessTour>
  );
}
```

### Router Adapter Pattern

```typescript
// Expo Router
import { usePathname, useRouter } from 'expo-router';
import { createExpoRouterAdapter } from '@tour-kit/react-native/adapters';

export const useExpoRouter = () => {
  const pathname = usePathname();
  const router = useRouter();

  return createExpoRouterAdapter({
    getCurrentRoute: () => pathname,
    navigate: (route) => router.push(route),
    matchRoute: (pattern, route) => {
      // Implement route matching
    },
  });
};

// React Navigation
import { useNavigation, useRoute } from '@react-navigation/native';
import { createReactNavigationAdapter } from '@tour-kit/react-native/adapters';

export const useReactNavigation = () => {
  const navigation = useNavigation();
  const route = useRoute();

  return createReactNavigationAdapter({
    getCurrentRoute: () => route.name,
    navigate: (routeName, params) => navigation.navigate(routeName, params),
    addListener: (event, callback) => navigation.addListener(event, callback),
  });
};
```

### Type Definitions

```typescript
// Extend core types for React Native specifics
import type { TourStep as CoreTourStep } from '@tour-kit/core';

export interface NativeTourStep extends Omit<CoreTourStep, 'target'> {
  /** Target element - nativeID, ref, or testID */
  target: string | React.RefObject<View>;
  /** Card placement (auto = smart positioning) */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  /** Spotlight padding around target */
  spotlightPadding?: number;
  /** Spotlight border radius */
  spotlightRadius?: number;
  /** Custom animation for this step */
  animation?: 'fade' | 'slide' | 'scale' | 'none';
}

export interface NativeTourConfig {
  /** Animation configuration */
  animation?: {
    /** Default animation type */
    type?: 'fade' | 'slide' | 'scale';
    /** Animation duration (ms) */
    duration?: number;
    /** Respect reduced motion preference */
    reducedMotion?: 'auto' | 'always' | 'never';
  };
  /** Overlay configuration */
  overlay?: {
    /** Background color */
    backgroundColor?: string;
    /** Whether tapping overlay closes tour */
    closeOnPress?: boolean;
  };
  /** Accessibility configuration */
  accessibility?: {
    /** Announce step changes to screen readers */
    announceStepChanges?: boolean;
    /** Custom announcement formatter */
    formatAnnouncement?: (step: NativeTourStep, index: number, total: number) => string;
  };
  /** Gesture configuration */
  gestures?: {
    /** Enable swipe navigation */
    swipeEnabled?: boolean;
    /** Swipe threshold (0-1) */
    swipeThreshold?: number;
  };
}
```

---

## Platform Considerations

### iOS Specifics

| Concern | Solution |
|---------|----------|
| Safe Area | Use `react-native-safe-area-context` for all positioning |
| VoiceOver | `accessible`, `accessibilityLabel`, `accessibilityHint` |
| Modal Stacking | Proper `zIndex` and Modal ordering |
| Gestures | Use `react-native-gesture-handler` for reliability |
| Dynamic Island | Detect and adjust positioning |
| iPad Multitasking | Handle window dimension changes |

### Android Specifics

| Concern | Solution |
|---------|----------|
| TalkBack | `accessibilityLiveRegion`, `importantForAccessibility` |
| Back Button | Handle hardware back for tour exit |
| Soft Keyboard | Adjust positioning when keyboard visible |
| Notch/Cutout | Use safe area insets |
| Foldables | Handle screen fold changes |
| StatusBar | Transparent during overlay |

### Expo Specifics

| Concern | Solution |
|---------|----------|
| Expo Go | Ensure all dependencies are Expo-compatible |
| EAS Build | Provide native module build configuration |
| Expo Router | First-class adapter support |
| Expo Updates | Handle tour changes via OTA updates |
| SDK Versions | Support Expo SDK 52+ |

### React Native New Architecture

| Concern | Solution |
|---------|----------|
| Fabric | Test with `RCTView` measurements |
| TurboModules | Ensure native module compatibility |
| Bridgeless | Plan for future bridgeless mode |
| Concurrent Features | Use `startTransition` for tour state |

---

## Testing Strategy

### Testing Pyramid

```
           ┌───────────┐
           │   E2E     │  10%
           │  Tests    │  Detox / Maestro
           └─────┬─────┘
                 │
         ┌───────┴───────┐
         │  Integration  │  30%
         │    Tests      │  RNTL + Context
         └───────┬───────┘
                 │
     ┌───────────┴───────────┐
     │      Unit Tests       │  60%
     │   Hooks / Utilities   │  Vitest
     └───────────────────────┘
```

### Test Categories

#### Unit Tests (Vitest)

```typescript
// Hook testing
describe('useElementMeasure', () => {
  it('returns null for unmounted ref', () => {
    const ref = { current: null };
    const { result } = renderHook(() => useElementMeasure(ref));
    expect(result.current).toBeNull();
  });

  it('measures element dimensions', async () => {
    // Mock measure callback
    const mockElement = {
      measure: (callback) => callback(10, 20, 100, 50, 10, 20),
    };
    const ref = { current: mockElement };
    const { result } = renderHook(() => useElementMeasure(ref));

    await waitFor(() => {
      expect(result.current).toEqual({
        x: 10, y: 20, width: 100, height: 50,
        pageX: 10, pageY: 20,
      });
    });
  });
});
```

#### Integration Tests (RNTL)

```typescript
// Component integration
describe('Tour Flow', () => {
  it('advances through steps on next button press', async () => {
    const { getByText, getByRole } = render(
      <NativeTourProvider tours={[testTour]}>
        <TestComponent />
        <Tour tourId="test" />
      </NativeTourProvider>
    );

    // Start tour
    fireEvent.press(getByText('Start Tour'));

    // Verify first step
    expect(getByText('Step 1 Title')).toBeTruthy();

    // Go to next
    fireEvent.press(getByRole('button', { name: 'Next' }));

    // Verify second step
    expect(getByText('Step 2 Title')).toBeTruthy();
  });
});
```

#### E2E Tests (Detox)

```typescript
// Full flow testing
describe('Onboarding Tour E2E', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('completes welcome tour', async () => {
    // Wait for tour to start
    await expect(element(by.text('Welcome!'))).toBeVisible();

    // Navigate through tour
    await element(by.text('Next')).tap();
    await expect(element(by.text('Step 2'))).toBeVisible();

    await element(by.text('Next')).tap();
    await expect(element(by.text('Step 3'))).toBeVisible();

    await element(by.text('Done')).tap();

    // Verify tour completed
    await expect(element(by.text('Welcome!'))).not.toBeVisible();
  });
});
```

### Accessibility Testing

```typescript
// VoiceOver simulation
describe('Accessibility', () => {
  it('announces step changes', async () => {
    const announcements: string[] = [];
    AccessibilityInfo.announceForAccessibility = jest.fn((msg) => {
      announcements.push(msg);
    });

    const { getByText } = render(<TourWithProvider />);

    fireEvent.press(getByText('Next'));

    expect(announcements).toContain('Step 2 of 3: Feature Overview');
  });

  it('has proper accessibility roles', () => {
    const { getByRole } = render(<TourCard />);

    expect(getByRole('dialog')).toBeTruthy();
    expect(getByRole('button', { name: 'Next' })).toBeTruthy();
    expect(getByRole('button', { name: 'Close tour' })).toBeTruthy();
  });
});
```

---

## Documentation Plan

### Documentation Structure

```
apps/docs/content/docs/
├── react-native/
│   ├── index.mdx                    # Overview & quick start
│   ├── getting-started/
│   │   ├── installation.mdx         # npm install + peer deps
│   │   ├── expo-setup.mdx           # Expo-specific setup
│   │   └── bare-rn-setup.mdx        # Bare React Native setup
│   │
│   ├── components/
│   │   ├── tour.mdx                 # Main tour component
│   │   ├── tour-overlay.mdx         # Overlay/spotlight
│   │   ├── tour-card.mdx            # Card component
│   │   ├── tour-navigation.mdx      # Nav controls
│   │   └── tour-progress.mdx        # Progress indicator
│   │
│   ├── hooks/
│   │   ├── use-tour.mdx             # Main hook (same as web)
│   │   ├── use-element-measure.mdx  # Element measurement
│   │   └── use-gesture-navigation.mdx
│   │
│   ├── adapters/
│   │   ├── expo-router.mdx          # Expo Router integration
│   │   └── react-navigation.mdx     # React Navigation integration
│   │
│   ├── guides/
│   │   ├── multi-screen-tours.mdx   # Cross-screen tours
│   │   ├── accessibility.mdx        # VoiceOver/TalkBack
│   │   ├── theming.mdx              # Customization
│   │   ├── animations.mdx           # Animation guide
│   │   └── migration-from-copilot.mdx
│   │
│   └── examples/
│       ├── basic-tour.mdx
│       ├── onboarding-flow.mdx
│       ├── feature-discovery.mdx
│       └── headless-custom.mdx
│
└── hints-native/
    ├── index.mdx
    └── components/
        ├── hint-hotspot.mdx
        └── hint-tooltip.mdx
```

### Documentation Priorities

| Priority | Section | Content |
|----------|---------|---------|
| P0 | Quick Start | 5-minute tutorial to first tour |
| P0 | Installation | All peer dependency setup |
| P0 | API Reference | Complete prop documentation |
| P1 | Router Adapters | Expo Router + React Navigation guides |
| P1 | Accessibility | VoiceOver/TalkBack best practices |
| P1 | Migration Guide | From react-native-copilot |
| P2 | Advanced Patterns | Headless, theming, branching |
| P2 | Examples | Video walkthroughs |

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| View measurement timing issues | High | High | Add configurable delays, retry logic |
| React Native New Architecture compatibility | Medium | High | Early testing with Fabric/TurboModules |
| Gesture handler conflicts | Medium | Medium | Isolate gestures, provide disable option |
| SVG performance on low-end devices | Medium | Medium | Provide fallback without spotlight cutout |
| Expo Go limitations | Low | Medium | Clear documentation on EAS build requirements |

### Product Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Limited adoption due to competition | Medium | High | Differentiate on headless + TypeScript + web parity |
| Scope creep in Phase 1 | High | Medium | Strict feature prioritization, MVP focus |
| Documentation gaps | Medium | Medium | Hire technical writer, community feedback |
| Breaking changes in dependencies | Low | High | Pin versions, test matrix, migration guides |

### Resource Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Underestimated timeline | High | Medium | Add 20% buffer to all estimates |
| iOS/Android platform expertise gaps | Medium | Medium | Engage platform specialists for review |
| Testing device coverage | Medium | Low | Use cloud device farms (BrowserStack, etc.) |

---

## Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| Headless | UI logic separated from visual components |
| Spotlight | Highlighted area around target element |
| Cutout | Transparent hole in overlay revealing target |
| Beacon | Pulsing indicator drawing attention to feature |
| Step | Single screen in a tour sequence |
| Tour | Ordered collection of steps |
| Branch | Conditional navigation between steps |

### Appendix B: Competitive Feature Matrix

| Feature | Tour Kit RN | Copilot | Spotlight | Walkthrough |
|---------|-------------|---------|-----------|-------------|
| TypeScript | Full | Partial | Full | Minimal |
| Headless Mode | Yes | No | No | No |
| Bundle Size (gzip) | ~15KB | ~25KB | ~20KB | ~10KB |
| Expo Router | Yes | No | No | No |
| React Navigation | Yes | Partial | Partial | No |
| Persistence | Yes | No | No | No |
| Branching | Yes | No | No | No |
| Analytics Plugin | Yes | No | No | No |
| VoiceOver | Full | Partial | Partial | No |
| TalkBack | Full | Partial | Partial | No |
| Reduced Motion | Yes | No | No | No |
| Web Parity | Yes | No | No | No |

### Appendix C: Bundle Size Budget

| Package | Budget (gzip) | Breakdown |
|---------|---------------|-----------|
| @tour-kit/core | 8KB | Types: 2KB, Hooks: 4KB, Utils: 2KB |
| @tour-kit/react-native | 15KB | Components: 8KB, Adapters: 3KB, Utils: 4KB |
| @tour-kit/hints-native | 5KB | Components: 3KB, Hooks: 2KB |
| **Total** | **28KB** | Target for full installation |

### Appendix D: Research Sources

- [Expo Documentation](https://expo.dev/) - Expo SDK, routing, native modules
- [React Native Documentation](https://reactnative.dev/) - Core components, accessibility
- [React Navigation](https://reactnavigation.org/) - Navigation patterns
- [react-native-product-tour](https://www.npmjs.com/package/react-native-product-tour) - Competitive analysis
- [Chameleon Blog - React Product Tours](https://www.chameleon.io/blog/react-product-tour) - Industry best practices
- [Fizl Onboarding Implementation](https://fizl.io/blog/posts/onboarding) - Case study with 53% activation improvement

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-24 | AI Assistant | Initial PRD creation |

---

## Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Tech Lead | | | |
| Engineering Manager | | | |

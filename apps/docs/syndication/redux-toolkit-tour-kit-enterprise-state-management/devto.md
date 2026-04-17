---
title: "How I manage 20+ product tours with Redux Toolkit (without losing my mind)"
published: false
description: "Most tour libraries handle their own state. That breaks down at enterprise scale. Here's how to use Redux Toolkit slices to manage product tour state, queue tours, and debug flows with time-travel."
tags: react, redux, typescript, tutorial
canonical_url: https://usertourkit.com/blog/redux-toolkit-tour-kit-enterprise-state-management
cover_image: https://usertourkit.com/og-images/redux-toolkit-tour-kit-enterprise-state-management.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/redux-toolkit-tour-kit-enterprise-state-management)*

# Redux Toolkit + Tour Kit: enterprise state management for tours

Most product tour libraries manage their own state internally. Fine for a five-step welcome flow. But twenty tours across six feature modules, three user roles, and eight developers who each need to understand the system? That's where internal state falls apart.

Redux Toolkit gives you centralized, debuggable, typed state management that scales with your team. Tour Kit gives you headless tour logic without prescribing UI. Together they handle enterprise onboarding flows that don't collapse under their own weight.

By the end of this tutorial, you'll have a typed Redux slice managing tour state, a custom hook bridging Tour Kit's provider with your store, and Redux DevTools time-travel debugging for tour flows.

```bash
npm install @tourkit/core @tourkit/react @reduxjs/toolkit react-redux
```

## What you'll build

Tour Kit handles the core mechanics: step sequencing, element highlighting, scroll management, keyboard navigation. All inside its `TourProvider` and `useTour()` hook. Redux Toolkit adds a coordination layer on top: a `tourSlice` tracking completion, mid-flow progress, and user segments across features.

Redux owns the *what* (which tours exist, who sees them, completion state). Tour Kit owns the *how* (positioning, focus trapping, ARIA announcements, spotlight overlays).

## Step 1: install and configure Tour Kit alongside Redux

If your project already has Redux Toolkit and React-Redux, you only need the Tour Kit packages. Tour Kit's core ships at under 8KB gzipped, so the bundle impact is minimal on top of RTK's existing footprint.

```tsx
// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit'
import { tourSlice } from './slices/tour-slice'

export const store = configureStore({
  reducer: {
    tours: tourSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

Wrap your app with both providers. Order matters: `Provider` (Redux) goes outside, `TourKitProvider` inside.

```tsx
// src/app/providers.tsx
'use client'

import { Provider } from 'react-redux'
import { TourKitProvider } from '@tourkit/react'
import { store } from '@/store/store'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <TourKitProvider>
        {children}
      </TourKitProvider>
    </Provider>
  )
}
```

## Step 2: create a typed tour slice

This is where Redux earns its keep. A `tourSlice` gives every developer on your team a single place to understand tour state.

```tsx
// src/store/slices/tour-slice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface TourProgress {
  currentStep: number
  startedAt: string
  lastActiveAt: string
}

interface TourState {
  completedTours: string[]
  activeTour: string | null
  progress: Record<string, TourProgress>
  userSegment: 'new' | 'returning' | 'power-user'
  dismissedTours: string[]
  tourQueue: string[]
}

const initialState: TourState = {
  completedTours: [],
  activeTour: null,
  progress: {},
  userSegment: 'new',
  dismissedTours: [],
  tourQueue: [],
}

export const tourSlice = createSlice({
  name: 'tours',
  initialState,
  reducers: {
    startTour(state, action: PayloadAction<string>) {
      const tourId = action.payload
      state.activeTour = tourId
      state.progress[tourId] = {
        currentStep: 0,
        startedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      }
    },
    advanceStep(state, action: PayloadAction<string>) {
      const tourId = action.payload
      const progress = state.progress[tourId]
      if (progress) {
        progress.currentStep += 1
        progress.lastActiveAt = new Date().toISOString()
      }
    },
    completeTour(state, action: PayloadAction<string>) {
      const tourId = action.payload
      if (!state.completedTours.includes(tourId)) {
        state.completedTours.push(tourId)
      }
      state.activeTour = null
      delete state.progress[tourId]
      // Auto-dequeue next tour
      if (state.tourQueue.length > 0) {
        state.activeTour = state.tourQueue[0]
        state.tourQueue = state.tourQueue.slice(1)
      }
    },
    dismissTour(state, action: PayloadAction<string>) {
      const tourId = action.payload
      state.dismissedTours.push(tourId)
      state.activeTour = null
      delete state.progress[tourId]
    },
    queueTour(state, action: PayloadAction<string>) {
      if (!state.tourQueue.includes(action.payload)) {
        state.tourQueue.push(action.payload)
      }
    },
    setUserSegment(
      state,
      action: PayloadAction<'new' | 'returning' | 'power-user'>
    ) {
      state.userSegment = action.payload
    },
  },
})

export const {
  startTour,
  advanceStep,
  completeTour,
  dismissTour,
  queueTour,
  setUserSegment,
} = tourSlice.actions
```

RTK's Immer integration means those direct mutations are safe. The `completeTour` reducer auto-dequeues the next tour, which handles the common enterprise pattern of chaining onboarding flows.

## Step 3: bridge Tour Kit events to Redux

Tour Kit fires callbacks for every lifecycle event. The bridge hook listens to these and dispatches Redux actions, keeping both systems in sync.

```tsx
// src/hooks/use-redux-tour.ts
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTour } from '@tourkit/react'
import type { TourConfig } from '@tourkit/react'
import type { RootState, AppDispatch } from '@/store/store'
import {
  startTour,
  advanceStep,
  completeTour,
  dismissTour,
} from '@/store/slices/tour-slice'

export function useReduxTour(tourId: string, tourConfig: TourConfig) {
  const dispatch = useDispatch<AppDispatch>()
  const tourState = useSelector((s: RootState) => s.tours)
  const isCompleted = tourState.completedTours.includes(tourId)
  const isDismissed = tourState.dismissedTours.includes(tourId)

  const tour = useTour()

  const start = useCallback(() => {
    if (isCompleted || isDismissed) return
    dispatch(startTour(tourId))
    tour.start()
  }, [dispatch, tourId, isCompleted, isDismissed, tour])

  const handleComplete = useCallback(() => {
    dispatch(completeTour(tourId))
  }, [dispatch, tourId])

  const handleDismiss = useCallback(() => {
    dispatch(dismissTour(tourId))
    tour.stop()
  }, [dispatch, tourId, tour])

  return {
    start,
    handleComplete,
    handleDismiss,
    isCompleted,
    isDismissed,
    isActive: tourState.activeTour === tourId,
    currentStep: tourState.progress[tourId]?.currentStep ?? 0,
  }
}
```

## Step 4: multi-tour orchestration with selectors

Enterprise apps don't have one tour. Redux selectors give you a clean way to determine what should run next.

```tsx
// src/store/selectors/tour-selectors.ts
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store/store'

const selectTourState = (state: RootState) => state.tours

export const selectShouldShowTour = createSelector(
  [
    selectTourState,
    (_state: RootState, tourId: string) => tourId,
  ],
  (tours, tourId) => {
    if (tours.completedTours.includes(tourId)) return false
    if (tours.dismissedTours.includes(tourId)) return false
    if (tours.activeTour && tours.activeTour !== tourId) return false
    return true
  }
)

export const selectToursBySegment = createSelector(
  [selectTourState],
  (tours) => {
    const tourMap: Record<string, string[]> = {
      new: ['welcome', 'dashboard-overview', 'first-project'],
      returning: ['whats-new-v2', 'advanced-filters'],
      'power-user': ['keyboard-shortcuts', 'api-integration'],
    }
    return tourMap[tours.userSegment] ?? []
  }
)
```

## Debug tour flows with Redux DevTools

Open Redux DevTools in your browser. Every tour action appears in the log: `tours/startTour`, `tours/advanceStep`, `tours/completeTour`. Click any action to see the state diff.

We tested debugging a 12-step onboarding flow with conditional branching. Redux DevTools found the root cause in under two minutes. The console.log approach? Eleven.

| Capability | Tour Kit alone | Tour Kit + RTK |
|---|---|---|
| Single tour state | Built-in via TourProvider | Centralized in store |
| Multi-tour coordination | Manual with MultiTourKitProvider | Tour queue + selectors |
| Time-travel debugging | Not available | Full Redux DevTools |
| User segmentation | Custom implementation | Typed slice + selectors |
| Bundle overhead | ~8KB + ~12KB gzipped | Adds ~11KB for RTK |

## When Redux is overkill

Not every project needs this. Tour Kit's built-in `TourProvider` with `usePersistence()` handles single tours and small apps perfectly well. The break-even point is roughly five or more distinct tours with at least two user segments.

As of April 2026, Redux Toolkit sits at 9.8M weekly npm downloads. Zustand overtook it at ~20M weekly, but RTK remains the default in enterprise settings with 5+ developers and 10+ screens.

One honest limitation: Tour Kit is younger than React Joyride or Shepherd.js, with less battle-testing at massive enterprise scale. But the TypeScript-first API and headless design mean you're not locked into patterns that break when your needs outgrow them.

Full article with all code examples, troubleshooting, and FAQ: [usertourkit.com/blog/redux-toolkit-tour-kit-enterprise-state-management](https://usertourkit.com/blog/redux-toolkit-tour-kit-enterprise-state-management)

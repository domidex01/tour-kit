---
title: "Redux Toolkit + Tour Kit: enterprise state management for tours"
slug: "redux-toolkit-tour-kit-enterprise-state-management"
canonical: https://usertourkit.com/blog/redux-toolkit-tour-kit-enterprise-state-management
tags: react, redux, typescript, web-development
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

Tour Kit's core ships at under 8KB gzipped, so the bundle impact is minimal on top of RTK's existing footprint.

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

Wrap your app with both providers. Redux `Provider` goes outside, `TourKitProvider` inside.

```tsx
// src/app/providers.tsx
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

A `tourSlice` gives every developer a single place to understand tour state. No hunting through component trees.

```tsx
// src/store/slices/tour-slice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface TourState {
  completedTours: string[]
  activeTour: string | null
  progress: Record<string, { currentStep: number; startedAt: string }>
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
      state.activeTour = action.payload
      state.progress[action.payload] = {
        currentStep: 0,
        startedAt: new Date().toISOString(),
      }
    },
    completeTour(state, action: PayloadAction<string>) {
      if (!state.completedTours.includes(action.payload)) {
        state.completedTours.push(action.payload)
      }
      state.activeTour = null
      delete state.progress[action.payload]
      // Auto-dequeue next tour
      if (state.tourQueue.length > 0) {
        state.activeTour = state.tourQueue[0]
        state.tourQueue = state.tourQueue.slice(1)
      }
    },
    dismissTour(state, action: PayloadAction<string>) {
      state.dismissedTours.push(action.payload)
      state.activeTour = null
    },
    queueTour(state, action: PayloadAction<string>) {
      if (!state.tourQueue.includes(action.payload)) {
        state.tourQueue.push(action.payload)
      }
    },
  },
})
```

The `completeTour` reducer auto-dequeues the next tour, handling the common enterprise pattern of chaining onboarding flows.

## Step 3: bridge Tour Kit events to Redux

Tour Kit fires callbacks for every lifecycle event. A bridge hook dispatches Redux actions, keeping both systems in sync.

```tsx
// src/hooks/use-redux-tour.ts
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTour } from '@tourkit/react'
import type { RootState, AppDispatch } from '@/store/store'
import { startTour, completeTour, dismissTour } from '@/store/slices/tour-slice'

export function useReduxTour(tourId: string) {
  const dispatch = useDispatch<AppDispatch>()
  const tourState = useSelector((s: RootState) => s.tours)
  const isCompleted = tourState.completedTours.includes(tourId)
  const tour = useTour()

  const start = useCallback(() => {
    if (isCompleted) return
    dispatch(startTour(tourId))
    tour.start()
  }, [dispatch, tourId, isCompleted, tour])

  const handleComplete = useCallback(() => {
    dispatch(completeTour(tourId))
  }, [dispatch, tourId])

  return { start, handleComplete, isCompleted, isActive: tourState.activeTour === tourId }
}
```

## When Redux is overkill

Tour Kit's built-in `TourProvider` with `usePersistence()` handles single tours perfectly. The break-even point is roughly five or more distinct tours with at least two user segments.

As of April 2026, RTK sits at 9.8M weekly npm downloads. Zustand overtook it at ~20M weekly, but RTK remains dominant in enterprise settings with 5+ developers because DevTools debugging and strict slices prevent state chaos as teams grow.

Tour Kit doesn't prescribe a state management solution. It composes with Redux, Zustand, Jotai, or plain context through lifecycle callbacks. No lock-in.

Full article with all six steps, troubleshooting guide, comparison table, and FAQ: [usertourkit.com/blog/redux-toolkit-tour-kit-enterprise-state-management](https://usertourkit.com/blog/redux-toolkit-tour-kit-enterprise-state-management)

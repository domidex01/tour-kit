---
title: "Replace localStorage with Supabase for product tour state (React + TypeScript)"
published: false
description: "localStorage loses tour progress on device switch or cache clear. Here's how to persist product tour state per user in Supabase PostgreSQL with RLS — about 90 lines of TypeScript."
tags: react, typescript, supabase, tutorial
canonical_url: https://usertourkit.com/blog/supabase-product-tour-state
cover_image: https://usertourkit.com/og-images/supabase-product-tour-state.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/supabase-product-tour-state)*

# Tour Kit + Supabase: tracking tour state per user

Your onboarding tour works. Users step through it, reach the end, and the tour doesn't reappear because you stored a `completed: true` flag in localStorage. Then one of three things happens: the user clears their browser data, switches to their work laptop, or opens your app on their phone. The flag is gone. The tour replays from step 1.

localStorage isn't persistence. It's a suggestion.

Supabase gives you a PostgreSQL database with built-in auth and Row Level Security (RLS) on a free tier that covers 50,000 monthly active users. Replacing that localStorage call with a Supabase upsert means tour state follows the user across every device, every browser, every cleared cache. The code change is smaller than you'd expect.

This tutorial builds a custom storage adapter that syncs Tour Kit's tour progress to a Supabase table. By the end, you'll have a `tour_progress` table protected by RLS policies, a custom storage adapter, and a working integration you can drop into any React app. About 90 lines of TypeScript total.

```bash
npm install @tourkit/core @tourkit/react @supabase/supabase-js
```

## What you'll build

Tour Kit's `TourKitProvider` accepts a `storage` prop that controls where tour state gets read and written. By default it uses localStorage, but the interface is a simple `get`/`set`/`remove` contract. This tutorial replaces that default with a Supabase-backed adapter: tour progress writes to a `tour_progress` table in PostgreSQL, protected by Row Level Security so each user can only access their own rows. The result is cross-device tour state that survives browser resets, incognito sessions, and device switches. Tour Kit doesn't ship a built-in Supabase adapter (and requires React 18+), so you'll write the glue code yourself.

## Why Supabase for tour state?

Supabase is the most common open-source Firebase alternative for React projects in 2026, and for good reason. It auto-generates TypeScript types from your database schema, supports React 19 and Server Components (unlike Firebase's ReactFire, which [fell behind React 19's evolution](https://makerkit.dev/blog/saas/supabase-vs-firebase)), and starts free with a predictable upgrade path to $25/month.

For tour state specifically, three things matter:

Row Level Security means you write one SQL policy and every query is automatically scoped to the authenticated user. No server-side middleware. No manual `WHERE user_id = ?` clauses in your application code.

JSONB columns store arbitrary tour state without schema migrations. Add a new tour next month? The column handles it, no ALTER TABLE required.

Supabase's `@supabase/supabase-js` client works identically in browser and server environments, so the same adapter works whether you're rendering client-side or hydrating from a Next.js Server Component. As of April 2026, DigitalOcean also [launched an official Supabase template](https://www.digitalocean.com/blog/supabase-template-app-platform) on its App Platform, signaling growing production adoption.

| Storage method | Cross-device | Survives cache clear | Per-user isolation | Queryable |
|---|---|---|---|---|
| localStorage | No | No | No (device-scoped) | No |
| Supabase (PostgreSQL) | Yes | Yes | Yes (RLS policies) | Yes (SQL, JSONB operators) |
| Firebase Firestore | Yes | Yes | Yes (security rules) | Limited (NoSQL queries) |

## Prerequisites

- React 18.2+ or React 19
- A Supabase project (the [free tier](https://supabase.com/pricing) covers 500 MB storage, 50K MAU, and unlimited API requests as of April 2026)
- Tour Kit installed (`@tourkit/core` + `@tourkit/react`)
- A working product tour with at least 2 steps

No tour yet? The [Next.js App Router tutorial](https://usertourkit.com/blog/nextjs-app-router-product-tour) gets you from zero to a working tour in under 5 minutes.

## Step 1: Create the tour_progress table

Open the Supabase SQL Editor in your project dashboard and run this migration. The table stores one row per user, with all tour state packed into a single JSONB column.

```sql
-- supabase/migrations/001_tour_progress.sql
CREATE TABLE tour_progress (
  user_id    UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  state      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (without this, the table is open to any authenticated request)
ALTER TABLE tour_progress ENABLE ROW LEVEL SECURITY;

-- Users can read their own tour progress
CREATE POLICY "Users can view own tour progress"
  ON tour_progress FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- Users can insert their own row
CREATE POLICY "Users can insert own tour progress"
  ON tour_progress FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Users can update their own row
CREATE POLICY "Users can update own tour progress"
  ON tour_progress FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Performance: index is critical for RLS policy evaluation
CREATE INDEX idx_tour_progress_user_id ON tour_progress (user_id);
```

A few decisions worth explaining.

**One row per user, not one row per tour.** The JSONB `state` column holds progress for every tour: `{ "welcome-tour": { "completed": true, "step": 5 }, "feature-tour": { "completed": false, "step": 2 } }`. This means one read on login loads all tour state. If you have hundreds of tours per user (unlikely for most SaaS apps), you'd normalize into separate rows. For the typical 3-10 tours, a single JSONB column is simpler and faster.

**Why `(select auth.uid())`?** According to [Supabase's RLS performance guide](https://supabase.com/docs/guides/database/postgres/row-level-security), wrapping `auth.uid()` in a subselect improves policy evaluation from 179ms to 9ms, a 95% improvement. PostgreSQL evaluates the subselect once per query instead of once per row.

**`ON DELETE CASCADE`.** Account deletion automatically removes the tour progress row. No orphaned data, no cleanup jobs.

Here's the gotcha we hit during testing: when `auth.uid()` returns `null` (unauthenticated requests), the comparison `null = user_id` evaluates to `null`, not `false`. Adding `TO authenticated` on each policy prevents this from leaking data. If you omit that clause, add an explicit `auth.uid() IS NOT NULL` check.

## Step 2: Initialize the Supabase client

```tsx
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Store these in environment variables, never hardcode
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

For Next.js, replace `import.meta.env.VITE_*` with `process.env.NEXT_PUBLIC_*`. The anon key is safe to expose because RLS policies enforce access control, not the key itself.

## Step 3: Build the Supabase storage adapter

Tour Kit's storage interface expects three methods: `get(key)`, `set(key, value)`, and `remove(key)`. The adapter below maps these to Supabase reads and upserts on the `tour_progress` table.

```tsx
// src/lib/supabase-tour-storage.ts
import { supabase } from './supabase'

interface TourState {
  [tourId: string]: {
    completed: boolean
    currentStep: number
    lastUpdated: string
  }
}

export function createSupabaseTourStorage() {
  let cache: TourState | null = null
  let userId: string | null = null

  async function ensureUserId(): Promise<string | null> {
    if (userId) return userId
    const { data } = await supabase.auth.getUser()
    userId = data.user?.id ?? null
    return userId
  }

  async function loadState(): Promise<TourState> {
    if (cache) return cache
    const uid = await ensureUserId()
    if (!uid) return {}

    const { data, error } = await supabase
      .from('tour_progress')
      .select('state')
      .eq('user_id', uid)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, not an error for new users
      console.error('Failed to load tour state:', error.message)
    }

    cache = (data?.state as TourState) ?? {}
    return cache
  }

  async function saveState(state: TourState): Promise<void> {
    const uid = await ensureUserId()
    if (!uid) return

    const { error } = await supabase
      .from('tour_progress')
      .upsert(
        { user_id: uid, state, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.error('Failed to save tour state:', error.message)
      return
    }
    cache = state
  }

  return {
    async get(key: string): Promise<string | null> {
      const state = await loadState()
      const value = state[key]
      return value ? JSON.stringify(value) : null
    },

    async set(key: string, value: string): Promise<void> {
      const state = await loadState()
      state[key] = JSON.parse(value)
      await saveState(state)
    },

    async remove(key: string): Promise<void> {
      const state = await loadState()
      delete state[key]
      await saveState(state)
    },
  }
}
```

An in-memory cache prevents redundant network calls during a session. On the first `get()`, the adapter loads the full JSONB blob. Subsequent reads are instant. Writes go to both cache and Supabase.

This is an optimistic approach: the UI updates from cache immediately while the upsert runs in the background. For a tour state update (not financial data), that tradeoff works well.

## Step 4: Wire the adapter into Tour Kit

```tsx
// src/components/TourProvider.tsx
'use client' // for Next.js App Router

import { TourKitProvider } from '@tourkit/react'
import { createSupabaseTourStorage } from '../lib/supabase-tour-storage'
import { useMemo } from 'react'

const storage = createSupabaseTourStorage()

export function AppTourProvider({ children }: { children: React.ReactNode }) {
  return (
    <TourKitProvider storage={storage}>
      {children}
    </TourKitProvider>
  )
}
```

That's the entire integration. Replace your existing `TourKitProvider` with this wrapper and tour state now persists to Supabase. No changes to your tour definitions, step components, or UI code.

## Step 5: Verify it works

Open your app in Chrome, start a tour, advance to step 3, then close the browser. Open the app in Firefox (or an incognito window while logged into the same account). The tour should resume at step 3.

Check the data in Supabase:

```sql
SELECT user_id, state, updated_at
FROM tour_progress
WHERE user_id = auth.uid();
```

You should see something like:

```json
{
  "welcome-tour": {
    "completed": false,
    "currentStep": 3,
    "lastUpdated": "2026-04-09T14:30:00.000Z"
  }
}
```

If the row is empty or missing, check three things:
1. The user is authenticated (anonymous users can't write with the RLS policies above)
2. RLS is enabled on the table (`ALTER TABLE tour_progress ENABLE ROW LEVEL SECURITY`)
3. The policies target the `authenticated` role (check the `TO authenticated` clause)

If RLS is misconfigured, you'll see: `new row violates row-level security policy for table "tour_progress"`. That means the INSERT or UPDATE policy doesn't match the current user's JWT.

## Going further

### JSONB vs normalized tables

The single-JSONB approach works for most apps. But if you need to run analytics queries across all users ("what percentage of users completed the welcome tour?"), JSONB requires operators like `state->>'welcome-tour'` which don't index well.

For analytics-heavy use cases, consider a normalized schema:

```sql
CREATE TABLE tour_events (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users ON DELETE CASCADE,
  tour_id    TEXT NOT NULL,
  step       INT NOT NULL,
  completed  BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tour_id)
);
```

This lets you run `SELECT tour_id, COUNT(*) FILTER (WHERE completed) FROM tour_events GROUP BY tour_id` without JSONB parsing. The tradeoff: one query per tour instead of one query for all tours.

### Free tier limitations

Supabase's free tier pauses projects after 1 week of inactivity (as of April 2026). In development, this means you'll occasionally hit a cold start when returning to a project after a break. The fix: upgrade to Pro ($25/month) for production, or wake the project manually before testing. The free tier is fine for prototyping, not for shipping to users.

For context: Supabase's free tier includes 500 MB of database storage, 50,000 MAU, and unlimited API requests. Tour state rows are tiny (< 1 KB each), so you'd need half a million users before storage becomes a concern.

## FAQ

### Can I use Supabase for tour state without Supabase Auth?

Tour Kit's Supabase storage adapter relies on `auth.uid()` in the RLS policies to scope data per user. If you're using a different auth provider (Clerk, Auth0, NextAuth), you'd need to pass a JWT that Supabase can verify. Supabase supports custom JWT secrets for exactly this pattern, but the setup is more involved. For most apps, using Supabase Auth alongside your existing auth is the simpler path.

### How much latency does a Supabase upsert add to tour transitions?

Tour Kit's UI updates from the in-memory cache immediately while the `tour_progress` upsert runs asynchronously. Supabase round-trips add roughly 50-150ms depending on region, but users won't see it because the cache is always ahead. On initial page load, fetching the JSONB blob completes during the loading state before any tour renders.

### What happens when a user deletes their account?

Because of `ON DELETE CASCADE` on the `user_id` foreign key, PostgreSQL automatically removes the `tour_progress` row when the auth user is deleted. No cleanup code, no orphaned rows, no cron jobs.

### Should I use Supabase Realtime for tour state?

Probably not. Real-time subscriptions add WebSocket overhead and complexity. Tour state changes infrequently (a few writes per session) and doesn't need sub-second propagation between devices. The fetch-on-load pattern from this tutorial handles the 99% case. Reserve Supabase Realtime for features where millisecond-level sync matters, like collaborative editing or live cursors.

---

*Tour Kit is our project — we built the storage adapter interface specifically to support backends like Supabase without locking you into localStorage. Every claim above is verifiable against the [Supabase docs](https://supabase.com/docs) and [Tour Kit docs](https://usertourkit.com). Tour Kit requires React 18+ and doesn't have a visual builder.*

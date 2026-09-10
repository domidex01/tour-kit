---
'@tour-kit/announcements': minor
---

Add `@tour-kit/announcements/engine`, a React-free subpath.

The queue, priority ordering, frequency rules, audience evaluation, schedule
resolution and persistence now live in a framework-agnostic engine that runs in
plain Node, Vue, Svelte or a `<script>` tag — no React, no JSX runtime, no DOM.
`<AnnouncementsProvider>` is a thin binding over it and behaves exactly as
before.

Three things are new on the engine, each defaulting to today's behaviour:

- `setSegments(segments)` — segment audiences are engine-owned now. They fail
  closed until admitted, which is what happens today with no
  `<SegmentationProvider>` mounted. The React provider forwards `useSegments()`.
- `isScheduleActive` — an injectable evaluator for the optional
  `@tour-kit/scheduling` peer. The default is the existing call-time `require`,
  which degrades open; ESM consumers can now opt into real schedule gating by
  passing `isScheduleActive` from `@tour-kit/scheduling/engine`.
- `analytics` — an injected callback rather than the `@tour-kit/analytics` hook.

One internal fix rides along: the queue advance is now a single transition.
Previously `getNext()` dequeued and a separate dispatch re-synced the queue, so
a subscriber could observe a frame in which the promoted announcement had left
the queue and not yet arrived.

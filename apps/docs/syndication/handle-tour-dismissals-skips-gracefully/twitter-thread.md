## Thread (6 tweets)

**1/** 70% of users skip product tours. 78% abandon by step 3. But here's the counter-intuitive part: forcing users through the tour produces SIMILAR churn to letting them skip.

The problem isn't skipping. It's what happens after.

**2/** Three-step tours: 72% completion
Seven-step tours: 16% completion
User-triggered: ~67%
Auto-triggered pop-ups: single-digit %

That 56-point gap between 3 and 7 steps means most of your dismissal handling runs on the majority of users, not edge cases.

(Data: Chameleon 2025 Benchmark)

**3/** We categorized dismissals into 5 types, each needing a different response:

- Explicit skip → store + don't re-trigger
- Escape key → WCAG requirement, lighter touch
- Click-outside → ambiguous, offer resume nudge
- Navigation away → persist step, resume on return
- Timeout → auto-minimize to beacon

**4/** The pattern nobody implements: Snooze.

Instead of binary show/dismiss, give users:
- "Remind me later" (1h)
- "Show next time" (next session)
- "Don't show again" (permanent)

Key: persist the CURRENT step. Restarting from step 1 after reaching step 4 guarantees permanent dismissal.

**5/** Most surprising gap: no major product tour library tracks WHY users dismiss — just THAT they did.

Capturing "too long" vs "already know this" vs "bad timing" alongside the step index is dramatically more actionable than a generic skip count.

**6/** Full guide with working TypeScript/React code for each pattern — snooze, resume, reason tracking, contextual re-engagement, and a11y requirements:

https://usertourkit.com/blog/handle-tour-dismissals-skips-gracefully

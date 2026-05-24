# Sprint 1 — Analytics version-bump decision

> Captured during Phase 0 pre-flight on 2026-05-24, per `phase-0-preflight.md` §0.6.

Current `@tour-kit/analytics` version: **`0.11.3`** (verified at `packages/analytics/package.json`).

The `.changeset/config.json` linked list contains only `core`, `react`, `hints` — so a major-or-minor bump on `analytics` does NOT cascade. Decision is local to this package.

## Options

- [ ] **Option A:** `0.11.3` → `0.12.0` (minor; treat the SDK-inlining cleanup as a "you shouldn't have been using these" cleanup with no release-note ceremony). Risk: semver-strict consumers won't get pinned but their builds break.
- [ ] **Option B:** `0.11.3` → `1.0.0` (proper major). Risk: signals a stability we don't want to claim for a 0.x lib whose post-fix surface is ~6 KB.
- [x] **Option C:** `0.11.3` → `0.12.0` AND explicitly call it breaking in release notes / changeset. Same install risk as A, but documented.

## Rationale (Option C)

0.x semver convention permits breaking changes at minor bumps. The audit lands `@tour-kit/analytics` at ~6 KB gz post-fix — that is not the kind of surface that should claim 1.0 stability yet (`@tour-kit/core`, `@tour-kit/react`, `@tour-kit/hints` are still 0.x). Documenting the break loudly via a `minor`-typed changeset (with a "BREAKING CHANGES" block in the body) gives semver-strict consumers the information they need without falsely advertising stability.

## What Phase 2 must do

When Phase 2 opens the analytics fix PR, the changeset MUST:

1. Use `"@tour-kit/analytics": minor` (not `major`).
2. Have a `BREAKING CHANGES:` heading in the body listing every removed/renamed export.
3. Reference this file: `tasks/sprint-1-stop-the-bleeding/baselines/decision.md`.

If Phase 2 instead bumps to `major` (1.0.0) or skips the BREAKING CHANGES block, the Phase 2 reviewer should block the merge and point at this decision.

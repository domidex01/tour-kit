# Tour Kit Launch Readiness Plan

## Status Overview

| Area                              | Status             | Notes                                      |
| --------------------------------- | ------------------ | ------------------------------------------ |
| Core packages (core, react, hints)| Production-ready   | Fully implemented, tested, documented      |
| Publishing config (npm, changesets)| Ready             | All package.json properly configured       |
| CI/CD (build, test, release)      | Ready              | Build, test, size check, release workflows |
| Documentation site                | Comprehensive      | All packages documented with examples      |
| Examples (Next.js, Vite)          | Working            | 3 demo apps functional                     |
| Linting & TypeScript strict mode  | Configured         | Biome + strict TS                          |
| Extended packages                 | Beta-quality       | Low test coverage, no changelogs           |

---

## 1. End-to-End Install & Usage Test

**Priority: HIGH**

Create an integration test that simulates a real user installing and using tour-kit.

### What it should do

- Publish packages to a local registry (Verdaccio)
- Scaffold a fresh Next.js app and a fresh Vite + React app
- Run `npm install @tour-kit/react` in both
- Import components, render a basic tour, assert it works
- Verify ESM and CJS imports resolve correctly
- Verify TypeScript types are accessible
- Run in CI on every release candidate

### Why

This catches broken exports, missing files in the `files` array, peer dependency conflicts, and import resolution bugs — the kind of issues that only surface for real consumers.

---

## 2. Pro Features & License Key System

**Priority: HIGH**

### Free vs Pro Split

| Free (MIT)          | Pro (Licensed)              |
| ------------------- | --------------------------- |
| `@tour-kit/core`    | `@tour-kit/adoption`        |
| `@tour-kit/react`   | `@tour-kit/analytics`       |
| `@tour-kit/hints`   | `@tour-kit/announcements`   |
|                     | `@tour-kit/checklists`      |
|                     | `@tour-kit/media`           |
|                     | `@tour-kit/scheduling`      |

### Implementation Needs

- **License key validation**: JWT-based or simple key check against a server
- **`LicenseProvider`**: React context wrapper that gates pro package features
- **Grace period**: Dev-mode bypass so developers can evaluate before purchasing
- **License server**: Integrate with Gumroad, LemonSqueezy, or build custom
- **Enforcement strategy**: Console warnings in dev, feature lockout in production
- **Offline support**: Cache license validation so it works without network

### Considerations

- License check should NOT block rendering or cause layout shift
- Free packages must remain fully functional without any license
- Pro packages should degrade gracefully (show warning, not crash)

---

## 3. Test Coverage Gaps

**Priority: HIGH (blocking for extended packages)**

### Current State

| Package        | Test Files | Source Files | Coverage Ratio | Target |
| -------------- | ---------- | ------------ | -------------- | ------ |
| core           | 23         | 37           | 62%            | ✓ Good |
| react          | 22         | 49           | 45%            | OK     |
| hints          | 11         | 24           | 46%            | OK     |
| media          | 2          | 31           | 6%             | 20+    |
| announcements  | 4          | 47           | 8%             | 25+    |
| adoption       | 6          | 48           | 12%            | 30+    |
| scheduling     | 3          | 19           | 16%            | 12+    |
| checklists     | 13         | 35           | 37%            | OK     |
| analytics      | 9 (skipped)| 15           | Broken         | Fix    |

### Action Items

- [ ] Fix Amplitude plugin dynamic import mocking in analytics (15+ tests skipped)
- [ ] Write tests for media package (YouTube, Vimeo, Loom embeds, URL parsing)
- [ ] Write tests for announcements (modal, slideout, banner, toast, spotlight)
- [ ] Write tests for adoption (tracking engine, nudge scheduler, components)
- [ ] Write tests for scheduling (schedule evaluation, timezone handling, recurrence)
- [ ] Ensure all packages meet 80% coverage threshold defined in vitest config

---

## 4. Fix Known Bugs

**Priority: HIGH**

- [ ] **Analytics — Amplitude plugin**: Dynamic import mocking broken at `packages/analytics/src/__tests__/plugins/amplitude.test.ts:127`. 15+ tests in `describe.skip()` blocks.
- [ ] Verify all other `*.skip()` and `TODO` markers across the repo

---

## 5. Missing Files & Configuration

**Priority: MEDIUM**

### Root Level

- [ ] Add `LICENSE` file (MIT) to repo root — currently only declared in package.json
- [ ] Add `SECURITY.md` with vulnerability disclosure policy
- [ ] Add `CONTRIBUTING.md` with contribution guidelines

### Package Level

- [ ] `@tour-kit/adoption`: Add `README.md` and `CHANGELOG.md` to `files` array in package.json
- [ ] Add `CHANGELOG.md` to all extended packages (adoption, analytics, announcements, checklists, media, scheduling)

### Bundle Size Monitoring

- [ ] Add entries to `.size-limit.json` for all extended packages:
  - `@tour-kit/adoption`
  - `@tour-kit/analytics`
  - `@tour-kit/announcements`
  - `@tour-kit/checklists`
  - `@tour-kit/media`
  - `@tour-kit/scheduling`

---

## 6. npm Publishing Dry Run

**Priority: MEDIUM**

- [ ] Run `pnpm publish --dry-run` on each package
- [ ] Verify `files` field includes everything needed (dist, README, CHANGELOG, LICENSE)
- [ ] Verify `exports` map works with ESM and CJS consumers
- [ ] Verify TypeScript declarations are included and resolve correctly
- [ ] Check no unnecessary files are included (tests, source maps, etc.)

---

## 7. Version Strategy Decision

**Priority: MEDIUM**

### Current Versions

```
@tour-kit/core:          0.3.0
@tour-kit/react:         0.4.1
@tour-kit/hints:         0.4.1
@tour-kit/adoption:      0.0.1
@tour-kit/analytics:     0.1.0
@tour-kit/announcements: 0.1.0
@tour-kit/checklists:    0.1.0
@tour-kit/media:         0.1.0
@tour-kit/scheduling:    0.1.0
```

### Options

1. **Launch all at v1.0.0** — signals stability, but extended packages may not be ready
2. **Core at v1.0.0, extended at v0.x** — honest about maturity levels
3. **All at v1.0.0 but extended marked as beta in docs** — simpler versioning

### Recommendation

Option 2: Core packages at v1.0.0, extended packages stay at v0.x until test coverage reaches 80%.

---

## 8. Landing Page / Marketing Site

**Priority: MEDIUM**

The docs site exists (`apps/docs/`) but there's no marketing landing page.

### Needs

- [ ] Hero section with animated demo
- [ ] Feature highlights (headless, accessible, composable)
- [ ] Code example showing a basic tour in < 20 lines
- [ ] Pricing table (Free vs Pro)
- [ ] Comparison with alternatives (React Joyride, Shepherd, Intro.js)
- [ ] Social proof section (GitHub stars, testimonials)
- [ ] CTA for npm install and license purchase

---

## 9. npm README Polish

**Priority: MEDIUM**

Package READMEs are the first thing users see on npmjs.com.

### Each README should include

- [ ] Badges (npm version, bundle size, license, CI status)
- [ ] One-line description
- [ ] Install command
- [ ] Minimal working example (< 15 lines)
- [ ] Link to full documentation
- [ ] Link to examples
- [ ] Pro badge for licensed packages

---

## 10. Security Audit

**Priority: MEDIUM**

- [ ] Run `pnpm audit` and resolve any vulnerabilities
- [ ] Review all dependencies for known issues
- [ ] Verify no `.env` files or secrets are published
- [ ] Add `SECURITY.md` to root

---

## 11. Peer Dependency Compatibility

**Priority: MEDIUM**

Declared support needs verification:

- [ ] Test with React 18.x (minimum 18.0.0)
- [ ] Test with React 19.x
- [ ] Test with Tailwind CSS v3.4.x
- [ ] Test with Tailwind CSS v4.0.x
- [ ] Test with `@mui/base` 5.0.0-beta (Base UI support)

---

## 12. Browser Compatibility

**Priority: LOW**

- [ ] Define browserlist targets
- [ ] Verify ES2020 target works in Safari 14+, Chrome 80+, Firefox 80+, Edge 80+
- [ ] Test `@floating-ui/react` positioning in all target browsers

---

## 13. CDN / UMD Support

**Priority: LOW**

- [ ] Consider adding UMD build for CDN usage via unpkg/jsdelivr
- [ ] Currently only ESM + CJS — fine for bundler users, not for script tag users

---

## 14. Migration Guides

**Priority: LOW**

If targeting users of existing tour libraries:

- [ ] Migration from React Joyride
- [ ] Migration from Shepherd.js
- [ ] Migration from Intro.js
- [ ] Migration from Reactour

---

## 15. Post-Launch Monitoring

**Priority: LOW (plan now, implement at launch)**

- [ ] Set up npm download tracking
- [ ] Monitor GitHub issues response time
- [ ] Set up error reporting for docs site
- [ ] Track bundle size trends over releases

---

## Recommended Launch Sequence

### Phase 1 — Fix Blockers (Week 1)

- Fix analytics Amplitude test mocking bug
- Add LICENSE file to root
- Run publish dry-run on all packages
- Fix adoption package.json files array

### Phase 2 — Quality (Week 2)

- Build E2E install/usage test with Verdaccio
- Increase extended package test coverage to 60%+
- Add bundle size limits for extended packages
- Polish npm READMEs with badges and examples

### Phase 3 — Monetization (Week 3)

- Implement license key validation system
- Build `LicenseProvider` component
- Integrate with payment platform (LemonSqueezy / Gumroad)
- Set up license server or static validation

### Phase 4 — Launch (Week 4)

- Create marketing landing page
- Publish core packages as v1.0.0 (MIT)
- Publish extended packages as v0.1.0 (Pro / Licensed)
- Announce on social media, dev communities
- Submit to relevant package directories

---

## Decision Log

| Decision | Options | Chosen | Date | Rationale |
| -------- | ------- | ------ | ---- | --------- |
| Version strategy | All v1.0 / Core v1.0 + Extended v0.x / All v1.0 + beta docs | TBD | | |
| License platform | Gumroad / LemonSqueezy / Custom | TBD | | |
| Pro enforcement | Hard lock / Console warning / Watermark | TBD | | |
| Launch scope | Core only / Core + Extended | TBD | | |

# Tour Kit Documentation Plan

## Executive Summary

This plan covers comprehensive documentation for 6 extended packages (`adoption`, `analytics`, `announcements`, `checklists`, `media`, `scheduling`) plus the docs app. After thorough analysis:

- **Total existing documentation pages**: 185 MDX files
- **Coverage status**: All 6 packages have full documentation structure
- **Gaps identified**: 3 guide pages marked "Coming Soon"
- **Accuracy issues**: Minor - documentation matches implementation

---

## Phase 1: Documentation Accuracy Audit

### Package-by-Package Analysis

#### 1. @tour-kit/adoption (16 pages - COMPLETE)

**Documented Features Match Implementation:**
- AdoptionProvider with all props
- useFeature, useAdoptionStats, useNudge hooks
- AdoptionNudge, FeatureButton, NewFeatureBadge, IfNotAdopted components
- Dashboard components (AdoptionDashboard, charts, stats, table)
- Analytics integration helpers

**Accuracy Status**: VERIFIED
- Types match: Feature, AdoptionCriteria, FeatureUsage, AdoptionStatus
- API complete: All hooks and components documented

#### 2. @tour-kit/analytics (8 pages - COMPLETE)

**Documented Features Match Implementation:**
- AnalyticsProvider, useAnalytics, useAnalyticsOptional
- TourAnalytics class with all methods
- All 5 pre-built plugins (console, posthog, mixpanel, amplitude, google-analytics)
- Custom plugin creation guide
- Event types (TourEvent, TourEventName)

**Accuracy Status**: VERIFIED
- Plugin interface documented correctly
- All configuration options present

#### 3. @tour-kit/announcements (22 pages - COMPLETE)

**Documented Features Match Implementation:**
- AnnouncementsProvider with full config
- useAnnouncement, useAnnouncements, useAnnouncementQueue hooks
- 5 component variants (Modal, Slideout, Banner, Toast, Spotlight)
- 5 headless component variants
- Queue, Frequency, Audience configuration

**Accuracy Status**: VERIFIED
- All 5 display variants documented
- Queue system properly explained
- FrequencyRule types match

#### 4. @tour-kit/checklists (17 pages - COMPLETE)

**Documented Features Match Implementation:**
- ChecklistProvider with persistence config
- useChecklist, useTask, useChecklistsProgress, useChecklistPersistence hooks
- Styled components (Checklist, ChecklistTask, ChecklistPanel, ChecklistProgress, ChecklistLauncher)
- Headless variants
- Utilities (createChecklist, dependencies, progress)

**Accuracy Status**: VERIFIED
- Task dependency system documented
- Progress calculation explained
- Persistence options covered

#### 5. @tour-kit/media (18 pages - COMPLETE)

**Documented Features Match Implementation:**
- TourMedia component with auto-detection
- 8 embed components (YouTube, Vimeo, Loom, Wistia, NativeVideo, GifPlayer, LottiePlayer, images)
- MediaHeadless render-prop component
- Hooks (useMediaEvents, usePrefersReducedMotion, useResponsiveSource)
- URL parsing and embed utilities

**Accuracy Status**: VERIFIED
- All platform embeds documented
- Privacy features noted
- Accessibility compliance mentioned

#### 6. @tour-kit/scheduling (12 pages - COMPLETE)

**Documented Features Match Implementation:**
- useSchedule, useScheduleStatus, useUserTimezone hooks
- All utility functions documented
- Date range, time range, day-of-week, recurring patterns
- Business hours presets
- Blackout periods
- Timezone handling

**Accuracy Status**: VERIFIED
- All schedule types documented
- Evaluation order explained
- Integration examples provided

---

## Phase 2: Missing Documentation Pages

### Gap Analysis

| Location | Page | Status | Priority |
|----------|------|--------|----------|
| guides/ | accessibility.mdx | Coming Soon in meta.json | HIGH |
| guides/ | animations.mdx | Coming Soon in meta.json | MEDIUM |
| guides/ | persistence.mdx | Coming Soon in meta.json | HIGH |

### Required New Pages

#### 1. `guides/accessibility.mdx` (HIGH PRIORITY)

**Why**: WCAG 2.1 AA compliance is a core principle of Tour Kit

**Content Outline**:
```
1. Introduction
   - Tour Kit's accessibility commitment
   - WCAG 2.1 AA compliance goals

2. Built-in Accessibility Features
   - Focus management in tours
   - Keyboard navigation (Tab, Escape, Arrow keys)
   - Screen reader announcements
   - ARIA attributes

3. Focus Trap Behavior
   - How useFocusTrap works
   - When focus is trapped
   - Escape key handling

4. Reduced Motion Support
   - prefers-reduced-motion detection
   - Media component fallbacks
   - Animation disabling

5. Keyboard Shortcuts
   - Default keybindings
   - Customizing with useKeyboard

6. Screen Reader Considerations
   - Tour announcements
   - Step navigation
   - Live regions

7. Testing Your Tours
   - Automated a11y testing
   - Manual testing checklist
   - Tools (axe, Lighthouse)

8. Common Patterns
   - Modal dialogs in tours
   - Interactive content
   - Form elements
```

#### 2. `guides/persistence.mdx` (HIGH PRIORITY)

**Why**: Persistence is crucial for multi-session onboarding

**Content Outline**:
```
1. Introduction
   - Why persistence matters
   - Storage options overview

2. Tour Persistence (usePersistence)
   - Saving tour progress
   - Resuming interrupted tours
   - Clearing saved state

3. Checklist Persistence
   - Completed tasks storage
   - Cross-session progress
   - useChecklistPersistence hook

4. Announcement Persistence
   - Dismissed announcements
   - View count tracking
   - Frequency rule storage

5. Adoption Persistence
   - Feature usage tracking
   - Nudge state management
   - Storage configuration

6. Storage Adapters
   - localStorage (default)
   - sessionStorage
   - Memory (SSR-safe)
   - Custom adapters (API backend)

7. Storage Keys & Namespacing
   - Default key names
   - Multi-tenant apps
   - Avoiding conflicts

8. Migration & Versioning
   - Schema changes
   - Data migration patterns
   - Backward compatibility

9. Server-Side Rendering
   - Hydration considerations
   - Memory storage for SSR
   - Client-side rehydration
```

#### 3. `guides/animations.mdx` (MEDIUM PRIORITY)

**Why**: Custom animations enhance UX

**Content Outline**:
```
1. Introduction
   - Animation principles in Tour Kit
   - Performance considerations

2. Default Animations
   - Tour step transitions
   - Overlay fade
   - Card entrance/exit

3. CSS Custom Properties
   - --tour-animation-duration
   - --tour-overlay-transition
   - Customizing via CSS

4. Tailwind Integration
   - Using Tailwind animations
   - Tour Kit Tailwind plugin utilities

5. Announcement Animations
   - Modal animations
   - Toast sliding
   - Banner reveal
   - Slideout transitions

6. Reduced Motion
   - Detecting preference
   - Fallback strategies
   - Testing reduced motion

7. Custom Animations
   - Framer Motion integration
   - CSS keyframes
   - JavaScript animations

8. Performance Tips
   - Using transform and opacity
   - Avoiding layout thrash
   - GPU acceleration
```

---

## Phase 3: Documentation Improvements

### Content Enhancement Tasks

#### 3.1 Add More Examples to API Pages

**Files to enhance**:
- `api/adoption.mdx` - Add complete feature tracking example
- `api/announcements.mdx` - Add queue management example
- `api/scheduling.mdx` - Add complex schedule example

#### 3.2 Improve Cross-Package Integration Guides

**New sections needed**:
- Guide: "Combining Checklists with Tours" (`checklists-tours.mdx` exists but may need expansion)
- Guide: "Analytics for All Packages" (`analytics-integration.mdx` exists but may need expansion)

#### 3.3 Add Troubleshooting Sections

**Package-specific troubleshooting**:
- Announcements: Queue not advancing
- Scheduling: Timezone issues
- Adoption: Feature not tracking

---

## Phase 4: LLM Documentation Files

### Files to Update

| File | Purpose | Update Strategy |
|------|---------|-----------------|
| `/CLAUDE.md` | Root project guide | Verify package list is complete |
| `/packages/*/CLAUDE.md` | Package-specific guides | Verify API accuracy |
| `/apps/docs/CLAUDE.md` | Docs app guide | Update structure |
| `llms.txt` | LLM quick reference | Create/update if exists |
| `llms-full.txt` | Full LLM context | Create/update if exists |

### Root CLAUDE.md Updates Needed

1. Update "Cross-Package Patterns" section with all 6 packages
2. Add @tour-kit/media to dependency graph
3. Verify all CLAUDE.md file references exist

### Package CLAUDE.md Verification

Each package CLAUDE.md should have:
- [ ] Package overview
- [ ] Public API list
- [ ] Key types exported
- [ ] Dependencies and peer dependencies
- [ ] Gotchas and common issues
- [ ] Testing patterns

---

## Phase 5: Documentation Quality Verification

### Final Checklist

After all documentation is written/updated:

1. **Link Verification**
   - [ ] All internal links resolve
   - [ ] No broken anchor links
   - [ ] Cross-package references correct

2. **Code Example Verification**
   - [ ] All code examples compile
   - [ ] Import statements correct
   - [ ] No deprecated APIs used

3. **Type Accuracy**
   - [ ] Props tables match source types
   - [ ] Type names are current
   - [ ] Optional/required correctly marked

4. **Consistency Check**
   - [ ] Consistent terminology
   - [ ] Consistent formatting
   - [ ] Consistent structure across packages

5. **Build Verification**
   - [ ] Docs build without errors
   - [ ] Search index includes new pages
   - [ ] Navigation renders correctly

---

## Implementation Order

### Priority 1 (Immediate)
1. Write `guides/accessibility.mdx`
2. Write `guides/persistence.mdx`

### Priority 2 (Short-term)
3. Write `guides/animations.mdx`
4. Review and enhance API reference pages
5. Update root CLAUDE.md

### Priority 3 (Medium-term)
6. Verify all package CLAUDE.md files
7. Create/update LLM documentation files
8. Cross-reference verification

### Priority 4 (Ongoing)
9. Build and test documentation
10. Final quality verification

---

## Estimated Effort

| Task | Pages | Estimated Tokens |
|------|-------|------------------|
| accessibility.mdx | 1 | ~3,000 |
| persistence.mdx | 1 | ~3,500 |
| animations.mdx | 1 | ~2,500 |
| API enhancements | 3 | ~2,000 |
| CLAUDE.md updates | 7+ | ~5,000 |
| LLM docs | 2 | ~4,000 |
| **Total** | **15+** | **~20,000** |

---

## Success Criteria

Documentation is complete when:

1. All 3 missing guide pages exist
2. All code examples are verified working
3. All internal links resolve
4. Documentation builds without errors
5. All CLAUDE.md files are accurate
6. LLM documentation files are up to date
7. No "Coming Soon" markers in meta.json

---

## Notes

- Documentation follows Fumadocs conventions
- All MDX files use kebab-case naming
- Each directory has meta.json for navigation
- Code examples should be copy-paste ready
- Lead with "why", then "what", then "how"
- Accessibility considerations in every relevant page

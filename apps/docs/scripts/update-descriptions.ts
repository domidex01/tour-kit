/**
 * Bulk-update MDX frontmatter descriptions.
 * Run: npx tsx scripts/update-descriptions.ts
 *
 * Each description is hand-written, keyword-rich, 80–160 chars,
 * active voice, unique across all pages.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import matter from 'gray-matter'

const updates: Record<string, string> = {
  // ── Getting Started ──
  'content/docs/index.mdx':
    'Tour Kit is a headless, accessible product tour library for React with shadcn/ui support and full TypeScript coverage',
  'content/docs/getting-started/index.mdx':
    'Set up Tour Kit in your React application with step-by-step installation, configuration, and TypeScript guides',
  'content/docs/getting-started/installation.mdx':
    'Install @tour-kit/core and @tour-kit/react with npm, pnpm, yarn, or bun and configure peer dependencies for React 18+',
  'content/docs/getting-started/quick-start.mdx':
    'Create your first multi-step product tour in under 5 minutes with Tour, TourStep, and useTour hook examples',
  'content/docs/getting-started/typescript.mdx':
    'Configure TypeScript strict mode, use inferred step types, and leverage generic tour configurations in Tour Kit',

  // ── Core Package ──
  'content/docs/core/index.mdx':
    'Framework-agnostic hooks and utilities for building product tours — state management, positioning, and accessibility',
  'content/docs/core/hooks/use-tour.mdx':
    'useTour hook: control tour state with start, next, prev, skip, and complete actions plus step tracking in React',
  'content/docs/core/hooks/use-step.mdx':
    'useStep hook: access current step data, index, progress percentage, and isFirst/isLast flags in tour components',
  'content/docs/core/hooks/use-focus-trap.mdx':
    'useFocusTrap hook: trap keyboard focus within tour step elements for WCAG 2.1 AA accessible navigation',
  'content/docs/core/hooks/use-keyboard.mdx':
    'useKeyboard hook: add arrow key navigation, Escape to close, and custom keyboard shortcuts to product tours',
  'content/docs/core/hooks/use-persistence.mdx':
    'usePersistence hook: save and restore tour completion state across browser sessions with localStorage or custom adapters',
  'content/docs/core/hooks/use-spotlight.mdx':
    'useSpotlight hook: control spotlight overlay visibility, padding, border radius, and animation for tour steps',
  'content/docs/core/hooks/use-element-position.mdx':
    'useElementPosition hook: track DOM element position with automatic updates on scroll, resize, and layout changes',
  'content/docs/core/hooks/use-route-persistence.mdx':
    'useRoutePersistence hook: maintain tour progress when users navigate between pages in multi-page applications',
  'content/docs/core/hooks/use-media-query.mdx':
    'useMediaQuery hook: respond to viewport changes and prefers-reduced-motion for responsive, accessible product tours',
  'content/docs/core/hooks/use-advance-on.mdx':
    'useAdvanceOn hook: automatically advance tour steps when users click buttons, submit forms, or interact with elements',
  'content/docs/core/hooks/use-branch.mdx':
    'useBranch hook: trigger conditional branching paths from step content based on user choices or application state',
  'content/docs/core/providers/tour-kit-provider.mdx':
    'TourKitProvider: wrap your app to enable global tour management, shared configuration, and multi-tour coordination',
  'content/docs/core/providers/tour-provider.mdx':
    'TourProvider: context provider that manages state, steps, and lifecycle for an individual product tour instance',
  'content/docs/core/types/config-types.mdx':
    'TypeScript interfaces for TourConfig, SpotlightConfig, KeyboardConfig, and other Tour Kit configuration options',
  'content/docs/core/types/step-types.mdx':
    'TypeScript interfaces for StepConfig, StepTarget, StepPlacement, and step-level configuration in Tour Kit tours',
  'content/docs/core/types/tour-types.mdx':
    'TypeScript interfaces for TourState, TourActions, TourCallbacks, and the complete tour lifecycle type system',
  'content/docs/core/utilities/a11y.mdx':
    'Accessibility utilities: screen reader announcements, live regions, and ARIA attribute helpers for product tours',
  'content/docs/core/utilities/create-step.mdx':
    'createStep factory function: build type-safe step configurations with validation and IntelliSense autocomplete',
  'content/docs/core/utilities/create-tour.mdx':
    'createTour factory function: define type-safe tour configurations with validated steps, callbacks, and options',
  'content/docs/core/utilities/dom.mdx':
    'DOM utilities: element measurement, visibility detection, and target resolution for positioning tour tooltips',
  'content/docs/core/utilities/helpers.mdx':
    'Helper utilities: step index calculations, progress percentages, and common tour operation functions in Tour Kit',
  'content/docs/core/utilities/logger.mdx':
    'Configurable logger utility: debug tour state transitions, step changes, and lifecycle events in development mode',
  'content/docs/core/utilities/position.mdx':
    'Position engine: calculate tooltip placement with collision detection, viewport clamping, and RTL layout support',
  'content/docs/core/utilities/scroll.mdx':
    'Scroll utilities: smooth scroll to target elements, scroll lock during tour steps, and overflow container handling',
  'content/docs/core/utilities/storage.mdx':
    'Storage adapters: persist tour state with localStorage, sessionStorage, or custom backends for completion tracking',
  'content/docs/core/utilities/throttle.mdx':
    'Throttle and debounce utilities: rate-limit scroll, resize, and position update handlers for smooth tour performance',

  // ── React Package ──
  'content/docs/react/index.mdx':
    'Pre-styled React components for product tours with compound component patterns, asChild slot, and shadcn/ui compatibility',
  'content/docs/react/components/tour.mdx':
    'Tour component: main wrapper that provides tour context, keyboard controls, spotlight overlay, and step management',
  'content/docs/react/components/tour-card.mdx':
    'TourCard compound component: render step content with header, body, footer sub-components and asChild slot support',
  'content/docs/react/components/tour-close.mdx':
    'TourClose component: accessible close button with customizable icon, aria-label, and asChild polymorphic rendering',
  'content/docs/react/components/tour-navigation.mdx':
    'TourNavigation component: previous/next buttons with automatic disable states and customizable button labels',
  'content/docs/react/components/tour-overlay.mdx':
    'TourOverlay component: spotlight overlay that highlights the target element with configurable padding and animation',
  'content/docs/react/components/tour-progress.mdx':
    'TourProgress component: step counter and progress bar showing current position and total steps in the tour',
  'content/docs/react/components/tour-step.mdx':
    'TourStep component: define individual steps with target selectors, placement, content, and advance-on triggers',
  'content/docs/react/headless/index.mdx':
    'Headless tour components: unstyled primitives with render props for building completely custom tour interfaces',
  'content/docs/react/headless/headless-card.mdx':
    'HeadlessTourCard: unstyled card primitive exposing step data, actions, and positioning via render props for custom UIs',
  'content/docs/react/headless/headless-overlay.mdx':
    'HeadlessTourOverlay: unstyled overlay primitive with spotlight cutout positioning exposed via render props',
  'content/docs/react/headless/examples.mdx':
    'Headless component examples: build custom tooltip cards, overlays, and navigation using Tour Kit render props',
  'content/docs/react/hooks/use-tour-route.mdx':
    'useTourRoute hook: synchronize tour progress with router state for multi-page tours in Next.js and React Router',
  'content/docs/react/hooks/use-tours.mdx':
    'useTours hook: access all registered tour instances, check active states, and manage multiple tours from one place',
  'content/docs/react/providers/multi-tour-kit-provider.mdx':
    'MultiTourKitProvider: manage multiple independent tours with shared configuration, analytics, and storage settings',
  'content/docs/react/styling/css-variables.mdx':
    'Customize Tour Kit appearance with CSS custom properties for colors, spacing, border radius, and shadow values',
  'content/docs/react/styling/custom-components.mdx':
    'Build fully custom tour card, overlay, and navigation components using Tour Kit hooks and headless primitives',
  'content/docs/react/styling/tailwind.mdx':
    'Style Tour Kit components with Tailwind CSS utility classes, dark mode variants, and responsive breakpoints',
  'content/docs/react/adapters/index.mdx':
    'Router adapters enable multi-page product tours that persist across route changes in React framework applications',
  'content/docs/react/adapters/next-app-router.mdx':
    'Next.js App Router adapter: configure route-aware tours with usePathname integration for server component layouts',
  'content/docs/react/adapters/next-pages-router.mdx':
    'Next.js Pages Router adapter: set up multi-page tours with useRouter integration for _app.tsx tour providers',
  'content/docs/react/adapters/react-router.mdx':
    'React Router v6/v7 adapter: enable cross-route tours with useLocation and useNavigate integration in SPAs',

  // ── Hints Package ──
  'content/docs/hints/index.mdx':
    'Add contextual hint beacons and hotspots that highlight features and guide users without interrupting their workflow',
  'content/docs/hints/components.mdx':
    'Hint, HintHotspot, and HintTooltip components: add pulsing beacons and floating tooltips for feature discovery',
  'content/docs/hints/hooks.mdx':
    'useHints and useHint hooks: programmatically show, dismiss, and query hint visibility state across your application',
  'content/docs/hints/persistence.mdx':
    'Configure hint dismissal persistence with localStorage, sessionStorage, or custom backends to remember user choices',
  'content/docs/hints/headless/index.mdx':
    'Headless hint components: build custom beacon animations, tooltip designs, and hotspot UIs with render props',
  'content/docs/hints/headless/hint-headless.mdx':
    'HeadlessHint: unstyled hint wrapper exposing visibility state and dismiss actions via render props for custom UIs',
  'content/docs/hints/headless/hint-hotspot-headless.mdx':
    'HeadlessHintHotspot: unstyled hotspot trigger with positioning data exposed via render props for custom beacons',
  'content/docs/hints/headless/hint-tooltip-headless.mdx':
    'HeadlessHintTooltip: unstyled floating tooltip with calculated position and collision avoidance via render props',

  // ── Guides ──
  'content/docs/guides/index.mdx':
    'In-depth guides for accessibility, persistence, animations, router integration, and framework-specific Tour Kit setup',
  'content/docs/guides/accessibility.mdx':
    'Configure keyboard navigation, focus trapping, screen reader support, and reduced motion for WCAG 2.1 AA compliant tours',
  'content/docs/guides/persistence.mdx':
    'Save tour progress, checklist completion, and hint dismissals across browser sessions with pluggable storage adapters',
  'content/docs/guides/animations.mdx':
    'Add CSS transitions and animations to tour steps, respect prefers-reduced-motion, and create smooth step transitions',
  'content/docs/guides/nextjs.mdx':
    'Set up Tour Kit with Next.js App Router or Pages Router — server component layouts, route-aware tours, and SSR support',
  'content/docs/guides/vite.mdx':
    'Configure Tour Kit in Vite + React projects with hot module replacement, path aliases, and production build optimization',
  'content/docs/guides/router-integration.mdx':
    'Build multi-page tours with Next.js, React Router, or custom routers using route-aware step targeting and persistence',
  'content/docs/guides/base-ui.mdx':
    'Switch from Radix UI to Base UI for tour components using the UnifiedSlot abstraction and UILibraryContext provider',
  'content/docs/guides/troubleshooting.mdx':
    'Diagnose and fix common Tour Kit issues: missing targets, positioning glitches, hydration errors, and focus trap problems',
  'content/docs/guides/branching.mdx':
    'Create personalized tour paths with conditional branching, user choice flows, and dynamic step insertion based on state',
  'content/docs/guides/adoption-analytics.mdx':
    'Combine @tour-kit/adoption and @tour-kit/analytics to measure feature discovery rates and optimize onboarding funnels',
  'content/docs/guides/analytics-integration.mdx':
    'Connect @tour-kit/analytics to tours, hints, checklists, and adoption events with Mixpanel, PostHog, or custom plugins',
  'content/docs/guides/announcements-scheduling.mdx':
    'Schedule announcements with @tour-kit/scheduling for time-based delivery, business hours, and recurring content windows',
  'content/docs/guides/checklists-tours.mdx':
    'Link checklists to tours for guided onboarding — auto-complete tasks on tour finish and track user progress together',

  // ── Examples ──
  'content/docs/examples/index.mdx':
    'Copy-paste examples for common Tour Kit patterns: basic tours, onboarding flows, and fully custom headless interfaces',
  'content/docs/examples/basic-tour.mdx':
    'Build a 3-step product tour with spotlight overlay, keyboard navigation, and progress indicators — full working code',
  'content/docs/examples/onboarding-flow.mdx':
    'Complete user onboarding flow with persistent progress, conditional steps, checklists, and tour completion callbacks',
  'content/docs/examples/headless-custom.mdx':
    'Build a completely custom tour UI with headless components, render props, and your own design system or CSS framework',

  // ── API Reference ──
  'content/docs/api/index.mdx':
    'Complete API reference for all Tour Kit packages — hooks, components, providers, utilities, and TypeScript type exports',
  'content/docs/api/core.mdx':
    'API reference for @tour-kit/core: useTour, useStep, useFocusTrap, createTour, createStep, and all utility exports',
  'content/docs/api/react.mdx':
    'API reference for @tour-kit/react: Tour, TourCard, TourStep, headless components, router adapters, and style hooks',
  'content/docs/api/hints.mdx':
    'API reference for @tour-kit/hints: Hint, HintHotspot, HintTooltip, useHints, useHint, and headless hint primitives',
  'content/docs/api/analytics.mdx':
    'API reference for @tour-kit/analytics: AnalyticsProvider, useAnalytics, plugin interface, and built-in integrations',
  'content/docs/api/adoption.mdx':
    'API reference for @tour-kit/adoption: AdoptionProvider, useFeature, useNudge, useAdoptionStats, and dashboard exports',
  'content/docs/api/announcements.mdx':
    'API reference for @tour-kit/announcements: Modal, Toast, Banner, Slideout, Spotlight, queue hooks, and provider config',
  'content/docs/api/checklists.mdx':
    'API reference for @tour-kit/checklists: Checklist, ChecklistTask, useChecklist, useTask, and progress utilities',
  'content/docs/api/media.mdx':
    'API reference for @tour-kit/media: YouTubeEmbed, VimeoEmbed, LoomEmbed, GifPlayer, LottiePlayer, and TourMedia',
  'content/docs/api/scheduling.mdx':
    'API reference for @tour-kit/scheduling: useSchedule, evaluateSchedule, timezone utilities, and preset configurations',

  // ── Analytics Package ──
  'content/docs/analytics/index.mdx':
    'Plugin-based analytics for tracking tour starts, step views, completions, and hint interactions across any provider',
  'content/docs/analytics/hooks/index.mdx':
    'useAnalytics hook: access the analytics tracker to send custom events and track tour interactions in React components',
  'content/docs/analytics/plugins/index.mdx':
    'Analytics plugin system: choose from built-in integrations or create custom plugins with the AnalyticsPlugin interface',
  'content/docs/analytics/plugins/amplitude.mdx':
    'Amplitude analytics plugin: send tour and hint events to Amplitude with automatic property mapping and session tracking',
  'content/docs/analytics/plugins/console.mdx':
    'Console analytics plugin: log all tour events with colored output for debugging analytics integration in development',
  'content/docs/analytics/plugins/custom.mdx':
    'Build custom analytics plugins by implementing the AnalyticsPlugin interface with track, identify, and flush methods',
  'content/docs/analytics/plugins/google-analytics.mdx':
    'Google Analytics 4 plugin: send tour events as GA4 custom events with automatic parameter mapping and measurement ID',
  'content/docs/analytics/plugins/mixpanel.mdx':
    'Mixpanel analytics plugin: track tour funnel events, step completions, and user engagement with Mixpanel properties',
  'content/docs/analytics/plugins/posthog.mdx':
    'PostHog analytics plugin: capture tour events as PostHog actions with automatic feature flag and person property sync',
  'content/docs/analytics/providers/index.mdx':
    'AnalyticsProvider component: configure one or more analytics plugins and provide the tracker to your React component tree',
  'content/docs/analytics/types.mdx':
    'TypeScript types for AnalyticsPlugin, AnalyticsEvent, TrackerConfig, and the analytics package public API surface',

  // ── Announcements Package ──
  'content/docs/announcements/index.mdx':
    'Product announcements with modal, toast, banner, slideout, and spotlight variants — priority queuing and audience targeting',
  'content/docs/announcements/components/index.mdx':
    'Pre-styled announcement components: Modal, Toast, Banner, Slideout, and Spotlight with built-in close and action buttons',
  'content/docs/announcements/components/modal.mdx':
    'AnnouncementModal component: centered dialog overlay for important product updates with title, body, and action buttons',
  'content/docs/announcements/components/toast.mdx':
    'AnnouncementToast component: auto-dismissing corner notification for quick updates with configurable duration and position',
  'content/docs/announcements/components/banner.mdx':
    'AnnouncementBanner component: full-width persistent bar for system notices with dismiss button and action link support',
  'content/docs/announcements/components/slideout.mdx':
    'AnnouncementSlideout component: side panel drawer for detailed product updates with rich content and multiple sections',
  'content/docs/announcements/components/spotlight.mdx':
    'AnnouncementSpotlight component: element highlight overlay for contextual feature announcements tied to specific UI areas',
  'content/docs/announcements/hooks/use-announcement.mdx':
    'useAnnouncement hook: control visibility, dismissal, and action tracking for a single announcement instance in React',
  'content/docs/announcements/hooks/use-announcements.mdx':
    'useAnnouncements hook: query all announcements, filter by status or variant, and manage the announcement collection state',
  'content/docs/announcements/hooks/use-announcement-queue.mdx':
    'useAnnouncementQueue hook: manage priority-based display ordering and automatic scheduling of queued announcements',
  'content/docs/announcements/providers/announcements-provider.mdx':
    'AnnouncementsProvider: configure announcement storage, queue behavior, frequency rules, and audience targeting at app level',
  'content/docs/announcements/types.mdx':
    'TypeScript types for Announcement, AnnouncementVariant, QueueConfig, AudienceRule, and the full announcements API surface',
  'content/docs/announcements/configuration/audience.mdx':
    'Target announcements to user segments with role-based, attribute, and custom predicate audience filtering rules',
  'content/docs/announcements/configuration/frequency.mdx':
    'Control announcement display frequency with once, daily, weekly, and session-based rules to avoid notification fatigue',
  'content/docs/announcements/configuration/queue.mdx':
    'Priority queue system: rank announcements by urgency, schedule display windows, and prevent overlapping notifications',
  'content/docs/announcements/headless/index.mdx':
    'Headless announcement components: unstyled Modal, Toast, Banner, Slideout, and Spotlight with render props for custom UIs',
  'content/docs/announcements/headless/modal.mdx':
    'HeadlessAnnouncementModal: unstyled dialog primitive with focus trap, backdrop click, and Escape key dismiss handling',
  'content/docs/announcements/headless/toast.mdx':
    'HeadlessAnnouncementToast: unstyled notification primitive with auto-dismiss timer and position data via render props',
  'content/docs/announcements/headless/banner.mdx':
    'HeadlessAnnouncementBanner: unstyled banner primitive with dismiss and action state exposed via render props for theming',
  'content/docs/announcements/headless/slideout.mdx':
    'HeadlessAnnouncementSlideout: unstyled drawer primitive with slide animation state and content sections via render props',
  'content/docs/announcements/headless/spotlight.mdx':
    'HeadlessAnnouncementSpotlight: unstyled highlight primitive with target element positioning and overlay via render props',

  // ── Checklists Package ──
  'content/docs/checklists/index.mdx':
    'Onboarding checklists with task dependencies, progress tracking, persistence, and optional tour integration for React apps',
  'content/docs/checklists/components/index.mdx':
    'Pre-styled checklist components with shadcn/ui patterns: Checklist, ChecklistTask, ChecklistProgress, and ChecklistLauncher',
  'content/docs/checklists/components/checklist.mdx':
    'Checklist component: main container rendering tasks with progress header, completion state, and configurable layout options',
  'content/docs/checklists/components/checklist-task.mdx':
    'ChecklistTask component: individual task item with checkbox, label, description, completion state, and action button',
  'content/docs/checklists/components/checklist-progress.mdx':
    'ChecklistProgress component: visual progress bar with percentage, completed count, and animated fill for task completion',
  'content/docs/checklists/components/checklist-panel.mdx':
    'ChecklistPanel component: floating side panel container with slide-in animation for persistent checklist access',
  'content/docs/checklists/components/checklist-launcher.mdx':
    'ChecklistLauncher component: floating action button to toggle checklist panel visibility with badge showing remaining tasks',
  'content/docs/checklists/hooks/use-checklist.mdx':
    'useChecklist hook: manage task completion, track overall progress, and control checklist state with toggle and reset actions',
  'content/docs/checklists/hooks/use-task.mdx':
    'useTask hook: control individual task state, trigger completion, handle dependencies, and access task metadata in React',
  'content/docs/checklists/hooks/use-checklists-progress.mdx':
    'useChecklistsProgress hook: get aggregated completion stats across all active checklists for dashboard or summary views',
  'content/docs/checklists/hooks/use-checklist-persistence.mdx':
    'useChecklistPersistence hook: save and restore checklist completion state across sessions with pluggable storage adapters',
  'content/docs/checklists/providers/checklist-provider.mdx':
    'ChecklistProvider: configure task definitions, dependencies, storage, and analytics integration for your checklist instance',
  'content/docs/checklists/types.mdx':
    'TypeScript types for ChecklistConfig, TaskConfig, TaskDependency, ChecklistState, and the full checklists type system',
  'content/docs/checklists/utilities/index.mdx':
    'Checklist utility functions: create type-safe configs, resolve dependencies, and calculate progress with pure functions',
  'content/docs/checklists/utilities/create-checklist.mdx':
    'createChecklist factory: build validated checklist configurations with type-safe task definitions and dependency declarations',
  'content/docs/checklists/utilities/dependencies.mdx':
    'Dependency resolution utilities: topological sort, circular reference detection, and prerequisite task validation functions',
  'content/docs/checklists/utilities/progress.mdx':
    'Progress calculation utilities: compute completion percentages, remaining task counts, and estimated time to finish values',

  // ── Media Package ──
  'content/docs/media/index.mdx':
    'Embed YouTube, Vimeo, Loom, Wistia, GIF, and Lottie media in tours with automatic platform detection and accessibility',
  'content/docs/media/components/youtube-embed.mdx':
    'YouTubeEmbed component: embed YouTube videos with GDPR privacy-enhanced mode, captions, and responsive aspect ratios',
  'content/docs/media/components/vimeo-embed.mdx':
    'VimeoEmbed component: embed Vimeo videos with privacy controls, custom colors, autoplay options, and responsive sizing',
  'content/docs/media/components/loom-embed.mdx':
    'LoomEmbed component: embed Loom screen recordings in tour steps with automatic URL parsing and responsive iframe sizing',
  'content/docs/media/components/wistia-embed.mdx':
    'WistiaEmbed component: embed Wistia videos with enterprise popover, chapter markers, and advanced analytics integration',
  'content/docs/media/components/gif-player.mdx':
    'GifPlayer component: animated GIF with play/pause toggle, reduced motion support, and accessible alt text for tour steps',
  'content/docs/media/components/lottie-player.mdx':
    'LottiePlayer component: render lightweight vector animations from Lottie JSON files with loop, autoplay, and speed control',
  'content/docs/media/components/native-video.mdx':
    'NativeVideo component: self-hosted HTML5 video with captions, poster images, responsive sources, and picture-in-picture',
  'content/docs/media/components/tour-media.mdx':
    'TourMedia component: unified media embed with automatic platform detection from URL — YouTube, Vimeo, Loom, or native video',
  'content/docs/media/hooks/use-media-events.mdx':
    'useMediaEvents hook: track play, pause, complete, and seek events from embedded media for analytics integration in tours',
  'content/docs/media/hooks/use-prefers-reduced-motion.mdx':
    'usePrefersReducedMotion hook: detect the prefers-reduced-motion media query to pause GIFs and animations automatically',
  'content/docs/media/hooks/use-responsive-source.mdx':
    'useResponsiveSource hook: select optimal media source based on viewport width for mobile, tablet, and desktop breakpoints',
  'content/docs/media/headless/index.mdx':
    'Headless media components: unstyled video and animation primitives with full playback state exposed via render props',
  'content/docs/media/headless/media-headless.mdx':
    'HeadlessMedia: unstyled media primitive exposing playback state, duration, progress, and control actions via render props',
  'content/docs/media/types.mdx':
    'TypeScript types for MediaSource, EmbedConfig, MediaProvider, PlaybackState, and the full @tour-kit/media API surface',
  'content/docs/media/utilities/url-parsing.mdx':
    'URL parsing utilities: detect video platform, extract video IDs, and validate media URLs from YouTube, Vimeo, and Loom',
  'content/docs/media/utilities/embed-urls.mdx':
    'Embed URL builders: construct privacy-compliant iframe src URLs for YouTube, Vimeo, Loom, and Wistia with custom parameters',

  // ── Scheduling Package ──
  'content/docs/scheduling/index.mdx':
    'Time-based scheduling for controlling when tours, announcements, and content appear — business hours, dates, and timezones',
  'content/docs/scheduling/hooks/index.mdx':
    'React hooks for reactive schedule evaluation: check active state, get next window, and detect user timezone automatically',
  'content/docs/scheduling/hooks/use-schedule.mdx':
    'useSchedule hook: evaluate whether a schedule is currently active with automatic refresh and timezone-aware calculations',
  'content/docs/scheduling/hooks/use-schedule-status.mdx':
    'useScheduleStatus hook: get detailed schedule information including next active window, time remaining, and status reason',
  'content/docs/scheduling/hooks/use-user-timezone.mdx':
    'useUserTimezone hook: detect the user browser timezone via Intl API for timezone-aware schedule evaluation in React apps',
  'content/docs/scheduling/utilities/index.mdx':
    'Pure scheduling functions: evaluate schedules, check business hours, handle blackouts, and convert timezones without React',
  'content/docs/scheduling/utilities/schedule-evaluation.mdx':
    'evaluateSchedule function: check if the current time matches a schedule config with date ranges, time windows, and blackouts',
  'content/docs/scheduling/utilities/timezone.mdx':
    'Timezone utilities: detect browser timezone, validate IANA identifiers, convert between zones, and normalize UTC offsets',
  'content/docs/scheduling/utilities/date-range.mdx':
    'Date range utilities: check if a date falls within start/end bounds with inclusive/exclusive boundary option support',
  'content/docs/scheduling/utilities/time-range.mdx':
    'Time range utilities: check if the current time falls within daily time windows for business hours and display schedules',
  'content/docs/scheduling/utilities/day-of-week.mdx':
    'Day-of-week utilities: filter schedules by weekday with locale-aware day names and configurable week start day support',
  'content/docs/scheduling/utilities/blackouts.mdx':
    'Blackout period utilities: define maintenance windows, holidays, and exclusion dates when content should not be displayed',
  'content/docs/scheduling/utilities/business-hours.mdx':
    'Business hours utilities: restrict content to work hours with timezone support, holiday calendars, and custom day schedules',
  'content/docs/scheduling/utilities/recurring.mdx':
    'Recurring schedule utilities: match daily, weekly, monthly, and custom recurrence patterns for periodic content display',
  'content/docs/scheduling/types.mdx':
    'TypeScript types for ScheduleConfig, TimeRange, DateRange, BlackoutPeriod, RecurrenceRule, and the scheduling API surface',
  'content/docs/scheduling/presets.mdx':
    'Schedule presets: pre-configured constants for business hours, weekdays, weekends, and common scheduling patterns in Tour Kit',

  // ── Adoption Package ──
  'content/docs/adoption/index.mdx':
    'Track feature usage, measure adoption rates, and nudge users toward underused features with @tour-kit/adoption for React',
  'content/docs/adoption/hooks/use-feature.mdx':
    'useFeature hook: track individual feature usage, query adoption state, and record interactions for adoption metrics',
  'content/docs/adoption/hooks/use-nudge.mdx':
    'useNudge hook: manage nudge visibility, dismissal, snooze, and user interaction state for feature discovery prompts',
  'content/docs/adoption/hooks/use-adoption-stats.mdx':
    'useAdoptionStats hook: retrieve aggregated adoption metrics across all tracked features for dashboards and reporting',
  'content/docs/adoption/providers/adoption-provider.mdx':
    'AdoptionProvider: configure feature definitions, usage thresholds, nudge rules, and storage for the adoption tracking system',
  'content/docs/adoption/types.mdx':
    'TypeScript types for FeatureConfig, AdoptionState, NudgeRule, UsageThreshold, and the @tour-kit/adoption API surface',
  'content/docs/adoption/components/adoption-nudge.mdx':
    'AdoptionNudge component: auto-showing prompt that appears when a user has not adopted a tracked feature after a threshold',
  'content/docs/adoption/components/conditional.mdx':
    'IfNotAdopted and IfAdopted components: conditionally render content based on whether a user has adopted a specific feature',
  'content/docs/adoption/components/feature-button.mdx':
    'FeatureButton component: button wrapper that automatically records usage events for the tracked feature on each click',
  'content/docs/adoption/components/new-feature-badge.mdx':
    'NewFeatureBadge component: badge overlay that highlights unadopted features and auto-hides after the user engages with them',
  'content/docs/adoption/analytics/index.mdx':
    'Adoption analytics integration: automatically send feature usage and nudge interaction events to your analytics provider',
  'content/docs/adoption/dashboard/index.mdx':
    'Pre-built admin dashboard components for visualizing feature adoption metrics, trends, and per-feature engagement rates',
  'content/docs/adoption/dashboard/adoption-dashboard.mdx':
    'AdoptionDashboard component: complete admin view combining stats grid, category chart, and feature table in one layout',
  'content/docs/adoption/dashboard/charts.mdx':
    'AdoptionCategoryChart and AdoptionStatusBadge: visualize adoption distribution by category and individual feature status',
  'content/docs/adoption/dashboard/stats.mdx':
    'AdoptionStatCard and AdoptionStatsGrid: display aggregate adoption metrics with trend indicators and percentage changes',
  'content/docs/adoption/dashboard/table.mdx':
    'AdoptionTable component: sortable, filterable table of tracked features showing adoption status, usage count, and trends',

  // ── AI Package ──
  'content/docs/ai/index.mdx':
    'AI-powered chat assistant for product tours — context-aware conversation with RAG and CAG documentation retrieval modes',
  'content/docs/ai/quick-start.mdx':
    'Set up @tour-kit/ai in under 5 minutes: install the package, configure your AI provider, and add the chat widget to React',
  'content/docs/ai/components.mdx':
    'Pre-built AI chat components: AiChatPanel, AiChatToggle, AiChatMessageList, and AiChatInput with shadcn/ui styling',
  'content/docs/ai/api-reference.mdx':
    'Complete API reference for @tour-kit/ai: client hooks, server utilities, chat components, and configuration types',
  'content/docs/ai/cag-guide.mdx':
    'Context-Augmented Generation guide: inject tour documentation directly into AI prompts for fast, deterministic responses',
  'content/docs/ai/rag-guide.mdx':
    'Retrieval-Augmented Generation guide: use vector search over documentation for scalable AI chat with large content sets',
  'content/docs/ai/tour-integration.mdx':
    'Connect AI chat to active tour state: context-aware assistance that knows the current step, tour progress, and user actions',

  // ── AI Assistants ──
  'content/docs/ai-assistants/index.mdx':
    'Documentation resources optimized for AI coding assistants — llms.txt, context files, and MCP server for Tour Kit integration',
}

let updated = 0
let skipped = 0

for (const [filePath, newDesc] of Object.entries(updates)) {
  try {
    const fullPath = filePath
    const raw = readFileSync(fullPath, 'utf-8')
    const { data, content } = matter(raw)

    if (data.description === newDesc) {
      skipped++
      continue
    }

    data.description = newDesc
    const output = matter.stringify(content, data)
    writeFileSync(fullPath, output)
    updated++
  } catch (err: unknown) {
    console.error(`Failed: ${filePath} — ${err instanceof Error ? err.message : String(err)}`)
  }
}

console.log(`\n✅ Updated ${updated} files, skipped ${skipped} (already correct)`)

---
"@tour-kit/announcements": minor
---

Wire i18n + segments + category, ship `<ChangelogPage>` and `serializeFeed`:

- `AnnouncementConfig.title`/`description` accept `LocalizedText` and resolve through `<LocaleProvider>`.
- `AnnouncementConfig.audience` accepts `{ segment: 'name' }` to reference `<SegmentationProvider>` cohorts.
- New optional `category` field for grouping in the changelog filter.
- New `<ChangelogPage>` (server-renderable, category filter, emoji reactions, media support, RTL-aware) — exported from the `@tour-kit/announcements/changelog` subpath to keep toast/modal/banner-only consumers tree-shaken.
- New `serializeFeed(entries, options)` returns `{ rss, jsonFeed }` strings (RSS 2.0 + JSON Feed 1.1, XML-entity-safe).

All additions are additive — no breaking changes.

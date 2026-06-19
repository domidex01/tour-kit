---
"@tour-kit/announcements": minor
---

Type and wire `AnnouncementConfig.schedule`. It was declared `unknown` with a comment claiming "the provider handles that integration" — it didn't. It is now typed `Schedule` (from the optional `@tour-kit/scheduling` peer) and evaluated in `AnnouncementScheduler.canShow`, which gains an optional `now` parameter. The peer is resolved lazily and degrades open when scheduling isn't installed, so it remains a true optional peer. Additive change.

---
"@tour-kit/surveys": minor
---

Type and wire `SurveyConfig.schedule`. It was declared `unknown` and never consulted; it is now typed `Schedule` (from the optional `@tour-kit/scheduling` peer) and evaluated in `SurveyScheduler.canShow` — an inactive schedule now suppresses the survey. The peer is resolved lazily and degrades open (content still shows) when scheduling isn't installed, so it remains a true optional peer. Additive change.

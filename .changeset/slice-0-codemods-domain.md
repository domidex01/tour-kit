---
"@tour-kit/codemods": patch
---

Correct the migration-TODO doc links to the published `usertourkit.com` domain. The
`todoToComment` emitter now writes `https://usertourkit.com/migration/...` (consumers
see the corrected URL in emitted comments), and the README migration-guide links are
updated to match.

---
"@tour-kit/adoption": patch
---

fix(adoption): export `AdoptionFunnel` from the main entry

`AdoptionFunnel` was reachable via the dashboard barrel
(`@tour-kit/adoption/components/dashboard`) but missing from the main
entry's value re-export block — only `AdoptionFunnelProps` (the type)
made it through. Consumers writing
`import { AdoptionFunnel } from '@tour-kit/adoption'` got `undefined`
at runtime.

Adds `AdoptionFunnel` to the dashboard value re-export and a regression
test that walks every dashboard component name through the main entry
plus the built `dist/index.d.{ts,cts}` declaration files.

Fixes #75.

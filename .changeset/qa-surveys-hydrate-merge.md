---
'@tour-kit/surveys': patch
---

Storage hydration no longer wipes registered surveys. `REGISTER` runs
synchronously on mount while the persisted blob loads asynchronously; the
`HYDRATE` action replaced the whole survey-state map, so any configured survey
missing from the blob was silently deleted — stale state written by a
different survey set on the same origin blanked every freshly-configured
survey (no cards, no errors). `HYDRATE` now merges: persisted entries win for
matching ids (they carry viewCount/completion history), registered-but-
unpersisted surveys survive.

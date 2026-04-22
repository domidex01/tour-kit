---
'@tour-kit/hints': patch
---

Fix infinite `Maximum update depth exceeded` when using `<Hint autoShow>`. The
auto-show effect now fires exactly once per component instance, and the reducer
short-circuits `SHOW_HINT`, `HIDE_HINT`, and `DISMISS_HINT` when the requested
value already matches current state.

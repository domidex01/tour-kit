---
"@tour-kit/react": patch
---

Widen the `react-router-dom` peer dependency to `^6.0.0 || ^7.0.0` so consumers on React Router 7 (the current major) can `npm install` without an `ERESOLVE`/peer conflict. The router adapter already supports v7 (it imports from `react-router` first); only the `react-router-dom` peer range was still pinned to v6.

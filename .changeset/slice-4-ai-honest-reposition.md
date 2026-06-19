---
"@tour-kit/ai": minor
---

Make every advertised AI knob either consumed or gone, and reframe the package's
copy so nothing is falsifiable. The AI SDK is **not** upgraded — that is a
separate gated track.

**Wired (were typed but inert):**

- `RAGConfig.minScore` now reaches retrieval. The RAG middleware hardcoded `-1`,
  ignoring the configured threshold; it is now threaded through
  `createRetriever` + `createRAGMiddleware`. The default stays `-1` (match-all)
  when unset, so existing pipelines retrieve identically; a standalone
  `createRetriever().search()` keeps its `0.7` default.
- `AiChatConfig.rateLimit` — `AiChatProvider` now builds the
  `SlidingWindowRateLimiter` and gates `sendMessage`; at the cap it emits a
  rate-limited `error` event and does not hit the transport.
- `AiChatConfig.strings` — resolved once and exposed on the context and
  `useAiChat().strings`; `AiChatInput`/`AiChatHeader` read their labels from it
  (explicit props still win). `DEFAULT_STRINGS` now mirrors the shipped UI text,
  so an unset config renders exactly as before.
- `AiChatConfig.errorMessage` — folded into `strings.errorMessage` (one error
  string source).

**Removed (genuinely unwireable / inert):**

- `RAGConfig.rerank` / `RAGMiddlewareOptions.rerank` — was a score sort-and-slice
  that never invoked the model string. Native `rerank()` is an AI SDK 6 export
  this package cannot reach on the `ai@^5` pin.
- `ChatRouteHandlerOptions.maxDuration` — a Next.js route-segment export, not a
  handler param. Passing it did nothing; set `export const maxDuration` in your
  route module instead (now documented).

The server `options.rateLimit` (`createServerRateLimiter`) is unaffected.

// The tour drives client-side navigation and reads `window`; there is nothing
// to prerender here and SSR would only prove the binding is inert, which the
// package's own `ssr.test.ts` already does.
export const ssr = false
export const prerender = false

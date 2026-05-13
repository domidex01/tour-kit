import type { TestBridge } from './test-bridge'

/**
 * Ambient augmentation publishing the dev-mode test bridge on `window`.
 *
 * The `?` is non-negotiable: production builds (and any provider that omits
 * `enableTestBridge`) MUST leave the global as `undefined`. Consumers should
 * always optional-chain through `window.__tourKit__?.` so a missing bridge
 * never crashes their tooling.
 *
 * @internal Wired by `<TourProvider enableTestBridge>` — never set directly.
 */
declare global {
  interface Window {
    __tourKit__?: TestBridge
  }
}

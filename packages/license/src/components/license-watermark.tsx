'use client'

import { useEffect } from 'react'
import { mountWatermark } from '../lib/watermark-dom'

/**
 * The unlicensed badge, as a React component.
 *
 * A binding, not an implementation: the markup, the styles, the accessible
 * label, the click telemetry and the one-badge-per-page rule all live in
 * `lib/watermark-dom.ts`, which `@tour-kit/vue` and `@tour-kit/svelte` share
 * through `@tour-kit/license/headless`. Mount as many of these as you like —
 * and every Pro package's `<LicenseGate>` does — the page still shows one.
 *
 * Renders nothing itself. The badge is appended to `document.body` directly,
 * which is where the portal used to put it, so nothing downstream moved.
 */
export function LicenseWatermark() {
  // `mountWatermark` returns its own release, which is exactly an effect
  // cleanup. Strict Mode's mount/unmount/mount lands on the same count it
  // started from.
  useEffect(() => mountWatermark(), [])

  return null
}

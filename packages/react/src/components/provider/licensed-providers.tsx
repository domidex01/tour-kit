'use client'

import {
  TourKitProvider as CoreTourKitProvider,
  TourProvider as CoreTourProvider,
} from '@tour-kit/core'
import { LicenseGate } from '@tour-kit/license'
import type * as React from 'react'

/**
 * `@tour-kit/react` re-exported core's `TourProvider` and `TourKitProvider`
 * verbatim, so a consumer writing the documented quickstart imported the symbol
 * from here and got core's component — which cannot take a licence dependency
 * (77 B of dist headroom, and `/engine` must stay React-free). The result was
 * that the single-tour quickstart, the path most consumers actually mount,
 * rendered no badge at all while six Pro packages did.
 *
 * These two shims own the symbol instead. Props and behaviour are unchanged, so
 * this is source-compatible; only the module that exports it moves.
 *
 * No `<LicenseProvider>` is required. `LicenseGate`'s no-provider branch
 * returns bare children on a development host and children plus a badge
 * everywhere else, which is exactly right for a consumer who has not configured
 * a key. And `LicenseWatermark` elects a single owner across every mounted
 * instance, so `react` + `hints` + a Pro package still renders one badge.
 */

type TourProviderProps = React.ComponentProps<typeof CoreTourProvider>

export function TourProvider(props: TourProviderProps) {
  return (
    <LicenseGate require="pro">
      <CoreTourProvider {...props} />
    </LicenseGate>
  )
}

type TourKitProviderProps = React.ComponentProps<typeof CoreTourKitProvider>

/**
 * Wrapped as well as `TourProvider`: it is the outer config provider and is
 * often mounted alone, around a tree that renders tour UI through hooks rather
 * than through `<TourProvider>`.
 */
export function TourKitProvider(props: TourKitProviderProps) {
  return (
    <LicenseGate require="pro">
      <CoreTourKitProvider {...props} />
    </LicenseGate>
  )
}

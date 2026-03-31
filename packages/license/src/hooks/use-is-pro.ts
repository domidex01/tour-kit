'use client'

import { useLicense } from './use-license'

export function useIsPro(): boolean {
  const { state } = useLicense()
  return state.status === 'valid' && state.tier === 'pro'
}

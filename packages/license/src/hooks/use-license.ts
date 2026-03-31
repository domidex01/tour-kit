'use client'

import { useContext } from 'react'
import { LicenseContext } from '../context/license-context'
import type { LicenseContextValue } from '../types'

export function useLicense(): LicenseContextValue {
  const context = useContext(LicenseContext)
  if (context === null) {
    throw new Error('useLicense must be used within a <LicenseProvider>')
  }
  return context
}

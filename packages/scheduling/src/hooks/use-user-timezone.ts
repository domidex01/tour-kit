'use client'

import { useEffect, useState } from 'react'
import { getUserTimezone, isValidTimezone } from '../utils/timezone'

/**
 * Hook to get and monitor the user's timezone
 *
 * @param override - Optional timezone override
 * @returns The resolved timezone string (IANA format)
 */
export function useUserTimezone(override?: string): string {
  const [timezone, setTimezone] = useState<string>(() => {
    if (override && isValidTimezone(override)) {
      return override
    }
    // Use UTC during SSR
    if (typeof window === 'undefined') {
      return 'UTC'
    }
    return getUserTimezone()
  })

  useEffect(() => {
    if (override && isValidTimezone(override)) {
      setTimezone(override)
      return
    }

    // Get actual timezone on client
    const actualTimezone = getUserTimezone()
    setTimezone(actualTimezone)
  }, [override])

  return timezone
}

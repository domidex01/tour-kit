import '@testing-library/jest-dom/vitest'
import { afterAll, beforeAll, vi } from 'vitest'

// Mock timezones for consistent testing
const originalDateTimeFormat = Intl.DateTimeFormat

beforeAll(() => {
  // Mock timezone resolution for tests
  vi.stubGlobal(
    'Intl',
    new Proxy(Intl, {
      get(target, prop) {
        if (prop === 'DateTimeFormat') {
          return class MockDateTimeFormat extends originalDateTimeFormat {
            resolvedOptions() {
              const options = super.resolvedOptions()
              // Default to UTC for consistent tests
              return { ...options, timeZone: options.timeZone || 'UTC' }
            }
          }
        }
        return target[prop as keyof typeof Intl]
      },
    })
  )
})

afterAll(() => {
  vi.unstubAllGlobals()
})

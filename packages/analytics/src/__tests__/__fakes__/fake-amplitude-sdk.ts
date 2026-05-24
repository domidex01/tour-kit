import { type Mock, vi } from 'vitest'

interface FakeAmplitudeIdentify {
  set: Mock
}

interface FakeAmplitudeSdk {
  init: Mock
  track: Mock
  identify: Mock
  setUserId: Mock
  Identify: Mock
  reset: Mock
  flush: Mock
}

const fakeIdentifyInstance: FakeAmplitudeIdentify = {
  set: vi.fn().mockReturnThis(),
}

export const fakeAmplitudeSdk: FakeAmplitudeSdk = {
  init: vi.fn((_apiKey: string, _options?: Record<string, unknown>) => ({
    promise: Promise.resolve(),
  })),
  track: vi.fn((_eventName: string, _properties?: Record<string, unknown>) => ({
    promise: Promise.resolve(),
  })),
  identify: vi.fn(),
  setUserId: vi.fn(),
  Identify: vi.fn(() => fakeIdentifyInstance),
  reset: vi.fn(),
  flush: vi.fn(() => ({ promise: Promise.resolve() })),
}

export const fakeIdentify = fakeIdentifyInstance

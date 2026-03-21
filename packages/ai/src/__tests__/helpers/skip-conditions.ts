import { describe } from 'vitest'

export const HAS_OPENAI_KEY = !!process.env.OPENAI_API_KEY

export function describeWithApiKey(name: string, fn: () => void) {
  if (HAS_OPENAI_KEY) {
    describe(name, fn)
  } else {
    describe.skip(`${name} (OPENAI_API_KEY not set)`, fn)
  }
}

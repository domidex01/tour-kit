import { test as base } from '@playwright/test'

interface ConsoleFixtures {
  consoleErrors: string[]
}

/**
 * Extended test fixture that captures console.error messages.
 * Used to verify ProGate logs the correct error for each gated package.
 */
export const test = base.extend<ConsoleFixtures>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    await use(errors)
  },
})

export { expect } from '@playwright/test'

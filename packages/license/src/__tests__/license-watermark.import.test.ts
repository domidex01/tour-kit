// @vitest-environment node
import { describe, expect, it } from 'vitest'

describe('LicenseWatermark module load', () => {
  it('is safe to import without window or document', async () => {
    await expect(import('../components/license-watermark')).resolves.toBeDefined()
  })
})

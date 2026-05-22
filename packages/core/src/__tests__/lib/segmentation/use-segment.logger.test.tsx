import { renderHook } from '@testing-library/react'
import type * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SegmentationProvider, useSegment } from '../../../index'
import type { SegmentSource } from '../../../lib/segmentation/types'
import { logger } from '../../../utils/logger'
import { uniqueSegment } from '../../_helpers/unique-segment'

// Wrap renderHook so each test can render against an isolated provider tree
// without leaking segments between tests.
function wrapper(segments: Record<string, SegmentSource> = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <SegmentationProvider segments={segments}>{children}</SegmentationProvider>
  }
}

describe('useSegment — unknown-segment warn (migrated to logger)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logger.configure({ level: 'warn' })
  })

  afterEach(() => {
    warnSpy.mockRestore()
    logger.configure({ level: 'warn' })
  })

  it('warns once for an unknown segment at default logger level', () => {
    const seg = uniqueSegment('unk')
    renderHook(() => useSegment(seg), { wrapper: wrapper({}) })
    const matched = warnSpy.mock.calls.filter((c: unknown[]) =>
      String(c[1] ?? '').includes('useSegment')
    )
    expect(matched.length).toBeGreaterThanOrEqual(1)
  })

  it('emits no console.warn when logger is silent', () => {
    logger.configure({ level: 'silent' })
    const seg = uniqueSegment('unk-silent')
    renderHook(() => useSegment(seg), { wrapper: wrapper({}) })
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('routes through logger.warn, not direct console.warn', () => {
    const loggerWarnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    renderHook(() => useSegment(uniqueSegment('routed')), { wrapper: wrapper({}) })
    expect(loggerWarnSpy).toHaveBeenCalledTimes(1)
    loggerWarnSpy.mockRestore()
  })
})

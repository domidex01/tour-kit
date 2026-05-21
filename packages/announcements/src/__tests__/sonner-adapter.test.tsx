// Phase 7 — Sonner adapter peer-optional smoke tests.
// Two states: sonner installed (routes via toast.custom) and sonner absent
// (returns null + warns once). Uses vi.doMock + vi.resetModules to give each
// case isolated module state, which is required because the adapter caches a
// module-scope `warned` flag.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('sonnerAdapter — sonner present', () => {
  let customSpy: ReturnType<typeof vi.fn>
  let dismissSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.resetModules()
    customSpy = vi.fn(() => 'mock-id')
    dismissSpy = vi.fn()
    vi.doMock('sonner', () => ({
      toast: Object.assign(vi.fn(), { custom: customSpy, dismiss: dismissSpy }),
      Toaster: () => null,
    }))
  })

  afterEach(() => {
    vi.doUnmock('sonner')
  })

  it('routes the toast through sonner.toast.custom with our options', async () => {
    const { sonnerAdapter } = await import('../adapters/sonner')
    const handle = await sonnerAdapter.render({
      id: 'a',
      content: <div>hello</div>,
      options: { duration: 5000, position: 'bottom-right' },
    })

    expect(customSpy).toHaveBeenCalledTimes(1)
    expect(customSpy).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ duration: 5000, position: 'bottom-right' })
    )
    expect(handle).not.toBeNull()
    expect(handle?.id).toBe('mock-id')
  })

  it('returned handle.dismiss calls sonner.toast.dismiss with the toast id', async () => {
    const { sonnerAdapter } = await import('../adapters/sonner')
    const handle = await sonnerAdapter.render({ id: 'b', content: <div>x</div> })

    expect(handle).not.toBeNull()
    handle?.dismiss()
    expect(dismissSpy).toHaveBeenCalledWith('mock-id')
  })

  it('passes a React element wrapping the content into the toast.custom callback', async () => {
    const { sonnerAdapter } = await import('../adapters/sonner')
    const content = <div data-testid="inner">payload</div>
    await sonnerAdapter.render({ id: 'c', content })

    const callback = customSpy.mock.calls[0]?.[0] as (id: string | number) => React.ReactElement
    const rendered = callback('toast-id')
    // The adapter wraps content in a Fragment so any ReactNode (string,
    // array, …) satisfies sonner's ReactElement contract.
    expect(rendered.type).toBe(React.Fragment)
  })

  it('falls back to default duration and bottom-right position when options omitted', async () => {
    const { sonnerAdapter } = await import('../adapters/sonner')
    await sonnerAdapter.render({ id: 'd', content: <div>x</div> })
    expect(customSpy).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ duration: 5000, position: 'bottom-right' })
    )
  })
})

describe('sonnerAdapter — sonner absent', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.resetModules()
    vi.doMock('sonner', () => {
      throw new Error('Cannot find module sonner')
    })
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.doUnmock('sonner')
    warnSpy.mockRestore()
  })

  it('returns null and warns once when sonner is not installed', async () => {
    const { sonnerAdapter } = await import('../adapters/sonner')
    const handle = await sonnerAdapter.render({ id: 'a', content: <div>x</div> })

    expect(handle).toBeNull()
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0]?.[0]).toEqual(expect.stringContaining('sonner'))
  })

  it('does not re-warn on subsequent calls (module-scope flag)', async () => {
    const { sonnerAdapter } = await import('../adapters/sonner')
    await sonnerAdapter.render({ id: 'a', content: <div>x</div> })
    await sonnerAdapter.render({ id: 'b', content: <div>y</div> })
    await sonnerAdapter.render({ id: 'c', content: <div>z</div> })

    expect(warnSpy).toHaveBeenCalledTimes(1)
  })
})

describe('sonnerAdapter — sonner partial (toast undefined)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.resetModules()
    vi.doMock('sonner', () => ({
      // Major-version mismatch scenario: module loads but `toast` is missing.
      toast: undefined,
    }))
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.doUnmock('sonner')
    warnSpy.mockRestore()
  })

  it('returns null and warns when toast() is undefined', async () => {
    const { sonnerAdapter } = await import('../adapters/sonner')
    const handle = await sonnerAdapter.render({ id: 'a', content: <div>x</div> })

    expect(handle).toBeNull()
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })
})

describe('sonnerAdapter — subpath isolation', () => {
  it('main barrel does not import the sonner adapter', () => {
    const __here = dirname(fileURLToPath(import.meta.url))
    const indexSrc = readFileSync(join(__here, '..', 'index.ts'), 'utf8')
    // Contract: NO export/import line references `./adapters/sonner`.
    // Allows the path to appear in comments (documentation) but blocks any
    // `from '...adapters/sonner'` form that would pull bytes into the main
    // bundle.
    expect(indexSrc).not.toMatch(/from\s+['"][^'"]*adapters\/sonner['"]/i)
    expect(indexSrc).not.toMatch(/import\s+['"][^'"]*adapters\/sonner['"]/i)
    expect(indexSrc).not.toMatch(/import\s*\(\s*['"][^'"]*adapters\/sonner['"]/i)
  })

  it('exports the ToastAdapter type-symbol from the main barrel for consumers', async () => {
    const mod = (await import('../index')) as Record<string, unknown>
    const __here = dirname(fileURLToPath(import.meta.url))
    const indexSrc = readFileSync(join(__here, '..', 'index.ts'), 'utf8')
    // Interfaces erase at runtime, so we verify type-only re-exports via source grep:
    expect(indexSrc).toMatch(/ToastAdapter/)
    expect(indexSrc).toMatch(/ToastAdapterRenderArgs/)
    expect(indexSrc).toMatch(/ToastAdapterHandle/)
    // The adapter const itself MUST NOT leak onto the main barrel:
    expect(mod.sonnerAdapter).toBeUndefined()
  })
})

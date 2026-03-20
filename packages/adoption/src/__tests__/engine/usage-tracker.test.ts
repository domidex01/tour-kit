/**
 * @tour-kit/adoption - Usage Tracker Tests
 *
 * Tests for the feature usage tracking functions.
 * These tests require JSDOM environment for DOM event testing.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { emitFeatureEvent, setupFeatureTracking } from '../../engine/usage-tracker'
import type { Feature } from '../../types'

// -----------------------------------------------------------------------------
// Mock Factory
// -----------------------------------------------------------------------------

function createMockFeature(overrides: Partial<Feature> = {}): Feature {
  return {
    id: 'test-feature',
    name: 'Test Feature',
    description: 'A test feature',
    trigger: '#test-button',
    ...overrides,
  }
}

// -----------------------------------------------------------------------------
// Test Suite
// -----------------------------------------------------------------------------

describe('setupFeatureTracking', () => {
  let cleanup: () => void

  afterEach(() => {
    // Clean up any registered listeners
    cleanup?.()
    // Clean up DOM
    document.body.innerHTML = ''
  })

  describe('CSS Selector Trigger', () => {
    it('tracks clicks on elements matching selector', () => {
      const onUsage = vi.fn()
      const feature = createMockFeature({ trigger: '#test-button' })
      document.body.innerHTML = '<button id="test-button">Click me</button>'

      cleanup = setupFeatureTracking(feature, onUsage)
      document.getElementById('test-button')?.click()

      expect(onUsage).toHaveBeenCalledWith('test-feature')
      expect(onUsage).toHaveBeenCalledTimes(1)
    })

    it('tracks clicks on child elements of matched selector', () => {
      const onUsage = vi.fn()
      const feature = createMockFeature({ trigger: '#parent' })
      document.body.innerHTML = `
        <div id="parent">
          <span id="child">Click me</span>
        </div>
      `

      cleanup = setupFeatureTracking(feature, onUsage)
      document.getElementById('child')?.click()

      expect(onUsage).toHaveBeenCalledWith('test-feature')
    })

    it('does not track clicks on non-matching elements', () => {
      const onUsage = vi.fn()
      const feature = createMockFeature({ trigger: '#test-button' })
      document.body.innerHTML = `
        <button id="test-button">Target</button>
        <button id="other-button">Other</button>
      `

      cleanup = setupFeatureTracking(feature, onUsage)
      document.getElementById('other-button')?.click()

      expect(onUsage).not.toHaveBeenCalled()
    })

    it('supports class selectors', () => {
      const onUsage = vi.fn()
      const feature = createMockFeature({ trigger: '.feature-btn' })
      document.body.innerHTML = '<button class="feature-btn">Click me</button>'

      cleanup = setupFeatureTracking(feature, onUsage)
      document
        .querySelector('.feature-btn')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

      expect(onUsage).toHaveBeenCalledWith('test-feature')
    })

    it('supports data attribute selectors', () => {
      const onUsage = vi.fn()
      const feature = createMockFeature({ trigger: '[data-feature="test"]' })
      document.body.innerHTML = '<button data-feature="test">Click me</button>'

      cleanup = setupFeatureTracking(feature, onUsage)
      document
        .querySelector('[data-feature="test"]')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

      expect(onUsage).toHaveBeenCalledWith('test-feature')
    })

    it('cleanup removes event listener', () => {
      const onUsage = vi.fn()
      const feature = createMockFeature({ trigger: '#test-button' })
      document.body.innerHTML = '<button id="test-button">Click me</button>'

      cleanup = setupFeatureTracking(feature, onUsage)
      cleanup()
      document.getElementById('test-button')?.click()

      expect(onUsage).not.toHaveBeenCalled()
    })

    it('tracks multiple clicks', () => {
      vi.useFakeTimers()
      const onUsage = vi.fn()
      const feature = createMockFeature({ trigger: '#test-button' })
      document.body.innerHTML = '<button id="test-button">Click me</button>'

      cleanup = setupFeatureTracking(feature, onUsage)
      document.getElementById('test-button')?.click()
      vi.advanceTimersByTime(1000)
      document.getElementById('test-button')?.click()
      vi.advanceTimersByTime(1000)
      document.getElementById('test-button')?.click()

      expect(onUsage).toHaveBeenCalledTimes(3)
      vi.useRealTimers()
    })
  })

  describe('Custom Event Trigger', () => {
    it('tracks custom events', () => {
      const onUsage = vi.fn()
      const feature = createMockFeature({
        trigger: { event: 'feature:used' },
      })

      cleanup = setupFeatureTracking(feature, onUsage)
      window.dispatchEvent(new CustomEvent('feature:used'))

      expect(onUsage).toHaveBeenCalledWith('test-feature')
    })

    it('tracks multiple event occurrences', () => {
      const onUsage = vi.fn()
      const feature = createMockFeature({
        trigger: { event: 'feature:used' },
      })

      cleanup = setupFeatureTracking(feature, onUsage)
      window.dispatchEvent(new CustomEvent('feature:used'))
      window.dispatchEvent(new CustomEvent('feature:used'))

      expect(onUsage).toHaveBeenCalledTimes(2)
    })

    it('does not track unrelated events', () => {
      const onUsage = vi.fn()
      const feature = createMockFeature({
        trigger: { event: 'feature:used' },
      })

      cleanup = setupFeatureTracking(feature, onUsage)
      window.dispatchEvent(new CustomEvent('other:event'))

      expect(onUsage).not.toHaveBeenCalled()
    })

    it('cleanup removes event listener', () => {
      const onUsage = vi.fn()
      const feature = createMockFeature({
        trigger: { event: 'feature:used' },
      })

      cleanup = setupFeatureTracking(feature, onUsage)
      cleanup()
      window.dispatchEvent(new CustomEvent('feature:used'))

      expect(onUsage).not.toHaveBeenCalled()
    })
  })

  describe('Callback Trigger', () => {
    it('returns no-op cleanup for callback triggers', () => {
      const onUsage = vi.fn()
      const feature = createMockFeature({
        trigger: { callback: () => true },
      })

      cleanup = setupFeatureTracking(feature, onUsage)

      // Should not throw and callback should not be called automatically
      expect(onUsage).not.toHaveBeenCalled()
    })

    it('cleanup is safe to call', () => {
      const feature = createMockFeature({
        trigger: { callback: () => true },
      })

      cleanup = setupFeatureTracking(feature, vi.fn())

      // Should not throw
      expect(() => cleanup()).not.toThrow()
    })
  })
})

describe('emitFeatureEvent', () => {
  it('dispatches custom event on window', () => {
    const handler = vi.fn()
    window.addEventListener('test:event', handler)

    emitFeatureEvent('test:event')

    expect(handler).toHaveBeenCalled()
    window.removeEventListener('test:event', handler)
  })

  it('includes detail in event', () => {
    let receivedDetail: unknown
    const handler = (e: Event) => {
      receivedDetail = (e as CustomEvent).detail
    }
    window.addEventListener('test:event', handler)

    emitFeatureEvent('test:event', { foo: 'bar' })

    expect(receivedDetail).toEqual({ foo: 'bar' })
    window.removeEventListener('test:event', handler)
  })

  it('works with undefined detail', () => {
    const handler = vi.fn()
    window.addEventListener('test:event', handler)

    emitFeatureEvent('test:event')

    expect(handler).toHaveBeenCalled()
    const event = handler.mock.calls[0][0] as CustomEvent
    // CustomEvent detail defaults to null when not provided
    expect(event.detail).toBeNull()
    window.removeEventListener('test:event', handler)
  })

  it('integrates with setupFeatureTracking', () => {
    const onUsage = vi.fn()
    const feature = createMockFeature({
      trigger: { event: 'my-feature:activated' },
    })

    const cleanup = setupFeatureTracking(feature, onUsage)
    emitFeatureEvent('my-feature:activated')

    expect(onUsage).toHaveBeenCalledWith('test-feature')
    cleanup()
  })
})

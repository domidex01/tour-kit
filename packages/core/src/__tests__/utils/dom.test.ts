import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getElement,
  getFocusableElements,
  getScrollParent,
  isElementPartiallyVisible,
  isElementVisible,
  waitForElement,
} from '../../utils/dom'

describe('DOM Utilities', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  describe('getElement', () => {
    it('returns null for null input', () => {
      expect(getElement(null)).toBeNull()
    })

    it('returns element for valid selector', () => {
      container.innerHTML = '<div id="test">Test</div>'
      const element = getElement('#test')
      expect(element).toBeInstanceOf(HTMLElement)
      expect(element?.textContent).toBe('Test')
    })

    it('returns null for non-existent selector', () => {
      expect(getElement('#nonexistent')).toBeNull()
    })

    it('returns element directly if passed', () => {
      const div = document.createElement('div')
      expect(getElement(div)).toBe(div)
    })

    it('returns element from ref object', () => {
      const div = document.createElement('div')
      const ref = { current: div }
      expect(getElement(ref)).toBe(div)
    })

    it('returns null from ref with null current', () => {
      const ref = { current: null }
      expect(getElement(ref)).toBeNull()
    })
  })

  describe('isElementVisible', () => {
    it('returns true for element in viewport', () => {
      const element = document.createElement('div')
      container.appendChild(element)

      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        left: 100,
        bottom: 200,
        right: 200,
        width: 100,
        height: 100,
        x: 100,
        y: 100,
        toJSON: () => ({}),
      })

      expect(isElementVisible(element)).toBe(true)
    })

    it('returns false for element above viewport', () => {
      const element = document.createElement('div')
      container.appendChild(element)

      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        top: -100,
        left: 100,
        bottom: -50,
        right: 200,
        width: 100,
        height: 50,
        x: 100,
        y: -100,
        toJSON: () => ({}),
      })

      expect(isElementVisible(element)).toBe(false)
    })
  })

  describe('isElementPartiallyVisible', () => {
    it('returns true for partially visible element', () => {
      const element = document.createElement('div')
      container.appendChild(element)

      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        top: -50,
        left: 100,
        bottom: 50,
        right: 200,
        width: 100,
        height: 100,
        x: 100,
        y: -50,
        toJSON: () => ({}),
      })

      expect(isElementPartiallyVisible(element)).toBe(true)
    })

    it('returns false for completely hidden element', () => {
      const element = document.createElement('div')
      container.appendChild(element)

      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        top: -200,
        left: 100,
        bottom: -100,
        right: 200,
        width: 100,
        height: 100,
        x: 100,
        y: -200,
        toJSON: () => ({}),
      })

      expect(isElementPartiallyVisible(element)).toBe(false)
    })
  })

  describe('getFocusableElements', () => {
    it('returns focusable elements in container', () => {
      container.innerHTML = `
        <button>Button</button>
        <input type="text" />
        <a href="#">Link</a>
        <div tabindex="0">Focusable div</div>
        <div>Not focusable</div>
      `

      // Mock offsetParent for jsdom (it's always null in jsdom)
      const elements = container.querySelectorAll('button, input, a, [tabindex="0"]')
      for (const el of elements) {
        Object.defineProperty(el, 'offsetParent', { value: container, configurable: true })
      }

      const focusable = getFocusableElements(container)
      expect(focusable).toHaveLength(4)
    })

    it('excludes disabled elements', () => {
      container.innerHTML = `
        <button disabled>Disabled Button</button>
        <button>Enabled Button</button>
      `

      // Mock offsetParent for the enabled button
      const enabledButton = container.querySelector('button:not([disabled])')
      if (enabledButton) {
        Object.defineProperty(enabledButton, 'offsetParent', {
          value: container,
          configurable: true,
        })
      }

      const focusable = getFocusableElements(container)
      expect(focusable).toHaveLength(1)
    })

    it('excludes elements with tabindex="-1"', () => {
      container.innerHTML = `
        <button tabindex="-1">Not focusable</button>
        <button>Focusable</button>
      `

      // Mock offsetParent for the focusable button
      const focusableButton = container.querySelector('button:not([tabindex="-1"])')
      if (focusableButton) {
        Object.defineProperty(focusableButton, 'offsetParent', {
          value: container,
          configurable: true,
        })
      }

      const focusable = getFocusableElements(container)
      expect(focusable).toHaveLength(1)
    })

    it('returns empty array for container with no focusable elements', () => {
      container.innerHTML = '<div>Not focusable</div>'
      const focusable = getFocusableElements(container)
      expect(focusable).toHaveLength(0)
    })
  })

  describe('waitForElement', () => {
    it('resolves immediately if element exists', async () => {
      container.innerHTML = '<div id="existing">Exists</div>'
      const element = await waitForElement('#existing')
      expect(element.textContent).toBe('Exists')
    })

    it('resolves when element appears', async () => {
      const promise = waitForElement('#dynamic', 1000)

      setTimeout(() => {
        container.innerHTML = '<div id="dynamic">Dynamic</div>'
      }, 100)

      const element = await promise
      expect(element.textContent).toBe('Dynamic')
    })

    it('rejects on timeout', async () => {
      await expect(waitForElement('#nonexistent', 100)).rejects.toThrow(
        'Element "#nonexistent" not found within 100ms'
      )
    })
  })

  describe('getScrollParent', () => {
    it('returns window when no scrollable parent exists', () => {
      const element = document.createElement('div')
      container.appendChild(element)
      expect(getScrollParent(element)).toBe(window)
    })

    it('returns scrollable parent element', () => {
      const scrollParent = document.createElement('div')
      scrollParent.style.overflow = 'auto'
      const child = document.createElement('div')
      scrollParent.appendChild(child)
      container.appendChild(scrollParent)

      expect(getScrollParent(child)).toBe(scrollParent)
    })
  })
})

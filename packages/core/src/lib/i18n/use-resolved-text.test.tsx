import { render, screen } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'
import type { LocalizedText } from '../localized-text'
import { SegmentationProvider } from '../segmentation/segmentation-context'
import { LocaleProvider } from './locale-context'
import { useResolvedText } from './use-resolved-text'

function Probe({
  value,
  vars,
}: {
  value: React.ReactNode | LocalizedText | undefined
  vars?: Record<string, unknown>
}) {
  const resolved = useResolvedText(value, vars)
  return <span data-testid="out">{resolved}</span>
}

describe('useResolvedText', () => {
  describe('string input', () => {
    it('interpolates from SegmentationProvider userContext', () => {
      render(
        <SegmentationProvider segments={{}} userContext={{ user: { name: 'Ada' } }}>
          <Probe value="Hi {{user.name | there}}" />
        </SegmentationProvider>
      )
      expect(screen.getByTestId('out')).toHaveTextContent('Hi Ada')
    })

    it('falls back to inline default when var is missing', () => {
      render(
        <SegmentationProvider segments={{}} userContext={{}}>
          <Probe value="Hi {{user.name | stranger}}" />
        </SegmentationProvider>
      )
      expect(screen.getByTestId('out')).toHaveTextContent('Hi stranger')
    })

    it('explicit vars override segmentation context', () => {
      render(
        <SegmentationProvider segments={{}} userContext={{ user: { name: 'Ada' } }}>
          <Probe value="Hi {{user.name}}" vars={{ user: { name: 'Babbage' } }} />
        </SegmentationProvider>
      )
      expect(screen.getByTestId('out')).toHaveTextContent('Hi Babbage')
    })
  })

  describe('i18n key input', () => {
    it('resolves { key } via LocaleProvider messages and userContext', () => {
      render(
        <SegmentationProvider segments={{}} userContext={{ user: { name: 'Ada' } }}>
          <LocaleProvider messages={{ greet: 'Hi {{user.name}}' }}>
            <Probe value={{ key: 'greet' }} />
          </LocaleProvider>
        </SegmentationProvider>
      )
      expect(screen.getByTestId('out')).toHaveTextContent('Hi Ada')
    })
  })

  describe('ReactNode pass-through', () => {
    it('returns a JSX element unchanged (no toString)', () => {
      render(
        <Probe
          value={
            <strong data-testid="jsx">
              Bold <em>text</em>
            </strong>
          }
        />
      )
      // The element should be in the DOM as a real <strong>, not stringified
      const jsx = screen.getByTestId('jsx')
      expect(jsx.tagName.toLowerCase()).toBe('strong')
      expect(jsx.querySelector('em')).not.toBeNull()
    })
  })

  describe('null/undefined input', () => {
    it('returns undefined for undefined', () => {
      render(<Probe value={undefined} />)
      expect(screen.getByTestId('out').textContent).toBe('')
    })
  })
})

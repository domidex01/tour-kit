import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { LocalizedText } from '../localized-text'
import { SegmentationProvider } from '../segmentation/segmentation-context'
import { LocaleProvider } from './locale-context'
import { useResolveLocalizedText } from './use-resolve-localized-text'

function Probe({ value }: { value: LocalizedText | undefined }) {
  const resolveText = useResolveLocalizedText()
  return <span data-testid="out">{resolveText(value)}</span>
}

describe('useResolveLocalizedText', () => {
  describe('plain string templates', () => {
    it('interpolates from SegmentationProvider userContext', () => {
      render(
        <SegmentationProvider segments={{}} userContext={{ user: { name: 'Ada' } }}>
          <Probe value="Hi {{user.name | there}}" />
        </SegmentationProvider>
      )
      expect(screen.getByTestId('out')).toHaveTextContent('Hi Ada')
    })

    it('falls back to inline default when var missing', () => {
      render(
        <SegmentationProvider segments={{}} userContext={{}}>
          <Probe value="Hi {{user.name | there}}" />
        </SegmentationProvider>
      )
      expect(screen.getByTestId('out')).toHaveTextContent('Hi there')
    })

    it('graceful degradation: renders plain strings without any provider', () => {
      render(<Probe value="Hello world" />)
      expect(screen.getByTestId('out')).toHaveTextContent('Hello world')
    })
  })

  describe('keyed text', () => {
    it('resolves via LocaleProvider messages and SegmentationProvider userContext', () => {
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

  describe('undefined values', () => {
    it('returns empty string for undefined', () => {
      render(<Probe value={undefined} />)
      expect(screen.getByTestId('out').textContent).toBe('')
    })
  })
})

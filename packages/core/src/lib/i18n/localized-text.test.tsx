import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { SegmentationProvider } from '../segmentation/segmentation-context'
import { LocaleProvider } from './locale-context'
import { type LocalizedText, useResolveLocalizedText } from './localized-text'

function Probe({ value }: { value: LocalizedText | undefined }) {
  const resolveText = useResolveLocalizedText()
  return <span data-testid="out">{resolveText(value)}</span>
}

describe('useResolveLocalizedText', () => {
  describe('plain string templates', () => {
    it('interpolates from LocaleProvider userContext', () => {
      render(
        <LocaleProvider userContext={{ user: { name: 'Ada' } }}>
          <Probe value="Hi {{user.name | there}}" />
        </LocaleProvider>
      )
      expect(screen.getByTestId('out')).toHaveTextContent('Hi Ada')
    })

    it('falls back to inline default when var missing', () => {
      render(
        <LocaleProvider userContext={{}}>
          <Probe value="Hi {{user.name | there}}" />
        </LocaleProvider>
      )
      expect(screen.getByTestId('out')).toHaveTextContent('Hi there')
    })

    it('graceful degradation: renders plain strings without any provider', () => {
      render(<Probe value="Hello world" />)
      expect(screen.getByTestId('out')).toHaveTextContent('Hello world')
    })
  })

  describe('keyed text', () => {
    it('resolves via LocaleProvider messages and userContext', () => {
      render(
        <LocaleProvider
          messages={{ greet: 'Hi {{user.name}}' }}
          userContext={{ user: { name: 'Ada' } }}
        >
          <Probe value={{ key: 'greet' }} />
        </LocaleProvider>
      )
      expect(screen.getByTestId('out')).toHaveTextContent('Hi Ada')
    })
  })

  describe('SegmentationProvider userContext fallback', () => {
    it('uses SegmentationProvider userContext when LocaleProvider has none', () => {
      const tree: ReactNode = (
        <SegmentationProvider segments={{}} userContext={{ user: { name: 'Bob' } }}>
          <LocaleProvider>
            <Probe value="Hi {{user.name | there}}" />
          </LocaleProvider>
        </SegmentationProvider>
      )
      render(tree)
      expect(screen.getByTestId('out')).toHaveTextContent('Hi Bob')
    })

    it('LocaleProvider userContext wins when both providers set it', () => {
      render(
        <SegmentationProvider segments={{}} userContext={{ user: { name: 'Seg' } }}>
          <LocaleProvider userContext={{ user: { name: 'Locale' } }}>
            <Probe value="Hi {{user.name}}" />
          </LocaleProvider>
        </SegmentationProvider>
      )
      expect(screen.getByTestId('out')).toHaveTextContent('Hi Locale')
    })
  })

  describe('undefined values', () => {
    it('returns empty string for undefined', () => {
      render(<Probe value={undefined} />)
      expect(screen.getByTestId('out').textContent).toBe('')
    })
  })
})

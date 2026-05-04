import { render, screen } from '@testing-library/react'
import { useResolveLocalizedText } from '@tour-kit/core'
import { describe, expect, it } from 'vitest'
import { QuestionSelect } from '../components/question-select'
import type { QuestionConfig, SelectOption } from '../types/question'
import { renderWithLocale } from './render-with-locale'

/**
 * Probe that mirrors what real survey display components do: pull the resolver
 * out of context and render the resolved text. Used to verify the wiring of
 * `LocalizedText` fields on `QuestionConfig`.
 */
function QuestionTextProbe({ q }: { q: QuestionConfig }) {
  const resolveText = useResolveLocalizedText()
  return (
    <div>
      <p data-testid="text">{resolveText(q.text)}</p>
      <p data-testid="description">{resolveText(q.description)}</p>
      <p data-testid="placeholder">{resolveText(q.placeholder)}</p>
    </div>
  )
}

describe('survey i18n widening', () => {
  it('resolves QuestionConfig.text via { key } against LocaleProvider messages', () => {
    const q: QuestionConfig = { id: 'q1', type: 'text', text: { key: 'q.nps' } }
    renderWithLocale(<QuestionTextProbe q={q} />, {
      messages: { 'q.nps': 'How likely are you to recommend us?' },
    })
    expect(screen.getByTestId('text')).toHaveTextContent('How likely are you to recommend us?')
  })

  it('interpolates plain string templates via LocaleProvider userContext', () => {
    const q: QuestionConfig = {
      id: 'q1',
      type: 'text',
      text: 'How was {{product.name | our product}}?',
    }
    renderWithLocale(<QuestionTextProbe q={q} />, {
      userContext: { product: { name: 'Acme' } },
    })
    expect(screen.getByTestId('text')).toHaveTextContent('How was Acme?')
  })

  it('falls back to inline default when userContext omits the var', () => {
    const q: QuestionConfig = {
      id: 'q1',
      type: 'text',
      text: 'How was {{product.name | our product}}?',
    }
    renderWithLocale(<QuestionTextProbe q={q} />, { userContext: {} })
    expect(screen.getByTestId('text')).toHaveTextContent('How was our product?')
  })

  it('renders plain strings without LocaleProvider (graceful degradation)', () => {
    const q: QuestionConfig = { id: 'q1', type: 'text', text: 'How was your experience?' }
    render(<QuestionTextProbe q={q} />)
    expect(screen.getByTestId('text')).toHaveTextContent('How was your experience?')
  })

  it('resolves SelectOption.label via { key } in QuestionSelect', () => {
    const options: SelectOption[] = [
      { value: 'yes', label: { key: 'opt.yes' } },
      { value: 'no', label: { key: 'opt.no' } },
    ]
    renderWithLocale(<QuestionSelect id="q" mode="single" options={options} label="pick" />, {
      messages: { 'opt.yes': 'Yes please', 'opt.no': 'No thanks' },
    })
    expect(screen.getByText('Yes please')).toBeInTheDocument()
    expect(screen.getByText('No thanks')).toBeInTheDocument()
  })

  it('SelectOption.label interpolates from userContext on plain string templates', () => {
    const options: SelectOption[] = [{ value: 'a', label: 'Choose for {{user.name | someone}}' }]
    renderWithLocale(<QuestionSelect id="q" mode="single" options={options} label="pick" />, {
      userContext: { user: { name: 'Ada' } },
    })
    expect(screen.getByText('Choose for Ada')).toBeInTheDocument()
  })
})

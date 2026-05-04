import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { QuestionMedia } from '../components/question-media'
import type { QuestionConfig } from '../types/question'

describe('QuestionConfig.media wiring', () => {
  it('renders MediaSlot above the question prompt when question.media is set (YouTube)', () => {
    const q: QuestionConfig = {
      id: 'q1',
      type: 'rating',
      text: 'How was your experience?',
      media: { src: 'https://youtu.be/dQw4w9WgXcQ', alt: 'demo' },
    }
    render(<QuestionMedia question={q} />)
    expect(document.querySelector('[data-slot="question-media"]')).not.toBeNull()
    expect(document.querySelector('iframe')).not.toBeNull()
  })

  it('renders nothing when question.media is absent', () => {
    const q: QuestionConfig = { id: 'q2', type: 'rating', text: 'No media' }
    const { container } = render(<QuestionMedia question={q} />)
    expect(container.firstChild).toBeNull()
  })

  it('respects explicit type override (CDN URL with type="video")', () => {
    const q: QuestionConfig = {
      id: 'q3',
      type: 'rating',
      text: 'CDN video',
      media: { src: 'https://my-cdn.example/v', type: 'video', alt: 'cdn' },
    }
    render(<QuestionMedia question={q} />)
    expect(document.querySelector('video')).not.toBeNull()
  })
})

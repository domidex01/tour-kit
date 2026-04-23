import { render, screen } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { HeadlessSurvey } from '../components/headless/headless-survey'
import { SurveyBanner } from '../components/survey-banner'
import { SurveyInline } from '../components/survey-inline'
import { SurveySlideout } from '../components/survey-slideout'
import { SurveysProvider } from '../context'
import type { SurveyConfig } from '../types'

vi.mock('@tour-kit/license', () => ({
  ProGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@tour-kit/core', () => ({
  useTourContext: () => ({ isActive: false }),
  useTourContextOptional: () => ({ isActive: false }),
  createStorageAdapter: () => ({
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }),
}))

const cfg: SurveyConfig = {
  id: 's1',
  type: 'csat',
  displayMode: 'inline',
  title: 'How are we doing?',
  description: 'A brief check-in',
  questions: [],
}

describe('SurveyBanner', () => {
  it('does not render when survey not visible', () => {
    render(
      <SurveysProvider surveys={[cfg]}>
        <SurveyBanner surveyId="s1" />
      </SurveysProvider>
    )
    expect(screen.queryByRole('region')).toBeNull()
  })
})

describe('SurveyInline', () => {
  it('renders when alwaysRender is true', () => {
    render(
      <SurveysProvider surveys={[cfg]}>
        <SurveyInline surveyId="s1" alwaysRender />
      </SurveysProvider>
    )
    expect(screen.getByText('How are we doing?')).toBeDefined()
    expect(screen.getByText('A brief check-in')).toBeDefined()
  })

  it('is null by default when survey not visible', () => {
    render(
      <SurveysProvider surveys={[cfg]}>
        <SurveyInline surveyId="s1" />
      </SurveysProvider>
    )
    expect(screen.queryByRole('region')).toBeNull()
  })
})

describe('SurveySlideout', () => {
  it('does not render when closed', () => {
    render(
      <SurveysProvider surveys={[cfg]}>
        <SurveySlideout surveyId="s1" />
      </SurveysProvider>
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders when open is forced via prop', () => {
    render(
      <SurveysProvider surveys={[cfg]}>
        <SurveySlideout surveyId="s1" open />
      </SurveysProvider>
    )
    expect(screen.getByRole('dialog')).toBeDefined()
  })
})

describe('HeadlessSurvey', () => {
  it('render prop exposes state, config, and actions', () => {
    const received: Array<{ surveyId: string; show: unknown; dismiss: unknown; answer: unknown; complete: unknown }> = []
    render(
      <SurveysProvider surveys={[cfg]}>
        <HeadlessSurvey surveyId="s1">
          {(props) => {
            received.push({
              surveyId: props.surveyId,
              show: props.show,
              dismiss: props.dismiss,
              answer: props.answer,
              complete: props.complete,
            })
            return <span data-testid="hs-title">{props.config?.title}</span>
          }}
        </HeadlessSurvey>
      </SurveysProvider>
    )

    expect(screen.getByTestId('hs-title').textContent).toBe('How are we doing?')
    const last = received[received.length - 1]
    expect(last?.surveyId).toBe('s1')
    expect(typeof last?.show).toBe('function')
    expect(typeof last?.dismiss).toBe('function')
    expect(typeof last?.answer).toBe('function')
    expect(typeof last?.complete).toBe('function')
  })
})

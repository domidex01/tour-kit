import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SurveyModal } from '../components/survey-modal'
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

const config: SurveyConfig = {
  id: 'm1',
  type: 'nps',
  displayMode: 'modal',
  title: 'NPS Survey',
  description: 'How likely to recommend?',
  questions: [],
}

describe('SurveyModal', () => {
  it('does not render when survey is not visible', () => {
    render(
      <SurveysProvider surveys={[config]}>
        <SurveyModal surveyId="m1" />
      </SurveysProvider>
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders title and description when visible', () => {
    function Harness() {
      return (
        <SurveysProvider surveys={[config]}>
          <Opener />
          <SurveyModal surveyId="m1" />
        </SurveysProvider>
      )
    }
    function Opener() {
      // show via controlled prop simplest: open modal directly
      return <SurveyModal surveyId="m1" open>only one should appear</SurveyModal>
    }
    render(<Harness />)
    expect(screen.getAllByText('NPS Survey').length).toBeGreaterThan(0)
    expect(screen.getAllByText('How likely to recommend?').length).toBeGreaterThan(0)
  })

  it('fires onOpenChange when close button is clicked', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <SurveysProvider surveys={[config]}>
        <SurveyModal surveyId="m1" open onOpenChange={onOpenChange} />
      </SurveysProvider>
    )
    const closeBtn = screen.getByRole('button', { name: /close survey/i })
    await act(async () => {
      await user.click(closeBtn)
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

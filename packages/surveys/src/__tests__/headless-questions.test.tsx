import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { HeadlessQuestionBooleanRenderProps } from '../components/headless/headless-question-boolean'
import { HeadlessQuestionBoolean } from '../components/headless/headless-question-boolean'
import type { HeadlessQuestionRatingRenderProps } from '../components/headless/headless-question-rating'
import { HeadlessQuestionRating } from '../components/headless/headless-question-rating'
import type { HeadlessQuestionSelectRenderProps } from '../components/headless/headless-question-select'
import { HeadlessQuestionSelect } from '../components/headless/headless-question-select'
import type { HeadlessQuestionTextRenderProps } from '../components/headless/headless-question-text'
import { HeadlessQuestionText } from '../components/headless/headless-question-text'

vi.mock('@tour-kit/license', () => ({
  ProGate: ({ children }: { children: React.ReactNode }) => children,
  useLicenseGate: () => ({ isAllowed: true, isLoading: false }),
}))

describe('HeadlessQuestionRating', () => {
  it('should provide expected render props', () => {
    let captured: HeadlessQuestionRatingRenderProps | undefined
    render(
      <HeadlessQuestionRating id="hr" label="Rate" min={1} max={5}>
        {(props) => {
          captured = props
          return <div data-testid="child">rendered</div>
        }}
      </HeadlessQuestionRating>
    )

    expect(captured).toBeDefined()
    expect(captured?.value).toBeNull()
    expect(captured?.setValue).toBeTypeOf('function')
    expect(captured?.options).toEqual([1, 2, 3, 4, 5])
    expect(captured?.focusedIndex).toBe(0)
    expect(captured?.setFocusedIndex).toBeTypeOf('function')
    expect(captured?.ratingGroupProps).toBeDefined()
    expect(captured?.getOptionProps).toBeTypeOf('function')
  })

  it('should produce zero extra DOM — only child output', () => {
    const { container } = render(
      <HeadlessQuestionRating id="hr" label="Rate" min={1} max={3}>
        {() => <span data-testid="only-child">hello</span>}
      </HeadlessQuestionRating>
    )
    expect(container.innerHTML).toBe('<span data-testid="only-child">hello</span>')
  })

  it('should provide correct ratingGroupProps shape', () => {
    let captured: HeadlessQuestionRatingRenderProps | undefined
    render(
      <HeadlessQuestionRating id="hr" label="Rate" isRequired>
        {(props) => {
          captured = props
          return <div />
        }}
      </HeadlessQuestionRating>
    )

    expect(captured?.ratingGroupProps.role).toBe('radiogroup')
    expect(captured?.ratingGroupProps['aria-label']).toBe('Rate')
    expect(captured?.ratingGroupProps['aria-required']).toBe(true)
  })

  it('should provide correct getOptionProps shape', () => {
    let captured: HeadlessQuestionRatingRenderProps | undefined
    render(
      <HeadlessQuestionRating id="hr" label="Rate" min={1} max={3}>
        {(props) => {
          captured = props
          return <div />
        }}
      </HeadlessQuestionRating>
    )

    const optProps = captured?.getOptionProps(2)
    expect(optProps.role).toBe('radio')
    expect(optProps['aria-checked']).toBe(false)
    expect(optProps['aria-label']).toBe('Rate 2 out of 3')
    expect(typeof optProps.tabIndex).toBe('number')
  })
})

describe('HeadlessQuestionText', () => {
  it('should provide expected render props', () => {
    let captured: HeadlessQuestionTextRenderProps | undefined
    render(
      <HeadlessQuestionText id="ht" label="Feedback">
        {(props) => {
          captured = props
          return <div />
        }}
      </HeadlessQuestionText>
    )

    expect(captured).toBeDefined()
    expect(captured?.value).toBe('')
    expect(captured?.setValue).toBeTypeOf('function')
    expect(captured?.characterCount).toBe(0)
    expect(captured?.isAtLimit).toBe(false)
    expect(captured?.inputProps).toBeDefined()
    expect(captured?.characterCountProps).toBeDefined()
  })

  it('should produce zero extra DOM', () => {
    const { container } = render(
      <HeadlessQuestionText id="ht" label="Feedback">
        {() => <span>only</span>}
      </HeadlessQuestionText>
    )
    expect(container.innerHTML).toBe('<span>only</span>')
  })

  it('should provide correct inputProps shape', () => {
    let captured: HeadlessQuestionTextRenderProps | undefined
    render(
      <HeadlessQuestionText id="ht" label="Feedback" isRequired showCharacterCount maxLength={100}>
        {(props) => {
          captured = props
          return <div />
        }}
      </HeadlessQuestionText>
    )

    expect(captured?.inputProps.id).toBe('ht')
    expect(captured?.inputProps['aria-label']).toBe('Feedback')
    expect(captured?.inputProps['aria-required']).toBe(true)
    expect(captured?.inputProps['aria-describedby']).toBe('ht-char-count')
    expect(captured?.inputProps.maxLength).toBe(100)
  })

  it('should provide correct characterCountProps shape', () => {
    let captured: HeadlessQuestionTextRenderProps | undefined
    render(
      <HeadlessQuestionText id="ht" label="Feedback" showCharacterCount>
        {(props) => {
          captured = props
          return <div />
        }}
      </HeadlessQuestionText>
    )

    expect(captured?.characterCountProps.id).toBe('ht-char-count')
    expect(captured?.characterCountProps['aria-live']).toBe('polite')
  })
})

describe('HeadlessQuestionSelect', () => {
  const options = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
  ]

  it('should provide expected render props for single mode', () => {
    let captured: HeadlessQuestionSelectRenderProps | undefined
    render(
      <HeadlessQuestionSelect id="hs" label="Pick" options={options}>
        {(props) => {
          captured = props
          return <div />
        }}
      </HeadlessQuestionSelect>
    )

    expect(captured).toBeDefined()
    expect(captured?.value).toBe('')
    expect(captured?.setValue).toBeTypeOf('function')
    expect(captured?.options).toBeDefined()
    expect(captured?.groupProps).toBeDefined()
    expect(captured?.getOptionProps).toBeTypeOf('function')
    expect(captured?.groupProps.role).toBe('radiogroup')
  })

  it('should provide group role for multi mode', () => {
    let captured: HeadlessQuestionSelectRenderProps | undefined
    render(
      <HeadlessQuestionSelect id="hs" label="Pick" options={options} mode="multi">
        {(props) => {
          captured = props
          return <div />
        }}
      </HeadlessQuestionSelect>
    )

    expect(captured?.groupProps.role).toBe('group')
    expect(captured?.getOptionProps('a').role).toBe('checkbox')
  })

  it('should produce zero extra DOM', () => {
    const { container } = render(
      <HeadlessQuestionSelect id="hs" label="Pick" options={options}>
        {() => <span>only</span>}
      </HeadlessQuestionSelect>
    )
    expect(container.innerHTML).toBe('<span>only</span>')
  })

  it('should provide correct getOptionProps shape', () => {
    let captured: HeadlessQuestionSelectRenderProps | undefined
    render(
      <HeadlessQuestionSelect id="hs" label="Pick" options={options}>
        {(props) => {
          captured = props
          return <div />
        }}
      </HeadlessQuestionSelect>
    )

    const optProps = captured?.getOptionProps('a')
    expect(optProps.role).toBe('radio')
    expect(optProps['aria-checked']).toBe(false)
    expect(optProps['aria-label']).toBe('A')
  })
})

describe('HeadlessQuestionBoolean', () => {
  it('should provide expected render props', () => {
    let captured: HeadlessQuestionBooleanRenderProps | undefined
    render(
      <HeadlessQuestionBoolean id="hb" label="Yes or No">
        {(props) => {
          captured = props
          return <div />
        }}
      </HeadlessQuestionBoolean>
    )

    expect(captured).toBeDefined()
    expect(captured?.value).toBeNull()
    expect(captured?.setValue).toBeTypeOf('function')
    expect(captured?.groupProps).toBeDefined()
    expect(captured?.getOptionProps).toBeTypeOf('function')
  })

  it('should produce zero extra DOM', () => {
    const { container } = render(
      <HeadlessQuestionBoolean id="hb" label="Yes or No">
        {() => <span>only</span>}
      </HeadlessQuestionBoolean>
    )
    expect(container.innerHTML).toBe('<span>only</span>')
  })

  it('should provide correct groupProps shape', () => {
    let captured: HeadlessQuestionBooleanRenderProps | undefined
    render(
      <HeadlessQuestionBoolean id="hb" label="Yes or No" isRequired>
        {(props) => {
          captured = props
          return <div />
        }}
      </HeadlessQuestionBoolean>
    )

    expect(captured?.groupProps.role).toBe('radiogroup')
    expect(captured?.groupProps['aria-label']).toBe('Yes or No')
    expect(captured?.groupProps['aria-required']).toBe(true)
  })

  it('should provide correct getOptionProps shape', () => {
    let captured: HeadlessQuestionBooleanRenderProps | undefined
    render(
      <HeadlessQuestionBoolean id="hb" label="Yes or No">
        {(props) => {
          captured = props
          return <div />
        }}
      </HeadlessQuestionBoolean>
    )

    const yesProps = captured?.getOptionProps(true)
    expect(yesProps.role).toBe('radio')
    expect(yesProps['aria-checked']).toBe(false)
    expect(yesProps['aria-label']).toBe('Yes')

    const noProps = captured?.getOptionProps(false)
    expect(noProps['aria-label']).toBe('No')
  })
})

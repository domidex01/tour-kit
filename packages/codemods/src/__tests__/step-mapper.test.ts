import jscodeshift from 'jscodeshift'
import { describe, expect, it } from 'vitest'
import { mapStepObject } from '../lib/step-mapper'
import { todoToComment } from '../lib/todo-emitter'

const j = jscodeshift.withParser('tsx')

function parseObject(src: string): ReturnType<typeof j.expression> {
  const wrapped = `const _ = ${src}`
  const root = j(wrapped)
  const obj = root.find(j.ObjectExpression).at(0).nodes()[0]
  if (!obj) throw new Error(`failed to parse object expression: ${src}`)
  return obj as unknown as ReturnType<typeof j.expression>
}

describe('mapStepObject — supported fields', () => {
  it('maps string target to selector', () => {
    const obj = parseObject(`{ target: '#hero', content: 'Hi' }`)
    const m = mapStepObject(j, obj as never)
    expect(m.target).toBe('#hero')
    expect(m.todos).toEqual([])
    expect(m.unsupportedFields).toEqual([])
  })

  it('maps placement', () => {
    const obj = parseObject(`{ target: '#hero', content: 'Hi', placement: 'top' }`)
    const m = mapStepObject(j, obj as never)
    expect(m.placement).toBe('top')
  })

  it('maps id and data passthrough', () => {
    const obj = parseObject(
      `{ target: '#hero', content: 'Hi', id: 'step-1', data: { foo: 'bar' } }`
    )
    const m = mapStepObject(j, obj as never)
    expect(m.id).toBe('step-1')
    expect(m.todos).toEqual([])
  })

  it('preserves content and title expressions', () => {
    const obj = parseObject(`{ target: '#hero', title: 'Hello', content: 'Body' }`)
    const m = mapStepObject(j, obj as never)
    expect(m.content).toBeDefined()
    expect(m.title).toBeDefined()
  })

  it('emits TODO for auto placement', () => {
    const obj = parseObject(`{ target: '#a', content: 'x', placement: 'auto' }`)
    const m = mapStepObject(j, obj as never)
    expect(m.placement).toBe('top')
    expect(m.todos.some((t) => t.anchor === 'placement')).toBe(true)
  })

  it('emits TODO for center placement', () => {
    const obj = parseObject(`{ target: '#a', content: 'x', placement: 'center' }`)
    const m = mapStepObject(j, obj as never)
    expect(m.placement).toBe('top')
    expect(m.todos.some((t) => t.anchor === 'placement')).toBe(true)
  })
})

describe('mapStepObject — unsupported fields emit TODOs', () => {
  it.each([
    ['styles', '{}', 'styles'],
    ['tooltipComponent', 'CustomTip', 'tooltip-component'],
    ['beaconComponent', 'CustomBeacon', 'beacon-component'],
    ['isFixed', 'true', 'is-fixed'],
    ['scrollTarget', `'#scrollable'`, 'scroll-target'],
    ['portalElement', 'document.body', 'portal-element'],
  ])('emits TODO for %s with anchor %s', (field, value, anchor) => {
    const obj = parseObject(`{ target: '#a', content: 'x', ${field}: ${value} }`)
    const m = mapStepObject(j, obj as never)
    expect(m.unsupportedFields).toContain(field)
    expect(m.todos.some((t) => t.message.includes(`Step.${field}`))).toBe(true)
    expect(m.todos.some((t) => t.anchor === anchor)).toBe(true)
    expect(m.dropped).toContain(field)
  })
})

describe('mapStepObject — target as function emits TODO', () => {
  it('emits TODO with target-function anchor for arrow target', () => {
    const obj = parseObject(`{ target: () => document.body, content: '' }`)
    const m = mapStepObject(j, obj as never)
    expect(m.todos.some((t) => t.anchor === 'target-function')).toBe(true)
  })

  it('emits TODO with target-function anchor for function expression target', () => {
    const obj = parseObject(`{ target: function () { return null }, content: '' }`)
    const m = mapStepObject(j, obj as never)
    expect(m.todos.some((t) => t.anchor === 'target-function')).toBe(true)
  })
})

describe('mapStepObject — dynamic target emits TODO', () => {
  it('emits TODO with target-dynamic anchor for identifier target', () => {
    const obj = parseObject(`{ target: refId, content: 'x' }`)
    const m = mapStepObject(j, obj as never)
    expect(m.todos.some((t) => t.anchor === 'target-dynamic')).toBe(true)
  })
})

describe('mapStepObject — silent no-op fields', () => {
  it.each(['disableBeacon', 'skipBeacon'])('records %s as no-op with beacon anchor', (field) => {
    const obj = parseObject(`{ target: '#a', content: 'x', ${field}: true }`)
    const m = mapStepObject(j, obj as never)
    expect(m.unsupportedFields).not.toContain(field)
    expect(m.dropped).toContain(field)
    expect(m.todos.some((t) => t.anchor === 'beacon')).toBe(true)
  })
})

describe('todoToComment — fixed template', () => {
  it('renders the canonical Tour Kit migration anchor template', () => {
    const c = todoToComment({ message: 'hi', anchor: 'thing' })
    expect(c).toBe('// TODO: hi — see https://tourkit.dev/migration/joyride#thing')
  })
})

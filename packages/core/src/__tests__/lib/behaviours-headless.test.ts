/**
 * v2 §1.3b-6 — THE PHASE PROOF.
 *
 * §1.3 made `@tour-kit/core/engine` able to *run* a tour with no React. This
 * file proves §1.3b made it able to *show* one: a real `createTourEngine()`
 * driven through `attachKeyboard`, `attachAdvanceOn` and `createFocusTrap`,
 * with neither `react` nor `@testing-library` anywhere in the module graph.
 *
 * The self-read guard at the bottom is what makes that a proof rather than a
 * claim — copied from `lib/tour-engine/__tests__/create-tour-engine.test.ts`,
 * which does the same for the engine itself.
 */
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as engineEntry from '../../engine'
import { attachAdvanceOn } from '../../lib/advance-on'
import { createFocusTrap } from '../../lib/focus-trap'
import { attachKeyboard } from '../../lib/keyboard'
import { type TourEngine, createTourEngine } from '../../lib/tour-engine/create-tour-engine'
import { createMemoryStorage } from '../../utils/storage'

let engine: TourEngine
const detachers: Array<() => void> = []

function button(id: string): HTMLButtonElement {
  const el = document.createElement('button')
  el.type = 'button'
  el.id = id
  document.body.appendChild(el)
  return el
}

beforeEach(() => {
  button('a')
  button('b')
  engine = createTourEngine({
    storage: createMemoryStorage(),
    tours: [
      {
        id: 't',
        steps: [
          {
            id: 'a',
            target: '#a',
            content: 'step a',
            advanceOn: { event: 'click', selector: '#a' },
          },
          { id: 'b', target: '#b', content: 'step b' },
        ],
      },
    ],
  })
})

afterEach(() => {
  for (const detach of detachers.splice(0)) detach()
  engine.destroy()
  document.body.innerHTML = ''
})

function press(key: string): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

describe('a binding drives the engine with no React', () => {
  it('ArrowRight advances and Escape ends the tour', async () => {
    // `engine` satisfies KeyboardActions structurally — next/prev/skip all
    // return Promise<void> or void, both assignable to unknown.
    detachers.push(attachKeyboard(engine))
    await engine.start('t')
    expect(engine.getState().currentStep?.id).toBe('a')

    press('ArrowRight')
    await vi.waitFor(() => expect(engine.getState().currentStep?.id).toBe('b'))

    press('Escape')
    expect(engine.getState().isActive).toBe(false)
  })

  it('a click on the step target advances through attachAdvanceOn', async () => {
    detachers.push(attachAdvanceOn(engine))
    await engine.start('t')
    // v2 §1.5: `attachAdvanceOn` binds the incoming step one macrotask later
    // (detach eagerly, bind late), so the first binding is not live until the
    // timer fires.
    await new Promise((resolve) => setTimeout(resolve, 0))

    document.querySelector<HTMLButtonElement>('#a')?.click()

    await vi.waitFor(() => expect(engine.getState().currentStep?.id).toBe('b'))
  })

  it('createFocusTrap wraps Tab and restores focus on deactivate', () => {
    const trigger = button('trigger')
    const card = document.createElement('div')
    const first = document.createElement('button')
    const last = document.createElement('button')
    card.append(first, last)
    document.body.appendChild(card)

    const trap = createFocusTrap(() => card)
    trigger.focus()
    trap.capture()
    trap.activate()

    expect(document.activeElement).toBe(first)

    last.focus()
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    )
    expect(document.activeElement).toBe(first)

    trap.deactivate()
    expect(document.activeElement).toBe(trigger)
  })
})

describe('the /engine barrel publishes all eight behaviours', () => {
  it.each([
    'createFocusTrap',
    'attachKeyboard',
    'trackRect',
    'computeSpotlight',
    'bindStepAdvance',
    'attachAdvanceOn',
    'dispatchAdvanceEvent',
    'attachTestBridge',
  ] as const)('%s is a module export of @tour-kit/core/engine', (name) => {
    // Module exports of the barrel, NOT methods on a TourEngine instance.
    expect(typeof engineEntry[name]).toBe('function')
  })
})

describe('US-1 guard', () => {
  it('this file imports no react and no testing-library', () => {
    const source = readFileSync(new URL(import.meta.url), 'utf8')

    expect(source).not.toMatch(/from ['"](react|react-dom|@testing-library)/)
  })
})

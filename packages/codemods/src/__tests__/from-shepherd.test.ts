import { describe, expect, it } from 'vitest'
import transform from '../transforms/from-shepherd'
import { runTransform } from './_helpers'

describe('from-shepherd — basic shapes', () => {
  it('rewrites import "shepherd.js" to "@tour-kit/react"', () => {
    const out = runTransform(
      transform,
      `import Shepherd from 'shepherd.js'\nconst tour = new Shepherd.Tour({})\ntour.start()\n`
    )
    expect(out).toContain(`from '@tour-kit/react'`)
    expect(out).not.toContain(`'shepherd.js'`)
  })

  it('reconstitutes addStep chain into a steps array', () => {
    const src = `
import Shepherd from 'shepherd.js'
const tour = new Shepherd.Tour({})
tour.addStep({ id: 'a', attachTo: { element: '#hero', on: 'top' }, text: 'A' })
tour.addStep({ id: 'b', attachTo: { element: '#cta', on: 'bottom' }, text: 'B' })
tour.start()
`
    const out = runTransform(transform, src)
    expect(out).toMatch(/steps\s*:\s*\[/)
    expect(out).toMatch(/id:\s*['"]a['"]/)
    expect(out).toMatch(/id:\s*['"]b['"]/)
  })

  it('maps attachTo.element string + on to target + placement', () => {
    const out = runTransform(
      transform,
      `
import Shepherd from 'shepherd.js'
const t = new Shepherd.Tour({})
t.addStep({ attachTo: { element: '#hero', on: 'top' }, text: 'X' })
t.start()
`
    )
    expect(out).toMatch(/target:\s*['"]#hero['"]/)
    expect(out).toMatch(/placement:\s*['"]top['"]/)
  })

  it('emits TODO for attachTo.element as function', () => {
    const out = runTransform(
      transform,
      `
import Shepherd from 'shepherd.js'
const t = new Shepherd.Tour({})
t.addStep({ attachTo: { element: () => document.body, on: 'top' }, text: 'X' })
t.start()
`
    )
    expect(out).toMatch(/\/\/ TODO:.*attachTo.*element.*function/i)
    expect(out).toMatch(/https:\/\/tourkit\.dev\/migration\/shepherd#/)
  })

  it('emits TODO for buttons array (no Tour Kit equivalent of free-form buttons)', () => {
    const out = runTransform(
      transform,
      `
import Shepherd from 'shepherd.js'
const t = new Shepherd.Tour({})
t.addStep({
  attachTo: { element: '#hero', on: 'top' },
  text: 'X',
  buttons: [{ text: 'Next', action: () => t.next() }],
})
t.start()
`
    )
    expect(out).toMatch(/\/\/ TODO:.*buttons/i)
    expect(out).toMatch(/https:\/\/tourkit\.dev\/migration\/shepherd#buttons/)
  })

  it('supports the named { Tour } import as well as the default Shepherd import', () => {
    const out = runTransform(
      transform,
      `
import { Tour } from 'shepherd.js'
const t = new Tour({})
t.addStep({ attachTo: { element: '#x', on: 'right' }, text: 'X' })
t.start()
`
    )
    expect(out).toContain(`from '@tour-kit/react'`)
    expect(out).toMatch(/target:\s*['"]#x['"]/)
    expect(out).toMatch(/placement:\s*['"]right['"]/)
  })

  // Regression: pre-fix, the control-call rewriter matched on method name
  // alone and would clobber `.start()`/`.next()`/`.back()` on any identifier
  // in a file that happened to import 'shepherd.js'.
  it('does NOT rewrite control-method calls on unrelated bindings', () => {
    const out = runTransform(
      transform,
      `
import Shepherd from 'shepherd.js'
const tour = new Shepherd.Tour({})
tour.addStep({ attachTo: { element: '#a', on: 'top' }, text: 'A' })
tour.start()
const carousel = makeCarousel()
carousel.next()
carousel.back()
animation.start()
`
    )
    expect(out).toContain('carousel.next()')
    expect(out).toContain('carousel.back()')
    expect(out).toContain('animation.start()')
  })
})

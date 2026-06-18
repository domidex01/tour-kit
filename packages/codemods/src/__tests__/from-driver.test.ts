import { describe, expect, it } from 'vitest'
import transform from '../transforms/from-driver'
import { runTransform } from './_helpers'

describe('from-driver — basic shapes', () => {
  it('rewrites import "driver.js" to "@tour-kit/react"', () => {
    const out = runTransform(
      transform,
      `import { driver } from 'driver.js'\ndriver({ steps: [] }).drive()\n`
    )
    expect(out).toContain(`from '@tour-kit/react'`)
    expect(out).not.toContain(`'driver.js'`)
  })

  it('maps popover.title/description/side to title/content/placement', () => {
    const out = runTransform(
      transform,
      `
import { driver } from 'driver.js'
const d = driver({ steps: [{ element: '#hero', popover: { title: 'Hi', description: 'There', side: 'top' } }] })
d.drive()
`
    )
    expect(out).toMatch(/title:\s*['"]Hi['"]/)
    expect(out).toMatch(/content:\s*['"]There['"]/)
    expect(out).toMatch(/placement:\s*['"]top['"]/)
  })

  it('maps Step.element selector to target', () => {
    const out = runTransform(
      transform,
      `
import { driver } from 'driver.js'
driver({ steps: [{ element: '#hero', popover: { description: 'X' } }] }).drive()
`
    )
    expect(out).toMatch(/target:\s*['"]#hero['"]/)
  })

  it('emits TODO when element is a DOM Element instance (not a selector)', () => {
    const out = runTransform(
      transform,
      `
import { driver } from 'driver.js'
const el = document.getElementById('hero')!
driver({ steps: [{ element: el, popover: { description: 'X' } }] }).drive()
`
    )
    expect(out).toMatch(/\/\/ TODO:.*element.*Element/i)
    expect(out).toMatch(/https:\/\/usertourkit\.com\/migration\/driver#/)
  })

  it('emits a TODO for tour-level showProgress and forwards step-level content', () => {
    const out = runTransform(
      transform,
      `
import { driver } from 'driver.js'
driver({
  showProgress: true,
  steps: [{ element: '#a', popover: { description: 'X' } }],
}).drive()
`
    )
    expect(out).toMatch(/\/\/ TODO:.*showProgress/i)
    expect(out).toMatch(/content:\s*['"]X['"]/)
  })

  it('replaces .drive() with an EmptyStatement + leading TODO so tsc stays clean', () => {
    const out = runTransform(
      transform,
      `
import { driver } from 'driver.js'
const d = driver({ steps: [] })
d.drive()
`
    )
    expect(out).toMatch(/\/\/ TODO:.*driver\.js\s+\.drive\(\)/i)
    expect(out).not.toMatch(/d\.drive\(\)/)
  })

  // Regression: pre-fix, when no driver(...) call was bound to a variable
  // (`driverVarNames.size === 0`), the size guard fell open and ALL matching
  // method names got rewritten regardless of receiver.
  it('does NOT rewrite control-method calls on unrelated bindings when no driver binding was captured', () => {
    const out = runTransform(
      transform,
      `
import { driver } from 'driver.js'
driver({ steps: [] })
foo.destroy()
bar.drive()
`
    )
    expect(out).toContain('foo.destroy()')
    expect(out).toContain('bar.drive()')
  })
})

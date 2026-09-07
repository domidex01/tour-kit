/**
 * Issue #121 — the meta-guard: a declared step hook cannot go unwired.
 *
 * `BaseTourStep` declared seven lifecycle fields and the engine read two of
 * them. They were typed, documented on ten docs pages and twelve compare
 * pages, and dead — for long enough that a user filed a bug. That is a shape
 * of failure no behaviour test catches, because there is no behaviour to test:
 * the code that would have been wrong was never written.
 *
 * So this reads the source. Every lifecycle key on the interface must appear
 * as a `.key` property access somewhere in the non-test engine, and the
 * extractor self-checks first: a regex that silently stops matching would turn
 * the guard into a no-op that passes forever — the exact failure mode that let
 * #121 exist.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = resolve(__dirname, '..', '..', '..')
const ENGINE_DIR = resolve(SRC, 'lib', 'tour-engine')

/**
 * The seven lifecycle fields. `onNext`, `onPrev` and `onAction` match the same
 * regex but are branch targets, not lifecycle hooks; `waitTimeout` is a number
 * read alongside `waitForTarget` and does not match at all.
 */
const LIFECYCLE_KEYS = [
  'onBeforeHide',
  'onBeforeShow',
  'onEnter',
  'onHide',
  'onShow',
  'waitForTarget',
  'when',
] as const

const BRANCH_KEYS = new Set(['onNext', 'onPrev', 'onAction'])

function declaredLifecycleKeys(): string[] {
  const source = readFileSync(resolve(SRC, 'types', 'step.ts'), 'utf8')
  const start = source.indexOf('interface BaseTourStep')
  expect(start, 'BaseTourStep interface not found in types/step.ts').toBeGreaterThan(-1)
  const end = source.indexOf('\n}', start)
  const body = source.slice(start, end)

  const keys = new Set<string>()
  for (const match of body.matchAll(/^\s+(on[A-Z]\w+|when|waitForTarget)\??:/gm)) {
    const key = match[1]
    if (key && !BRANCH_KEYS.has(key)) keys.add(key)
  }
  return [...keys].sort()
}

/** Every non-test `.ts` under `lib/tour-engine/`, recursively. */
function engineSources(dir = ENGINE_DIR): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '__tests__') continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...engineSources(path))
    else if (entry.name.endsWith('.ts')) out.push(path)
  }
  return out
}

describe('every declared step hook has a call site (#121)', () => {
  it('self-check: the extractor finds exactly the seven lifecycle keys', () => {
    // Without this, a renamed interface or a changed field style would make
    // the guard below iterate an empty list and pass on anything.
    expect(declaredLifecycleKeys()).toEqual([...LIFECYCLE_KEYS])
  })

  it.each(LIFECYCLE_KEYS)('`%s` is read somewhere in lib/tour-engine/', (key) => {
    const wired = engineSources().filter((file) => readFileSync(file, 'utf8').includes(`.${key}`))

    expect(wired, `no non-test file under lib/tour-engine/ reads \`.${key}\``).not.toHaveLength(0)
  })
})

#!/usr/bin/env node
// One-off dev script: run the transform over every fixture and write output
// to stdout (or to .expected.tsx if --write is passed). Imports the built
// dist artifact so we don't need ts loader hooks.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import jscodeshift from 'jscodeshift'

const here = dirname(fileURLToPath(import.meta.url))
const { fromJoyride } = await import(resolve(here, '..', 'dist', 'index.js'))
const fixtures = resolve(here, '..', '__tests__', 'fixtures', 'joyride')

const write = process.argv.includes('--write')
const j = jscodeshift.withParser('tsx')
const api = { jscodeshift: j, j, stats: () => {}, report: () => {} }

const inputs = readdirSync(fixtures).filter((f) => f.endsWith('.input.tsx')).sort()
for (const input of inputs) {
  const name = input.replace('.input.tsx', '')
  const source = readFileSync(join(fixtures, input), 'utf8')
  const out = fromJoyride({ source, path: input }, api, {})
  if (write) {
    const expectedPath = join(fixtures, `${name}.expected.tsx`)
    writeFileSync(expectedPath, out, 'utf8')
    console.log(`wrote ${expectedPath}`)
  } else {
    console.log(`==== ${name} ====`)
    console.log(out)
    console.log()
  }
}
